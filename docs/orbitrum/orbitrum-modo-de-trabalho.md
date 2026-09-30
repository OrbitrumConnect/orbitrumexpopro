---
name: orbitrum-modo-de-trabalho
description: "Como o Pedro quer que eu trabalhe no Orbitrum — diários todo dia com timeline, escopo fechado, sem inferir o que ele não disse"
metadata:
  node_type: memory
  type: feedback
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-29T11:20:56.385Z
---

# MODO DE TRABALHO — ORBITRUM

## Diário diário (obrigatório)

Todo dia de trabalho gera um diário em `diarios/AAAA-MM-DD.md`.

**Why:** o projeto já perdeu contexto e código antes por falta de registro do que foi feito e por quê.
O diário é a memória viva do desenvolvimento e o que garante a não-regressão ao longo do tempo.

**How to apply:**
- Um arquivo por dia, nomeado pela data.
- Sempre abre com **TIMELINE**, puxando os diários anteriores em ordem — o dia de hoje tem que
  ser legível junto com o que veio antes, não isolado.
- Conteúdo do dia: o que aconteceu, desenvolvimento técnico, decisões de arquitetura,
  **filosofia e visão** (não só código), o que foi descartado e por quê, o que ficou aberto.
- Prioriza sempre: pro/elite, high-tech por design, seguro por arquitetura, legal para operar.
- Registrar também o que NÃO foi feito e o motivo.

## Escopo

**Why:** ele foi explícito mais de uma vez — eu estava trazendo outros projetos para a conversa.

**How to apply:**
- O projeto é **só Orbitrum Connect**. Nenhum outro repositório da conta (nem TradeVision,
  nem os de saúde/bio/med) tem relação com ele. Não citar, não usar como referência, não inferir
  direção de negócio a partir deles.
- Não presumir nada que ele não disse. Se eu inferi algo, dizer que é inferência minha — ou não dizer.

## Formato de documentos

**Why:** o Pedro disse que não precisa publicar artifact/URL para os documentos e diários.

**How to apply:**
- Diários e qualquer documento de síntese: salvar como **`.md` local** (na pasta de memória /
  diários) e/ou escrever no **chat**. Não é preciso criar Claude Doc com URL para compartilhar.
- Só publicar URL se ele pedir explicitamente.

## Postura

**Why:** ele quer avanço, não consulta a cada passo; e não quer auditoria pela auditoria.

**How to apply:**
- Quando mandar seguir, seguir — não devolver menu de opções para escolher.
- O objetivo não é validar se o sistema funciona ou se a tese está certa. É **evoluir o sistema
  que ele já construiu** até a visão nova, a partir de onde ele parou.
- Diagnóstico só na medida em que aponta o que falta construir.
- Se for subir alguma coisa, usar **localhost:3000**.
- Ele escreve rápido e com abreviações; interpretar pela intenção, não pela letra.

Ver [[orbitrum-visao]].
