/**
 * SISTEMA DE PROTEÇÃO DO HEALTH ENDPOINT
 * 
 * REGRA CRÍTICA: O endpoint /api/health DEVE SEMPRE estar disponível
 * Este arquivo garante que o health check nunca seja bloqueado
 */

import { Express } from 'express';

export function ensureHealthEndpoint(app: Express) {
  // Verificar se o health endpoint já existe
  const existingRoutes = app._router?.stack || [];
  const hasHealthRoute = existingRoutes.some((layer: any) => 
    layer.route?.path === '/api/health'
  );

  if (!hasHealthRoute) {
    
    // Criar health endpoint de emergência
    app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'online',
        timestamp: new Date().toISOString(),
        server: 'Orbitrum Connect',
        version: '1.0.0',
        uptime: process.uptime(),
        message: '🚀 Servidor funcionando normalmente (rota de emergência)'
      });
    });
    
  }
}

// Middleware de proteção que força health endpoint no início
export function protectHealthRoute(app: Express) {
  // Sempre garantir que health endpoint seja o primeiro
  app.use((req, res, next) => {
    if (req.path === '/api/health' && req.method === 'GET') {
      return res.json({
        success: true,
        status: 'online',
        timestamp: new Date().toISOString(),
        server: 'Orbitrum Connect',
        version: '1.0.0',
        uptime: process.uptime(),
        message: '🚀 Servidor funcionando normalmente (middleware proteção)'
      });
    }
    next();
  });
}

// Função para validar se health endpoint está respondendo
export async function validateHealthEndpoint(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    return data.success === true && data.status === 'online';
  } catch (error) {
    console.error('❌ Health endpoint não está respondendo:', error);
    return false;
  }
}