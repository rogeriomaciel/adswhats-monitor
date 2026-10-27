-- ==============================================================================
-- Migration: 20261026_001
-- Nome: Tabela configs e constraints
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.configs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    key VARCHAR(255) UNIQUE,
    value VARCHAR(255)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'configs_key_unique'
    ) THEN
        ALTER TABLE public.configs ADD CONSTRAINT configs_key_unique UNIQUE (key);
    END IF;
END $$;
