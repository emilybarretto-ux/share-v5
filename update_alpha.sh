#!/bin/bash

# Script de atualização para o ambiente Alpha
echo "🚀 Iniciando atualização do Bold Share Alpha..."

# 1. Puxar as últimas alterações do GitHub
echo "⏬ Puxando alterações do Git..."
git pull origin main

# 2. Instalar novas dependências (se houver)
echo "📦 Instalando dependências..."
npm install

# 3. Gerar o build de produção
echo "🏗️ Gerando build..."
npm run build

# 4. Reiniciar o processo no PM2
# Usamos o nome do processo específico para não afetar outros ambientes
echo "♻️ Reiniciando PM2..."
pm2 restart boldshare-alpha --update-env

echo "✅ Atualização concluída com sucesso!"
