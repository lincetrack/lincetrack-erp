// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  due_date: string
  paid_date: string | null
  status: 'pending' | 'paid' | 'overdue'
  notes: string | null
  created_at: string
}

export default function DespesasPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    due_date: '',
    notes: '',
  })

  useEffect(() => {
    fetchExpenses()
  }, [filterStatus])

  const fetchExpenses = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('expenses')
        .select('*')
        .order('due_date', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Erro ao buscar despesas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const search = searchTerm.toLowerCase()
    return (
      expense.description.toLowerCase().includes(search) ||
      expense.category.toLowerCase().includes(search)
    )
  })

  const handleSaveExpense = async () => {
    try {
      const expenseData = {
        description: expenseForm.description,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        due_date: expenseForm.due_date,
        notes: expenseForm.notes || null,
        status: 'pending' as const,
      }

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('expenses').insert(expenseData)

        if (error) throw error
      }

      setShowExpenseModal(false)
      setEditingExpense(null)
      setExpenseForm({
        description: '',
        category: '',
        amount: '',
        due_date: '',
        notes: '',
      })
      fetchExpenses()
    } catch (error: any) {
      console.error('Erro ao salvar despesa:', error)
      alert(error.message || 'Erro ao salvar despesa')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      due_date: expense.due_date,
      notes: expense.notes || '',
    })
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) throw error
      fetchExpenses()
    } catch (error) {
      console.error('Erro ao excluir despesa:', error)
      alert('Erro ao excluir despesa')
    }
  }

  const handleMarkAsPaid = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', expense.id)

      if (error) throw error
      fetchExpenses()
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      alert('Erro ao marcar como pago')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'success' | 'warning' | 'danger', label: string }> = {
      paid: { variant: 'success', label: 'Pago' },
      pending: { variant: 'warning', label: 'Pendente' },
      overdue: { variant: 'danger', label: 'Vencido' },
    }
    const statusInfo = variants[status] || { variant: 'warning', label: status }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const totalPending = filteredExpenses
    .filter((exp) => exp.status === 'pending')
    .reduce((sum, exp) => sum + exp.amount, 0)

  const totalOverdue = filteredExpenses
    .filter((exp) => exp.status === 'overdue')
    .reduce((sum, exp) => sum + exp.amount, 0)

  const totalPaid = filteredExpenses
    .filter((exp) => exp.status === 'paid')
    .reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600">Gerenciar despesas e pagamentos</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingExpense(null)
            setExpenseForm({
              description: '',
              category: '',
              amount: '',
              due_date: new Date().toISOString().split('T')[0],
              notes: '',
            })
            setShowExpenseModal(true)
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Despesa
        </Button>
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
              <DollarSign className="h-6 w-6 text-yellow-600" />
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
              <p className="text-sm text-gray-600">Pagas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
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
                  placeholder="Buscar por descrição ou categoria..."
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

          {/* Tabela de despesas */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">Carregando despesas...</p>
            </div>
          ) : filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoria
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
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {expense.description}
                          </p>
                          {expense.notes && (
                            <p className="text-xs text-gray-500">{expense.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(expense.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(expense.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {expense.status !== 'paid' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleMarkAsPaid(expense)}
                            >
                              Pagar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma despesa encontrada</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Despesa */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false)
          setEditingExpense(null)
        }}
        title={editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
      >
        <div className="space-y-4">
          <Input
            label="Descrição"
            value={expenseForm.description}
            onChange={(e) =>
              setExpenseForm({ ...expenseForm, description: e.target.value })
            }
            placeholder="Ex: Conta de luz, Salário, Aluguel..."
            required
          />

          <Input
            label="Categoria"
            value={expenseForm.category}
            onChange={(e) =>
              setExpenseForm({ ...expenseForm, category: e.target.value })
            }
            placeholder="Ex: Operacional, Administrativa, Pessoal..."
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor"
              type="number"
              step="0.01"
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, amount: e.target.value })
              }
              placeholder="0,00"
              required
            />

            <Input
              label="Data de Vencimento"
              type="date"
              value={expenseForm.due_date}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, due_date: e.target.value })
              }
              required
            />
          </div>

          <Input
            label="Observações"
            value={expenseForm.notes}
            onChange={(e) =>
              setExpenseForm({ ...expenseForm, notes: e.target.value })
            }
            placeholder="Informações adicionais..."
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowExpenseModal(false)
                setEditingExpense(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveExpense}
              className="flex-1"
            >
              {editingExpense ? 'Salvar Alterações' : 'Adicionar Despesa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
