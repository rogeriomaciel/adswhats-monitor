-- ==============================================================================
-- Migration: 20261026_003
-- Nome: Índices de performance em mensagens e pessoas
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_mensagens_loja_id ON public.mensagens (loja_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_message_id ON public.mensagens (message_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_timestamp ON public.mensagens (timestamp_mensagem DESC);
CREATE INDEX IF NOT EXISTS idx_pessoas_loja_whatsapp ON public.pessoas (loja_id, whatsapp);
