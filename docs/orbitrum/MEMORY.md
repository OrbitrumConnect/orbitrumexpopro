# MEMÓRIA

## Orbitrum Connect — único projeto em escopo

- [Visão do sistema e da rede](orbitrum-visao.md) — LER PRIMEIRO. Definição, fato relacional, loop, princípios inegociáveis: não-regressão, seguro por arquitetura, legal para operar, pro/elite por design.
- [Modo de trabalho](orbitrum-modo-de-trabalho.md) — diário todo dia com timeline; escopo fechado só no Orbitrum; seguir sem pedir menu; subir em localhost:3000.
- [Checklist vivo](orbitrum-checklist.md) — passos concretos ligados ao escopo: o que já foi provado empírico e o que falta, na ordem do roteiro (Uber/GPS → visual → Bloco C → segurança → produção).
- [Preservar o existente](orbitrum-preservar-existente.md) — REGRA DURA: nunca remover/trocar o que existe (em especial o sistema orbit); só ADICIONAR o que falta; confirmar antes de mudança estrutural; não sair do escopo. (Erro cometido 2× em 29/09 — não repetir.)

- [Design alvo](orbitrum-design-alvo.md) — o norte visual web+mobile que o Pedro definiu (`refs/design-alvo.png` vs `refs/design-atual.png`); cada chip azul da tela é um fato do backend. Contém o contrato visual detalhado (paleta exata, componentes, sprints).
- [Análise de mercado](orbitrum-analise-mercado.md) — competidores (GetNinjas e a ferida do modelo de leads/moedas), futuro (agentes/MCP em 2026), desafios, adesão e a conclusão estratégica. Embasada em pesquisa web.
- [Monetização](orbitrum-monetizacao.md) — preço e tokens vs crédito: entrada grátis/baixa pra crescer, assinatura do profissional monetiza depois, crédito = uso não-sacável. Saque É viável, mas só de Orbit Reward por RESULTADO elegível (via PSP não-custodial, Reward Ledger); validar nunca paga; cashback/%/yield OUT. Sistema atual (4 planos + 8,7%) viola §5 = Bloco C.
- [Continuidade ("Continuar")](orbitrum-continuidade.md) — princípio do doc mestre: Orbitrum conecta, o ecossistema executa, o usuário escolhe, a rede aprende. Não reconstruir Uber/WhatsApp/Maps — deep-link ("Ir até ele" → Uber/99/Maps). Reconcilia o mini-mapa (imersão) com o transporte real (ecossistema).
- [Agentes + Worker](orbitrum-agentes.md) — Fase F corrigida: Orbitrum NÃO é uma IA; é a camada de contexto+registro que IAs/agentes EXTERNOS consultam (buscar_contexto) e alimentam (registrar_resultado). Worker = motor operacional que mantém os fatos vivos. As IAs se conectam ao Orbitrum, não o contrário.
- [Camada de Execução](orbitrum-camada-execucao.md) — a Experience Layer (§10) destravada: barra 0–100% como estado REAL da relação (não gamificação), trilha bilateral cliente↔prestador, localização AUTORIZADA e TEMPORÁRIA (não vigilância), B2B transversal (empresa conecta a operação, não troca o ERP), Orbitrum REGISTRA ≠ executa/garante. Acrescenta "+ execução real" ao loop.

## Diários (`diarios/`, um por dia, sempre com timeline puxando os anteriores)

- [2026-09-30](diarios/2026-09-30.md) — continuidade; pendências de ontem no topo; fechando loops (mapa só disponíveis, telas legadas) sem regressão.
- [2026-09-29](diarios/2026-09-29.md) — retomada; `orbitrumexpopro` é a base real; camada de fatos relacionais construída, testada (17/17) e ligada ao routes.ts; **Supabase novo criado** (`wuaupjjbfvctelvyyfda`) com as 27 tabelas, RLS e admin do Pedro; frontend religado ao Supabase real; login funciona (corrigido admin travado no e-mail e `User: undefined`). Termina com "MINHA VISÃO — de onde estamos até a rede do Documento Mestre". Pendências: revogar PAT, trocar senha, persistir fatos no Postgres, API para agentes.
