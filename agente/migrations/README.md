# Migrations do Banco de Dados — AdsWhats Monitor

Este diretório contém os scripts SQL versionados de evolução do esquema do banco de dados (PostgreSQL / Supabase).

## Como Funciona o Sistema de Migrations

1. **Tabela de Controle (`schema_migrations`):**
   - Registra cada versão aplicada com timestamp (`version`, `name`, `applied_at`).
   - Garante idempotência: scripts já executados nunca são reaplicados.

2. **Executor Seguro no n8n (`ADSWHATHS - DB-MIGRATIONS`):**
   - O workflow não possui webhook público por segurança.
   - O acionamento é feito manualmente dentro do n8n pelo botão **"Test workflow" / "Execute workflow"**.
   - Lê a lista de migrações, identifica as pendentes e aplica sequencialmente.

## Convenção de Nomes
`AAAAMMDD_NUM_descricao_curta.sql` (Exemplo: `20261026_001_tabela_configs.sql`).
