# 🚀 Orbitrum Connect - React Native Expo

Aplicativo móvel desenvolvido com React Native e Expo, integrado com Supabase e Railway.

## 📱 Tecnologias

- **Frontend**: React Native + Expo
- **Backend**: Node.js + Express (Railway)
- **Database**: Supabase (PostgreSQL)
- **Build**: EAS Build
- **Deploy**: Expo Application Services

## 🛠️ Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `env.example` para `.env` e configure:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
EXPO_PUBLIC_RAILWAY_API_URL=sua_url_do_railway
```

### 3. Instalar Expo CLI (se necessário)

```bash
npm install -g @expo/cli
```

## 🚀 Como Executar

### Desenvolvimento Local

```bash
# Iniciar o servidor de desenvolvimento
npm start

# Ou usar expo diretamente
expo start
```

### Plataformas Específicas

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📱 Testando no Dispositivo

1. **Expo Go**: Baixe o app Expo Go na Play Store/App Store
2. **QR Code**: Escaneie o QR code que aparece no terminal
3. **Tunnel**: Use `expo start --tunnel` para conectar via internet

## 🏗️ Build e Deploy

### Configurar EAS

```bash
# Login no Expo
expo login

# Configurar projeto
eas build:configure
```

### Build para Produção

```bash
# Android APK
npm run build:android

# iOS
npm run build:ios
```

### Submeter para Stores

```bash
# Android Play Store
npm run submit:android

# iOS App Store
npm run submit:ios
```

## 🔧 Configuração do Backend (Railway)

### 1. Deploy no Railway

```bash
# Na pasta do backend
cd ../9/OrbitrumPro1/backend

# Instalar dependências
npm install

# Deploy
railway up
```

### 2. Configurar Variáveis no Railway

- `DATABASE_URL`: URL do Supabase
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `JWT_SECRET`: Chave secreta para JWT
- `MERCADO_PAGO_ACCESS_TOKEN`: Token do Mercado Pago

## 🔐 Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a URL e chave anônima

### 2. Configurar Banco de Dados

Execute os scripts SQL fornecidos na pasta `shared/` para criar as tabelas.

### 3. Configurar RLS (Row Level Security)

Configure as políticas de segurança conforme necessário.

## 📊 Estrutura do Projeto

```
├── App.tsx                 # Componente principal
├── app.json               # Configuração do Expo
├── package.json           # Dependências
├── eas.json              # Configuração EAS Build
├── babel.config.js       # Configuração Babel
├── metro.config.js       # Configuração Metro
├── assets/               # Imagens e recursos
├── env.example           # Variáveis de ambiente
└── README-EXPO.md        # Este arquivo
```

## 🐛 Troubleshooting

### Erro de Dependências

```bash
# Limpar cache
expo r -c

# Reinstalar dependências
rm -rf node_modules
npm install
```

### Erro de Build

```bash
# Limpar cache do EAS
eas build:clean

# Verificar configuração
eas build:configure
```

### Problemas de Conexão

1. Verifique as variáveis de ambiente
2. Confirme se o backend está rodando no Railway
3. Teste a conexão com o Supabase

## 📞 Suporte

Para problemas específicos:

1. Verifique os logs do Expo: `expo logs`
2. Consulte a documentação do Expo
3. Verifique a configuração do Supabase
4. Teste a API do Railway

## 🚀 Próximos Passos

1. ✅ Configurar autenticação completa
2. ✅ Implementar navegação com expo-router
3. ✅ Integrar com backend Railway
4. ✅ Configurar notificações push
5. ✅ Implementar funcionalidades específicas do app
6. ✅ Testes automatizados
7. ✅ CI/CD pipeline

---

**Desenvolvido com ❤️ usando Expo + Supabase + Railway**
