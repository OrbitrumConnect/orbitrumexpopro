# 🚀 Orbitrum Monorepo

**Expo Frontend + Railway Backend + Supabase Database**

## 📁 Estrutura do Projeto

```
orbitrum-monorepo/
├── frontend/          # React Native + Expo
├── backend/           # Node.js + Express + Railway
├── shared/            # Código compartilhado
└── docs/             # Documentação
```

## 🛠️ Tecnologias

- **Frontend**: React Native, Expo, Supabase Client
- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Railway (Backend), Expo EAS (Frontend)
- **Payment**: MercadoPago, PIX

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm run install:all
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar com suas credenciais
nano .env
```

### 3. Executar Desenvolvimento
```bash
# Frontend + Backend simultaneamente
npm run dev

# Apenas Frontend
npm run dev:frontend

# Apenas Backend
npm run dev:backend
```

### 4. Build e Deploy
```bash
# Build completo
npm run build

# Deploy Backend (Railway)
cd backend && railway up

# Deploy Frontend (Expo EAS)
cd frontend && eas build
```

## 📱 Frontend (Expo)

- **Local**: `expo start` ou `npm start`
- **Web**: `expo start --web`
- **Android**: `expo start --android`
- **iOS**: `expo start --ios`

## 🔧 Backend (Railway)

- **Local**: `npm run dev` (porta 3000)
- **Railway**: Deploy automático via GitHub
- **URL**: `orbitrumexpopro-production.up.railway.app`

## 🔐 Supabase

- **URL**: `https://gnvxnsgewhjucdhwrrdi.supabase.co`
- **Auth**: JWT + Anonymous Login
- **Database**: PostgreSQL com Drizzle ORM

## 📋 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend + Backend simultaneamente |
| `npm run build` | Build completo do projeto |
| `npm run install:all` | Instalar todas as dependências |
| `npm run clean` | Limpar node_modules |

## 🎯 Status do Projeto

- ✅ **Frontend**: Expo configurado e funcionando
- ✅ **Backend**: Railway deployado e funcional
- ✅ **Database**: Supabase conectado
- ✅ **Monorepo**: Estrutura organizada
- ✅ **CI/CD**: GitHub + Railway + Expo EAS

## 📞 Suporte

- **Expo**: https://expo.dev/accounts/obritrum/projects/orbitrum
- **Railway**: https://railway.app/project/your-project-id
- **Supabase**: https://supabase.com/dashboard/project/your-project-id

---

**Desenvolvido com ❤️ pela Equipe Orbitrum**