export interface Veiculo {
  id: string
  veiculo: string
  placa: string
  tipo_rastreador: string
  imei: string
  com_bloqueio: boolean
  numero_chip: string
}

export interface Cliente {
  id: string
  nome: string
  cnpj: string
  telefone: string
  email?: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep?: string
  valor_mensalidade: number
  dia_vencimento: string
  ativo: boolean
  login_plataforma?: string
  veiculos: Veiculo[]
  created_at: string
  updated_at: string
}

export interface Fatura {
  id: string
  cliente_id: string
  cliente_nome: string
  descricao: string
  valor: number
  data_vencimento: string
  data_emissao: string
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  enviado_whatsapp: boolean
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Despesa {
  id: string
  descricao: string
  categoria: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'atrasado'
  fornecedor?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  email: string
  nome: string
  role: 'admin' | 'financeiro' | 'operacional'
  created_at: string
}
