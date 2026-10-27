# AdsWhats Monitor — Plano de Execução (Baby Steps)

Este plano guia o desenvolvimento do AdsWhats Monitor em etapas incrementais e seguras, com validação mútua em cada passo.

---

## 🎯 Princípios de Execução
1. **Baby Steps:** Avançar em passos pequenos e verificáveis.
2. **Validação Antes de Copiar:** Antes de trazer qualquer código ou estrutura de `coreauto-insight`, perguntar e validar com o usuário se atende à necessidade exata ou se requer adaptações.
3. **Docs Atualizados:** Cada decisão técnica é documentada na pasta `docs/`.

---

## 📋 Fases e Passos

### 🔹 Fase 1: Modelagem e Fundação da Camada de Dados
- [x] **Passo 1.1:** Alinhar e aprovar o Schema SQL com IDs inteiros (`SERIAL`/`BIGSERIAL`) para as tabelas (`usuarios`, `lojas`, `pessoas`, `mensagens`, `webhook_evolution_logs`) — Salvo em [docs/schema.sql](file:///rogerio/core/adswhats-monitor/docs/schema.sql).
- [x] **Passo 1.2:** Estruturar pipeline CI/CD no GitHub Actions ([.github/workflows/ci.yml](file:///rogerio/core/adswhats-monitor/.github/workflows/ci.yml)) e script [scripts/deploy_workflows_via_api.js](file:///rogerio/core/adswhats-monitor/scripts/deploy_workflows_via_api.js) com suporte a Staging (em PR) e Produção (em merge para `main`).


### 🔹 Fase 2: Fundação do Frontend React
- [x] **Passo 2.1:** Inicializar o projeto React com Vite, TypeScript e Tailwind CSS (Compilação 100% testada e validada via Bun).
- [x] **Passo 2.2:** Configurar estrutura de pastas base (`src/components`, `src/pages`, `src/hooks`, `src/lib`, `src/types`).
- [x] **Passo 2.3:** Configurar o tema visual, layout base, helper `cn` e sistema de notificações com Sonner/Toaster.

### 🔹 Fase 3: Autenticação (Empresa Gestora)
- [x] **Passo 3.1:** Analisar o módulo de Login do `coreauto-insight` e adaptar para login da Empresa Gestora (sem amarras a lojas fixas).
- [x] **Passo 3.2:** Implementar tela de Login ([src/pages/Login.tsx](file:///rogerio/core/adswhats-monitor/src/pages/Login.tsx)), contexto de sessão ([src/contexts/AuthContext.tsx](file:///rogerio/core/adswhats-monitor/src/contexts/AuthContext.tsx)), rotas protegidas e cliente de API ([src/lib/api.ts](file:///rogerio/core/adswhats-monitor/src/lib/api.ts)).
- [x] **Passo 3.3:** Estruturar workflow n8n [ADSWHATHS - LOGIN.json](file:///rogerio/core/adswhats-monitor/agente/workflows/core/ADSWHATHS%20-%20LOGIN.json) com suporte a E-mail ou WhatsApp, verificação via `crypt()` no PostgreSQL e assinatura de token JWT.



### 🔹 Fase 4: Gestão de Lojas e Configuração de Evolution API
- [x] **Passo 4.1:** Tela de listagem e cadastro completo de lojas clientes ([src/pages/Lojas.tsx](file:///rogerio/core/adswhats-monitor/src/pages/Lojas.tsx) e [src/components/lojas/LojaModal.tsx](file:///rogerio/core/adswhats-monitor/src/components/lojas/LojaModal.tsx)).
- [x] **Passo 4.2:** Painel e modal de configuração da Evolution API por loja (Instância, API Key, Webhook, pareamento via QR Code com polling contínuo, reconexão e logout).
- [x] **Passo 4.3:** Workflows do n8n integrados com prefixo `ADSWHATHS` ([ADSWHATHS - PANEL.json](file:///rogerio/core/adswhats-monitor/agente/workflows/panel/ADSWHATHS%20-%20PANEL.json), [ADSWHATHS-PANEL-ACTION-GET-LOJAS.json](file:///rogerio/core/adswhats-monitor/agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-LOJAS.json), [ADSWHATHS-PANEL-ACTION-SAVE-LOJA.json](file:///rogerio/core/adswhats-monitor/agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-SAVE-LOJA.json), [ADSWHATHS-PANEL-ACTION-EVOLUTION-API.json](file:///rogerio/core/adswhats-monitor/agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-EVOLUTION-API.json)).

### 🔹 Fase 5: Ingestão de Webhooks do WhatsApp & Persistência de Mensagens
- [x] **Passo 5.1:** Workflow n8n principal de recepção de webhooks da Evolution API ([ADSWHATHS - INBOUND.json](file:///rogerio/core/adswhats-monitor/agente/workflows/core/ADSWHATHS%20-%20INBOUND.json)):
  - Identificação de loja via telefone conectado (`connectedPhone`) ou nome da instância (`instanceName`).
  - Verificação anti-replay com idempotência na tabela `webhook_evolution_logs`.
  - Transcrição de mensagens de áudio com Google Gemini Flash (`models/gemini-2.5-flash`).
  - Extração de metadados de anúncios Meta / Instagram / Facebook (Click-to-WhatsApp: `adId`, `adTitulo`, `adTema`, `ctwaClid`).
  - Criação ou atualização do contato com isolamento estrito por `loja_id` na tabela `pessoas`.
  - Gravação do histórico de cada mensagem na tabela `mensagens`.

### 🔹 Fase 6: Interface de Monitoramento de Contatos & Chat
- [x] **Passo 6.1:** Tela de Contatos ([src/pages/Contatos.tsx](file:///rogerio/core/adswhats-monitor/src/pages/Contatos.tsx)) com filtro dinâmico por loja, filtro por canal de origem (Instagram Ads, Facebook Ads, Orgânico), busca em tempo real por nome/telefone e contadores globais.
- [x] **Passo 6.2:** Visualizador de histórico de mensagens em formato de chat ([src/components/chat/ChatModal.tsx](file:///rogerio/core/adswhats-monitor/src/components/chat/ChatModal.tsx)), exibindo balões de mensagens inbound/outbound, indicação de áudios transcritos com Gemini, tags da campanha do anúncio CTWA e atualização contínua em tempo real.
- [x] **Passo 6.3:** Dashboard consolidado ([src/pages/Dashboard.tsx](file:///rogerio/core/adswhats-monitor/src/pages/Dashboard.tsx)) com métricas de volume de contatos, saúde das instâncias e atalhos de monitoramento.
- [x] **Passo 6.4:** Workflows n8n dedicados com prefixo `ADSWHATHS`:
  - [ADSWHATHS-PANEL-ACTION-GET-CONTACTS.json](file:///rogerio/core/adswhats-monitor/agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-CONTACTS.json)
  - [ADSWHATHS-PANEL-ACTION-GET-CHAT-MESSAGES.json](file:///rogerio/core/adswhats-monitor/agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-CHAT-MESSAGES.json)
