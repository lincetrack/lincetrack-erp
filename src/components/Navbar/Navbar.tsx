import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        {/* Espaço para o botão hamburger no mobile */}
        <div className="lg:hidden w-10"></div>

        <div className="flex-1 text-center lg:text-left min-w-0 px-2">
          <h2 className="text-sm md:text-lg font-semibold text-gray-800 truncate">
            <span className="hidden sm:inline">Sistema de Gestão Empresarial — </span>Lince Track
          </h2>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={handleLogout}
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span className="hidden sm:inline">Sair</span>
            <span className="sm:hidden">🚪</span>
          </button>
        </div>
      </div>
    </header>
  )
}
