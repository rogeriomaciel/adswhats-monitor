-- ==============================================================================
-- Migration: 20261104_007
-- Nome: Soft delete em lojas e indices
-- ==============================================================================

-- 1. Coluna de soft delete
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Índice para consultas rápidas ignorando lojas excluídas
CREATE INDEX IF NOT EXISTS idx_lojas_deleted_at ON public.lojas (deleted_at);

