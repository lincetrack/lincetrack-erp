# ✅ Checklist de Instalação - Lince Track ERP

Use este checklist para garantir que tudo foi configurado corretamente.

## 📋 Pré-instalação

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm ou yarn instalado (`npm --version`)
- [ ] Git instalado (`git --version`)
- [ ] Conta no Supabase criada
- [ ] Conta no Vercel criada (opcional para deploy)

## 🔧 Setup do Projeto

- [ ] Clone ou navegue até a pasta do projeto
- [ ] Execute `npm install` (sem erros)
- [ ] Copie `.env.example` para `.env.local`
- [ ] Arquivo `.env.local` criado e editável

## 🗄️ Configuração Supabase

### Criar Projeto

- [ ] Projeto criado no Supabase
- [ ] Nome do projeto definido
- [ ] Região selecionada (preferencialmente South America)
- [ ] Senha do banco anotada (guarde em local seguro!)

### Obter Credenciais

- [ ] URL do projeto copiada (Settings > API)
- [ ] Anon key copiada (Settings > API)
- [ ] Service role key copiada (Settings > API)

### Executar Schema SQL

- [ ] Aberto SQL Editor no Supabase
- [ ] Copiado conteúdo de `supabase/schema.sql`
- [ ] Query executada com sucesso
- [ ] Nenhum erro reportado
- [ ] Tabelas criadas (verificar no Table Editor)

### Verificar Tabelas Criadas

- [ ] `clients` existe
- [ ] `vehicles` existe
- [ ] `subscriptions` existe
- [ ] `invoices` existe
- [ ] `payments` existe
- [ ] `expenses` existe
- [ ] `profiles` existe
- [ ] `audit_logs` existe

### Verificar Views

- [ ] `v_clients_active` existe
- [ ] `v_financial_dashboard` existe

### Verificar Functions

- [ ] `calculate_next_billing_date` existe
- [ ] `update_overdue_invoices` existe

## 👤 Criar Primeiro Usuário

- [ ] Ir em Authentication > Users no Supabase
- [ ] Clicar em "Add user"
- [ ] Inserir email e senha
- [ ] Usuário criado com sucesso
- [ ] ID do usuário copiado
- [ ] Executar SQL para criar perfil admin:

```sql
INSERT INTO profiles (id, full_name, role)
VALUES ('COLE-ID-AQUI', 'Administrador', 'admin');
```

- [ ] Perfil admin criado (verificar em Table Editor > profiles)

## 🔐 Variáveis de Ambiente

