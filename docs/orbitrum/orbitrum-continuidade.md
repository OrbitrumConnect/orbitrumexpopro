---
name: orbitrum-continuidade
description: "Camada de Continuidade (\"Continuar\") do Documento Mestre — Orbitrum conecta, o ecossistema executa, o usuário escolhe, a rede aprende; não reconstruir Uber/WhatsApp/Maps, fazer deep-link"
metadata:
  node_type: memory
  type: project
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-29T23:08:24.469Z
---

# CAMADA DE CONTINUIDADE — "CONTINUAR" (princípio estrutural do Documento Mestre)

Princípio que o Pedro consolidou na tese final. Muda o desenho do produto e resolve
"o Orbitrum não precisa ser tudo".

> **Orbitrum conecta. O ecossistema executa. O usuário escolhe. A rede aprende.**

## A ideia
O Orbitrum **não reconstrói** WhatsApp, Uber, 99, Maps, Instagram, LinkedIn, Agenda. Depois de
uma conexão/experiência/descoberta, ele mostra **"Como deseja continuar?"** e encaminha (deep-link)
para o app que o usuário escolher. O Orbitrum é a **camada de contexto e continuidade** sobre o
ecossistema que a pessoa já usa.

Exemplo após encontrar um profissional — **"Como deseja continuar?"**:
- Conversar → WhatsApp · Ver portfólio → Instagram/site · Ver localização → Maps
- **Ir até ele → Uber/99/Maps** · Agendar → agenda externa · Ver trabalho → LinkedIn
- Solicitar novamente / Indicar / Ver outras opções → **de volta ao Orbitrum**

## Consequência para o GPS/Uber (importante — reconcilia o que construí)
O mini-mapa "a caminho" no card (MiniMapa.tsx, geo real, sem simular) continua válido para a
IMERSÃO dentro do Orbitrum. Mas **"Ir até ele" NÃO precisa reconstruir o Uber** — é um deep-link
para Uber/99/Maps. Ou seja: o Orbitrum mostra o contexto e a chegada; o transporte real é do
ecossistema. Isso baixa muito o custo e é mais alinhado com a tese.

## Consequência para o negócio
Não é preciso monetizar cada saída. A receita vem principalmente da **assinatura da
infraestrutura** (§25). O usuário não sente "tudo aqui é tentativa de me vender algo". Filosofia:
"preciso de algo → o Orbitrum me ajuda a encontrar um caminho".

## O ciclo completo (com continuidade)
necessidade → Orbitrum → contexto → OrbitMatch → conexão → **CONTINUIDADE (serviço/ação no
ecossistema)** → experiência → validação → evidência → Trust/Referral Graph → **a rede aprende**
→ próxima necessidade.

## UI: o botão "Continuar"
Vira elemento importante da interface. Depois de qualquer evento: "Como deseja continuar?" /
"O que deseja fazer agora?" / "Qual é o próximo passo?" — faz o Orbitrum parecer uma **rede viva
de possibilidades**, não uma página de resultados.

Integrações oficiais/APIs/deep links/parcerias entram quando fizer sentido; a ausência de uma
integração específica não impede o conceito (mostra as opções do próprio aparelho).

Frase fundadora: *"uma necessidade de hoje pode se transformar na conexão que resolve uma
necessidade de amanhã."* O Orbitrum é a **memória viva das relações humanas úteis**.

Ligado a [[orbitrum-visao]], [[orbitrum-monetizacao]] (assinatura financia; saída não precisa
ser monetizada) e [[orbitrum-checklist]] (o "Ir até ele" do fluxo Uber = deep-link, não rebuild).
