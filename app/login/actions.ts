'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(email: string, password: string) {
  const supabase = createClient()

  console.log('🔐 [Server Action] Tentando fazer login com:', email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('❌ [Server Action] Erro no login:', error.message)
    return { error: error.message }
  }

  console.log('✅ [Server Action] Login bem-sucedido! Usuário:', data.user?.email)
  console.log('🔑 [Server Action] Sessão criada')

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
