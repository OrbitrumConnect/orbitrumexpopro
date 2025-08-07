import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurity, secureErrorHandler } from "./security-middleware";
import { initializeWebSocket } from "./websocket";
import { SSLDetector } from "./ssl-detector";
import { customDomainHandler } from "./custom-domain-handler";
import { configureDomainAcceptance, forceCustomDomainRecognition } from "./domain-config";
import { startTelegramBot } from "./telegram-integration";
import { setupCreditRoutes } from "./credit-tokens";
import { ensureHealthEndpoint, protectHealthRoute } from "./health-protection";
import { startHealthMonitoring } from "./health-monitor";


const app = express();

// PROTEÇÃO CRÍTICA DO HEALTH ENDPOINT - NUNCA PODE FALHAR
protectHealthRoute(app);

// HEALTH CHECK - POSICIONADO ANTES DE TODOS OS MIDDLEWARES
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    server: 'Orbitrum Connect',
    version: '1.0.0',
    uptime: process.uptime(),
    message: '🚀 Servidor funcionando normalmente'
  });
});

// 🌐 Middleware para reconhecer domínio customizado
app.use(forceCustomDomainRecognition);
app.use(configureDomainAcceptance);
app.use(customDomainHandler);

// 🛡️ Configurar segurança ANTES de qualquer outra coisa (temporariamente desabilitado)
if (process.env.NODE_ENV === 'production') {
  setupSecurity(app);
} else {
  console.log('⚠️ Segurança desabilitada para desenvolvimento - React funcionará normalmente');
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar sessões para OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // GARANTIR HEALTH ENDPOINT ANTES DE QUALQUER COISA
  ensureHealthEndpoint(app);
  
  // REGISTRAR ROTAS DE CHAT
  const chatRoutes = await import('./routes/chat');
  app.use('/api/chat', chatRoutes.default);
  
  // REGISTRAR ROTAS FREE PLAN
  const { freePlanRouter } = await import('./routes/free-plan');
  app.use('/api/free-plan', freePlanRouter);
  
  const server = await registerRoutes(app);
  

  
  // Inicializar WebSocket para comunicação em tempo real
  const dashboardWS = initializeWebSocket(server);
  console.log('🔗 WebSocket inicializado para comunicação em tempo real dos dashboards');

  // Importar e inicializar sistema de expiração de planos
  const { planExpirySystem } = await import("./plan-expiry-system");
  planExpirySystem.initialize();

  // Inicializar sincronização automática com Supabase
  const { supabaseSync } = await import("./supabase-sync");
  supabaseSync.start();
  console.log('🔄 Sincronização automática Supabase ativa (a cada 5 minutos)');
  
  // Inicializar sistema de notificações em tempo real
  const { notificationSystem } = await import("./notification-system");
  console.log('📧 Sistema de notificações em tempo real inicializado');

  // 🤖 Telegram Bot TEMPORARIAMENTE DESABILITADO para estabilizar servidor
  console.log('⚠️ Telegram Bot desabilitado temporariamente para estabilidade');
  // try {
  //   const { startTelegramBot } = await import("./telegram-integration");
  //   startTelegramBot();
  //   console.log('🤖 Integração Telegram Bot iniciada em paralelo');
  // } catch (error) {
  //   console.warn('⚠️ Telegram Bot não pôde ser iniciado:', error.message);
  // }

  // 🛡️ Error handler seguro que não expõe detalhes
  app.use(secureErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Configurar CORS e headers para aceitar domínio customizado ANTES do listen
  app.use((req, res, next) => {
    // CORS headers for cross-origin requests
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });
  
  app.use((req, res, next) => {
    // Headers necessários para funcionamento adequado do domínio
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Permitir orbitrum.com.br
    if (req.headers.host?.includes('orbitrum.com.br')) {
      const protocol = req.secure ? 'https' : 'http';
      res.setHeader('Access-Control-Allow-Origin', `${protocol}://${req.headers.host}`);
    }
    
    next();
  });
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    console.log(`🌐 Servidor ativo em: http://0.0.0.0:${port}`);
    console.log(`🌐 Domínio customizado: www.orbitrum.com.br`);
    console.log(`🌐 Replit URL: ${process.env.REPLIT_DOMAINS}`);
    
    // Verificar SSL e configuração do domínio (temporariamente desabilitado)
    console.log('✅ SERVIDOR INICIALIZADO - OAuth Google pronto para teste!');
  
  // INICIAR MONITORAMENTO CONTÍNUO DO HEALTH ENDPOINT
  startHealthMonitoring();
  });
})();
