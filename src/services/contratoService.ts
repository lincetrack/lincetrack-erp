import { supabase } from '@/lib/supabase'
import { Contrato } from '@/types'

export const contratoService = {
  async getAll(): Promise<Contrato[]> {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .order('numero_contrato', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(contrato: Omit<Contrato, 'id' | 'numero_contrato' | 'created_at' | 'updated_at'>): Promise<Contrato> {
    const { data, error } = await supabase
      .from('contratos')
      .insert([contrato])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateStatus(id: string, status: Contrato['status']): Promise<void> {
    const { error } = await supabase
      .from('contratos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateOverdue(): Promise<void> {
    const hoje = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('contratos')
      .update({ status: 'vencido', updated_at: new Date().toISOString() })
      .eq('status', 'ativo')
      .lt('data_vencimento', hoje)
    if (error) console.error('Erro ao atualizar contratos vencidos:', error)
  }
}
