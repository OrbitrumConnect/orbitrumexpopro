import { Router, Request, Response } from 'express';
import { db as _db } from '../db';
import { professionals as _professionals, users as _users } from '@shared/schema';
import { storage } from '../storage';
import { factStore } from '../relational-store';
import { comporBusca } from '../relational-triggers';
import { perfilRelacional, registrarFatoIdempotente } from '../relational-facts';
import { eq as _eq } from 'drizzle-orm';

const router = Router();

const hasDb = !!process.env.DATABASE_URL;

async function queryProfessionals(): Promise<any[]> {
  if (hasDb) return _db.select().from(_professionals);
  return (await storage.getAllProfessionals()) as any[];
}
async function queryUsers(): Promise<any[]> {
  if (hasDb) return _db.select().from(_users);
  const total = await storage.getTotalUsers();
  const result: any[] = [];
  for (let i = 1; i <= Math.max(total, 50); i++) {
    const u = await storage.getUser(i);
    if (u) result.push(u);
  }
  return result;
}
async function queryProfessionalById(id: number): Promise<any | undefined> {
  if (hasDb) {
    const [p] = await _db.select().from(_professionals).where(_eq(_professionals.id, id));
    return p;
  }
  return storage.getProfessional(id);
}

// --- AUTH: API key simples para agentes externos ---
// Em produção trocar por JWT ou OAuth. Por ora aceita ORBITRUM_AGENT_KEY no header.
function authAgent(req: Request, res: Response): boolean {
  const key = req.headers['x-agent-key'] || req.query.agent_key;
  const expected = process.env.ORBITRUM_AGENT_KEY;
  if (!expected) return true; // sem chave configurada = aberto (dev)
  if (key !== expected) {
    res.status(401).json({ success: false, error: 'Chave de agente inválida' });
    return false;
  }
  return true;
}

/**
 * GET /api/agents/buscar_contexto
 *
 * Busca profissionais com contexto relacional. Endpoint para IAs externas
 * (Claude, GPT, agentes MCP) consultarem a rede do Orbitrum.
 *
 * Query params:
 *   categoria  — filtro por categoria de serviço (ex: "eletricista")
 *   cidade     — filtro por cidade
 *   limite     — máx resultados (default 5, max 20)
 */
router.get('/buscar_contexto', async (req: Request, res: Response) => {
  if (!authAgent(req, res)) return;

  try {
    const categoria = req.query.categoria ? String(req.query.categoria) : null;
    const cidade = req.query.cidade ? String(req.query.cidade).toLowerCase() : null;
    const limite = Math.min(parseInt(String(req.query.limite || '5')), 20);

    const profissionais = await queryProfessionals();
    const usuarios = await queryUsers();

    const nomeDeProfPorUserId = new Map<number, string>();
    for (const p of profissionais as any[]) {
      if (p.userId) nomeDeProfPorUserId.set(p.userId, p.name);
    }
    const nomePorId = (id: number) => {
      if (nomeDeProfPorUserId.has(id)) return nomeDeProfPorUserId.get(id);
      const u: any = (usuarios as any[]).find(u => u.id === id);
      return u?.fullName || u?.username;
    };

    let pool = profissionais as any[];
    if (cidade) {
      pool = pool.filter(p => p.city && p.city.toLowerCase().includes(cidade));
    }

    const candidatos = pool.map((p: any) => ({
      profissional: { id: p.id, name: p.name, title: p.title, city: p.city, avatar: p.avatar },
      profissionalUserId: p.userId ?? p.id,
      aiMatchScore: Math.round((p.rating ?? 0) * 20),
    }));

    const resultado = await comporBusca(factStore, 0, candidatos, { categoria, nomePorId });

    const items = resultado.slice(0, limite).map((r: any) => ({
      id: r.profissional.id,
      nome: r.profissional.name,
      titulo: r.profissional.title,
      cidade: r.profissional.city,
      score: r.score,
      motivos: r.motivos ?? [],
      experiencias: r.experiencias ?? 0,
      validacoes: r.validacoes ?? 0,
    }));

    res.json({
      success: true,
      fonte: 'orbitrum',
      categoria,
      cidade,
      total: items.length,
      profissionais: items,
    });
  } catch (error) {
    console.error('Agent API buscar_contexto:', error);
    res.status(500).json({ success: false, error: 'Falha na busca' });
  }
});

/**
 * GET /api/agents/perfil/:profId
 *
 * Perfil completo de um profissional com contexto relacional.
 * Para IAs exibirem informações detalhadas ao usuário final.
 */
