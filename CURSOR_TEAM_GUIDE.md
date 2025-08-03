# 🚀 ORBITRUM CONNECT PRO - CURSOR TEAM GUIDE

## 📋 INFORMAÇÕES PARA O CURSOR TEAM

### 🎯 OBJETIVO
Migrar o sistema **Orbitrum Connect Pro** completo do Replit para o Cursor IDE, mantendo 100% das funcionalidades e dados reais.

### 💰 SISTEMA COMERCIAL ATIVO
- **Receita atual**: R$ 41,00 (confirmada)
- **Usuários ativos**: 8 usuários reais
- **Sistema PIX**: Funcionando com pagamentos R$ 3-32
- **Tokens em circulação**: 29.520 tokens

### 🔧 STACK TÉCNICO
```
Frontend: React 18 + TypeScript + Vite
Backend: Express.js + WebSocket
Database: Supabase Auth + PostgreSQL  
Styling: TailwindCSS + Framer Motion
Queries: TanStack Query + Wouter Router
Deploy: Hybrid Vercel + Railway
```

### ✅ PROBLEMA CRÍTICO RESOLVIDO
- **AdminDashboard crashava no Vercel** (55+ erros LSP)
- **Solução**: AdminDashboard-Safe.tsx criado (zero erros)
- **Status**: Pronto para produção Vercel

---

## 📁 ESTRUTURA DO REPOSITÓRIO

### Arquivos Essenciais:
```
client/               # Frontend React
server/               # Backend Express
shared/               # Tipos TypeScript compartilhados
public/               # Assets estáticos
package.json          # Dependências
tsconfig.json         # Configuração TypeScript
vite.config.ts        # Configuração Vite
tailwind.config.ts    # Configuração Tailwind
README.md             # Documentação
replit.md             # Histórico completo do projeto
```

### Componentes Críticos:
- `client/src/pages/AdminDashboard-Safe.tsx` ⚠️ **USE ESTA VERSÃO**
- `client/src/components/orbit-system.tsx` (Interface neural)
- `client/src/components/neural-brain.tsx` (Cérebro central)
- `server/storage.ts` (Dados reais dos usuários)

---

## 🚀 COMANDOS DE CLONE E SETUP

### 1️⃣ Clone do Repositório
```bash
git clone https://github.com/[USERNAME]/OrbitrumOriginalPro1.1.git
cd OrbitrumOriginalPro1.1
```

### 2️⃣ Instalação
```bash
npm install
```

### 3️⃣ Configuração de Ambiente
Criar arquivo `.env` com:
```env
DATABASE_URL=sua_url_postgresql
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### 4️⃣ Executar
```bash
npm run dev
```

---

## ⚠️ PONTOS CRÍTICOS DE ATENÇÃO

### 1. ADMIN DASHBOARD
- **NÃO usar** `AdminDashboard.tsx` (tem 55+ erros LSP)
- **USAR SEMPRE** `AdminDashboard-Safe.tsx` (zero erros)
- Verificar import no `App.tsx`:
```typescript
import AdminDashboardSafe from "@/pages/AdminDashboard-Safe";
```

### 2. DADOS REAIS PRESERVADOS
```javascript
// Em server/storage.ts - MANTER ESTES DADOS:
Pedro (phpg69@gmail.com): 2.160 tokens (R$ 3,00)
Maria Helena (mariahelenaearp@gmail.com): 4.320 tokens (R$ 6,00) 
João Vidal (joao.vidal@remederi.com): 23.040 tokens (R$ 32,00)
Admin (passosmir4@gmail.com): acesso total
```

### 3. SISTEMA PIX
- Endpoint: `/api/payment/create-pix-tokens`
- Valores: R$ 3, 6, 9, 18, 32
- CPF destino: 03669282106 (Pedro Galluf)

### 4. ROTAS ESSENCIAIS
```
/                     # Landing page
/admin               # Dashboard admin (USAR VERSÃO SAFE)
/dashboard-client    # Dashboard cliente  
/dashboard-professional # Dashboard profissional
/planos              # Planos de pagamento
```

---

## 🔧 TROUBLESHOOTING

### Erro: AdminDashboard com LSP errors
**Solução**: Sempre usar AdminDashboard-Safe.tsx

### Erro: Database connection
**Solução**: Configurar DATABASE_URL no .env

### Erro: Build falha no Vercel
**Solução**: AdminDashboard-Safe resolve os erros TypeScript

### Erro: Sistema PIX não funciona  
**Solução**: Configurar credenciais Mercado Pago no backend

---

## 📊 VALIDAÇÃO DO SISTEMA

### Checklist Obrigatório:
- [ ] AdminDashboard-Safe.tsx funcionando sem erros
- [ ] Sistema PIX criando QR codes válidos
- [ ] Usuários reais carregando com tokens corretos  
- [ ] Interface orbital (cérebro neural) funcionando
- [ ] Dashboards cliente/profissional operacionais
- [ ] Build TypeScript sem erros (0 LSP diagnostics)

### Teste de Receita:
```bash
curl http://localhost:5000/api/admin/stats
# Deve retornar: "totalRevenue": 4100 (R$ 41,00)
```

---

## 🎯 RESULTADO ESPERADO

Após migração completa, o sistema deve:
1. **Funcionar 100% igual** ao original
2. **Zero erros TypeScript** no build
3. **Dados reais preservados** (R$ 41,00 receita)
4. **Deploy Vercel** sem crashes
5. **Interface idêntica** (neural brain orbital)

---

## 📞 SUPORTE

- **Documentação**: `replit.md` (histórico completo)
- **Arquitetura**: `README.md` (overview técnico)  
- **Dados**: `server/storage.ts` (usuários reais)

**🔥 CRÍTICO**: Usar AdminDashboard-Safe.tsx para evitar crashes no Vercel!

---

✅ **Sistema 100% pronto para migração** - Receita R$ 41,00 confirmada!