import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import StatsCard from '@/components/Dashboard/StatsCard'
import { Cliente, Fatura, Despesa } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { clienteService } from '@/services/clienteService'
import { faturaService } from '@/services/faturaService'
import { despesaService } from '@/services/despesaService'

export default function DashboardPage() {
  // Helper para obter o mês atual no formato YYYY-MM
  const getCurrentMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
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

  // Clientes ativos = contagem real da tabela de clientes (independe do mês)
  const clientesAtivos = clientes.filter(c => c.ativo).length

  // Total de veículos = veículos reais dos clientes ativos (independe do mês)
  const totalVeiculos = clientes
    .filter(c => c.ativo)
    .reduce((acc, c) => acc + (c.veiculos?.length || 0), 0)

  // Inadimplentes = clientes distintos com pelo menos uma fatura atrasada
  const clientesInadimplentes = new Set(
    faturas.filter(f => f.status === 'atrasado').map(f => f.cliente_id)
  ).size
  const valorInadimplente = faturas
    .filter(f => f.status === 'atrasado')
    .reduce((acc, f) => acc + f.valor, 0)

  // Faturas do mês selecionado
  const faturasDoMes = faturas.filter(f => f.data_vencimento.startsWith(selectedMonth))

  // Receita prevista = todas as faturas do mês (pagas + pendentes)
  const receitaPrevista = faturasDoMes.reduce((acc, f) => acc + f.valor, 0)

  // Receita realizada = apenas faturas pagas
  const receitaRealizada = faturasDoMes
    .filter(f => f.status === 'pago')
    .reduce((acc, f) => acc + f.valor, 0)

  // Faturas pendentes = valor a receber
  const faturasPendentes = faturasDoMes
    .filter(f => f.status === 'pendente')
    .reduce((acc, f) => acc + f.valor, 0)

  // Despesas do mês (todas: pagas + pendentes)
  const despesasDoMes = despesas.filter(d => d.data_vencimento.startsWith(selectedMonth))
  const despesasMes = despesasDoMes.reduce((acc, d) => acc + d.valor, 0)

  // Despesas pagas do mês
  const despesasPagas = despesasDoMes
    .filter(d => d.status === 'pago')
    .reduce((acc, d) => acc + d.valor, 0)

  // Resultado realizado = receita paga - despesas pagas
  const resultado = receitaRealizada - despesasPagas

  // Faturas recentes do mês selecionado
  const faturasRecentes = [...faturasDoMes]
    .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime())
    .slice(0, 5)

  // Despesas recentes do mês selecionado
  const despesasRecentes = [...despesasDoMes]
    .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime())
    .slice(0, 5)

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  // Formatar nome do mês selecionado
  const [year, month] = selectedMonth.split('-')
  const mesNome = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-3">
            <p className="text-xs md:text-sm text-gray-600 capitalize">{mesNome}</p>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 md:gap-4">
          <StatsCard
            title="Clientes Ativos"
            value={clientesAtivos.toString()}
            icon="👥"
          />
          <StatsCard
            title="Total de Veículos"
            value={totalVeiculos.toString()}
            icon="🚗"
          />
          <StatsCard
            title="Receita Prevista"
            value={formatCurrency(receitaPrevista)}
            icon="📋"
          />
          <StatsCard
            title="Receita Realizada"
            value={formatCurrency(receitaRealizada)}
            icon="💵"
          />
          <StatsCard
            title="A Receber"
            value={formatCurrency(faturasPendentes)}
            icon="⏱"
          />
          <StatsCard
            title="Despesas do Mês"
            value={formatCurrency(despesasMes)}
            icon="💸"
          />
          <StatsCard
            title="Inadimplentes"
            value={clientesInadimplentes.toString()}
            icon="⚠️"
            subtitle={clientesInadimplentes > 0 ? formatCurrency(valorInadimplente) + ' em aberto' : 'Sem atrasos'}
            highlight={clientesInadimplentes > 0 ? 'red' : 'green'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Faturas Recentes
            </h2>
            <div className="space-y-4">
              {faturasRecentes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma fatura no período</p>
              ) : (
                faturasRecentes.map((fatura) => (
                  <div key={fatura.id} className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-800">{fatura.cliente_nome}</p>
                      <p className="text-sm text-gray-600">
                        Vencimento: {formatDate(fatura.data_vencimento)} - {formatCurrency(fatura.valor)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      fatura.status === 'pago'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fatura.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Despesas Recentes
            </h2>
            <div className="space-y-4">
              {despesasRecentes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma despesa no período</p>
              ) : (
                despesasRecentes.map((despesa) => (
                  <div key={despesa.id} className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-800">{despesa.descricao}</p>
                      <p className="text-sm text-gray-600">
                        Vencimento: {formatDate(despesa.data_vencimento)} - {formatCurrency(despesa.valor)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      despesa.status === 'pago'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {despesa.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow-md p-6 text-white ${resultado >= 0 ? 'bg-gradient-to-r from-primary-600 to-blue-600' : 'bg-gradient-to-r from-red-600 to-orange-600'}`}>
          <h3 className="text-lg font-bold mb-4">Resultado Realizado — {mesNome}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/15 rounded-lg p-4">
              <p className="text-xs opacity-80 uppercase tracking-wider mb-1">Receita Recebida</p>
              <p className="text-2xl font-bold">{formatCurrency(receitaRealizada)}</p>
              <p className="text-xs opacity-75 mt-1">de {formatCurrency(receitaPrevista)} previstos</p>
            </div>
            <div className="bg-white/15 rounded-lg p-4">
              <p className="text-xs opacity-80 uppercase tracking-wider mb-1">Despesas Pagas</p>
              <p className="text-2xl font-bold">{formatCurrency(despesasPagas)}</p>
              <p className="text-xs opacity-75 mt-1">de {formatCurrency(despesasMes)} previstos</p>
            </div>
            <div className="bg-white/25 rounded-lg p-4 border border-white/30">
              <p className="text-xs opacity-80 uppercase tracking-wider mb-1">Resultado Líquido</p>
              <p className="text-3xl font-bold">{formatCurrency(resultado)}</p>
              <p className="text-xs opacity-75 mt-1">{resultado >= 0 ? '↑ Positivo' : '↓ Negativo'}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
