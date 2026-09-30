---
name: orbitrum-deploy
description: "Registro de deploy e conexões do Orbitrum — env vars, Supabase, login Google, Mercado Pago, domínio orbitrum.com.br, Vercel; o que já está x o que falta reconfigurar"
metadata:
  node_type: memory
  type: reference
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-30T14:22:05.272Z
---

# DEPLOY + CONEXÕES — ORBITRUM (registro pra reconexão)

Histórico: o app rodava em **orbitrum.com.br** com PIX (formato antigo de tokens); o **Supabase
antigo expirou/se perdeu** → app parado ~9 meses. Voltou. **Supabase NOVO** criado: `wuaupjjbfvctelvyyfda`
(sa-east-1). Este doc lista TODAS as conexões, o estado e os passos de reconexão.

## Realidade arquitetural (REAVALIADA — Vercel 2026, Pedro 30/09)
**O diagnóstico antigo "Vercel = só frontend, precisa Railway" está DESATUALIZADO.** Em 2026 a Vercel
hospeda **backend Node/Express** (zero-config, detecta server.ts na raiz), functions até ~30min em
certos planos, WebSockets em beta, Vercel Cron, Node 24 padrão (Node 20 descontinua 01/10/2026).
**Então NÃO adicionar Railway por reflexo.** Direção "só Supabase" pode virar **Vercel (frontend +
backend API) + Supabase (dados)** — exatamente a Fase E.

**Auditoria do backend do orbitrumexpopro (o que roda / o que precisa adaptar pra Vercel):**
- ✅ **Motor da tese é stateless + DB-backed:** `factStore` usa `DrizzleFactStore` (Postgres) quando há
  `DATABASE_URL`; as rotas `/api/orbitmatch/*` leem/gravam o banco por request. **Compatível com functions.**
- ✅ **Sem escrita em filesystem** (nada de fs.write) — ok pro fs read-only do serverless.
- ⚠️ **Precisa adaptar (é trabalho, não config):**
  1. `index.ts` faz `server.listen({port,host,reusePort})` (linha ~178) — na Vercel se **exporta o app**
     (handler), não se dá listen. Guardar o listen pra rodar só local (`if (!process.env.VERCEL)`).
  2. **Init persistente no boot** (WebSocket, plan-expiry, supabaseSync a cada 5min, notification-system,
     health-monitoring) — serverless não segura processo. **Gatear off na Vercel**; a maioria é economia/ops
     (CONGELADA/adiável). Vira **Vercel Cron** depois se precisar.
  3. **WebSocket** (behavior-tracker/notifications/payment/routes) — beta na Vercel; **adiar** (a tese é
     HTTP req/resp; real-time depois via Supabase Realtime/polling).
  4. **vercel.json:** rotear `/api/*` pro backend Node + resto pro `client/dist`.
- **Worker (Fase F):** o loop contínuo NÃO vai numa function HTTP — vira **Vercel Cron / função agendada /
  fila**. Não misturar com a API. Ver [[orbitrum-agentes]].

**Veredito:** **Vercel + Supabase é viável** (sem Railway). O motor da tese pode rodar como functions; falta
a **adaptação do boot** (exportar handler + gatear init persistente + roteio). É a Fase E, feita direito.
Precisa de um **deploy de teste real na Vercel** pra validar (conta do Pedro).

## ENV VARS (inventário do código)
**Frontend (client, `VITE_*` — embutidas no build; precisam estar no Vercel):**
- `VITE_SUPABASE_URL` = URL do Supabase novo (`https://wuaupjjbfvctelvyyfda.supabase.co`).
- `VITE_SUPABASE_ANON_KEY` = anon key do Supabase novo.
- `VITE_VERCEL` (flag opcional). `VITE_API_URL` — **hoje aponta pro Railway MORTO no vercel.json → corrigir**.

**Backend (se hospedar o Express — E2):**
- `DATABASE_URL` (pooler do Supabase, transaction :6543) · `SUPABASE_URL` · `SUPABASE_ANON_KEY`
- `SESSION_SECRET` · `NODE_ENV=production` · `PORT` · `FRONTEND_URL` (https://orbitrum.com.br) · `WEBHOOK_URL`
- **Economia (CONGELADA — não configurar agora):** `MERCADO_PAGO_*` (ACCESS_TOKEN/PUBLIC_KEY de
  recebimento e pagamento), `PICPAY_*`, `COMPANY_PIX_KEY`. Ver [[orbitrum-monetizacao]] (Bloco C).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — ver login Google abaixo (na prática ficam no Supabase).

## LOGIN COM GOOGLE (como funciona)
Via **Supabase Auth**: `supabase.auth.signInWithOAuth({ provider: 'google' })` (login-modal.tsx).
Ou seja, o Google OAuth é configurado **no painel do Supabase**, não no código. Pra reconectar:
1. **Supabase → Authentication → Providers → Google:** ativar + colar `GOOGLE_CLIENT_ID` e
   `GOOGLE_CLIENT_SECRET` (do Google Cloud Console).
2. **Google Cloud Console → OAuth Client → Authorized redirect URIs:** incluir o callback do Supabase
   `https://wuaupjjbfvctelvyyfda.supabase.co/auth/v1/callback` (e o domínio do app).
3. **Supabase → Authentication → URL Configuration:** Site URL = `https://orbitrum.com.br`; Redirect
   URLs = domínio + localhost (dev). Como o Supabase é NOVO, isso precisa ser refeito do zero.

## VERCEL (frontend)
- **Projeto:** apontar pro repo `orbitrumexpopro`, branch (main após merge). Build: `cd client &&
  npm run build:no-check`, output `client/dist` (já no vercel.json).
- **Env vars no Vercel:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Supabase novo).
- **vercel.json a CORRIGIR:** remover `VITE_API_URL` apontando pro Railway morto. As rotas `/api/*`
  só fazem sentido se houver backend (E2) — senão o frontend chama o Supabase/RPC direto (E1).
