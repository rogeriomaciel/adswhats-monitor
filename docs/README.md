# 📚 Documentação — AdsWhats Monitor

Esta pasta reúne as especificações técnicas, arquiteturais e de modelo de dados do **AdsWhats Monitor**.

---

## 🗂️ Índice de Documentos

1. **[01. Visão Geral do Projeto](file:///rogerio/core/adswhats-monitor/docs/project_overview.md)**
   - Papéis do Frontend (React SPA) e Backend Gateway (n8n).
   - Diagrama arquitetural e **Regra de Ouro** (banco Supabase acessado exclusivamente via n8n).
   - Registro de Decisões de Arquitetura (ADRs).

2. **[02. Escopo & Funcionalidades](file:///rogerio/core/adswhats-monitor/docs/scope_and_comparison.md)**
   - Plataforma de monitoramento e auditoria de tráfego WhatsApp (não é CRM).
   - Atribuição de tráfego pago por mensagem (Meta Click to WhatsApp - CTWA).
   - Relatórios e métricas por criativo e cálculo de SLA de primeiro atendimento.
   - Link de conexão pública para lojistas (`/conectar/:token`).

3. **[03. Arquitetura de Gestão e Modelo de Dados](file:///rogerio/core/adswhats-monitor/docs/admin_and_data_model.md)**
   - Papel de Super Admin e gestão multilojas com isolamento por `loja_id`.
   - Especificação das tabelas: `usuarios`, `lojas`, `pessoas`, `mensagens`, `criativos`, `configs`.
   - Fluxo de dados entre Evolution API, n8n e Supabase.

4. **[04. Plano de Execução & Migrações](file:///rogerio/core/adswhats-monitor/docs/plan.md)**
   - Histórico de fases de implementação e versionamento do banco via migrações SQL.
