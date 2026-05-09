interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  subtitle?: string
  highlight?: 'red' | 'yellow' | 'green'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatsCard({ title, value, icon, subtitle, highlight, trend }: StatsCardProps) {
  const borderClass = highlight === 'red'
    ? 'border-l-4 border-red-500'
    : highlight === 'yellow'
    ? 'border-l-4 border-yellow-500'
    : highlight === 'green'
    ? 'border-l-4 border-green-500'
    : ''

  const valueClass = highlight === 'red'
    ? 'text-red-600'
    : highlight === 'yellow'
    ? 'text-yellow-600'
    : highlight === 'green'
    ? 'text-green-600'
    : 'text-gray-900'

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${borderClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</p>
          {subtitle && (
            <p className={`text-xs mt-1 font-medium ${highlight === 'red' ? 'text-red-500' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}
