// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft } from 'lucide-react'
import { validateCPFCNPJ } from '@/lib/utils'

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    tipo_pessoa: 'Física',
    nome_razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    rg_inscricao_estadual: '',
    data_nascimento_abertura: '',
    email: '',
    telefone_principal: '',
    telefone_secundario: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    valor_mensalidade: '',
    dia_cobranca: '10',
    forma_pagamento_preferida: 'Boleto',
    observacoes_financeiras: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validar CPF/CNPJ
      if (!validateCPFCNPJ(formData.cpf_cnpj)) {
        throw new Error('CPF/CNPJ inválido')
      }

      // Preparar dados
      const clientData = {
        tipo_pessoa: formData.tipo_pessoa,
        nome_razao_social: formData.nome_razao_social,
        nome_fantasia: formData.nome_fantasia || null,
        cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ''),
        rg_inscricao_estadual: formData.rg_inscricao_estadual || null,
        data_nascimento_abertura: formData.data_nascimento_abertura || null,
        email: formData.email,
        telefone_principal: formData.telefone_principal.replace(/\D/g, ''),
        telefone_secundario: formData.telefone_secundario ? formData.telefone_secundario.replace(/\D/g, '') : null,
        cep: formData.cep.replace(/\D/g, ''),
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento || null,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf.toUpperCase(),
        valor_mensalidade: parseFloat(formData.valor_mensalidade),
        dia_cobranca: parseInt(formData.dia_cobranca),
        forma_pagamento_preferida: formData.forma_pagamento_preferida,
        observacoes_financeiras: formData.observacoes_financeiras || null,
        status: 'Ativo',
        situacao_assinatura: 'Ativa',
        metodo_cobranca: 'Manual',
      }

      // Inserir cliente
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (error) throw error

      // Redirecionar para o cliente criado
      router.push(`/clientes/${data.id}`)
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error)
      setError(error.message || 'Erro ao criar cliente')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/clientes')}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-gray-600">Cadastrar novo cliente</p>
        </div>
      </div>

      {error && (
        <Card>
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Pessoa */}
        <Card title="Tipo de Cadastro">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={formData.tipo_pessoa === 'Física' ? 'primary' : 'outline'}
              onClick={() => handleChange('tipo_pessoa', 'Física')}
            >
              Pessoa Física
            </Button>
            <Button
              type="button"
              variant={formData.tipo_pessoa === 'Jurídica' ? 'primary' : 'outline'}
              onClick={() => handleChange('tipo_pessoa', 'Jurídica')}
            >
              Pessoa Jurídica
            </Button>
          </div>
        </Card>

        {/* Dados Principais */}
        <Card title="Dados Principais">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={formData.tipo_pessoa === 'Física' ? 'Nome Completo' : 'Razão Social'}
              value={formData.nome_razao_social}
              onChange={(e) => handleChange('nome_razao_social', e.target.value)}
              required
            />

            {formData.tipo_pessoa === 'Jurídica' && (
              <Input
                label="Nome Fantasia"
                value={formData.nome_fantasia}
                onChange={(e) => handleChange('nome_fantasia', e.target.value)}
              />
            )}

            <Input
              label={formData.tipo_pessoa === 'Física' ? 'CPF' : 'CNPJ'}
              value={formData.cpf_cnpj}
              onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
              placeholder={formData.tipo_pessoa === 'Física' ? '000.000.000-00' : '00.000.000/0000-00'}
              required
            />

            <Input
              label={formData.tipo_pessoa === 'Física' ? 'RG' : 'Inscrição Estadual'}
              value={formData.rg_inscricao_estadual}
              onChange={(e) => handleChange('rg_inscricao_estadual', e.target.value)}
            />

            <Input
              label={formData.tipo_pessoa === 'Física' ? 'Data de Nascimento' : 'Data de Abertura'}
              type="date"
              value={formData.data_nascimento_abertura}
              onChange={(e) => handleChange('data_nascimento_abertura', e.target.value)}
            />
          </div>
        </Card>

        {/* Contato */}
        <Card title="Informações de Contato">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />

            <Input
              label="Telefone Principal"
              value={formData.telefone_principal}
              onChange={(e) => handleChange('telefone_principal', e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />

            <Input
              label="Telefone Secundário"
              value={formData.telefone_secundario}
              onChange={(e) => handleChange('telefone_secundario', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </Card>

        {/* Endereço */}
        <Card title="Endereço">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CEP"
              value={formData.cep}
              onChange={(e) => handleChange('cep', e.target.value)}
              placeholder="00000-000"
              required
            />

            <Input
              label="Logradouro"
              value={formData.logradouro}
              onChange={(e) => handleChange('logradouro', e.target.value)}
              required
            />

            <Input
              label="Número"
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              required
            />

            <Input
              label="Complemento"
              value={formData.complemento}
              onChange={(e) => handleChange('complemento', e.target.value)}
            />

            <Input
              label="Bairro"
              value={formData.bairro}
              onChange={(e) => handleChange('bairro', e.target.value)}
              required
            />

            <Input
              label="Cidade"
              value={formData.cidade}
              onChange={(e) => handleChange('cidade', e.target.value)}
              required
            />

            <Input
              label="UF"
              value={formData.uf}
              onChange={(e) => handleChange('uf', e.target.value)}
              placeholder="SP"
              maxLength={2}
              required
            />
          </div>
        </Card>

        {/* Dados Financeiros */}
        <Card title="Informações Financeiras">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Valor da Mensalidade"
              type="number"
              step="0.01"
              value={formData.valor_mensalidade}
              onChange={(e) => handleChange('valor_mensalidade', e.target.value)}
              placeholder="0.00"
              required
            />

            <Input
              label="Dia de Cobrança"
              type="number"
              min="1"
              max="28"
              value={formData.dia_cobranca}
              onChange={(e) => handleChange('dia_cobranca', e.target.value)}
              helperText="Entre 1 e 28"
              required
            />

            <Select
              label="Forma de Pagamento Preferida"
              value={formData.forma_pagamento_preferida}
              onChange={(e) => handleChange('forma_pagamento_preferida', e.target.value)}
              options={[
                { value: 'Boleto', label: 'Boleto' },
                { value: 'Pix', label: 'Pix' },
                { value: 'Cartão', label: 'Cartão' },
                { value: 'Transferência', label: 'Transferência' },
              ]}
            />

            <Input
              label="Observações Financeiras"
              value={formData.observacoes_financeiras}
              onChange={(e) => handleChange('observacoes_financeiras', e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/clientes')}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Salvando...' : 'Cadastrar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  )
}
