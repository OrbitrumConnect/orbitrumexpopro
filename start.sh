#!/bin/bash

echo "🚀 Iniciando Orbitrum Connect..."
echo

echo "📦 Instalando dependências..."
npm run install:all

echo
echo "🔧 Configurando ambiente..."
if [ ! -f .env ]; then
    echo "Copiando arquivo de exemplo..."
    cp env.example .env
    echo "⚠️  Configure as variáveis de ambiente no arquivo .env"
fi

echo
echo "🌟 Iniciando aplicação..."
npm run dev 