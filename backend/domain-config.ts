import { Request, Response, NextFunction } from 'express';

/**
 * Configuração para aceitar domínios personalizados no Replit
 */
export function configureDomainAcceptance(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host') || req.headers.host;
  
  // Log todas as requisições para debug
  if (host?.includes('orbitrum.com.br')) {
  }
  
  // Configurar headers para aceitar domínio personalizado
  if (host?.includes('orbitrum.com.br')) {
    res.set({
      'X-Custom-Domain': 'orbitrum.com.br',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Frame-Options': 'SAMEORIGIN'
    });
  }
  
  next();
}

/**
 * Middleware para forçar reconhecimento do domínio personalizado
 */
export function forceCustomDomainRecognition(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host') || req.headers.host;
  
  // Se for domínio personalizado, modificar o hostname para ser reconhecido
  if (host?.includes('orbitrum.com.br')) {
    // Adicionar domínio personalizado à lista de domínios permitidos
    const replitDomain = process.env.REPLIT_DOMAINS || '';
    process.env.REPLIT_DOMAINS = `${replitDomain},orbitrum.com.br,www.orbitrum.com.br`;
    
    // Marcar como domínio reconhecido
    (req as any).isCustomDomain = true;
    (req as any).customDomainName = 'orbitrum.com.br';
  }
  
  next();
}