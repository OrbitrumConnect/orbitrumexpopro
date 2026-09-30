---
name: orbitrum-monetizacao
description: "Conclusão sobre preço, tokens vs crédito e modelo econômico do Orbitrum — o que a tese exige, o que o sistema atual viola, e a direção a testar"
metadata:
  node_type: memory
  type: project
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-30T13:01:21.528Z
---

# MONETIZAÇÃO — CONCLUSÃO (fundamentada na tese §5 + análise de mercado)

Debate levantado pelo Pedro (29/09): estudar os preços (hoje 4 planos R$7/14/21/30 com
cashback/saque) e decidir **tokens vs crédito**. Conclusão "na mão", cruzando
[[orbitrum-visao]] §5, [[orbitrum-analise-mercado]] (GetNinjas) e [[orbitrum-design-alvo]].

## O SAQUE É VIÁVEL — a tese distingue A ORIGEM da recompensa (correção do Pedro, 29/09)
Erro meu: eu disse "zero saque". A tese **não bane saque** — bane a ORIGEM errada. §5:
- **PROIBIDO (o que a tela atual faz):** cashback como atrativo, **% mensal sobre saldo**,
  "renda/retorno", promessa de rendimento, pagar por cadastro, pagar por validar. As telas de hoje
  (Cashback/Saque 8,7% sobre saldo, pool de cashback, jogos, token-pacote) são essa forma proibida
  = ferida do GetNinjas + risco CVM. **Isso é o Bloco C (limpar).**
- **PERMITIDO E PREVISTO:** "**indicação cria o caminho; resultado elegível cria a recompensa**".
  Ou seja: quando o **serviço acontece e é VALIDADO pelos dois lados** (o fluxo completo pós
  necessidade → indicação → conexão → experiência → validação), aquilo é **resultado elegível** e
  **PODE gerar Orbit Reward sacável**. O saque existe — a tese até manda "validar enquadramento do
  saque com advogado/contador antes de operar".
- **As duas travas que continuam:** (1) **validar em si NUNCA paga** (senão fabrica validação
  falsa) — quem paga é o RESULTADO real, não o clique de confirmar; (2) **não custodial**: Orbitrum
  guarda o Reward Ledger (direito); quem movimenta BRL é o **PSP**.
- **A régua:** a recompensa nasce de **serviço real concluído e validado pela rede** (uso real),
  não de saldo parado, compra de token ou cashback. Reward tied to eligible result = OK; reward
  como yield/atrativo/pagamento-por-validar = OUT.

## ESTRUTURA DE PLANOS DEFINIDA (hipótese de teste — Pedro, 29/09)
Escada `0 → 9,90 → 19,90 → 29,90` (sem R$4,90 — faixa sem função clara). Regra: **não cobrar
pela existência da relação; cobrar pelos recursos/produtividade em cima dela.**
- **Grátis — Usuário:** criar perfil, buscar, postar necessidade, receber matches, conversar,
  contratar, **confirmar experiência** e construir histórico relacional. (Confirmar é parte do
  nascimento do fato — o gratuito PRECISA poder gerar E validar relações; pagamento nunca fabrica confiança.)
- **R$ 9,90 — Indicador:** tudo do grátis + indicar pessoas, participar da expansão da rede,
  acompanhar conexões/indicações, ferramentas de indicação.
- **R$ 19,90 — Pro:** + recursos profissionais, gestão de oportunidades, agenda/histórico/
  ferramentas, produtividade.
- **R$ 29,90 — Empresa:** + equipes, gestão de profissionais/conexões, recursos empresariais.
**REGRA INEGOCIÁVEL (Pedro reforçou 30/09):** sem paywall em **conexão real, experiência ou
validação**. O usuário gratuito NUNCA pode ser impedido de gerar o conhecimento (fatos) que torna
a rede valiosa — senão o ativo não se forma. Paga-se por **participação ampliada + produtividade**
(indicar ativamente, ferramentas pro/empresa), não por existir/conectar/validar. Validar confirma
o fato e não remunera por si (já é regra). O loop: entra grátis → usa → conecta → experiência →
confirma → fato nasce → rede fica mais inteligente → pro/empresa extraem valor recorrente → pagam
pelos recursos avançados.
Frase p/ o doc: *"entrada grátis; Indicador R$9,90; Pro R$19,90; Empresa R$29,90 — hipóteses de
teste, não definitivas."* **NÃO mexer no código de planos ainda** (Pedro: em definição).

