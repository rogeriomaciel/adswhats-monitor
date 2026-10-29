# AdsWhats Monitor — Plano de Execução (Baby Steps)

Este plano guia o desenvolvimento do AdsWhats Monitor em etapas incrementais e seguras, com validação mútua em cada passo.

---

## 🎯 Princípios de Execução
1. **Baby Steps:** Avançar em passos pequenos e verificáveis.
2. **Validação Arquitetural:** Antes de introduzir qualquer módulo ou integração, validar os contratos de dados e isolamento multi-loja.
3. **Docs Atualizados:** Cada decisão técnica é documentada na pasta `docs/`.

---

## 📋 Fases e Passos

### 🔹 Fase 1: Modelagem e Fundação da Camada de Dados
- [x] **Passo 1.1:** Alinhar e aprovar o Schema SQL com IDs inteiros (`SERIAL`/`BIGSERIAL`) para as tabelas (`usuarios`, `lojas`, `pessoas`, `mensagens`, `webhook_evolution_logs`) — Salvo em [docs/schema.sql](./schema.sql).
- [x] **Passo 1.2:** Estruturar pipeline CI/CD no GitHub Actions ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) e script [scripts/deploy_workflows_via_api.js](../scripts/deploy_workflows_via_api.js) com suporte a Staging (em PR) e Produção (em merge para `main`).

### 🔹 Fase 2: Fundação do Frontend React
- [x] **Passo 2.1:** Inicializar o projeto React com Vite, TypeScript e Tailwind CSS (Compilação 100% testada e validada via Bun).
- [x] **Passo 2.2:** Configurar estrutura de pastas base (`src/components`, `src/pages`, `src/contexts`, `src/lib`, `src/types`).
- [x] **Passo 2.3:** Configurar o tema visual, layout base, helper `cn` e sistema de notificações com Sonner/Toaster.

### 🔹 Fase 3: Autenticação (Empresa Gestora)
- [x] **Passo 3.1:** Estruturar módulo de autenticação para operadores da Empresa Gestora (sem amarras a lojas fixas).
- [x] **Passo 3.2:** Implementar tela de Login ([src/pages/Login.tsx](../src/pages/Login.tsx)), contexto de sessão ([src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)), rotas protegidas e cliente de API ([src/lib/api.ts](../src/lib/api.ts)).
- [x] **Passo 3.3:** Estruturar workflow n8n [ADSWHATHS - LOGIN.json](../agente/workflows/core/ADSWHATHS%20-%20LOGIN.json) com suporte a E-mail ou WhatsApp, verificação via `crypt()` no PostgreSQL e assinatura de token JWT via chave configurada na tabela `configs`.

### 🔹 Fase 4: Gestão de Lojas e Configuração de Instâncias
- [x] **Passo 4.1:** Tela de listagem e cadastro completo de lojas clientes ([src/pages/Lojas.tsx](../src/pages/Lojas.tsx) e [src/components/lojas/LojaModal.tsx](../src/components/lojas/LojaModal.tsx)).
- [x] **Passo 4.2:** Painel e modal de configuração de instância por loja (Instância, API Key, Webhook, pareamento via QR Code com polling contínuo, reconexão e logout).
- [x] **Passo 4.3:** Workflows do n8n integrados com prefixo `ADSWHATHS` ([ADSWHATHS - PANEL.json](../agente/workflows/panel/ADSWHATHS%20-%20PANEL.json), [ADSWHATHS-PANEL-ACTION-GET-LOJAS.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-LOJAS.json), [ADSWHATHS-PANEL-ACTION-SAVE-LOJA.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-SAVE-LOJA.json), [ADSWHATHS-PANEL-ACTION-EVOLUTION-API.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-EVOLUTION-API.json)).

