# AdsWhats Monitor — Visão Geral do Projeto

## 1. Definição e Papéis da Aplicação

O **AdsWhats Monitor** é um sistema composto por dois módulos principais:

* **Frontend:** Interface desenvolvida em **React** para visualização, monitoramento de contatos recebidos no WhatsApp e controle operacional.
* **Backend:** Orquestração e lógica de negócios executadas no **n8n** (workflows acionados por Webhooks, triggers agendados ou eventos externos).

---

## 2. Mapa Arquitetural e Barreira de Acesso

> [!IMPORTANT]
> **Regra de Ouro da Arquitetura:** O Frontend **não** tem acesso direto ao banco de dados (Supabase/PostgreSQL). O **n8n** é o gateway exclusivo e centralizador de todas as consultas, gravações e orquestrações.

```mermaid
flowchart LR
    subgraph Frontend [Frontend - React]
        UI[Dashboard / Telas]
    end

    subgraph GatewayBackend [Backend & API Gateway - n8n]
        WH[Webhooks HTTP / REST Endpoints]
        Workflows[Workflows de Negócio]
        Cron[Jobs / Schedulers]
    end

    subgraph DataLayer [Camada de Dados]
        Supabase[(PostgreSQL - Supabase)]
    end

    subgraph Integrations [Serviços & Canais Externos]
        EvoAPI[Evolution API / WhatsApp]
        Ads[Meta Ads / Outros]
    end

    UI <-->|HTTP / JSON (REST)| WH
    WH <--> Workflows
    Cron --> Workflows
    Workflows <-->|Acesso Exclusivo| Supabase
    Workflows <--> Integrations
```

---

## 3. Registro de Decisões de Arquitetura (ADR)

| Tópico | Decisão | Status | Detalhes / Regras |
| :--- | :--- | :--- | :--- |
| **Frontend** | React (Vite + TypeScript + Tailwind) | ✅ Definido | Interface de monitoramento e controle. |
| **Backend / API Gateway** | n8n | ✅ Definido | Webhooks HTTP servindo de API para o frontend e executores de regras. |
| **Banco de Dados** | PostgreSQL no Supabase | ✅ Definido | Acessado **exclusivamente** pelo n8n. Nenhuma chave do banco no frontend. |
| **Acesso a Dados** | Gateway 100% via n8n | ✅ Definido | O React consome e envia dados unicamente para endpoints de Webhooks do n8n. |
| **Integração WhatsApp** | Evolution API | ✅ Definido | Webhooks de mensagens recebidas e controle de instâncias. |
| **Autenticação & RBAC** | E-mail ou WhatsApp + Senha / Token Bearer | ✅ Definido | Validação via `crypt`, assinatura JWT com chave em `configs` e controle de permissão `admin` vs `operador`. |
| **Cache & Polling UI** | React Query (`staleTime: 5m`) + Debounce | ✅ Definido | Navegação em memória sem refetch redundante; auto-refresh restrito ao `ChatModal` aberto e limites de tentativas no QR Code. |
| **Notificações em Tempo Real** | Pusher Channels (`private-loja-{id}`) | ✅ Definido | Eventos instantâneos de mensagens, novos contatos e status de instâncias via WebSocket. |
| **Ergonomia e UI/UX** | Mobile-First + Command Palette + Sheet Drawer | ✅ Definido | BottomNav para dispositivos móveis, paleta com tons de cinza suaves (sem ofuscação no modo claro), paleta `⌘K` global e inspeção em gaveta deslizante sem perda de contexto. |
| **Persistência de Tema** | `localStorage` + Script Zero-FOUC no `<head>` | ✅ Definido | Alternância entre Dark/Light persistida e sincronizada entre abas sem flash visual. |
