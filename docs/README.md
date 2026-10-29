# 📚 Documentação — AdsWhats Monitor

Esta pasta reúne as especificações técnicas, arquiteturais e de modelo de dados do **AdsWhats Monitor**.

---

## 🗂️ Índice de Documentos

1. **[01. Visão Geral do Projeto](./project_overview.md)**
   - Papéis do Frontend (React SPA) e Backend Gateway (n8n).
   - Diagrama arquitetural e **Regra de Ouro** (banco de dados acessado exclusivamente via n8n).
   - Registro de Decisões de Arquitetura (ADRs).

2. **[02. Escopo & Funcionalidades](./scope_and_comparison.md)**
   - Plataforma de monitoramento e auditoria de tráfego WhatsApp (não é CRM).
   - Atribuição de tráfego pago por mensagem (Meta Click to WhatsApp - CTWA).
   - Relatórios e métricas por criativo e cálculo de SLA de primeiro atendimento.
   - Link de conexão pública para lojistas (`/conectar/:token`).

3. **[03. Arquitetura de Gestão e Modelo de Dados](./admin_and_data_model.md)**
   - Papel de Super Admin e gestão multilojas com isolamento por `loja_id`.
   - Especificação das tabelas: `usuarios`, `lojas`, `pessoas`, `mensagens`, `criativos`, `configs`.
   - Fluxo de dados entre motor de mensageria, n8n e banco de dados.

4. **[04. Infraestrutura de Produção e CI/CD](./infraestrutura_e_deploy.md)**
   - Topologia de 2 VPS isoladas, configuração de Nginx Reverse Proxy, SSL e esteira GitHub Actions.

5. **[05. Plano de Execução & Migrações](./plan.md)**
   - Histórico de fases de implementação e versionamento do banco via migrações SQL.
