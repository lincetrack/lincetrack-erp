# 📋 Próximos Passos - Lince Track ERP

Este documento lista as páginas e funcionalidades que ainda precisam ser implementadas para completar o sistema.

## ✅ Já Implementado

- [x] Estrutura base do projeto Next.js 14
- [x] Schema SQL completo do banco de dados
- [x] Tipos TypeScript e cliente Supabase
- [x] Componentes UI base (Button, Input, Card, Table, Modal, Select, Badge)
- [x] Sistema de autenticação (login)
- [x] Middleware de proteção de rotas
- [x] Layout do dashboard com sidebar
- [x] Dashboard principal com métricas
- [x] Listagem de clientes
- [x] Edge Function de cobrança recorrente automática
- [x] Documentação completa (README.md)

## 🚧 Pendente de Implementação

### 1. Formulário de Cadastro de Cliente

**Arquivo:** `app/(dashboard)/clientes/novo/page.tsx`

Criar formulário completo com abas para:

- Dados principais (nome, CPF/CNPJ, tipo pessoa)
- Endereço (CEP com autocomplete, logradouro, número, cidade, UF)
- Contato (email, telefones, preferências de notificação)
- Dados financeiros (valor mensalidade, dia cobrança, forma pagamento)
- Observações

**Features:**
- Validação de CPF/CNPJ em tempo real
- Integração com API ViaCEP
- Máscaras de entrada (CPF, CNPJ, telefone, CEP)
- Validação de formulário com Zod

### 2. Formulário de Edição de Cliente

**Arquivo:** `app/(dashboard)/clientes/[id]/editar/page.tsx`

Similar ao cadastro, mas carregando dados existentes.

### 3. Página de Detalhes do Cliente

**Arquivo:** `app/(dashboard)/clientes/[id]/page.tsx`

Exibir:
- Todos os dados do cliente
- Lista de veículos vinculados
- Histórico de faturas
- Status da assinatura
- Botões de ação (editar, desativar, gerar fatura manual)

### 4. CRUD de Veículos

**Arquivos:**
- `app/(dashboard)/veiculos/page.tsx` - Listagem
- `app/(dashboard)/veiculos/novo/page.tsx` - Cadastro
- `app/(dashboard)/veiculos/[id]/editar/page.tsx` - Edição

**Campos do formulário:**
- Cliente (select)
- Placa (máscara AAA0A00)
- Modelo, marca, ano
- IMEI do rastreador (15 dígitos, obrigatório)
- Número do chip (obrigatório)
- Operadora do chip
- Status ativo/inativo
- Observações

### 5. Módulo de Faturas

**Arquivos:**
- `app/(dashboard)/faturas/page.tsx` - Listagem com filtros
- `app/(dashboard)/faturas/[id]/page.tsx` - Detalhes da fatura

**Funcionalidades:**
- Listagem com filtros (status, período, cliente)
- Marcar como pago manualmente
- Cancelar fatura
- Gerar segunda via
- Exportar PDF/boleto (futuro)
- Enviar por email (futuro)

### 6. Registrar Pagamento

**Arquivo:** `app/(dashboard)/faturas/[id]/pagar/page.tsx`

Formulário para registrar pagamento:
- Data do pagamento
- Valor pago
- Forma de pagamento
- Observações

### 7. Módulo de Despesas

**Arquivos:**
- `app/(dashboard)/despesas/page.tsx` - Listagem
- `app/(dashboard)/despesas/nova/page.tsx` - Cadastro
- `app/(dashboard)/despesas/[id]/editar/page.tsx` - Edição

**Campos:**
- Título/descrição
- Categoria (select: combustível, manutenção, salários, etc.)
- Valor
- Data de vencimento
- Data de pagamento (opcional)
- Status (pendente, pago, vencido)
- Observações

### 8. Relatórios

**Arquivo:** `app/(dashboard)/relatorios/page.tsx`

