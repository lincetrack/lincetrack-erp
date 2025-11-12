'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import {
  Users,
  Car,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'

interface DashboardMetrics {
  revenue_current_month: number
  pending_revenue: number
  overdue_revenue: number
  expenses_current_month: number
  pending_expenses: number
  active_clients: number
  inactive_clients: number
  mrr: number
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Buscar métricas do dashboard
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('v_financial_dashboard')
        .select('*')
        .single()

      if (dashboardError) throw dashboardError
      setMetrics(dashboardData)

      // Buscar faturas recentes
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (
            nome_razao_social,
            cpf_cnpj
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (invoicesError) throw invoicesError
      setRecentInvoices(invoicesData || [])
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const netProfit = (metrics?.revenue_current_month || 0) - (metrics?.expenses_current_month || 0)
  const overduePercentage = metrics?.pending_revenue
    ? ((metrics.overdue_revenue / metrics.pending_revenue) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema</p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MRR */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MRR</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.mrr || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Receita Recorrente Mensal
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Clientes Ativos */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.active_clients || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics?.inactive_clients || 0} inativos
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Receitas Pendentes */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receitas Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.pending_revenue || 0)}
              </p>
              <p className="text-xs text-red-500 mt-1">
                {formatCurrency(metrics?.overdue_revenue || 0)} em atraso
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        {/* Lucro Líquido */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lucro Líquido (Mês)</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Receita - Despesas
              </p>
            </div>
            <div className={`p-3 rounded-lg ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {netProfit >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos e informações adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo Financeiro */}
        <Card title="Resumo Financeiro do Mês">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Receitas do Mês</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(metrics?.revenue_current_month || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Despesas do Mês</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(metrics?.expenses_current_month || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Despesas Pendentes</span>
              <span className="font-semibold text-yellow-600">
                {formatCurrency(metrics?.pending_expenses || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 pt-4">
              <span className="text-gray-900 font-medium">Saldo</span>
              <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </Card>

        {/* Alertas */}
        <Card title="Alertas e Pendências">
          <div className="space-y-3">
            {metrics?.overdue_revenue && metrics.overdue_revenue > 0 ? (
              <div className="flex items-start p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Faturas Vencidas
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {formatCurrency(metrics.overdue_revenue)} em faturas vencidas ({overduePercentage}% do total pendente)
                  </p>
                </div>
              </div>
            ) : null}

            {metrics?.pending_expenses && metrics.pending_expenses > 0 ? (
              <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Despesas Pendentes
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {formatCurrency(metrics.pending_expenses)} em despesas a pagar
                  </p>
                </div>
              </div>
            ) : null}

            {(!metrics?.overdue_revenue || metrics.overdue_revenue === 0) &&
             (!metrics?.pending_expenses || metrics.pending_expenses === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum alerta no momento</p>
                <p className="text-xs mt-1">Tudo está em ordem!</p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Faturas Recentes */}
      <Card title="Faturas Recentes">
        {recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Emissão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {invoice.clients?.nome_razao_social || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(invoice.issue_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status === 'paid'
                          ? 'Pago'
                          : invoice.status === 'overdue'
                          ? 'Vencido'
                          : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            Nenhuma fatura encontrada
          </p>
        )}
      </Card>
    </div>
  )
}
