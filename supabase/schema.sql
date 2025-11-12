-- ============================================
-- LINCE TRACK ERP - DATABASE SCHEMA
-- Sistema de Rastreamento Veicular
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE tipo_pessoa AS ENUM ('Física', 'Jurídica');
CREATE TYPE status_cliente AS ENUM ('Ativo', 'Inativo', 'Cancelado');
CREATE TYPE forma_pagamento AS ENUM ('Boleto', 'Pix', 'Cartão', 'Transferência');
CREATE TYPE situacao_assinatura AS ENUM ('Ativa', 'Pausada', 'Cancelada');
CREATE TYPE metodo_cobranca AS ENUM ('Manual', 'Automática');
CREATE TYPE billing_cycle AS ENUM ('monthly');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_status AS ENUM ('succeeded', 'failed', 'pending');
CREATE TYPE expense_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE user_role AS ENUM ('admin', 'finance', 'operational', 'commercial');

-- ============================================
-- PROFILES (linked to auth.users)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'operational',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLIENTS (Cadastro Completo - PF/PJ)
-- ============================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tipo de Pessoa
    tipo_pessoa tipo_pessoa NOT NULL,

    -- Dados Principais
    nome_razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cpf_cnpj TEXT NOT NULL UNIQUE,
    rg_inscricao_estadual TEXT,
    data_nascimento_abertura DATE,

    -- Contato
    email TEXT NOT NULL,
    telefone_principal TEXT NOT NULL,
    telefone_secundario TEXT,

    -- Status
    status status_cliente NOT NULL DEFAULT 'Ativo',

    -- Endereço
    cep TEXT NOT NULL,
    logradouro TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    uf TEXT NOT NULL CHECK (length(uf) = 2),

    -- Dados Financeiros
    valor_mensalidade NUMERIC(10,2) NOT NULL CHECK (valor_mensalidade > 0),
    dia_cobranca INTEGER NOT NULL CHECK (dia_cobranca BETWEEN 1 AND 28),
    forma_pagamento_preferida forma_pagamento NOT NULL DEFAULT 'Boleto',
    banco_agencia_conta TEXT,

    -- Notificações
    notificar_por_email BOOLEAN DEFAULT TRUE,
    notificar_por_sms BOOLEAN DEFAULT FALSE,
    observacoes_financeiras TEXT,

    -- Assinatura
    data_inicio_contrato DATE NOT NULL DEFAULT CURRENT_DATE,
    proxima_cobranca DATE,
    situacao_assinatura situacao_assinatura NOT NULL DEFAULT 'Ativa',
    metodo_cobranca metodo_cobranca NOT NULL DEFAULT 'Manual',

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Índices para performance
CREATE INDEX idx_clients_cpf_cnpj ON clients(cpf_cnpj);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_situacao_assinatura ON clients(situacao_assinatura);
CREATE INDEX idx_clients_proxima_cobranca ON clients(proxima_cobranca);

-- ============================================
-- VEHICLES (Veículos vinculados aos clientes)
-- ============================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Dados do Veículo
    placa TEXT NOT NULL CHECK (length(placa) = 7),
    modelo TEXT NOT NULL,
    marca TEXT,
    ano INTEGER CHECK (ano >= 1900 AND ano <= 2100),

    -- Rastreamento
    imei_rastreador TEXT NOT NULL CHECK (length(imei_rastreador) = 15),
    chip_numero TEXT NOT NULL,
    operadora_chip TEXT,

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Índices
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_vehicles_placa ON vehicles(placa);
CREATE INDEX idx_vehicles_imei ON vehicles(imei_rastreador);

-- ============================================
-- SUBSCRIPTIONS (Assinaturas)
-- ============================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    start_date DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    status subscription_status NOT NULL DEFAULT 'active',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_client_id ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- INVOICES (Faturas)
-- ============================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    status invoice_status NOT NULL DEFAULT 'pending',

    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);

-- ============================================
-- PAYMENTS (Pagamentos)
-- ============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    provider TEXT,
    provider_payment_id TEXT,
    status payment_status NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- EXPENSES (Despesas / Contas a Pagar)
-- ============================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_date DATE,
    status expense_status NOT NULL DEFAULT 'pending',
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================
-- AUDIT LOGS (Logs de Auditoria)
-- ============================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES profiles(id),
    event TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular próxima cobrança
CREATE OR REPLACE FUNCTION calculate_next_billing_date(
    start_date DATE,
    billing_day INTEGER
)
RETURNS DATE AS $$
DECLARE
    next_date DATE;
    current_month_date DATE;
