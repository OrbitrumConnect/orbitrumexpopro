// 🔌 GATILHOS DE DOMÍNIO → FATOS RELACIONAIS
//
// Decisão arquitetural (não afrouxar):
//   AS ROTAS PRODUZEM FATOS. O MOTOR DECIDE VALIDADE, CONFIANÇA E SINAL.
//   A BUSCA COMPÕE CONTEXTO E EXPLICAÇÃO.
//
// A rota só informa O QUE ACONTECEU e QUANDO. Nenhuma regra de validade, decay,
// confiança ou score mora aqui — se voltar a morar, a regra se espalha pelo
// routes.ts de novo, que foi como o projeto se perdeu da primeira vez.
//
// Toda transição é idempotente pela chave natural originRef + predicado:
// retry de rota, webhook reenviado ou clique duplo não duplicam fato.

import {
  FactStore, registrarFatoIdempotente, registrarSubstituindo, confirmarFato,
  contextoRelacional, ContextoRelacional, PREDICATES,
} from './relational-facts';

// ---------------------------------------------------------------------------
// Eventos de domínio
// ---------------------------------------------------------------------------

/** service_request → "concluido". Nasce declarado; sobe a validado com as duas confirmações. */
export async function aoConcluirServico(
  store: FactStore,
  ev: {
    serviceId: string; clienteUserId: number; profissionalUserId: number;
    descricao: string; categoria?: string | null; regiao?: string | null;
    concluidoEm?: Date;
  },
) {
  return registrarFatoIdempotente(store, {
    subjectId: ev.profissionalUserId,
    predicate: PREDICATES.TRABALHOU_COM,
    objectUserId: ev.clienteUserId,
    contextCategory: ev.categoria ?? null,
    contextDetail: ev.descricao,
    contextRegion: ev.regiao ?? null,
    occurredAt: ev.concluidoEm ?? new Date(),
    origin: 'experiencia_app',
    originRef: `service_request:${ev.serviceId}`,
    confidence: 'declarado',
    visibility: 'rede',
  } as any);
}

/** Confirmação de uma das partes. Não credita nada — de propósito. */
export async function aoConfirmarExperiencia(
  store: FactStore,
  ev: { factId: number; clienteConfirmou: boolean; profissionalConfirmou: boolean },
) {
  return confirmarFato(store, ev.factId, {
    subjectConfirmed: ev.profissionalConfirmou,
    objectConfirmed: ev.clienteConfirmou,
  });
}

/** referral → "confirmed". Cria o caminho, não a recompensa. */
export async function aoConfirmarIndicacao(
  store: FactStore,
  ev: { referralId: number; indicadorUserId: number; indicadoUserId: number; confirmadoEm?: Date },
) {
  return registrarFatoIdempotente(store, {
    subjectId: ev.indicadorUserId,
    predicate: PREDICATES.INDICOU,
    objectUserId: ev.indicadoUserId,
    occurredAt: ev.confirmadoEm ?? new Date(),
    origin: 'declaracao',
    originRef: `referral:${ev.referralId}`,
    confidence: 'indicado',
    visibility: 'rede',
  } as any);
}

/** professional_validation → "approved". Documento examinado = verificado. */
export async function aoAprovarValidacao(
  store: FactStore,
  ev: {
    validationId: number; profissionalUserId: number; tipoDocumento: string;
    aprovadoEm?: Date; venceEm?: Date | null;
  },
) {
  return registrarFatoIdempotente(store, {
    subjectId: ev.profissionalUserId,
    predicate: PREDICATES.TEM_QUALIFICACAO,
    objectValue: ev.tipoDocumento,
    occurredAt: ev.aprovadoEm ?? new Date(),
    validUntil: ev.venceEm ?? null,
    origin: 'documento',
    originRef: `professional_validation:${ev.validationId}`,
    confidence: 'verificado',
    visibility: 'rede',
  } as any);
}

/**
 * Disponibilidade mudou. NÃO atualiza o fato anterior: registra um novo que
 * substitui o antigo. O histórico de disponibilidade permanece consultável.
 */
export async function aoMudarDisponibilidade(
  store: FactStore,
  ev: { profissionalUserId: number; regiao: string; em?: Date },
) {
  return registrarSubstituindo(store, {
    subjectId: ev.profissionalUserId,
    predicate: PREDICATES.DISPONIVEL_EM,
    objectValue: ev.regiao,
    occurredAt: ev.em ?? new Date(),
    origin: 'declaracao',
    originRef: `disponibilidade:${ev.profissionalUserId}:${(ev.em ?? new Date()).toISOString()}`,
    confidence: 'declarado',
    visibility: 'rede',
  } as any);
}

// ---------------------------------------------------------------------------
// Composição na busca
// ---------------------------------------------------------------------------

export interface CandidatoComContexto<T> {
  profissional: T;
  /** score de atributos do ai-matching — NÃO alterado, NÃO somado */
  aiMatchScore: number;
  /** quanto a rede sabe sobre a relação entre ESTE solicitante e ESTE profissional */
  sinalRelacional: number;
  motivos: string[];
  confianca: string | null;
  fatoMaisRecente: Date | null;
}

/**
 * Compõe atributo + relação SEM colapsar num número só.
 *
 * Os dois sinais significam coisas diferentes e continuam separados no retorno:
 *   aiMatchScore     = quão adequado o profissional é, em abstrato
 *   sinalRelacional  = quanto a rede sabe sobre a relação com QUEM ESTÁ PROCURANDO
 *
 * O sinal relacional é por par (solicitante × profissional). Nunca é reputação
 * do profissional, nunca vira ranking absoluto e nunca deve ser exibido como nota.
 */
export async function comporBusca<T>(
  store: FactStore,
  quemProcura: number,
  candidatos: Array<{ profissional: T; profissionalUserId: number; aiMatchScore: number }>,
  opts: { categoria?: string | null; nomePorId?: (id: number) => string | undefined } = {},
): Promise<CandidatoComContexto<T>[]> {
  const saida: CandidatoComContexto<T>[] = [];

  for (const c of candidatos) {
    const ctx: ContextoRelacional = await contextoRelacional(
      store, quemProcura, c.profissionalUserId,
      { categoria: opts.categoria, nomePorId: opts.nomePorId },
    );
    saida.push({
      profissional: c.profissional,
      aiMatchScore: c.aiMatchScore,
      sinalRelacional: ctx.score,
      motivos: ctx.motivos,
      confianca: ctx.confiancaMaxima,
      fatoMaisRecente: ctx.fatoMaisRecente,
    });
  }

  // Ordenação: quem a rede conhece no contexto de quem procura vem primeiro;
  // empate relacional decide pelo atributo. Nenhum dos dois é sobrescrito.
  return saida.sort(
    (a, b) => b.sinalRelacional - a.sinalRelacional || b.aiMatchScore - a.aiMatchScore,
  );
}
