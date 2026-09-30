---
name: orbitrum-design-alvo
description: O norte visual do Orbitrum (web + mobile) que o Pedro definiu — e como cada elemento da tela é servido pela camada de fatos relacionais já construída
metadata:
  node_type: memory
  type: reference
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-29T06:02:03.223Z
---

# DESIGN ALVO — ORBITRUM

Imagens em `refs/design-alvo.png` (como precisa ficar) e `refs/design-atual.png` (como está hoje).
O alvo NÃO é só estética: é a interface direta do motor de fatos relacionais
(`relational-facts.ts`) — cada chip azul da tela é um fato do backend.

## O insight central

O design que o Pedro mandou **materializa o Documento Mestre e consome exatamente o backend
de fatos que construímos**. Não é coincidência: a arquitetura de dados e a interface
convergiram. Cada rótulo relacional na tela tem origem num registro do banco:

| Elemento visual do alvo | Fato / tabela que o serve |
| --- | --- |
| "Indicado por Ana" | `relational_facts` predicate=`indicou`, §35 (só nomeia conexão direta) |
| "Experiência validada" | `relational_facts` predicate=`trabalhou_com`, confidence=`validado` |
| "Disponível amanhã" | `relational_facts` predicate=`disponivel_em`, ainda vigente |
| "2 conexões em comum" | `connections` |
| "42 Experiências / 18 Indicações / 27 Validações" | contagem em `relational_facts` + `fact_confirmations` |
| "Como você chegou até ele? Você → Ana → Carlos" | caminho no grafo (Trust & Referral Graph) |
| "Recomendações para você" (com motivo) | `contextoRelacional()` → `motivos[]` |
| Ordenação da busca | `comporBusca()` — sinal relacional + atributo, separados |

Ou seja: **a tela do alvo é o `GET /api/orbitmatch/search` renderizado.** O que falta é o front,
não o conceito. O motor que alimenta essa interface já roda.

## Estrutura do alvo (web)

- **Marca:** ORBITRUM (não "Orbtrum") + tagline **"A rede que aprende com as próprias conexões"** (§75).
- **Sidebar:** Início · Minha Rede · Profissionais · Empresas · Oportunidades · Indicações ·
  Conversas · Ferramentas · Orbit Credits · Recompensas · Assinatura.
- **Plano Pro R$ 29,90/mês** (§24) — não os 4 planos antigos.
- **Centro:** "Sua rede em movimento / Cada conexão fortalece o seu ecossistema" — Neural Core
  com órbitas NOMEADAS (Profissionais +12 hoje, Empresas 3, Indicações 8 pendentes, Sua rede 42,
  Oportunidades 5). O nó orbital deixa de ser "estrela de rating" e passa a ser pessoa+fatos.