Implementar relatórios:
- Faturamento por período
- Clientes inadimplentes
- Despesas por categoria
- Lucro/prejuízo mensal
- Ranking de clientes por valor
- Exportação para Excel/CSV

### 9. Configurações

**Arquivo:** `app/(dashboard)/configuracoes/page.tsx`

Abas de configuração:
- Perfil do usuário
- Dados da empresa
- Categorias de despesas
- Templates de email (futuro)
- Integrações (futuro)

### 10. Gestão de Usuários (Admin)

**Arquivos:**
- `app/(dashboard)/usuarios/page.tsx` - Listagem
- `app/(dashboard)/usuarios/novo/page.tsx` - Cadastro

Criar e gerenciar usuários com diferentes permissões.

### 11. API Routes

Criar rotas de API necessárias:

**`app/api/cron/billing/route.ts`**
```typescript
// Rota para Vercel Cron Jobs chamar a Edge Function
```

**`app/api/cep/[cep]/route.ts`**
```typescript
// Proxy para ViaCEP API
```

**`app/api/clients/[id]/generate-invoice/route.ts`**
```typescript
// Gerar fatura manualmente para um cliente
```

### 12. Melhorias nos Componentes

**Criar componentes adicionais:**

- `components/clients/ClientForm.tsx` - Formulário reutilizável de cliente
- `components/vehicles/VehicleForm.tsx` - Formulário de veículo
- `components/invoices/InvoiceCard.tsx` - Card de fatura
- `components/dashboard/MetricCard.tsx` - Card de métrica reutilizável
- `components/ui/DatePicker.tsx` - Seletor de data
- `components/ui/Tabs.tsx` - Componente de abas
- `components/ui/Alert.tsx` - Alertas e notificações
- `components/ui/Pagination.tsx` - Paginação de tabelas

### 13. Validações e Schemas Zod

**Arquivo:** `lib/validations.ts`

Criar schemas de validação para:
- Cliente (PF e PJ)
- Veículo
- Fatura
- Despesa
- Pagamento

### 14. Hooks Personalizados

**Arquivo:** `hooks/useClients.ts`, etc.

Criar hooks para:
- `useClients()` - CRUD de clientes
- `useVehicles()` - CRUD de veículos
- `useInvoices()` - Gestão de faturas
- `useExpenses()` - Gestão de despesas
- `useDashboard()` - Métricas do dashboard

### 15. Testes

Implementar testes:
- Testes unitários para validações (CPF/CNPJ)
- Testes de integração para CRUD
- Testes E2E para fluxos principais

## 📝 Exemplo de Implementação

### Formulário de Cliente (Exemplo)

```typescript
// app/(dashboard)/clientes/novo/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { validateCPFCNPJ } from '@/lib/utils'

const clientSchema = z.object({
  tipo_pessoa: z.enum(['Física', 'Jurídica']),
  nome_razao_social: z.string().min(3, 'Nome obrigatório'),
  cpf_cnpj: z.string().refine(validateCPFCNPJ, 'CPF/CNPJ inválido'),
  email: z.string().email('Email inválido'),
  telefone_principal: z.string().min(10, 'Telefone obrigatório'),
  valor_mensalidade: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dia_cobranca: z.number().min(1).max(28),
  // ... outros campos
})

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema)
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('clients').insert(data)
      if (error) throw error

      router.push('/clientes')
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Implementar formulário completo */}
    </form>
  )
}
```

## 🎯 Prioridades

1. **Alta Prioridade:**
   - Formulário de cadastro e edição de cliente
   - Página de detalhes do cliente
   - CRUD de veículos
   - Módulo de faturas completo

2. **Média Prioridade:**
   - Módulo de despesas
   - Relatórios básicos
   - Configurações de usuário

3. **Baixa Prioridade:**
   - Gestão de usuários
   - Relatórios avançados
   - Integrações externas

## 📚 Recursos Úteis

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

**Nota:** Este documento serve como guia para continuar o desenvolvimento do sistema. Cada item pode ser desenvolvido de forma independente.
