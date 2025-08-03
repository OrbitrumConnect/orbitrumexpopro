@echo off
echo 🚀 Iniciando Orbitrum Connect...
echo.

echo 📦 Instalando dependências...
call npm run install:all

echo.
echo 🔧 Configurando ambiente...
if not exist .env (
    echo Copiando arquivo de exemplo...
    copy env.example .env
    echo ⚠️  Configure as variáveis de ambiente no arquivo .env
)

echo.
echo 🌟 Iniciando aplicação...
call npm run dev

pause 