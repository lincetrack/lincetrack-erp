# Lince Track ERP — CLAUDE.md

## Visão Geral

ERP financeiro para empresas de rastreamento veicular. Gerencia clientes, faturas, despesas, propostas comerciais, relatórios e aniversariantes.

**Stack**: Next.js 14 (Pages Router) · React 18 · TypeScript · Supabase (PostgreSQL) · Tailwind CSS · React Query · Recharts · jsPDF · html2canvas

---

## Estrutura do Projeto

```
lincetrack-erp/
├── src/
│   ├── pages/          # Rotas Next.js (Pages Router)
│   ├── components/     # Componentes React reutilizáveis
│   ├── hooks/          # Custom hooks
│   ├── services/       # Camada de acesso a dados (Supabase)
│   ├── types/          # Tipos TypeScript globais
│   ├── utils/          # Funções utilitárias
│   ├── lib/            # Inicialização de bibliotecas (supabase.ts)
│   └── styles/         # CSS global
├── supabase-schema.sql              # Schema principal do banco
├── supabase-migration-*.sql         # Migrations históricas
└── VALIDACAO-DATABASE.md            # Checklist de validação do banco
```

---

## Módulos Funcionais

| Módulo | Status | Rota |
|--------|--------|------|
| Dashboard | Completo | `/dashboard` |
| Faturas | Completo | `/faturas` |
| Despesas | Completo | `/despesas` |
| Clientes | Completo | `/clientes` |
| Propostas Comerciais | Completo | `/propostas` |
| Aniversariantes | Completo | `/aniversariantes` |
| Relatórios | Completo | `/relatorios` |
| Autenticação | Completo | `/login` |
| Vendas | Stub | `/vendas` |
| Produtos | Stub | `/produtos` |
| Estoque | Stub | `/estoque` |

---

## Arquitetura e Padrões

### Fluxo de dados
```
Supabase DB → services/*.ts → páginas/componentes → React Query (cache)
```

### Camada de serviços (`src/services/`)
Cada entidade tem seu próprio service file com métodos CRUD:
- `clienteService.ts` — clientes + veículos (relação)
- `veiculoService.ts` — veículos por cliente
- `faturaService.ts` — faturas com filtros de mês, status, cliente
- `despesaService.ts` — despesas com categorias e filtros
- `propostaService.ts` — propostas com fallback para localStorage

### Tipos globais (`src/types/index.ts`)
Entidades principais: `Cliente`, `Veiculo`, `Fatura`, `Despesa`, `PropostaComercial`, `Usuario`

### Path alias
`@/*` aponta para `./src/*` (configurado em tsconfig.json)

---

## Banco de Dados (Supabase/PostgreSQL)

### Tabelas principais
- **clientes** — dados cadastrais + financeiros (mensalidade, vencimento)
- **veiculos** — FK para clientes (CASCADE), rastreadores IMEI/placa
- **faturas** — status: `pendente | pago | atrasado | cancelado`
- **despesas** — status: `pendente | pago | atrasado`; 11 categorias
- **propostas_comerciais** — status: `pendente | enviada | aprovada | recusada`

### Views disponíveis
- `v_clientes_resumo` — clientes + contagem de veículos
- `v_faturas_detalhadas` — faturas + dados do cliente
- `v_resumo_financeiro_mensal` — resumo financeiro por mês
- `v_despesas_por_categoria` — despesas agrupadas por categoria

### Segurança
RLS (Row Level Security) habilitado em todas as tabelas. Acesso apenas para usuários autenticados.

---

## Utilitários (`src/utils/formatters.ts`)

- `formatCurrency()` — formato BRL (R$)
- `formatDate()` — YYYY-MM-DD → DD/MM/YYYY
- `formatPhone()` — formatação de telefone
- `formatCNPJ()` — formatação de CNPJ
- `generateWhatsappLink()` — gera link WhatsApp com mensagem

---

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Comandos de Desenvolvimento

```bash
npm install          # Instalar dependências
npm run dev          # Servidor de desenvolvimento (porta 3000)
npm run build        # Build de produção
npm run lint         # ESLint
```

---

## Convenções

- **Componentes**: PascalCase, um arquivo por componente
- **Serviços**: camelCase, métodos assíncronos com try/catch
- **Tipos**: definidos em `src/types/index.ts`, exportados globalmente
- **Estilização**: Tailwind utility-first; sem CSS modules
- **Impressão**: estilos `@media print` em `globals.css` para relatórios/faturas
- **PDF**: gerado via html2canvas + jsPDF nos modais de fatura e proposta

---

## Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| next | 14.0.4 | Framework |
| react | 18.2.0 | UI |
| @supabase/supabase-js | 2.39.0 | Banco de dados |
| @tanstack/react-query | 5.17.0 | Cache de dados |
| zustand | 4.4.7 | Estado global |
| recharts | 2.10.3 | Gráficos no dashboard |
| jspdf | 3.0.4 | Geração de PDF |
| html2canvas | 1.4.1 | Captura de tela para PDF |
| tailwindcss | 3.3.0 | Estilos |