BEGIN
    -- Calcula a data do próximo mês
    current_month_date := DATE_TRUNC('month', start_date) + INTERVAL '1 month';

    -- Define o dia específico
    next_date := current_month_date + (billing_day - 1) * INTERVAL '1 day';

    -- Se a data for anterior à data de início, avança mais um mês
    IF next_date <= start_date THEN
        next_date := next_date + INTERVAL '1 month';
    END IF;

    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger para definir próxima cobrança automaticamente ao criar cliente
CREATE OR REPLACE FUNCTION set_initial_next_billing()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.proxima_cobranca IS NULL THEN
        NEW.proxima_cobranca := calculate_next_billing_date(
            NEW.data_inicio_contrato,
            NEW.dia_cobranca
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_set_next_billing BEFORE INSERT ON clients
    FOR EACH ROW EXECUTE FUNCTION set_initial_next_billing();

-- Função para atualizar status de faturas vencidas
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
    UPDATE invoices
    SET status = 'overdue'
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policies para ADMIN (acesso total)
CREATE POLICY "Admins have full access to clients"
    ON clients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins have full access to vehicles"
    ON vehicles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins have full access to subscriptions"
    ON subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins have full access to invoices"
    ON invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins have full access to payments"
    ON payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins have full access to expenses"
    ON expenses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies para FINANCE (acesso financeiro)
CREATE POLICY "Finance can view and manage invoices"
    ON invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('finance', 'admin')
        )
    );

CREATE POLICY "Finance can view and manage payments"
    ON payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('finance', 'admin')
        )
    );

CREATE POLICY "Finance can view and manage expenses"
    ON expenses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('finance', 'admin')
        )
    );

-- Policies para COMMERCIAL (cadastros)
CREATE POLICY "Commercial can manage clients"
    ON clients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('commercial', 'admin')
        )
    );

-- Policies para OPERATIONAL (veículos)
CREATE POLICY "Operational can manage vehicles"
    ON vehicles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('operational', 'admin')
        )
    );

-- Audit logs (apenas admin pode ver)
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- INITIAL DATA (Dados Iniciais)
-- ============================================

-- Criar perfil admin inicial (será criado após primeiro login)
-- Você deve executar isso manualmente após criar o primeiro usuário:
-- INSERT INTO profiles (id, full_name, role)
-- VALUES ('seu-user-id-aqui', 'Administrador', 'admin');

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de clientes ativos com totais
CREATE OR REPLACE VIEW v_clients_active AS
SELECT
    c.*,
    COUNT(DISTINCT v.id) as total_vehicles,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending') as pending_invoices,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'overdue') as overdue_invoices,
    COALESCE(SUM(i.amount) FILTER (WHERE i.status IN ('pending', 'overdue')), 0) as total_debt
FROM clients c
LEFT JOIN vehicles v ON v.client_id = c.id AND v.ativo = true
LEFT JOIN invoices i ON i.client_id = c.id AND i.status IN ('pending', 'overdue')
WHERE c.status = 'Ativo'
GROUP BY c.id;

-- View de dashboard financeiro
CREATE OR REPLACE VIEW v_financial_dashboard AS
SELECT
    -- Receitas
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM CURRENT_DATE)) as revenue_current_month,
    (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'pending') as pending_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'overdue') as overdue_revenue,

    -- Despesas
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as expenses_current_month,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'pending') as pending_expenses,

    -- Clientes
    (SELECT COUNT(*) FROM clients WHERE status = 'Ativo') as active_clients,
    (SELECT COUNT(*) FROM clients WHERE status = 'Inativo') as inactive_clients,

    -- MRR (Monthly Recurring Revenue)
    (SELECT COALESCE(SUM(valor_mensalidade), 0) FROM clients WHERE status = 'Ativo' AND situacao_assinatura = 'Ativa') as mrr;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE clients IS 'Cadastro completo de clientes (Pessoa Física e Jurídica)';
COMMENT ON TABLE vehicles IS 'Veículos vinculados aos clientes';
COMMENT ON TABLE subscriptions IS 'Assinaturas e contratos recorrentes';
COMMENT ON TABLE invoices IS 'Faturas geradas mensalmente';
COMMENT ON TABLE payments IS 'Pagamentos efetivados';
COMMENT ON TABLE expenses IS 'Despesas e contas a pagar';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria do sistema';
COMMENT ON TABLE profiles IS 'Perfis de usuários com controle de permissões (RBAC)';
