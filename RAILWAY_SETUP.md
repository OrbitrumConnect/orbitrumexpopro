# 🚂 Configuração do Backend no Railway

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Conta no [Supabase](https://supabase.com)
3. Projeto backend da pasta `../9/OrbitrumPro1/backend`

## 🔧 Passo a Passo

### 1. Preparar o Backend

```bash
# Navegar para a pasta do backend
cd ../9/OrbitrumPro1/backend

# Instalar dependências
npm install

# Verificar se o projeto está funcionando
npm run dev
```

### 2. Deploy no Railway

#### Opção A: Via CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Inicializar projeto
railway init

# Deploy
railway up
```

#### Opção B: Via GitHub

1. Fazer push do código para GitHub
2. Conectar repositório no Railway
3. Configurar variáveis de ambiente
4. Deploy automático

### 3. Configurar Variáveis de Ambiente

No painel do Railway, configure as seguintes variáveis:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT e Sessão
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-your-mp-token
PIX_KEY=your-pix-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# App
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-expo-app.com
```

### 4. Configurar Domínio

1. No Railway, vá em "Settings" > "Domains"
2. Adicione um domínio personalizado ou use o domínio do Railway
3. Copie a URL para usar no frontend

### 5. Testar API

```bash
# Testar endpoint de saúde
curl https://your-railway-domain.com/health

# Testar autenticação
curl https://your-railway-domain.com/auth/test
```

## 🔐 Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha organização e nome do projeto
4. Configure senha do banco de dados
5. Escolha região (recomendado: São Paulo)

### 2. Configurar Banco de Dados

Execute os scripts SQL da pasta `shared/`:

```sql
-- Executar no SQL Editor do Supabase
-- Copiar e executar cada script
```

### 3. Configurar RLS (Row Level Security)

```sql
-- Exemplo de política para usuários
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

### 4. Configurar Autenticação

1. Vá em "Authentication" > "Settings"
2. Configure provedores de autenticação
3. Configure URLs de redirecionamento
4. Configure templates de email

## 📱 Integração com Expo

### 1. Atualizar Variáveis no Frontend

No arquivo `.env` do projeto Expo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_RAILWAY_API_URL=https://your-railway-domain.com
```

### 2. Testar Conexão

```javascript
// No App.tsx, testar conexão
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) throw error;
    console.log('Supabase connected:', data);
  } catch (error) {
    console.error('Supabase error:', error);
  }
};
```

## 🚀 Deploy Automático

### 1. Configurar GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

### 2. Configurar Secrets

No GitHub, vá em Settings > Secrets e adicione:
- `RAILWAY_TOKEN`: Token do Railway

## 📊 Monitoramento

### 1. Logs do Railway

```bash
# Ver logs em tempo real
railway logs

# Ver logs de um serviço específico
railway logs --service backend
```

### 2. Métricas

No painel do Railway:
- CPU e memória
- Requisições por minuto
- Tempo de resposta
- Erros

### 3. Alertas

Configure alertas para:
- CPU > 80%
- Memória > 80%
- Erros > 5%

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verificar DATABASE_URL
   - Verificar se o banco está ativo

2. **Erro de autenticação**
   - Verificar chaves do Supabase
   - Verificar configuração de RLS

3. **Erro de CORS**
   - Adicionar domínio do frontend nas configurações

4. **Timeout de build**
   - Verificar dependências
   - Otimizar build

### Comandos Úteis

```bash
# Reiniciar serviço
railway service restart

# Ver variáveis de ambiente
railway variables

# Acessar shell do serviço
railway shell

# Ver status do serviço
railway status
```

## 📞 Suporte

- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)

---

**Configuração completa para Railway + Supabase + Expo**
