-- ==============================================================================
-- Migration: 20261026_002
-- Nome: Ajuste de telefone opcional para lojas e índices
-- ==============================================================================

-- 1. Permite cadastro de loja antes de conectar o WhatsApp
ALTER TABLE public.lojas ALTER COLUMN whatsapp_loja DROP NOT NULL;

-- 2. Índices para agilizar identificação e listagem
CREATE INDEX IF NOT EXISTS idx_lojas_whatsapp ON public.lojas (whatsapp_loja);
CREATE INDEX IF NOT EXISTS idx_lojas_ativo ON public.lojas (ativo);
