// 🔗 CAMADA DE FATOS RELACIONAIS
// A rede aprende com as próprias conexões.
//
// Este módulo NÃO altera nada do que já existe. Ele acrescenta a camada que faltava:
// transforma o que já acontece no sistema (serviço concluído, indicação confirmada,
// documento validado) em FATOS com contexto, data, origem, evidência e validade —
// e usa esses fatos para explicar por que um profissional apareceu.
//
// Regra do modelo, não só do negócio: confirmar um fato NUNCA gera recompensa.
// Recompensar validação fabrica validação falsa e apodrece o único ativo real da rede.

import type { RelationalFact, InsertRelationalFact, Connection } from './shared/schema';

// ---------------------------------------------------------------------------
// Níveis de confiança — a ordem importa e é usada para comparar
// ---------------------------------------------------------------------------

export const CONFIDENCE_ORDER = ['declarado', 'indicado', 'validado', 'verificado'] as const;
export type Confidence = typeof CONFIDENCE_ORDER[number];

export function confidenceRank(c: string): number {
  const i = CONFIDENCE_ORDER.indexOf(c as Confidence);
  return i < 0 ? 0 : i + 1;
}

// Predicados que a rede entende hoje
export const PREDICATES = {
  TRABALHOU_COM: 'trabalhou_com',
  INDICOU: 'indicou',
  ATENDE_REGIAO: 'atende_regiao',
  DISPONIVEL_EM: 'disponivel_em',
  INTEGRA_EQUIPE: 'integra_equipe',
  TEM_QUALIFICACAO: 'tem_qualificacao',
} as const;

// Validade padrão por predicado. Um fato sem prazo não serve para decidir hoje.
const VALIDADE_PADRAO_DIAS: Record<string, number | null> = {
  [PREDICATES.TRABALHOU_COM]: 540,   // ~18 meses: a relação existiu, mas envelhece
  [PREDICATES.INDICOU]: 365,
  [PREDICATES.ATENDE_REGIAO]: 180,
  [PREDICATES.DISPONIVEL_EM]: 7,     // disponibilidade vence rápido
  [PREDICATES.INTEGRA_EQUIPE]: 365,
  [PREDICATES.TEM_QUALIFICACAO]: null, // vence pelo documento, não pelo tempo
};

// ---------------------------------------------------------------------------
// Store — mesma lógica do resto do projeto: funciona com banco ou em memória
// ---------------------------------------------------------------------------

export interface FactStore {
  insertFact(fact: InsertRelationalFact): Promise<RelationalFact>;
  listFacts(): Promise<RelationalFact[]>;
  updateFact(id: number, patch: Partial<RelationalFact>): Promise<void>;
  listConnections(): Promise<Connection[]>;
  insertConnection(c: Omit<Connection, 'id'>): Promise<Connection>;
}

export class MemFactStore implements FactStore {
  private facts: RelationalFact[] = [];
  private connections: Connection[] = [];
  private seq = 1;
  private connSeq = 1;

  async insertFact(fact: InsertRelationalFact): Promise<RelationalFact> {
    // Espelha o Postgres: coluna não informada é null, nunca undefined.
    // Sem isso o store em memória e o banco se comportam diferente nas comparações.
    const row = {
      id: this.seq++,
      objectUserId: null,
      objectValue: null,
      contextCategory: null,
      contextDetail: null,
      contextRegion: null,
      validUntil: null,
      originRef: null,
      agentId: null,
      supersededBy: null,
      createdAt: new Date(),
      ...fact,
    } as RelationalFact;
    this.facts.push(row);
    return row;
  }

  async listFacts(): Promise<RelationalFact[]> {
    return this.facts;
  }

  async updateFact(id: number, patch: Partial<RelationalFact>): Promise<void> {
    const f = this.facts.find(x => x.id === id);
    if (f) Object.assign(f, patch);
  }

  async listConnections(): Promise<Connection[]> {
    return this.connections;
  }

