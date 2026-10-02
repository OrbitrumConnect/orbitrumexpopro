// MCP Server — Orbitrum como tool provider para agentes MCP (§85-§88)
// Expõe o Grupo A (read-only) como tools descritivas.
// Formato: MCP Tool Discovery (JSON-RPC 2.0 sobre stdio ou HTTP SSE).
//
// Para uso: agentes Claude Desktop, Cursor, Windsurf, etc.
// conectam ao Orbitrum via MCP e consultam a rede relacional.

import { Router, Request, Response } from 'express';

const router = Router();

const TOOLS = [
  {
    name: 'buscar_contexto',
    description: 'Busca profissionais na rede Orbitrum com contexto relacional. Retorna profissionais ranqueados por relevância, experiências validadas e indicações. Use para encontrar quem pode resolver a necessidade do usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        categoria: { type: 'string', description: 'Categoria de serviço: eletricista, encanador, pintor, diarista, etc.' },
        cidade: { type: 'string', description: 'Cidade para filtrar (opcional)' },
        limite: { type: 'number', description: 'Máximo de resultados (1-20, default 5)' },
      },
      required: ['categoria'],
    },
  },
  {
    name: 'perfil_profissional',
    description: 'Retorna perfil completo de um profissional com contexto relacional: dados, serviços, disponibilidade, experiências, validações, indicações e caminho relacional. Use após buscar_contexto para mostrar detalhes.',
    inputSchema: {
      type: 'object',
      properties: {
        profissionalId: { type: 'number', description: 'ID do profissional (obtido via buscar_contexto)' },
      },
      required: ['profissionalId'],
    },
  },
  {
    name: 'categorias',
    description: 'Lista todas as categorias de serviço disponíveis na rede Orbitrum. Use para saber quais termos passar no buscar_contexto.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'registrar_resultado',
    description: 'Registra o resultado de uma interação intermediada pelo Orbitrum. Ex: "o usuário contratou o eletricista X". Requer autenticação.',
    inputSchema: {
      type: 'object',
      properties: {
        profissionalId: { type: 'number', description: 'ID do profissional envolvido' },
        descricao: { type: 'string', description: 'Descrição do resultado' },
        agente: { type: 'string', description: 'Nome/ID do agente que está registrando' },
        resultado: { type: 'string', enum: ['positivo', 'neutro', 'negativo'], description: 'Resultado da interação' },
      },
      required: ['profissionalId', 'agente'],
    },
  },
  {
    name: 'solicitar_conexao',
    description: 'Solicita conexão com um profissional em nome de um usuário. O profissional pode aceitar ou recusar.',
    inputSchema: {
      type: 'object',
      properties: {
        profissionalId: { type: 'number', description: 'ID do profissional' },
        agente: { type: 'string', description: 'Nome/ID do agente solicitante' },
        motivo: { type: 'string', description: 'Motivo da solicitação' },
      },
      required: ['profissionalId', 'agente'],
    },
  },
];

// MCP Tool Discovery — lista as tools disponíveis
router.get('/tools', (_req: Request, res: Response) => {
  res.json({
    tools: TOOLS,
    server: {
      name: 'orbitrum',
      version: '1.0.0',
      description: 'Orbitrum — rede relacional de serviços. Conecta pessoas a profissionais com contexto real (experiências, indicações, validações).',
    },
  });
});

// MCP Tool Call — executa uma tool via JSON-RPC style
router.post('/call', async (req: Request, res: Response) => {
  const { tool, arguments: args } = req.body;

  if (!tool) {
    return res.status(400).json({ error: 'tool é obrigatório' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const agentKey = req.headers['x-agent-key'] || '';

  try {
    let endpoint = '';
    let method = 'GET';
    let body: any = undefined;

    switch (tool) {
      case 'buscar_contexto':
        endpoint = `/api/agents/buscar_contexto?categoria=${encodeURIComponent(args?.categoria || '')}&cidade=${encodeURIComponent(args?.cidade || '')}&limite=${args?.limite || 5}`;
        break;
      case 'perfil_profissional':
        endpoint = `/api/agents/perfil/${args?.profissionalId}`;
        break;
      case 'categorias':
        endpoint = '/api/agents/categorias';
        break;
      case 'registrar_resultado':
        endpoint = '/api/agents/registrar_resultado';
        method = 'POST';
        body = args;
        break;
      case 'solicitar_conexao':
        endpoint = '/api/agents/request_connection';
        method = 'POST';
        body = args;
        break;
      default:
        return res.status(400).json({ error: `Tool "${tool}" não encontrada` });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (agentKey) headers['x-agent-key'] = String(agentKey);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    res.json({ result: data });
  } catch (error) {
    console.error('MCP call error:', error);
    res.status(500).json({ error: 'Falha na execução da tool' });
  }
});

// MCP Server Info
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    name: 'orbitrum',
    version: '1.0.0',
    protocol: 'mcp-http',
    description: 'Orbitrum — rede relacional de serviços. Infraestrutura de conexão que IAs externas consultam e alimentam.',
    capabilities: ['tools', 'tool-discovery'],
    endpoints: {
      tools: '/api/mcp/tools',
      call: '/api/mcp/call',
      info: '/api/mcp/info',
    },
  });
});

export default router;
