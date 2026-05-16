-- Migration: adiciona campo assinado na tabela contratos
-- Execute este script no SQL Editor do Supabase

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS assinado BOOLEAN NOT NULL DEFAULT FALSE;
