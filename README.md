# 🚗 Lince Track ERP - Sistema de Rastreamento Veicular

Sistema ERP completo para gestão de empresas de rastreamento veicular, com cadastro de clientes (PF/PJ), veículos, cobrança recorrente automática, controle financeiro e dashboards.

## 📋 Índice

- [Características](#características)
- [Stack Tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração do Supabase](#configuração-do-supabase)
- [Deploy na Vercel](#deploy-na-vercel)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [API e Edge Functions](#api-e-edge-functions)
- [Permissões (RBAC)](#permissões-rbac)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

## ✨ Características

- ✅ Cadastro completo de clientes (Pessoa Física e Jurídica) no padrão brasileiro
- ✅ Gerenciamento de veículos com IMEI e chip
- ✅ Sistema de assinaturas e cobrança recorrente automática
- ✅ Controle financeiro (contas a pagar, receber, despesas)
- ✅ Dashboard com métricas em tempo real (MRR, inadimplência, lucro)
- ✅ Sistema de permissões (RBAC) com 4 níveis de acesso
- ✅ Relatórios e exportações
- ✅ Auditoria completa de alterações
- ✅ Interface responsiva e moderna
- ✅ Validação de CPF/CNPJ e dados brasileiros

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Hospedagem:** Vercel
- **Autenticação:** Supabase Auth
- **Banco de Dados:** PostgreSQL (Supabase)
- **Icons:** Lucide React

## 📦 Pré-requisitos

- Node.js 18+ e npm/yarn
- Conta no [Supabase](https://supabase.com/)
- Conta no [Vercel](https://vercel.com/) (opcional, para deploy)
- Git

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd lince-track-erp
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ Configuração do Supabase

### 1. Criar projeto no Supabase

1. Acesse [https://supabase.com/](https://supabase.com/)
2. Crie um novo projeto
3. Anote a `URL` e a `anon key` do projeto

### 2. Executar o schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase/schema.sql`
3. Cole no editor e execute
4. Aguarde a criação de todas as tabelas, funções e policies

### 3. Criar primeiro usuário admin

1. No Supabase, vá em **Authentication > Users**
2. Clique em "Add user" e crie um usuário
3. Copie o ID do usuário criado
4. No SQL Editor, execute:

```sql
INSERT INTO profiles (id, full_name, role)
VALUES ('cole-o-id-do-usuario-aqui', 'Administrador', 'admin');
```

### 4. Configurar Edge Functions (Cobrança Automática)

#### Instalar Supabase CLI

```bash
npm install -g supabase
```

#### Login no Supabase

```bash
supabase login
```

#### Fazer deploy da função de cobrança

```bash
supabase functions deploy cron-billing --project-ref seu-project-ref
```

#### Configurar variáveis de ambiente na Edge Function

No painel do Supabase:

1. Vá em **Edge Functions > cron-billing**
2. Adicione as variáveis:
   - `SUPABASE_URL`: URL do seu projeto
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key

### 5. Configurar Cron Job (Execução Diária)

Você pode configurar a execução automática de 3 formas:

#### Opção 1: Vercel Cron Jobs (Recomendado)

Crie o arquivo `vercel.json` na raiz do projeto:

```json
{
  "crons": [
    {
      "path": "/api/cron/billing",
      "schedule": "0 9 * * *"
    }
  ]
}
```

E crie o arquivo `app/api/cron/billing/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  // Validar token de segurança
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cron-billing`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

#### Opção 2: GitHub Actions

Crie `.github/workflows/cron-billing.yml`:

```yaml
name: Daily Billing Cron

on:
  schedule:
    - cron: '0 9 * * *' # Todos os dias às 9h UTC

jobs:
  run-billing:
    runs-on: ubuntu-latest
    steps:
      - name: Call billing function
        run: |
          curl -X POST \
            ${{ secrets.SUPABASE_URL }}/functions/v1/cron-billing \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}"
```

#### Opção 3: Supabase Database Webhooks

Configure um webhook no Supabase para executar a função periodicamente usando pg_cron.

## 🌐 Deploy na Vercel

### 1. Conectar repositório

1. Acesse [vercel.com](https://vercel.com/)
2. Clique em "New Project"
3. Importe seu repositório Git

### 2. Configurar variáveis de ambiente

Na Vercel, adicione as seguintes variáveis:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `CRON_SECRET` (gere uma string aleatória segura)

### 3. Deploy

Clique em "Deploy" e aguarde o build.

## 📁 Estrutura do Projeto

```
lince-track-erp/
├── app/
│   ├── (dashboard)/          # Rotas autenticadas
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── clientes/         # CRUD de clientes
│   │   ├── veiculos/         # CRUD de veículos
│   │   ├── faturas/          # Gerenciamento de faturas
│   │   ├── despesas/         # Controle de despesas
│   │   └── layout.tsx        # Layout do dashboard
│   ├── login/                # Página de login
│   ├── globals.css           # Estilos globais
│   ├── layout.tsx            # Layout raiz
│   └── page.tsx              # Página inicial
├── components/
│   └── ui/                   # Componentes reutilizáveis
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Table.tsx
│       ├── Modal.tsx
│       ├── Select.tsx
│       └── Badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Cliente Supabase (client-side)
│   │   └── server.ts         # Cliente Supabase (server-side)
│   └── utils.ts              # Funções utilitárias
├── types/
│   └── database.types.ts     # Tipos TypeScript do banco
├── supabase/
│   ├── schema.sql            # Schema completo do banco
│   └── functions/
│       └── cron-billing/     # Edge Function de cobrança
│           └── index.ts
├── middleware.ts             # Middleware de autenticação
├── .env.example              # Exemplo de variáveis
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🎯 Funcionalidades

### 1. Cadastro de Clientes

- Cadastro completo de Pessoa Física e Jurídica
- Validação de CPF/CNPJ
- Endereço completo com CEP
- Dados financeiros (valor mensalidade, dia de cobrança)
- Preferências de notificação
- Status da assinatura

### 2. Gestão de Veículos

- Vinculação de veículos ao cliente
- Cadastro de IMEI do rastreador (obrigatório)
- Número do chip e operadora
- Placa, modelo, marca e ano

### 3. Cobrança Recorrente

- Geração automática de faturas mensais
- Cálculo automático da próxima cobrança
- Atualização de status (pendente, pago, vencido)
- Suporte a diferentes formas de pagamento

### 4. Financeiro

- Controle de faturas (a receber)
- Gestão de despesas (a pagar)
- Registros de pagamentos
- Cálculo de MRR (Monthly Recurring Revenue)
- Relatórios de lucro/prejuízo

### 5. Dashboard

- Métricas em tempo real
- MRR e previsão de receita
- Inadimplência e faturas vencidas
- Despesas do mês
- Lucro líquido
- Gráficos e indicadores

### 6. Relatórios

- Exportação de dados
- Filtros avançados
- Listagens personalizadas
- Histórico de transações

## 🔐 Permissões (RBAC)

O sistema possui 4 níveis de acesso:

### Admin
- Acesso total ao sistema
- Gerenciamento de usuários
- Configurações globais

### Finance (Financeiro)
- Faturas e cobranças
- Pagamentos e despesas
- Relatórios financeiros

### Commercial (Comercial)
- Cadastro de clientes
- Gestão de contratos
- Visualização de métricas

### Operational (Operacional)
- Cadastro de veículos
- Monitoramento
- Suporte técnico

## 💻 Desenvolvimento

### Executar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Build de produção

```bash
npm run build
npm run start
```

### Verificação de tipos

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 🧪 Testes

### Executar testes

```bash
npm run test
```

### Testar Edge Function localmente

```bash
supabase functions serve cron-billing
```

Fazer requisição:

```bash
curl -X POST http://localhost:54321/functions/v1/cron-billing \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 🐛 Troubleshooting

### Erro de conexão com Supabase

- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo
- Teste a conexão no painel do Supabase

### Edge Function não executa

- Verifique se o deploy foi feito corretamente
- Confirme as variáveis de ambiente na função
- Veja os logs no painel do Supabase

### Erro de permissão (RLS)

- Verifique se o usuário tem perfil criado na tabela `profiles`
- Confirme que as policies RLS estão ativas
- Execute as queries SQL de permissões novamente

### Faturas não são geradas automaticamente

- Verifique se o cron job está configurado
- Confirme se há assinaturas ativas
- Veja os logs da Edge Function

## 📞 Suporte

Para suporte e dúvidas:

- Abra uma issue no repositório
- Consulte a documentação do Supabase
- Verifique os logs no Vercel/Supabase

## 📄 Licença

Este projeto é proprietário e confidencial.

---

**Desenvolvido com Next.js, Supabase e TypeScript**

🚀 **Lince Track ERP - Gestão completa de rastreamento veicular**
