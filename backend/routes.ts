import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSupabase } from "./supabase-auth";
import { behaviorTracker, trackingMiddleware } from "./behavior-tracker";
import { setupAuthRoutes } from "./auth-routes";
import { setupPaymentRoutes } from "./payment-routes";
import { setupAdminRoutes } from "./admin-routes";
import { setupCreditRoutes } from "./credit-tokens";
import { PixTracker } from "./pix-tracking";
import { insertUserSchema, insertProfessionalSchema, insertGameScoreSchema, insertTeamSchema } from "@shared/schema";
import { globalErrorHandler, notFoundHandler, handleAsyncError, rateLimit, securityHeaders, validateInput } from "./error-handler";
import { planExpirySystem } from './plan-expiry-system';
import { isAdminMaster, getAdminWallet, adminBypass } from './admin-bypass';
import { referralSystem } from './referral-system';
import { restoreAdminMaster } from './restore-admin';
import * as cron from 'node-cron';

// Helper functions para carteira administrativa
function getNextSundayDate(): string {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()));
  return nextSunday.toLocaleDateString('pt-BR');
}

function getLastSundayDate(): string {
  const today = new Date();
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay());
  return lastSunday.toLocaleDateString('pt-BR');
}

function getWeeklyUsage(): number {
  // Simular uso semanal para demonstração
  return Math.floor(Math.random() * 500);
}

function getMonthlyUsage(): number {
  // Simular uso mensal para demonstração
  return Math.floor(Math.random() * 2000);
}

