# 🌐 Infraestrutura de Produção e CI/CD — AdsWhats Monitor

Este documento detalha a topologia de servidores em produção, subdomínios, configurações de Nginx, SSL e o fluxo automatizado de integração e entrega contínua (CI/CD).

---

## 🏗️ 1. Topologia de Servidores & Domínios

A infraestrutura foi desenhada para isolar a instabilidade natural de conexões do WhatsApp da torre de controle central (n8n) e da interface de usuário.

```mermaid
flowchart TD
    subgraph Users [Clientes & Operadores]
        Browser[Navegador Web / HTTPS]
    end

    subgraph VPS_Frontend_n8n [VPS 1: Backend Gateway & Frontend]
        NginxHost[Nginx Reverse Proxy / SSL Let's Encrypt]
        StaticSPA[SPA React /var/www/adswhatsmonitor]
        N8NApp[n8n App Container :5678]
        PostgresN8N[(PostgreSQL 16 Local :5432)]
    end

    subgraph VPS_Evolution [VPS 2: WhatsApp Engine]
        NginxEvo[Nginx Reverse Proxy / SSL Let's Encrypt]
        EvoAPI[Evolution API v2.3.7 :8080]
        RedisEvo[(Redis 7 Local 256MB LRU)]
        PostgresEvo[(PostgreSQL 16 Local)]
    end

    subgraph DataCloud [Persistência de Negócio]
        Supabase[(Supabase Cloud - PostgreSQL)]
    end

    Browser -->|app.seudominio.com| StaticSPA
    Browser -->|n8n.seudominio.com| N8NApp
    StaticSPA -->|api.seudominio.com/app| N8NApp
    N8NApp <-->|Pooler SSL 6543| Supabase
    EvoAPI -->|Webhooks /app/inbound| N8NApp
    N8NApp -->|whats.seudominio.com| EvoAPI
```

---

## 📌 2. Mapeamento de Domínios e Serviços

| Domínio (Exemplo) | Host | Serviço | Segurança / Regras |
| :--- | :--- | :--- | :--- |
| **`app.seudominio.com`** | VPS 1 | Frontend SPA (React + Vite) | Gzip ativo, cache longo de assets (`/assets/`), fallback para `index.html`. |
| **`api.seudominio.com`** | VPS 1 | Gateway Público de API / Webhooks | Raiz `/` bloqueada com **404**. Rotas `/app` e `/api` liberadas com **CORS completo**. |
| **`n8n.seudominio.com`** | VPS 1 | Painel Administrativo do n8n | Acesso restrito ao editor e workflows do n8n com WebSockets. |
| **`whats.seudominio.com`** | VPS 2 | Evolution API | Timeouts de 86400s para SSE/WebSockets, upload até 100MB, Redis com limite de 256MB. |

---

## 🚀 3. Pipeline de CI/CD (GitHub Actions)

A esteira de integração e entrega contínua está definida em [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) e é disparada **exclusivamente após a aprovação e merge de Pull Requests na branch `main`**.

### 🔒 Segredos Utilizados (GitHub Actions Secrets):
- `VITE_API_URL`: URL base da API pública (ex: `https://api.seudominio.com/app`)
- `PROD_N8N_HOST`: Host do n8n para deploy de workflows (ex: `api.seudominio.com`)
- `PROD_N8N_API_KEY`: API Key oficial do n8n
- `SSH_HOST`: IP ou Host da VPS de Frontend/API
- `SSH_USER`: Usuário SSH da VPS (ex: `ubuntu`)
- `SSH_PORT`: Porta SSH da VPS (padrão: `22`)
- `SSH_PRIVATE_KEY`: Chave privada SSH autorizada na VPS
- `DEPLOY_TARGET`: Diretório do SPA no servidor (ex: `/var/www/adswhatsmonitor`)

---

## 🛠️ 4. Fluxo Git Flow para o Agente e Desenvolvedores

Conforme detalhado no skill [`.agent/skills/git-agent-workflow.md`](../.agent/skills/git-agent-workflow.md):

1. **Abrir Branch e PR via Script:**
   ```bash
   bash scripts/git_push_automacao.sh feature/nova-melhoria "feat: adiciona nova funcionalidade"
   ```
2. **Validar CI no GitHub:**
   O GitHub Actions executará os testes e compilação do TypeScript.
3. **Merge na `main`:**
   Ao mesclar o Pull Request, o GitHub Actions realiza o build de produção, publica os arquivos estáticos na VPS via SSH/Rsync e executa o deploy automático de todos os workflows no n8n.
4. **Sincronizar e Limpar:**
   ```bash
   bash scripts/git_clean_workspace.sh
   ```
