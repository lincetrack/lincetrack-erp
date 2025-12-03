import Link from 'next/link'
import { useRouter } from 'next/router'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Faturas', path: '/faturas', icon: '💵' },
  { name: 'Despesas', path: '/despesas', icon: '💸' },
  { name: 'Clientes', path: '/clientes', icon: '👥' },
  { name: 'Relatórios', path: '/relatorios', icon: '📈' },
]

export default function Sidebar() {
  const router = useRouter()

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">Lince Track ERP</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
              router.pathname === item.path ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' : ''
            }`}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
