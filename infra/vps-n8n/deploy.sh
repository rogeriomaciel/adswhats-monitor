#!/usr/bin/env bash
# ==============================================================================
# Script de provisionamento e deploy do n8n na VPS (Template IaC)
# Exemplo de uso: REMOTE_IP=198.51.100.1 DOMAIN=n8n.seudominio.com KEY_PATH=~/.ssh/id_rsa ./deploy.sh
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_PATH="${KEY_PATH:-$SCRIPT_DIR/../../sec/n8n.pem}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE_IP="${REMOTE_IP:-SEU_IP_VPS}"
DOMAIN="${DOMAIN:-n8n.seudominio.com}"

if [ "$REMOTE_IP" = "SEU_IP_VPS" ]; then
    echo "Erro: Defina a variável REMOTE_IP antes de executar o script."
    exit 1
fi

chmod 600 "$KEY_PATH"

echo ">>> 1. Testando conexão SSH com $REMOTE_USER@$REMOTE_IP..."
ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "echo 'Conexão SSH bem-sucedida!'"

echo ">>> 2. Instalando Docker, Nginx, Certbot e configurando Swap na VPS..."
ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_IP" 'bash -s' << 'REMOTE_INIT'
set -euo pipefail

# 1. Configurar 2GB de Swap se ainda não existir
if [ ! -f /swapfile ]; then
    echo "Criando swap de 2GB..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap de 2GB criado com sucesso!"
else
    echo "Swap já existe."
fi

# 2. Atualizar pacotes
sudo apt update && sudo apt install -y curl ufw git ca-certificates gnupg nginx certbot python3-certbot-nginx

# 3. Instalar Docker e Docker Compose oficial (se não estiver instalado)
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker ubuntu
    echo "Docker instalado com sucesso!"
else
    echo "Docker já instalado."
fi

# 4. Criar diretório da aplicação
sudo mkdir -p /opt/n8n
sudo chown -R ubuntu:ubuntu /opt/n8n
REMOTE_INIT

echo ">>> 3. Enviando arquivos de configuração para a VPS (/opt/n8n)..."
scp -i "$KEY_PATH" "$SCRIPT_DIR/docker-compose.yml" "$REMOTE_USER@$REMOTE_IP":/opt/n8n/docker-compose.yml
scp -i "$KEY_PATH" "$SCRIPT_DIR/.env.example" "$REMOTE_USER@$REMOTE_IP":/opt/n8n/.env
scp -i "$KEY_PATH" "$SCRIPT_DIR/nginx-n8n.conf" "$REMOTE_USER@$REMOTE_IP":/tmp/nginx-n8n.conf

echo ">>> 4. Configurando Nginx, SSL Let's Encrypt e iniciando contêineres..."
ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "bash -s" << REMOTE_DEPLOY
set -euo pipefail

# Configurar VirtualHost do Nginx
sudo mv /tmp/nginx-n8n.conf /etc/nginx/sites-available/$DOMAIN
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Subir Docker Compose
cd /opt/n8n
sudo docker compose down --remove-orphans || true
sudo docker compose pull
sudo docker compose up -d

# Gerar Certificado SSL Certbot se ainda não tiver HTTPS
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "Gerando certificado SSL Let's Encrypt para $DOMAIN..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
    sudo systemctl reload nginx
else
    echo "Certificado SSL já existe."
fi

echo "Deploy do n8n concluído!"
sudo docker ps
REMOTE_DEPLOY

echo "=========================================================================="
echo ">>> Sucesso! n8n rodando em https://$DOMAIN"
echo "=========================================================================="
