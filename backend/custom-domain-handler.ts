import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para lidar com domínios personalizados
 * Permite que o servidor reconheça e aceite domínios como orbitrum.com.br
 */
export function customDomainHandler(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host') || req.headers.host;
  
  // Lista de domínios permitidos
  const allowedDomains = [
    'orbitrum.com.br',
    'www.orbitrum.com.br',
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ];
  
  // Verificar se o domínio é permitido ou se é um domínio do Replit
  const isAllowedDomain = allowedDomains.some(domain => host?.includes(domain));
  const isReplitDomain = host?.includes('replit.dev');
  
  if (isAllowedDomain || isReplitDomain) {
    // Definir headers apropriados para o domínio personalizado
    res.set({
      'Access-Control-Allow-Origin': req.get('origin') || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    
    // Log do domínio personalizado detectado
    if (host?.includes('orbitrum.com.br')) {
      console.log(`🌐 Domínio personalizado aceito: ${host}`);
    }
  }
  
  next();
}

/**
 * Middleware para servir arquivos estáticos para domínios personalizados
 */
export function staticFileHandler(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host') || req.headers.host;
  
  // Se for um domínio personalizado e não for uma rota de API
  if (host?.includes('orbitrum.com.br') && !req.path.startsWith('/api')) {
    // Permitir que o middleware do Vite processe a requisição
    return next();
  }
  
  next();
}