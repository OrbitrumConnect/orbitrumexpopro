---
name: orbitrum-camada-execucao
description: "Camada de Execução/Operacional do Orbitrum — barra 0–100% como estado real da relação, trilha bilateral, localização autorizada e temporária, B2B transversal; Orbitrum registra, não executa"
metadata:
  node_type: memory
  type: project
  originSessionId: fed60a5d-0b67-496a-9c51-713a1af5c318
  modified: 2026-09-30T02:49:03.960Z
---

# CAMADA DE EXECUÇÃO / OPERACIONAL (elaboração forte — 29/09, endossada pelo Pedro)

Não é produto novo: é destravar a **Experience Layer (Documento Mestre §10)** que já existe.
Complementa [[orbitrum-continuidade]] e a trilha da conversa + mini-mapa que já construí.

## A ideia central
O Orbitrum deixa de registrar só "quem conhece quem" e passa a registrar **o que está
acontecendo agora no mundo real** — quando autorizado. Acrescenta uma etapa ao loop da tese:
`Necessidade → Conexão → Experiência → Validação → a rede aprende` **→ + Execução real**.

## Barra 0–100% = ESTADO OPERACIONAL (não gamificação)
`0% Necessidade · 10% Solicitação · 20% Encontrado · 30% Aceite · 40% Deslocamento · 50% Chegada ·
60% Serviço iniciado · 80% Concluído · 90% Cliente confirmou · 100% Validada.`
Cada transição gera um **evento/fato verificável**. A barra separa responsabilidades: o Orbitrum
diz objetivamente **o que aconteceu dentro da plataforma**, sem dizer que ELE executou o serviço.
(Minha trilha atual conversando→combinado→a_caminho→concluído→validado é a versão simples disso —
evoluir para os estados/percentual e a **trilha BILATERAL** cliente↔prestador, com timestamps.)

## Estrela morre aqui de vez
Em vez de "Carlos é 4,8 ⭐", o registro é "existe uma experiência real entre Carlos e João, em tal
circunstância, com tais eventos, ambos confirmaram". **Dado relacional > nota.** Se deu ruim: João
registra "❌ não concluído conforme combinado / ⚠️ problema relatado / 💬 conversa registrada" — vira
histórico, sem o Orbitrum assumir a execução.

## REGRA ARQUITETURAL CRÍTICA (desde já): localização AUTORIZADA e TEMPORÁRIA
NÃO é "Orbitrum sabe onde todo mundo está". É "**durante esta conexão**, o participante autorizou
compartilhar um estado operacional". Depois: autorizado → a caminho → chegou → serviço → concluído →
**compartilhamento encerrado**. Protege o usuário (LGPD, §35) E torna o dado mais confiável (não é
vigilância; é um acontecimento real dentro de uma relação autorizada). Meu MiniMapa já usa geolocation
pontual — manter esse princípio: estado explícito, temporário, encerra ao fim.

## Enquadramento jurídico (refinamento do Pedro — STJ)
NÃO afirmar "a plataforma nunca tem responsabilidade" — depende de como participa da operação (STJ
diferencia classificados/conector de quem integra/garante). O desenho defensável: **Orbitrum ≠
prestador**. O contrato do serviço é cliente↔prestador; o Orbitrum presta o **serviço tecnológico**
de conexão/comunicação/contexto/registro, não o de eletricista/transporte. Palavra-chave: **"registro",
não "garantia"**. Isso tem que valer junto no contrato, termos, UX, nomenclatura, fluxo de pagamento e
marketing — não adianta a arquitetura dizer "infraestrutura" e o marketing dizer "garantimos seu
profissional". Alinha com [[orbitrum-monetizacao]] (não custodial, PSP move BRL).

## Dimensão B2B transversal (grande)
Empresa pequena não precisa construir app/rastreamento/chat/painel/chamados. **Conecta a operação ao
Orbitrum** e ganha a camada de acompanhamento + relacionamento + evidência POR CIMA do que já tem (não
substitui ERP/financeiro). Vê a **órbita operacional** dos seus prestadores (🟢 a caminho 3,2km / 🟡
disponível / ⚪ fora). Motor é o mesmo; muda o workflow (atendimento/entrega/manutenção/projeto/emergência/
seguradora). Orbitrum = **camada comum de contexto e continuidade** entre os atores, não mais um app.

## Para os agentes
Agente pergunta "quem está disponível pros próximos 30 min?" → resposta não é "10 eletricistas", é "estas
conexões fazem sentido agora, e aqui está o contexto" (qualificação + experiências + indicações +
localização autorizada + disponibilidade + **estado operacional** + histórico). Movimento vira inteligência.

## O que NÃO fazer
Não virar "ERP Orbitrum" nem "app que rastreia prestadores". Manter simples: RELATIONAL FACTS +
CONNECTION + EXPERIENCE STATE + EVENTS + CHAT + LOCALIZAÇÃO OPCIONAL → CONTEXTO OPERACIONAL. A interface
só traduz em humano: "o que está acontecendo? em que etapa? quem? o que falta? onde? posso falar? quem confirmou?".

## Como isso encaixa no que JÁ existe (não recomeçar)
- Trilha da ConversaModal → evoluir p/ estados + % + bilateral.
- MiniMapa (a caminho, caminhozinho, geolocation) → já é a localização autorizada/temporária.
- Fatos relacionais + atividadeRecente → os eventos por transição já nascem aqui.
- /mapa (disponíveis) → ligar ao estado operacional (só quem está disponível/autorizado).
Registrar no [[orbitrum-checklist]] como evolução da Experience Layer (§10), não feature nova.
