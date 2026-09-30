---
name: orbitrum-agentes
description: "Arquitetura de agentes do Orbitrum — não é \"colocar IA no app\"; é ser a camada de contexto+registro que IAs/agentes externos consultam e alimentam; worker = motor operacional (não é a IA)"
metadata:
  node_type: memory
  type: project
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-30T06:43:47.845Z
---

# AGENTES + WORKER — a Fase F corrigida (Pedro, 30/09)

Correção importante de interpretação da Fase F. **Orbitrum NÃO constrói uma IA.** Constrói uma
**infraestrutura que as IAs usam.** São duas peças distintas:

## 1. Worker = motor operacional (automação determinística, NÃO é a IA)
`evento → coleta → valida → transforma → grava → atualiza fatos → dispara próxima ação`.
Faz: buscar dados de fontes autorizadas, detectar eventos, atualizar fatos relacionais, recalcular
validade/decay, registrar resultado, chamar RPCs, disparar notificações/webhooks, **manter o
contexto vivo** para os agentes. É previsível, barato e auditável. É o **sistema nervoso operacional**.

## 2. API de agentes = interface cognitiva (consultável por IAs EXTERNAS)
`buscar_contexto()` → um agente pergunta "tenho a necessidade X nesta região, qual contexto
relevante existe?" e o Orbitrum responde com **fatos + conexões + validade + evidências** (§35:
explicação, nunca o grafo cru), **sem entregar o controle do sistema**.
`registrar_resultado()` → o agente diz "usei essa indicação, o resultado foi Y" e o Orbitrum registra.

## A direção estratégica (o Pedro cravou): as IAs se conectam AO Orbitrum
NÃO o Orbitrum dependente de uma IA específica. Vários agentes simultâneos (OpenAI, Anthropic,
Google, agente próprio, de empresa, ou que ainda nem existem) consultam a mesma camada.
```
   Agente A            Agente B            Agente C
      \                   |                   /
       \            buscar_contexto          /
        \           registrar_resultado     /
         ────────────►  ORBITRUM  ◄─────────
                     (API / RPC / MCP)
                          │
                 Fatos / rede / evidência / validade / decay
                          ▲
                     Worker Function (coleta / processa / empurra / atualiza)
```

## Por que isso é MAIS fiel à tese
- Bate com [[orbitrum-visao]] §2: "por que um agente precisaria **consultar** o Orbitrum para
  decidir melhor?" — o app é uma das portas; a rede/fatos é o ativo; a rede pode ser **invisível e
  consultável**. Orbitrum não vira chatbot.
- A IA é **consumidora E produtora** de resultados em cima da camada factual — não o dono dela.
- Fecha com a régua: útil numa cidade primeiro (densidade), depois indispensável para agentes.

## Frase corrigida da Fase F (substitui "integrar IA")
> **API para agentes — Orbitrum como camada de contexto e registro consultável por IAs/agentes
> externos; agentes podem buscar contexto e registrar resultados. O worker mantém a camada factual
> atualizada.** Não estamos construindo uma IA; estamos construindo a infraestrutura que as IAs usam.

## O que já existe / o que falta (avaliar antes de codar — Fase F, depois de densidade)
- Já existe o **motor de fatos** (contextoRelacional/perfilRelacional/atividadeRecente) — é o que
  `buscar_contexto` vai expor. Os **gatilhos** (aoConcluirServico/aoConfirmar/…) são a base do
  `registrar_resultado`. Há um `worker`/jobs no backend a mapear (node-cron: janela de saque,
  expiração; behavior-tracker) — ver o que já cobre e o que falta virar RPC/MCP.
- Falta: expor `buscar_contexto`/`registrar_resultado` como **RPC Postgres (SECURITY DEFINER) / MCP**;
  auth/escopo por agente; rate-limit; auditoria. **Só depois da densidade** (uma região/categoria).

Ligado a [[orbitrum-visao]], [[orbitrum-camada-execucao]], [[orbitrum-checklist]] (Fase F).
