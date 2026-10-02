import 'dotenv/config'; // DEVE ser o primeiro import: carrega .env (DATABASE_URL) antes de db.ts inicializar o postgres
import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import { registerRoutes } from "./routes";
import { log } from "./log";
import { setupSecurity, secureErrorHandler } from "./security-middleware";
import { SSLDetector } from "./ssl-detector";
import { customDomainHandler } from "./custom-domain-handler";
import { configureDomainAcceptance, forceCustomDomainRecognition } from "./domain-config";
import { setupCreditRoutes } from "./credit-tokens";
import { ensureHealthEndpoint, protectHealthRoute } from "./health-protection";


export const app = express();
const IS_VERCEL = !!process.env.VERCEL; // na Vercel: exporta handler, sem listen/processos vivos

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
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar sessões para OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: IS_VERCEL || process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }
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

export const ready = (async () => {
  // GARANTIR HEALTH ENDPOINT ANTES DE QUALQUER COISA
  ensureHealthEndpoint(app);
  
  // REGISTRAR ROTAS DE CHAT
  const chatRoutes = await import('./routes/chat');
  app.use('/api/chat', chatRoutes.default);
  
  // REGISTRAR ROTAS FREE PLAN
  const { freePlanRouter } = await import('./routes/free-plan');
  app.use('/api/free-plan', freePlanRouter);

  // REGISTRAR ROTAS SERVICE FLOW (trilha bilateral §10)
  const serviceFlowRoutes = await import('./routes/service-flow');
  app.use('/api/service-flow', serviceFlowRoutes.default);

  // REGISTRAR ROTAS AGENT API (Fase F — IAs externas consultam a rede)
  const agentRoutes = await import('./routes/agents');
  app.use('/api/agents', agentRoutes.default);

  // REGISTRAR ROTAS WORKER (cron jobs / manutenção da rede)
  const workerRoutes = await import('./routes/worker');
  app.use('/api/worker', workerRoutes.default);

  const server = await registerRoutes(app);

  // Processos VIVOS (WebSocket, cron, sync) — só fora da Vercel (serverless não segura processo).
  if (!IS_VERCEL) {
    // Inicializar WebSocket para comunicação em tempo real
    const { initializeWebSocket } = await import("./websocket");
    const dashboardWS = initializeWebSocket(server);

    // Importar e inicializar sistema de expiração de planos
    const { planExpirySystem } = await import("./plan-expiry-system");
    planExpirySystem.initialize();

    // Inicializar sincronização automática com Supabase
    const { supabaseSync } = await import("./supabase-sync");
    supabaseSync.start();

    // Inicializar sistema de notificações em tempo real
    const { notificationSystem } = await import("./notification-system");

    // Worker: decay de fatos expirados a cada hora (determinístico, sem IA)
    const cron = await import('node-cron');
    const { runWorker } = await import('./worker');
    cron.schedule('0 * * * *', async () => {
      const results = await runWorker();
      const total = results.reduce((s, r) => s + r.processados, 0);
      if (total > 0) console.error(`[Worker] ${total} fatos processados`);
    });
  }

  // 🤖 Telegram Bot TEMPORARIAMENTE DESABILITADO para estabilizar servidor
  // try {
  //   const { startTelegramBot } = await import("./telegram-integration");
  //   startTelegramBot();
  //   console.log('🤖 Integração Telegram Bot iniciada em paralelo');
  // } catch (error) {
  //   console.warn('⚠️ Telegram Bot não pôde ser iniciado:', error.message);
  // }

  // 🛡️ Error handler seguro que não expõe detalhes
  app.use(secureErrorHandler);

  // Vite/estático — só fora da Vercel (na Vercel o frontend é servido pelo próprio Vercel).
  if (!IS_VERCEL) {
    const { setupVite, serveStatic } = await import("./vite");
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
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
  
  // listen + monitoramento — só fora da Vercel (serverless não dá listen; exporta o handler).
  if (!IS_VERCEL) {
    server.listen({
      port,
      host: "0.0.0.0",
    }, async () => {
      log(`serving on port ${port}`);
      const { startHealthMonitoring } = await import("./health-monitor");
      startHealthMonitoring();
    });
  }
  return app;
})();
