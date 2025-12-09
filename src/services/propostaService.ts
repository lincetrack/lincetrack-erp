import { PropostaComercial } from '@/types'

const STORAGE_KEY = 'lince-track-propostas'

class PropostaService {
  private getAll(): PropostaComercial[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private save(propostas: PropostaComercial[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(propostas))
  }

  async getAllPropostas(): Promise<PropostaComercial[]> {
    return this.getAll()
  }

  async getPropostaById(id: string): Promise<PropostaComercial | null> {
    const propostas = this.getAll()
    return propostas.find(p => p.id === id) || null
  }

  async createProposta(proposta: Omit<PropostaComercial, 'id' | 'numero_proposta' | 'created_at' | 'updated_at'>): Promise<PropostaComercial> {
    const propostas = this.getAll()

    const maxNumero = propostas.length > 0
      ? Math.max(...propostas.map(p => p.numero_proposta))
      : 0

    const novaProposta: PropostaComercial = {
      ...proposta,
      id: Date.now().toString(),
      numero_proposta: maxNumero + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    propostas.push(novaProposta)
    this.save(propostas)
    return novaProposta
  }

  async updateProposta(id: string, data: Partial<PropostaComercial>): Promise<PropostaComercial | null> {
    const propostas = this.getAll()
    const index = propostas.findIndex(p => p.id === id)

    if (index === -1) return null

    propostas[index] = {
      ...propostas[index],
      ...data,
      updated_at: new Date().toISOString()
    }

    this.save(propostas)
    return propostas[index]
  }

  async deleteProposta(id: string): Promise<boolean> {
    const propostas = this.getAll()
    const filtered = propostas.filter(p => p.id !== id)

    if (filtered.length === propostas.length) return false

    this.save(filtered)
    return true
  }

  async updateStatus(id: string, status: PropostaComercial['status']): Promise<PropostaComercial | null> {
    return this.updateProposta(id, { status })
  }
}

export const propostaService = new PropostaService()
