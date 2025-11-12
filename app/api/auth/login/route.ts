import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('🔐 [API] Tentando fazer login com:', email)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ [API] Erro no login:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    console.log('✅ [API] Login bem-sucedido! Usuário:', data.user?.email)

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })
  } catch (error: any) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
