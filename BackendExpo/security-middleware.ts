import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import type { Express, Request, Response, NextFunction } from 'express';

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // máximo 60 requests por minuto
  message: {
    error: 'Muitas requisições. Tente novamente em 1 minuto.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 tentativas de pagamento
  message: {
    error: 'Muitas tentativas de pagamento. Aguarde 5 minutos.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir requests sem origin (mobile apps, etc)
    if (!origin) return callback(null, true);
    
    // Lista de domínios permitidos (HTTP + HTTPS para transição)
    const allowedOrigins = [
      'https://*.replit.app',
      'https://*.replit.dev',
      'https://orbitrum.com.br',
      'https://www.orbitrum.com.br',
      'http://orbitrum.com.br',
      'http://www.orbitrum.com.br',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Verificar se o origin está na lista permitida
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Security headers (ajustado para desenvolvimento)
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.mercadopago.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: process.env.NODE_ENV === 'development' ? false : {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Função básica de sanitização
  function sanitize(obj: any): any {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }
  
  // Sanitizar body, query e params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
}

// Log de segurança (filtrado para arquivos legítimos)
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  // Excluir arquivos de desenvolvimento legítimos
  const isLegitimateFile = req.url.includes('.tsx') || 
                          req.url.includes('.js') || 
                          req.url.includes('/@') ||
                          req.url.includes('/src/') ||
                          req.url.includes('node_modules') ||
                          req.url.startsWith('/@fs/');
  
  if (!isLegitimateFile) {
    const suspicious = [
      'javascript:',
      'eval(',
      'document.cookie',
      '<iframe',
      'vbscript:',
      'onload=',
      'onerror='
    ];
    
    const requestString = JSON.stringify({
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query
    }).toLowerCase();
    
    const foundSuspicious = suspicious.filter(pattern => 
      requestString.includes(pattern.toLowerCase())
    );
    
    if (foundSuspicious.length > 0) {
      console.warn('🚨 TENTATIVA SUSPEITA DETECTADA:', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        patterns: foundSuspicious,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
}

// Error handler que não expõe detalhes
export function secureErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log do erro completo para debug
  console.error('🔥 ERRO DO SERVIDOR:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Resposta genérica para o cliente
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Erro interno do servidor',
    ...(isDevelopment && { stack: err.stack })
  });
}

// Setup completo de segurança
export function setupSecurity(app: Express) {
  // Headers de segurança
  app.use(securityHeaders);
  
  // CORS
  app.use(cors(corsOptions));
  
  // Sanitização de entrada
  app.use(sanitizeInput);
  
  // Log de segurança
  app.use(securityLogger);
  
  // Rate limiting geral
  app.use('/api', apiLimiter);
  
  // Rate limiting específico para autenticação
  app.use('/api/auth', authLimiter);
  
  // Rate limiting para pagamentos
  app.use('/api/payment', paymentLimiter);
  app.use('/api/pix', paymentLimiter);
  
  console.log('🛡️ Sistema de segurança ativado');
}