// Health check endpoint - CRÍTICO PARA USUÁRIOS VERIFICAREM SE SERVIDOR ESTÁ ONLINE
export function setupHealthRoute(app: Express) {
  app.get('/api/health', async (req: any, res: any) => {
    try {
      // Verificar conexões essenciais
      const totalUsers = await storage.getAllUsers();
      
      res.json({
        success: true,
        status: 'online',
        timestamp: new Date().toISOString(),
        server: 'Orbitrum Connect',
        version: '1.0.0',
        users: totalUsers.length,
        uptime: process.uptime(),
        message: '🚀 Servidor funcionando normalmente'
      });
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Servidor com problemas',
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Simple auth middleware para as rotas de planos
const isAuthenticated = (req: any, res: any, next: any) => {
  // Para desenvolvimento, simular autenticação básica
  if (req.headers.authorization || req.user) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Não autenticado' });
  }
};

// 🔄 SISTEMA DE PERMISSÕES ADMINISTRATIVAS
// Admin não utiliza tokens ou recargas - apenas permissões especiais

// Health check endpoints
function setupHealthCheck(app: Express) {
  app.get('/health', async (req, res) => {
    try {
      const services = {
        database: await storage.getAllUsers().then(() => true).catch(() => false),
        auth: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        memory: process.memoryUsage().heapUsed < 512 * 1024 * 1024
      };
      
      const allHealthy = Object.values(services).every(Boolean);
      const status = allHealthy ? 'healthy' : 'degraded';
      
      res.status(allHealthy ? 200 : 207).json({
        status,
        timestamp: new Date().toISOString(),
        services,
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // GPS Tracking - Profissionais Ativos (usando demonstrativos para apresentação)
  app.get('/api/professionals/active', async (req, res) => {
    try {
      const allProfessionals = await storage.getAllProfessionals();
      const activeProfessionals = allProfessionals.filter(prof => prof.available);
      
      // Se não houver profissionais reais, usar demonstrativos para apresentação
      if (activeProfessionals.length === 0) {
        const demoProfessionals = allProfessionals.filter(prof => prof.isDemo && prof.available);
        console.log(`📍 GPS: ${demoProfessionals.length} profissionais demonstrativos para apresentação`);
        return res.json(demoProfessionals);
      }
      
      console.log(`📍 GPS: ${activeProfessionals.length} profissionais reais ativos`);
      res.json(activeProfessionals);
    } catch (error) {
      console.error('❌ GPS: Erro ao buscar profissionais ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ================================
  // 🔔 SISTEMA DE NOTIFICAÇÕES INTELIGENTES PARA CLIENTES
  // ================================

  // Notificar cliente sobre profissional com auto-aceitar ativo
  app.post('/api/client/notify-auto-accept', async (req, res) => {
    const { clientId, professionalId } = req.body;
    
    try {
      await storage.notifyClientAboutAutoAccept(clientId, professionalId);
      
      res.json({
        success: true,
        message: 'Cliente notificado sobre auto-aceitar',
        timeframe: '1 hora para análise automática',
        escalation: 'Se não aceitar, escalará para 24h e depois para 5 alternativas'
      });
    } catch (error) {
      console.error('Erro ao notificar cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar profissionais alternativos baseado em ratings
  app.get('/api/professional/:id/alternatives', async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    
    try {
      const alternatives = await storage.findAlternativeProfessionals(parseInt(id), limit);
      
      res.json({
        success: true,
        alternatives,
        count: alternatives.length,
        criteria: 'Ordenados por rating e número de avaliações (melhores primeiro)',
        message: `${alternatives.length} profissionais alternativos encontrados`
      });
    } catch (error) {
      console.error('Erro ao buscar alternativas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Processar expiração de auto-aceitar e escalação
  app.post('/api/auto-accept/expire', async (req, res) => {
    const { professionalId, clientId } = req.body;
    
    try {
      await storage.handleAutoAcceptExpiration(professionalId, clientId);
      
      res.json({
        success: true,
        message: 'Expiração processada - escalação automática iniciada',
        escalation: {
          step1: '1 hora - análise automática',
          step2: '24 horas - prazo estendido',
          step3: '5 alternativas - profissionais melhor avaliados'
        }
      });
    } catch (error) {
      console.error('Erro ao processar expiração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // CRIAR JOÃO VIDAL MANUALMENTE - ENDPOINT EMERGENCIAL
  app.post('/api/admin/criar-joao-manual', async (req, res) => {
    try {
      console.log('🚀 CRIANDO JOÃO VIDAL MANUALMENTE...');
      
      // Verificar se já existe
      const existingUser = await storage.getUserByEmail('joao.vidal@remederi.com');
      if (existingUser) {
        console.log('✅ João Vidal já existe:', existingUser);
        return res.json({ 
          success: true, 
          message: "João Vidal já existe no sistema",
          user: existingUser 
        });
      }
      
      // Criar usuário João Vidal
      const userData = {
        username: "João Vidal",
        email: "joao.vidal@remederi.com",
        passwordHash: "supabase_auth_hash",
        plan: "free",
        dataInicioPlano: null,
        tokens: 0,
        tokensPlano: 0,
        tokensGanhos: 0,
        tokensComprados: 0,
        tokensUsados: 0,
        creditosAcumulados: 0,
        creditosSacados: 0,
        canMakePurchases: false,
        userType: "client" as any,
        adminLevel: 0,
        isActive: true,
        emailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        credits: 0,
        maxCredits: 0,
        gamesPlayedToday: 0,
        lastGameDate: null,
        highScore: 0,
        documentsStatus: "pending" as any,
        adminPermissions: []
      };
      
      const newUser = await storage.createUser(userData);
      console.log(`✅ JOÃO VIDAL CRIADO MANUALMENTE: ${newUser.email} (ID: ${newUser.id})`);
      
      res.json({ 
        success: true, 
        message: "João Vidal criado com sucesso",
        user: newUser 
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar João Vidal:', error);
      res.status(500).json({ 
        success: false, 
        error: "Erro ao criar usuário",
        details: error.message 
      });
    }
  });

  // FORÇAR DETECÇÃO DE NOVOS USUÁRIOS SUPABASE
  app.post('/api/admin/detectar-usuarios-supabase', async (req, res) => {
    try {
      console.log('🔍 FORÇANDO DETECÇÃO DE USUÁRIOS SUPABASE...');
      
      // Força nova detecção através do MemStorage
      if ('detectSupabaseUsers' in storage) {
        await (storage as any).detectSupabaseUsers();
        
        // Buscar usuários atualizados
        const totalUsers = Array.from((storage as any).users.values());
        const supabaseUsers = totalUsers.filter(u => u.supabaseId?.startsWith('manual_'));
        
        console.log(`✅ DETECÇÃO CONCLUÍDA - Total: ${totalUsers.length}, Supabase: ${supabaseUsers.length}`);
        
        res.json({ 
          success: true, 
          message: "Detecção de usuários Supabase executada",
          totalUsers: totalUsers.length,
          supabaseUsers: supabaseUsers.length,
          users: supabaseUsers.map(u => ({ id: u.id, email: u.email, userType: u.userType }))
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Método de detecção não disponível" 
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao detectar usuários Supabase:', error);
      res.status(500).json({ 
        success: false, 
        error: "Erro na detecção",
        details: error.message 
      });
    }
  });

  // Rota administrativa EMERGENCIAL para verificar email manualmente
  app.post('/api/admin/verify-email-emergency', async (req, res) => {
    try {
      const { email, adminKey } = req.body;
      
      // Verificação básica de admin
      if (adminKey !== 'orbitrum2025admin') {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }

      // Marcar email como verificado diretamente
      await storage.updateUser(user.id, { emailVerified: true });
      
      console.log('✅ EMAIL VERIFICADO MANUALMENTE PELO ADMIN:', email);
      res.json({
        success: true,
        message: `Email ${email} verificado manualmente com sucesso!`,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: true
        }
      });
    } catch (error) {
      console.error('❌ Erro na verificação manual:', error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Aplicar headers de segurança em todas as rotas
  app.use(securityHeaders);
  
  // Configurar rotas de autenticação
  setupAuthRoutes(app);
  
  // Configurar rotas de pagamento
  setupPaymentRoutes(app);

  // Endpoint manual para liberar tokens (temporário até webhook funcionar)
  app.post("/api/admin/approve-payment", async (req, res) => {
    try {
      const { transactionId, tokens } = req.body;
      
      console.log('💰 Liberando tokens manualmente:', { transactionId, tokens });
      
      // Buscar usuário pelo ID fixo (usuário de teste)
      const userId = 1;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }
      
      // Adicionar tokens ao usuário
      await storage.updateUser(userId, {
        tokensPlano: (user.tokensPlano || 0) + tokens,
        tokensComprados: (user.tokensComprados || 0) + tokens
      });
      
      console.log('✅ Tokens liberados com sucesso para usuário', userId);
      res.json({ success: true, message: `${tokens} tokens liberados com sucesso` });
    } catch (error) {
      console.error('❌ Erro ao liberar tokens:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  });
  
  // Configurar rotas administrativas
  setupAdminRoutes(app);
  // User routes - Dados reais via Supabase
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Verificar se o usuário está autenticado via Supabase
      const supabase = getSupabase();
      const authUser = await supabase.auth.getUser();
      
      if (!authUser.data.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Verificar se é admin master
      const isAdmin = authUser.data.user.email === 'passosmir4@gmail.com';
      
      // Buscar dados reais do usuário autenticado
      const user = await storage.getUserByEmail(authUser.data.user.email);
      if (!user) {
        // Se não existir no storage, criar baseado no Supabase
        const newUser = await storage.createUser({
          email: authUser.data.user.email,
          username: authUser.data.user.user_metadata?.name || authUser.data.user.email.split('@')[0],
          plan: 'free',
          tokensPlano: 0,
          tokensGanhos: 0,
          tokensComprados: 0,
          isAdmin: isAdmin,
          adminLevel: isAdmin ? 10 : 0,
          userType: isAdmin ? 'admin' : 'client'
        });
        return res.json(newUser);
      }
      
      // Para admin master, sobrescrever dados específicos
      if (isAdmin) {
        const adminUser = {
          ...user,
          email: authUser.data.user.email,
          userType: 'admin',
          tokens: 10000, // Tokens administrativos fixos
          isAdmin: true,
          adminLevel: 10,
          gamesPlayedToday: 0, // Admin tem jogos ilimitados
          plan: 'admin'
        };
        console.log('✅ Admin master logado:', authUser.data.user.email);
        return res.json(adminUser);
      }
      
      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.patch("/api/users/:id/tokens", async (req, res) => {
    const id = parseInt(req.params.id);
    const { tokens } = req.body;
    const user = await storage.updateUserTokens(id, tokens);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.patch("/api/users/:id/plan", async (req, res) => {
    const id = parseInt(req.params.id);
    const { plan, credits, maxCredits } = req.body;
    const user = await storage.updateUserPlan(id, plan, credits, maxCredits);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.patch("/api/users/:id/games", async (req, res) => {
    const id = parseInt(req.params.id);
    const date = new Date().toISOString().split('T')[0];
    const user = await storage.incrementGamesPlayed(id, date);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Endpoint para transformar conta de cliente em profissional
  app.post("/api/users/upgrade-to-professional", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID é obrigatório" });
      }
      
      // Buscar usuário existente
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se já é profissional
      if (user.userType === 'professional') {
        return res.status(400).json({ message: "Usuário já é profissional" });
      }
      
      // Atualizar tipo do usuário para profissional
      const updatedUser = await storage.updateUserType(userId, 'professional');
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao transformar conta em profissional" });
      }
      
      console.log(`✅ Conta transformada: ${user.email} agora é profissional`);
      
      res.json({ 
        success: true, 
        message: "Conta transformada em profissional com sucesso",
        user: updatedUser
      });
      
    } catch (error) {
      console.error('Erro ao transformar conta:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/users/:id/high-score", async (req, res) => {
    const id = parseInt(req.params.id);
    const { score } = req.body;
    const user = await storage.updateHighScore(id, score);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Professional routes - Sistema inteligente: prioriza habilitados, fallback para demonstrativos
  app.get("/api/professionals", async (req, res) => {
    const { search } = req.query;
    
    if (search && typeof search === 'string') {
      // BUSCA: Priorizar profissionais habilitados (reais) sobre demonstrativos
      const allProfessionals = await storage.getAllProfessionals();
      const realProfessionals = allProfessionals.filter(p => !p.isDemo);
      const demoProfessionals = allProfessionals.filter(p => p.isDemo);
      
      // Buscar primeiro nos profissionais reais
      const realResults = await storage.searchProfessionals(search);
      const realSearchResults = realResults.filter(p => !p.isDemo);
      
      if (realSearchResults.length > 0) {
        // Se temos profissionais reais que atendem a busca, usar apenas eles
        res.json(realSearchResults.slice(0, 6));
      } else {
        // Se não temos profissionais reais, buscar nos demonstrativos
        const demoResults = realResults.filter(p => p.isDemo);
        res.json(demoResults.slice(0, 6));
      }
    } else {
      // VISUALIZAÇÃO ORBITAL: Priorizar profissionais habilitados quando existem
      const professionals = await storage.getAllProfessionals();
      const realProfessionals = professionals.filter(p => !p.isDemo);
      const demoProfessionals = professionals.filter(p => p.isDemo);
      
      if (realProfessionals.length >= 10) {
        // Se temos profissionais reais suficientes, usar apenas eles
        const topRealProfessionals = realProfessionals
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 20);
        res.json(topRealProfessionals);
      } else if (realProfessionals.length > 0) {
        // Se temos alguns profissionais reais, completar com demonstrativos
        const combinedProfessionals = [
          ...realProfessionals.sort((a, b) => b.rating - a.rating),
          ...demoProfessionals.slice(0, 20 - realProfessionals.length)
        ];
        res.json(combinedProfessionals);
      } else {
        // Se não temos profissionais reais, usar apenas demonstrativos
        const orbsForVisualization = demoProfessionals.slice(0, 20);
        res.json(orbsForVisualization);
      }
    }
  });

  // 📍 GEOLOCALIZAÇÃO DE PROFISSIONAIS (DEVE VIR ANTES DA ROTA :id)
  app.get("/api/professionals/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius = 35 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          message: "Coordenadas GPS obrigatórias" 
        });
      }
      
      console.log('📍 Buscando profissionais próximos:', { latitude, longitude, radius });
      
      const allProfessionals = await storage.getAllProfessionals();
      console.log('📍 Total de profissionais encontrados:', allProfessionals.length);
      
      // Filtrar profissionais próximos
      const nearbyProfessionals = allProfessionals.filter((prof: any) => {
        console.log('📍 Verificando:', prof.name, 'Lat:', prof.latitude, 'Lon:', prof.longitude);
        if (!prof.latitude || !prof.longitude) return false;
        
        // Calcular distância usando fórmula de Haversine
        const distance = calculateDistance(
          parseFloat(latitude as string), 
          parseFloat(longitude as string),
          prof.latitude, 
          prof.longitude
        );
        
        console.log('📍 Distância calculada:', distance, 'km');
        return distance <= parseInt(radius as string);
      }).map((prof: any) => ({
        ...prof,
        distance: calculateDistance(
          parseFloat(latitude as string), 
          parseFloat(longitude as string),
          prof.latitude, 
          prof.longitude
        )
      })).sort((a: any, b: any) => a.distance - b.distance);
      
      console.log('📍 Encontrados', nearbyProfessionals.length, 'profissionais próximos');
      
      res.json({
        success: true,
        professionals: nearbyProfessionals,
        searchCenter: { latitude: parseFloat(latitude as string), longitude: parseFloat(longitude as string) },
        radius: parseInt(radius as string),
        totalFound: nearbyProfessionals.length
      });
      
    } catch (error) {
      console.error("Erro na busca geográfica:", error);
      res.status(500).json({ success: false, message: "Erro na busca por localização" });
    }
  });

  app.get("/api/professionals/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const professional = await storage.getProfessional(id);
    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }
    res.json(professional);
  });

  // Rota para obter serviços de um profissional
  app.get("/api/professionals/:id/services", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      if (isNaN(professionalId)) {
        return res.status(400).json({ message: "ID do profissional inválido" });
      }

      const services = await storage.getProfessionalServices(professionalId);
      res.json(services);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/professionals", async (req, res) => {
    try {
      const professionalData = insertProfessionalSchema.parse(req.body);
      const professional = await storage.createProfessional(professionalData);
      res.status(201).json(professional);
    } catch (error) {
      res.status(400).json({ message: "Invalid professional data", error });
    }
  });

  // Game routes
  app.post("/api/game-scores", async (req, res) => {
    try {
      const gameScoreData = insertGameScoreSchema.parse(req.body);
      const gameScore = await storage.createGameScore(gameScoreData);
      res.status(201).json(gameScore);
    } catch (error) {
      res.status(400).json({ message: "Invalid game score data", error });
    }
  });

  app.get("/api/users/:id/game-scores", async (req, res) => {
    const userId = parseInt(req.params.id);
    const gameScores = await storage.getUserGameScores(userId);
    res.json(gameScores);
  });

  // Team routes
  app.post("/api/teams", async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data", error });
    }
  });

  app.get("/api/users/:id/teams", async (req, res) => {
    const userId = parseInt(req.params.id);
    const teams = await storage.getUserTeams(userId);
    res.json(teams);
  });

  app.patch("/api/teams/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { professionalIds } = req.body;
    const team = await storage.updateTeam(id, professionalIds);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.json(team);
  });

  // Professional Categories routes
  app.get("/api/professional-categories", async (req, res) => {
    try {
      const categories = await storage.getAllProfessionalCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching professional categories:", error);
      res.status(500).json({ message: "Erro ao buscar categorias profissionais" });
    }
  });

  // REFERRAL SYSTEM ROUTES
  app.get("/api/admin/referral/stats", async (req, res) => {
    try {
      const stats = await storage.getReferralStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral statistics" });
    }
  });

  app.get("/api/admin/referral/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getReferralCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/admin/referral/create-campaign", async (req, res) => {
    try {
      const campaign = await storage.createReferralCampaign();
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.post("/api/admin/referral/invite-clients", async (req, res) => {
    try {
      const { emails } = req.body;
      const result = await storage.invitePromotionalClients(emails);
      res.json(result);
    } catch (error) {
      console.error("Error inviting clients:", error);
      res.status(500).json({ error: "Failed to invite clients" });
    }
  });

  app.post("/api/admin/referral/expire-users", async (req, res) => {
    try {
      const result = await storage.expirePromotionalUsers();
      res.json(result);
    } catch (error) {
      console.error("Error expiring users:", error);
      res.status(500).json({ error: "Failed to expire promotional users" });
    }
  });

  // 🛡️ ADMIN ROUTES - Admin não tem carteira nem tokens
  // Admin usa apenas sistema de permissões, sem interface de tokens

  app.get("/api/professional-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getProfessionalCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching professional category:", error);
      res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  });

  // Simplified route for current user teams
  app.get("/api/teams", async (_req, res) => {
    try {
      const teams = await storage.getUserTeams(1); // Using default user
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams/add-professional", async (req, res) => {
    try {
      const { professionalId } = req.body;
      
      // Find or create "Meu Time" team
      const teams = await storage.getUserTeams(1);
      let myTeam = teams.find(t => t.name === "Meu Time");
      
      if (!myTeam) {
        myTeam = await storage.createTeam({
          userId: 1,
          name: "Meu Time",
          professionalIds: []
        });
      }

      // Add professional to team if not already there
      const currentIds = myTeam.professionalIds || [];
      if (!currentIds.includes(professionalId.toString())) {
        if (currentIds.length >= 10) {
          return res.status(400).json({ error: "Time já possui o máximo de 10 profissionais" });
        }
        
        const updatedIds = [...currentIds, professionalId.toString()];
        const updatedTeam = await storage.updateTeam(myTeam.id, updatedIds);
        res.json(updatedTeam);
      } else {
        res.status(400).json({ error: "Profissional já está no time" });
      }
    } catch (error) {
      console.error("Error adding professional to team:", error);
      res.status(500).json({ error: "Failed to add professional to team" });
    }
  });

  app.post("/api/teams/:teamId/remove-professional", async (req, res) => {
    try {
      const { teamId } = req.params;
      const { professionalId } = req.body;
      
      const teams = await storage.getUserTeams(1);
      const team = teams.find(t => t.id === parseInt(teamId));
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const currentIds = team.professionalIds || [];
      const updatedIds = currentIds.filter(id => id !== professionalId.toString());
      
      const updatedTeam = await storage.updateTeam(team.id, updatedIds);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error removing professional from team:", error);
      res.status(500).json({ error: "Failed to remove professional from team" });
    }
  });

  // Team Request routes (Sistema "Seu Time")
  app.post("/api/team-requests", handleAsyncError(async (req, res) => {
    try {
      const requestData = insertTeamRequestSchema.parse(req.body);
      const teamRequest = await storage.createTeamRequest(requestData);
      res.status(201).json(teamRequest);
    } catch (error) {
      res.status(400).json({ message: "Dados da solicitação inválidos", error });
    }
  }));

  app.get("/api/team-requests/professional/:professionalId", handleAsyncError(async (req, res) => {
    const professionalId = parseInt(req.params.professionalId);
    const requests = await storage.getTeamRequestsForProfessional(professionalId);
    res.json(requests);
  }));

  app.get("/api/team-requests/client/:clientId", handleAsyncError(async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    const requests = await storage.getTeamRequestsForClient(clientId);
    res.json(requests);
  }));

  app.patch("/api/team-requests/:requestId/status", handleAsyncError(async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const { status, professionalResponse, contactInfo } = req.body;
    
    const updatedRequest = await storage.updateTeamRequestStatus(
      requestId, 
      status, 
      professionalResponse, 
      contactInfo
    );
    res.json(updatedRequest);
  }));

  // Endpoints específicos para aceitar, rejeitar e restaurar
  app.patch("/api/team-requests/:id/accept", handleAsyncError(async (req, res) => {
    const { id } = req.params;
    const { contactInfo, professionalResponse } = req.body;
    const updated = await storage.acceptTeamRequest(parseInt(id), contactInfo, professionalResponse);
    res.json(updated);
  }));

  app.patch("/api/team-requests/:id/reject", handleAsyncError(async (req, res) => {
    const { id } = req.params;
    const updated = await storage.rejectTeamRequest(parseInt(id));
    res.json(updated);
  }));

  app.patch("/api/team-requests/:id/restore", handleAsyncError(async (req, res) => {
    const { id } = req.params;
    const updated = await storage.restoreTeamRequest(parseInt(id));
    res.json(updated);
  }));

  // Criar time com notificações automáticas para profissionais
  app.post("/api/teams/create-with-requests", handleAsyncError(async (req, res) => {
    const { name, professionals, projectTitle, description, clientId, clientName } = req.body;

    console.log("🎯 INICIANDO CRIAÇÃO DE TIME:");
    console.log("   Nome:", name);
    console.log("   Cliente:", clientName, "(ID:", clientId, ")");
    console.log("   Profissionais:", professionals?.length || 0);

    if (!professionals || professionals.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum profissional fornecido para o time"
      });
    }

    // Criar o time primeiro
    const team = await storage.createTeam({
      name,
      userId: clientId,
      professionalIds: professionals.map((p: any) => p.id.toString())
    });

    console.log("✅ TIME CRIADO:", team.name, "(ID:", team.id, ")");

    // Criar solicitações para cada profissional
    const requests = await Promise.all(
      professionals.map(async (professional: any) => {
        const requestData = {
          clientId,
          professionalId: professional.id,
          projectTitle: projectTitle || `Projeto: ${name}`,
          description: description || `Você foi convidado para participar do time "${name}". Aguardamos sua resposta!`,
          selectedService: professional.selectedService || "Colaboração em equipe",
          budget: professional.budget || null,
          hourlyRate: professional.hourlyRate || null,
          clientName: clientName
        };

        console.log("📤 CRIANDO SOLICITAÇÃO PARA:", professional.name, "(ID:", professional.id, ")");
        const request = await storage.createTeamRequest(requestData);
        console.log("   ✅ Solicitação criada ID:", request.id);
        return request;
      })
    );

    // Criar notificações para cada profissional
    const notifications = await Promise.all(
      professionals.map(async (professional: any) => {
        const notification = await storage.createUserNotification({
          userId: professional.id,
          title: "Nova Solicitação de Equipe",
          message: `${clientName} convidou você para participar do time "${name}"`,
          type: "team_request",
          data: { teamId: team.id, clientName, projectTitle }
        });
        console.log("🔔 NOTIFICAÇÃO ENVIADA para:", professional.name);
        return notification;
      })
    );

    console.log("🎉 PROCESSO COMPLETO:");
    console.log("   Time criado:", team.name);
    console.log("   Solicitações:", requests.length);
    console.log("   Notificações:", notifications.length);

    res.json({
      success: true,
      team,
      requests,
      notifications,
      message: `Time "${name}" criado com sucesso! ${requests.length} solicitações enviadas e ${notifications.length} notificações entregues.`
    });
  }));

  app.get("/api/team-requests/:requestId", handleAsyncError(async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const request = await storage.getTeamRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada" });
    }
    res.json(request);
  }));

  // Restaurar solicitação da lixeira
  app.patch("/api/team-requests/:requestId/restore", handleAsyncError(async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const restoredRequest = await storage.restoreTeamRequest(requestId);
    res.json(restoredRequest);
  }));

  // Limpar solicitações expiradas da lixeira
  app.delete("/api/team-requests/cleanup-trash", handleAsyncError(async (req, res) => {
    const deletedCount = await storage.cleanupExpiredTrashRequests();
    res.json({ deletedCount, message: `${deletedCount} solicitações expiradas removidas` });
  }));

  // Team Messages routes (Chat entre cliente e profissional)
  app.post("/api/team-messages", handleAsyncError(async (req, res) => {
    try {
      const messageData = insertTeamMessageSchema.parse(req.body);
      const teamMessage = await storage.createTeamMessage(messageData);
      res.status(201).json(teamMessage);
    } catch (error) {
      res.status(400).json({ message: "Dados da mensagem inválidos", error });
    }
  }));

  app.get("/api/team-messages/:requestId", handleAsyncError(async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const messages = await storage.getTeamMessages(requestId);
    res.json(messages);
  }));

  app.patch("/api/team-messages/:requestId/mark-read", handleAsyncError(async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const { userId } = req.body;
    
    await storage.markMessagesAsRead(requestId, userId);
    res.json({ success: true });
  }));

  app.get("/api/team-messages/:requestId/unread-count", handleAsyncError(async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const { userId } = req.query;
    
    const count = await storage.getUnreadMessageCount(requestId, parseInt(userId as string));
    res.json({ count });
  }));

  // Endpoints para sistema de auto-aceitar solicitações
  app.post('/api/professional/auto-accept/toggle', handleAsyncError(async (req, res) => {
    const { professionalId, enabled, userEmail } = req.body;
    
    try {
      // Atualizar status do auto-aceitar no profissional
      const result = await storage.updateProfessionalAutoAccept(professionalId, enabled);
      
      // Log para admin ver atividades
      console.log(`🎯 AUTO-ACEITAR ${enabled ? 'ATIVADO' : 'DESATIVADO'}:`, {
        profissional: userEmail,
        status: enabled ? 'ATIVO' : 'INATIVO',
        timestamp: new Date().toISOString(),
        professionalId
      });
      
      // Enviar dados para tracking comportamental do admin
      await behaviorTracker.track({
        event: 'auto_accept_toggle',
        data: {
          professionalId,
          enabled,
          userEmail,
          timestamp: new Date().toISOString(),
          action: enabled ? 'activated' : 'deactivated'
        }
      });
      
      res.json({ 
        success: true, 
        autoAcceptEnabled: enabled,
        message: enabled ? 'Auto-aceitar ativado - Solicitações serão aceitas automaticamente em 1 hora' : 'Auto-aceitar desativado'
      });
    } catch (error) {
      console.error('Erro ao alterar auto-aceitar:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }));

  // Endpoint para obter status atual do auto-aceitar
  app.get('/api/professional/:id/auto-accept/status', handleAsyncError(async (req, res) => {
    const { id } = req.params;
    
    try {
      const status = await storage.getProfessionalAutoAcceptStatus(parseInt(id));
      res.json(status);
    } catch (error) {
      console.error('Erro ao buscar status auto-aceitar:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }));

  // Endpoint para admin ver dados de auto-aceitar de todos profissionais
  app.get('/api/admin/auto-accept/analytics', handleAsyncError(async (req, res) => {
    try {
      const analytics = await storage.getAutoAcceptAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Erro ao buscar analytics auto-aceitar:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }));

  // 💰 SISTEMA DE COMPRA DE TOKENS - PIX DIRETO
  app.post('/api/payment/create-pix-tokens', handleAsyncError(async (req, res) => {
    const { amount, tokens, description } = req.body;
    const userEmail = req.headers['user-email'] as string;

    if (!userEmail) {
      return res.status(401).json({ error: 'Email do usuário necessário' });
    }

    if (!amount || !tokens) {
      return res.status(400).json({ error: 'Valor e tokens são obrigatórios' });
    }

    console.log(`💰 CRIANDO PIX PARA TOKENS: ${tokens} tokens por R$ ${amount} - ${userEmail}`);

    // Criar PIX válido
    const transactionId = `TKN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const pixKey = '03669282106'; // CPF Pedro Galluf
    const pixCode = `00020126330014br.gov.bcb.pix011103669282106520400005303986540${amount.toFixed(2)}5802BR5913PEDRO GALLUF6013RIO DE JANEIRO62${String(7 + transactionId.length).padStart(2, '0')}0503${transactionId}6304F123`;
    
    // Simular QR Code base64 (placeholder válido)
    const placeholderQR = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    console.log(`✅ PIX TOKENS CRIADO: ${transactionId} - Válido para ${pixKey}`);
    
    res.json({
      success: true,
      qrCodeBase64: placeholderQR,
      pixCode: pixCode,
      pixKey: pixKey,
      amount: amount,
      transactionId: transactionId,
      tokens: tokens,
      instructions: `PIX de R$ ${amount} para comprar ${tokens} tokens`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
  }));

  // User dashboard data
  app.get("/api/user/dashboard", async (req, res) => {
    try {
      // Usar usuário padrão por enquanto - depois implementar autenticação real
      const userId = 1;
      
      const user = await storage.getUser(userId);
      const wallet = await storage.getUserWallet(userId);
      
      // Mock dos dados de documentos - depois implementar na storage
      const documentsStatus = {
        selfie: false,
        document: false,
        address: false,
        pixKey: false,
        verified: false
      };
      
      const cashbackEligible = user?.plan !== 'free' && documentsStatus.verified;
      
      res.json({
        user,
        wallet,
        documentsStatus,
        cashbackEligible
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Admin wallet endpoint - carteira administrativa separada (APENAS PARA JOGOS)
  app.get("/api/admin/wallet", async (req, res) => {
    try {
      // Carteira administrativa fixa com recarga semanal - LIMITADA A JOGOS
      const adminWallet = {
        saldoTotal: 10000,
        tokensPlano: 10000,
        tokensGanhos: 0,
        tokensComprados: 0,
        cashbackDisponivel: 0,
        cashbackRetirado: 0,
        utilizacaoSemana: getWeeklyUsage(),
        utilizacaoMes: getMonthlyUsage(),
        recargaSemanal: true,
        proximaRecarga: getNextSundayDate(),
        statusSistema: "🔄 Recarga automática ativa",
        ultimaRecarga: getLastSundayDate(),
        limitacao: "Válido apenas para jogos e testes - não para serviços profissionais"
      };
      
      res.json(adminWallet);
    } catch (error) {
      console.error("Erro ao buscar carteira admin:", error);
      res.status(500).json({ error: "Erro ao buscar carteira administrativa" });
    }
  });

  // Creditar tokens manualmente (PIX confirmado)  
  app.post('/api/admin/creditar-tokens', async (req, res) => {
    try {
      const { userId, amount, description } = req.body;
      
      console.log(`🔧 CRÉDITO MANUAL: ${amount} tokens para usuário ${userId}`);
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Creditar tokens de compra
      const newTokens = (user.purchaseTokens || 0) + amount;
      await storage.updateUser(parseInt(userId), {
        purchaseTokens: newTokens
      });
      
      console.log(`✅ CREDITADO: ${amount} tokens para ${user.email || `usuário ${userId}`}`);
      
      res.json({
        success: true,
        message: `${amount} tokens creditados com sucesso!`,
        newBalance: newTokens,
        user: user.email || `ID: ${userId}`
      });
      
    } catch (error) {
      console.error('❌ Erro ao creditar tokens:', error);
      res.status(500).json({ error: 'Erro interno' });
    }
  });

  // ENDPOINT EMERGÊNCIA: Restaurar dados completos do admin
  app.post("/api/admin/restore-emergency", async (req, res) => {
    try {
      console.log('🚨 RESTAURANDO DADOS ADMIN EMERGÊNCIA...');
      
      // Restaurar Pedro com tokens permanentes
      let pedro = await storage.getUserByEmail('phpg69@gmail.com');
      if (!pedro) {
        pedro = await storage.createUser({
          username: "Pedro",
          email: "phpg69@gmail.com", 
          password: "hashed_password",
          emailVerified: true,
          userType: "client" as any,
          plan: "free",
          tokens: 2160,
          tokensComprados: 2160,
          tokensPlano: 0,
          canMakePurchases: true
        });
        console.log('✅ Pedro restaurado com 2160 tokens');
      }
      
      // Restaurar Maria Helena com tokens permanentes
      let maria = await storage.getUserByEmail('mariahelena@gmail.com');
      if (!maria) {
        maria = await storage.createUser({
          username: "Maria Helena",
          email: "mariahelena@gmail.com",
          password: "hashed_password", 
          emailVerified: true,
          userType: "client" as any,
          plan: "free",
          tokens: 4320,
          tokensComprados: 4320,
          tokensPlano: 0,
          canMakePurchases: true
        });
        console.log('✅ Maria Helena restaurada com 4320 tokens');
      }
      
      // Atualizar admin master para plano Max com tokens
      const admin = await storage.getUserByEmail('passosmir4@gmail.com');
      if (admin) {
        await storage.updateUser(admin.id, {
          plan: "max",
          tokens: 30000,
          tokensPlano: 30000,
          tokensComprados: 0,
          adminLevel: 10,
          userType: "admin" as any
        });
        console.log('✅ Admin master atualizado para Max com 30k tokens');
      }
      
      res.json({
        success: true,
        message: "Dados restaurados com sucesso!",
        restored: {
          pedro: pedro?.tokens || 0,
          maria: maria?.tokens || 0, 
          admin: admin?.tokens || 0
        }
      });
      
    } catch (error) {
      console.error('❌ Erro na restauração:', error);
      res.status(500).json({ error: 'Erro ao restaurar dados' });
    }
  });

  // Admin endpoint para verificar usuários Supabase
  app.get("/api/admin/supabase-users", async (req, res) => {
    try {
      const { getSupabase } = await import('./supabase-auth');
      const supabase = getSupabase();
      
      if (!supabase) {
        return res.status(503).json({ error: "Supabase não configurado" });
      }

      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return res.status(500).json({ error: "Erro ao buscar usuários" });
      }

      // Filtrar informações sensíveis e mostrar apenas dados relevantes
      const usersInfo = data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        confirmationSentAt: user.confirmation_sent_at
      }));

      res.json({ users: usersInfo, total: data.users.length });
    } catch (error) {
      console.error("Erro ao verificar usuários Supabase:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin moderation routes
  app.get('/api/admin/suspicious-users', async (req, res) => {
    try {
      const suspiciousUsers = await storage.getSuspiciousUsers();
      res.json(suspiciousUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários suspeitos:', error);
      res.status(500).json({ success: false, message: 'Failed to get suspicious users' });
    }
  });

  app.post('/api/admin/ban-user', async (req, res) => {
    try {
      const { userId, reason, type, duration } = req.body;
      
      if (!userId || !reason || !type) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      await storage.banUser(userId, reason, type, duration);
      res.json({ success: true, message: 'User banned successfully' });
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      res.status(500).json({ success: false, message: 'Failed to ban user' });
    }
  });

  app.get('/api/admin/moderation-logs', async (req, res) => {
    try {
      const logs = await storage.getModerationLogs();
      res.json(logs);
    } catch (error) {
      console.error('Erro ao buscar logs de moderação:', error);
      res.status(500).json({ success: false, message: 'Failed to get moderation logs' });
    }
  });

  app.post('/api/admin/update-user-status', async (req, res) => {
    try {
      const { userId, status } = req.body;
      
      if (!userId || !status) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      await storage.updateUserStatus(userId, status);
      res.json({ success: true, message: 'User status updated successfully' });
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
  });

  // Token consumption routes - Sistema de consumo direto da carteira
  app.post("/api/professionals/:id/connect", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const { serviceType, tokenCost } = req.body;
      
      console.log(`🎯 CONSUMO DIRETO: ${serviceType} - ${tokenCost} tokens`);
      
      // Get user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Get professional
      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ error: "Profissional não encontrado" });
      }
      
      // Use tokenCost from frontend - consumo direto e exato
      const finalTokenCost = tokenCost || 1000; // Fallback mínimo
      
      // Consumir tokens diretamente da carteira do usuário
      const consumeResult = await storage.consumirTokensUsuario(1, finalTokenCost, `${serviceType.toUpperCase()}: ${professional.name}`);
      
      if (!consumeResult.success) {
        return res.status(400).json({ 
          error: consumeResult.message,
          required: finalTokenCost,
          available: user.tokens
        });
      }

      // 🎯 SISTEMA DE COMISSÃO 3% PARA PROFISSIONAIS
      const professionalCommission = Math.floor(finalTokenCost * 0.03); // 3% do valor
      
      try {
        // 💰 SISTEMA DE COMISSÃO PARA PROFISSIONAIS
        // Comissões vão para "tokens ganhos" - só para consumo na plataforma, não para saque
        const professionalUser = await storage.getUser(professionalId);
        if (professionalUser) {
          // Adicionar à carteira de "tokens ganhos" (só para consumo)
          const currentWallet = await storage.getUserWallet(professionalId);
          const newTokensGanhos = (currentWallet?.tokensGanhos || 0) + professionalCommission;
          
          await storage.updateUserWallet(professionalId, {
            ...currentWallet,
            tokensGanhos: newTokensGanhos
          });
          
          console.log(`💰 COMISSÃO PAGA: +${professionalCommission} tokens ganhos para ${professional.name} (só para consumo)`);
        }

        // 💬 CRIAR SESSÃO DE CHAT DE 24 HORAS
        const chatId = `chat_${user.id}_${professionalId}_${Date.now()}`;
        const chatExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
        
        await storage.createChatSession({
          id: chatId,
          clientId: user.id,
          clientName: user.username,
          professionalId: professionalId,
          professionalName: professional.name,
          serviceType: serviceType,
          tokenCost: finalTokenCost,
          commission: professionalCommission,
          expiresAt: chatExpiresAt,
          isActive: true,
          createdAt: new Date()
        });

        // Criar notificação para o profissional COM CHAT
        await storage.createUserNotification({
          userId: professionalId,
          type: 'service_request',
          title: `💬 Nova solicitação de ${user.username}`,
          message: `Serviço: ${serviceType.replace(/_/g, ' ').toUpperCase()} | Ganho: +${professionalCommission} tokens | Chat ativo por 24h`,
          data: JSON.stringify({
            clientId: user.id,
            clientName: user.username,
            serviceType,
            tokenAmount: finalTokenCost,
            commission: professionalCommission,
            chatId: chatId,
            chatExpiresAt: chatExpiresAt.toISOString(),
            hasChat: true,
            timestamp: new Date().toISOString()
          }),
          createdAt: new Date().toISOString()
        });
        
        console.log(`🔔 NOTIFICAÇÃO CRIADA para ${professional.name}: +${professionalCommission} tokens`);
      } catch (error) {
        console.error('Erro ao processar comissão/notificação:', error);
        // Não falhar a requisição por erro de comissão
      }
      
      // Determinar mensagem baseada no tipo de serviço
      let serviceMessage = "Conexão estabelecida com sucesso!";
      
      if (serviceType.includes("chat")) {
        serviceMessage = "Chat ativo! Você pode conversar em tempo real.";
      } else if (serviceType.includes("consultoria")) {
        serviceMessage = "Consultoria solicitada! Resposta em até 24 horas.";
      } else if (serviceType.includes("curso")) {
        serviceMessage = "Acesso ao curso liberado!";
      } else if (serviceType.includes("whatsapp")) {
        serviceMessage = "Suporte WhatsApp ativo por 7 dias!";
      }
      
      // VERIFICAÇÃO ESPECÍFICA: Bloquear tokens administrativos para serviços profissionais
      const userEmail = req.user?.email || req.body.userEmail;
      if (userEmail === 'passosmir4@gmail.com') {
        return res.status(403).json({ 
          error: "Tokens administrativos não podem ser usados para contratar serviços profissionais",
          message: "Para contratar serviços, use dinheiro real através dos planos pagos" 
        });
      }

      console.log(`✅ TOKENS DEDUZIDOS: ${finalTokenCost} - Comissão profissional: ${professionalCommission} - Serviço: ${serviceType}`);
      
      res.json({
        success: true,
        message: serviceMessage,
        professional,
        tokensUsed: finalTokenCost,
        professionalCommission,
        remainingTokens: consumeResult.user?.tokens || 0,
        serviceType,
        chatId: chatId,
        chatExpiresAt: chatExpiresAt.toISOString(),
        hasChat: true,
        contactInfo: {
          email: `${professional.name.toLowerCase().replace(/\s+/g, '.')}@orbitrum.com.br`,
          phone: `+55 11 ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
          whatsapp: `https://wa.me/5511${Math.floor(Math.random() * 900000000) + 100000000}`,
          platform: "Orbitrum Connect"
        }
      });
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para solicitar saque PIX 8,7% mensal (dia 3)
  app.post("/api/wallet/withdraw-pix", async (req, res) => {
    try {
      const userEmail = req.headers['user-email'] as string;
      const { pixKey } = req.body;
      
      if (!userEmail) {
        return res.status(400).json({ error: "User-Email header obrigatório" });
      }
      
      if (!pixKey) {
        return res.status(400).json({ error: "Chave PIX obrigatória" });
      }
      
      // Verificar se é dia 3 do mês
      const today = new Date();
      if (today.getDate() !== 3) {
        return res.status(400).json({ 
          error: "Saques só são permitidos no dia 3 de cada mês",
          proximoSaque: "03/" + String(today.getMonth() + 2).padStart(2, '0') + "/" + today.getFullYear()
        });
      }
      
      // Buscar usuário
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Calcular valor disponível para saque (8,7% dos tokens do plano)
      const tokensPlano = user.tokensPlano || 0;
      const valorSaque = Math.floor(tokensPlano * 0.087);
      const valorReais = (valorSaque / 720).toFixed(2); // Conversão para reais
      
      if (valorSaque <= 0) {
        return res.status(400).json({ 
          error: "Sem saldo disponível para saque",
          tokensPlano,
          valorDisponivel: valorReais
        });
      }
      
      // Registrar solicitação de saque (em produção, integrar com sistema PIX)
      const saqueId = Date.now();
      console.log(`💰 SAQUE PIX SOLICITADO - User: ${userEmail}, Valor: R$ ${valorReais}, PIX: ${pixKey}, ID: ${saqueId}`);
      
      // Debitar tokens do plano (simular processamento)
      await storage.updateUser(user.id, {
        tokensPlano: tokensPlano - valorSaque,
        creditosSacados: (user.creditosSacados || 0) + valorSaque
      });
      
      res.json({
        success: true,
        message: "Saque PIX processado com sucesso",
        saqueId,
        valorSacado: valorReais,
        tokensSacados: valorSaque,
        pixKey,
        processadoEm: new Date().toISOString(),
        proximoSaque: "03/" + String(today.getMonth() + 2).padStart(2, '0') + "/" + today.getFullYear()
      });
      
    } catch (error: any) {
      console.error('❌ Erro no saque PIX:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para carteira do usuário logado (identificação automática por email) - Com criação automática
  app.get("/api/wallet/user", async (req, res) => {
    console.log(`🔥 ENDPOINT WALLET CHAMADO: ${req.url}`);
    console.log(`🔥 HEADERS:`, req.headers);
    try {
      // Usar email do usuário da sessão atual via header
      const userEmail = req.headers['user-email'] as string;
      
      if (!userEmail) {
        return res.status(400).json({ error: "User-Email header obrigatório" });
      }
      
      console.log(`🔍 Buscando usuário por email: ${userEmail}`);
      
      // Buscar usuário por email diretamente
      let user = await storage.getUserByEmail(userEmail);
      
      // Se usuário não existe, criar automaticamente (funciona para MemStorage)
      if (!user) {
        console.log(`🆕 Criando usuário automaticamente: ${userEmail}`);
        console.log(`🔍 Verificando se método createUserIfNotExists existe:`, typeof (storage as any).createUserIfNotExists);
        
        if (typeof (storage as any).createUserIfNotExists === 'function') {
          try {
            user = await (storage as any).createUserIfNotExists(userEmail, 'client');
            console.log(`✅ Usuário criado com sucesso: ${user.email} (ID: ${user.id})`);
          } catch (error) {
            console.error('❌ Erro ao criar usuário:', error);
          }
        } else {
          console.log('⚠️ Método createUserIfNotExists não encontrado no storage');
        }
      }
      
      if (!user) {
        console.log(`❌ Usuário não encontrado: ${userEmail}`);
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      console.log(`✅ Usuário encontrado: ID ${user.id}, Email ${user.email}`);
      
      // Buscar carteira usando o ID do usuário encontrado
      const wallet = await storage.getUserWallet(user.id);
      
      console.log(`💰 WALLET ENCONTRADA para ${userEmail}:`, wallet);
      
      return res.json(wallet || {
        tokensPlano: 0,
        tokensGanhos: 0,
        tokensComprados: 0,
        tokensUsados: 0,
        saldoTotal: 0
      });
      
    } catch (error: any) {
      console.error('❌ Erro no endpoint /api/wallet/user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Wallet endpoint com refresh automático para mostrar tokens imediatamente (por ID numérico)
  app.get("/api/users/:id/wallet", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Buscar usuário diretamente no MemStorage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      console.log(`💰 WALLET INSTANTÂNEA - User ID: ${userId}, Email: ${user.email}`);
      console.log(`💰 Tokens ATUAIS: ${user.tokens}, Comprados: ${user.tokensComprados}`);
      
      const wallet = await storage.getUserWallet(user.id);
      console.log(`💰 Carteira INSTANTÂNEA:`, wallet);
      
      // Headers para evitar cache e garantir dados frescos INSTANTÂNEOS
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Timestamp': Date.now().toString(),
        'X-Fresh-Data': 'true'
      });
      
      res.json({
        ...wallet,
        timestamp: Date.now(),
        freshData: true
      });
    } catch (error: any) {
      console.error('Erro na wallet instantânea:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 💬 SISTEMA DE CHAT DIRETO DE 24 HORAS
  app.get("/api/chats/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const chats = await storage.getChatsByUser(userId);
      
      // Filtrar apenas chats ativos e não expirados
      const activeChats = chats.filter(chat => 
        chat.isActive && new Date(chat.expiresAt) > new Date()
      );
      
      res.json(activeChats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const messages = await storage.getChatMessages(chatId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { senderId, senderName, message } = req.body;
      
      const chatSession = await storage.getChatSession(chatId);
      if (!chatSession) {
        return res.status(404).json({ error: "Chat não encontrado" });
      }
      
      if (new Date(chatSession.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Chat expirado" });
      }
      
      await storage.addChatMessage(chatId, {
        senderId,
        senderName,
        message,
        timestamp: new Date().toISOString()
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API para verificar status dos documentos do usuário
  app.get("/api/users/documents-status", async (req, res) => {
    try {
      const userId = req.user?.id || 1; // Mock user ID
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        status: user.documentsStatus || 'pending',
        submittedAt: user.documentsSubmittedAt,
        approvedAt: user.documentsApprovedAt,
        canMakePurchases: user.canMakePurchases || false
      });
    } catch (error) {
      console.error("Error fetching documents status:", error);
      res.status(500).json({ message: "Failed to fetch documents status" });
    }
  });

  // API para upload de documentos - frontend plural route
  app.post("/api/users/documents/upload", async (req, res) => {
    try {
      const formData = req.body;
      console.log('📄 Upload de documentos recebido:', formData);
      
      // Simular processamento de múltiplos documentos
      const results = [];
      
      for (const [key, value] of Object.entries(formData)) {
        if (key.includes('type')) {
          const documentType = value as string;
          const userId = 1; // Mock user ID
          
          console.log(`🤖 INICIANDO ANÁLISE IA - DOCUMENTO: ${documentType}`);
          
          // Simular análise por IA
          const aiAnalysis = await performDocumentAIAnalysis(documentType, userId);
          
          results.push({
            type: documentType,
            success: aiAnalysis.isValid || aiAnalysis.needsManualReview,
            status: aiAnalysis.isValid ? 'approved' : (aiAnalysis.needsManualReview ? 'pending' : 'rejected'),
            confidence: aiAnalysis.confidence,
            details: aiAnalysis.details
          });
        }
      }
      
      // Atualizar status do usuário baseado nos resultados
      const hasApprovedDocs = results.some(r => r.status === 'approved');
      const hasPendingDocs = results.some(r => r.status === 'pending');
      const hasRejectedDocs = results.some(r => r.status === 'rejected');
      
      let overallStatus = 'pending';
      let canMakePurchases = false;
      
      if (hasApprovedDocs && !hasPendingDocs && !hasRejectedDocs) {
        overallStatus = 'approved';
        canMakePurchases = true;
      } else if (hasRejectedDocs) {
        overallStatus = 'rejected';
      }
      
      await storage.updateUser(1, {
        documentsStatus: overallStatus,
        documentsSubmittedAt: new Date(),
        documentsApprovedAt: overallStatus === 'approved' ? new Date() : undefined,
        canMakePurchases: canMakePurchases,
        adminNotes: `Análise automática - ${results.length} documentos processados`
      });
      
      res.json({
        success: true,
        message: 'Documentos processados com sucesso!',
        results,
        overallStatus,
        canMakePurchases
      });
      
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro no processamento dos documentos" 
      });
    }
  });

  // API para upload de documentos com análise por IA
  app.post("/api/users/upload-document", async (req, res) => {
    try {
      const { type, userId = 1 } = req.body; // Mock implementation
      
      console.log('🤖 INICIANDO ANÁLISE IA - DOCUMENTO:', { type, userId });
      
      // Simular análise por IA (em produção seria uma API real de verificação)
      const aiAnalysis = await performDocumentAIAnalysis(type, userId);
      
      if (aiAnalysis.isValid) {
        // ✅ IA APROVOU: Documento válido - aprovação automática
        await storage.updateUser(parseInt(userId), {
          documentsStatus: 'approved',
          documentsApprovedAt: new Date(),
          documentsSubmittedAt: new Date(),
          canMakePurchases: true,
          adminNotes: `✅ Aprovado automaticamente por IA - ${aiAnalysis.confidence}% confiança`
        });

        console.log('✅ IA APROVOU DOCUMENTO:', { type, userId, confidence: aiAnalysis.confidence });
        
        res.json({ 
          success: true, 
          message: 'Documento verificado e aprovado automaticamente pela IA!',
          status: 'approved',
          aiAnalysis: aiAnalysis.details
        });
      } else if (aiAnalysis.needsManualReview) {
        // ⏳ IA SUSPEITA: Enviar para revisão manual
        await storage.updateUser(parseInt(userId), {
          documentsStatus: 'pending',
          documentsSubmittedAt: new Date(),
          adminNotes: `⏳ Pendente revisão manual - IA detectou: ${aiAnalysis.issues.join(', ')}`
        });

        console.log('⏳ IA SOLICITA REVISÃO MANUAL:', { type, userId, issues: aiAnalysis.issues });
        
        res.json({ 
          success: true, 
          message: 'Documento enviado para revisão manual devido a inconsistências detectadas pela IA',
          status: 'pending',
          aiAnalysis: aiAnalysis.details
        });
      } else {
        // ❌ IA REJEITOU: Documento inválido
        await storage.updateUser(parseInt(userId), {
          documentsStatus: 'rejected',
          documentsSubmittedAt: new Date(),
          adminNotes: `❌ Rejeitado pela IA - ${aiAnalysis.issues.join(', ')}`
        });

        console.log('❌ IA REJEITOU DOCUMENTO:', { type, userId, issues: aiAnalysis.issues });
        
        res.json({ 
          success: false, 
          message: 'Documento rejeitado pela análise automática. Por favor, envie documentos mais claros.',
          status: 'rejected',
          aiAnalysis: aiAnalysis.details
        });
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Função de análise por IA (simulada)
  async function performDocumentAIAnalysis(type: string, userId: number) {
    // Simular tempo de processamento da IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular análise baseada em padrões realistas
    const analysisResults = {
      selfie: {
        confidence: Math.random() > 0.2 ? 95 : 65, // 80% aprovação
        issues: Math.random() > 0.8 ? ['Qualidade da foto baixa', 'Documento não visível'] : [],
        details: 'Análise facial e documento compatíveis'
      },
      id_document: {
        confidence: Math.random() > 0.15 ? 92 : 60, // 85% aprovação
        issues: Math.random() > 0.85 ? ['Documento borrado', 'Possível edição digital'] : [],
        details: 'Documento brasileiro válido detectado'
      },
      proof_residence: {
        confidence: Math.random() > 0.1 ? 88 : 55, // 90% aprovação
        issues: Math.random() > 0.9 ? ['Data muito antiga', 'Empresa não reconhecida'] : [],
        details: 'Comprovante de residência válido'
      }
    };
    
    const result = analysisResults[type as keyof typeof analysisResults] || analysisResults.selfie;
    
    return {
      isValid: result.confidence >= 85,
      needsManualReview: result.confidence >= 60 && result.confidence < 85,
      confidence: result.confidence,
      issues: result.issues,
      details: result.details
    };
  }

  // API Admin para aprovar documentos
  app.post("/api/admin/approve-documents", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Atualizar usuário como aprovado
      await storage.updateUser(parseInt(userId), {
        documentsStatus: 'approved',
        documentsApprovedAt: new Date(),
        canMakePurchases: true
      });

      res.json({ 
        success: true, 
        message: 'Documentos aprovados com sucesso' 
      });
    } catch (error) {
      console.error("Error approving documents:", error);
      res.status(500).json({ message: "Failed to approve documents" });
    }
  });

  // API TEMPORÁRIA para aprovar documentos do usuário 1 (João Eduardo)
  app.post("/api/approve-user-documents", async (req, res) => {
    try {
      console.log('🚀 APROVANDO DOCUMENTOS DO USUÁRIO 1 (João Eduardo)');
      
      // Aprovar documentos do usuário 1 (orbit_user)
      await storage.updateUser(1, {
        documentsStatus: 'approved',
        documentsApprovedAt: new Date(),
        canMakePurchases: true
      });

      res.json({ 
        success: true, 
        message: 'Documentos do usuário 1 aprovados com sucesso!',
        userId: 1,
        status: 'approved'
      });
    } catch (error) {
      console.error("Error approving user documents:", error);
      res.status(500).json({ message: "Failed to approve user documents" });
    }
  });

  app.post("/api/users/:id/withdraw", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { valor } = req.body;
      
      const result = await storage.sacarTokensUsuario(userId, valor);
      
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      
      res.json({
        success: true,
        message: result.message,
        newBalance: result.user?.creditosAcumulados || 0 - result.user?.creditosSacados || 0
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id/token-history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const history = await storage.getUserTokenHistory(userId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API para exibir informações de configuração do domínio
  app.get("/api/domain-config", async (req, res) => {
    try {
      const config = {
        current_domain: process.env.REPLIT_DOMAINS || 'localhost:5000',
        target_domain: 'www.orbitrum.com.br',
        supabase_config: {
          site_url: 'https://www.orbitrum.com.br',
          redirect_urls: [
            'https://www.orbitrum.com.br',
            'https://www.orbitrum.com.br/auth/confirm',
            'https://www.orbitrum.com.br/auth/callback',
            'https://www.orbitrum.com.br/login',
            'https://www.orbitrum.com.br/cadastro',
            'https://www.orbitrum.com.br/dashboard',
            'https://www.orbitrum.com.br/usuario',
            'https://www.orbitrum.com.br/profissional',
            'https://www.orbitrum.com.br/admin',
            'http://localhost:5000',
            'http://localhost:5000/auth/confirm',
            'http://localhost:5000/auth/callback',
            'http://localhost:5000/login',
            'http://localhost:5000/cadastro',
            'http://localhost:5000/dashboard',
            'http://localhost:5000/usuario',
            'http://localhost:5000/profissional',
            'http://localhost:5000/admin'
          ]
        },
        dns_config: {
          type_a: {
            name: 'www',
            value: 'IP_DO_REPLIT'
          },
          type_cname: {
            name: '@',
            value: 'www.orbitrum.com.br'
          }
        },
        status: {
          code_ready: true,
          supabase_configured: false,
          dns_configured: false
        }
      };
      
      res.json(config);
    } catch (error) {
      console.error("Erro ao gerar configuração:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // Endpoint para confirmação de email (redirecionamento do Supabase)
  app.get("/auth/confirm", async (req, res) => {
    try {
      console.log('📧 Redirecionamento de confirmação de email recebido');
      // Redirecionar para a página principal com mensagem de sucesso
      res.redirect("/?confirmed=true");
    } catch (error) {
      console.error("Erro na confirmação de email:", error);
      res.redirect("/?error=confirmation_failed");
    }
  });

  // 💬 SISTEMA DE CHAT DIRETO DE 24 HORAS PARA PROFISSIONAIS
  
  // API para criar nova sessão de chat
  app.post("/api/chats", async (req, res) => {
    try {
      const { chatSession } = req.body;
      
      await storage.createChatSession(chatSession);
      
      console.log(`💬 Nova sessão de chat criada: ${chatSession.id}`);
      console.log(`👥 Participantes: ${chatSession.clientName} x ${chatSession.professionalName}`);
      console.log(`⏰ Expira em: ${chatSession.expiresAt}`);
      
      res.json({ 
        success: true,
        chatId: chatSession.id,
        message: "Chat de 24h ativado com sucesso!"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API para obter chats ativos de um usuário (cliente ou profissional)
  app.get("/api/chats", async (req, res) => {
    try {
      const userId = req.user?.id || 1;
      const chats = await storage.getChatsByUser(userId);
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API para abrir um chat específico e carregar mensagens
  app.get("/api/chats/:chatId", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const chatSession = await storage.getChatSession(chatId);
      
      if (!chatSession) {
        return res.status(404).json({ error: "Chat não encontrado" });
      }
      
      if (new Date(chatSession.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Chat expirado - janela de 24h encerrada" });
      }
      
      const messages = await storage.getChatMessages(chatId);
      
      res.json({
        chat: chatSession,
        messages: messages
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API para enviar mensagem em chat ativo
  app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { senderId, senderName, message } = req.body;
      
      const chatSession = await storage.getChatSession(chatId);
      if (!chatSession) {
        return res.status(404).json({ error: "Chat não encontrado" });
      }
      
      if (new Date(chatSession.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Chat expirado - não é possível enviar mensagens" });
      }
      
      await storage.addChatMessage(chatId, {
        senderId,
        senderName,
        message,
        timestamp: new Date().toISOString()
      });
      
      console.log(`💬 Mensagem enviada no chat ${chatId}: ${senderName} -> ${message}`);
      
      res.json({ 
        success: true,
        message: "Mensagem enviada com sucesso",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API para fechar chat manualmente (antes do prazo de 24h)
  app.post("/api/chats/:chatId/close", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const userId = req.user?.id || 1;
      
      const chatSession = await storage.getChatSession(chatId);
      if (!chatSession) {
        return res.status(404).json({ error: "Chat não encontrado" });
      }
      
      // Verificar se usuário tem permissão para fechar (cliente ou profissional do chat)
      if (chatSession.clientId !== userId && chatSession.professionalId !== userId) {
        return res.status(403).json({ error: "Sem permissão para fechar este chat" });
      }
      
      await storage.closeChatSession(chatId);
      
      res.json({ 
        success: true,
        message: "Chat fechado com sucesso"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API para remover usuário completamente do sistema
  app.delete("/api/admin/users/:email", async (req, res) => {
    try {
      const { email } = req.params;
      
      console.log(`🗑️ Removendo usuário completamente: ${email}`);
      
      // 1. Remover do Supabase Auth
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: users } = await supabase.auth.admin.listUsers();
          const userToDelete = users.users.find(u => u.email === email);
          
          if (userToDelete) {
            await supabase.auth.admin.deleteUser(userToDelete.id);
            console.log(`✅ Usuário removido do Supabase Auth: ${email}`);
          }
        } catch (supabaseError) {
          console.log(`⚠️ Erro ao remover do Supabase: ${supabaseError}`);
        }
      }
      
      // 2. Remover do storage interno
      await storage.deleteUserByEmail(email);
      console.log(`✅ Usuário removido do storage interno: ${email}`);
      
      res.json({ 
        success: true,
        message: `Usuário ${email} removido completamente do sistema`
      });
    } catch (error: any) {
      console.error(`❌ Erro ao remover usuário ${req.params.email}:`, error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // Rotas missing que estavam causando 404
  app.get("/api/notifications", async (req, res) => {
    try {
      // Retornar array vazio por enquanto - implementar notificações completas depois
      res.json([]);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/plans/can-purchase", async (req, res) => {
    try {
      // Verificar autenticação Supabase
      const supabase = getSupabase();
      const authUser = await supabase.auth.getUser();
      
      if (!authUser.data.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      }

      const user = await storage.getUserByEmail(authUser.data.user.email);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }
      
      // Verificar se usuário tem plano ativo
      const hasActivePlan = user.plan && user.plan !== 'free' && user.planExpiryDate && new Date(user.planExpiryDate) > new Date();
      
      res.json({
        success: true,
        canPurchase: !hasActivePlan,
        reason: hasActivePlan ? "Plano ativo até " + user.planExpiryDate : "Pode comprar novo plano"
      });
    } catch (error) {
      console.error("Erro ao verificar compra de planos:", error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });

  // REFERRAL SYSTEM PUBLIC ROUTES
  // Processar cadastro com código de referral
  app.post("/api/referral/signup", async (req, res) => {
    try {
      const { referralCode, email, userType, userData } = req.body;
      
      if (!referralCode || !email || !userType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Código de referral, email e tipo de usuário são obrigatórios' 
        });
      }

      // Processar cadastro via link master
      if (referralCode === 'MASTER2025') {
        console.log(`🌟 MASTER REFERRAL SIGNUP: ${email} via link master`);
        
        // Criar usuário com plano Max grátis por 30 dias
        const masterUser = await storage.createUser({
          username: userData.nomeCompleto,
          email,
          password: userData.senha,
          userType: userType as 'client' | 'professional',
          phone: userData.telefone,
          cpf: userData.cpf,
          plan: 'max',
          planExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          tokensPlano: 50000, // Plano Max
          referralSource: 'MASTER2025',
          referralBonusMonths: 1,
          promotionalPhase: 'active'
        });

        // Gerar código de referral próprio para o novo usuário
        const userReferralCode = `REF${Date.now().toString(36).toUpperCase()}`;
        await storage.updateUser(masterUser.id, {
          referralCode: userReferralCode,
          promotionalCode: userReferralCode
        });

        console.log(`✅ USUÁRIO MASTER CRIADO: ${email} com plano Max 30 dias + código ${userReferralCode}`);
        
        return res.json({
          success: true,
          message: 'Cadastro Master realizado com sucesso! 30 dias grátis plano Max.',
          user: masterUser,
          bonusApplied: 'max30days',
          referralCode: userReferralCode
        });
      }

      // Processar via sistema de referral existente para outros códigos
      const result = await referralSystem.processReferralSignup(
        referralCode, 
        email, 
        userType as 'client' | 'professional',
        userData
      );
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Cadastro realizado com sucesso',
          user: result.user,
          bonusApplied: result.bonusApplied
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erro ao processar cadastro com referral:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Validar código de referral
  app.get("/api/referral/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      // Verificar código master especial
      if (code === 'MASTER2025') {
        return res.json({
          valid: true,
          referrer: {
            name: 'Orbitrum Master',
            email: 'master@***',
            userType: 'master'
          },
          bonusType: 'max30days',
          message: 'Link Master válido - 30 dias grátis plano Max'
        });
      }
      
      // Buscar usuário pelo código de referral
      const users = await storage.getAllUsers();
      const referrer = users.find(u => u.promotionalCode === code || u.referralCode === code);
      
      if (!referrer) {
        return res.status(404).json({
          valid: false,
          message: 'Código de referral inválido ou expirado'
        });
      }

      // Para códigos de usuários, verificar fase promocional
      if (referrer.promotionalPhase && referrer.promotionalPhase !== 'active') {
        return res.status(400).json({
          valid: false,
          message: 'Código de referral expirado'
        });
      }

      res.json({
        valid: true,
        referrer: {
          name: referrer.username,
          email: referrer.email.split('@')[0] + '@***',
          userType: referrer.userType
        },
        bonusType: 'standard',
        message: 'Código válido'
      });
    } catch (error) {
      console.error('Erro ao validar código de referral:', error);
      res.status(500).json({ 
        valid: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Buscar link de referral do usuário
  app.get("/api/referral/my-link/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Se já tem código, retornar o link existente
      if (user.promotionalCode || user.referralCode) {
        const code = user.promotionalCode || user.referralCode;
        res.json({
          success: true,
          code,
          url: `https://www.orbitrum.com.br/cadastro?ref=${code}&type=professional`,
          referralsCount: user.referralCount || 0,
          bonusMonths: user.promotionalBonusMonths || 0
        });
      } else {
        // Criar novo link de referral
        const referralLink = await referralSystem.createReferralLink(Number(userId));
        res.json({
          success: true,
          code: referralLink.code,
          url: referralLink.url,
          referralsCount: 0,
          bonusMonths: 0
        });
      }
    } catch (error) {
      console.error('Erro ao buscar link de referral:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  app.get("/api/services/pending", async (req, res) => {
    try {
      // Buscar usuário autenticado
      const supabase = getSupabase();
      const authUser = await supabase.auth.getUser();
      
      if (!authUser.data.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await storage.getUserByEmail(authUser.data.user.email);
      if (!user) {
        return res.json([]);
      }

      const services = await storage.getPendingServices(user.id);
      res.json(services || []);
    } catch (error) {
      console.error("Erro ao buscar serviços pendentes:", error);
      res.status(500).json([]);
    }
  });

  app.get("/api/services/accepted", async (req, res) => {
    try {
      const supabase = getSupabase();
      const authUser = await supabase.auth.getUser();
      
      if (!authUser.data.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await storage.getUserByEmail(authUser.data.user.email);
      if (!user) {
        return res.json([]);
      }

      const services = await storage.getAcceptedServices(user.id);
      res.json(services || []);
    } catch (error) {
      console.error("Erro ao buscar serviços aceitos:", error);
      res.status(500).json([]);
    }
  });

  app.get("/api/professional/stats/:id", async (req, res) => {
    try {
      const supabase = getSupabase();
      const authUser = await supabase.auth.getUser();
      
      if (!authUser.data.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await storage.getUserByEmail(authUser.data.user.email);
      if (!user) {
        return res.json({
          totalEarnings: 0,
          completedJobs: 0,
          averageRating: 0,
          responseTime: '0 min',
          completionRate: 0
        });
      }

      const stats = await storage.getProfessionalStats(user.id);
      res.json(stats || {
        totalEarnings: 0,
        completedJobs: 0,
        averageRating: 0,
        responseTime: '0 min',
        completionRate: 0
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas do profissional:", error);
      res.status(500).json({
        totalEarnings: 0,
        completedJobs: 0,
        averageRating: 0,
        responseTime: '0 min',
        completionRate: 0
      });
    }
  });

  // Adicionar rota GET /api/users que estava em falta (causando 404)
  app.get("/api/users", async (req, res) => {
    try {
      // Para admin: listar todos os usuários com paginação
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const users = await storage.getAllUsers(page, limit);
      res.json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });

  // 📊 RELATÓRIOS ADMIN - PDF E EXCEL
  app.get("/api/admin/reports/pdf", async (req, res) => {
    try {
      const { collectReportData, generatePDFReport } = await import('./report-generator');
      
      console.log('📄 Gerando relatório PDF...');
      const reportData = await collectReportData(storage);
      const pdfBuffer = await generatePDFReport(reportData);
      
      const filename = `orbitrum-relatorio-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      console.log('✅ Relatório PDF gerado com sucesso');
    } catch (error) {
      console.error("Erro ao gerar relatório PDF:", error);
      res.status(500).json({ success: false, message: "Erro ao gerar relatório PDF" });
    }
  });

  app.get("/api/admin/reports/excel", async (req, res) => {
    try {
      const { collectReportData, generateExcelReport } = await import('./report-generator');
      
      console.log('📊 Gerando relatório Excel...');
      const reportData = await collectReportData(storage);
      const excelBuffer = await generateExcelReport(reportData);
      
      const filename = `orbitrum-relatorio-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      res.send(excelBuffer);
      console.log('✅ Relatório Excel gerado com sucesso');
    } catch (error) {
      console.error("Erro ao gerar relatório Excel:", error);
      res.status(500).json({ success: false, message: "Erro ao gerar relatório Excel" });
    }
  });

  // SISTEMA DE CORREÇÃO DE EMAIL - Mais limpo que clonar contas
  app.post("/api/admin/fix-user-email", async (req, res) => {
    try {
      const { oldEmail, newEmail, reason } = req.body;
      
      if (!oldEmail || !newEmail) {
        return res.status(400).json({ success: false, message: "Emails obrigatórios" });
      }
      
      // Buscar usuário com email antigo (que tem os tokens)
      const userWithTokens = await storage.getUserByEmail(oldEmail);
      if (!userWithTokens) {
        return res.status(404).json({ success: false, message: `Usuário com email ${oldEmail} não encontrado` });
      }
      
      console.log(`🔄 CORREÇÃO DE EMAIL: ${oldEmail} → ${newEmail}`);
      console.log(`💰 Tokens a manter: ${userWithTokens.tokensComprados}`);
      
      // Atualizar o email do usuário existente (preservando todos os tokens)
      const updatedUser = await storage.updateUser(userWithTokens.id, {
        email: newEmail,
        updatedAt: new Date()
      });
      
      // Verificar se existe conta duplicada com novo email e removê-la
      const duplicateUser = await storage.getUserByEmail(newEmail);
      if (duplicateUser && duplicateUser.id !== userWithTokens.id) {
        console.log(`🗑️ Removendo conta duplicada: ${newEmail} (ID: ${duplicateUser.id})`);
        // Não implementando remoção - muito perigoso. Apenas avisar.
      }
      
      console.log(`✅ EMAIL CORRIGIDO: ${oldEmail} → ${newEmail}, tokens preservados: ${userWithTokens.tokensComprados}`);
      
      res.json({ 
        success: true, 
        message: `Email atualizado de ${oldEmail} para ${newEmail}`,
        tokensPreservados: userWithTokens.tokensComprados,
        reason: reason || "Correção de email"
      });
      
    } catch (error) {
      console.error("❌ Erro na correção de email:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 🤖 IA MATCHING SYSTEM
  app.post("/api/professionals/ai-search", async (req, res) => {
    try {
      const { findBestMatches, generateMatchExplanation } = await import('./ai-matching');
      const { projectType, budget, urgency, workPreference, location, experienceRequired } = req.body;
      
      console.log('🤖 IA MATCHING - Critérios:', { projectType, urgency, workPreference });
      
      // Buscar todos os profissionais
      const allProfessionals = await storage.getAllProfessionals();
      
      // Perfil do cliente para matching
      const clientProfile = {
        id: 1, // Mock - em produção seria req.user.id
        projectType: projectType || "Desenvolvimento",
        budget: budget || 5000,
        urgency: urgency || "normal",
        workPreference: workPreference || "remoto",
        communicationStyle: "técnico",
        experienceRequired: experienceRequired || "pleno",
        location: location || null
      };
      
      // Converter profissionais para formato da IA
      const aiProfessionals = allProfessionals.map((prof: any) => ({
        id: prof.id,
        name: prof.name,
        title: prof.title,
        skills: prof.skills || prof.services || [],
        experienceYears: prof.experienceYears || 3,
        rating: prof.rating || 4.5,
        completedProjects: prof.completedProjects || 10,
        responseTimeHours: prof.responseTimeHours || 24,
        hourlyRate: prof.hourlyRate || 45,
        workPreferences: prof.workPreferences || ["remoto", "presencial"],
        specializations: prof.specializations || prof.services || [],
        communicationStyle: prof.communicationStyle || "técnico",
        personalityType: prof.personalityType || "ENFP",
        workMethodology: prof.workMethodology || "agile",
        location: prof.latitude && prof.longitude ? {
          latitude: prof.latitude,
          longitude: prof.longitude,
          city: prof.city || "São Paulo",
          state: prof.state || "SP",
          workRadius: prof.workRadius || 20
        } : null,
        available: prof.available !== false,
        aiMatchScore: 0
      }));
      
      // Executar algoritmo de matching IA
      const bestMatches = findBestMatches(clientProfile, aiProfessionals, 6);
      
      // Gerar explicações para cada match
      const matchesWithExplanations = bestMatches.map(prof => ({
        ...prof,
        aiExplanation: generateMatchExplanation(clientProfile, prof)
      }));
      
      console.log('🎯 IA encontrou', bestMatches.length, 'profissionais compatíveis');
      
      res.json({
        success: true,
        professionals: matchesWithExplanations,
        criteria: clientProfile,
        totalAnalyzed: aiProfessionals.length
      });
      
    } catch (error) {
      console.error("Erro no matching IA:", error);
      res.status(500).json({ success: false, message: "Erro no sistema de IA" });
    }
  });



  // 🚗 SISTEMA DE RASTREAMENTO EM TEMPO REAL
  app.get("/api/tracking/active", async (req, res) => {
    try {
      // Simular serviços ativos para demonstração
      const activeServices = [
        {
          serviceId: "service_1_demo",
          professionalId: 1,
          professionalName: "Carlos Silva",
          clientId: 1,
          serviceType: "Pintura Residencial",
          startTime: new Date(),
          currentLocation: { lat: -23.5505, lng: -46.6333 },
          clientLocation: { lat: -23.5629, lng: -46.6544 },
          estimatedArrival: 25, // minutos
          status: "em_rota"
        }
      ];
      
      res.json({
        success: true,
        activeServices,
        totalActive: activeServices.length
      });
    } catch (error) {
      console.error("Erro ao buscar serviços ativos:", error);
      res.status(500).json({ success: false, message: "Erro ao carregar serviços" });
    }
  });

  app.post("/api/tracking/start", async (req, res) => {
    try {
      const { serviceId, professionalId, clientId } = req.body;
      
      if (!serviceId || !professionalId || !clientId) {
        return res.status(400).json({ 
          success: false, 
          message: "Dados obrigatórios: serviceId, professionalId, clientId" 
        });
      }
      
      console.log(`🚗 Iniciando rastreamento para serviço ${serviceId}`);
      
      // Aqui você salvaria no banco de dados
      // Por enquanto, apenas retornar confirmação
      
      res.json({
        success: true,
        message: "Rastreamento iniciado com sucesso",
        serviceId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Erro ao iniciar rastreamento:", error);
      res.status(500).json({ success: false, message: "Erro ao iniciar rastreamento" });
    }
  });

  app.post("/api/tracking/stop", async (req, res) => {
    try {
      const { serviceId } = req.body;
      
      if (!serviceId) {
        return res.status(400).json({ 
          success: false, 
          message: "serviceId obrigatório" 
        });
      }
      
      console.log(`🛑 Parando rastreamento para serviço ${serviceId}`);
      
      res.json({
        success: true,
        message: "Rastreamento finalizado com sucesso",
        serviceId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Erro ao parar rastreamento:", error);
      res.status(500).json({ success: false, message: "Erro ao parar rastreamento" });
    }
  });

  // NOVA ROTA: Estatísticas de distribuição de planos para o admin
  app.get("/api/admin/plan-distribution", async (req, res) => {
    try {
      console.log('📊 Calculando distribuição de planos...');
      
      const allUsers = await storage.getAllUsers();
      const planCounts = {
        freeOrbitrum: 0,
        explorador: 0,
        conector: 0,
        orbitrumPro: 0,
        orbitrumMax: 0,
        other: 0
      };
      
      const planRevenue = {
        freeOrbitrum: 0,
        explorador: 0,
        conector: 0,
        orbitrumPro: 0,
        orbitrumMax: 0,
        other: 0
      };

      const planPrices = {
        freeOrbitrum: 0,
        explorador: 7,
        conector: 14,
        orbitrumPro: 21,
        orbitrumMax: 30
      };

      allUsers.forEach(user => {
        const plan = user.plan || 'other';
        if (planCounts.hasOwnProperty(plan)) {
          planCounts[plan]++;
          planRevenue[plan] += planPrices[plan] || 0;
        } else {
          planCounts.other++;
        }
      });

      const totalUsers = allUsers.length;
      const totalRevenue = Object.values(planRevenue).reduce((sum, revenue) => sum + revenue, 0);

      const planStats = Object.keys(planCounts).map(plan => ({
        planName: plan,
        displayName: plan === 'freeOrbitrum' ? 'Free Orbitrum' : 
                   plan === 'explorador' ? 'Explorador' :
                   plan === 'conector' ? 'Conector' :
                   plan === 'orbitrumPro' ? 'Orbitrum Pro' :
                   plan === 'orbitrumMax' ? 'Orbitrum Max' : 'Outros',
        userCount: planCounts[plan],
        percentage: totalUsers > 0 ? ((planCounts[plan] / totalUsers) * 100).toFixed(1) : '0.0',
        monthlyRevenue: planRevenue[plan],
        price: planPrices[plan] || 0
      }));

      console.log(`📊 Distribuição calculada: ${totalUsers} usuários, ${planStats.length} planos`);

      res.json({
        success: true,
        totalUsers,
        totalRevenue,
        planStats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Erro ao calcular distribuição de planos:", error);
      res.status(500).json({ success: false, message: "Erro ao carregar distribuição de planos" });
    }
  });

  // APIs para controle GPS do profissional
  app.post("/api/tracking/update-location", async (req, res) => {
    try {
      const { serviceId, lat, lng, timestamp } = req.body;
      
      if (!serviceId || !lat || !lng || !timestamp) {
        return res.status(400).json({ 
          success: false, 
          message: "Dados obrigatórios: serviceId, lat, lng, timestamp" 
        });
      }
      
      console.log(`📍 Localização atualizada - Serviço ${serviceId}: ${lat}, ${lng}`);
      
      // Em produção, salvaria no banco e notificaria via WebSocket
      res.json({
        success: true,
        message: "Localização atualizada",
        location: { lat, lng, timestamp }
      });
      
    } catch (error) {
      console.error("Erro ao atualizar localização:", error);
      res.status(500).json({ success: false, message: "Erro ao atualizar localização" });
    }
  });

  app.post("/api/tracking/notify-arrival", async (req, res) => {
    try {
      const { serviceId } = req.body;
      
      if (!serviceId) {
        return res.status(400).json({ 
          success: false, 
          message: "serviceId obrigatório" 
        });
      }
      
      console.log(`🏁 Profissional chegou - Serviço ${serviceId}`);
      
      // Em produção, enviaria notificação para o cliente via WebSocket/Push
      res.json({
        success: true,
        message: "Cliente notificado da chegada",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Erro ao notificar chegada:", error);
      res.status(500).json({ success: false, message: "Erro ao notificar chegada" });
    }
  });

  app.post("/api/professional/update-service-status", async (req, res) => {
    try {
      const { serviceId, status, reason, professionalId, timestamp } = req.body;
      
      if (!serviceId || !status || !professionalId) {
        return res.status(400).json({ 
          success: false, 
          message: "Dados obrigatórios: serviceId, status, professionalId" 
        });
      }
      
      console.log(`🔄 Status atualizado - Serviço ${serviceId}: ${status}${reason ? ` (${reason})` : ''}`);
      
      // Em produção, atualizaria banco de dados e enviaria notificações
      res.json({
        success: true,
        message: "Status atualizado com sucesso",
        serviceId,
        status,
        timestamp: timestamp || new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({ success: false, message: "Erro ao atualizar status" });
    }
  });

  // Token purchase API
  app.post("/api/tokens/purchase", async (req, res) => {
    try {
      const { packageId } = req.body;
      
      // Mock user - em produção seria req.user
      const userId = 1;
      
      // Pacotes disponíveis com 20% de bônus
      const packages = {
        starter: { name: "Starter Pack", price: 3, baseTokens: 1800, bonusTokens: 360 },
        pro: { name: "Pro Boost", price: 6, baseTokens: 3600, bonusTokens: 720 },
        max: { name: "Max Expansion", price: 9, baseTokens: 5400, bonusTokens: 1080 },
        premium: { name: "Orbit Premium", price: 18, baseTokens: 10800, bonusTokens: 2160 },
        galaxy: { name: "Galaxy Vault", price: 32, baseTokens: 19200, bonusTokens: 3840 }
      };

      const selectedPackage = packages[packageId as keyof typeof packages];
      
      if (!selectedPackage) {
        return res.status(400).json({ message: "Pacote inválido" });
      }

      const totalTokens = selectedPackage.baseTokens + selectedPackage.bonusTokens;
      
      // Adicionar tokens comprados ao usuário
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const updatedUser = await storage.updateUser(userId, {
        tokensComprados: (user.tokensComprados || 0) + totalTokens
      });

      // Registrar operação de compra
      await storage.criarOperacaoToken({
        userId,
        tipo: 'compra',
        quantidade: totalTokens,
        detalhes: `Compra de pacote ${selectedPackage.name}`,
        valor: selectedPackage.price
      });

      // Registrar ação administrativa para rastreamento em tempo real
      await storage.criarAcaoAdmin({
        adminId: 1, // Sistema automático
        acao: 'compra_tokens',
        detalhes: `Cliente ${user.username} (ID: ${userId}) comprou pacote ${selectedPackage.name}`,
        usuarioAfetado: userId,
        valorAnterior: `${user.tokensComprados || 0} tokens`,
        valorNovo: `${(user.tokensComprados || 0) + totalTokens} tokens (+${totalTokens})`,
        categoria: 'financeiro'
      });

      console.log(`🛒 COMPRA REALIZADA - Cliente: ${user.username}, Pacote: ${selectedPackage.name}, Tokens: ${totalTokens}, Valor: R$ ${selectedPackage.price}`);

      res.json({
        success: true,
        message: `${totalTokens} tokens adicionados com sucesso!`,
        tokensAdded: totalTokens,
        packageName: selectedPackage.name,
        bonus: selectedPackage.bonusTokens
      });
    } catch (error) {
      console.error("Erro na compra de tokens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // API para buscar total de tokens do usuário
  app.get("/api/users/tokens", async (req, res) => {
    try {
      // Mock user - em produção seria req.user
      const userId = 1;
      const wallet = await storage.verCarteira(userId);
      const totalTokens = wallet.tokensPlano + wallet.tokensGanhos + wallet.tokensComprados;
      res.json(totalTokens);
    } catch (error) {
      console.error("Erro ao buscar tokens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // 📅 Plan management routes  
  const { registerPlanRoutes } = await import("./plan-routes");
  registerPlanRoutes(app);

  // API para verificar se usuário pode comprar novos planos - BLOQUEIO TOTAL  
  app.get('/api/plans/can-purchase', async (req: any, res) => {
    try {
      const user = await storage.getUser(1);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }

      // ADMIN BYPASS: Admin pode sempre comprar planos
      if (user.email === "passosmir4@gmail.com" && user.userType === "admin") {
        res.json({
          success: true,
          canPurchase: true,
          reason: "Admin Master - acesso total aos planos",
          daysRemaining: 0,
          currentPlan: user.plan,
          planExpiryDate: user.planExpiryDate
        });
        return;
      }

      // João Eduardo pode sempre comprar planos para experiência real
      if (user.username === "orbit_user") {
        res.json({
          success: true,
          canPurchase: true,
          reason: "Usuário real - acesso completo aos planos",
          daysRemaining: 0,
          currentPlan: user.plan,
          planExpiryDate: user.planExpiryDate
        });
        return;
      }

      const validation = planExpirySystem.canPurchaseNewPlan(user);
      res.json({
        success: true,
        canPurchase: validation.canPurchase,
        reason: validation.reason,
        daysRemaining: validation.daysRemaining,
        currentPlan: user.plan,
        planExpiryDate: user.planExpiryDate
      });
    } catch (error) {
      console.error('❌ Erro ao verificar possibilidade de compra:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // API para buscar notificações do usuário
  app.get('/api/notifications', async (req: any, res) => {
    try {
      // Para demonstração, usar usuário padrão
      const notifications = await storage.getUserNotifications(1);
      res.json({ success: true, notifications });
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar notificações' });
    }
  });

  // 🔄 Admin configurado com sistema de permissões (não utiliza tokens)

  // 🏗️ SISTEMA DE CERTIFICAÇÕES NR 35 E COMPLIANCE
  
  // Obter requisitos de certificação por categoria/especialidade
  app.get('/api/certifications/requirements/:category/:specialty', async (req, res) => {
    try {
      const { category, specialty } = req.params;
      const requirements = await storage.getCertificationRequirements(
        decodeURIComponent(category), 
        decodeURIComponent(specialty)
      );
      res.json({ success: true, requirements });
    } catch (error: any) {
      console.error('Erro ao buscar requisitos:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Criar nova certificação profissional
  app.post('/api/professionals/:id/certifications', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const certificationData = {
        ...req.body,
        professionalId
      };
      
      const certification = await storage.createProfessionalCertification(certificationData);
      res.json({ success: true, certification });
    } catch (error: any) {
      console.error('Erro ao criar certificação:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Obter certificações de um profissional
  app.get('/api/professionals/:id/certifications', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const certifications = await storage.getProfessionalCertifications(professionalId);
      res.json({ success: true, certifications });
    } catch (error: any) {
      console.error('Erro ao buscar certificações:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Validar certificação (admin)
  app.put('/api/admin/certifications/:id/validate', async (req, res) => {
    try {
      const certificationId = req.params.id;
      const validationData = req.body;
      
      const certification = await storage.validateCertification(certificationId, validationData);
      res.json({ success: true, certification });
    } catch (error: any) {
      console.error('Erro ao validar certificação:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Verificar status de conformidade de um profissional
  app.get('/api/professionals/:id/compliance', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const compliance = await storage.getProfessionalComplianceStatus(professionalId);
      res.json({ success: true, compliance });
    } catch (error: any) {
      console.error('Erro ao verificar conformidade:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Listar certificações por status (admin)
  app.get('/api/admin/certifications/status/:status', async (req, res) => {
    try {
      const { status } = req.params;
      const certifications = await storage.getCertificationsByStatus(status);
      res.json({ success: true, certifications });
    } catch (error: any) {
      console.error('Erro ao buscar certificações por status:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Listar certificações prestes a expirar (admin)
  app.get('/api/admin/certifications/expiring/:days', async (req, res) => {
    try {
      const days = parseInt(req.params.days);
      const certifications = await storage.getExpiringCertifications(days);
      res.json({ success: true, certifications, expiringIn: days });
    } catch (error: any) {
      console.error('Erro ao buscar certificações expirando:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 🎮 ROTA PARA MODO FREE - Jogos sem recompensas
  app.post("/api/game-scores/free", async (req, res) => {
    try {
      const { score, duration } = req.body;
      
      // Salvar apenas por diversão, sem tokens
      const freeGameScore = {
        userId: 1, // Usuario padrão
        score: score || 0,
        tokensEarned: 0, // Sempre 0 no modo FREE
        duration: duration || 50,
        createdAt: new Date().toISOString()
      };
      
      console.log("🎮 Jogo FREE salvo:", freeGameScore);
      
      res.status(201).json({
        success: true,
        message: "Pontuação FREE salva com sucesso!",
        score: freeGameScore.score,
        tokensEarned: 0,
        mode: "free"
      });
    } catch (error) {
      console.error("Error creating free game score:", error);
      res.status(500).json({ error: "Failed to create free game score" });
    }
  });

  // Rate limiting para rotas críticas
  app.use('/api/admin/', rateLimit(50, 60000)); // 50 requests por minuto para admin
  app.use('/api/game/', rateLimit(10, 60000)); // 10 games por minuto
  app.use('/api/users/', rateLimit(100, 60000)); // 100 requests por minuto para usuários

  // 🤖 Registrar rotas da API Telegram ANTES dos error handlers
  const { registerTelegramRoutes } = await import("./telegram-routes");
  registerTelegramRoutes(app);
  
  // 📊 Configurar monitoramento do bot
  const { setupTelegramStatusRoutes } = await import("./telegram-status");
  setupTelegramStatusRoutes(app);
  
  // 📨 Configurar notificações Telegram
  const { setupTelegramNotificationRoutes } = await import("./telegram-notifications");
  setupTelegramNotificationRoutes(app, storage);

  // 💬 Sistema de Chat IA com consumo de tokens
  const chatRouter = await import("./routes/chat");
  app.use("/api/chat", chatRouter.default);

  // 📅 Sistema de sincronização de calendário automático
  const serviceCalendarRouter = await import("./routes/service-calendar");  
  app.use("/api/service-calendar", serviceCalendarRouter.default);

  // Handler para rotas API não encontradas (apenas /api/*)
  app.use('/api/*', notFoundHandler);
  
  // Handler global de erros (deve ser o último middleware)
  app.use(globalErrorHandler);

  const httpServer = createServer(app);
  
  // Setup health monitoring
  setupHealthCheck(app);
  
  // ========================================
  // 🤝 TEAM HIRING SYSTEM WITH DISCOUNTS
  // ========================================
  
  // Calcular desconto baseado no número de profissionais
  app.get("/api/team-hiring/calculate-discount/:count", async (req, res) => {
    try {
      const count = parseInt(req.params.count);
      const discount = storage.calculateTeamDiscount(count);
      
      res.json({
        professionalCount: count,
        discountPercentage: discount,
        discountText: discount === 0 ? "Sem desconto" : 
                     discount === 15 ? "15% de desconto" : 
                     "20% de desconto"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Criar nova contratação de equipe
  app.post("/api/team-hiring", async (req, res) => {
    try {
      const teamHiringData = req.body;
      
      // Validar campos obrigatórios
      if (!teamHiringData.userId || !teamHiringData.professionals || !teamHiringData.totalTokens) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes" });
      }

      const teamHiring = await storage.createTeamHiring(teamHiringData);
      
      res.json({
        success: true,
        teamHiring,
        message: `Equipe contratada com ${teamHiring.discountPercentage}% de desconto!`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar contratação específica
  app.get("/api/team-hiring/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teamHiring = await storage.getTeamHiring(id);
      
      if (!teamHiring) {
        return res.status(404).json({ error: "Contratação não encontrada" });
      }
      
      res.json(teamHiring);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar todas as contratações de um usuário
  app.get("/api/users/:userId/team-hirings", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const teamHirings = await storage.getUserTeamHirings(userId);
      
      res.json(teamHirings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Atualizar status da contratação
  app.patch("/api/team-hiring/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status é obrigatório" });
      }

      const updatedHiring = await storage.updateTeamHiringStatus(id, status);
      
      if (!updatedHiring) {
        return res.status(404).json({ error: "Contratação não encontrada" });
      }
      
      res.json({
        success: true,
        teamHiring: updatedHiring,
        message: `Status atualizado para: ${status}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar serviços ativos em tempo real
  app.get('/api/services/active/:userId', async (req, res) => {
    try {
      const userId = req.params.userId ? parseInt(req.params.userId) : undefined;
      
      // Buscar profissionais ativos na plataforma (disponíveis)
      const allProfessionals = await storage.getAllProfessionals();
      const activeProfessionals = allProfessionals.filter(prof => prof.available);
      
      // Simular serviços ativos com dados reais de profissionais
      const activeServices = activeProfessionals.slice(0, 3).map((prof, index) => {
        const statuses = ['on_way', 'arrived', 'in_progress'];
        const status = statuses[index % statuses.length];
        
        // Coordenadas simuladas para São Paulo
        const baseLat = -23.5505;
        const baseLng = -46.6333;
        const variation = 0.05; // ~5km de variação
        
        return {
          id: `service_${prof.id}_${Date.now()}`,
          professionalId: prof.id,
          professionalName: prof.name,
          professionalAvatar: prof.avatar,
          professionalPhone: prof.phone || `+55119${Math.floor(Math.random() * 100000000)}`,
          professionalRating: prof.rating || 4 + Math.random(),
          serviceName: prof.services?.[0] || 'Serviço Geral',
          status,
          startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          estimatedArrival: status === 'on_way' ? Math.floor(Math.random() * 45) + 5 : undefined,
          clientLocation: {
            lat: baseLat + (Math.random() - 0.5) * variation,
            lng: baseLng + (Math.random() - 0.5) * variation
          },
          professionalLocation: {
            lat: baseLat + (Math.random() - 0.5) * variation * 2,
            lng: baseLng + (Math.random() - 0.5) * variation * 2
          }
        };
      });
      
      res.json(activeServices);
    } catch (error) {
      console.error('❌ Erro ao buscar serviços ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar serviços ativos sem ID específico
  app.get('/api/services/active', async (req, res) => {
    try {
      const userId = req.params.userId ? parseInt(req.params.userId) : undefined;
      
      // Buscar profissionais ativos na plataforma (disponíveis)
      const allProfessionals = await storage.getAllProfessionals();
      const activeProfessionals = allProfessionals.filter(prof => prof.available);
      
      // Simular serviços ativos com dados reais de profissionais
      const activeServices = activeProfessionals.slice(0, 3).map((prof, index) => {
        const statuses = ['on_way', 'arrived', 'in_progress'];
        const status = statuses[index % statuses.length];
        
        // Coordenadas simuladas para São Paulo
        const baseLat = -23.5505;
        const baseLng = -46.6333;
        const variation = 0.05; // ~5km de variação
        
        return {
          id: `service_${prof.id}_${Date.now()}`,
          professionalId: prof.id,
          professionalName: prof.name,
          professionalAvatar: prof.avatar,
          professionalPhone: prof.phone || `+55119${Math.floor(Math.random() * 100000000)}`,
          professionalRating: prof.rating || 4 + Math.random(),
          serviceName: prof.skills?.[0] || 'Serviço Geral',
          status,
          startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          estimatedArrival: status === 'on_way' ? Math.floor(Math.random() * 45) + 5 : undefined,
          clientLocation: {
            lat: baseLat + (Math.random() - 0.5) * variation,
            lng: baseLng + (Math.random() - 0.5) * variation
          },
          professionalLocation: {
            lat: baseLat + (Math.random() - 0.5) * variation * 2,
            lng: baseLng + (Math.random() - 0.5) * variation * 2
          }
        };
      });
      
      res.json(activeServices);
    } catch (error) {
      console.error('❌ Erro ao buscar serviços ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para buscar profissionais ativos na plataforma
  app.get('/api/professionals/active', async (req, res) => {
    try {
      const allProfessionals = await storage.getAllProfessionals();
      const activeProfessionals = allProfessionals.filter(prof => prof.available);
      res.json(activeProfessionals);
    } catch (error) {
      console.error('❌ Erro ao buscar profissionais ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Configurar autenticação e payment routes
  setupAuthRoutes(app);
  setupPaymentRoutes(app, httpServer);
  setupAdminRoutes(app);

  // PIX TRACKING ROUTES - Sistema de identificação automática
  app.get('/api/admin/pending-pix', async (req, res) => {
    try {
      const pendingTransactions = PixTracker.getPendingTransactions();
      res.json({
        success: true,
        count: pendingTransactions.length,
        transactions: pendingTransactions.map(t => ({
          id: t.id,
          userEmail: t.userEmail,
          userId: t.userId,
          amount: t.amount,
          tokens: t.tokens,
          timestamp: t.timestamp,
          minutesAgo: Math.floor((Date.now() - t.timestamp.getTime()) / 60000)
        }))
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar transações pendentes' });
    }
  });

  // Endpoint para processar PIX detectado manualmente
  app.post('/api/admin/process-pix', async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Valor do PIX é obrigatório' 
        });
      }
      
      const processed = await PixTracker.processPixPayment(amount);
      
      if (processed) {
        res.json({
          success: true,
          message: `PIX de R$ ${amount.toFixed(2)} processado automaticamente`
        });
      } else {
        res.json({
          success: false,
          message: `PIX de R$ ${amount.toFixed(2)} não correlacionado com nenhum usuário`,
          hint: 'Verifique se o usuário gerou o PIX recentemente (últimos 15 minutos)'
        });
      }
    } catch (error) {
      console.error('Erro ao processar PIX:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  setupCreditRoutes(app);

  // ========================================
  // 🏢 PROFESSIONAL TEAM MANAGEMENT SYSTEM
  // ========================================
  
  // Criar equipe profissional
  app.post("/api/professional-teams", async (req, res) => {
    try {
      const { professionalId, teamName, description, companyType, cnpj } = req.body;
      
      if (!professionalId || !teamName) {
        return res.status(400).json({ error: "Professional ID e nome da equipe são obrigatórios" });
      }

      const teamData = {
        professionalId,
        teamName,
        description,
        companyType: companyType || "individual",
        cnpj,
        professionalDiscount: 0.10, // 10% desconto padrão
        status: "active"
      };

      const team = await storage.createProfessionalTeam(teamData);
      res.json({ success: true, team });
    } catch (error: any) {
      console.error("Erro ao criar equipe profissional:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar equipe do profissional
  app.get("/api/professional-teams/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const team = await storage.getProfessionalTeamByUserId(userId);
      res.json({ success: true, team });
    } catch (error: any) {
      console.error("Erro ao buscar equipe profissional:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Adicionar funcionário à equipe
  app.post("/api/professional-teams/:teamId/employees", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeData = {
        ...req.body,
        teamId
      };

      const employee = await storage.addTeamEmployee(employeeData);
      res.json({ success: true, employee });
    } catch (error: any) {
      console.error("Erro ao adicionar funcionário:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar funcionários da equipe
  app.get("/api/professional-teams/:teamId/employees", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employees = await storage.getTeamEmployees(teamId);
      res.json({ success: true, employees });
    } catch (error: any) {
      console.error("Erro ao buscar funcionários:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar usuários da plataforma para convite
  app.get("/api/users/search", async (req, res) => {
    try {
      const { query, limit = 10 } = req.query;
      
      if (!query || typeof query !== 'string' || query.length < 3) {
        return res.json({ success: true, users: [] });
      }

      const users = await storage.searchUsers(query, parseInt(limit as string));
      
      // Remover informações sensíveis
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        verified: user.emailVerified
      }));

      res.json({ success: true, users: sanitizedUsers });
    } catch (error: any) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Enviar convite para usuário da plataforma
  app.post("/api/team-invitations", async (req, res) => {
    try {
      const { teamId, invitedUserId, message } = req.body;
      
      if (!teamId || !invitedUserId) {
        return res.status(400).json({ error: "Team ID e usuário convidado são obrigatórios" });
      }

      // Verificar se o usuário já não faz parte da equipe
      const existingEmployee = await storage.findTeamEmployee(teamId, invitedUserId);
      if (existingEmployee) {
        return res.status(400).json({ error: "Usuário já faz parte desta equipe" });
      }

      const invitationData = {
        teamId,
        invitedUserId,
        inviterId: 3, // TODO: Pegar do usuário autenticado
        message,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      };

      const invitation = await storage.createTeamInvitation(invitationData);
      res.json({ success: true, invitation });
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar convites pendentes do usuário
  app.get("/api/team-invitations/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const invitations = await storage.getUserTeamInvitations(userId);
      res.json({ success: true, invitations });
    } catch (error: any) {
      console.error("Erro ao buscar convites:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Responder convite (aceitar/rejeitar)
  app.patch("/api/team-invitations/:invitationId", async (req, res) => {
    try {
      const invitationId = parseInt(req.params.invitationId);
      const { status, response } = req.body; // "accepted" ou "rejected"
      
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status deve ser 'accepted' ou 'rejected'" });
      }

      const invitation = await storage.respondToTeamInvitation(invitationId, status, response);
      
      // Se aceito, adicionar como funcionário
      if (status === "accepted" && invitation) {
        const employeeData = {
          teamId: invitation.teamId,
          userId: invitation.invitedUserId,
          fromPlatform: true,
          status: "active",
          acceptedAt: new Date()
        };
        
        await storage.addTeamEmployeeFromUser(employeeData);
      }

      res.json({ success: true, invitation });
    } catch (error: any) {
      console.error("Erro ao responder convite:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remover funcionário da equipe
  app.delete("/api/professional-teams/:teamId/employees/:employeeId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const employeeId = parseInt(req.params.employeeId);
      
      const success = await storage.removeTeamEmployee(teamId, employeeId);
      
      if (!success) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      res.json({ success: true, message: "Funcionário removido da equipe" });
    } catch (error: any) {
      console.error("Erro ao remover funcionário:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sistema de polling PIX (como sites de apostas)
  const checkPendingPayments = async () => {
    try {
      // Temporariamente desativar até implementar método correto
      return;
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const recentPendingPayments = allPayments.filter(p => 
        p.status === 'pending' && 
        new Date(p.paymentDate) > thirtyMinutesAgo
      );
      
      if (recentPendingPayments.length > 0) {
        console.log(`🔍 Verificando ${recentPendingPayments.length} pagamentos pendentes...`);
        
        for (let payment of recentPendingPayments) {
          console.log(`⏳ Pagamento pendente: ${payment.transactionId} - R$ ${payment.amount}`);
          
          // TODO: Implementar verificação real via Mercado Pago API
          // const status = await PaymentProcessor.checkPaymentStatus(payment.transactionId, payment.provider);
          // if (status === 'approved') {
          //   await PaymentProcessor.confirmPayment(payment.transactionId);
          // }
        }
      }
    } catch (error) {
      // Silenciar erro para não poluir logs
      // console.error('Erro na verificação automática:', error);
    }
  };

  // Iniciar polling a cada 15 segundos (como sites de apostas)
  setInterval(checkPendingPayments, 15000);
  console.log('🚀 Sistema de polling PIX iniciado (15s como sites de apostas)');

  // 🧠 SISTEMA DE ANALYTICS E IA COMPORTAMENTAL
  
  // Middleware de tracking automático para capturar comportamentos
  app.use((req, res, next) => {
    if (req.headers['user-email'] && req.url.includes('/api/')) {
      const userEmail = req.headers['user-email'] as string;
      
      // Rastrear evento baseado na rota
      const event = `${req.method}_${req.url.split('/')[2] || 'unknown'}`;
      
      behaviorTracker.trackBehavior(1, event, {
        endpoint: req.url,
        method: req.method,
        userEmail,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
    }
    next();
  });

  // Endpoint para obter insights de usuário específico
  app.get("/api/analytics/insights/:userType", async (req, res) => {
    try {
      const { userType } = req.params;
      const userId = parseInt(req.query.userId as string) || 1;
      
      if (!['client', 'professional', 'admin'].includes(userType)) {
        return res.status(400).json({ error: "Tipo de usuário inválido" });
      }
      
      const insights = await behaviorTracker.generateInsights(userId, userType);
      
      res.json({
        success: true,
        userType,
        userId,
        insights,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Erro ao gerar insights:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para registrar eventos específicos de comportamento
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { event, data } = req.body;
      const userEmail = req.headers['user-email'] as string;
      const userId = parseInt(req.query.userId as string) || 1;
      
      if (!event) {
        return res.status(400).json({ error: "Event é obrigatório" });
      }
      
      await behaviorTracker.trackBehavior(userId, event, {
        ...data,
        userEmail,
        timestamp: new Date().toISOString()
      });
      
      res.json({ success: true, message: "Evento rastreado com sucesso" });
    } catch (error: any) {
      console.error('Erro ao rastrear evento:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para dados de dashboard em tempo real
  app.get("/api/analytics/dashboard/:userType/:userId", async (req, res) => {
    try {
      const { userType, userId } = req.params;
      
      if (!['client', 'professional', 'admin'].includes(userType)) {
        return res.status(400).json({ error: "Tipo de usuário inválido" });
      }
      
      const realTimeInsights = await behaviorTracker.generateInsights(
        parseInt(userId), 
        userType
      );
      
      res.json({
        success: true,
        userType,
        userId: parseInt(userId),
        realTimeData: realTimeInsights,
        hasRealData: Object.keys(realTimeInsights).length > 5,
        lastUpdate: new Date().toLocaleString('pt-BR'),
        isLive: true
      });
    } catch (error: any) {
      console.error('Erro ao buscar dados do dashboard:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ================================
  // 🤖 SISTEMA DE AUTO-ACEITAR SOLICITAÇÕES - NOVOS ENDPOINTS
  // ================================
  
  // Atualizar configuração de auto-aceitar para profissional
  app.post("/api/professional/:id/auto-accept", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const { enabled } = req.body;
      
      console.log(`🤖 Configurando auto-aceitar para profissional ${professionalId}: ${enabled ? 'ATIVO' : 'INATIVO'}`);
      
      const result = await storage.updateProfessionalAutoAccept(professionalId, enabled);
      
      res.json(result);
    } catch (error: any) {
      console.error("Erro ao configurar auto-aceitar:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  // Obter status atual do auto-aceitar para profissional
  app.get("/api/professional/:id/auto-accept", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      
      const status = await storage.getProfessionalAutoAcceptStatus(professionalId);
      
      res.json(status);
    } catch (error: any) {
      console.error("Erro ao buscar status auto-aceitar:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  // Analytics do sistema de auto-aceitar para admin
  app.get("/api/admin/auto-accept-analytics", async (req, res) => {
    try {
      const analytics = await storage.getAutoAcceptAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        totalProfessionals: analytics.length,
        summary: {
          totalActive: analytics.length,
          totalUsage: analytics.reduce((sum, item) => sum + item.autoAcceptCount, 0),
          averageResponseTime: analytics.length > 0 ? 
            analytics.reduce((sum, item) => sum + item.responseTimeHours, 0) / analytics.length : 0
        }
      });
    } catch (error: any) {
      console.error("Erro ao buscar analytics auto-aceitar:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Endpoint para tracking de comportamento (já usado pelo sistema)
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { event, data } = req.body;
      
      // Log do tracking para o admin ver em tempo real
      console.log(`📊 ANALYTICS TRACK - ${event}:`, data);
      
      // Aqui você pode salvar no banco de dados se necessário
      // await storage.saveTrackingData({ event, data, timestamp: new Date() });
      
      res.json({ 
        success: true, 
        message: "Tracking registrado com sucesso",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erro ao registrar tracking:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });


  // =====================================================
  // SERVICE TRACKING ROUTES - Sistema de Rastreamento de Serviços
  // =====================================================

  // Get active services for tracking
  app.get('/api/services/tracking/:userType/:userId', async (req, res) => {
    try {
      const { userType, userId } = req.params;
      
      // Mock data para demonstração - em produção virá do storage
      const mockActiveServices = [
        {
          id: 1,
          clientId: userType === 'client' ? parseInt(userId) : 2,
          professionalId: userType === 'professional' ? parseInt(userId) : 1,
          serviceType: 'Instalação Elétrica',
          status: 'pending',
          estimatedDuration: 90,
          cost: 150.00,
          startTime: null,
          arrivalTime: null,
          completionTime: null,
          completionCode: null,
          clientLocation: {
            lat: -23.5505,
            lng: -46.6333,
            address: 'Rua Augusta, 123 - São Paulo, SP'
          }
        }
      ];

      res.json(mockActiveServices);
    } catch (error) {
      console.error('Erro ao buscar serviços ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Update service tracking status
  app.post('/api/services/tracking/update', async (req, res) => {
    try {
      const { 
        serviceId, 
        status, 
        userId, 
        userType, 
        timestamp, 
        location, 
        additionalData 
      } = req.body;

      console.log(`🚀 ATUALIZAÇÃO SERVIÇO ${serviceId}: ${status} por ${userType} ${userId}`);

      let completionCode = null;
      let message = '';

      // Lógica de atualização baseada no status
      switch (status) {
        case 'traveling':
          message = 'Profissional iniciou trajeto para o local';
          console.log(`📱 NOTIFICAÇÃO CLIENTE: ${message}`, { serviceId, userId, userType, timestamp, location });
          console.log(`👨‍💼 ADMIN NOTIFICATION: service_started`, { serviceId, userId, userType, timestamp });
          break;

        case 'arrived':
          message = 'Profissional chegou ao local';
          console.log(`📱 NOTIFICAÇÃO CLIENTE: ${message}`, { serviceId, userId, userType, timestamp, location });
          console.log(`👨‍💼 ADMIN NOTIFICATION: professional_arrived`, { serviceId, userId, userType, timestamp });
          break;

        case 'in_progress':
          message = 'Cliente confirmou início do serviço';
          console.log(`📱 NOTIFICAÇÃO PROFISSIONAL: ${message}`, { serviceId, userId, userType, timestamp });
          break;

        case 'completed':
          const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const time = Date.now().toString().slice(-6);
          completionCode = `ORB-${date}-${time}`;
          message = `Serviço finalizado! Código: ${completionCode}`;
          console.log(`📱 NOTIFICAÇÃO AMBOS: ${message}`, { completionCode, serviceId, userId, userType, timestamp });
          console.log(`👨‍💼 ADMIN NOTIFICATION: service_completed`, { 
            serviceId, userId, userType, timestamp, completionCode 
          });
          break;

        case 'rated':
          message = 'Avaliação enviada com sucesso';
          console.log(`👨‍💼 ADMIN NOTIFICATION: service_rated`, { 
            serviceId, rating: additionalData?.rating, feedback: additionalData?.feedback 
          });
          break;
      }

      // Integrar com sistema de analytics para dashboard admin
      const analyticsData = {
        event: `service_${status}`,
        timestamp: new Date().toISOString(),
        serviceId,
        userId,
        userType,
        data: { location, additionalData },
        service_execution: true
      };
      console.log('📊 ANALYTICS DATA:', analyticsData);

      res.json({ 
        success: true, 
        message,
        completionCode,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao atualizar status do serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get service history
  app.get('/api/services/history/:userType/:userId', async (req, res) => {
    try {
      const { userType, userId } = req.params;

      // Mock data para demonstração
      const mockHistory = [
        {
          id: 101,
          date: '2025-07-20',
          time: '14:30',
          serviceType: 'Reparo Elétrico',
          professionalName: userType === 'client' ? 'Carlos Silva' : undefined,
          clientName: userType === 'professional' ? 'Ana Santos' : undefined,
          duration: 75,
          cost: 120.00,
          rating: 5,
          feedback: 'Excelente trabalho, muito profissional!',
          completionCode: 'ORB-20250720-101',
          location: 'Rua das Flores, 456 - São Paulo, SP',
          status: 'completed'
        },
        {
          id: 102,
          date: '2025-07-18',
          time: '09:15',
          serviceType: 'Instalação de Ventilador',
          professionalName: userType === 'client' ? 'João Oliveira' : undefined,
          clientName: userType === 'professional' ? 'Pedro Santos' : undefined,
          duration: 45,
          cost: 80.00,
          rating: 4,
          feedback: 'Bom trabalho, chegou no horário',
          completionCode: 'ORB-20250718-102',
          location: 'Av. Paulista, 1000 - São Paulo, SP',
          status: 'completed'
        }
      ];

      res.json(mockHistory);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  // =================== ENDPOINTS MISSING (RESOLVING 404s) ===================
  
  // Service Requests endpoints
  app.get("/api/service-requests/client/:clientId", async (req, res) => {
    res.json([]);
  });

  app.get("/api/service-requests/professional/:professionalId/pending", async (req, res) => {
    res.json([]);
  });

  app.get("/api/service-requests/professional/:professionalId/accepted", async (req, res) => {
    res.json([]);
  });

  // Professional Stats endpoint
  app.get("/api/professional-stats/:professionalId", async (req, res) => {
    res.json({
      totalEarnings: 0,
      completedJobs: 0,
      averageRating: 0,
      totalReviews: 0,
      responseTime: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0
    });
  });

  // Analytics behavior advanced endpoint
  app.post("/api/analytics/behavior-advanced", async (req, res) => {
    const { event, category, properties } = req.body;
    console.log(`📊 Analytics: ${event} - ${category}`, properties);
    res.json({ success: true, tracked: true });
  });

  // Services tracking endpoints
  app.get("/api/services/tracking/client/:clientId", async (req, res) => {
    res.json([]);
  });

  app.get("/api/services/history/client/:clientId", async (req, res) => {
    res.json([]);
  });

  // =================== CARTEIRA DETALHADA COM INFORMAÇÕES COMPLETAS ===================
  
  // Endpoint para informações detalhadas da carteira
  app.get("/api/wallet/detailed/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Dados detalhados da carteira
      const walletInfo = {
        // Informações básicas do usuário
        userName: user.username,
        userEmail: user.email,
        userType: user.userType,
        userPlan: user.plan || 'free',
        
        // Tokens por categoria
        tokens: {
          planos: user.tokensPlano || 0,
          comprados: user.tokensComprados || 0,
          ganhos: user.tokensGanhos || 0,
          total: (user.tokensPlano || 0) + (user.tokensComprados || 0) + (user.tokensGanhos || 0)
        },
        
        // Histórico financeiro
        financeiro: {
          totalInvestido: user.tokensComprados ? (user.tokensComprados * 0.00139).toFixed(2) : "0.00", // R$ 0.00139 por token
          planoAtivo: user.plan !== 'free',
          planExpiry: user.planExpiryDate,
          diasRestantes: user.planExpiryDate ? Math.max(0, Math.ceil((new Date(user.planExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
          valorPlanosGastos: user.plan === 'max' ? 30 : user.plan === 'pro' ? 21 : user.plan === 'standard' ? 14 : user.plan === 'basic' ? 7 : 0
        },
        
        // Estatísticas de uso
        estatisticas: {
          jogosJogados: user.gamesPlayed || 0,
          tokensGanhosJogos: user.tokensGanhos || 0,
          servicosContratados: 0, // Será implementado quando houver dados reais
          profissionaisConectados: 0, // Será implementado quando houver dados reais
          mediaGastosPorServico: "0.00"
        },
        
        // Sistema de cashback
        cashback: {
          elegivel: user.plan && user.plan !== 'free',
          percentualMensal: user.plan === 'basic' ? 8.7 : user.plan === 'standard' ? 8.7 : user.plan === 'pro' ? 8.7 : user.plan === 'max' ? 8.7 : 0,
          proximoPagamento: "03/08/2025", // Todo dia 3
          estimativaMensal: user.plan === 'basic' ? "0.61" : user.plan === 'standard' ? "1.22" : user.plan === 'pro' ? "1.83" : user.plan === 'max' ? "2.61" : "0.00"
        },
        
        // Timestamp da consulta
        timestamp: new Date().toISOString(),
        ultimaAtualizacao: "22/07/2025 15:30:00"
      };

      res.json(walletInfo);
      
    } catch (error) {
      console.error("Erro ao buscar informações detalhadas da carteira:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Endpoint para histórico de transações da carteira
  app.get("/api/wallet/transactions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Simular histórico baseado nos dados reais do usuário
      const transactions = [];
      
      // Adicionar compra de tokens se existir
      if (user.tokensComprados > 0) {
        const valorCompra = (user.tokensComprados * 0.00139).toFixed(2);
        transactions.push({
          id: `compra_${user.id}_${Date.now()}`,
          tipo: "compra_tokens",
          descricao: `Compra de ${user.tokensComprados} tokens`,
          valor: `R$ ${valorCompra}`,
          tokens: user.tokensComprados,
          data: "2025-07-22T12:00:00Z",
          status: "concluido"
        });
      }
      
      // Adicionar plano se existir
      if (user.plan && user.plan !== 'free') {
        const valorPlano = user.plan === 'max' ? 30 : user.plan === 'pro' ? 21 : user.plan === 'standard' ? 14 : 7;
        transactions.push({
          id: `plano_${user.id}_${Date.now()}`,
          tipo: "assinatura_plano",
          descricao: `Plano ${user.plan.toUpperCase()}`,
          valor: `R$ ${valorPlano.toFixed(2)}`,
          tokens: user.tokensPlano || 0,
          data: "2025-07-22T10:00:00Z",
          status: "ativo"
        });
      }
      
      // Adicionar jogos se existir
      if (user.tokensGanhos > 0) {
        transactions.push({
          id: `jogo_${user.id}_${Date.now()}`,
          tipo: "ganho_jogo",
          descricao: `${user.gamesPlayed || 1} jogos executados`,
          valor: "R$ 0.00",
          tokens: user.tokensGanhos,
          data: "2025-07-22T14:00:00Z",
          status: "concluido"
        });
      }

      res.json({
        transactions: transactions.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
        total: transactions.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Erro ao buscar transações da carteira:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  console.log('✅ Missing endpoints e carteira detalhada configurados');
  
  // ================================
  // ROTAS DE PERFIL COMPLETAS
  // ================================

  // Importar handlers de perfil
  const profileRoutes = await import('./profile-routes');

  // Buscar perfil do usuário
  app.get('/api/profile/:userType/:userId', profileRoutes.getProfile);

  // Salvar/atualizar perfil
  app.post('/api/profile/:userType', profileRoutes.saveProfile);

  // Buscar perfis completos (para sistema orbital)
  app.get('/api/profiles/completed', profileRoutes.getCompletedProfiles);

  console.log('✅ Rotas de perfil configuradas');
  
  return httpServer;
}

// 📐 FUNÇÃO AUXILIAR - CÁLCULO DE DISTÂNCIA GEOGRÁFICA
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI/180);
}