## Economia — custos × escala (análise pedida, honesta)
Estimativa do Pedro: infra (Supabase+Vercel+etc) **< US$1k/mês, ~R$2k/mês** no início — plausível
(Supabase Pro US$25, Vercel US$20; escala sub-linear). **Break-even só de infra:**
~**200** assinantes a 9,90, ou ~**100** a 19,90, ou ~**67** a 29,90 — ou um mix de ~100–150 pagantes.
Muito atingível. Margem tipo SaaS (~80–90%): acima do break-even, receita escala mais rápido que
o custo de infra → **potencial exponencial SE houver densidade e conversão**.
**Ressalvas honestas (custo não é só infra):** somar PSP (taxa por transação, repasse), **impostos**
(abrir empresa: MEI até R$81k/ano ou ME/Simples ~6%+, ~R$50–100/mês de contador), **CAC** (aquisição),
suporte e **reward budget** (se houver recompensa). O gargalo **não é custo — é adesão/densidade**
(ver [[orbitrum-analise-mercado]]): o custo baixo dá **runway longo** pra construir densidade, que
é onde a maioria das redes morre. Abrir empresa é necessário pro PSP/receber legalmente; CNAE
(7490-1/04 é possibilidade) e enquadramento = validar com contador/advogado (doc mestre §37).
**Conclusão:** custo baixo = vantagem real (break-even ~100–150 pagantes). O modelo paga os custos
em escala modesta e tem margem alta; o lucro exponencial depende de densidade+conversão, não de tecnologia.

## Preço — direção (alinhada com a análise do Pedro e com a tese)
A tese §4: "reward is not the product; reward accelerates the network" e o loop termina em
"MAIS ASSINANTES → RECEITA" — **monetização é camada POSTERIOR do loop, não a porta de entrada.**
- **Usuário comum: entrada grátis (ou baixíssima).** Google e ferramentas são grátis; a rede
  cresce porque é útil, não porque cobramos para deixar existir. A pergunta certa não é "quanto
  cobrar para entrar?", é "qual o menor custo de entrada que maximiza a formação da rede?".
- **Monetizar o PROFISSIONAL** que ganha produtividade (clientes, histórico, agenda, orçamento,
  indicações organizadas) — assinatura Pro. Ele paga quando percebe valor, não para entrar.
- **Testar preços empíricos**, não por preferência: R$0 / R$4,90 / R$9,90 / R$19,90. Começar baixo.
  (Pedro cogitou entrada R$5/7 e Pro R$10/15 — plausível; decidir testando, não no gosto.)
- **Business/Empresas**: tier depois (secundário no MVP, design-alvo §7).
- **Taxa por serviço (take-rate) automática: NÃO agora.** Muda a natureza jurídica → vira
  marketplace/intermediação. Primeiro provar que a densidade da rede cria valor. Custo operacional
  real (ex.: processamento PIX) é repasse transparente, ≠ comissão sobre o serviço.

## Tokens vs Crédito — o que a tese DIZ (§5)
Separação estrutural **obrigatória**: **Orbit Credits (USO, NÃO sacáveis) ≠ Orbit Rewards
(conquistados, elegíveis) ≠ BRL**. Logo:
- **Crédito = utilidade de uso** (pagar IA, contato, upgrade), **não sacável, não investimento,
  não cashback**. Pode existir, mas **fora do centro da Home** (design-alvo) e sem cara de moeda.
- **"Token" como moeda/pacote/cashback/jogo: OUT.** É o modelo antigo que a tese removeu.
- **Modelo "entrada convertida em crédito" (couvert de boate/consumação): não recomendado como
  porta de entrada** — é barreira de entrada (contradiz o grátis-pra-crescer) e reacende a cara de
  moeda. Crédito fica como **top-up opcional de uso**, nunca cobrança obrigatória para entrar.

## ORBIT CREDITS — usamos? SIM, mas só como UTILIDADE DE USO (doc mestre §22.1)
Pergunta do Pedro: vamos usar os créditos internos, eles vão ter usabilidade? Resposta ancorada
na tese (§5) e no Documento Mestre §22.1 — **sim, e têm função clara:**
- **O QUE SÃO:** crédito interno de **consumo** de recursos do próprio Orbitrum. **Não sacáveis**,
  não são dinheiro do usuário. ≠ Orbit Rewards (sacáveis, por resultado) ≠ BRL.
- **PARA QUE SERVEM (usabilidade legítima):** IA / OrbitMatch avançado (mais consultas), ferramentas
  premium (orçamento, calculadoras, gestão), recursos/benefícios, campanhas. É "gastar crédito pra
  USAR uma ferramenta do Orbitrum".
- **COMO OBTÉM:** franquia mensal inclusa no plano; opcionalmente top-up avulso (honesto: não
  sacável, sem bônus-hype, sem pool de cashback, sem "tokens via jogos" — isso é o modelo antigo, OUT).
- **TRAVA CRÍTICA (não recriar a ferida do GetNinjas):** crédito **NUNCA** paga pra ver contato /
  comprar lead / aparecer na frente. Acesso à rede e às pessoas é **grátis** (a rede é o ativo, a
  entrada é grátis). Crédito é pra consumir as FERRAMENTAS/IA do Orbitrum, não pra comprar conexões.
- **NÃO:** no centro da Home, cara de moeda/cripto/jogo, sacável, investimento, cashback.
- **Resumo:** crédito = combustível de uso das ferramentas; Reward = direito sacável por resultado;
  BRL = dinheiro (PSP). Três coisas distintas, nunca misturadas.

