# 🚀 Guia de Deploy - Orbitrum Connect

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com) (Frontend)
- Conta no [Railway](https://railway.app) (Backend)
- Banco de dados PostgreSQL
- Conta no [Mercado Pago](https://mercadopago.com) (PIX)

## 🌐 Deploy Frontend (Vercel)

### 1. Preparar Repositório
```bash
# Fazer commit de todas as alterações
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Configure as seguintes variáveis de ambiente:

```env
VITE_API_URL=https://your-railway-app.railway.app
```

### 3. Configurar Build
- **Framework Preset**: Vite
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm run install:all`

### 4. Deploy
```bash
# Via CLI
vercel --prod

# Ou via interface web do Vercel
```

## 🖥️ Deploy Backend (Railway)

### 1. Preparar Backend
```bash
# Navegar para pasta do servidor
cd server

# Verificar se o package.json está correto
cat package.json
```

### 2. Conectar ao Railway
1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório

### 3. Configurar Variáveis de Ambiente
No painel do Railway, adicione as seguintes variáveis:

```env
DATABASE_URL=postgresql://user:pass@host:port/db
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MERCADO_PAGO_ACCESS_TOKEN=your-mp-token
PIX_KEY=03669282106
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 4. Configurar Database
1. No Railway, clique em "New"
2. Selecione "Database" → "PostgreSQL"
3. Copie a URL de conexão
4. Cole na variável `DATABASE_URL`

### 5. Deploy
```bash
# Via CLI
railway up

# Ou via interface web do Railway
```

## 🔧 Configuração de Domínio

### Vercel (Frontend)
1. No painel do Vercel, vá em "Settings" → "Domains"
2. Adicione seu domínio customizado
3. Configure DNS conforme instruções

### Railway (Backend)
1. No painel do Railway, vá em "Settings" → "Domains"
2. Adicione domínio customizado
3. Configure DNS apontando para o Railway

## 🔐 Configuração de Segurança

### CORS
No backend, configure o CORS para aceitar apenas o domínio do frontend:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-app.vercel.app',
  credentials: true
}))
```

### Rate Limiting
O backend já inclui rate limiting configurado:
- 100 requests por 15 minutos por IP
- Ajuste conforme necessário

### Environment Variables
Certifique-se de que todas as variáveis sensíveis estão configuradas:
- `JWT_SECRET`
- `SESSION_SECRET`
- `DATABASE_URL`
- Credenciais do Mercado Pago

## 📊 Monitoramento

### Vercel Analytics
1. No painel do Vercel, vá em "Analytics"
2. Ative o analytics para monitorar performance

### Railway Logs
1. No painel do Railway, vá em "Deployments"
2. Clique em um deployment para ver logs
3. Configure alertas para erros

### Health Check
O backend inclui endpoint de health check:
```
GET https://your-railway-app.railway.app/api/health
```

## 🚨 Troubleshooting

### Erro: Build Failed
```bash
# Verificar logs
vercel logs
railway logs

# Verificar dependências
npm run install:all
```

### Erro: Database Connection
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT NOW();"
```

### Erro: CORS
```bash
# Verificar configuração CORS no backend
# Verificar FRONTEND_URL no Railway
```

### Erro: PIX não funciona
```bash
# Verificar credenciais Mercado Pago
# Testar webhook endpoint
curl -X POST https://your-railway-app.railway.app/api/payment/webhook/mercadopago
```

## 🔄 Atualizações

### Frontend
```bash
# Fazer alterações
git add .
git commit -m "Update frontend"
git push origin main

# Vercel fará deploy automático
```

### Backend
```bash
# Fazer alterações
git add .
git commit -m "Update backend"
git push origin main

# Railway fará deploy automático
```

## 📈 Escalabilidade

### Vercel
- Auto-scaling automático
- Edge functions disponíveis
- CDN global

### Railway
- Auto-scaling baseado em demanda
- Múltiplas regiões disponíveis
- Load balancing automático

## 💰 Custos Estimados

### Vercel (Frontend)
- **Hobby**: $0/mês (até 100GB bandwidth)
- **Pro**: $20/mês (até 1TB bandwidth)

### Railway (Backend)
- **Starter**: $5/mês (512MB RAM)
- **Standard**: $20/mês (2GB RAM)

### Database
- **Railway PostgreSQL**: $5/mês (1GB storage)
- **Supabase**: $0/mês (até 500MB)

## 🎯 Próximos Passos

1. **Configurar domínio customizado**
2. **Implementar SSL/HTTPS**
3. **Configurar backup automático**
4. **Implementar CI/CD**
5. **Configurar monitoramento avançado**

---

**🎉 Deploy concluído! Acesse sua aplicação em:**
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.railway.app
- Health Check: https://your-app.railway.app/api/health 