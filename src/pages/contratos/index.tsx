import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import { Contrato, Cliente } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { contratoService } from '@/services/contratoService'
import { clienteService } from '@/services/clienteService'
import { supabase } from '@/lib/supabase'
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

interface DeleteModalProps {
  contrato: Contrato
  onConfirm: (password: string) => Promise<void>
  onClose: () => void
}

function DeleteModal({ contrato, onConfirm, onClose }: DeleteModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!password) { setErro('Informe a senha.'); return }
    setLoading(true)
    setErro(null)
    try {
      await onConfirm(password)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Senha incorreta ou erro ao excluir.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">🗑️ Excluir Contrato</h2>
        <p className="text-sm text-gray-600 mb-1">
          Você está prestes a excluir permanentemente o contrato de:
        </p>
        <p className="text-sm font-semibold text-red-700 mb-4">
          #{contrato.numero_contrato} — {contrato.cliente_nome}
        </p>
        <p className="text-sm text-gray-600 mb-3">
          Confirme sua senha de acesso ao sistema para continuar:
        </p>
        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          autoFocus
        />
        {erro && (
          <p className="text-sm text-red-600 mb-3">⚠️ {erro}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !password}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Verificando...' : '🗑️ Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'todos' | Contrato['status']>('todos')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewContrato, setViewContrato] = useState<Contrato | null>(null)
  const [deleteContrato, setDeleteContrato] = useState<Contrato | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')

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

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification(msg)
    setNotificationType(type)
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
      showMsg('Erro ao rescindir contrato.', 'error')
    }
  }

  const handleToggleAssinado = async (contrato: Contrato) => {
    try {
      await contratoService.updateAssinado(contrato.id, !contrato.assinado)
      setContratos(prev => prev.map(c =>
        c.id === contrato.id ? { ...c, assinado: !c.assinado } : c
      ))
    } catch {
      showMsg('Erro ao atualizar status de assinatura.', 'error')
    }
  }

  const handleDelete = async (password: string) => {
    if (!deleteContrato) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) throw new Error('Usuário não autenticado.')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password
    })
    if (authError) throw new Error('Senha incorreta.')

    await contratoService.delete(deleteContrato.id)
    setDeleteContrato(null)
    await loadData()
    showMsg('Contrato excluído com sucesso.')
  }

  const hoje = new Date().toISOString().split('T')[0]

  const filtrados = contratos.filter(c => {
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    const matchSearch = c.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cliente_cnpj.includes(search)
    return matchStatus && matchSearch
  })

  const totalAtivos = contratos.filter(c => c.status === 'ativo').length
  const totalVencidos = contratos.filter(c => c.status === 'vencido').length
  const aVencer30 = contratos.filter(c => {
    if (c.status !== 'ativo') return false
    const dias = diasParaVencer(c.data_vencimento)
    return dias >= 0 && dias <= 30
  }).length

  return (
    <MainLayout>
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${notificationType === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
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
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Assinado</th>
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
                          <label className="flex items-center justify-center gap-1.5 cursor-pointer group" title={c.assinado ? 'Contrato assinado' : 'Marcar como assinado'}>
                            <input
                              type="checkbox"
                              checked={c.assinado || false}
                              onChange={() => handleToggleAssinado(c)}
                              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                            <span className={`text-xs font-medium ${c.assinado ? 'text-green-700' : 'text-gray-400'}`}>
                              {c.assinado ? '✓ Sim' : 'Não'}
                            </span>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
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
                                className="px-2 py-1.5 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-medium"
                                title="Rescindir contrato"
                              >
                                ✕
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteContrato(c)}
                              className="px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                              title="Excluir contrato"
                            >
                              🗑️
                            </button>
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

      {deleteContrato && (
        <DeleteModal
          contrato={deleteContrato}
          onConfirm={handleDelete}
          onClose={() => setDeleteContrato(null)}
        />
      )}
    </MainLayout>
  )
}
