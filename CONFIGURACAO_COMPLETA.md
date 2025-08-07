# 🚀 Configuração Completa: Expo + Railway + Supabase

## 📋 Arquitetura Final
- **Frontend**: React Native + Expo
- **Backend**: Node.js + Express (Railway)
- **Database**: Supabase (PostgreSQL)

## 🔧 Passo 1: Configurar Supabase

### 1.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Faça login/cadastro
3. Clique em "New Project"
4. Configure:
   - **Organization**: Sua organização
   - **Name**: `orbitrum-connect`
   - **Database Password**: Senha forte
   - **Region**: São Paulo (recomendado)

### 1.2 Obter Credenciais
Após criar o projeto, vá em **Settings > API** e copie:
- **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
- **anon public**: `eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 1.3 Configurar Banco de Dados
Execute no **SQL Editor** do Supabase:

```sql
-- Criar tabela de perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🔧 Passo 2: Configurar Railway

### 2.1 Deploy do Backend
```bash
# Navegar para a pasta do backend
cd ../9/OrbitrumPro1/backend

# Instalar dependências
npm install

# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Deploy
railway up
```

### 2.2 Configurar Variáveis no Railway
No painel do Railway, configure:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# JWT
JWT_SECRET=sua-jwt-secret-super-segura
SESSION_SECRET=sua-session-secret

# App
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://expo.dev/accounts/seu-usuario/projects/orbitrum-connect
```

## 🔧 Passo 3: Configurar Expo

### 3.1 Variáveis de Ambiente
Crie arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
EXPO_PUBLIC_RAILWAY_API_URL=https://seu-projeto.railway.app
```

### 3.2 Login no Expo
```bash
npx expo login
# Email: phpg69@gmail.com
# Senha: p6p7p8P9!
```

### 3.3 Configurar Projeto
```bash
# Configurar EAS
npx eas build:configure

# Atualizar app.json com projectId correto
```

## 🚀 Passo 4: Testar Tudo

### 4.1 Iniciar Expo
```bash
npx expo start
```

### 4.2 Visualizar no:
- **Web**: http://localhost:8081
- **Mobile**: Escanear QR code com Expo Go
- **Expo.dev**: https://expo.dev/accounts/seu-usuario/projects/orbitrum-connect

## 📱 URLs Importantes

### Supabase
- **Dashboard**: https://supabase.com/dashboard/project/seu-projeto
- **API Docs**: https://supabase.com/docs/reference/javascript

### Railway
- **Dashboard**: https://railway.app/dashboard
- **API**: https://seu-projeto.railway.app

### Expo
- **Dashboard**: https://expo.dev/accounts/seu-usuario/projects
- **Build**: https://expo.dev/accounts/seu-usuario/projects/orbitrum-connect/builds

## 🔐 Segurança

### Supabase RLS
```sql
-- Exemplo de política adicional
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
```

### Railway CORS
```javascript
// No backend
app.use(cors({
  origin: ['https://expo.dev', 'http://localhost:8081'],
  credentials: true
}));
```

## 🚀 Deploy Final

### Build para Produção
```bash
# Android APK
npx eas build --platform android

# iOS
npx eas build --platform ios

# Web
npx expo export --platform web
```

### Submeter para Stores
```bash
# Android Play Store
npx eas submit --platform android

# iOS App Store
npx eas submit --platform ios
```

## 📞 Suporte

- **Expo**: https://docs.expo.dev
- **Railway**: https://docs.railway.app
- **Supabase**: https://supabase.com/docs

---

**Arquitetura: Expo + Railway + Supabase** ✅
