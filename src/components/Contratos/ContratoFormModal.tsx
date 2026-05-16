import { useState, useEffect } from 'react'
import { Cliente, Contrato } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface ContratoFormModalProps {
  isOpen: boolean
  clientes: Cliente[]
  onClose: () => void
  onSave: (contrato: Omit<Contrato, 'id' | 'numero_contrato' | 'created_at' | 'updated_at'>) => Promise<void>
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

export default function ContratoFormModal({ isOpen, clientes, onClose, onSave }: ContratoFormModalProps) {
  const hoje = new Date().toISOString().split('T')[0]

  const [clienteId, setClienteId] = useState('')
  const [qtdVeiculos, setQtdVeiculos] = useState(1)
  const [valorMensalidade, setValorMensalidade] = useState(0)
  const [temAssistencia, setTemAssistencia] = useState(false)
  const [qtdVeiculosAssistencia, setQtdVeiculosAssistencia] = useState(1)
  const [valorAssistencia, setValorAssistencia] = useState(0)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const clienteSelecionado = clientes.find(c => c.id === clienteId) || null
  const dataVencimento = addMonths(new Date(), 12)

  useEffect(() => {
    if (!isOpen) {
      setClienteId('')
      setQtdVeiculos(1)
      setValorMensalidade(0)
      setTemAssistencia(false)
      setQtdVeiculosAssistencia(1)
      setValorAssistencia(0)
      setErro(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (clienteSelecionado) {
      setQtdVeiculos(clienteSelecionado.veiculos?.length || 1)
      setValorMensalidade(clienteSelecionado.valor_mensalidade || 0)
      setTemAssistencia(clienteSelecionado.possui_assistencia || false)
      setQtdVeiculosAssistencia(clienteSelecionado.veiculos?.length || 1)
      setValorAssistencia(clienteSelecionado.valor_assistencia || 0)
    }
  }, [clienteId])

  const totalRastreamento = valorMensalidade * qtdVeiculos
  const totalAssistencia = temAssistencia ? valorAssistencia * qtdVeiculosAssistencia : 0
  const totalGeral = totalRastreamento + totalAssistencia

  const handleSave = async () => {
    if (!clienteSelecionado) { setErro('Selecione um cliente.'); return }
    if (valorMensalidade <= 0) { setErro('Informe o valor da mensalidade.'); return }
    if (qtdVeiculos <= 0) { setErro('Informe a quantidade de veículos.'); return }
    if (temAssistencia && valorAssistencia <= 0) { setErro('Informe o valor da assistência.'); return }

    setSaving(true)
    setErro(null)
    try {
      await onSave({
        cliente_id: clienteSelecionado.id,
        cliente_nome: clienteSelecionado.nome,
        cliente_cnpj: clienteSelecionado.cnpj,
        cliente_endereco: clienteSelecionado.endereco,
        cliente_bairro: clienteSelecionado.bairro,
        cliente_cidade: clienteSelecionado.cidade,
        cliente_estado: clienteSelecionado.estado,
        valor_mensalidade: valorMensalidade,
        qtd_veiculos: qtdVeiculos,
        valor_assistencia: temAssistencia ? valorAssistencia : undefined,
        qtd_veiculos_assistencia: temAssistencia ? qtdVeiculosAssistencia : undefined,
        data_contrato: hoje,
        data_vencimento: dataVencimento,
        status: 'ativo',
        assinado: false
      })
      onClose()
    } catch {
      setErro('Erro ao salvar contrato. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 my-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">📝 Novo Contrato</h2>
          <button onClick={onClose} disabled={saving} className="text-gray-500 hover:text-red-500 text-2xl font-bold">✕</button>
        </div>

        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione o cliente...</option>
              {clientes.filter(c => c.ativo).sort((a, b) => a.nome.localeCompare(b.nome)).map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {clienteSelecionado && (
              <p className="text-xs text-gray-500 mt-1">
                CNPJ: {clienteSelecionado.cnpj} — {clienteSelecionado.cidade}/{clienteSelecionado.estado}
              </p>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do Contrato</label>
              <input type="date" value={hoje} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento (12 meses)</label>
              <input type="date" value={dataVencimento} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
            </div>
          </div>

          {/* Rastreamento */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📡 Rastreamento Veicular</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Qtd. Veículos *</label>
                <input
                  type="number" min="1" value={qtdVeiculos}
                  onChange={e => setQtdVeiculos(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor por Veículo (R$) *</label>
                <input
                  type="number" step="0.01" min="0" value={valorMensalidade}
                  onChange={e => setValorMensalidade(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Subtotal rastreamento: <strong>{formatCurrency(totalRastreamento)}</strong>/mês
            </p>
          </div>

          {/* Assistência */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox" checked={temAssistencia}
                onChange={e => setTemAssistencia(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-blue-800">🛡️ Incluir Assistência Veicular</span>
            </label>
            {temAssistencia && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qtd. Veículos c/ Assistência</label>
                  <input
                    type="number" min="1" value={qtdVeiculosAssistencia}
                    onChange={e => setQtdVeiculosAssistencia(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor por Veículo (R$)</label>
                  <input
                    type="number" step="0.01" min="0" value={valorAssistencia}
                    onChange={e => setValorAssistencia(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="col-span-2 text-xs text-blue-700 mt-1">
                  Subtotal assistência: <strong>{formatCurrency(totalAssistencia)}</strong>/mês
                </p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-green-800">Total Mensal do Contrato:</span>
            <span className="text-lg font-bold text-green-700">{formatCurrency(totalGeral)}</span>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">⚠️ {erro}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !clienteId} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
            {saving ? '⏳ Salvando...' : '✅ Gerar Contrato'}
          </button>
        </div>
      </div>
    </div>
  )
}
