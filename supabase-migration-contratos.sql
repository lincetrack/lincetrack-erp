-- Migration: Módulo de Contratos
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contratos (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_contrato           SERIAL,
  cliente_id                UUID REFERENCES clientes(id) ON DELETE SET NULL,
  -- Snapshot dos dados do cliente na data do contrato
  cliente_nome              TEXT NOT NULL,
  cliente_cnpj              TEXT NOT NULL,
  cliente_endereco          TEXT,
  cliente_bairro            TEXT,
  cliente_cidade            TEXT NOT NULL,
  cliente_estado            TEXT NOT NULL,
  -- Termos financeiros
  valor_mensalidade         NUMERIC(10,2) NOT NULL,
  qtd_veiculos              INTEGER NOT NULL DEFAULT 1,
  valor_assistencia         NUMERIC(10,2),
  qtd_veiculos_assistencia  INTEGER,
  -- Datas
  data_contrato             DATE NOT NULL,
  data_vencimento           DATE NOT NULL,
  -- Status
  status                    TEXT NOT NULL DEFAULT 'ativo'
                              CHECK (status IN ('ativo', 'vencido', 'rescindido')),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver contratos"
  ON contratos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem inserir contratos"
  ON contratos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar contratos"
  ON contratos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem excluir contratos"
  ON contratos FOR DELETE TO authenticated USING (true);