- **Busca central:** "O que você precisa resolver?" + filtros Localização/Prazo/Orçamento/Categoria (OrbitMatch, §8).
- **Painel direito — Recomendações:** cada card traz o MOTIVO ("Indicado por Ana", "Experiência
  validada", "Disponível amanhã") + nº de conexões + botão Conectar. É o §9 na tela.
- **Oportunidades próximas** (Opportunity Layer, §13) e **Atividade recente** (event stream, §51:
  "Ana indicou você para Carlos", "Você recebeu 10 Orbit Credits").
- **Conceitos do sistema:** Pessoas · Profissionais · Empresas · Necessidades · Indicações ·
  Experiências · Validações · Evidências · Oportunidades.
- **Totem físico** (§47) com QR + "Comece agora" + lojas de app.

## Estrutura do alvo (mobile, 5 telas)

1. **HOME** — Neural Core compacto + "Para você".
2. **BUSCA/ORBITMATCH** — "8 conexões encontradas", abas: Sua rede / Indicações / Próximos.
3. **PERFIL** — chips (Experiência validada, Indicado por Ana, 2 em comum) + placar
   Experiências/Indicações/Validações + Especialidades.
4. **CONEXÃO / TRUST GRAPH** — "Como você chegou até ele?" com o caminho Você→Ana→Carlos +
   "Trust & Referral Graph / Transparência em cada conexão". É o §6 desenhado.
5. **CHAT / NEGOCIAÇÃO** — Experience Layer (§10), negociação direta (§11).

## O gap: atual → alvo

| | Hoje (`design-atual.png`) | Alvo (`design-alvo.png`) |
| --- | --- | --- |
| Marca | "Orbtrum Connect" (grafia errada) | ORBITRUM + tagline |
| Centro econômico | **Tokens: 2160**, **+Tokens**, **JOGAR** | Orbit Credits · Recompensas · Assinatura R$29,90 |
| Nó orbital | profissional + **estrelas ⭐** (ranking) | pessoa + **fatos** (indicado/validado/disponível) |
| Busca | por nome | "O que você precisa resolver?" |
| Match | lista por rating | recomendação **com motivo** |
| Trust Graph | não existe | "Como você chegou até ele?" |
| Menu | Orbit/Teams/Tokens/Admin/Jogar/Telegram | Minha Rede/Empresas/Oportunidades/Indicações/Conversas |

O alvo **remove** o que decidimos remover (token-como-jogo, JOGAR, estrela-como-ranking) e
**adiciona** o que já construímos no backend (fatos, indicações, validações, Trust Graph,
explicação, R$29,90, Orbit Credits ≠ Recompensas). Está 100% alinhado com [[orbitrum-visao]].

## REFINAMENTO DE HIERARQUIA (decisão do Pedro, 2ª leitura)

A direção visual (dark/cyan, Orbit Network, "O que você precisa resolver?", OrbitMatch,
sem estrelas) está **certa e não muda**. O que muda é a HIERARQUIA: o alvo, como está,
ainda pode ler como "LinkedIn + marketplace + indicação". A tese é maior:

> Orbitrum não é onde você **procura profissionais**. É uma infraestrutura que usa relações,
> experiências, evidências e contexto para descobrir **quem pode resolver uma necessidade** —
> e aprende com o resultado.

A UI precisa **ensinar a tese sozinha**. O usuário não deve ter que ler o Documento Mestre
para entender por que o Orbitrum é diferente. Ajustes de hierarquia:

1. **Centro conceitual não é "Profissionais".** É a inteligência relacional:
   experiências · conexões · evidências no núcleo; necessidade e contexto como entrada.
   Profissional é resultado, não o eixo.
2. **"Por que apareceu?" é elemento CENTRAL, não um chip decorativo.** Ao abrir um resultado,
   a explicação é a tela: "Ana conhece Carlos · Ana indicou Carlos · experiência validada ·
   relacionada à sua necessidade · disponível amanhã · 3 km". É o `motivos[]` do
   `contextoRelacional()` renderizado. É o §7 (contextual merit) + §9 (explainable match).
3. **Experiências e Evidências ganham destaque** (hoje subrepresentadas no alvo). No perfil,
   **experiências relevantes > números**: "Instalação residencial ✓ validada · NR-10 ✓
   verificada" vale mais que "42 Experiências". Muda a leitura de "profissional com reputação"
   para "profissional contextual para ESTA necessidade".
4. **Trust Graph é camada, não feature.** O usuário nunca "entra no Trust Graph"; ele vê
   "Como você chegou até ele?" (Você → Ana → Carlos). O grafo roda por baixo (§35: explicação,
   nunca grafo cru).
5. **Menu reordenado** — rede em cima, dinheiro embaixo (§30: "reward is not the product"):
   `Início · Minha Rede · Profissionais · Oportunidades · Indicações · Conversas · Experiências
   · Ferramentas` e, mais abaixo/em Conta: `Orbit Credits · Recompensas · Assinatura`.
   Ver Recompensas cedo demais faz o usuário ler "plataforma para ganhar dinheiro" — o
   posicionamento que a visão proíbe.
6. **Minha Rede é área de primeira importância** (o ativo é densidade+qualidade de relações,
   não contagem de profissionais): "quem conhece quem, quem trabalhou com quem, quais
   experiências, quais relações validadas".
7. **Empresas e B2B: secundários no MVP.** O primeiro loop é
   pessoa → necessidade → profissional → conexão → experiência → validação → rede aprende.
   Complexidade depois.
8. **O ciclo não termina no chat.** Chat é caminho para a experiência real. A UI precisa
   fechar o loop: conversa → serviço → experiência concluída → **validar** → rede aprendeu →
   próxima busca melhor. Isso alimenta o flywheel (§4, §80).

**Home definitiva (hierarquia de cima para baixo):**
necessidade ("O que você precisa resolver?") → Orbit Network ("Sua rede em movimento") →
quem apareceu → **por que apareceu** → Conectar → experiências recentes → oportunidades da
rede → atividade. Recompensas/Credits nunca no topo.

## Consequência para o trabalho de front

Reconstruir essa interface é o maior bloco de trabalho de UI do projeto e não se faz num passe.
São **5 experiências**, não dezenas de páginas: Home/Network · OrbitMatch · Perfil/Contexto ·
Trust Graph/Conexão · Conversa/Experiência. Elas espelham o loop do backend.

Ordem sensata quando for a hora, cada passo consumindo dado que o motor **já produz**:
1. Marca (ORBITRUM+tagline), remover tokens-jogo/JOGAR/estrelas, reordenar menu.
2. Card de recomendação **com motivo** + tela "Por que apareceu?" (o `motivos[]` já existe).
3. Chips de fato + experiências relevantes no perfil.
4. Trust Graph "Como você chegou até ele?".
5. Órbita renomeada (nós = pessoas+fatos, não estrelas) + fechar o ciclo com "validar experiência".

---

## CONTRATO VISUAL DETALHADO (spec consolidada, endossada pelo Pedro)

Três contratos a respeitar juntos: **a imagem** (`refs/design-alvo.png`) é o contrato visual;
**o banco** é o contrato factual; **`relational-facts.ts`** é o contrato semântico.
Regra: se um componente precisa de dado que o backend não fornece, **apontar o gap — nunca fabricar**.

**Paleta exata (cyan é a cor semântica principal; nada de roxo/verde/laranja):**
- Fundo: `#000915` · navy `#011D37` · painéis `#000E1D`/`#001021`/`#011527` · azul profundo `#003865`
- Cyan: `#00BFFF`/`#00D9FF` · cyan luminoso `#39E7FF`
- Texto: `#EAF8FF` (principal) · `#7FA9C2` (secundário)
- Borda `rgba(0,190,255,0.35)` · glow `rgba(0,190,255,0.25)`

**Marca:** ORBITRUM (nunca "Orbtrum"/"Orbit"/"Orbitrum Connect" na interface). Tagline:
"A rede que aprende com as próprias conexões." Home: "Sua rede em movimento" / "Cada conexão
fortalece o seu ecossistema."

**Desktop:** topbar + sidebar (175–185px) + área central (Neural Core) + painel direito
(recomendações/oportunidades) + faixa de atividade recente. Sidebar: Início · Minha Rede ·
Profissionais · Empresas · Oportunidades · Indicações · Conversas · Ferramentas — separador —
Orbit Credits · Recompensas · Assinatura (menor destaque). Plano Pro R$29,90 no rodapé.

**Neural Core:** núcleo cyan com símbolo Orbitrum, órbitas elípticas (perspectiva, não círculos),
nós = pessoa+contexto (Profissionais +12 hoje, Empresas 3, Indicações 8, Sua rede 42,
Oportunidades 5). **Sem estrelas, sem ranking, sem nota.**

**Cards (regra fundamental):** pessoa + MOTIVO contextual. O motivo é mais importante que
qualquer estrela. `[avatar] Nome · profissão · km` + chips `[Indicado por Ana] [2 conexões]` +
`Conectar`. Nunca `★ 4.9`.

**Mapeamento chip → backend (contrato, já implementado):**
- "Indicado por Ana" → `relational_facts` predicate `indicou`
- "Experiência validada" → `trabalhou_com` + confidence `validado`
- "Disponível amanhã" → `disponivel_em` com `validUntil > now`
- "2 conexões" → `connections`
- "Por que apareceu?" → `contextoRelacional()` → `motivos[]`

**5 telas (o ciclo visível):** Home/Network · OrbitMatch (tabs Sua rede/Indicações/Próximos) ·
Perfil/Contexto (chips + placar + especialidades) · "Como você chegou até ele?" (Você→Ana→Carlos,
o Trust Graph como camada, §35) · Chat→Experiência→**Validar** (o chat não é o fim).

**Mobile:** experiência própria, bottom nav (Início · Rede · **+** · Conversas · Perfil), cards
verticais. Mesmo sistema visual do desktop (cores/tipografia/chips/glow), layout adaptado.

**Componentes reutilizáveis (criar de verdade, não HTML duplicado):** OrbitrumLogo, TopBar,
Sidebar, MobileBottomNav, NeuralCore, OrbitNode, SearchNeedInput, FilterChip, RecommendationCard,
ReasonChip, OpportunityCard, ActivityCard, ProfessionalCard, ProfessionalProfile, ExperienceCard,
RelationshipPath, ConnectionReason, ChatHeader, ChatBubble, ChatInput, PrimaryButton, SecondaryButton.

**Ordem de sprints (front):**
1. ORBITRUM + Sidebar + Topbar + Home + Neural Core + Search + RecommendationCard
2. OrbitMatch: tabs + results + reason chips
3. Perfil: experiências + validações + especialidades
4. "Por que apareceu?" / Você→Ana→Carlos
5. Chat → negociação → experiência → validação
6. Mobile polish + microinterações

**NÃO reintroduzir:** tokens como moeda principal, +Tokens, JOGAR, ranking por estrelas, rating
como eixo de confiança, gamificação central, promessa de ganho, aparência de crypto/cassino,
feed social genérico. Orbit Credits/Rewards existem, mas não no centro da Home.

**Estado atual vs contrato:** já feito — OrbitMatch e Home com cards de avatar+chips consumindo
`/api/orbitmatch/search` (chips reais do motor), Perfil/Contexto (rota `profile/:id`). Falta —
paleta exata aplicada (usei aproximação cyan), Neural Core caprichado, "Como você chegou até
ele?", chat→validação, mobile bottom-nav, e os componentes extraídos como reutilizáveis.

---

## TOM VISUAL — CLEAN/ELITE, NÃO NEON CARREGADO (reforço do Pedro)

A foto de referência é **clean, premium, sóbria**: fundo navy escuro, cyan como **acento
pontual** (não em tudo), glow **discreto**. Erros a evitar: neon berrante, glow forte em todo
elemento, gradientes chamativos por toda parte, aparência "gamer/crypto". Cyan é semântico
(marca ação/fato), não decoração. Botões e cards com bordas sutis e sombra suave, não brilho.

Aplicar: opacidades baixas nas bordas/fundos (feito), glow só no CTA principal e no Neural
Core, texto em tons frios (#EAF8FF / #7FA9C2), sem excesso de gradiente. A elegância vem da
composição e do espaço, não do brilho.

## STATUS DAS 5 TELAS MOBILE (foto 4)

1. HOME — ✅ `/inicio` (Neural Core, busca, recomendações com motivo)
2. BUSCA/ORBITMATCH — ✅ `/orbitmatch` (tabs Sua rede/Indicações/Próximos + cards avatar+chips)
3. PERFIL PROFISSIONAL — ✅ modal reescrito (chips, placar, experiências, especialidades; sem tokens)
4. CONEXÃO/TRUST GRAPH — ✅ "Como você chegou até ele?" (Você→intermediário→profissional, §35)
5. CHAT/NEGOCIAÇÃO — ✅ `/conversa/:id` (trilha até validar experiência → gera fato)

**Ainda falta:** bottom-nav mobile fixo (Início·Rede·+·Conversas·Perfil), aplicar a paleta
exata da spec, refino de tom (clean, menos glow), e a Home nova substituir a antiga em `/`
(hoje a home antiga com orbs/tokens ainda é a raiz; o modal de perfil já foi trocado pelo tese).
