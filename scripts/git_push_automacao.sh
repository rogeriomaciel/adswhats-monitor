#!/bin/bash

# --- AdsWhats Monitor — Git Automation Script ---
# Uso: bash scripts/git_push_automacao.sh <nome-da-branch> "<mensagem-do-commit>"

# Exige os dois parâmetros obrigatoriamente
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Erro: Parâmetros ausentes!"
  echo "Uso: bash scripts/git_push_automacao.sh <nome-da-branch> \"<mensagem-do-commit>\""
  echo "Exemplo: bash scripts/git_push_automacao.sh feature/ajuste-sla \"feat: ajusta cálculo de primeiro atendimento\""
  exit 1
fi

BRANCH_NAME=$1
COMMIT_MSG=$2

echo "🌳 1. Criando e migrando para a branch secundária: $BRANCH_NAME..."
git checkout -b "$BRANCH_NAME"
if [ $? -ne 0 ]; then
  echo "❌ Erro ao criar a branch. Verifique se o nome já existe."
  exit 1
fi

echo "🔍 2. Validando integridade e compilação (bun run build)..."
bun run build
if [ $? -ne 0 ]; then
  echo "❌ Erro: O build falhou! Abortando commit para proteger a main."
  exit 1
fi

echo "📦 3. Adicionando arquivos e realizando commit..."
git add .
git commit -m "$COMMIT_MSG"

echo "🚀 4. Enviando branch para o GitHub..."
git push origin "$BRANCH_NAME"
if [ $? -ne 0 ]; then
  echo "❌ Erro ao empurrar dados para o GitHub."
  exit 1
fi

echo "========================================================================="
echo "🔍 5. Verificando se o GitHub CLI (gh) está autenticado para criar o PR..."
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
  echo "🤖 GitHub CLI detectado e autenticado! Criando Pull Request automaticamente..."
  PR_URL=$(gh pr create --title "$COMMIT_MSG" --body "Pull Request automático criado pelo script de automação." --base main --head "$BRANCH_NAME")
  if [ $? -eq 0 ]; then
    echo "🎉 Pull Request criado com SUCESSO!"
    echo "🔗 Link do PR: $PR_URL"
  else
    echo "⚠️ Falha ao criar o Pull Request programaticamente. Por favor, crie manualmente no link enviado acima."
  fi
else
  echo "💡 GitHub CLI não está autenticado."
  echo "Acesse o GitHub para abrir o seu Pull Request manualmente:"
  echo "🔗 https://github.com/rogeriomaciel/adswhats-monitor/compare/main...$BRANCH_NAME"
fi
echo "========================================================================="

