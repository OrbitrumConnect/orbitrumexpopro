import { Router, Request, Response } from 'express';
import { factStore } from '../relational-store';
import { registrarFatoIdempotente } from '../relational-facts';

const router = Router();

interface Membro {
  profId: number;
  nome: string;
  titulo: string;
  especialidade: string;
  status: 'convidado' | 'confirmado' | 'recusado' | 'indicou_outro';
  convidadoEm: string;
  respondidoEm?: string;
  indicouProfId?: number;
}

interface Equipe {
  id: string;
  titulo: string;
  descricao: string;
  responsavelId: number;
  regiao: string;
  dataInicio: string;
  dataFim: string;
  especialidades: string[];
  membros: Membro[];
  status: 'montando' | 'ativa' | 'concluida' | 'desfeita';
  criadaEm: string;
  concluidaEm?: string;
  originEquipeId?: string;
}

const equipeStore = new Map<string, Equipe>();

// POST /api/equipes — criar equipe
router.post('/', async (req: Request, res: Response) => {
  const { titulo, descricao, responsavelId, regiao, dataInicio, dataFim, especialidades } = req.body;
  if (!titulo || !responsavelId) {
    return res.status(400).json({ success: false, error: 'titulo e responsavelId obrigatórios' });
  }

  const id = `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const equipe: Equipe = {
    id,
    titulo: String(titulo).slice(0, 100),
    descricao: String(descricao || '').slice(0, 500),
    responsavelId: Number(responsavelId),
    regiao: String(regiao || '').slice(0, 100),
    dataInicio: dataInicio || '',
    dataFim: dataFim || '',
    especialidades: Array.isArray(especialidades) ? especialidades.map(e => String(e).slice(0, 50)) : [],
    membros: [],
    status: 'montando',
    criadaEm: new Date().toISOString(),
  };

  equipeStore.set(id, equipe);
  res.json({ success: true, equipe });
});

// GET /api/equipes/:userId — equipes do usuário (como responsável)
router.get('/minhas/:userId', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const equipes = [...equipeStore.values()]
    .filter(e => e.responsavelId === userId)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  res.json({ success: true, equipes });
});

// GET /api/equipes/convites/:profId — convites recebidos por profissional
router.get('/convites/:profId', (req: Request, res: Response) => {
  const profId = parseInt(req.params.profId);
  const convites: Array<{ equipe: Equipe; membro: Membro }> = [];
  for (const eq of equipeStore.values()) {
    const m = eq.membros.find(m => m.profId === profId && m.status === 'convidado');
    if (m) convites.push({ equipe: eq, membro: m });
  }
  res.json({ success: true, convites });
});

// POST /api/equipes/:id/convidar — adicionar profissional à equipe
router.post('/:id/convidar', async (req: Request, res: Response) => {
  const equipe = equipeStore.get(req.params.id);
  if (!equipe) return res.status(404).json({ success: false, error: 'Equipe não encontrada' });
  if (equipe.status === 'desfeita') return res.status(400).json({ success: false, error: 'Equipe desfeita' });

  const { profId, nome, titulo, especialidade } = req.body;
  if (!profId) return res.status(400).json({ success: false, error: 'profId obrigatório' });

  if (equipe.membros.some(m => m.profId === Number(profId))) {
    return res.status(400).json({ success: false, error: 'Profissional já está na equipe' });
  }

  const membro: Membro = {
    profId: Number(profId),
    nome: String(nome || '').slice(0, 100),
    titulo: String(titulo || '').slice(0, 100),
    especialidade: String(especialidade || '').slice(0, 100),
    status: 'convidado',
    convidadoEm: new Date().toISOString(),
  };

  equipe.membros.push(membro);
  res.json({ success: true, equipe, mensagem: `Convite enviado para ${membro.nome}` });
});

// POST /api/equipes/:id/responder — profissional aceita, recusa ou indica outro
router.post('/:id/responder', async (req: Request, res: Response) => {
  const equipe = equipeStore.get(req.params.id);
  if (!equipe) return res.status(404).json({ success: false, error: 'Equipe não encontrada' });

  const { profId, resposta, indicarProfId } = req.body;
  if (!profId || !resposta) return res.status(400).json({ success: false, error: 'profId e resposta obrigatórios' });

  const membro = equipe.membros.find(m => m.profId === Number(profId));
  if (!membro) return res.status(404).json({ success: false, error: 'Profissional não encontrado na equipe' });
  if (membro.status !== 'convidado') return res.status(400).json({ success: false, error: `Convite já respondido: ${membro.status}` });

  const agora = new Date().toISOString();

  if (resposta === 'aceitar') {
    membro.status = 'confirmado';
    membro.respondidoEm = agora;

    await registrarFatoIdempotente(factStore, {
      subjectId: Number(profId),
      predicate: 'participou_equipe',
      objectValue: `Aceitou participar da equipe "${equipe.titulo}"`,
      origin: 'equipe',
      originRef: `eq:${equipe.id}:${profId}:aceite`,
      confidence: 'confirmado',
      visibility: 'rede',
      occurredAt: new Date(),
      contextDetail: equipe.titulo,
    }).catch(() => {});

  } else if (resposta === 'recusar') {
    membro.status = 'recusado';
    membro.respondidoEm = agora;

  } else if (resposta === 'indicar_outro' && indicarProfId) {
    membro.status = 'indicou_outro';
    membro.respondidoEm = agora;
    membro.indicouProfId = Number(indicarProfId);

    await registrarFatoIdempotente(factStore, {
      subjectId: Number(profId),
      predicate: 'indicou',
      objectValue: `Indicou profissional ${indicarProfId} para equipe "${equipe.titulo}"`,
      origin: 'equipe',
      originRef: `eq:${equipe.id}:${profId}:indicou:${indicarProfId}`,
      confidence: 'indicado',
      visibility: 'rede',
      occurredAt: new Date(),
      contextDetail: `equipe:${equipe.titulo}`,
    }).catch(() => {});

  } else {
    return res.status(400).json({ success: false, error: 'resposta deve ser: aceitar, recusar, indicar_outro' });
  }

  res.json({ success: true, equipe, membro });
});

// GET /api/equipes/:id — detalhes da equipe
router.get('/:id', (req: Request, res: Response) => {
  const equipe = equipeStore.get(req.params.id);
  if (!equipe) return res.status(404).json({ success: false, error: 'Equipe não encontrada' });
  res.json({ success: true, equipe });
});

// GET /api/equipes/:id/analytics — analytics da equipe
router.get('/:id/analytics', async (req: Request, res: Response) => {
  const equipe = equipeStore.get(req.params.id);
  if (!equipe) return res.status(404).json({ success: false, error: 'Equipe não encontrada' });

  const total = equipe.membros.length;
  const confirmados = equipe.membros.filter(m => m.status === 'confirmado').length;
  const recusados = equipe.membros.filter(m => m.status === 'recusado').length;
  const pendentes = equipe.membros.filter(m => m.status === 'convidado').length;
  const indicacoes = equipe.membros.filter(m => m.status === 'indicou_outro').length;

  const temposMedios = equipe.membros
    .filter(m => m.respondidoEm)
    .map(m => new Date(m.respondidoEm!).getTime() - new Date(m.convidadoEm).getTime());
  const tempoMedioResposta = temposMedios.length > 0
    ? Math.round(temposMedios.reduce((a, b) => a + b, 0) / temposMedios.length / 60000)
    : null;

  const especialidadesUsadas = [...new Set(equipe.membros.map(m => m.especialidade).filter(Boolean))];

  const taxaResposta = total > 0 ? Math.round(((total - pendentes) / total) * 100) : 0;

  res.json({
    success: true,
    analytics: {
      totalProfissionais: total,
      confirmados,
      recusados,
      pendentes,
      indicacoes,
      especialidadesUsadas,
      taxaResposta,
      tempoMedioRespostaMin: tempoMedioResposta,
      status: equipe.status,
      periodo: { inicio: equipe.dataInicio, fim: equipe.dataFim },
      regiao: equipe.regiao,
    },
  });
});

// POST /api/equipes/:id/concluir — marcar equipe como concluída
router.post('/:id/concluir', (req: Request, res: Response) => {
  const equipe = equipeStore.get(req.params.id);
  if (!equipe) return res.status(404).json({ success: false, error: 'Equipe não encontrada' });

  equipe.status = 'concluida';
  equipe.concluidaEm = new Date().toISOString();
  res.json({ success: true, equipe, mensagem: 'Equipe concluída. As relações e experiências permanecem na rede.' });
});

// POST /api/equipes/:id/desfazer — desfazer equipe (convites cancelados, história permanece)
router.post('/:id/desfazer', (req: Request, res: Response) => {
  const equipe = equipeStore.get(req.params.id);
  if (!equipe) return res.status(404).json({ success: false, error: 'Equipe não encontrada' });

  equipe.status = 'desfeita';
  for (const m of equipe.membros) {
    if (m.status === 'convidado') m.status = 'recusado';
  }
  res.json({
    success: true, equipe,
    mensagem: 'Equipe desfeita. Convites pendentes cancelados. As relações, indicações e experiências já registradas permanecem na rede.',
  });
});

// POST /api/equipes/:id/repetir — montar novamente baseado em equipe anterior
router.post('/:id/repetir', (req: Request, res: Response) => {
  const original = equipeStore.get(req.params.id);
  if (!original) return res.status(404).json({ success: false, error: 'Equipe original não encontrada' });

  const id = `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nova: Equipe = {
    id,
    titulo: original.titulo,
    descricao: original.descricao,
    responsavelId: original.responsavelId,
    regiao: original.regiao,
    dataInicio: '',
    dataFim: '',
    especialidades: [...original.especialidades],
    membros: original.membros
      .filter(m => m.status === 'confirmado')
      .map(m => ({
        ...m,
        status: 'convidado' as const,
        convidadoEm: new Date().toISOString(),
        respondidoEm: undefined,
      })),
    status: 'montando',
    criadaEm: new Date().toISOString(),
    originEquipeId: original.id,
  };

  equipeStore.set(id, nova);

  const disponiveis = nova.membros.length;
  res.json({
    success: true, equipe: nova,
    mensagem: `Nova equipe criada baseada em "${original.titulo}". ${disponiveis} profissionais reconvidados.`,
  });
});

export default router;
