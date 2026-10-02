// OrbitAI — interface abstraída (§85-§88 do Documento Mestre)
// Orbitrum NÃO É uma IA. É a camada de contexto que IAs consultam.
// Esta interface abstrai o fornecedor (Claude, GPT, Gemini, local)
// para que o motor relacional nunca dependa de vendor lock-in.

export interface OrbitAIProvider {
  id: string;
  interpretNeed(input: string, context?: { cidade?: string; historico?: string[] }): Promise<InterpretedNeed>;
  explainMatches(matches: MatchCandidate[], need: InterpretedNeed): Promise<MatchExplanation[]>;
}

export interface InterpretedNeed {
  categoria: string;
  intencao: string;
  urgencia: 'baixa' | 'media' | 'alta';
  detalhes: Record<string, string>;
  confianca: number;
}

export interface MatchCandidate {
  profId: number;
  nome: string;
  titulo: string;
  score: number;
  motivos: string[];
  experiencias: number;
  validacoes: number;
}

export interface MatchExplanation {
  profId: number;
  explicacao: string;
  destaque: string;
}

// Provider padrão: determinístico, sem IA externa.
// Usa keyword matching + heurísticas. Funciona offline e sem API key.
class DeterministicProvider implements OrbitAIProvider {
  id = 'deterministic';

  async interpretNeed(input: string, context?: { cidade?: string }): Promise<InterpretedNeed> {
    const lower = input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    const categorias: Record<string, string[]> = {
      'eletricista': ['eletric', 'tomada', 'fio', 'curto', 'disjuntor', 'luz', 'instalacao eletrica'],
      'encanador': ['encanad', 'vazamento', 'cano', 'torneira', 'descarga', 'esgoto', 'hidraulic'],
      'pintor': ['pint', 'parede', 'textura', 'massa corrida', 'tinta'],
      'marceneiro': ['marcen', 'movel', 'armario', 'madeira', 'porta', 'gaveta'],
      'diarista': ['diari', 'faxina', 'limpeza', 'passar roupa'],
      'pedreiro': ['pedreir', 'obra', 'construc', 'reboco', 'alvenaria', 'reforma'],
      'jardineiro': ['jardin', 'poda', 'grama', 'planta', 'jardim'],
      'chaveiro': ['chaveir', 'chave', 'fechadura', 'tranca', 'cadeado'],
      'mecanico': ['mecanic', 'carro', 'motor', 'freio', 'oleo', 'pneu'],
      'dentista': ['dentist', 'dente', 'canal', 'obturac', 'limpeza dental'],
      'advogado': ['advogad', 'juridic', 'processo', 'contrato', 'direito'],
      'enfermeiro': ['enfermeir', 'curativo', 'medicacao', 'cuidador', 'home care'],
    };

    let cat = 'geral';
    let melhorMatch = 0;
    for (const [categoria, termos] of Object.entries(categorias)) {
      const matches = termos.filter(t => lower.includes(t)).length;
      if (matches > melhorMatch) {
        melhorMatch = matches;
        cat = categoria;
      }
    }

    const urgenciaTermos = ['urgente', 'emergencia', 'agora', 'hoje', 'rapido', 'socorro'];
    const urgencia = urgenciaTermos.some(t => lower.includes(t)) ? 'alta' as const
      : lower.includes('quando puder') || lower.includes('sem pressa') ? 'baixa' as const
      : 'media' as const;

    return {
      categoria: cat,
      intencao: input.slice(0, 200),
      urgencia,
      detalhes: context?.cidade ? { cidade: context.cidade } : {},
      confianca: melhorMatch > 0 ? Math.min(0.95, 0.5 + melhorMatch * 0.15) : 0.3,
    };
  }

  async explainMatches(matches: MatchCandidate[], need: InterpretedNeed): Promise<MatchExplanation[]> {
    return matches.map(m => {
      const parts: string[] = [];
      if (m.experiencias > 0) parts.push(`${m.experiencias} experiência${m.experiencias > 1 ? 's' : ''} registrada${m.experiencias > 1 ? 's' : ''}`);
      if (m.validacoes > 0) parts.push(`${m.validacoes} validação${m.validacoes > 1 ? 'ões' : ''}`);
      if (m.motivos.length > 0) parts.push(m.motivos[0]);

      return {
        profId: m.profId,
        explicacao: parts.length > 0
          ? `${m.nome} apareceu porque: ${parts.join(', ')}.`
          : `${m.nome} está disponível na categoria "${need.categoria}".`,
        destaque: m.motivos[0] || m.titulo,
      };
    });
  }
}

// Registry: registra providers e usa o ativo.
let activeProvider: OrbitAIProvider = new DeterministicProvider();
const providers = new Map<string, OrbitAIProvider>();
providers.set('deterministic', activeProvider);

export function registerProvider(provider: OrbitAIProvider) {
  providers.set(provider.id, provider);
}

export function setActiveProvider(id: string) {
  const p = providers.get(id);
  if (!p) throw new Error(`Provider "${id}" não registrado`);
  activeProvider = p;
}

export function getProvider(): OrbitAIProvider {
  return activeProvider;
}

export async function interpretNeed(input: string, context?: { cidade?: string; historico?: string[] }): Promise<InterpretedNeed> {
  return activeProvider.interpretNeed(input, context);
}

export async function explainMatches(matches: MatchCandidate[], need: InterpretedNeed): Promise<MatchExplanation[]> {
  return activeProvider.explainMatches(matches, need);
}