Edite `.env.local` e preencha:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` preenchida
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` preenchida
- [ ] `SUPABASE_SERVICE_KEY` preenchida
- [ ] `NEXT_PUBLIC_APP_URL` definida (http://localhost:3000)

## 🚀 Executar Localmente

- [ ] Execute `npm run dev`
- [ ] Sem erros no terminal
- [ ] Navegador abre automaticamente ou acesse http://localhost:3000
- [ ] Página de login carrega corretamente
- [ ] Logo "Lince Track ERP" aparece
- [ ] Formulário de login visível

## 🔑 Testar Login

- [ ] Inserir email do usuário criado
- [ ] Inserir senha do usuário criado
- [ ] Clicar em "Entrar"
- [ ] Redirecionado para `/dashboard`
- [ ] Dashboard carrega sem erros
- [ ] Sidebar aparece com menu
- [ ] Métricas aparecem (podem estar zeradas)

## 📊 Verificar Dashboard

- [ ] Card de MRR aparece
- [ ] Card de Clientes Ativos aparece
- [ ] Card de Receitas Pendentes aparece
- [ ] Card de Lucro Líquido aparece
- [ ] Seção de "Resumo Financeiro" aparece
- [ ] Seção de "Alertas e Pendências" aparece
- [ ] Seção de "Faturas Recentes" aparece

## 🧪 Testar Navegação

- [ ] Clicar em "Clientes" no menu
- [ ] Página de clientes carrega
- [ ] Botão "Novo Cliente" aparece
- [ ] Tabela de clientes aparece (vazia inicialmente)
- [ ] Filtros de busca funcionam

## 📝 Inserir Dados de Teste (Opcional)

Execute no SQL Editor:

```sql
-- Cliente de teste
INSERT INTO clients (
  tipo_pessoa, nome_razao_social, cpf_cnpj, email,
  telefone_principal, cep, logradouro, numero,
  bairro, cidade, uf, valor_mensalidade, dia_cobranca
) VALUES (
  'Física', 'João da Silva', '12345678901', 'joao@teste.com',
  '11987654321', '01310-100', 'Av. Paulista', '1000',
  'Bela Vista', 'São Paulo', 'SP', 100.00, 10
);
```

- [ ] Cliente inserido com sucesso
- [ ] Cliente aparece na listagem
- [ ] Dados formatados corretamente (CPF, telefone, moeda)

## ⚡ Edge Function (Cobrança Automática)

### Instalar Supabase CLI

- [ ] Execute `npm install -g supabase`
- [ ] CLI instalada (`supabase --version`)

### Login e Deploy

- [ ] Execute `supabase login`
- [ ] Autenticado com sucesso
- [ ] Execute `supabase functions deploy cron-billing --project-ref SEU-PROJECT-REF`
- [ ] Deploy concluído sem erros
- [ ] Função aparece em Functions no Supabase

### Configurar Variáveis

No Supabase > Edge Functions > cron-billing:

- [ ] Variável `SUPABASE_URL` adicionada
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` adicionada

### Testar Função

- [ ] Clicar em "Invoke" no painel
- [ ] Função executa sem erro
- [ ] Resposta JSON retornada
- [ ] Logs aparecem corretamente

## 🎨 Verificar Estilos

- [ ] Tailwind CSS carregando (cores, espaçamentos corretos)
- [ ] Fonte Inter aplicada
- [ ] Layout responsivo (testar em mobile)
- [ ] Botões estilizados corretamente
- [ ] Cards com sombras e bordas
- [ ] Sidebar funcional

## 🔒 Testar Segurança

- [ ] Fazer logout
- [ ] Tentar acessar `/dashboard` sem login
- [ ] Redirecionado para `/login`
- [ ] Fazer login novamente
- [ ] Acesso permitido ao dashboard

## 📱 Responsividade

- [ ] Redimensionar janela
- [ ] Sidebar vira mobile menu em telas pequenas
- [ ] Menu hambúrguer aparece no mobile
- [ ] Tabelas rolam horizontalmente se necessário
- [ ] Cards se reorganizam em grid responsivo

## 🚨 Verificar Erros

### Console do Navegador

- [ ] Abrir DevTools (F12)
- [ ] Aba Console sem erros críticos
- [ ] Aba Network: requisições para Supabase bem-sucedidas

### Terminal

- [ ] Nenhum erro de compilação
- [ ] Nenhum erro de TypeScript
- [ ] Hot reload funcionando

## 📦 Build de Produção

- [ ] Execute `npm run build`
- [ ] Build completa sem erros
- [ ] Execute `npm run start`
- [ ] Aplicação roda em modo produção
- [ ] Acesse http://localhost:3000
- [ ] Tudo funcionando igual ao modo dev

## 🌐 Deploy na Vercel (Opcional)

- [ ] Projeto commitado no Git
- [ ] Repositório criado no GitHub
- [ ] Conectar projeto na Vercel
- [ ] Adicionar variáveis de ambiente
- [ ] Deploy iniciado
- [ ] Deploy concluído sem erros
- [ ] URL de produção funcionando

### Variáveis na Vercel

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `CRON_SECRET` (gerar string aleatória)

## ✅ Validação Final

- [ ] Sistema roda localmente sem erros
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Navegação funciona
- [ ] Dados persistem no banco
- [ ] Edge Function deployada
- [ ] Build de produção funciona
- [ ] Deploy realizado (se aplicável)

## 🎉 Sistema Pronto!

Se todos os itens acima estão checados, seu sistema está funcionando perfeitamente!

## 📞 Troubleshooting

### ❌ Erros Comuns

#### "Invalid API key"
**Solução:** Verifique se copiou corretamente as keys do `.env.local`

#### "Permission denied for table clients"
**Solução:** Execute o schema SQL completo novamente

#### Dashboard vazio
**Solução:** Insira dados de teste usando o SQL fornecido

#### Edge Function falha
**Solução:** Verifique variáveis de ambiente da função no Supabase

#### Erro de compilação TypeScript
**Solução:** Execute `npm install` novamente

## 📚 Próximos Passos

Após validar tudo acima:

1. ✅ Ler `README.md` completo
2. ✅ Consultar `PROXIMOS_PASSOS.md` para continuar desenvolvimento
3. ✅ Usar `GUIA_RAPIDO.md` como referência rápida
4. ✅ Começar a implementar funcionalidades pendentes

---

**Dica:** Imprima este checklist e marque os itens à medida que completa!
