# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor de desenvolvimento (http://localhost:3000)
npm run build        # Build de produção
npm run start        # Executar build de produção
npm run lint         # Executar ESLint
npm run type-check   # Verificar tipos TypeScript

# Testes e Debug
node test-supabase-connection.js  # Testar conexão com Supabase e verificar usuário

# Limpeza (se houver problemas de cache)
rm -rf .next         # Limpar cache do Next.js
npm install          # Reinstalar dependências
```

## Arquitetura do Sistema

### Stack Tecnológica
- **Frontend**: Next.js 14 (App Router) com TypeScript
- **Styling**: Tailwind CSS com design system customizado
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Autenticação**: Supabase Auth com Server Actions
- **Deployment**: Vercel

### Estrutura de Autenticação

**IMPORTANTE**: Este projeto usa **Server Actions** para autenticação (não client-side):

- **Login**: Implementado via Server Action em `app/login/actions.ts`
- **Middleware**: `middleware.ts` protege rotas autenticadas
- **Cliente Supabase**:
  - `lib/supabase/server.ts` → Para Server Components e Server Actions
  - `lib/supabase/client.ts` → Para Client Components (apenas leitura)

**Padrão de Login**:
```typescript
// ✅ CORRETO - Server Action
'use server'
import { createClient } from '@/lib/supabase/server'
export async function loginAction(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

// ❌ ERRADO - Client-side direto (não compartilha cookies com middleware)
const { data } = await supabase.auth.signInWithPassword({ email, password })
router.push('/dashboard') // Não funciona - middleware não detecta sessão
```

### Estrutura do Banco de Dados

**Schema Principal** (`supabase/schema.sql`):

1. **profiles** - Perfis de usuários vinculados a auth.users
   - Roles: `admin`, `finance`, `operational`, `commercial`
   - Foreign key para `auth.users(id)`

2. **clients** - Cadastro completo de clientes (PF/PJ)
   - Dados pessoais/empresariais
   - Endereço completo
   - Dados financeiros (mensalidade, dia cobrança)
   - Assinatura (ativa/pausada/cancelada)

3. **vehicles** - Veículos vinculados aos clientes
   - IMEI do rastreador (obrigatório, 15 dígitos)
   - Chip e operadora
   - Placa, modelo, marca, ano

4. **subscriptions** - Assinaturas de clientes
   - Ciclo de cobrança (mensal)
   - Próxima data de cobrança
   - Status (active/paused/cancelled)

5. **invoices** - Faturas geradas
   - Vinculadas a cliente e assinatura
   - Status: pending, paid, overdue, cancelled
   - Metadata JSONB para informações adicionais

6. **payments** - Pagamentos de faturas
   - Vinculados a invoices
   - Provider (gateway de pagamento)
   - Status de pagamento

7. **expenses** - Despesas da empresa
   - Categorias customizadas
   - Status: pending, paid, overdue

8. **audit_logs** - Auditoria de alterações
   - Registra todas as mudanças críticas
   - Quem fez, quando, o quê

**Views Importantes**:
- `v_financial_dashboard` - Métricas consolidadas do dashboard
  - MRR (Monthly Recurring Revenue)
  - Receitas e despesas do mês
  - Inadimplência
  - Clientes ativos/inativos

**Functions**:
- `update_overdue_invoices()` - Atualiza status de faturas vencidas
- Executada pela Edge Function de cobrança automática

### Cobrança Recorrente Automática

**Edge Function**: `supabase/functions/cron-billing/index.ts`

**Fluxo**:
1. Executada diariamente (via Vercel Cron ou GitHub Actions)
2. Busca assinaturas ativas com data de cobrança <= hoje
3. Cria fatura para o cliente
4. Atualiza próxima data de cobrança (+1 mês)
5. Atualiza faturas vencidas

**Deploy da função**:
```bash
supabase functions deploy cron-billing --project-ref seu-project-ref
```

**Configuração de variáveis** (no painel Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Organização de Rotas

**Estrutura App Router**:
```
app/
├── login/
│   ├── page.tsx         # Página de login
│   └── actions.ts       # Server Action de autenticação
├── (dashboard)/         # Grupo de rotas autenticadas
│   ├── layout.tsx       # Layout com sidebar e navegação
│   ├── dashboard/       # Dashboard principal
│   ├── clientes/        # CRUD de clientes
│   ├── veiculos/        # CRUD de veículos (404 - precisa criar)
│   ├── faturas/         # Gerenciamento de faturas (404 - precisa criar)
│   └── despesas/        # Controle de despesas (404 - precisa criar)
├── api/
│   └── auth/
│       └── login/
│           └── route.ts # API route de login (alternativa)
└── middleware.ts        # Proteção de rotas
```

### Componentes UI Reutilizáveis

**Localização**: `components/ui/`

- **Button**: Variantes (primary, secondary, outline, ghost, danger), tamanhos (sm, md, lg)
- **Input**: Labels, erros, helper text, validação inline
- **Card**: Título, descrição, footer opcional
- **Table**: Tabela responsiva com paginação
- **Modal**: Dialog para confirmações e formulários
- **Select**: Dropdown customizado
- **Badge**: Indicadores de status/tags

**Padrão de uso**:
```tsx
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

<Card title="Título" description="Descrição">
  <Input label="Email" type="email" required />
  <Button variant="primary" size="lg">Enviar</Button>
</Card>
```

### Utilitários e Helpers

**Localização**: `lib/utils.ts`

**Formatação**:
- `formatCurrency(value: number)` → R$ 1.234,56
- `formatDate(date: string | Date)` → DD/MM/AAAA
- `formatCPF(cpf: string)` → 123.456.789-00
- `formatCNPJ(cnpj: string)` → 12.345.678/0001-00
- `formatCPFCNPJ(value: string)` → Detecta e formata
- `formatPhone(phone: string)` → (12) 34567-8900
- `formatCEP(cep: string)` → 12345-678

**Validação**:
- `validateCPF(cpf: string)` → boolean
- `validateCNPJ(cnpj: string)` → boolean
- `validateCPFCNPJ(value: string)` → boolean

**Styling**:
- `cn(...inputs)` → Combina classes Tailwind com clsx + tailwind-merge

### Padrão de Desenvolvimento

**Fetching de Dados**:
```tsx
// ✅ Em Server Components
import { createClient } from '@/lib/supabase/server'

async function getData() {
  const supabase = createClient()
  const { data } = await supabase.from('clients').select('*')
  return data
}

// ✅ Em Client Components
'use client'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

useEffect(() => {
  async function fetchData() {
    const { data } = await supabase.from('clients').select('*')
    setData(data)
  }
  fetchData()
}, [])
```

**Mutations (Criar/Atualizar/Deletar)**:
```tsx
// ✅ SEMPRE use Server Actions para mutations
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClient(formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').insert({...})
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}
```

### Configuração do Tailwind

**Cores Customizadas**: Sistema de design com variáveis CSS (HSL)

- `background`, `foreground` - Cores base
- `primary`, `secondary` - Cores principais
- `muted`, `accent` - Cores de suporte
- `destructive` - Ações destrutivas
- `border`, `input`, `ring` - Elementos de UI
- Suporte a dark mode (`.dark` class)

**Border Radius**: Variáveis customizadas (`--radius`)

### Variáveis de Ambiente

**Arquivo**: `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### TypeScript e Tipos

**Database Types**: `types/database.types.ts`

- Gerados automaticamente do schema Supabase
- Tipos para todas as tabelas (Row, Insert, Update)
- Enums para status, roles, etc.

**Uso**:
```typescript
import type { Database } from '@/types/database.types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
```

### Permissões (RBAC)

**Roles disponíveis**:
- `admin` - Acesso total
- `finance` - Faturas, pagamentos, despesas, relatórios financeiros
- `commercial` - Clientes, contratos, métricas
- `operational` - Veículos, monitoramento, suporte

**Row Level Security (RLS)**: Todas as tabelas têm policies baseadas no role do usuário

### Páginas que Precisam ser Criadas

Com base nos logs, as seguintes páginas retornam 404 e precisam ser implementadas:

1. **Veículos** (`app/(dashboard)/veiculos/page.tsx`)
   - Listagem de veículos
   - Filtros por cliente, IMEI, placa
   - CRUD completo

2. **Faturas** (`app/(dashboard)/faturas/page.tsx`)
   - Listagem de faturas
   - Filtros por status, cliente, período
   - Baixa manual de faturas
   - Envio de boletos/links de pagamento

3. **Despesas** (`app/(dashboard)/despesas/page.tsx`)
   - Listagem de despesas
   - Categorização
   - Controle de pagamentos

4. **Configurações** (`app/(dashboard)/configuracoes/page.tsx`)
   - Perfil do usuário
   - Configurações do sistema
   - Gerenciamento de usuários (apenas admin)

### Troubleshooting Comum

**Problema: Erro 307 no login**
- Causa: Cookies não sendo compartilhados entre client e server
- Solução: Sempre use Server Actions para autenticação

**Problema: "border-border class does not exist"**
- Causa: Tailwind não configurado com cores CSS customizadas
- Solução: Verificar `tailwind.config.ts` tem todas as cores HSL

**Problema: Cache corrompido do Next.js**
- Solução: `rm -rf .next && npm run dev`

**Problema: Usuário não consegue logar**
- Verificar se existe na tabela `profiles`
- Verificar se email está confirmado
- Usar `node test-supabase-connection.js` para debug

### Padrão de Commits

Não há convenção específica definida no projeto. Siga boas práticas:
- Mensagens claras e descritivas
- Prefixos opcionais: `feat:`, `fix:`, `chore:`, `docs:`

### Dados Brasileiros

O sistema é otimizado para o Brasil:
- Validação de CPF/CNPJ
- Formato de telefone brasileiro
- CEP
- Estados (UF) com 2 caracteres
- Moeda: R$ (BRL)
- Data: DD/MM/AAAA
- Timezone: América/São Paulo (implícito)

### Recursos Avançados

**Auditoria**: Todas as operações críticas são registradas em `audit_logs`

**Soft Delete**: Alguns registros usam status em vez de exclusão física

**Validações no Banco**: Constraints e checks garantem integridade dos dados
- CPF/CNPJ único
- IMEI com 15 dígitos
- Placa com 7 caracteres
- Valores > 0
- Datas válidas

### Links Úteis

- [Documentação Next.js 14](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