  async insertConnection(c: Omit<Connection, 'id'>): Promise<Connection> {
    const row = { id: this.connSeq++, ...c } as Connection;
    this.connections.push(row);
    return row;
  }
}

// ---------------------------------------------------------------------------
// Temporalidade
// ---------------------------------------------------------------------------

export function isVigente(fact: RelationalFact, now: Date = new Date()): boolean {
  if (fact.supersededBy) return false;
  if (!fact.validUntil) return true;
  return new Date(fact.validUntil).getTime() >= now.getTime();
}

/** Peso 0..1: um fato vencido não some do histórico, mas perde força no match. */
export function pesoTemporal(fact: RelationalFact, now: Date = new Date()): number {
  const meses = (now.getTime() - new Date(fact.occurredAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (meses <= 0) return 1;
  if (!isVigente(fact, now)) return 0.15;
  return Math.max(0.2, 1 - meses / 36); // decai ao longo de ~3 anos
}

function validadeDe(predicate: string, occurredAt: Date): Date | null {
  const dias = VALIDADE_PADRAO_DIAS[predicate];
  if (dias == null) return null;
  return new Date(occurredAt.getTime() + dias * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Registro e confirmação
// ---------------------------------------------------------------------------

export async function registrarFato(
  store: FactStore,
  input: Omit<InsertRelationalFact, 'validUntil'> & { validUntil?: Date | null },
): Promise<RelationalFact> {
  const occurredAt = new Date(input.occurredAt);
  return store.insertFact({
    ...input,
    occurredAt,
    validUntil: input.validUntil !== undefined ? input.validUntil : validadeDe(input.predicate, occurredAt),
  } as InsertRelationalFact);
}

/**
 * Confirmação de uma das partes. Com as DUAS partes, o fato sobe para "validado".
 * Não devolve, não credita e não registra nada de recompensa — de propósito.
 */
export async function confirmarFato(
  store: FactStore,
  factId: number,
  confirmacoes: { subjectConfirmed: boolean; objectConfirmed: boolean },
): Promise<Confidence> {
  const facts = await store.listFacts();
  const fact = facts.find(f => f.id === factId);
  if (!fact) throw new Error(`Fato ${factId} não encontrado`);

  const ambos = confirmacoes.subjectConfirmed && confirmacoes.objectConfirmed;
  const novo: Confidence = ambos ? 'validado' : 'declarado';

  if (confidenceRank(novo) > confidenceRank(fact.confidence)) {
    await store.updateFact(factId, { confidence: novo });
    return novo;
  }
  return fact.confidence as Confidence;
}

/** Fato novo substitui o anterior. O histórico nunca é apagado. */
export async function substituirFato(
  store: FactStore,
  antigoId: number,
  novo: RelationalFact,
): Promise<void> {
  await store.updateFact(antigoId, { supersededBy: novo.id });
}

// ---------------------------------------------------------------------------
// Idempotência — a mesma transição pode ser processada de novo sem duplicar
// ---------------------------------------------------------------------------

/**
 * Chave natural: originRef ("service_request:sr-001") + predicado.
 * Webhook reenviado, retry de rota ou clique duplo não criam um segundo fato.
 */
export async function acharPorOrigem(
  store: FactStore,
  originRef: string,
  predicate: string,
): Promise<RelationalFact | undefined> {
  const facts = await store.listFacts();
  return facts.find(f => f.originRef === originRef && f.predicate === predicate);
}

export async function registrarFatoIdempotente(
  store: FactStore,
  input: Omit<InsertRelationalFact, 'validUntil'> & { validUntil?: Date | null },
): Promise<{ fato: RelationalFact; criado: boolean }> {
  if (input.originRef) {
    const existente = await acharPorOrigem(store, input.originRef, input.predicate);
    if (existente) return { fato: existente, criado: false };
  }
  return { fato: await registrarFato(store, input), criado: true };
}

/**
 * Registra um fato que TORNA OBSOLETO o anterior do mesmo sujeito/predicado/objeto.
 * Usado por disponibilidade e por qualquer estado que muda ao longo do tempo:
 * o anterior não é editado nem apagado — ganha supersededBy e sai de vigência.
 */
export async function registrarSubstituindo(
  store: FactStore,
  input: Omit<InsertRelationalFact, 'validUntil'> & { validUntil?: Date | null },
): Promise<RelationalFact> {
  const facts = await store.listFacts();
  const anteriores = facts.filter(
    f =>
      f.subjectId === input.subjectId &&
      f.predicate === input.predicate &&
      f.objectUserId === (input.objectUserId ?? null) &&
      f.objectValue === (input.objectValue ?? null) &&
      !f.supersededBy,
  );

  const novo = await registrarFato(store, input);
  for (const antigo of anteriores) {
    if (antigo.id !== novo.id) await substituirFato(store, antigo.id, novo);
  }
  return novo;
}

// ---------------------------------------------------------------------------
// Derivação: o que JÁ existe no sistema vira fato
// ---------------------------------------------------------------------------

/** service_request concluído → trabalhou_com (declarado até as duas partes confirmarem) */
export async function fatoDeServicoConcluido(
  store: FactStore,
  sr: {
    id: string; userId: number; professionalUserId: number;
    description: string; location?: string | null;
    category?: string | null; completedAt: Date;
  },
): Promise<RelationalFact> {
  return registrarFato(store, {
    subjectId: sr.professionalUserId,
    predicate: PREDICATES.TRABALHOU_COM,
    objectUserId: sr.userId,
    contextCategory: sr.category ?? null,
    contextDetail: sr.description,
    contextRegion: sr.location ?? null,
    occurredAt: sr.completedAt,
    origin: 'experiencia_app',
    originRef: `service_request:${sr.id}`,
    confidence: 'declarado',
    visibility: 'rede',
  } as any);
}

/** referral confirmado → indicou. Cria o caminho; NÃO cria recompensa. */
export async function fatoDeIndicacaoConfirmada(
  store: FactStore,
  ref: { id: number; referrerId: number; referredId: number; confirmedAt: Date },
): Promise<RelationalFact> {
  return registrarFato(store, {
    subjectId: ref.referrerId,
    predicate: PREDICATES.INDICOU,
    objectUserId: ref.referredId,
    occurredAt: ref.confirmedAt,
    origin: 'declaracao',
    originRef: `referral:${ref.id}`,
    confidence: 'indicado',
    visibility: 'rede',
  } as any);
}

/** professional_validation aprovada → tem_qualificacao (verificado: houve documento) */
export async function fatoDeValidacao(
  store: FactStore,
  v: { id: number; professionalUserId: number; documentType: string; validatedAt: Date; expiresAt?: Date | null },
): Promise<RelationalFact> {
  return registrarFato(store, {
    subjectId: v.professionalUserId,
    predicate: PREDICATES.TEM_QUALIFICACAO,
    objectValue: v.documentType,
    occurredAt: v.validatedAt,
    validUntil: v.expiresAt ?? null,
    origin: 'documento',
    originRef: `professional_validation:${v.id}`,
    confidence: 'verificado',
    visibility: 'rede',
  } as any);
}

// ---------------------------------------------------------------------------
// Consulta: por que esta pessoa apareceu?
// ---------------------------------------------------------------------------

export interface ContextoRelacional {
  /** 0..100 — sinal relacional, somado ao score de atributos do ai-matching */
  score: number;
  /** frases prontas, já filtradas por privacidade (usadas no perfil) */
  motivos: string[];
  /** rótulos curtos para os CHIPS do card (design alvo) */
  chips: string[];
  /** o fato mais recente que sustenta a recomendação */
  fatoMaisRecente: Date | null;
  /** maior nível de confiança encontrado */
  confiancaMaxima: Confidence | null;
}

/**
 * Monta o contexto relacional entre quem procura e um profissional.
 *
 * Privacidade (§35): devolve EXPLICAÇÃO, nunca o grafo. Só nomeia alguém que é
 * conexão direta de quem procura; fora disso, fala em quantidade.
 */
export async function contextoRelacional(
  store: FactStore,
  requesterId: number,
  profissionalUserId: number,
  opts: { categoria?: string | null; nomePorId?: (id: number) => string | undefined; now?: Date } = {},
): Promise<ContextoRelacional> {
  const now = opts.now ?? new Date();
  const facts = await store.listFacts();
  const conns = await store.listConnections();

  const minhasConexoes = new Set<number>();
  for (const c of conns) {
    if (c.status !== 'active') continue;
    if (c.userAId === requesterId) minhasConexoes.add(c.userBId);
    if (c.userBId === requesterId) minhasConexoes.add(c.userAId);
  }

  // Fatos em que a pessoa aparece de qualquer lado — usado só para as razões de REDE,
  // onde ela pode ter sido tanto quem executou quanto quem contratou.
  const doProfissional = facts.filter(
    f => f.subjectId === profissionalUserId || f.objectUserId === profissionalUserId,
  );

  // Fatos em que a pessoa é o SUJEITO — quem executou, quem tem a qualificação,
  // quem declarou disponibilidade. Ter sido CLIENTE de um serviço de elétrica não
  // torna ninguém experiente em elétrica: competência só conta pelo lado de quem fez.
  const comoSujeito = facts.filter(f => f.subjectId === profissionalUserId);

  const motivos: string[] = [];
  const chips: string[] = []; // rótulos curtos para os cards (design alvo)
  let score = 0;
  let maisRecente: Date | null = null;
  let confMax: Confidence | null = null;
  const primeiroNome = (n?: string) => (n ? n.split(' ')[0] : undefined);

  const marcar = (f: RelationalFact) => {
    const d = new Date(f.occurredAt);
    if (!maisRecente || d > maisRecente) maisRecente = d;
    if (!confMax || confidenceRank(f.confidence) > confidenceRank(confMax)) {
      confMax = f.confidence as Confidence;
    }
  };

  // 1. Alguém da minha rede já trabalhou com essa pessoa
  const viaRede = doProfissional.filter(f => {
    if (f.predicate !== PREDICATES.TRABALHOU_COM) return false;
    const outro = f.subjectId === profissionalUserId ? f.objectUserId : f.subjectId;
    return outro != null && minhasConexoes.has(outro);
  });

  if (viaRede.length > 0) {
    const validados = viaRede.filter(f => confidenceRank(f.confidence) >= confidenceRank('validado'));
    const base = validados.length > 0 ? validados : viaRede;
    const melhor = base.sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
    marcar(melhor);

    const outroId = melhor.subjectId === profissionalUserId ? melhor.objectUserId : melhor.subjectId;
    const nome = outroId != null ? opts.nomePorId?.(outroId) : undefined;

    if (validados.length > 0) {
      motivos.push(
        nome
          ? `${nome}, uma conexão sua, trabalhou com essa pessoa e os dois confirmaram`
          : `${validados.length} conexão(ões) sua(s) trabalharam com essa pessoa, com confirmação dos dois lados`,
      );
      chips.push('Experiência validada');
      score += 45 * pesoTemporal(melhor, now);
    } else {
      motivos.push(
        nome
          ? `${nome}, uma conexão sua, informou ter trabalhado com essa pessoa`
          : `${viaRede.length} conexão(ões) sua(s) informaram ter trabalhado com essa pessoa`,
      );
      chips.push(primeiroNome(nome) ? `Trabalhou com ${primeiroNome(nome)}` : 'Trabalhou na sua rede');
      score += 20 * pesoTemporal(melhor, now);
    }
  }

  // 2. Indicada por alguém da minha rede
  const indicacoes = doProfissional.filter(
    f => f.predicate === PREDICATES.INDICOU && f.objectUserId === profissionalUserId && minhasConexoes.has(f.subjectId),
  );
  if (indicacoes.length > 0) {
    const melhor = indicacoes.sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
    marcar(melhor);
    const nome = opts.nomePorId?.(melhor.subjectId);
    motivos.push(nome ? `Indicada por ${nome}, uma conexão sua` : `Indicada por ${indicacoes.length} conexão(ões) sua(s)`);
    chips.push(primeiroNome(nome) ? `Indicado por ${primeiroNome(nome)}` : 'Indicado pela rede');
    score += 25 * pesoTemporal(melhor, now);
  }

  // 3. Experiência confirmada NA MESMA categoria (contexto, não ranking absoluto)
  if (opts.categoria) {
    const naCategoria = comoSujeito.filter(
      f =>
        f.predicate === PREDICATES.TRABALHOU_COM &&
        f.contextCategory === opts.categoria &&
        confidenceRank(f.confidence) >= confidenceRank('validado'),
    );
    if (naCategoria.length > 0) {
      const melhor = naCategoria.sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
      marcar(melhor);
      motivos.push(
        `${naCategoria.length} experiência(s) confirmada(s) em ${opts.categoria}`,
      );
      chips.push(`${naCategoria.length} em ${opts.categoria}`);
      score += Math.min(20, 8 * naCategoria.length) * pesoTemporal(melhor, now);
    }
  }

  // 4. Qualificação verificada e ainda válida
  const quali = comoSujeito.filter(
    f => f.predicate === PREDICATES.TEM_QUALIFICACAO && f.confidence === 'verificado' && isVigente(f, now),
  );
  if (quali.length > 0) {
    marcar(quali[0]);
    motivos.push(`Qualificação verificada: ${quali.map(q => q.objectValue).filter(Boolean).join(', ')}`);
    chips.push('Qualificação verificada');
    score += 10;
  }

  // 5. Disponibilidade recente — só conta se ainda estiver vigente
  const disp = comoSujeito.filter(f => f.predicate === PREDICATES.DISPONIVEL_EM && isVigente(f, now));
  if (disp.length > 0) {
    const d = disp.sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
    marcar(d);
    const dias = Math.floor((now.getTime() - new Date(d.occurredAt).getTime()) / (1000 * 60 * 60 * 24));
    motivos.push(dias <= 1 ? 'Disponibilidade atualizada hoje' : `Disponibilidade atualizada há ${dias} dia(s)`);
    chips.push(dias <= 1 ? 'Disponível hoje' : 'Disponível');
    score += 8;
  }

  return {
    score: Math.round(Math.min(100, score) * 100) / 100,
    motivos,
    chips,
    fatoMaisRecente: maisRecente,
    confiancaMaxima: confMax,
  };
}

// ---------------------------------------------------------------------------
// Perfil relacional — o que a tela de PERFIL/CONTEXTO mostra (substitui o modal de tokens)
// ---------------------------------------------------------------------------

export interface PerfilRelacional {
  contexto: ContextoRelacional; // motivos + confiança + sinal (por que apareceu)
  placar: {
    experiencias: number; // trabalhos concluídos como executor
    experienciasValidadas: number; // confirmados pelos dois lados
    indicacoes: number; // quantas vezes foi indicado
    validacoes: number; // qualificações/evidências verificadas
  };
  // experiências relevantes: mais que número, o que a pessoa fez (design alvo)
  experienciasRelevantes: Array<{ categoria: string | null; detalhe: string | null; confianca: string; quando: Date }>;
  qualificacoes: string[];
  // "Como você chegou até ele?" (§6/§18). Você → intermediário → profissional.
  // §35: só nomeia o intermediário quando ele é conexão direta de quem procura.
  caminho: Array<{ nome: string; descricao: string; avatar?: string | null }>;
  conexoesEmComum: number; // quantas conexões o solicitante e o profissional têm em comum (design)
}

export async function perfilRelacional(
  store: FactStore,
  profissionalUserId: number,
  requesterId: number,
  opts: { categoria?: string | null; nomePorId?: (id: number) => string | undefined; avatarPorId?: (id: number) => string | undefined; now?: Date } = {},
): Promise<PerfilRelacional> {
  const now = opts.now ?? new Date();
  const facts = await store.listFacts();

  // Só como SUJEITO conta para competência (cliente não herda competência).
  const comoSujeito = facts.filter(f => f.subjectId === profissionalUserId && !f.supersededBy);

  const trabalhos = comoSujeito.filter(f => f.predicate === PREDICATES.TRABALHOU_COM);
  const validados = trabalhos.filter(f => confidenceRank(f.confidence) >= confidenceRank('validado'));
  const indicacoes = facts.filter(
    f => f.predicate === PREDICATES.INDICOU && f.objectUserId === profissionalUserId && !f.supersededBy,
  );
  const quali = comoSujeito.filter(
    f => f.predicate === PREDICATES.TEM_QUALIFICACAO && f.confidence === 'verificado' && isVigente(f, now),
  );

  const experienciasRelevantes = validados
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
    .slice(0, 6)
    .map(f => ({ categoria: f.contextCategory, detalhe: f.contextDetail, confianca: f.confidence, quando: new Date(f.occurredAt) }));

  // "Como você chegou até ele?" — acha um intermediário que é conexão de quem procura
  // E que se liga ao profissional (indicou ou trabalhou_com).
  const conns = await store.listConnections();
  const minhasConexoes = new Set<number>();
  for (const c of conns) {
    if (c.status !== 'active') continue;
    if (c.userAId === requesterId) minhasConexoes.add(c.userBId);
    if (c.userBId === requesterId) minhasConexoes.add(c.userAId);
  }
  const av = (id: number) => opts.avatarPorId?.(id) ?? null; // foto no círculo (não só do profissional)
  const caminho: Array<{ nome: string; descricao: string; avatar?: string | null }> = [
    { nome: 'Você', descricao: 'Seu perfil', avatar: av(requesterId) },
  ];
  // Preferir indicação; depois experiência conjunta.
  const viaIndic = indicacoes.find(f => minhasConexoes.has(f.subjectId));
  const viaTrab = trabalhos.find(f => f.objectUserId != null && minhasConexoes.has(f.objectUserId));
  const interId = viaIndic?.subjectId ?? viaTrab?.objectUserId ?? null;
  const nomeProf = opts.nomePorId?.(profissionalUserId) || 'Profissional';
  if (interId != null) {
    const nomeInter = opts.nomePorId?.(interId) || 'Uma conexão sua';
    caminho.push({ nome: nomeInter, descricao: viaIndic ? `Indicou ${nomeProf.split(' ')[0]}` : `Trabalhou com ${nomeProf.split(' ')[0]}`, avatar: av(interId) });
  }
  caminho.push({ nome: nomeProf, descricao: validados.length ? 'Experiência validada' : 'Profissional', avatar: av(profissionalUserId) });

  // conexões em comum: interseção das conexões ativas do solicitante e do profissional
  const conexoesProf = new Set<number>();
  for (const c of conns) {
    if (c.status !== 'active') continue;
    if (c.userAId === profissionalUserId) conexoesProf.add(c.userBId);
    if (c.userBId === profissionalUserId) conexoesProf.add(c.userAId);
  }
  let conexoesEmComum = 0;
  for (const id of minhasConexoes) if (conexoesProf.has(id)) conexoesEmComum++;

  return {
    contexto: await contextoRelacional(store, requesterId, profissionalUserId, {
      categoria: opts.categoria,
      nomePorId: opts.nomePorId,
      now,
    }),
    placar: {
      experiencias: trabalhos.length,
      experienciasValidadas: validados.length,
      indicacoes: indicacoes.length,
      validacoes: quali.length,
    },
    experienciasRelevantes,
    qualificacoes: quali.map(q => q.objectValue).filter(Boolean) as string[],
    caminho,
    conexoesEmComum,
  };
}
