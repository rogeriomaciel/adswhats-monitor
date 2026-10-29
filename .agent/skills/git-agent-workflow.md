---
name: git-agent-workflow
description: Use esta habilidade SEMPRE que iniciar qualquer alteração, refatoração, correção de bug ou nova funcionalidade no projeto AdsWhats Monitor. Ela obriga o agente de IA a operar sob o fluxo estrito de branches, testes e Pull Requests (Git Flow).
---

# Fluxo de Trabalho do Agente com Git (Git Agent Workflow — AdsWhats Monitor)

Você atua como um Desenvolvedor Sênior altamente disciplinado e pragmático. Para assegurar a integridade do **AdsWhats Monitor**, você está **proibido** de fazer modificações diretas na branch `main` ou de subir código sem validações, garantindo que o deploy contínuo via GitHub Actions execute apenas após aprovação e merge de Pull Requests.

Você deve seguir rigorosamente o seguinte protocolo automatizado a cada tarefa de codificação:

---

## 1. Criação da Branch Secundária (Primeiro Passo)
Antes de editar qualquer arquivo de código ou workflow, verifique o status do Git e crie uma ramificação limpa baseada no estado mais recente da `main`:
```bash
git checkout main && git pull origin main
git checkout -b [feature|bugfix|hotfix]/nome-da-tarefa
```

---

## 2. Ciclo de Modificação & Validação Local
Após efetuar as alterações de código, você deve rodar os comandos de verificação utilizando **Bun** no terminal local:
1. **Linter / Tipos:** `bun run lint` (ou `bun run build`) para atestar a sintaxe e tipagem TypeScript.
2. **Build de Produção:** `bun run build` para garantir que o bundle final compila com 0 erros.

> [!IMPORTANT]
> **Regra de Ouro do Banco de Dados:** O frontend e o ambiente local **NÃO** possuem acesso direto ao banco PostgreSQL no Supabase. O **n8n** é o gateway exclusivo. Toda alteração de schema deve ser refletida em `docs/schema.sql` e aplicada via workflow `ADSWHATHS - DB-MIGRATIONS` ou SQL Editor do Supabase.

---

## 3. Sincronização Obrigatória de Workflows e Documentação (Regra de Ouro)
Antes de criar qualquer Pull Request ou realizar o commit final, você deve:

1. **Sincronizar Workflows do n8n:** Se alterou workflows no n8n de homologação/produção, garanta que os arquivos JSON em `agente/workflows/` estejam atualizados localmente no repositório.
2. **Respeitar o Prefixo:** Manter estritamente o prefixo `ADSWHATHS` em todos os workflows.
3. **Atualizar Documentação:** Mapear todas as alterações que efetuou na base de código e atualizar todos os arquivos de documentação técnica relevantes na pasta [docs/](file:///rogerio/core/adswhats-monitor/docs).
   - Se houve alterações de modelagem de dados, atualize [schema.sql](file:///rogerio/core/adswhats-monitor/docs/schema.sql) e [admin_and_data_model.md](file:///rogerio/core/adswhats-monitor/docs/admin_and_data_model.md).
   - Se houve novas telas ou regras de negócio, registre no [project_overview.md](file:///rogerio/core/adswhats-monitor/docs/project_overview.md) e [README.md](file:///rogerio/core/adswhats-monitor/README.md).

---

## 4. Commit e Push
Se todas as validações e documentações estiverem prontas e consistentes, faça o commit em lote contendo as alterações e as atualizações de docs usando o padrão de Commits Convencionais, enviando para o repositório remoto:
```bash
git add .
git commit -m "[feat|fix|chore]: descrição da alteração e sincronização de documentação"
git push origin [nome-da-branch-criada]
```

---

## 5. Criação do Pull Request (Automático via GitHub CLI)
Para tornar o fluxo totalmente transparente e profissional, o agente deve tentar criar o Pull Request programaticamente no GitHub:
1. **GitHub CLI (gh) Autenticado:** Execute o comando abaixo para abrir o PR sem que o usuário precise fazer cliques manuais:
   ```bash
   gh pr create --title "[tipo]: descrição clara" --body "Pull Request automático criado pelo agente de IA com documentação 100% atualizada." --base main --head [nome-da-branch]
   ```
2. **Validação do CI no PR:** Ao abrir o PR, a esteira do GitHub Actions rodará o `build-and-test`. Certifique-se de que o check visual esteja verde (`✓`).

---

## 6. Deploy Automático em Produção (Pós-Merge)
O deploy em produção **NÃO é manual**. Ele ocorre automaticamente via GitHub Actions quando o Pull Request é aprovado e mesclado na branch `main`:
1. O pipeline compila o frontend injetando `VITE_API_URL`.
2. Publica o frontend no servidor de produção.
3. Executa o deploy dos workflows `ADSWHATHS` diretamente na API do n8n de produção (`scripts/deploy_workflows_via_api.js`).

---

## 7. Limpeza e Poda de Branches (Pós-Merge)
**Gatilho de Ativação**: O agente deve executar este procedimento **somente** e **imediatamente após** o usuário enviar a confirmação no chat (ex: *"pr confirmado"*, *"PR aprovado"*, *"PR mergeado"* ou similares). 

Ao receber esse gatilho de confirmação no chat, o agente deve:
1. **Retornar e Sincronizar a Main**:
   ```bash
   git checkout main && git pull origin main
   ```
2. **Deletar a Branch Local Mesclada**:
   ```bash
   git branch -d [nome-da-branch-mesclada]
   ```
3. **Poda de Ramificações Remotas Inexistentes**:
   ```bash
   git fetch --prune
   ```

