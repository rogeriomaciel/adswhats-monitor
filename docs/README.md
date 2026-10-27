# 📚 Documentação — AdsWhats Monitor

Esta pasta reúne os artefatos de planejamento, especificações arquiteturais e decisões técnicas do projeto.

---

## 🗂️ Índice de Documentos

1. **[01. Visão Geral do Projeto](file:///rogerio/core/adswhats-monitor/docs/project_overview.md)**
   - Papéis do Frontend (React) e Backend (n8n).
   - Mapa arquitetural e **Regra de Ouro** (banco PostgreSQL no Supabase acessado exclusivamente via n8n).
   - Registro de Decisões de Arquitetura (ADRs).

2. **[02. Escopo Simplificado & Mapeamento de Referência](file:///rogerio/core/adswhats-monitor/docs/scope_and_comparison.md)**
   - Comparativo direto com o projeto `coreauto-insight`.
   - O que foi herdado (Autenticação, Evolution API, Barramento de Ações n8n).
   - O que foi removido (Ordens de Serviço, Mecânicos, Comissões, Modo Smart TV).
   - Telas e módulos essenciais do AdsWhats Monitor.

3. **[03. Arquitetura de Gestão e Modelo de Dados](file:///rogerio/core/adswhats-monitor/docs/admin_and_data_model.md)**
   - Papel de Super Admin / Gestão Multi-loja.
   - Especificação das tabelas: `usuarios`, `lojas`, `pessoas`, `mensagens`, `webhook_evolution_logs`.
   - Fluxo de dados entre Evolution API, n8n e Supabase.

4. **[04. Plano de Execução (Baby Steps)](file:///rogerio/core/adswhats-monitor/docs/plan.md)**
   - Fases e passos de implementação com checkpoints e validações.

