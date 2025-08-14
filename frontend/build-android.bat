@echo off
echo 🚀 Iniciando build do Android para Orbitrum Connect...

REM Verificar se está logado no EAS
echo 📋 Verificando login do EAS...
npx eas whoami

REM Configurar credenciais remotas
echo 🔑 Configurando credenciais remotas...
npx eas build:configure

REM Build para produção (sem auto-submit)
echo 🏗️ Iniciando build de produção...
npx eas build --platform android --profile production --non-interactive

echo ✅ Build iniciado! Acompanhe o progresso em: https://expo.dev/accounts/obritrum/projects/orbitrum-connect/builds
pause