router.get('/perfil/:profId', async (req: Request, res: Response) => {
  if (!authAgent(req, res)) return;

  try {
    const profId = parseInt(req.params.profId);
    const prof: any = await queryProfessionalById(profId);
    if (!prof) return res.status(404).json({ success: false, error: 'Profissional não encontrado' });

    const profUserId = prof.userId ?? prof.id;
    const usuarios = await queryUsers();
    const profissionais = await queryProfessionals();
    const nomeDeProfPorUserId = new Map<number, string>();
    for (const p of profissionais as any[]) if (p.userId) nomeDeProfPorUserId.set(p.userId, p.name);
    const nomePorId = (id: number) => nomeDeProfPorUserId.get(id)
      || (usuarios as any[]).find(u => u.id === id)?.fullName
      || (usuarios as any[]).find(u => u.id === id)?.username;

    const perfil = await perfilRelacional(factStore, profUserId, 0, { nomePorId });

    res.json({
      success: true,
      fonte: 'orbitrum',
      profissional: {
        id: prof.id,
        nome: prof.name,
        titulo: prof.title,
        cidade: prof.city,
        estado: prof.state,
        servicos: prof.services ?? [],
        disponivel: prof.available,
        telefone: prof.phone ?? null,
      },
      contexto_relacional: perfil,
    });
  } catch (error) {
    console.error('Agent API perfil:', error);
    res.status(500).json({ success: false, error: 'Falha ao montar perfil' });
  }
});

/**
 * POST /api/agents/registrar_resultado
 *
 * Agentes externos registram o resultado de uma interação que passaram pelo Orbitrum.
 * Ex: "O usuário contratou o eletricista X que eu recomendei via buscar_contexto."
 *
 * Body: { profissionalId, descricao, agente (nome do agente), resultado: 'positivo'|'neutro'|'negativo' }
 */
router.post('/registrar_resultado', async (req: Request, res: Response) => {
  if (!authAgent(req, res)) return;

  try {
    const { profissionalId, descricao, agente, resultado } = req.body;
    if (!profissionalId || !agente) {
      return res.status(400).json({ success: false, error: 'profissionalId e agente são obrigatórios' });
    }

    const prof: any = await queryProfessionalById(Number(profissionalId));
    if (!prof) return res.status(404).json({ success: false, error: 'Profissional não encontrado' });

    const profUserId = prof.userId ?? prof.id;
    const originRef = `agent:${agente}:${profissionalId}:${Date.now()}`;
    const { fato, criado } = await registrarFatoIdempotente(factStore, {
      subjectId: profUserId,
      predicate: 'referencia_agente',
      objectValue: descricao || `Referência via ${agente}`,
      origin: 'agente_externo',
      originRef,
      agentId: String(agente),
      confidence: resultado === 'positivo' ? 'indicado' : 'declarado',
      visibility: 'agentes',
      occurredAt: new Date(),
      contextDetail: resultado || 'neutro',
    });

    res.json({
      success: true,
      fonte: 'orbitrum',
      fato_id: fato.id,
      criado,
      mensagem: 'Resultado registrado na rede relacional',
    });
  } catch (error) {
    console.error('Agent API registrar_resultado:', error);
    res.status(500).json({ success: false, error: 'Falha ao registrar' });
  }
});

/**
 * GET /api/agents/categorias
 *
 * Lista categorias de serviço disponíveis na rede. Útil para agentes
 * saberem quais termos usar no buscar_contexto.
 */
router.get('/categorias', async (req: Request, res: Response) => {
  if (!authAgent(req, res)) return;

  try {
    const profissionais = await queryProfessionals();
    const cats = new Set<string>();
    for (const p of profissionais as any[]) {
      if (p.title) cats.add(p.title);
      if (Array.isArray(p.services)) {
        for (const s of p.services) cats.add(String(s));
      }
    }
    res.json({
      success: true,
      fonte: 'orbitrum',
      categorias: [...cats].sort(),
    });
  } catch (error) {
    console.error('Agent API categorias:', error);
    res.status(500).json({ success: false, error: 'Falha ao listar categorias' });
  }
});

/**
 * GET /api/agents/openapi.json
 *
 * OpenAPI spec para configurar GPT Actions, MCP servers e integrações.
 */
router.get('/openapi.json', async (_req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const specPath = path.join(__dirname, '..', 'openapi-agents.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    res.json(spec);
  } catch (error) {
    res.status(500).json({ success: false, error: 'OpenAPI spec não encontrado' });
  }
});

/**
 * GET /api/agents/health
 *
 * Health check para agentes verificarem se a API está ativa.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    fonte: 'orbitrum',
    versao: '1.0.0',
    endpoints: [
      'GET /api/agents/buscar_contexto?categoria=...&cidade=...&limite=5',
      'GET /api/agents/perfil/:profId',
      'POST /api/agents/registrar_resultado',
      'GET /api/agents/categorias',
      'GET /api/agents/health',
    ],
  });
});

export default router;
