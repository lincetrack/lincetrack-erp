'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { loginAction } from './actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔐 Tentando fazer login com:', email)

      const result = await loginAction(email, password)

      if (result?.error) {
        console.error('❌ Erro no login:', result.error)
        setError(result.error)
        setLoading(false)
      }
      // Se não houver erro, o redirect() na action vai redirecionar automaticamente
    } catch (error: any) {
      console.error('❌ Erro capturado:', error)
      setError(error.message || 'Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Lince Track ERP
          </h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">
            Sistema de Rastreamento Veicular
          </h2>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Fazer Login
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />

                <Input
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Sistema desenvolvido para gestão de rastreamento veicular
        </p>
      </div>
    </div>
  )
}
