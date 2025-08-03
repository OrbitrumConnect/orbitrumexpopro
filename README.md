# 🚀 Orbitrum Connect

Plataforma de networking profissional com interface orbital neural, sistema de tokens PIX e dashboards especializados.

## 🌌 Sobre o Projeto

Orbitrum Connect é uma plataforma revolucionária de networking profissional que reimagina como as pessoas se conectam através de uma interface orbital espacial. Os usuários interagem com profissionais exibidos como "orbs" orbitando ao redor de um hub neural central, criando uma experiência de networking imersiva e gamificada.

## ✨ Funcionalidades Principais

### 🌌 Interface Orbital Neural
- **Cérebro Neural Central**: Hub interativo expansível
- **3 Anéis Orbitais**: Rotação em velocidades diferentes
- **Orbs Profissionais**: 20+ profissionais com perfis detalhados
- **Animações Fluidas**: Framer Motion + CSS animations

### 💰 Sistema de Tokens PIX
- **5 Pacotes**: R$ 3,00 a R$ 32,00
- **Integração PIX**: QR Code + Código BR
- **Webhook Automático**: Créditos instantâneos
- **Carteira Digital**: Controle total de tokens

### 📊 Dashboards Especializados
- **Dashboard Cliente**: Gestão de tokens e conexões
- **Dashboard Profissional**: Portfolio e serviços
- **Dashboard Admin**: Analytics completos (9 abas)

### 🎮 Gamificação
- **Sistema de Recompensas**: Tokens por interações
- **Achievements**: Conquistas desbloqueáveis
- **Ranking**: Classificação de usuários

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** + shadcn/ui
- **Framer Motion** - Animações
- **Wouter** - Roteamento
- **TanStack Query** - Gerenciamento de estado

### Backend
- **Node.js** + Express
- **TypeScript** - Tipagem estática
- **PostgreSQL** + Drizzle ORM
- **WebSocket** - Comunicação real-time
- **QRCode** - Geração de PIX

### Deploy
- **Vercel** - Frontend
- **Railway** - Backend
- **Supabase** - Auth + Database

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL database
- Conta Supabase (opcional)

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd orbitrum-connect
```

### 2. Instalar Dependências
```bash
# Instalar todas as dependências
npm run install:all

# Ou instalar separadamente
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase (opcional)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Mercado Pago (PIX)
MERCADO_PAGO_ACCESS_TOKEN=your-mp-token
PIX_KEY=03669282106

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Executar o Projeto

#### Desenvolvimento
```bash
# Executar frontend e backend simultaneamente
npm run dev

# Ou executar separadamente
npm run dev:client  # Frontend na porta 3000
npm run dev:server  # Backend na porta 5000
```

#### Produção
```bash
# Build do frontend
npm run build

# Executar servidor
npm start
```

## 📁 Estrutura do Projeto

```
orbitrum-connect/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários e configurações
│   │   └── hooks/         # React hooks customizados
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── server/                 # Backend Express
│   ├── src/
│   │   ├── routes/        # Rotas da API
│   │   ├── db.ts          # Configuração database
│   │   └── index.ts       # Servidor principal
│   └── package.json
├── shared/                 # Tipos compartilhados
│   └── schema.ts          # Schema TypeScript
├── package.json           # Scripts principais
└── README.md
```

## 🎯 Funcionalidades Principais

### Interface Orbital
- **3 Anéis Rotativos**: Velocidades diferentes
- **20+ Profissionais**: Perfis completos
- **Interações**: Hover, click, drag
- **Animações**: Partículas e efeitos visuais

### Sistema PIX
- **Pacotes**: R$ 3, 6, 9, 18, 32
- **QR Code**: Geração automática
- **Webhook**: Processamento automático
- **Histórico**: Transações completas

### Dashboards
- **Cliente**: Tokens, conexões, histórico
- **Profissional**: Portfolio, serviços, reviews
- **Admin**: Analytics, usuários, financeiro

## 📊 Dados do Sistema

### Usuários Reais
- **Pedro Galluf**: R$ 3,00 → 2.160 tokens
- **Maria Helena**: R$ 6,00 → 4.320 tokens
- **João Vidal**: R$ 32,00 → 23.040 tokens
- **Admin**: Acesso total ao sistema

### Métricas
- **Receita Total**: R$ 41,00
- **Tokens em Circulação**: 29.520
- **Taxa de Conversão**: 100%
- **Uptime**: 24/7

## 🔧 Configuração Avançada

### Database
```bash
# Push schema para database
npm run db:push

# Gerar migrações
npm run db:generate

# Executar migrações
npm run db:migrate
```

### Deploy

#### Vercel (Frontend)
```bash
cd client
vercel --prod
```

#### Railway (Backend)
```bash
cd server
railway up
```

## 🎮 Como Usar

### 1. Acesse a Interface Orbital
- Navegue para a página principal
- Visualize os profissionais orbitando
- Clique no cérebro neural central

### 2. Compre Tokens
- Clique no cérebro neural
- Escolha um pacote (R$ 3-32)
- Escaneie o QR Code PIX
- Receba tokens instantaneamente

### 3. Conecte-se com Profissionais
- Clique nos orbs para ver detalhes
- Use tokens para iniciar conversas
- Acesse dashboards especializados

### 4. Dashboard Admin
- Acesse `/admin`
- Visualize todas as métricas
- Gerencie usuários e transações

## 🐛 Troubleshooting

### Erro: Database Connection
```bash
# Verificar DATABASE_URL no .env
# Testar conexão
npm run db:test
```

### Erro: Build Frontend
```bash
# Limpar cache
rm -rf client/node_modules
cd client && npm install
```

### Erro: PIX não funciona
```bash
# Verificar credenciais Mercado Pago
# Testar webhook endpoint
curl -X POST http://localhost:5000/api/payment/webhook/mercadopago
```

## 📈 Roadmap

- [ ] App mobile nativo (iOS/Android)
- [ ] Video calls integradas
- [ ] IA para matching avançado
- [ ] Suporte multi-idioma
- [ ] Features para empresas

## 🤝 Contribuição

Este é um projeto comercial. Para oportunidades de colaboração, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Proprietário - Todos os direitos reservados

---

**Criado com** ❤️ **pela equipe Orbitrum Connect**

*Conectando profissionais através de networking orbital inovador* 