## REFINAMENTO JURÍDICO (checagem CVM/BC/Fazenda — Pedro, 29/09) — defensável, não "aprovado"
A arquitetura é **defensável pro Brasil**, mas **não "100% viável" antes de parecer formal**
(advogado + contador). Ela é limpa porque evita os elementos de maior risco. Refinamentos:
- **Tabela definitiva:** BRL (dinheiro, sacável) · **Orbit Credit** (consumo de ferramentas, NÃO
  sacável) · **Orbit Reward** (recompensa por resultado elegível, sacável *conforme enquadramento*) ·
  **Reward Ledger** (registro do direito, não é dinheiro) · **PSP** (movimenta BRL).
- **Linguagem (importa juridicamente):** NÃO usar "token sacável", "saldo", "rendimento", "yield",
  "pool", "cashback". Usar **"Orbit Reward"** / "recompensa vinculada a resultado elegível".
- **BRL fora do Orbitrum:** o BC diferencia marketplace que só aproxima de quem recebe/repassa
  (pode virar subcredenciamento). Terceirizar o BRL ao PSP é decisão arquitetural chave — Orbitrum
  **não custodia dinheiro**.
- **Fazenda:** programas de benefício por **critério objetivo** (sem sorte/aleatoriedade/competição)
  em regra não exigem autorização de promoção — reforça construir o Reward como **regra objetiva**,
  nunca jogo/sorteio.
- **Reward sacável = "sim, mas":** desenho certo é `resultado real → direito → pagamento`, NUNCA
  `depósito → saldo cresce → rendimento → saque`.
- **DEFINITIVAMENTE FORA:** % sobre saldo · cashback sobre dinheiro parado · recompensa por validar/
  clicar/cadastrar · token como investimento · promessa de rendimento · jogo pra fabricar recompensa ·
  comprar lead/conexão com Credit · Orbitrum custodiar BRL.
- **PRÓXIMO PASSO ECONÔMICO = NÃO é código.** É uma **spec jurídico-operacional de 1 página**:
  o que é Credit; o que é Reward; o que é "resultado elegível"; quando nasce o direito; quando
  cancela/estorna; como funciona o Ledger; como o PSP paga; quem emite nota e sobre qual receita;
  textos proibidos na UI; e **parecer de advogado+contador antes do 1º saque real**. Só depois, código.

## MERCADO PAGO PESSOAL vs CNPJ — viabilidade (Pedro, 30/09) — ver [[orbitrum-deploy]]
Separar **entrada** de **saída** de dinheiro:
- **RECEBER assinatura (inbound):** dá pra começar com **MP pessoal (PF)** num piloto pequeno — MP
  aceita PF receber PIX/cartão. Serve pra testar densidade. Ressalvas: vira rendimento tributável na
  PF (carnê-leão/IRPF), sem nota fiscal, limites/scrutínio de MP-PF. Assim que houver receita
  recorrente de verdade → **MEI** (~R$70/mês, abre em minutos, dá CNPJ + nota).
- **PAGAR recompensa/saque (outbound):** **NUNCA da conta pessoal** — mover dinheiro a terceiros como
  PF se parece com atividade de pagamento sem licença e fere "Orbitrum não custodia; o PSP move o BRL".
  Esse fluxo precisa do PSP + enquadramento jurídico, e está congelado até a spec de qualquer forma.
- **Régua:** piloto = MP pessoal só RECEBE assinatura, sem payout. Cresceu → MEI → conta MP CNPJ →
  reward/saque com parecer (advogado/contador). Não correr pro CNPJ antes de provar o loop.

## O fluxo do saque no Documento Mestre (§14–22, confirma a régua)
`INDICAÇÃO → CONEXÃO → RESULTADO ELEGÍVEL → CONFIRMAÇÃO/VALIDAÇÃO → EVENTO DE RECOMPENSA →
REWARD LEDGER → POSSÍVEL SAQUE`. Orbit Reward tem estados: `PENDING → VALIDATING → APPROVED →
AVAILABLE → WITHDRAWAL_REQUESTED → PAID`. **Reward Ledger** = memória contábil dos direitos (não
é conta bancária dentro do app). Saque mínimo é decisão de produto (ex.: R$50, ciclo mensal).
Movimentação de BRL é do **PSP** (não custodial). Enquadramento (CNAE 7490-1/04 é possibilidade,
tributação, contratos) = **validar com advogado/contador antes de operar** — hipótese, não fato.

## Resumo de uma linha
**Entrada grátis/baixa para crescer → assinatura do profissional monetiza depois → crédito só
como uso não-sacável, fora do centro.** O **saque existe**, mas de **Orbit Reward por RESULTADO
elegível** (serviço concluído e validado pela rede), via PSP não-custodial, com enquadramento
legal — **nunca** cashback/% sobre saldo/yield, e **nunca** por validar. Preço = testar, não gosto.
