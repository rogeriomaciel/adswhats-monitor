-- Migration: 20261026_005_connect_token_lojas.sql
-- Descrição: Adiciona connect_token único na tabela lojas para página pública de conexão de WhatsApp pelo lojista

ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS connect_token UUID DEFAULT gen_random_uuid();
UPDATE public.lojas SET connect_token = gen_random_uuid() WHERE connect_token IS NULL;
ALTER TABLE public.lojas ALTER COLUMN connect_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lojas_connect_token ON public.lojas(connect_token);
