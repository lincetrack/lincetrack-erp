import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import { Despesa } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { despesaService } from '@/services/despesaService'

export default function DespesasPage() {
  // Helper para obter o mês atual no formato YYYY-MM
  const getCurrentMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar do Supabase
  const [despesas, setDespesas] = useState<Despesa[]>([])

  useEffect(() => {
    loadDespesas()
  }, [])

  const loadDespesas = async () => {
    try {
      setLoading(true)
      const data = await despesaService.getAll()
      setDespesas(data)
    } catch (error) {
      console.error('Erro ao carregar despesas:', error)
      showNotification('Erro ao carregar despesas')
    } finally {
      setLoading(false)
    }
  }

  const [newDespesa, setNewDespesa] = useState<Partial<Despesa>>({
    descricao: '',
    categoria: 'Infraestrutura',
    valor: 0,
    data_vencimento: '',
    status: 'pendente',
    fornecedor: ''
  })

  const categorias = [
    'Infraestrutura',
    'Telecomunicações',
    'Equipamentos',
    'Manutenção',
    'Marketing',
    'Pessoal',
    'Impostos',
    'Escritório',
    'Combustível',
    'Instalações de Rastreador',
    'Outros'
  ]

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  const handleAddDespesa = async () => {
    if (!newDespesa.descricao || !newDespesa.data_vencimento || newDespesa.valor === 0) {
      showNotification('Preencha todos os campos obrigatórios!')
      return
    }

    try {
      await despesaService.create({
        descricao: newDespesa.descricao!,
        categoria: newDespesa.categoria!,
        valor: newDespesa.valor!,
        data_vencimento: newDespesa.data_vencimento!,
        status: 'pendente',
        fornecedor: newDespesa.fornecedor,
        observacoes: newDespesa.observacoes
      })

      await loadDespesas()
      setShowAddModal(false)
      setNewDespesa({
        descricao: '',
        categoria: 'Infraestrutura',
        valor: 0,
        data_vencimento: '',
        status: 'pendente',
        fornecedor: ''
      })
      showNotification('Despesa adicionada com sucesso!')
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error)
      showNotification('Erro ao adicionar despesa')
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      await despesaService.toggleStatus(id)
      await loadDespesas()
      showNotification('Status atualizado!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      showNotification('Erro ao atualizar status')
    }
  }

  const handleEditDespesa = (despesa: Despesa) => {
    setEditingDespesa(despesa)
    setShowEditModal(true)
  }

  const handleUpdateDespesa = async () => {
    if (!editingDespesa) return

    try {
      await despesaService.update(editingDespesa.id, editingDespesa)
      await loadDespesas()
      setShowEditModal(false)
      setEditingDespesa(null)
      showNotification('Despesa atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error)
      showNotification('Erro ao atualizar despesa')
    }
  }

  const deleteDespesa = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await despesaService.delete(id)
        await loadDespesas()
        showNotification('Despesa excluída com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir despesa:', error)
        showNotification('Erro ao excluir despesa')
      }
    }
  }

  const handlePrintList = () => {
    window.print()
  }

  const filteredDespesas = despesas.filter(d => d.data_vencimento.startsWith(selectedMonth))

  const totalPendente = filteredDespesas
    .filter(d => d.status === 'pendente')
    .reduce((acc, d) => acc + d.valor, 0)

  const totalPago = filteredDespesas
    .filter(d => d.status === 'pago')
    .reduce((acc, d) => acc + d.valor, 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Notificação */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            ✓ {notification}
          </div>
        )}

        {/* Cabeçalho para impressão */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Despesas</h1>
          <p className="text-sm text-gray-600">
            Período: {selectedMonth.split('-')[1]}/{selectedMonth.split('-')[0]}
          </p>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">Gestão de Despesas</h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button
              onClick={handlePrintList}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
            >
              ➕ Nova Despesa
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
            <h3 className="text-xs md:text-lg font-semibold text-gray-700 mb-1 md:mb-2">Total do Mês</h3>
            <p className="text-base md:text-3xl font-bold text-primary-600">{formatCurrency(totalPendente + totalPago)}</p>
            <p className="text-xs text-gray-600 mt-1">{filteredDespesas.length} despesa(s)</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
            <h3 className="text-xs md:text-lg font-semibold text-gray-700 mb-1 md:mb-2">Pendente</h3>
            <p className="text-base md:text-3xl font-bold text-red-600">{formatCurrency(totalPendente)}</p>
            <p className="text-xs text-gray-600 mt-1">{filteredDespesas.filter(d => d.status === 'pendente').length} a pagar</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
            <h3 className="text-xs md:text-lg font-semibold text-gray-700 mb-1 md:mb-2">Pagas</h3>
            <p className="text-base md:text-3xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
            <p className="text-xs text-gray-600 mt-1">{filteredDespesas.filter(d => d.status === 'pago').length} quitadas</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
            <h3 className="text-xs md:text-lg font-semibold text-gray-700 mb-1 md:mb-2">% Quitado</h3>
            <p className="text-base md:text-3xl font-bold text-orange-600">
              {totalPendente + totalPago > 0
                ? `${Math.round((totalPago / (totalPendente + totalPago)) * 100)}%`
                : '0%'}
            </p>
            <p className="text-xs text-gray-600 mt-1">do total já quitado</p>
          </div>
        </div>

        {/* Tabela de Despesas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDespesas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma despesa encontrada para este período.
                    </td>
                  </tr>
                ) : (
                  filteredDespesas.map((despesa) => (
                    <tr key={despesa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(despesa.data_vencimento)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {despesa.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {despesa.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {despesa.fornecedor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        {formatCurrency(despesa.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleStatus(despesa.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-colors ${
                            despesa.status === 'pago'
                              ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100'
                              : 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          {despesa.status === 'pago' ? '✓ PAGO' : '⏱ PENDENTE'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center print:hidden">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditDespesa(despesa)}
                            className="bg-blue-600 p-2 rounded text-white hover:bg-blue-700 transition-colors"
                            title="Editar despesa"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteDespesa(despesa.id)}
                            className="bg-red-600 p-2 rounded text-white hover:bg-red-700 transition-colors"
                            title="Excluir despesa"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Despesa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Nova Despesa</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={newDespesa.descricao}
                  onChange={(e) => setNewDespesa({ ...newDespesa, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Aluguel do escritório"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={newDespesa.categoria}
                  onChange={(e) => setNewDespesa({ ...newDespesa, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={newDespesa.fornecedor}
                  onChange={(e) => setNewDespesa({ ...newDespesa, fornecedor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Empresa ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newDespesa.valor}
                  onChange={(e) => setNewDespesa({ ...newDespesa, valor: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={newDespesa.data_vencimento}
                  onChange={(e) => setNewDespesa({ ...newDespesa, data_vencimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newDespesa.observacoes || ''}
                  onChange={(e) => setNewDespesa({ ...newDespesa, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDespesa}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Despesa */}
      {showEditModal && editingDespesa && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Despesa</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={editingDespesa.descricao}
                  onChange={(e) => setEditingDespesa({ ...editingDespesa, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Aluguel do escritório"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={editingDespesa.categoria}
                  onChange={(e) => setEditingDespesa({ ...editingDespesa, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={editingDespesa.fornecedor || ''}
                  onChange={(e) => setEditingDespesa({ ...editingDespesa, fornecedor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Empresa ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingDespesa.valor}
                  onChange={(e) => setEditingDespesa({ ...editingDespesa, valor: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={editingDespesa.data_vencimento}
                  onChange={(e) => setEditingDespesa({ ...editingDespesa, data_vencimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={editingDespesa.observacoes || ''}
                  onChange={(e) => setEditingDespesa({ ...editingDespesa, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingDespesa(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateDespesa}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
