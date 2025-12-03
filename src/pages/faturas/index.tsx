import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import InvoiceModal from '@/components/Faturas/InvoiceModal'
import { Fatura, Cliente } from '@/types'
import { formatCurrency, formatDate, generateWhatsappLink } from '@/utils/formatters'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const INITIAL_FATURAS: Fatura[] = []

export default function FaturasPage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-12')
  const [selectedInvoice, setSelectedInvoice] = useState<Fatura | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Cliente | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFatura, setEditingFatura] = useState<Fatura | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Carregar clientes do localStorage (sincronizado com a página de clientes)
  const [clientes, setClientes] = useState<Cliente[]>([])

  useEffect(() => {
    const clientesData = localStorage.getItem('clientes')
    if (clientesData) {
      setClientes(JSON.parse(clientesData))
    }
  }, [])

  // Usar hook customizado para persistência de faturas
  const [faturas, setFaturas] = useLocalStorage<Fatura[]>('faturas', INITIAL_FATURAS)

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  const generateInvoices = () => {
    const [year, month] = selectedMonth.split('-')
    let count = 0
    const newInvoices: Fatura[] = []

    clientes.forEach(cliente => {
      if (!cliente.ativo) return

      const dueDate = `${year}-${month}-${cliente.dia_vencimento.padStart(2, '0')}`

      const exists = faturas.some(f =>
        f.cliente_id === cliente.id && f.data_vencimento === dueDate
      )

      if (!exists) {
        newInvoices.push({
          id: `${Date.now()}-${Math.random()}`,
          cliente_id: cliente.id,
          cliente_nome: cliente.nome,
          descricao: 'Loc. Equipamento e Software para Rastreamento Veicular',
          valor: cliente.valor_mensalidade,
          data_vencimento: dueDate,
          data_emissao: new Date().toISOString().split('T')[0],
          status: 'pendente',
          enviado_whatsapp: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        count++
      }
    })

    if (count > 0) {
      setFaturas([...faturas, ...newInvoices])
      showNotification(`${count} fatura(s) gerada(s) com sucesso!`)
    } else {
      showNotification('Todas as faturas deste mês já foram geradas.')
    }
  }

  const toggleStatus = (id: string) => {
    setFaturas(faturas.map(f =>
      f.id === id ? {
        ...f,
        status: f.status === 'pago' ? 'pendente' : 'pago' as 'pago' | 'pendente',
        updated_at: new Date().toISOString()
      } : f
    ))
  }

  const handlePrintInvoice = (fatura: Fatura) => {
    const cliente = clientes.find(c => c.id === fatura.cliente_id)
    if (cliente) {
      setSelectedInvoice(fatura)
      setSelectedCustomer(cliente)
    }
  }

  const handleSendWhatsapp = (fatura: Fatura) => {
    const cliente = clientes.find(c => c.id === fatura.cliente_id)
    if (cliente) {
      const link = generateWhatsappLink(cliente.telefone, cliente.nome, fatura.data_vencimento)
      window.open(link, '_blank')

      setFaturas(faturas.map(f =>
        f.id === fatura.id ? { ...f, enviado_whatsapp: true, updated_at: new Date().toISOString() } : f
      ))
    }
  }

  const handleEditFatura = (fatura: Fatura) => {
    setEditingFatura(fatura)
    setShowEditModal(true)
  }

  const handleUpdateFatura = () => {
    if (!editingFatura) return

    setFaturas(faturas.map(f =>
      f.id === editingFatura.id ? { ...editingFatura, updated_at: new Date().toISOString() } : f
    ))
    setShowEditModal(false)
    setEditingFatura(null)
    showNotification('Fatura atualizada com sucesso!')
  }

  const handleDeleteFatura = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.')) {
      setFaturas(faturas.filter(f => f.id !== id))
      showNotification('Fatura excluída com sucesso!')
    }
  }

  const filteredFaturas = faturas.filter(f => f.data_vencimento.startsWith(selectedMonth))

  const totalPendente = filteredFaturas
    .filter(f => f.status === 'pendente')
    .reduce((acc, f) => acc + f.valor, 0)

  const totalPago = filteredFaturas
    .filter(f => f.status === 'pago')
    .reduce((acc, f) => acc + f.valor, 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Notificação */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            ✓ {notification}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Faturas</h1>
          <div className="flex gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={generateInvoices}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              🔄 Gerar Faturas
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Faturas</h3>
            <p className="text-3xl font-bold text-primary-600">{filteredFaturas.length}</p>
            <p className="text-sm text-gray-600 mt-2">no período selecionado</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Faturas Pendentes</h3>
            <p className="text-3xl font-bold text-yellow-600">{formatCurrency(totalPendente)}</p>
            <p className="text-sm text-gray-600 mt-2">aguardando pagamento</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Faturas Pagas</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
            <p className="text-sm text-gray-600 mt-2">já recebidas</p>
          </div>
        </div>

        {/* Tabela de Faturas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFaturas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma fatura encontrada para este período. Clique em &quot;Gerar Faturas&quot; para criar.
                    </td>
                  </tr>
                ) : (
                  filteredFaturas.map((fatura) => (
                    <tr key={fatura.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(fatura.data_vencimento)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {fatura.cliente_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        {formatCurrency(fatura.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleStatus(fatura.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-colors ${
                            fatura.status === 'pago'
                              ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100'
                              : 'border-yellow-500 text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                          }`}
                        >
                          {fatura.status === 'pago' ? '✓ PAGO' : '⏱ PENDENTE'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {fatura.enviado_whatsapp ? (
                          <span className="text-green-600 text-xs">✓ Enviado</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Não enviado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleSendWhatsapp(fatura)}
                            className="bg-green-600 p-2 rounded text-white hover:bg-green-700 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            💬
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(fatura)}
                            className="bg-blue-600 p-2 rounded text-white hover:bg-blue-700 transition-colors"
                            title="Visualizar/Imprimir Fatura"
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => handleEditFatura(fatura)}
                            className="bg-yellow-600 p-2 rounded text-white hover:bg-yellow-700 transition-colors"
                            title="Editar Fatura"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteFatura(fatura.id)}
                            className="bg-red-600 p-2 rounded text-white hover:bg-red-700 transition-colors"
                            title="Excluir Fatura"
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

      {/* Modal de Visualização da Fatura */}
      {selectedInvoice && selectedCustomer && (
        <InvoiceModal
          invoice={selectedInvoice}
          customer={selectedCustomer}
          onClose={() => {
            setSelectedInvoice(null)
            setSelectedCustomer(null)
          }}
        />
      )}

      {/* Modal de Editar Fatura */}
      {showEditModal && editingFatura && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Fatura</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={editingFatura.cliente_nome}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={editingFatura.descricao}
                  onChange={(e) => setEditingFatura({ ...editingFatura, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingFatura.valor}
                  onChange={(e) => setEditingFatura({ ...editingFatura, valor: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={editingFatura.data_vencimento}
                  onChange={(e) => setEditingFatura({ ...editingFatura, data_vencimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Emissão *
                </label>
                <input
                  type="date"
                  value={editingFatura.data_emissao}
                  onChange={(e) => setEditingFatura({ ...editingFatura, data_emissao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={editingFatura.observacoes || ''}
                  onChange={(e) => setEditingFatura({ ...editingFatura, observacoes: e.target.value })}
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
                  setEditingFatura(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateFatura}
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