- **Domínio:** `orbitrum.com.br` → adicionar no projeto Vercel (DNS: CNAME/A pra Vercel).

## VALORES DE CONEXÃO (públicos — os SEGREDOS ficam só no painel/env, NUNCA no repo)
- **Supabase project ref:** `wuaupjjbfvctelvyyfda` · URL: `https://wuaupjjbfvctelvyyfda.supabase.co`
- **VITE_SUPABASE_ANON_KEY** (público, já vai no bundle): JWT `...role:anon...` (o Pedro tem; setar no Vercel).
- **Google Cloud:** projeto **ObitrumConnect** (nº 121421440463).
- **Google OAuth Client ID** (público): `121421440463-0mg5feniels1t555rom2954idbklt37b.apps.googleusercontent.com`
- **Callback OAuth corrigido (30/09):** `https://wuaupjjbfvctelvyyfda.supabase.co/auth/v1/callback`
  (era o Supabase ANTIGO `gnvxnsgewhjucdhwrrdi` — trocado). Origem `chatodemais.vercel.app` era de outro projeto.
- **SEGREDOS (NÃO gravar aqui — só no painel Supabase / env Vercel; rotacionar pois passaram no chat):**
  service_role key, Google Client Secret (`GOCSPX-...`), DATABASE_URL (tem senha).
- **Supabase Edge Functions (Deno):** opção pra hospedar worker/motor — reforça "só Supabase".

## DOMÍNIO
`orbitrum.com.br` (o Pedro tem). Apontar o DNS pro Vercel (frontend). Se E2 (backend hospedado),
o frontend fala com o host do backend (via env) ou com o Supabase (E1).

## ESTADO DO DEPLOY (atualizado 30/09)

**Arquitetura escolhida: Vercel (frontend + API function) + Supabase (dados).** Sem Railway/Render.
O motor da tese (Express, fatos relacionais, rotas) roda como Vercel Serverless Function via `api/index.ts`.

**O que foi feito (commits 13c8dc0, 501c14c):**
- `api/index.ts`: entry serverless, importa `app`+`ready` do backend/index.ts
- `backend/index.ts`: guardado com `IS_VERCEL` (sem listen/WS/cron/vite no serverless)
- `package.json` raiz: deps do backend na raiz (express, drizzle, postgres, etc.); workspaces removido
- `vercel.json`: install raiz → build client (com install); functions `api/index.ts`; rewrites
- `tsconfig.json` raiz: paths `@shared/*` → `backend/shared/*` (schema real do Drizzle)
- Push feito em orbitrumexpopro + OrbitrumProConnect (main + master)

**Iterações de build:**
1. ❌ `cd client: No such file` — workspaces morto no package.json
2. ❌ installCommand encadeado `npm install && cd client && npm install` saiu com 1 — separado
3. ⏳ Build 501c14c — install raiz + build (com install client) separados — aguardando

**PASSO A PASSO PRA VOLTAR AO AR:**
1. **Vercel:** Root Directory = vazio (raiz do repo). Env vars (ver abaixo). Deploy automático de main.
2. **Supabase:** tabelas/RLS ok (feito 29/09). Google provider (painel Supabase, ver "LOGIN COM GOOGLE").
3. **Domínio:** `orbitrum.com.br` → CNAME/A pro Vercel.
4. **Testar:** login (Google), busca, mapa, presença — ponta a ponta.
5. **Pagamento:** NÃO religar (Bloco C congelado até spec jurídica).

## O QUE PRECISA DA AÇÃO DO PEDRO (painel, não código)
- **Vercel:** Root Directory = vazio; env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SESSION_SECRET`).
- **Supabase Auth:** Google provider (Client ID + Secret) + URL Config (Site URL = orbitrum.com.br).
- **Google Cloud Console:** Redirect URI = `https://wuaupjjbfvctelvyyfda.supabase.co/auth/v1/callback` ✅ (feito 30/09).
- **Domínio:** apontar DNS `orbitrum.com.br` → Vercel.
- Chaves de pagamento: só quando Bloco C sair do congelamento.
- **Iterar build:** mandar log se falhar (deps/paths — pode precisar 1-2 ajustes).

## O QUE O ASSISTENTE PODE FAZER NO CÓDIGO
- Ajustes de build (vercel.json, deps, paths) com base no log.
- Acabamento elite (Fase A), camada de execução (Fase B) — sem regressão.
- Preparar API de agentes (Fase F) — quando densidade existir.