### 🔹 Fase 5: Ingestão de Webhooks do WhatsApp & Persistência de Mensagens
- [x] **Passo 5.1:** Workflow n8n principal de recepção de webhooks ([ADSWHATHS - INBOUND.json](../agente/workflows/core/ADSWHATHS%20-%20INBOUND.json)):
  - Identificação de loja via telefone conectado (`connectedPhone`) ou nome da instância (`instanceName`).
  - Verificação anti-replay com idempotência na tabela `webhook_evolution_logs`.
  - Transcrição de mensagens de áudio com Google Gemini Flash (`models/gemini-2.5-flash`).
  - Extração de metadados de anúncios Meta / Instagram / Facebook (Click-to-WhatsApp: `adId`, `adTitulo`, `adTema`, `ctwaClid`).
  - Criação ou atualização do contato com isolamento estrito por `loja_id` na tabela `pessoas`.
  - Gravação do histórico de cada mensagem e cálculo de SLA na tabela `mensagens`.

### 🔹 Fase 6: Interface de Monitoramento de Contatos, Criativos & Chat
- [x] **Passo 6.1:** Tela de Contatos ([src/pages/Contatos.tsx](../src/pages/Contatos.tsx)) com filtro dinâmico por loja, filtro por canal de origem (Instagram Ads, Facebook Ads, Orgânico), busca em tempo real por nome/telefone e contadores globais.
- [x] **Passo 6.2:** Visualizador de histórico de mensagens em formato de chat ([src/components/chat/ChatModal.tsx](../src/components/chat/ChatModal.tsx)), exibindo balões de mensagens inbound/outbound, indicação de áudios transcritos, tags da campanha do anúncio CTWA e atualização contínua em tempo real.
- [x] **Passo 6.3:** Dashboard consolidado ([src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx)) e Relatório de Criativos & SLA ([src/pages/Criativos.tsx](../src/pages/Criativos.tsx)) + Página pública de conexão do lojista ([src/pages/PublicConnect.tsx](../src/pages/PublicConnect.tsx)).
- [x] **Passo 6.4:** Workflows n8n dedicados com prefixo `ADSWHATHS`:
  - [ADSWHATHS-PANEL-ACTION-GET-CONTACTS.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-CONTACTS.json)
  - [ADSWHATHS-PANEL-ACTION-GET-CHAT-MESSAGES.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-CHAT-MESSAGES.json)
  - [ADSWHATHS-PANEL-ACTION-GET-METRICS-SLA.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-METRICS-SLA.json)
  - [ADSWHATHS - PUBLIC-CONNECT.json](../agente/workflows/core/ADSWHATHS%20-%20PUBLIC-CONNECT.json)

### 🔹 Fase 7: Gestão de Usuários (RBAC), Alternância Tabela/Cards e Otimização de Polling
- [x] **Passo 7.1:** Módulo completo de Gestão de Usuários ([src/pages/Usuarios.tsx](../src/pages/Usuarios.tsx) e [src/components/usuarios/UsuarioModal.tsx](../src/components/usuarios/UsuarioModal.tsx)) exclusivo para perfil `admin`, com criação, edição, redefinição de senha (`pgcrypto`) e ativação/desativação.
- [x] **Passo 7.2:** Sub-workflows n8n [ADSWHATHS-PANEL-ACTION-GET-USERS.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-GET-USERS.json) e [ADSWHATHS-PANEL-ACTION-SAVE-USER.json](../agente/workflows/panel/actions/ADSWHATHS-PANEL-ACTION-SAVE-USER.json) com validação de role `admin` no backend e proteção contra auto-bloqueio.
- [x] **Passo 7.3:** Alternância de visualização **Tabela | Cards** (padrão em Tabela) no Dashboard, Lojas, Contatos e Usuários.
- [x] **Passo 7.4:** Otimização global do `QueryClient` (`staleTime: 5 min`), debounce de `400ms` na busca de contatos, auto-refresh restrito exclusivamente ao `ChatModal` aberto e trava de tentativas no polling de QR Code.
