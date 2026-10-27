-- Migration: 20261026_004_criativos_e_sla.sql
-- Descrição: Criação da tabela de criativos de anúncios Meta CTWA e campos de SLA/Atribuição em mensagens e pessoas

-- 1. Tabela de Criativos (Anúncios Meta Ads / CTWA)
CREATE TABLE IF NOT EXISTS public.criativos (
  id SERIAL PRIMARY KEY,
  loja_id INTEGER NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  ad_id VARCHAR(100) NOT NULL,
  titulo VARCHAR(255),
  tema TEXT,
  canal VARCHAR(50) DEFAULT 'instagram',
  media_url TEXT,
  total_mensagens INTEGER DEFAULT 0,
  total_pessoas_unicas INTEGER DEFAULT 0,
  primeira_mensagem_at TIMESTAMPTZ DEFAULT NOW(),
  ultima_mensagem_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_criativos_loja_ad UNIQUE (loja_id, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_criativos_loja_id ON public.criativos(loja_id);
CREATE INDEX IF NOT EXISTS idx_criativos_ad_id ON public.criativos(ad_id);
CREATE INDEX IF NOT EXISTS idx_criativos_canal ON public.criativos(canal);

-- 2. Campos de Anúncio e SLA na tabela de Mensagens
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS is_ad BOOLEAN DEFAULT false;
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS criativo_id INTEGER REFERENCES public.criativos(id) ON DELETE SET NULL;
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS ctwa_clid VARCHAR(255);
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS tempo_resposta_segundos INTEGER DEFAULT NULL;
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS respondida_em TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS respondida_por_mensagem_id VARCHAR(255) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_mensagens_criativo_id ON public.mensagens(criativo_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_is_ad ON public.mensagens(is_ad);
CREATE INDEX IF NOT EXISTS idx_mensagens_tempo_resposta ON public.mensagens(tempo_resposta_segundos) WHERE tempo_resposta_segundos IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_respondida_em ON public.mensagens(respondida_em);
CREATE INDEX IF NOT EXISTS idx_mensagens_inbound_pendente ON public.mensagens(loja_id, pessoa_id, direcao, respondida_em) WHERE direcao = 'inbound' AND respondida_em IS NULL;

-- 3. Referência ao último criativo na tabela de Pessoas
ALTER TABLE public.pessoas ADD COLUMN IF NOT EXISTS ultimo_criativo_id INTEGER REFERENCES public.criativos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_ultimo_criativo ON public.pessoas(ultimo_criativo_id);
