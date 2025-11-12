export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TipoPessoa = 'Física' | 'Jurídica'
export type StatusCliente = 'Ativo' | 'Inativo' | 'Cancelado'
export type FormaPagamento = 'Boleto' | 'Pix' | 'Cartão' | 'Transferência'
export type SituacaoAssinatura = 'Ativa' | 'Pausada' | 'Cancelada'
export type MetodoCobranca = 'Manual' | 'Automática'
export type BillingCycle = 'monthly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type PaymentStatus = 'succeeded' | 'failed' | 'pending'
export type ExpenseStatus = 'pending' | 'paid' | 'overdue'
export type UserRole = 'admin' | 'finance' | 'operational' | 'commercial'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          tipo_pessoa: TipoPessoa
          nome_razao_social: string
          nome_fantasia: string | null
          cpf_cnpj: string
          rg_inscricao_estadual: string | null
          data_nascimento_abertura: string | null
          email: string
          telefone_principal: string
          telefone_secundario: string | null
          status: StatusCliente
          cep: string
          logradouro: string
          numero: string
          complemento: string | null
          bairro: string
          cidade: string
          uf: string
          valor_mensalidade: number
          dia_cobranca: number
          forma_pagamento_preferida: FormaPagamento
          banco_agencia_conta: string | null
          notificar_por_email: boolean
          notificar_por_sms: boolean
          observacoes_financeiras: string | null
          data_inicio_contrato: string
          proxima_cobranca: string | null
          situacao_assinatura: SituacaoAssinatura
          metodo_cobranca: MetodoCobranca
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tipo_pessoa: TipoPessoa
          nome_razao_social: string
          nome_fantasia?: string | null
          cpf_cnpj: string
          rg_inscricao_estadual?: string | null
          data_nascimento_abertura?: string | null
          email: string
          telefone_principal: string
          telefone_secundario?: string | null
          status?: StatusCliente
          cep: string
          logradouro: string
          numero: string
          complemento?: string | null
          bairro: string
          cidade: string
          uf: string
          valor_mensalidade: number
          dia_cobranca: number
          forma_pagamento_preferida?: FormaPagamento
          banco_agencia_conta?: string | null
          notificar_por_email?: boolean
          notificar_por_sms?: boolean
          observacoes_financeiras?: string | null
          data_inicio_contrato?: string
          proxima_cobranca?: string | null
          situacao_assinatura?: SituacaoAssinatura
          metodo_cobranca?: MetodoCobranca
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tipo_pessoa?: TipoPessoa
          nome_razao_social?: string
          nome_fantasia?: string | null
          cpf_cnpj?: string
          rg_inscricao_estadual?: string | null
          data_nascimento_abertura?: string | null
          email?: string
          telefone_principal?: string
          telefone_secundario?: string | null
          status?: StatusCliente
          cep?: string
          logradouro?: string
          numero?: string
          complemento?: string | null
          bairro?: string
          cidade?: string
          uf?: string
          valor_mensalidade?: number
          dia_cobranca?: number
          forma_pagamento_preferida?: FormaPagamento
          banco_agencia_conta?: string | null
          notificar_por_email?: boolean
          notificar_por_sms?: boolean
          observacoes_financeiras?: string | null
          data_inicio_contrato?: string
          proxima_cobranca?: string | null
          situacao_assinatura?: SituacaoAssinatura
          metodo_cobranca?: MetodoCobranca
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      vehicles: {
        Row: {
          id: string
          client_id: string
          placa: string
          modelo: string
          marca: string | null
          ano: number | null
          imei_rastreador: string
          chip_numero: string
          operadora_chip: string | null
          ativo: boolean
          observacoes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          placa: string
          modelo: string
          marca?: string | null
          ano?: number | null
          imei_rastreador: string
          chip_numero: string
          operadora_chip?: string | null
          ativo?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          placa?: string
          modelo?: string
          marca?: string | null
          ano?: number | null
          imei_rastreador?: string
          chip_numero?: string
          operadora_chip?: string | null
          ativo?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          client_id: string
          start_date: string
          next_billing_date: string
          billing_cycle: BillingCycle
          status: SubscriptionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          start_date: string
          next_billing_date: string
          billing_cycle?: BillingCycle
          status?: SubscriptionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          start_date?: string
          next_billing_date?: string
          billing_cycle?: BillingCycle
          status?: SubscriptionStatus
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          client_id: string
          subscription_id: string | null
          issue_date: string
          due_date: string
          amount: number
          status: InvoiceStatus
          metadata: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          subscription_id?: string | null
          issue_date?: string
          due_date: string
          amount: number
          status?: InvoiceStatus
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          subscription_id?: string | null
          issue_date?: string
          due_date?: string
          amount?: number
          status?: InvoiceStatus
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          paid_at: string
          amount: number
          provider: string | null
          provider_payment_id: string | null
          status: PaymentStatus
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          paid_at: string
          amount: number
          provider?: string | null
          provider_payment_id?: string | null
          status?: PaymentStatus
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          paid_at?: string
          amount?: number
          provider?: string | null
          provider_payment_id?: string | null
          status?: PaymentStatus
          created_at?: string
          created_by?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          title: string
          category: string
          amount: number
          due_date: string
          paid_date: string | null
          status: ExpenseStatus
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          category: string
          amount: number
          due_date: string
          paid_date?: string | null
          status?: ExpenseStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          category?: string
          amount?: number
          due_date?: string
          paid_date?: string | null
          status?: ExpenseStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: number
          actor_id: string | null
          event: string
          table_name: string
          record_id: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          actor_id?: string | null
          event: string
          table_name: string
          record_id: string
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          actor_id?: string | null
          event?: string
          table_name?: string
          record_id?: string
          payload?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      v_clients_active: {
        Row: {
          id: string
          nome_razao_social: string
          cpf_cnpj: string
          email: string
          total_vehicles: number
          pending_invoices: number
          overdue_invoices: number
          total_debt: number
        }
      }
      v_financial_dashboard: {
        Row: {
          revenue_current_month: number
          pending_revenue: number
          overdue_revenue: number
          expenses_current_month: number
          pending_expenses: number
          active_clients: number
          inactive_clients: number
          mrr: number
        }
      }
    }
    Functions: {
      calculate_next_billing_date: {
        Args: {
          start_date: string
          billing_day: number
        }
        Returns: string
      }
      update_overdue_invoices: {
        Args: Record<string, never>
        Returns: void
      }
    }
  }
}
