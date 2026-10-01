import { Router, Request, Response } from 'express';

const router = Router();

// Estado operacional da relação (Experience Layer §10)
// conversando → combinado → a_caminho → chegou → em_servico → concluido → validado
type Estado = 'conversando' | 'combinado' | 'a_caminho' | 'chegou' | 'em_servico' | 'concluido' | 'validado';

const TRANSICOES_VALIDAS: Record<Estado, Estado[]> = {
  conversando: ['combinado'],
  combinado: ['a_caminho'],
  a_caminho: ['chegou'],
  chegou: ['em_servico'],
  em_servico: ['concluido'],
  concluido: ['validado'],
  validado: [],
};

interface ServiceSession {
  chatId: string;
  clientId: number;
  professionalId: number;
  estado: Estado;
  aceiteCliente: boolean;
  aceiteProfissional: boolean;
  confirmacaoCliente: boolean;
  confirmacaoProfissional: boolean;
  transitions: Array<{ estado: Estado; by: number; at: string }>;
  createdAt: string;
  updatedAt: string;
}

// MemStorage pra sessões de serviço (migra pra Postgres quando DATABASE_URL estiver pronto)
const sessions = new Map<string, ServiceSession>();

function getOrCreate(chatId: string, clientId: number, professionalId: number): ServiceSession {
  let s = sessions.get(chatId);
  if (!s) {
    s = {
      chatId,
      clientId,
      professionalId,
      estado: 'conversando',
      aceiteCliente: true,
      aceiteProfissional: false,
      confirmacaoCliente: false,
      confirmacaoProfissional: false,
      transitions: [{ estado: 'conversando', by: clientId, at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    sessions.set(chatId, s);
  }
  return s;
}

// GET /api/service-flow/status/ocupados — lista IDs de profissionais em serviço ativo
router.get('/status/ocupados', (_req: Request, res: Response) => {
  const ocupados: number[] = [];
  sessions.forEach(s => {
    const emAtividade = ['combinado', 'a_caminho', 'chegou', 'em_servico'].includes(s.estado);
    if (emAtividade && s.aceiteProfissional) {
      ocupados.push(s.professionalId);
    }
  });
  res.json({ success: true, ocupados });
});

// GET /api/service-flow/:chatId — ler estado atual
router.get('/:chatId', (req: Request, res: Response) => {
  const s = sessions.get(req.params.chatId);
  if (!s) return res.json({ success: true, estado: 'conversando', exists: false });
  res.json({ success: true, ...s, exists: true });
});

// POST /api/service-flow/:chatId/aceitar — profissional aceita a solicitação
router.post('/:chatId/aceitar', (req: Request, res: Response) => {
  const { userId, clientId, professionalId } = req.body;
  if (!userId || !clientId || !professionalId) {
    return res.status(400).json({ success: false, message: 'userId, clientId, professionalId obrigatórios' });
  }
  const s = getOrCreate(req.params.chatId, clientId, professionalId);

  if (userId === professionalId) {
    s.aceiteProfissional = true;
  } else if (userId === clientId) {
    s.aceiteCliente = true;
  }

  s.updatedAt = new Date().toISOString();
  res.json({ success: true, aceiteCliente: s.aceiteCliente, aceiteProfissional: s.aceiteProfissional, estado: s.estado });
});

// POST /api/service-flow/:chatId/transicao — avançar estado
router.post('/:chatId/transicao', (req: Request, res: Response) => {
  const { userId, clientId, professionalId, novoEstado } = req.body;
  if (!userId || !novoEstado || !clientId || !professionalId) {
    return res.status(400).json({ success: false, message: 'userId, clientId, professionalId, novoEstado obrigatórios' });
  }
  const s = getOrCreate(req.params.chatId, clientId, professionalId);

  // Profissional precisa ter aceito pra avançar além de 'conversando'
  if (!s.aceiteProfissional && novoEstado !== 'conversando') {
    return res.status(400).json({ success: false, message: 'Profissional ainda não aceitou a solicitação' });
  }

  const validos = TRANSICOES_VALIDAS[s.estado];
  if (!validos.includes(novoEstado as Estado)) {
    return res.status(400).json({
      success: false,
      message: `Transição inválida: ${s.estado} → ${novoEstado}. Válidas: ${validos.join(', ')}`,
    });
  }

  s.estado = novoEstado as Estado;
  s.transitions.push({ estado: novoEstado as Estado, by: userId, at: new Date().toISOString() });
  s.updatedAt = new Date().toISOString();

  res.json({ success: true, estado: s.estado, transitions: s.transitions });
});

// POST /api/service-flow/:chatId/confirmar — confirmação bilateral (validação)
router.post('/:chatId/confirmar', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId obrigatório' });

  const s = sessions.get(req.params.chatId);
  if (!s) return res.status(404).json({ success: false, message: 'Sessão não encontrada' });
  if (s.estado !== 'concluido') {
    return res.status(400).json({ success: false, message: 'Só pode confirmar após serviço concluído' });
  }

  if (userId === s.clientId) s.confirmacaoCliente = true;
  if (userId === s.professionalId) s.confirmacaoProfissional = true;
  s.updatedAt = new Date().toISOString();

  const ambosConfirmaram = s.confirmacaoCliente && s.confirmacaoProfissional;
  if (ambosConfirmaram) {
    s.estado = 'validado';
    s.transitions.push({ estado: 'validado', by: userId, at: new Date().toISOString() });
  }

  res.json({
    success: true,
    confirmacaoCliente: s.confirmacaoCliente,
    confirmacaoProfissional: s.confirmacaoProfissional,
    validado: ambosConfirmaram,
    estado: s.estado,
  });
});

export default router;
