import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function createError(message: string, statusCode: number = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function handleAsyncError(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function globalErrorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('🚨 Erro capturado pelo handler global:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode: error.statusCode
  });

  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Erro interno do servidor',
    ...(isProduction ? {} : { 
      stack: error.stack,
      url: req.url,
      method: req.method
    })
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.url}`
  });
}

// Input validation helper
export function validateInput(data: any, rules: any) {
  const errors: string[] = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`Campo ${field} é obrigatório`);
    }
    
    if (value && rule.type && typeof value !== rule.type) {
      errors.push(`Campo ${field} deve ser do tipo ${rule.type}`);
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push(`Campo ${field} deve ter pelo menos ${rule.minLength} caracteres`);
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push(`Campo ${field} não pode ter mais de ${rule.maxLength} caracteres`);
    }
  }
  
  return errors;
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Configurar headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS configurado adequadamente
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  next();
}

// Rate limiting helper
const rateLimits = new Map();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!rateLimits.has(key)) {
      rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const rateData = rateLimits.get(key);
    
    if (now > rateData.resetTime) {
      rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (rateData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente em alguns minutos.'
      });
    }
    
    rateData.count++;
    next();
  };
}