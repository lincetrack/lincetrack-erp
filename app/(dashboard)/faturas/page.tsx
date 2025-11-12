'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Search, FileText, DollarSign, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate, formatCPFCNPJ } from '@/lib/utils'

interface Invoice {
  id: string
  issue_date: string
  due_date: string
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  clients: {
    nome_razao_social: string
    cpf_cnpj: string
  }
  created_at: string
}

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [filterStatus])

  const fetchInvoices = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (
            nome_razao_social,
            cpf_cnpj
          )
        `)
        .order('due_date', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Erro ao buscar faturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const search = searchTerm.toLowerCase()
    return (
      invoice.clients?.nome_razao_social?.toLowerCase().includes(search) ||
      invoice.clients?.cpf_cnpj?.includes(search)
    )
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default', label: string }> = {
      paid: { variant: 'success', label: 'Pago' },
      pending: { variant: 'warning', label: 'Pendente' },
      overdue: { variant: 'danger', label: 'Vencido' },
      cancelled: { variant: 'default', label: 'Cancelado' },
    }
    const statusInfo = variants[status] || { variant: 'default', label: status }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const handleMarkAsPaid = async () => {
    if (!selectedInvoice) return

    try {
      const amount = paymentAmount ? parseFloat(paymentAmount) : selectedInvoice.amount
      const paidAt = paymentDate || new Date().toISOString().split('T')[0]

      // Atualizar status da fatura
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', selectedInvoice.id)

      if (invoiceError) throw invoiceError

      // Criar registro de pagamento
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: selectedInvoice.id,
          paid_at: paidAt,
          amount: amount,
          status: 'succeeded',
        })

      if (paymentError) throw paymentError

      setShowPaymentModal(false)
      setSelectedInvoice(null)
      setPaymentDate('')
      setPaymentAmount('')
      fetchInvoices()
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      alert('Erro ao registrar pagamento')
    }
  }

  const totalPending = filteredInvoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const totalOverdue = filteredInvoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const totalPaid = filteredInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faturas</h1>
        <p className="text-gray-600">Gerenciar faturas e recebimentos</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totalPending)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalOverdue)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recebidas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todas
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Pendentes
              </Button>
              <Button
                variant={filterStatus === 'overdue' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('overdue')}
              >
                Vencidas
              </Button>
              <Button
                variant={filterStatus === 'paid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('paid')}
              >
                Pagas
              </Button>
            </div>
          </div>

          {/* Tabela de faturas */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">Carregando faturas...</p>
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Emissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.clients?.nome_razao_social}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCPFCNPJ(invoice.clients?.cpf_cnpj)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setPaymentAmount(invoice.amount.toString())
                              setPaymentDate(new Date().toISOString().split('T')[0])
                              setShowPaymentModal(true)
                            }}
                          >
                            Baixar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma fatura encontrada</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Pagamento */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedInvoice(null)
        }}
        title="Registrar Pagamento"
        description={`Fatura de ${selectedInvoice?.clients?.nome_razao_social}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Original
            </label>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(selectedInvoice?.amount || 0)}
            </p>
          </div>

          <Input
            label="Data do Pagamento"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          <Input
            label="Valor Pago"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleMarkAsPaid}
              className="flex-1"
            >
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
