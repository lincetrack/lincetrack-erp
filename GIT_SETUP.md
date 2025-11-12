# 🔧 Setup Git - Lince Track ERP

## Inicializar Repositório Git

Se ainda não foi inicializado:

```bash
cd lince-track-erp
git init
```

## Criar Primeiro Commit

```bash
# Adicionar todos os arquivos
git add .

# Criar commit inicial
git commit -m "Initial commit - Lince Track ERP

- Sistema completo de rastreamento veicular
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + Edge Functions)
- Cadastro de clientes PF/PJ completo
- Dashboard com métricas em tempo real
- Cobrança recorrente automática
- Sistema de permissões (RBAC)
- Documentação completa

🚀 Generated with Claude Code"
```

## Criar Repositório no GitHub

### Opção 1: Via Interface Web

1. Acesse https://github.com/new
2. Nome: `lince-track-erp`
3. Descrição: "Sistema ERP de Rastreamento Veicular"
4. Privado ou Público (recomendo Privado)
5. **NÃO** inicialize com README, .gitignore ou licença
6. Criar repositório

### Opção 2: Via GitHub CLI

```bash
# Instalar GitHub CLI (se não tiver)
# Windows: winget install GitHub.cli
# Mac: brew install gh

gh auth login
gh repo create lince-track-erp --private --source=. --remote=origin
```

## Conectar Repositório Local ao GitHub

```bash
# Adicionar remote
git remote add origin https://github.com/SEU-USUARIO/lince-track-erp.git

# Verificar
git remote -v

# Push inicial
git branch -M main
git push -u origin main
```

## Estrutura de Branches Recomendada

```bash
# Branch principal (produção)
main

# Branch de desenvolvimento
git checkout -b develop

# Branches de features
git checkout -b feature/formulario-clientes
git checkout -b feature/crud-veiculos
git checkout -b feature/modulo-faturas
```

## Workflow de Desenvolvimento

### 1. Criar nova feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
```

### 2. Desenvolver

```bash
# Fazer alterações
# Testar localmente

git add .
git commit -m "feat: descrição da feature"
```

### 3. Enviar para GitHub

```bash
git push origin feature/nome-da-feature
```

### 4. Criar Pull Request

- No GitHub, criar PR de `feature/nome-da-feature` → `develop`
- Revisar código
- Fazer merge

### 5. Merge para main (produção)

```bash
git checkout main
git merge develop
git push origin main
```

## Convenção de Commits (Conventional Commits)

Use prefixos para organizar commits:

```bash
# Nova funcionalidade
git commit -m "feat: adicionar formulário de cadastro de cliente"

# Correção de bug
git commit -m "fix: corrigir validação de CPF"

# Documentação
git commit -m "docs: atualizar README com instruções de deploy"

# Refatoração
git commit -m "refactor: reorganizar componentes UI"

# Estilo (formatação)
git commit -m "style: aplicar prettier em todos arquivos"

# Teste
git commit -m "test: adicionar testes para validação de CNPJ"

# Chore (tarefas, build)
git commit -m "chore: atualizar dependências"

# Performance
git commit -m "perf: otimizar query de dashboard"
```

## Exemplo de Commit Completo

```bash
git commit -m "feat: implementar CRUD completo de veículos

- Criar página de listagem de veículos
- Adicionar formulário de cadastro
- Implementar edição de veículo
- Adicionar validação de IMEI (15 dígitos)
- Criar máscaras para placa (AAA0A00)
- Integrar com tabela vehicles no Supabase

Closes #12"
```

## Comandos Git Úteis

### Verificar Status

```bash
git status
```

### Ver Diferenças

```bash
git diff
git diff --staged
```

### Histórico de Commits

```bash
git log
git log --oneline
git log --graph --oneline --all
```

### Desfazer Alterações

```bash
# Desfazer alterações não commitadas
git checkout -- arquivo.ts

# Desfazer último commit (mantém alterações)
git reset --soft HEAD~1

# Desfazer último commit (descarta alterações)
git reset --hard HEAD~1
```

### Atualizar Branch

```bash
git pull origin main
git pull --rebase origin main
```

### Limpar Branches Antigas

```bash
# Listar branches
git branch

# Deletar branch local
git branch -d feature/nome-branch

# Deletar branch remota
git push origin --delete feature/nome-branch
```

## .gitignore Já Configurado

O arquivo `.gitignore` já está configurado para ignorar:

- `node_modules/`
- `.next/`
- `.env` e `.env*.local`
- Build artifacts
- Cache do Next.js

## Proteger Secrets

### ⚠️ NUNCA COMMITE

- ✅ `.env.local` - **Ignorado**
- ✅ `.env` - **Ignorado**
- ✅ `SUPABASE_SERVICE_KEY` - **Nunca exponha**

### ✅ OK para Commitar

- ✅ `.env.example` - Template sem valores reais
- ✅ Código fonte
- ✅ Documentação

## Verificar Segurança

Antes de fazer push, sempre verifique:

```bash
# Verificar se .env está sendo ignorado
git status

# Procurar por possíveis secrets no código
git diff
```

## Deploy Automático com Vercel

### 1. Conectar Repositório

1. Acesse vercel.com
2. New Project
3. Import Git Repository
4. Selecione `lince-track-erp`

### 2. Configurar

- Framework Preset: Next.js
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`

### 3. Variáveis de Ambiente

Adicione na Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

### 4. Deploy

- Cada push em `main` → deploy automático em produção
- Cada push em `develop` → preview deployment
- Cada PR → preview deployment

## GitHub Actions (Opcional)

Criar `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Type check
      run: npm run type-check

    - name: Lint
      run: npm run lint

    - name: Build
      run: npm run build
```

## Boas Práticas

1. ✅ Commite frequentemente
2. ✅ Use mensagens descritivas
3. ✅ Crie branches para features
4. ✅ Faça code review via PR
5. ✅ Nunca commite secrets
6. ✅ Mantenha .gitignore atualizado
7. ✅ Teste antes de fazer push
8. ✅ Documente mudanças importantes

## Exemplo de Fluxo Completo

```bash
# 1. Criar branch para nova feature
git checkout -b feature/crud-veiculos

# 2. Desenvolver
# ... codificar ...

# 3. Adicionar e commitar
git add .
git commit -m "feat: implementar CRUD de veículos"

# 4. Push para GitHub
git push origin feature/crud-veiculos

# 5. Criar Pull Request no GitHub
# ... via interface web ...

# 6. Após aprovação, merge para develop
git checkout develop
git pull origin develop

# 7. Quando pronto, merge para main (produção)
git checkout main
git merge develop
git push origin main

# 8. Vercel detecta push e faz deploy automático!
```

## Recursos

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Conventional Commits](https://www.conventionalcommits.org)
- [Vercel Git Integration](https://vercel.com/docs/concepts/git)

---

**Dica:** Configure Git com seu nome e email antes de commitar:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```
