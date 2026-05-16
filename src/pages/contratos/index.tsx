import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import { Contrato, Cliente } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { contratoService } from '@/services/contratoService'
import { clienteService } from '@/services/clienteService'
import ContratoFormModal from '@/components/Contratos/ContratoFormModal'
import ContratoViewModal from '@/components/Contratos/ContratoViewModal'

const STATUS_LABEL: Record<Contrato['status'], string> = {
  ativo: 'Ativo',
  vencido: 'Vencido',
  rescindido: 'Rescindido'
}
const STATUS_CLASS: Record<Contrato['status'], string> = {
  ativo: 'bg-green-100 text-green-800',
  vencido: 'bg-red-100 text-red-800',
  rescindido: 'bg-gray-100 text-gray-700'
}

function diasParaVencer(dataVenc: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVenc + 'T00:00:00')
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'todos' | Contrato['status']>('todos')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewContrato, setViewContrato] = useState<Contrato | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await contratoService.updateOverdue()
      const [contratosData, clientesData] = await Promise.all([
        contratoService.getAll(),
        clienteService.getAll()
      ])
      setContratos(contratosData)
      setClientes(clientesData)
    } catch (err) {
      console.error('Erro ao carregar contratos:', err)
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSave = async (dados: Omit<Contrato, 'id' | 'numero_contrato' | 'created_at' | 'updated_at'>) => {
    await contratoService.create(dados)
    await loadData()
    showMsg('Contrato gerado com sucesso!')
  }

  const handleRescindir = async (contrato: Contrato) => {
    if (!confirm(`Rescindir o contrato de ${contrato.cliente_nome}?`)) return
    try {
      await contratoService.updateStatus(contrato.id, 'rescindido')
      await loadData()
      showMsg('Contrato rescindido.')
    } catch {
      showMsg('Erro ao rescindir contrato.')
    }
  }

  const hoje = new Date().toISOString().split('T')[0]

  const filtrados = contratos.filter(c => {
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    const matchSearch = c.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cliente_cnpj.includes(search)
    return matchStatus && matchSearch
  })

  // Resumo
  const totalAtivos = contratos.filter(c => c.status === 'ativo').length
  const totalVencidos = contratos.filter(c => c.status === 'vencido').length
  const totalRescindidos = contratos.filter(c => c.status === 'rescindido').length
  const aVencer30 = contratos.filter(c => {
    if (c.status !== 'ativo') return false
    const dias = diasParaVencer(c.data_vencimento)
    return dias >= 0 && dias <= 30
  }).length

  return (
    <MainLayout>
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
          {notification}
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">Contratos</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 text-sm"
          >
            ➕ Novo Contrato
          </button>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-800">{contratos.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 mb-1">Ativos</p>
            <p className="text-2xl font-bold text-green-600">{totalAtivos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
            <p className="text-xs text-gray-500 mb-1">A Vencer (30 dias)</p>
            <p className="text-2xl font-bold text-yellow-600">{aVencer30}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-400">
            <p className="text-xs text-gray-500 mb-1">Vencidos</p>
            <p className="text-2xl font-bold text-red-600">{totalVencidos}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por cliente ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="vencido">Vencido</option>
            <option value="rescindido">Rescindido</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando contratos...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p>Nenhum contrato encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Nº</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left font-semibold text-gray-700">CNPJ</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-center font-semibold text-gray-700">Data</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Vencimento</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right font-semibold text-gray-700">Valor/mês</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrados.map(c => {
                    const dias = diasParaVencer(c.data_vencimento)
                    const avencer = c.status === 'ativo' && dias >= 0 && dias <= 30
                    const totalMensal = c.valor_mensalidade * c.qtd_veiculos +
                      (c.valor_assistencia || 0) * (c.qtd_veiculos_assistencia || 0)

                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 ${avencer ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-gray-600">#{c.numero_contrato}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{c.cliente_nome}</p>
                          {avencer && (
                            <p className="text-xs text-yellow-700 font-medium">⚠️ Vence em {dias} dia{dias !== 1 ? 's' : ''}</p>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-gray-600 font-mono">{c.cliente_cnpj}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-center text-gray-600">{formatDate(c.data_contrato)}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{formatDate(c.data_vencimento)}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-right font-semibold text-gray-800">
                          {formatCurrency(totalMensal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[c.status]}`}>
                            {STATUS_LABEL[c.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewContrato(c)}
                              className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 font-medium"
                              title="Ver / Imprimir"
                            >
                              🖨️ Ver
                            </button>
                            {c.status === 'ativo' && (
                              <button
                                onClick={() => handleRescindir(c)}
                                className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                                title="Rescindir contrato"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ContratoFormModal
        isOpen={showForm}
        clientes={clientes}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
      />

      <ContratoViewModal
        contrato={viewContrato}
        onClose={() => setViewContrato(null)}
      />
    </MainLayout>
  )
}
