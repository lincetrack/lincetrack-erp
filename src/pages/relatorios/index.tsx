import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import { Cliente, Fatura, Despesa } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { clienteService } from '@/services/clienteService'
import { faturaService } from '@/services/faturaService'
import { despesaService } from '@/services/despesaService'

type ReportType = 'faturas' | 'despesas' | 'clientes' | 'financeiro' | 'assistencia' | 'inadimplentes'

export default function RelatoriosPage() {
  const [reportType, setReportType] = useState<ReportType | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros para relatório de faturas
  const [filterCliente, setFilterCliente] = useState('todos')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'pago'>('todos')

  useEffect(() => {
    loadData()

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await faturaService.updateOverdue()
      const [clientesData, faturasData, despesasData] = await Promise.all([
        clienteService.getAll(),
        faturaService.getAll(),
        despesaService.getAll()
      ])
      setClientes(clientesData)
      setFaturas(faturasData)
      setDespesas(despesasData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Comparação de strings YYYY-MM-DD evita bugs de timezone do Date()
  const filterByDate = <T extends { data_vencimento: string }>(items: T[]) => {
    return items.filter(item =>
      item.data_vencimento >= startDate && item.data_vencimento <= endDate
    )
  }

  const renderFaturasReport = () => {
    // Primeiro filtrar por data
    let filteredFaturas = filterByDate(faturas)

    // Depois aplicar filtro de cliente
    if (filterCliente !== 'todos') {
      filteredFaturas = filteredFaturas.filter(f => f.cliente_id === filterCliente)
    }

    // Por último aplicar filtro de status
    if (filterStatus !== 'todos') {
      filteredFaturas = filteredFaturas.filter(f => f.status === filterStatus)
    }

    const totalFaturas = filteredFaturas.reduce((acc, f) => acc + f.valor, 0)
    const totalPagas = filteredFaturas.filter(f => f.status === 'pago').reduce((acc, f) => acc + f.valor, 0)
    const totalPendentes = filteredFaturas.filter(f => f.status === 'pendente').reduce((acc, f) => acc + f.valor, 0)

    // Lista de clientes únicos para o filtro
    const clientesUnicos = Array.from(new Set(faturas.map(f => f.cliente_id)))
      .map(clienteId => {
        const fatura = faturas.find(f => f.cliente_id === clienteId)
        return { id: clienteId, nome: fatura?.cliente_nome || '' }
      })
      .sort((a, b) => a.nome.localeCompare(b.nome))

    const hasActiveFilters = filterCliente !== 'todos' || filterStatus !== 'todos'

    const clearFilters = () => {
      setFilterCliente('todos')
      setFilterStatus('todos')
    }

    return (
      <div className="space-y-6">
        {/* Cabeçalho do Relatório - Visível na impressão */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Faturas</h1>
          <p className="text-sm text-gray-600">
            Período: {new Date(startDate).toLocaleDateString('pt-BR')} a {new Date(endDate).toLocaleDateString('pt-BR')}
          </p>
          {filterCliente !== 'todos' && (
            <p className="text-sm text-gray-600">
              Cliente: {clientesUnicos.find(c => c.id === filterCliente)?.nome}
            </p>
          )}
          {filterStatus !== 'todos' && (
            <p className="text-sm text-gray-600">
              Status: {filterStatus === 'pendente' ? 'Pendente' : 'Pago'}
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="todos">Todos os Clientes</option>
                {clientesUnicos.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'todos' | 'pendente' | 'pago')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          {/* Badges de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>
              {filterCliente !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Cliente: {clientesUnicos.find(c => c.id === filterCliente)?.nome}
                </span>
              )}
              {filterStatus !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Status: {filterStatus === 'pendente' ? 'Pendente' : 'Pago'}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-summary-card">
          <div className="bg-blue-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Total de Faturas</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalFaturas)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Faturas Pagas</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPagas)}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Faturas Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPendentes)}</p>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-gray-300 text-sm print:text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Data</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Cliente</th>
                <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-left">Descrição</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Valor</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaturas.map(fatura => (
                <tr key={fatura.id}>
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{formatDate(fatura.data_vencimento)}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{fatura.cliente_nome}</td>
                  <td className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-gray-600">{fatura.descricao}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold whitespace-nowrap">{formatCurrency(fatura.valor)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      fatura.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fatura.status === 'pago' ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderDespesasReport = () => {
    const filteredDespesas = filterByDate(despesas)
    const totalDespesas = filteredDespesas.reduce((acc, d) => acc + d.valor, 0)
    const totalPagas = filteredDespesas.filter(d => d.status === 'pago').reduce((acc, d) => acc + d.valor, 0)
    const totalPendentes = filteredDespesas.filter(d => d.status === 'pendente').reduce((acc, d) => acc + d.valor, 0)

    const porCategoria = filteredDespesas.reduce((acc, d) => {
      if (!acc[d.categoria]) acc[d.categoria] = 0
      acc[d.categoria] += d.valor
      return acc
    }, {} as Record<string, number>)

    return (
      <div className="space-y-6">
        {/* Cabeçalho do Relatório - Visível na impressão */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Despesas</h1>
          <p className="text-sm text-gray-600">
            Período: {new Date(startDate).toLocaleDateString('pt-BR')} a {new Date(endDate).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-summary-card">
          <div className="bg-red-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Total de Despesas</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Despesas Pagas</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPagas)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Despesas Pendentes</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPendentes)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-300 print-no-break">
          <h3 className="font-bold text-lg mb-4">Despesas por Categoria</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
            {Object.entries(porCategoria).map(([categoria, valor]) => (
              <div key={categoria} className="text-center p-3 bg-gray-50 rounded print-no-break">
                <p className="text-sm text-gray-600">{categoria}</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(valor)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-gray-300 text-sm print:text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Data</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Descrição</th>
                <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-left">Categoria</th>
                <th className="hidden md:table-cell border border-gray-300 px-3 py-2 text-left">Fornecedor</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Valor</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDespesas.map(despesa => (
                <tr key={despesa.id}>
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{formatDate(despesa.data_vencimento)}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{despesa.descricao}</td>
                  <td className="hidden sm:table-cell border border-gray-300 px-3 py-2">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{despesa.categoria}</span>
                  </td>
                  <td className="hidden md:table-cell border border-gray-300 px-3 py-2 text-gray-600">{despesa.fornecedor || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold whitespace-nowrap">{formatCurrency(despesa.valor)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      despesa.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {despesa.status === 'pago' ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderClientesReport = () => {
    const clientesAtivos = clientes.filter(c => c.ativo)
    const receitaMensal = clientesAtivos.reduce((acc, c) => acc + c.valor_mensalidade, 0)
    const totalVeiculos = clientesAtivos.reduce((acc, c) => acc + (c.veiculos?.length || 0), 0)

    return (
      <div className="space-y-6">
        {/* Cabeçalho do Relatório - Visível na impressão */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Clientes</h1>
          <p className="text-sm text-gray-600">
            Data de geração: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print-summary-card">
          <div className="bg-blue-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Total de Clientes</p>
            <p className="text-2xl font-bold text-blue-600">{clientes.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Clientes Ativos</p>
            <p className="text-2xl font-bold text-green-600">{clientesAtivos.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Receita Mensal</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(receitaMensal)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Total de Veículos</p>
            <p className="text-2xl font-bold text-orange-600">{totalVeiculos}</p>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-gray-300 text-sm print:text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Cliente</th>
                <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-left">CNPJ</th>
                <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-left">Cidade</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Veíc.</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Mensalidade</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.id}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{cliente.nome}</td>
                  <td className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-gray-600">{cliente.cnpj}</td>
                  <td className="hidden sm:table-cell border border-gray-300 px-3 py-2">{cliente.cidade} - {cliente.estado}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{cliente.veiculos?.length || 0}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold whitespace-nowrap">{formatCurrency(cliente.valor_mensalidade)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cliente.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cliente.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderFinanceiroReport = () => {
    const filteredFaturas = filterByDate(faturas)
    const filteredDespesas = filterByDate(despesas)

    const receitaRealizada = filteredFaturas.filter(f => f.status === 'pago').reduce((acc, f) => acc + f.valor, 0)
    const receitaPrevista = filteredFaturas.reduce((acc, f) => acc + f.valor, 0)
    const receitaPendente = filteredFaturas.filter(f => f.status === 'pendente').reduce((acc, f) => acc + f.valor, 0)

    const despesasPagas = filteredDespesas.filter(d => d.status === 'pago').reduce((acc, d) => acc + d.valor, 0)
    const despesasPrevistas = filteredDespesas.reduce((acc, d) => acc + d.valor, 0)
    const despesasPendentes = filteredDespesas.filter(d => d.status === 'pendente').reduce((acc, d) => acc + d.valor, 0)

    const resultadoRealizado = receitaRealizada - despesasPagas
    const resultadoPrevisto = receitaPrevista - despesasPrevistas

    const formatPct = (value: number, total: number) =>
      total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '—'

    return (
      <div className="space-y-6">
        {/* Cabeçalho do Relatório - Visível na impressão */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório Financeiro Consolidado</h1>
          <p className="text-sm text-gray-600">
            Período: {startDate.split('-').reverse().join('/')} a {endDate.split('-').reverse().join('/')}
          </p>
        </div>

        {/* Receitas */}
        <div>
          <h3 className="text-base font-semibold text-gray-700 mb-2 uppercase tracking-wider">Receitas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-summary-card">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg print-no-break">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Prevista (Total Faturas)</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(receitaPrevista)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredFaturas.length} fatura(s)</p>
            </div>
            <div className="bg-green-100 border border-green-300 p-4 rounded-lg print-no-break">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Realizada (Pagas)</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(receitaRealizada)}</p>
              <p className="text-xs text-gray-500 mt-1">{formatPct(receitaRealizada, receitaPrevista)} do previsto</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg print-no-break">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Pendente (A Receber)</p>
              <p className="text-2xl font-bold text-yellow-700">{formatCurrency(receitaPendente)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredFaturas.filter(f => f.status === 'pendente').length} fatura(s) em aberto</p>
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div>
          <h3 className="text-base font-semibold text-gray-700 mb-2 uppercase tracking-wider">Despesas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-summary-card">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg print-no-break">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Prevista (Total)</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(despesasPrevistas)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredDespesas.length} despesa(s)</p>
            </div>
            <div className="bg-red-100 border border-red-300 p-4 rounded-lg print-no-break">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Pagas</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(despesasPagas)}</p>
              <p className="text-xs text-gray-500 mt-1">{formatPct(despesasPagas, despesasPrevistas)} do previsto</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg print-no-break">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Pendente (A Pagar)</p>
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(despesasPendentes)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredDespesas.filter(d => d.status === 'pendente').length} despesa(s) em aberto</p>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div>
          <h3 className="text-base font-semibold text-gray-700 mb-2 uppercase tracking-wider">Resultado</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-summary-card">
            <div className={`p-4 rounded-lg border print-no-break ${resultadoRealizado >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Resultado Realizado</p>
              <p className={`text-2xl font-bold ${resultadoRealizado >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {formatCurrency(resultadoRealizado)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Receita recebida − Despesas pagas</p>
            </div>
            <div className={`p-4 rounded-lg border print-no-break ${resultadoPrevisto >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Resultado Previsto</p>
              <p className={`text-2xl font-bold ${resultadoPrevisto >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                {formatCurrency(resultadoPrevisto)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Receita total − Despesas totais</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg print-no-break">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Margem Realizada</p>
              <p className="text-2xl font-bold text-purple-700">
                {receitaRealizada > 0 ? `${((resultadoRealizado / receitaRealizada) * 100).toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">sobre a receita recebida</p>
            </div>
          </div>
        </div>

        {/* Listas detalhadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
          <div className="bg-white p-4 rounded-lg border border-gray-300 print-no-break">
            <h3 className="font-bold text-base mb-3 text-green-700">Faturas Recebidas</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto print:max-h-none print:overflow-visible">
              {filteredFaturas.filter(f => f.status === 'pago').length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhuma fatura paga no período</p>
              ) : (
                filteredFaturas.filter(f => f.status === 'pago').map(fatura => (
                  <div key={fatura.id} className="flex justify-between border-b pb-1">
                    <span className="text-sm text-gray-700">{fatura.cliente_nome}</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(fatura.valor)}</span>
                  </div>
                ))
              )}
            </div>
            {receitaPendente > 0 && (
              <div className="mt-3 pt-2 border-t border-dashed border-yellow-300">
                <p className="text-xs text-yellow-700 font-medium">+ {formatCurrency(receitaPendente)} pendente(s) a receber</p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-300 print-no-break">
            <h3 className="font-bold text-base mb-3 text-red-700">Despesas Pagas</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto print:max-h-none print:overflow-visible">
              {filteredDespesas.filter(d => d.status === 'pago').length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhuma despesa paga no período</p>
              ) : (
                filteredDespesas.filter(d => d.status === 'pago').map(despesa => (
                  <div key={despesa.id} className="flex justify-between border-b pb-1">
                    <span className="text-sm text-gray-700">{despesa.descricao}</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(despesa.valor)}</span>
                  </div>
                ))
              )}
            </div>
            {despesasPendentes > 0 && (
              <div className="mt-3 pt-2 border-t border-dashed border-orange-300">
                <p className="text-xs text-orange-700 font-medium">+ {formatCurrency(despesasPendentes)} pendente(s) a pagar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderAssistenciaReport = () => {
    const clientesComAssistencia = clientes.filter(c => c.possui_assistencia && c.ativo)
    const totalVeiculos = clientesComAssistencia.reduce((acc, c) => acc + (c.veiculos?.length || 0), 0)
    const totalRepasse = clientesComAssistencia.reduce((acc, c) => acc + (c.valor_assistencia || 0), 0)

    return (
      <div className="space-y-6">
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Assistência Veicular</h1>
          <p className="text-sm text-gray-600">Data de geração: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-summary-card">
          <div className="bg-blue-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Clientes com Assistência</p>
            <p className="text-2xl font-bold text-blue-600">{clientesComAssistencia.length}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Veículos Cobertos</p>
            <p className="text-2xl font-bold text-indigo-600">{totalVeiculos}</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Total Repasse Assistência</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRepasse)}</p>
          </div>
        </div>

        {clientesComAssistencia.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum cliente ativo com Assistência Veicular cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-gray-300 text-sm print:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Cliente</th>
                  <th className="hidden md:table-cell border border-gray-300 px-3 py-2 text-left">Telefone</th>
                  <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-left">Cidade / UF</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Placa</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Veículo</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Bloqueio</th>
                  <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-right">Valor Assistência</th>
                </tr>
              </thead>
              <tbody>
                {clientesComAssistencia.map(cliente =>
                  cliente.veiculos && cliente.veiculos.length > 0 ? (
                    cliente.veiculos.map((veiculo, index) => (
                      <tr key={`${cliente.id}-${veiculo.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {index === 0 && (
                          <>
                            <td
                              className="border border-gray-300 px-3 py-2 font-medium"
                              rowSpan={cliente.veiculos.length}
                            >
                              {cliente.nome}
                            </td>
                            <td
                              className="hidden md:table-cell border border-gray-300 px-3 py-2"
                              rowSpan={cliente.veiculos.length}
                            >
                              {cliente.telefone}
                            </td>
                            <td
                              className="hidden sm:table-cell border border-gray-300 px-3 py-2"
                              rowSpan={cliente.veiculos.length}
                            >
                              {cliente.cidade} - {cliente.estado}
                            </td>
                          </>
                        )}
                        <td className="border border-gray-300 px-3 py-2 font-mono font-bold">{veiculo.placa}</td>
                        <td className="border border-gray-300 px-3 py-2">{veiculo.veiculo}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {veiculo.com_bloqueio ? (
                            <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">SIM</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">NÃO</span>
                          )}
                        </td>
                        {index === 0 && (
                          <td
                            className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-right font-semibold text-green-700"
                            rowSpan={cliente.veiculos.length}
                          >
                            {cliente.valor_assistencia ? formatCurrency(cliente.valor_assistencia) : '—'}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr key={cliente.id}>
                      <td className="border border-gray-300 px-3 py-2 font-medium">{cliente.nome}</td>
                      <td className="hidden md:table-cell border border-gray-300 px-3 py-2">{cliente.telefone}</td>
                      <td className="hidden sm:table-cell border border-gray-300 px-3 py-2">{cliente.cidade} - {cliente.estado}</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-400 italic" colSpan={3}>Sem veículos cadastrados</td>
                      <td className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-right font-semibold text-green-700">
                        {cliente.valor_assistencia ? formatCurrency(cliente.valor_assistencia) : '—'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
              <tfoot className="bg-green-50">
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 font-bold text-right hidden sm:table-cell">
                    Total Repasse
                  </td>
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 font-bold text-right sm:hidden">
                    Total Repasse
                  </td>
                  <td className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-right font-bold text-green-800 text-base">
                    {formatCurrency(totalRepasse)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  const renderInadimplentesReport = () => {
    const hoje = new Date().toISOString().split('T')[0]
    const faturasAtrasadas = faturas.filter(f => f.status === 'atrasado')

    // Agrupa por cliente
    const porCliente: Record<string, {
      nome: string
      telefone: string
      faturas: typeof faturasAtrasadas
      totalValor: number
      diasMaxAtraso: number
    }> = {}

    faturasAtrasadas.forEach(f => {
      const cliente = clientes.find(c => c.id === f.cliente_id)
      const diasAtraso = Math.floor(
        (new Date(hoje).getTime() - new Date(f.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (!porCliente[f.cliente_id]) {
        porCliente[f.cliente_id] = {
          nome: f.cliente_nome,
          telefone: cliente?.telefone || '—',
          faturas: [],
          totalValor: 0,
          diasMaxAtraso: 0
        }
      }
      porCliente[f.cliente_id].faturas.push(f)
      porCliente[f.cliente_id].totalValor += f.valor
      if (diasAtraso > porCliente[f.cliente_id].diasMaxAtraso) {
        porCliente[f.cliente_id].diasMaxAtraso = diasAtraso
      }
    })

    const listaInadimplentes = Object.values(porCliente)
      .sort((a, b) => b.diasMaxAtraso - a.diasMaxAtraso)

    const totalGeral = listaInadimplentes.reduce((acc, c) => acc + c.totalValor, 0)

    const faixaCor = (dias: number) => {
      if (dias <= 15) return 'text-yellow-700 bg-yellow-50'
      if (dias <= 30) return 'text-orange-700 bg-orange-50'
      return 'text-red-700 bg-red-50'
    }

    return (
      <div className="space-y-6">
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatório de Inadimplência</h1>
          <p className="text-sm text-gray-600">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-summary-card">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Clientes Inadimplentes</p>
            <p className="text-2xl font-bold text-red-700">{listaInadimplentes.length}</p>
          </div>
          <div className="bg-red-100 border border-red-300 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Total em Aberto</p>
            <p className="text-2xl font-bold text-red-800">{formatCurrency(totalGeral)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg print-no-break">
            <p className="text-sm text-gray-600">Faturas Atrasadas</p>
            <p className="text-2xl font-bold text-orange-700">{faturasAtrasadas.length}</p>
          </div>
        </div>

        {listaInadimplentes.length === 0 ? (
          <div className="text-center py-16 bg-green-50 rounded-lg border border-green-200">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-green-700 font-semibold text-lg">Nenhum cliente inadimplente!</p>
            <p className="text-green-600 text-sm">Todas as faturas estão em dia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-gray-300 text-sm print:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Cliente</th>
                  <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-left">Telefone</th>
                  <th className="hidden md:table-cell border border-gray-300 px-3 py-2 text-center">Fat.</th>
                  <th className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-left">Vencimentos</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Atraso</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Total Devido</th>
                </tr>
              </thead>
              <tbody>
                {listaInadimplentes.map((cliente, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-3 py-2 font-medium">{cliente.nome}</td>
                    <td className="hidden sm:table-cell border border-gray-300 px-3 py-2">{cliente.telefone}</td>
                    <td className="hidden md:table-cell border border-gray-300 px-3 py-2 text-center">{cliente.faturas.length}</td>
                    <td className="hidden sm:table-cell border border-gray-300 px-3 py-2">
                      {cliente.faturas
                        .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
                        .map(f => formatDate(f.data_vencimento))
                        .join(', ')}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${faixaCor(cliente.diasMaxAtraso)}`}>
                        {cliente.diasMaxAtraso}d
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold text-red-700 whitespace-nowrap">
                      {formatCurrency(cliente.totalValor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right sm:hidden">Total Geral</td>
                  <td colSpan={5} className="hidden sm:table-cell border border-gray-300 px-3 py-2 text-right">Total Geral</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-red-700 whitespace-nowrap">{formatCurrency(totalGeral)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800 print:hidden">Relatórios Gerenciais</h1>

        {!reportType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setReportType('faturas')}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="text-4xl mb-4">💵</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatório de Faturas</h3>
              <p className="text-sm text-gray-600">Análise detalhada de todas as faturas e recebimentos</p>
            </button>

            <button
              onClick={() => setReportType('despesas')}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatório de Despesas</h3>
              <p className="text-sm text-gray-600">Controle detalhado de todas as despesas por categoria</p>
            </button>

            <button
              onClick={() => setReportType('clientes')}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatório de Clientes</h3>
              <p className="text-sm text-gray-600">Análise completa da base de clientes e veículos</p>
            </button>

            <button
              onClick={() => setReportType('financeiro')}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatório Financeiro Consolidado</h3>
              <p className="text-sm text-gray-600">Visão completa: Receitas x Despesas e resultado</p>
            </button>

            <button
              onClick={() => setReportType('assistencia')}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left border-l-4 border-blue-500"
            >
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatório de Assistência Veicular</h3>
              <p className="text-sm text-gray-600">Clientes com Assistência Veicular e placas dos veículos</p>
            </button>

            <button
              onClick={() => setReportType('inadimplentes')}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left border-l-4 border-red-500"
            >
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatório de Inadimplência</h3>
              <p className="text-sm text-gray-600">Clientes com faturas atrasadas, dias em atraso e valor acumulado</p>
            </button>

            <a
              href="/etiqueta-instalacao.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left border-l-4 border-orange-400 block"
            >
              <div className="text-4xl mb-4">🏷️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Etiquetas de Instalação</h3>
              <p className="text-sm text-gray-600">Imprime fichas de instalação para envio aos instaladores</p>
              <span className="inline-block mt-3 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                🖨️ Abre para impressão
              </span>
            </a>

          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:p-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 print:hidden">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {reportType === 'faturas' && 'Relatório de Faturas'}
                  {reportType === 'despesas' && 'Relatório de Despesas'}
                  {reportType === 'clientes' && 'Relatório de Clientes'}
                  {reportType === 'financeiro' && 'Relatório Financeiro Consolidado'}
                  {reportType === 'assistencia' && 'Relatório de Assistência Veicular'}
                  {reportType === 'inadimplentes' && 'Relatório de Inadimplência'}
                </h2>
                <div className="flex gap-2 print:hidden shrink-0">
                  <button
                    onClick={() => setReportType(null)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </div>

              {(reportType === 'faturas' || reportType === 'despesas' || reportType === 'financeiro') && (
                <div className="flex flex-col sm:flex-row gap-3 mb-6 print:hidden">
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {reportType === 'faturas' && renderFaturasReport()}
              {reportType === 'despesas' && renderDespesasReport()}
              {reportType === 'clientes' && renderClientesReport()}
              {reportType === 'financeiro' && renderFinanceiroReport()}
              {reportType === 'assistencia' && renderAssistenciaReport()}
              {reportType === 'inadimplentes' && renderInadimplentesReport()}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
