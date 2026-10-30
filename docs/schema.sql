-- ==============================================================================
-- AdsWhats Monitor — Schema Inicial do Banco de Dados (PostgreSQL / Supabase)
-- IDs inteiros sequenciais (SERIAL / BIGSERIAL)
-- ==============================================================================

-- Habilita extensão para hash e verificação de senhas com crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela de Usuários (Empresa Gestora / Super Admins)

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT,
    role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'operador'
    avatar_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Lojas Monitoradas
CREATE TABLE IF NOT EXISTS lojas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    whatsapp_loja VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    config_json JSONB DEFAULT '{
        "evolutionapi": {
            "instanceName": "",
            "apikey": "",
            "apiUrl": "",
            "webhookUrl": ""
        }
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Pessoas / Contatos que mandaram WhatsApp para a loja
CREATE TABLE IF NOT EXISTS pessoas (
    id BIGSERIAL PRIMARY KEY,
    loja_id INT NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(255),
    whatsapp VARCHAR(50) NOT NULL,
    picture_url TEXT,
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'arquivado', 'lead'
    origem VARCHAR(50) DEFAULT 'organico', -- 'organico', 'instagram_ads', 'facebook_ads', 'google'
    metadata_json JSONB DEFAULT '{}'::jsonb, -- dados de anúncios (adId, ctwaClid, etc.)
    total_mensagens INT DEFAULT 0,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_loja_whatsapp UNIQUE (loja_id, whatsapp)
);

CREATE INDEX IF NOT EXISTS idx_pessoas_loja_last_message 
ON pessoas(loja_id, last_message_at DESC);

-- 4. Tabela de Detalhe: Mensagens (Histórico 1:N com Pessoas)
CREATE TABLE IF NOT EXISTS mensagens (
    id BIGSERIAL PRIMARY KEY,
    loja_id INT NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    pessoa_id BIGINT NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    message_id VARCHAR(255) NOT NULL, -- ID original da mensagem na Evolution API
    direcao VARCHAR(20) NOT NULL,     -- 'inbound' (cliente -> loja) ou 'outbound' (loja -> cliente)
    tipo VARCHAR(50) DEFAULT 'texto', -- 'texto', 'audio', 'imagem', 'video', 'documento', 'sticker'
    conteudo TEXT,                    -- Texto da mensagem ou transcrição de áudio
    midia_url TEXT,                   -- Link da mídia / áudio (se houver)
    status_entrega VARCHAR(50),       -- 'sent', 'delivered', 'read'
    metadata_json JSONB DEFAULT '{}'::jsonb,
    timestamp_mensagem TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_loja_message UNIQUE (loja_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_mensagens_pessoa_data 
ON mensagens(pessoa_id, created_at ASC);

-- 5. Tabela de Log Anti-Replay para Webhooks da Evolution API
CREATE TABLE IF NOT EXISTS webhook_evolution_logs (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Configurações Gerais do Sistema (Parâmetros, JWT Secrets, etc.)
CREATE TABLE IF NOT EXISTS configs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    key VARCHAR(255) UNIQUE,
    value VARCHAR(255)
);

-- 7. Tabela de Criativos e Agrupamento de Anúncios (Meta e Google Ads)
CREATE TABLE IF NOT EXISTS criativos (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    ad_id VARCHAR(100) NOT NULL,
    titulo VARCHAR(255),
    tema TEXT,
    canal VARCHAR(50) DEFAULT 'instagram', -- 'instagram', 'facebook', 'google'
    media_url TEXT,
    source_url TEXT,
    total_mensagens INTEGER DEFAULT 0,
    total_pessoas_unicas INTEGER DEFAULT 0,
    primeira_mensagem_at TIMESTAMPTZ DEFAULT NOW(),
    ultima_mensagem_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_criativos_loja_ad UNIQUE (loja_id, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_criativos_loja_id ON criativos(loja_id);
CREATE INDEX IF NOT EXISTS idx_criativos_ad_id ON criativos(ad_id);
CREATE INDEX IF NOT EXISTS idx_criativos_canal ON criativos(canal);


