-- Migration: Adiciona campo possui_assistencia na tabela clientes
-- Data: 2026-05-09
-- Descrição: Permite marcar se o cliente possui Assistência Veicular

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS possui_assistencia BOOLEAN NOT NULL DEFAULT FALSE;

-- Atualiza o updated_at dos registros existentes para registrar a migration
UPDATE clientes SET updated_at = NOW() WHERE possui_assistencia IS NOT NULL;
