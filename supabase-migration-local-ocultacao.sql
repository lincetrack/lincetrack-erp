-- Migration: Adiciona campo local_ocultacao na tabela veiculos
-- Data: 2026-05-09
-- Descrição: Registra o local de ocultação do rastreador no veículo (uso interno)

ALTER TABLE veiculos
  ADD COLUMN IF NOT EXISTS local_ocultacao TEXT;
