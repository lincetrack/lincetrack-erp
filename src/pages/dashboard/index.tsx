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

  // Calcular métricas baseadas no mês selecionado (dados históricos)
  // Filtrar faturas do mês selecionado
  const faturasDoMes = faturas.filter(f => f.data_vencimento.startsWith(selectedMonth))

  // Clientes ativos no mês = clientes únicos que tiveram faturas naquele mês
  const clientesAtivosNoMes = new Set(faturasDoMes.map(f => f.cliente_id))
  const clientesAtivos = clientesAtivosNoMes.size

  // Receita mensal = soma de TODAS as faturas do mês (pagas + pendentes)
  const receitaMensal = faturasDoMes.reduce((acc, f) => acc + f.valor, 0)

  // Faturas pendentes = soma apenas das faturas pendentes do mês
  const faturasPendentes = faturasDoMes
    .filter(f => f.status === 'pendente')
    .reduce((acc, f) => acc + f.valor, 0)

  // Despesas do mês
  const despesasMes = despesas
    .filter(d => d.data_vencimento.startsWith(selectedMonth))
    .reduce((acc, d) => acc + d.valor, 0)

  // Resultado = Receita (faturas pagas) - Despesas (pagas)
  const receitaPaga = faturasDoMes
    .filter(f => f.status === 'pago')
    .reduce((acc, f) => acc + f.valor, 0)
  const despesasPagas = despesas
    .filter(d => d.data_vencimento.startsWith(selectedMonth) && d.status === 'pago')
    .reduce((acc, d) => acc + d.valor, 0)
  const resultado = receitaPaga - despesasPagas

  // Total de veículos do mês = soma dos veículos registrados nas faturas daquele mês
  const totalVeiculos = faturasDoMes.reduce((acc, f) => acc + (f.quantidade_veiculos || 0), 0)

  // Faturas recentes do mês selecionado
  const faturasRecentes = faturasDoMes
    .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime())
    .slice(0, 3)

  // Despesas recentes do mês selecionado
  const despesasDoMes = despesas.filter(d => d.data_vencimento.startsWith(selectedMonth))
  const despesasRecentes = despesasDoMes
    .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime())
    .slice(0, 3)

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
          <StatsCard
            title="Clientes Ativos"
            value={clientesAtivos.toString()}
            icon="👥"
            trend={clientesAtivos > 0 ? { value: 8, isPositive: true } : undefined}
          />
          <StatsCard
            title="Total de Veículos"
            value={totalVeiculos.toString()}
            icon="🚗"
            trend={totalVeiculos > 0 ? { value: 5, isPositive: true } : undefined}
          />
          <StatsCard
            title="Receita Mensal"
            value={formatCurrency(receitaMensal)}
            icon="💵"
            trend={receitaMensal > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <StatsCard
            title="Faturas Pendentes"
            value={formatCurrency(faturasPendentes)}
            icon="⏱"
            trend={faturasPendentes > 0 ? { value: 5, isPositive: false } : undefined}
          />
          <StatsCard
            title="Despesas do Mês"
            value={formatCurrency(despesasMes)}
            icon="💸"
            trend={despesasMes > 0 ? { value: 3, isPositive: true } : undefined}
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

        <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Resultado do Mês</h3>
              <p className="text-sm opacity-90">Receitas - Despesas</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{formatCurrency(resultado)}</p>
              <p className="text-sm opacity-90 mt-1">
                {resultado >= 0 ? '↑ Positivo' : '↓ Negativo'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
