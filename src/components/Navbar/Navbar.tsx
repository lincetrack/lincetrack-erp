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
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Bem-vindo ao Sistema
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
