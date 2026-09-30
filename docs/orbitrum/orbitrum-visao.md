---
name: orbitrum-visao
description: "Visão definitiva do Orbitrum Connect — rede de fatos relacionais que agentes consultam e alimentam; princípios inegociáveis de não-regressão, segurança e legalidade"
metadata:
  node_type: memory
  type: project
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-29T23:22:40.949Z
---

# ORBITRUM CONNECT — VISÃO DO SISTEMA E DA REDE

Este é o escopo e o modelo de TODO trabalho no projeto. Ler antes de qualquer decisão técnica.
Único projeto em questão: **Orbitrum Connect**. Nenhum outro repositório da conta entra no escopo.

## 1. Definição

> Orbitrum é uma infraestrutura digital inteligente que transforma necessidades, relações,
> indicações e experiências em uma rede capaz de aprender e criar conexões cada vez mais
> contextualizadas.

**A rede que aprende com as próprias conexões.**
Need → Connect → Experience → Trust → Learn → Repeat.

## 2. A pergunta que decide o projeto

Não é mais "por que alguém baixaria o Orbitrum?".
É: **"por que um agente de IA precisaria consultar o Orbitrum para decidir melhor?"**

O app é UMA das portas. A rede é o ativo. O estado relacional é o conhecimento.
A rede pode ser invisível: agente consulta → recebe contexto → conecta → registra resultado → rede atualiza.

## 3. A unidade de valor: o fato relacional

O ativo não é lista de usuários nem volume de dados. Volume de dado ruim é lixo maior.
O ativo é o **fato relacional**: sujeito → predicado → objeto, com

contexto · quando · origem · evidência · confiança · validade · visibilidade

Confiança em níveis: **declarado < indicado < validado < verificado**.
Fato confirmado pelos dois lados vale mais que qualquer estrela — é o dado que busca aberta não tem.
Fato nunca é apagado nem sobrescrito: um fato novo substitui o anterior, o histórico permanece.
Todo fato tem validade; vencido continua no histórico mas perde peso no match.

Trust Graph, OrbitMatch, reputação, explicação do match e a API de agentes são
CONSULTAS sobre essa camada. Não são módulos separados.

## 4. O loop

NECESSIDADE → ORBITMATCH → CONEXÃO → CONVERSA → EXPERIÊNCIA → RESULTADO →
VALIDAÇÃO/EVIDÊNCIA → CONFIANÇA → INDICAÇÃO → MAIS PARTICIPANTES → REDE MAIS DENSA →
MATCHING MELHOR → MAIS VALOR → MAIS ASSINANTES → RECEITA → MELHOR INFRAESTRUTURA → LOOP

A recompensa não é o centro. A rede é o centro.
*Reward is not the product. Reward accelerates the network.*

## 5. Princípios inegociáveis

**NÃO-REGRESSÃO (regra nº 1).**
O projeto já perdeu o backend inteiro uma vez: commits rotulados como "fix de build"
apagaram 25 tabelas e transformaram a API em mock. Nunca mais.
- Nenhum "fix" de build/deploy pode remover tabela, rota, módulo ou regra de negócio.
- Mudança de infraestrutura e mudança de funcionalidade nunca no mesmo commit.
- Antes de apagar qualquer coisa: verificar quem usa. O histórico do git é a última linha de defesa, não a primeira.
- Documento que diz "100% funcional" sem teste executado é regressão de confiança. Só se afirma o que foi rodado.

**SEGURO POR ARQUITETURA.**
Segurança não é camada adicionada no fim; é como o sistema é desenhado.
- Nenhum segredo, senha, e-mail de pessoa real, CPF ou chave PIX em código ou repositório.
- Autenticação real sempre (nunca mock em caminho que chega a produção). RLS ativo no banco.
- Toda rota que muda saldo, papel ou fato exige autorização verificada no servidor.
- Webhook financeiro: autenticado, idempotente, auditável.
- Trilha de auditoria em todo evento relevante.

**LEGAL PARA OPERAR.**
- Proibido: promessa de rendimento, percentual mensal fixo sobre saldo, "renda", "retorno",
  cashback como atrativo, pagamento por cadastro, linguagem de investimento ou criptoativo.
- Indicação cria o caminho; **resultado elegível** cria a recompensa.
- **Validar NUNCA gera recompensa** — recompensar validação fabrica validação falsa e destrói o grafo.
- Separação estrutural: Orbit Credits (uso, não sacáveis) ≠ Orbit Rewards (conquistados, elegíveis) ≠ BRL.
- Arquitetura **não custodial**: Orbitrum tem o Reward Ledger de direitos; quem movimenta dinheiro é o PSP.
- LGPD desde a arquitetura: finalidade, minimização, consentimento (inclusive de terceiro citado no fato),
  visibilidade por fato, retenção, canal do titular. Trust Graph mostra explicação, nunca o grafo cru.
- CNAE, tributação e enquadramento do saque = hipótese a validar com advogado e contador antes de operar.

**PRO / ELITE / HIGH-TECH POR DESIGN.**
- Qualidade de produto e de código acima de velocidade de entrega.
- Toda funcionalidade responde: "isso melhora a capacidade da rede de conectar as pessoas certas
  no contexto certo?" Se só adiciona complexidade, é questionada.
- Escalável desde o desenho: arquitetura orientada a eventos, dado com procedência e validade.
- Identidade visual: Neural Core, órbitas, nós, fundo espacial escuro, cyan/neon — sensação de sistema vivo.

