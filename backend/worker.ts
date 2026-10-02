import { factStore } from './relational-store';
import { isVigente } from './relational-facts';
import type { RelationalFact } from './shared/schema';

// Worker determinístico — mantém o contexto relacional vivo.
// Sem IA. Lógica pura: if/else, loops, timestamps.
// Roda como cron (node-cron no Express, Vercel Cron em produção).

export interface WorkerResult {
  job: string;
  processados: number;
  detalhes?: string;
}

// JOB 1: Decay — marca fatos expirados como superseded por si mesmos.
// Fatos com validUntil no passado continuam no histórico (pesoTemporal dá 0.15),
// mas não aparecem mais como "vigentes" nas buscas.
export async function decayFatosExpirados(): Promise<WorkerResult> {
  const facts = await factStore.listFacts();
  const agora = new Date();
  let count = 0;

  for (const f of facts as RelationalFact[]) {
    if (f.supersededBy) continue;
    if (!f.validUntil) continue;
    if (isVigente(f, agora)) continue;

    // Expirou — marcar como superseded (por si mesmo = decay natural)
    await factStore.updateFact(f.id, { supersededBy: f.id });
    count++;
  }

  return { job: 'decay_fatos_expirados', processados: count };
}

// JOB 2: Disponibilidade — limpa disponibilidade de profissionais que
// declararam "disponível" há mais de 24h sem renovar.
// O fato `disponivel_em` já tem validUntil (VALIDADE_PADRAO_DIAS = 1 dia).
// Este job é redundante com o decay, mas explícito para clareza operacional.
export async function limparDisponibilidadeExpirada(): Promise<WorkerResult> {
  const facts = await factStore.listFacts();
  const agora = new Date();
  let count = 0;

  for (const f of facts as RelationalFact[]) {
    if (f.predicate !== 'disponivel_em') continue;
    if (f.supersededBy) continue;
    if (isVigente(f, agora)) continue;

    await factStore.updateFact(f.id, { supersededBy: f.id });
    count++;
  }

  return { job: 'limpar_disponibilidade', processados: count };
}

// JOB 3: Estatísticas — conta fatos por tipo, vigentes vs expirados.
// Útil para dashboards e monitoramento. Não altera nada.
export async function estatisticasRede(): Promise<WorkerResult & { stats: Record<string, any> }> {
  const facts = await factStore.listFacts();
  const agora = new Date();
  const connections = await factStore.listConnections();

  const porPredicado: Record<string, { total: number; vigentes: number }> = {};
  let totalVigentes = 0;

  for (const f of facts as RelationalFact[]) {
    if (!porPredicado[f.predicate]) {
      porPredicado[f.predicate] = { total: 0, vigentes: 0 };
    }
    porPredicado[f.predicate].total++;
    if (isVigente(f, agora)) {
      porPredicado[f.predicate].vigentes++;
      totalVigentes++;
    }
  }

  const stats = {
    totalFatos: facts.length,
    fatosVigentes: totalVigentes,
    fatosExpirados: facts.length - totalVigentes,
    conexoes: connections.length,
    porPredicado,
    ultimaExecucao: agora.toISOString(),
  };

  return { job: 'estatisticas_rede', processados: facts.length, stats };
}

// JOB 4: Limpeza de sessões de serviço abandonadas.
// Service-flow sessions que ficaram em estados intermediários (combinado, a_caminho)
// por mais de 24h sem avançar = provavelmente abandonadas.
// Não deleta — só registra pra auditoria. O cleanup real virá no Fase B.

// RUNNER: executa todos os jobs e retorna relatório.
export async function runWorker(): Promise<WorkerResult[]> {
  const results: WorkerResult[] = [];

  results.push(await decayFatosExpirados());
  results.push(await limparDisponibilidadeExpirada());

  const stats = await estatisticasRede();
  results.push(stats);

  return results;
}
