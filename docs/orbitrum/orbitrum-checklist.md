---
name: orbitrum-checklist
description: "Checklist FINAL robusto do Orbitrum — estado provado + caminho por fases (pro/elite, futuro), ligado ao escopo e às regras inegociáveis"
metadata:
  node_type: memory
  type: project
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-30T06:44:00.700Z
---

# CHECKLIST FINAL ROBUSTO — ORBITRUM

Guia vivo. Regra: só marca `[x]` o que foi **rodado e verificado** (empírico). Base: [[orbitrum-visao]],
[[orbitrum-design-alvo]], [[orbitrum-monetizacao]], [[orbitrum-continuidade]], [[orbitrum-camada-execucao]],
[[orbitrum-analise-mercado]], [[orbitrum-preservar-existente]], [[orbitrum-modo-de-trabalho]] + diários.

## 0. REGRAS QUE GOVERNAM (não violar)
- **Não-regressão (nº1):** infra ≠ feature no mesmo commit; nunca afirmar "funciona" sem rodar; não
  remover tabela/rota/regra/tela num "fix". **Nunca mexer no sistema orbit sem "go"** ([[orbitrum-preservar-existente]]).
- **Não fabricar dado:** empty-state que ENSINA; nunca número/movimento/posição falsos.
- **Tese econômica:** validar NUNCA paga; fato não se apaga (só substitui); §35 (explicação, nunca o grafo cru);
  sem paywall em conexão/experiência/validação; crédito ≠ reward ≠ BRL; não custodial (PSP move dinheiro).
- **Localização:** estado explícito, autorizado e temporário (não vigilância).
- **Empírico + memória + diário** a cada bloco.

## 1. ESTADO ATUAL — PRONTO E PROVADO (rodando localhost:3000, branch feat/camada-fatos-relacionais)
- [x] Motor de **fatos relacionais** (confiança/validade/decay/§35/idempotência) PERSISTINDO no Supabase.
- [x] Home = design-alvo com **sistema orbit preservado** no miolo; fluxo da tese **inline** (busca→perfil→
      conversa→validação numa tela); navegação 100% (nada órfão); atividade recente REAL dos fatos.
- [x] **Camada de execução:** barra operacional **0–100%** na conversa; mini-mapa com **caminhozinho** +
      "como ir" (Uber/99/Maps) no deslocamento; **presença on/off** (lê estado real); **/mapa** contido só
      de disponíveis; perfil-tese ("por que apareceu", caminho com fotos, conexões em comum).
- [x] **Continuidade** (deep-links; não reconstrói Uber/WhatsApp/Maps).
- [x] Login (Entrar/Sair, onSuccess→useAuth), admin e teams funcionando.
- [x] Sidebar reutilizável consistente (Início/Teams/Meu Painel/Mapa/Admin/Controle-GPS); menos neon;
      **glassmorphism navy global**.
- [x] Bug de **catch-all** corrigido (~1000 rotas 404→200).

## 2. FASE A — ACABAMENTO ELITE (UI/UX; NÃO toca economia) ← PRÓXIMO
- [ ] **Dashboards cliente/profissional** (11 abas internas): refino visual pro elite + **ligar dado real**
      onde houver (muitos endpoints devolvem vazio honesto hoje); empty-state onde não há; nada fabricado.
- [ ] **Paleta exata** (#000915 / #00BFFF, cyan acento) aplicada de verdade; menos glow.
- [ ] **Mobile fino:** sidebar colapsar (hambúrguer) no celular + bottom-nav; testar iOS/Samsung.
- [ ] **Cards do OrbitSystem** (★ legado → pessoa+fatos) — **SÓ com "go" do Pedro** (não mexer no orbit sem ordem).
- [ ] Extrair componentes reutilizáveis (RecommendationCard, ReasonChip, etc.) — DRY.
- [ ] Cosmético não-fatal: DialogTitle/aria no LoginModal; tela legada chamando /api/notifications.

## 3. FASE B — CAMADA DE EXECUÇÃO COMPLETA (Experience Layer §10, [[orbitrum-camada-execucao]])
- [ ] **Trilha bilateral** cliente↔prestador com timestamps (evento por transição) — evoluir a barra atual.
- [ ] **Ring/aceite real:** ao Conectar toca no cel do pro; só entra na conversa se ele aceitar. Via
      indicação, a cadeia inteira preservada. (Hoje o aceite é manual no MVP.)
- [ ] **Relatório da experiência com CONSENTIMENTO** (gatilho na validação → evidência ligada ao fato):
      trabalho/data/partes(§35)/confirmações/evidência; conversa só com consentimento dos dois (LGPD).
      Protege os 4 (cliente/pro/quem indicou/Orbitrum). Avaliar `report-generator.ts`.
- [ ] **Solicitar indicações** (Opportunity Layer): postar necessidade → a rede indica. Avaliar `referral-system.ts`.
- [ ] **B2B transversal:** empresa conecta a operação e vê a órbita operacional dos prestadores (não troca ERP).

## 4. FASE C — ECONOMIA (Bloco C) — spec jurídica ANTES do código ([[orbitrum-monetizacao]])
- [ ] **1º: spec jurídico-operacional de 1 página** (o que é Credit/Reward/"resultado elegível", quando nasce
      o direito, cancela/estorna, Ledger, PSP, nota fiscal, textos proibidos) + **parecer advogado/contador**.
- [ ] **Depois** (só então mexer no código): reformular telas — remover cashback/% sobre saldo/renda/jogos/
      token-pacote; planos **0 / 9,90 Indicador / 19,90 Pro / 29,90 Empresa** (hipótese de teste); **tokens →
      crédito de uso** (não sacável); **saque legítimo** = Orbit Reward por resultado elegível via PSP não-custodial.
- [ ] Regra: **sem paywall em conexão/experiência/validação**; sem take-rate por serviço agora.

## 5. FASE D — SEGURANÇA (Bloco A)
- [ ] Revogar a PAT · trocar a senha do Pedro (as duas foram ao chat).
- [ ] Remover os 138 console.log do build; db.ts não logar credencial; queryClient retornar `[]` (não `null`) p/ listas.

## 6. FASE E — PRODUÇÃO ("só Supabase")
- [ ] Converter rotas críticas em **RPC Postgres** (SECURITY DEFINER); merge do branch p/ main; Vercel (frontend).

## 7. FASE F — AGENTES + WORKER (a virada da tese) + DENSIDADE ([[orbitrum-agentes]])
Correção do Pedro (30/09): **não é "colocar IA no app".** Orbitrum = camada de contexto+registro que
**IAs/agentes EXTERNOS consultam e alimentam** (as IAs se conectam ao Orbitrum, não o contrário).
- [ ] **Densidade primeiro:** uma região + categoria até o loop girar sozinho (decisão do Pedro, não presumir).
- [ ] **Worker** (motor operacional determinístico): mapear os jobs que já existem (node-cron etc.) e
      completar coleta/valida/atualiza fatos/validade-decay/registra/dispara — mantém o contexto vivo.
- [ ] **API de agentes** `buscar_contexto` (fatos+conexões+validade+evidências, §35) e
      `registrar_resultado` como **RPC Postgres/MCP** — auth/escopo por agente, rate-limit, auditoria.
      Não entregar o controle do sistema. Orbitrum não vira chatbot; a IA é consumidora E produtora.

## NORTE (a régua que decide tudo)
> Útil para uma pessoa numa cidade antes de indispensável para um agente no mundo.
> A rede é o ativo; a recompensa acelera, não é o produto. Registro, não garantia.