## 6. Estratégia de densidade

A rede só é útil para um agente quando é densa. Não se ganha no Brasil inteiro.
Uma região + uma categoria primeiro, até responder melhor que uma busca aberta.
Região e categoria iniciais: **ainda não definidas pelo Pedro** — não presumir.

## 7. Estado do sistema (atualizar conforme evolui)

Base de trabalho: repositório `orbitrumexpopro` (backend original completo).
`OrbitrumProConnect` é a versão com backend mock — não usar como base.

**Arquitetura definida pelo Pedro: só Supabase. Railway NÃO será usado** (só serviu para
construir/rodar em dev). O backend Express é ferramenta de desenvolvimento; em produção a
lógica vive no **Postgres via RPC** (`SECURITY DEFINER`) + o frontend chama o Supabase direto.
Primeira RPC já feita: `get_my_profile()`. Caminho de produção: converter `contextoRelacional`,
gatilhos e busca em RPCs; o Vercel serve só o frontend estático apontando para o Supabase.

**Modelo de dados (confirmado com o Pedro):** os 20 profissionais são **amostra/seed** para
girar o motor. Pessoas reais que entram viram users+professionals e **somam** seus próprios
fatos. Os perfis de amostra ficam marcados como demo e podem ser retirados depois.

**Supabase do projeto:** `wuaupjjbfvctelvyyfda` (região sa-east-1), único da conta.
As 27 tabelas estão aplicadas. Admin: `phpg69@gmail.com` (Pedro), `admin_level 3`.
RLS com políticas: professionals público, users por dono/admin, fatos nunca lidos crus por anon.

**Camada de fatos relacionais (construída, testada, PERSISTINDO no Postgres):**
`relational-facts.ts` (motor: confiança, validade, decay, substituição, idempotência, §35),
`relational-triggers.ts` (gatilhos de domínio + composição da busca),
`relational-store.ts` (escolhe Postgres se há DATABASE_URL, memória se não),
`relational-store-db.ts` (`DrizzleFactStore`). Loop provado pela API E **fato sobrevive a
restart no banco**. Costura professional↔user **RESOLVIDA** (cada profissional é um user;
busca mostra o profissional certo com nome real). Falta: API p/ agentes.

**No GitHub:** branch `feat/camada-fatos-relacionais` (repo `orbitrumexpopro`), push feito,
só a tese (330 linhas, sem segredo, sem arquivo de ambiente). Pendente: merge para main.

**Olhar 360 e caminho crítico** no doc "Orbitrum — Olhar 360" e no diário 29/09. Ordem:
A blindar → B persistir (núcleo pronto) → C limpar (8,7%/renda) → D vestir (design alvo) →
E densificar (uma região) → F agentes.

**Segurança pendente:** PAT e senha do Pedro foram ao chat nesta sessão → revogar/trocar.

Ver [[orbitrum-modo-de-trabalho]] e os diários em `diarios/`. Diário mais recente tem a seção
"MINHA VISÃO — de onde estamos até a rede do Documento Mestre".

## 8. Mapa do Documento Mestre definitivo (83 seções) — onde cada parte vive na memória
O Pedro consolidou o Documento Mestre Final (83 seções). Esta memória é o núcleo; os deltas
específicos estão em memórias dedicadas para não se perderem:
- **Economia/saque/crédito** (§14–26, 38): [[orbitrum-monetizacao]] — Reward Ledger, Orbit Credits
  (uso, não sacáveis) ≠ Rewards (elegíveis, sacáveis) ≠ BRL, saque por resultado via PSP não
  custodial, plano R$29,90 (assinatura ainda em definição — NÃO mexer sem o Pedro).
- **Camada de Continuidade "Continuar"** (§ novo): [[orbitrum-continuidade]] — conecta/executa/
  escolhe/aprende; deep-link em vez de reconstruir Uber/WhatsApp/Maps.
- **Visual/UI** (§43–47, 75): [[orbitrum-design-alvo]]. **Mercado/agentes** (§): [[orbitrum-analise-mercado]].
- **Regra de preservar o existente** (não-regressão aplicada ao orbit): [[orbitrum-preservar-existente]].
- **Passos concretos e roadmap**: [[orbitrum-checklist]].

**Experience Layer — estados canônicos (§10), para alinhar a trilha da conversa:**
`CONNECTED → TALKING → QUOTE_REQUESTED → NEGOTIATING → ACCEPTED → COMPLETED` (+ `CANCELLED`).
Hoje a ConversaModal usa uma trilha simplificada (conversando→combinado→a_caminho→concluído→
validada) — alinhar aos estados canônicos quando for a hora.

**Orbit Rewards — estados (§18):** `PENDING → VALIDATING → APPROVED → AVAILABLE →
WITHDRAWAL_REQUESTED → PAID`. **Arquitetura event-driven (§51)** e **antifraude/compliance
(§31–33)** ficam para a fase de economia. **Roadmap (§62):** 1 Network · 2 Referral · 3 Opportunity
· 4 Experience · 5 Trust · 6 OrbitMatch · 7 Economy · 8 Scale.

**Regra de ouro (§81):** não é "dar pontos", nem só "achar profissionais", nem "ganhar indicando"
— é construir uma rede viva de relações, confiança, experiência e oportunidades.
