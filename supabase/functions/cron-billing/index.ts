// Supabase Edge Function para Cobrança Recorrente Automática
// Deploy: supabase functions deploy cron-billing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service_role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const today = new Date().toISOString().split('T')[0]

    // 1. Buscar todas as assinaturas ativas que precisam ser cobradas hoje
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('subscriptions')
      .select(`
        *,
        clients:client_id (
          id,
          nome_razao_social,
          valor_mensalidade,
          dia_cobranca,
          metodo_cobranca,
          situacao_assinatura
        )
      `)
      .eq('status', 'active')
      .lte('next_billing_date', today)

    if (subsError) {
      throw subsError
    }

    let processedCount = 0
    let createdInvoices = 0
    const errors: any[] = []

    // 2. Processar cada assinatura
    for (const subscription of subscriptions || []) {
      try {
        const client = subscription.clients

        // Verificar se o cliente está ativo e com assinatura ativa
        if (client.situacao_assinatura !== 'Ativa') {
          console.log(`Cliente ${client.id} com assinatura inativa, pulando...`)
          continue
        }

        // 3. Criar fatura
        const issueDate = new Date()
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7) // Vencimento em 7 dias

        const { data: invoice, error: invoiceError } = await supabaseClient
          .from('invoices')
          .insert({
            client_id: client.id,
            subscription_id: subscription.id,
            issue_date: issueDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            amount: client.valor_mensalidade,
            status: 'pending',
            metadata: {
              billing_cycle: subscription.billing_cycle,
              auto_generated: true,
              generated_at: new Date().toISOString(),
            },
          })
          .select()
          .single()

        if (invoiceError) {
          throw invoiceError
        }

        createdInvoices++

        // 4. Calcular próxima data de cobrança
        const nextBillingDate = new Date(subscription.next_billing_date)
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

        // Ajustar para o dia de cobrança do cliente
        const targetDay = Math.min(client.dia_cobranca, 28)
        nextBillingDate.setDate(targetDay)

        // 5. Atualizar próxima data de cobrança na assinatura
        const { error: updateSubError } = await supabaseClient
          .from('subscriptions')
          .update({
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
          })
          .eq('id', subscription.id)

        if (updateSubError) {
          throw updateSubError
        }

        // 6. Atualizar próxima cobrança no cliente
        const { error: updateClientError } = await supabaseClient
          .from('clients')
          .update({
            proxima_cobranca: nextBillingDate.toISOString().split('T')[0],
          })
          .eq('id', client.id)

        if (updateClientError) {
          throw updateClientError
        }

        processedCount++

        // NOTA: Cobrança automática via gateway de pagamento seria implementada aqui
        // if (client.metodo_cobranca === 'Automática') {
        //   // Integrar com Stripe, Gerencianet, etc.
        // }

      } catch (error) {
        console.error(`Erro ao processar assinatura ${subscription.id}:`, error)
        errors.push({
          subscription_id: subscription.id,
          error: error.message,
        })
      }
    }

    // 7. Atualizar faturas vencidas
    const { error: overdueError } = await supabaseClient.rpc('update_overdue_invoices')

    if (overdueError) {
      console.error('Erro ao atualizar faturas vencidas:', overdueError)
    }

    // 8. Retornar resumo da execução
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processamento de cobranças concluído',
        data: {
          total_subscriptions: subscriptions?.length || 0,
          processed: processedCount,
          invoices_created: createdInvoices,
          errors: errors.length,
          error_details: errors,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
