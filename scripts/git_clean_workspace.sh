#!/bin/bash

# --- AdsWhats Monitor — Workspace Cleaner & Sync Script ---
# Uso: bash scripts/git_clean_workspace.sh

echo "🔄 1. Chaveando para a branch principal (main)..."
git checkout main
if [ $? -ne 0 ]; then
  echo "❌ Erro: Não foi possível mudar para a main. Certifique-se de que não há alterações pendentes sem commitar."
  exit 1
fi

echo "🚀 2. Sincronizando com o repositório remoto (git pull)..."
git pull origin main
if [ $? -ne 0 ]; then
  echo "❌ Erro ao atualizar a branch main a partir do GitHub."
  exit 1
fi

echo "🔍 3. Buscando branches deletadas no GitHub (pruning)..."
git fetch -p

echo "🧹 4. Identificando e limpando branches locais já mescladas..."
MERGED_BRANCHES=$(git branch --merged main | grep -v '^[ *]*main$')

if [ -n "$MERGED_BRANCHES" ]; then
  echo "Branches locais mescladas detectadas para remoção:"
  echo "$MERGED_BRANCHES"
  echo "Excluindo..."
  echo "$MERGED_BRANCHES" | xargs git branch -d
  echo "✅ Branches locais limpas com sucesso!"
else
  echo "✨ Nenhuma branch local antiga pendente de limpeza."
fi

echo "========================================================================="
echo "🎉 WORKSPACE SINCRONIZADO E 100% PRONTO PARA A PRÓXIMA TAREFA! 🚀"
echo "A branch main está atualizada com o deploy de produção!"
echo "========================================================================="

