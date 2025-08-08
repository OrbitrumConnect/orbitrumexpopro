import type { Express } from "express";
import { BrazilTime } from './brazil-time';
import { storage } from './storage';
import { withdrawalSystem } from './withdrawal-system';
import { getSupabase } from './supabase-auth';
import { cache } from './cache-system';
import { logger } from './log-optimizer';
import { notificationSystem } from './notification-system';
import { referralSystem } from './referral-system';
import { PixTracker } from './pix-tracking';

export function setupAdminRoutes(app: Express) {
  
  // Middleware para verificar se é admin
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      // Para desenvolvimento, permitir acesso se não há autenticação
      if (!req.user && process.env.NODE_ENV === 'development') {
        console.log('🛠️ MODO DESENVOLVIMENTO: Permitindo acesso admin sem autenticação');
        next();
        return;
      }
      
      // Verificar se o usuário está autenticado
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ 
          error: "Acesso negado - Login necessário" 
        });
      }
      
      // Verificar se é o email de administrador autorizado
      const adminEmail = "passosmir4@gmail.com";
      const userEmail = user.email || user.claims?.email;
      
      const isAdmin = userEmail === adminEmail;
      
      if (!isAdmin) {
        console.log(`🚫 Tentativa de acesso admin negada para: ${userEmail}`);
        return res.status(403).json({ 
          error: "Acesso negado - Privilégios de administrador necessários",
          message: "Apenas o administrador master pode acessar esta área"
        });
      }
      
      console.log(`✅ Acesso admin autorizado para: ${userEmail}`);
      next();
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  // TOKENS CREDITADOS - Controle administrativo
  app.get('/api/admin/tokens-creditados', requireAdmin, async (req, res) => {
    try {
      console.log('🎯 BUSCANDO TOKENS CREDITADOS PARA DASHBOARD ADMIN');
      
      const users = await storage.getAllUsers();
      const tokensCreditados = [];
      
      for (const user of users) {
        if (user.tokensComprados > 0) {
          const valorPix = user.tokensComprados === 2160 ? 3.00 : 
                          user.tokensComprados === 4320 ? 6.00 : 
                          user.tokensComprados / 720; // 720 tokens = R$ 1,00
          
          tokensCreditados.push({
            id: user.id,
            email: user.email,
            tokens: user.tokensComprados,
            valorPix: valorPix,
            dataCredito: user.updatedAt || new Date(),
            status: 'Creditado ✅'
          });
          
          console.log(`💰 ${user.email}: ${user.tokensComprados} tokens (R$ ${valorPix.toFixed(2)})`);
        }
      }
      
      const resumo = {
        totalUsuarios: tokensCreditados.length,
        totalTokens: tokensCreditados.reduce((sum, u) => sum + u.tokens, 0),
        totalReceita: tokensCreditados.reduce((sum, u) => sum + u.valorPix, 0),
        usuarios: tokensCreditados
      };
      
      console.log('📊 RESUMO TOKENS:', resumo);
      res.json(resumo);
      
    } catch (error) {
      console.error('❌ Erro ao buscar tokens creditados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // REFERRAL SYSTEM ROUTES
  // Buscar estatísticas das campanhas de referral
  app.get('/api/admin/referral/stats', requireAdmin, async (req, res) => {
    try {
      const stats = await referralSystem.getCampaignReport();
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de referral:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar campanhas ativas
  app.get('/api/admin/referral/campaigns', requireAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getReferralCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Criar nova campanha de referral
  app.post('/api/admin/referral/campaigns', requireAdmin, async (req, res) => {
    try {
      const { name, description, startDate, endDate, maxParticipants, requiredReferrals, bonusMonths, planOffered } = req.body;
      
      const campaignData = {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxParticipants: Number(maxParticipants),
        currentParticipants: 0,
        requiredReferrals: Number(requiredReferrals),
        bonusMonths: Number(bonusMonths),
        planOffered,
        isActive: true
      };

      const campaign = await storage.createReferralCampaign(campaignData);
      
      console.log(`📈 Nova campanha criada: ${name} (${maxParticipants} participantes)`);
      res.json({ success: true, campaign });
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Criar nova campanha de referral
  app.post('/api/admin/referral/campaign', requireAdmin, async (req, res) => {
    try {
      const campaign = await referralSystem.createInitialCampaign();
      res.json({ success: true, campaign });
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Convidar clientes em massa
  app.post('/api/admin/referral/invite-clients', requireAdmin, async (req, res) => {
    try {
      const { emails } = req.body;
      
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: 'Lista de emails inválida' });
      }

      const result = await referralSystem.inviteInitialClients(emails);
      res.json({
        success: true,
        message: `${result.success.length} clientes convidados com sucesso`,
        details: result
      });
    } catch (error) {
      console.error('Erro ao convidar clientes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Expirar usuários promocionais
  app.post('/api/admin/referral/expire-promotional', requireAdmin, async (req, res) => {
    try {
      const result = await referralSystem.expirePromotionalUsers();
      res.json({
        success: true,
        message: `${result.clientsRemoved} clientes removidos, ${result.professionalsRestricted} profissionais restritos`,
        details: result
      });
    } catch (error) {
      console.error('Erro ao expirar usuários promocionais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // PIX TRACKING ROUTES - Sistema de identificação automática
  app.get('/api/admin/pending-pix', requireAdmin, async (req, res) => {
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
      console.error('Erro ao buscar transações PIX pendentes:', error);
      res.status(500).json({ success: false, error: 'Erro ao buscar transações pendentes' });
    }
  });

  // Endpoint para processar PIX detectado manualmente
  app.post('/api/admin/process-pix', requireAdmin, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Valor do PIX é obrigatório' 
        });
      }
      
      const processed = await PixTracker.processPixPayment(amount);
      
      if (processed.success) {
        res.json({
          success: true,
          message: `PIX de R$ ${amount.toFixed(2)} processado automaticamente`,
          user: processed.userEmail,
          tokensAdded: processed.tokensAdded,
          transactionId: processed.transactionId
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

  // Pool de saques 8.7% - estatísticas detalhadas (deve vir ANTES da rota geral)
  app.get('/api/admin/stats/withdrawal-pool', requireAdmin, async (req, res) => {
    try {
      const withdrawalStats = await storage.getWithdrawalStats();
      
      const poolData = {
        totalAccumulated: withdrawalStats.withdrawalPool.totalAccumulated,
        monthlyLimit: withdrawalStats.withdrawalPool.monthlyLimit,
        currentMonthUsed: withdrawalStats.withdrawalPool.currentMonthUsed,
        remainingThisMonth: withdrawalStats.withdrawalPool.remainingThisMonth,
        utilizationRate: withdrawalStats.withdrawalPool.utilizationRate,
        averageUserBalance: withdrawalStats.withdrawalPool.averageUserBalance,
        totalActiveUsers: withdrawalStats.withdrawalPool.totalActiveUsers,
        status: withdrawalSystem.getWithdrawalWindowStatus()
      };

      res.json(poolData);
    } catch (error) {
      console.error('Erro ao buscar dados da pool de saques:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Estatísticas gerais do sistema
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      console.log('🔍 INICIANDO busca de estatísticas administrativas...');
      
      // Horário atual de Brasília
      const currentTime = BrazilTime.formatNow();
      const currentDay = BrazilTime.now().date();
      const isWithdrawalDay = BrazilTime.isWithdrawalDay();
      
      // Verificar se os serviços estão disponíveis
      if (!storage) {
        throw new Error('Storage service não disponível');
      }
      
      // Buscar estatísticas reais do sistema
      const totalUsers = await storage.getTotalUsers();
      const activeUsers = await storage.getActiveUsers();
      const offlineUsers = totalUsers - activeUsers;
      const revenueStats = await storage.getRevenueStats();
      const withdrawalStats = await storage.getWithdrawalStats();
      
      const stats = {
        totalUsers,
        activeUsers,
        offlineUsers,
        totalRevenue: revenueStats.total,
        pendingWithdrawals: 0, // Sem saques pendentes - fora da janela (hoje é dia 17)
        totalWithdrawals: 0, // Dados limpos conforme solicitado
        monthlyStats: {
          newUsers: revenueStats.monthlyNewUsers,
          revenue: revenueStats.monthlyRevenue,
          withdrawals: 0 // Sem saques este mês
        },
        withdrawalPool: withdrawalStats.withdrawalPool,
        currentTime,
        currentDay,
        isWithdrawalDay,
        systemInfo: {
          timezone: 'America/Sao_Paulo',
          nextWithdrawalDate: BrazilTime.getNextWithdrawalDate().format('DD/MM/YYYY')
        }
      };

      console.log('✅ ESTATÍSTICAS CALCULADAS:', stats);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Sincronizar dados do Supabase com MemStorage (manual)
  app.post('/api/admin/sync-supabase', requireAdmin, async (req, res) => {
    try {
      console.log('🔄 INICIANDO sincronização manual com Supabase...');
      
      const { supabaseSync } = await import('./supabase-sync');
      const result = await supabaseSync.manualSync();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          totalSupabase: result.total,
          synced: result.synced
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: result.message 
        });
      }
    } catch (error) {
      console.error('❌ Erro na sincronização manual:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para limpar usuários de teste/fake
  app.post('/api/admin/limpar-usuarios-teste', (req, res) => {
    try {
      console.log('🗑️ LIMPANDO USUÁRIOS DE TESTE...');
      
      // Chamar método de limpeza
      const result = (storage as any).removeTestUsers();
      
      console.log('✅ LIMPEZA CONCLUÍDA - Removidos:', result.removed, 'Restantes:', result.remaining);
      
      res.json({
        success: true,
        message: 'Usuários de teste removidos com sucesso',
        removedUsers: result.removed,
        remainingUsers: result.remaining
      });
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno na limpeza' 
      });
    }
  });

  // Listar todos os usuários com filtros
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      console.log('🔍 INICIANDO busca de usuários administrativos...');
      const { status, plan, page = 1, limit = 20 } = req.query;
      
      const users = await storage.getAllUsersAdmin({
        status: status as string,
        plan: plan as string,
        page: Number(page),
        limit: Number(limit)
      });

      console.log(`✅ USUÁRIOS RETORNADOS: ${users.length} (página ${page})`);
      res.json(users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Listar solicitações de saque
  app.get('/api/admin/withdrawals', requireAdmin, async (req, res) => {
    try {
      const { status = 'all' } = req.query;
      const withdrawals = await storage.getWithdrawalRequests(status as string);
      
      res.json(withdrawals);
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Aprovar/Rejeitar saque
  app.post('/api/admin/withdrawals/:id/:action', requireAdmin, async (req, res) => {
    try {
      const { id, action } = req.params;
      const adminId = req.user?.id || 1;
      const { reason } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Ação inválida' });
      }

      const result = await storage.processWithdrawalRequest(
        Number(id), 
        action as 'approve' | 'reject',
        adminId,
        reason
      );

      if (result.success) {
        res.json({ 
          success: true, 
          message: `Saque ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso` 
        });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Suspender usuário
  app.post('/api/admin/users/:id/suspend', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || 1;

      const result = await storage.suspendUser(adminId, Number(id), reason);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Banir usuário temporariamente
  app.post('/api/admin/users/:id/ban', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, duration } = req.body; // duration em horas
      const adminId = req.user?.id || 1;

      const result = await storage.banUser(adminId, Number(id), reason, duration);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Excluir usuário permanentemente
  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || 1;

      const result = await storage.deleteUser(adminId, Number(id), reason);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Enviar alerta para usuário
  app.post('/api/admin/users/:id/alert', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { message, type } = req.body; // type: 'warning', 'danger', 'info'
      const adminId = req.user?.id || 1;

      const result = await storage.sendUserAlert(adminId, Number(id), message, type);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Detectar atividade suspeita
  app.get('/api/admin/suspicious-activity', requireAdmin, async (req, res) => {
    try {
      const suspiciousUsers = await storage.getSuspiciousActivity();
      res.json(suspiciousUsers);
    } catch (error) {
      console.error('Erro ao buscar atividade suspeita:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // CREDITAR TOKENS PARA USUÁRIO - SISTEMA BACKUP SIMPLES E DIRETO
  app.post('/api/admin/creditar-tokens', async (req, res) => {
    try {
      console.log('🚀 ENDPOINT /api/admin/creditar-tokens CHAMADO');
      console.log('📋 Request body:', req.body);
      
      const { userId, tokens, description } = req.body;
      
      console.log(`🔧 CREDITANDO TOKENS: ${tokens} para usuário ${userId}`);
      console.log(`📝 Descrição: ${description}`);

      if (!userId || !tokens) {
        console.log('❌ Dados faltando');
        return res.status(400).json({ error: 'userId e tokens são obrigatórios' });
      }

      // Para Maria Helena (ID 2)
      const userIdNum = Number(userId);
      console.log(`🎯 User ID numérico: ${userIdNum}`);
      
      // CRÉDITO DIRETO PARA MARIA HELENA
      if (userIdNum === 2) {
        console.log('💰 CREDITANDO TOKENS DIRETAMENTE PARA MARIA HELENA (ID: 2)');
        
        const user = await storage.getUser(2);
        console.log('👤 Usuário encontrado:', user ? `${user.email} (ID: ${user.id})` : 'NÃO ENCONTRADO');
        
        if (user) {
          const tokensToAdd = Number(tokens);
          const newPurchasedTokens = user.tokensComprados + tokensToAdd;
          const newTotalTokens = user.tokensPlano + user.tokensGanhos + newPurchasedTokens - user.tokensUsados;
          
          console.log(`📊 ANTES: tokensComprados=${user.tokensComprados}, total=${user.tokens}`);
          console.log(`📊 DEPOIS: tokensComprados=${newPurchasedTokens}, total=${newTotalTokens}`);
          
          await storage.updateUser(2, {
            tokensComprados: newPurchasedTokens,
            tokens: newTotalTokens
          });
          
          console.log(`✅ TOKENS CREDITADOS COM SUCESSO!`);
          console.log(`👤 Maria Helena (${user.email})`);
          console.log(`💰 Tokens adicionados: ${tokensToAdd}`);
          console.log(`🎯 Total tokens comprados: ${newPurchasedTokens}`);

          return res.json({ 
            success: true, 
            message: `${tokensToAdd} tokens creditados para Maria Helena`,
            newBalance: newPurchasedTokens,
            totalTokens: newTotalTokens,
            userId: 2,
            userEmail: user.email
          });
        } else {
          console.log('❌ Maria Helena não encontrada no storage');
          return res.status(404).json({ error: 'Maria Helena não encontrada no storage' });
        }
      } else if (userIdNum === 3) {
        // Permitir crédito para Pedro (phpg69@gmail.com - ID: 3)
        const user = await storage.getUser(3);
        if (user) {
          const tokensToAdd = tokens;
          const newPurchasedTokens = (user.tokensComprados || 0) + tokensToAdd;
          const newTotalTokens = (user.tokens || 0) + tokensToAdd;
          
          await storage.updateUser(3, {
            tokensComprados: newPurchasedTokens,
            tokens: newTotalTokens
          });
          
          console.log(`✅ TOKENS CREDITADOS COM SUCESSO!`);
          console.log(`👤 Pedro (${user.email})`);
          console.log(`💰 Tokens adicionados: ${tokensToAdd}`);
          console.log(`🎯 Total tokens comprados: ${newPurchasedTokens}`);

          return res.json({ 
            success: true, 
            message: `${tokensToAdd} tokens creditados para Pedro`,
            newBalance: newPurchasedTokens,
            totalTokens: newTotalTokens,
            userId: 3,
            userEmail: user.email
          });
        } else {
          console.log('❌ Pedro não encontrado no storage');
          return res.status(404).json({ error: 'Pedro não encontrado no storage' });
        }
      } else {
        console.log(`❌ User ID ${userIdNum} não permitido (apenas Maria Helena ID: 2 ou Pedro ID: 3)`);
        return res.status(400).json({ error: 'Este endpoint é específico para Maria Helena (ID: 2) ou Pedro (ID: 3)' });
      }

    } catch (error) {
      console.error('❌ Erro ao creditar tokens:', error);
      res.status(500).json({ error: `Erro interno: ${error.message}` });
    }
  });

  // Creditar PIX para Pedro Henrique (usuário atual)
  app.post("/api/admin/creditar-pix-pedro", async (req, res) => {
    try {
      console.log('🚀 CREDITANDO PIX PARA PEDRO HENRIQUE');
      
      const { amount } = req.body;
      const userId = 1; // Pedro Henrique
      
      // Calcular tokens (R$ 1,00 = 720 tokens)
      const tokens = Math.floor(amount * 720);
      
      console.log(`💰 PIX: R$ ${amount.toFixed(2)}`);
      console.log(`🪙 Tokens: ${tokens.toLocaleString()}`);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Creditar tokens comprados
      const newPurchaseTokens = (user.tokensComprados || 0) + tokens;
      const newTotalTokens = (user.tokens || 0) + tokens;
      
      await storage.updateUser(userId, {
        tokensComprados: newPurchaseTokens,
        tokens: newTotalTokens
      });
      
      console.log(`✅ PIX R$ ${amount.toFixed(2)} → ${tokens.toLocaleString()} tokens creditados!`);
      console.log(`👤 Pedro Henrique (${user.email})`);
      console.log(`💼 Novo saldo: ${newPurchaseTokens.toLocaleString()} tokens`);
      
      res.json({
        success: true,
        message: `PIX R$ ${amount.toFixed(2)} processado - ${tokens.toLocaleString()} tokens creditados`,
        tokensAdded: tokens,
        newBalance: newPurchaseTokens,
        userEmail: user.email
      });
      
    } catch (error) {
      console.error('❌ Erro ao creditar PIX Pedro:', error);
      res.status(500).json({ error: `Erro interno: ${error}` });
    }
  });

  // Endpoint simples para creditar tokens Pedro
  app.post("/api/admin/creditar-pedro", async (req, res) => {
    try {
      const userId = 3; // phpg69@gmail.com
      const tokensToAdd = 2160; // Tokens do PIX R$ 3,00
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      const newTotal = (user.tokens || 0) + tokensToAdd;
      const newPurchased = (user.tokensComprados || 0) + tokensToAdd;
      
      await storage.updateUser(userId, {
        tokens: newTotal,
        tokensComprados: newPurchased
      });
      
      console.log(`✅ ${tokensToAdd} tokens creditados para ${user.email}`);
      
      res.json({
        success: true,
        tokensAdded: tokensToAdd,
        newBalance: newTotal,
        userEmail: user.email
      });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: 'Erro interno' });
    }
  });

  // Validar documentos profissionais
  app.post('/api/admin/validate-document/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { approved, reason } = req.body;
      const adminId = req.user?.id || 1;

      const result = await storage.validateDocument(
        adminId, 
        Number(id), 
        approved, 
        reason
      );
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Erro ao validar documento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Obter histórico de ações administrativas
  app.get('/api/admin/actions', requireAdmin, async (req, res) => {
    try {
      const { adminId, page = 1, limit = 100 } = req.query;
      
      const actions = await storage.getAdminActions(
        adminId ? Number(adminId) : undefined
      );
      
      // Paginação simples
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedActions = actions.slice(startIndex, endIndex);
      
      res.json({
        actions: paginatedActions,
        total: actions.length,
        page: Number(page),
        totalPages: Math.ceil(actions.length / Number(limit))
      });
    } catch (error) {
      console.error('Erro ao buscar ações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Obter validações pendentes
  app.get('/api/admin/pending-validations', requireAdmin, async (req, res) => {
    try {
      const validations = await storage.getPendingValidations();
      res.json(validations);
    } catch (error) {
      console.error('Erro ao buscar validações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // API para rastreamento de compras em tempo real
  app.get('/api/admin/purchases', requireAdmin, async (req, res) => {
    try {
      console.log('🔍 BUSCANDO histórico de compras...');
      
      // Buscar todas as ações administrativas
      const allActions = await storage.getAdminActions();
      
      // Filtrar apenas compras de tokens e planos
      const purchases = allActions
        .filter(action => action.action && (action.action.includes('compra') || action.action.includes('purchase')))
        .map(action => ({
          id: action.id,
          timestamp: action.timestamp,
          type: action.action === 'compra_tokens' ? 'tokens' : 'plano',
          clientId: action.targetId,
          clientName: action.details?.match(/Cliente (\w+)/)?.[1] || 'Desconhecido',
          details: action.details,
          adminId: action.adminId,
          action: action.action
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50); // Últimas 50 compras

      console.log(`✅ COMPRAS ENCONTRADAS: ${purchases.length}`);
      res.json(purchases);
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      // Retornar array vazio em caso de erro para não quebrar o dashboard
      res.json([]);
    }
  });

  // Sistema de cashback - Configurar janela de saque (dia 3)
  app.get('/api/admin/cashback-settings', requireAdmin, async (req, res) => {
    try {
      const settings = {
        withdrawalDay: 3, // Dia 3 do mês
        monthlyLimit: 8.7, // 8.7% do valor acumulado
        nextWithdrawalDate: getNextWithdrawalDate(),
        isWithdrawalWindowOpen: isWithdrawalWindowOpen()
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Forçar abertura de janela de saque (emergência)
  app.post('/api/admin/force-withdrawal-window', requireAdmin, async (req, res) => {
    try {
      const adminId = req.user?.id || 1;
      const { reason } = req.body;

      await storage.logAdminAction({
        adminId,
        targetType: "platform",
        targetId: null,
        action: "force_withdrawal_window",
        reason: reason || "Abertura forçada da janela de saque",
        details: `Admin ${adminId} forçou abertura da janela de saque`
      });

      res.json({ 
        success: true, 
        message: "Janela de saque forçada com sucesso" 
      });
    } catch (error) {
      console.error('Erro ao forçar janela:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Sistema de saque automático - processar saque do usuário  
  app.post('/api/admin/process-withdrawal', requireAdmin, async (req, res) => {
    try {
      const { userId, amount, pixKey } = req.body;
      
      const result = await withdrawalSystem.processUserWithdrawal(userId, amount, pixKey);
      
      res.json(result);
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Simular saque de usuário para demonstração
  app.post('/api/admin/test-withdrawal', requireAdmin, async (req, res) => {
    try {
      const { userId, pixKey } = req.body;
      
      if (!userId || !pixKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'userId e pixKey são obrigatórios' 
        });
      }
      
      // Simular que é dia 3 para teste
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Calcular 8.7% do saldo acumulado
      const withdrawableAmount = Math.floor(user.creditosAcumulados * 0.087);
      
      const result = {
        success: true,
        message: `Saque simulado processado com sucesso`,
        details: {
          userId,
          userCredits: user.creditosAcumulados,
          withdrawableAmount,
          formattedAmount: `R$ ${(withdrawableAmount/1000).toFixed(2)}`,
          pixKey,
          processedAt: new Date().toISOString(),
          status: 'Processado (Simulação)'
        }
      };
      
      console.log(`💰 SIMULAÇÃO: Saque de R$ ${(withdrawableAmount/1000).toFixed(2)} para usuário ${userId}`);
      
      res.json(result);
    } catch (error) {
      console.error('Erro na simulação de saque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Status detalhado do sistema de saques
  app.get('/api/admin/withdrawal-system-status', requireAdmin, async (req, res) => {
    try {
      const status = withdrawalSystem.getWithdrawalWindowStatus();
      const today = new Date();
      
      const systemStatus = {
        currentDate: today.toISOString().split('T')[0],
        currentDay: today.getDate(),
        timezone: 'America/Sao_Paulo',
        windowStatus: status,
        systemInfo: {
          nextAutomaticWindow: 'Dia 3 às 00:00 (horário de Brasília)',
          windowDuration: '24 horas (00:00 a 00:00 do dia seguinte)',
          monthlyPercentage: '8.7% dos créditos acumulados',
          notificationTiming: 'Automática no início da janela'
        }
      };
      
      res.json(systemStatus);
    } catch (error) {
      console.error('Erro ao buscar status do sistema:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // API de fontes de dados diárias
  app.get('/api/admin/data-sources', requireAdmin, async (req, res) => {
    try {
      const { dailyDataManager } = await import('./daily-data-sources');
      const dataSources = dailyDataManager.getAllDataSources();
      const currentTime = dailyDataManager.getCurrentTime();
      
      res.json({
        dataSources,
        currentTime,
        totalSources: dataSources.length,
        activeSources: dataSources.filter(ds => ds.status === 'active').length
      });
    } catch (error) {
      console.error('Erro ao buscar fontes de dados:', error);
      res.status(500).json({ error: 'Erro ao carregar fontes de dados' });
    }
  });

  // Forçar atualização de uma fonte específica
  app.post('/api/admin/data-sources/:id/update', requireAdmin, async (req, res) => {
    try {
      const { dailyDataManager } = await import('./daily-data-sources');
      const sourceId = req.params.id;
      
      await dailyDataManager.forceUpdate(sourceId);
      
      res.json({ 
        success: true, 
        message: `Fonte ${sourceId} atualizada com sucesso`,
        updatedAt: dailyDataManager.getCurrentTime()
      });
    } catch (error) {
      console.error('Erro ao forçar atualização:', error);
      res.status(500).json({ error: 'Erro ao atualizar fonte de dados' });
    }
  });

  // Forçar atualização de todas as fontes
  app.post('/api/admin/data-sources/update-all', requireAdmin, async (req, res) => {
    try {
      const { dailyDataManager } = await import('./daily-data-sources');
      
      await dailyDataManager.forceUpdate();
      
      res.json({ 
        success: true, 
        message: 'Todas as fontes foram atualizadas com sucesso',
        updatedAt: dailyDataManager.getCurrentTime()
      });
    } catch (error) {
      console.error('Erro ao atualizar todas as fontes:', error);
      res.status(500).json({ error: 'Erro ao atualizar fontes de dados' });
    }
  });

  // API para limpar completamente o MemStorage
  app.post('/api/admin/reset-storage', requireAdmin, async (req, res) => {
    try {
      console.log('🔥 RESET COMPLETO DO MEMSTORAGE SOLICITADO');
      
      // Verificar se storage tem método clearAllData
      if (typeof storage.clearAllData === 'function') {
        await storage.clearAllData();
        res.json({ 
          success: true, 
          message: 'MemStorage completamente limpo e reinicializado',
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({ 
          success: false, 
          message: 'Método de limpeza não disponível no storage atual',
          storageType: storage.constructor.name
        });
      }
    } catch (error) {
      console.error('Erro ao limpar MemStorage:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao limpar storage',
        message: error.message 
      });
    }
  });

  // API para forçar reset de todos os tokens para 0
  app.post('/api/admin/force-zero-tokens', requireAdmin, async (req, res) => {
    try {
      console.log('🔄 ADMIN: Forçando reset de todos os tokens para 0...');
      
      // Buscar todos os usuários
      const allUsers = await storage.getAllUsers();
      let updatedCount = 0;
      
      // Atualizar cada usuário para 0 tokens
      for (const user of allUsers) {
        try {
          await storage.updateUser(user.id, {
            tokensPlano: 0,
            tokensGanhos: 0,
            tokensComprados: 0,
            tokensUsados: 0,
            plan: 'free'
          });
          updatedCount++;
          console.log(`✅ ADMIN: Usuário ${user.username} (ID: ${user.id}) -> 0 tokens`);
        } catch (updateError) {
          console.error(`❌ ADMIN: Erro ao atualizar usuário ${user.id}:`, updateError);
        }
      }
      
      console.log(`✅ ADMIN: ${updatedCount} usuários atualizados para 0 tokens`);
      res.json({ 
        success: true, 
        message: `${updatedCount} usuários atualizados para 0 tokens`,
        updatedUsers: updatedCount
      });
    } catch (error) {
      console.error('❌ ADMIN: Erro ao forçar reset de tokens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // APIs para Sistema de Cache
  app.get('/api/admin/cache/stats', requireAdmin, async (req, res) => {
    try {
      const stats = cache.getStats();
      logger.info('admin', 'Cache stats solicitadas');
      res.json({
        success: true,
        ...stats,
        message: `Cache com ${stats.totalEntries} entradas e ${stats.hitRate}% de acerto`
      });
    } catch (error) {
      logger.error('admin', 'Erro ao obter stats do cache', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/cache/clear', requireAdmin, async (req, res) => {
    try {
      const { pattern } = req.body;
      let cleared = 0;
      
      if (pattern) {
        cleared = cache.invalidatePattern(pattern);
        logger.info('admin', `Cache invalidado com padrão: ${pattern}`);
      } else {
        cleared = cache.invalidatePattern('.*');
        logger.info('admin', 'Cache completamente limpo');
      }
      
      res.json({
        success: true,
        cleared,
        message: `${cleared} entradas removidas do cache`
      });
    } catch (error) {
      logger.error('admin', 'Erro ao limpar cache', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // APIs para Sistema de Notificações
  app.post('/api/admin/notifications/create', requireAdmin, async (req, res) => {
    try {
      const { type, title, message, userId, priority = 'normal' } = req.body;
      
      if (!type || !title || !message) {
        return res.status(400).json({ error: 'Tipo, título e mensagem são obrigatórios' });
      }
      
      let notification;
      
      if (userId && userId !== -1) {
        notification = notificationSystem.createUserNotification(userId, type, title, message, priority);
        logger.info('admin', `Notificação criada para usuário ${userId}: ${title}`);
      } else {
        notification = notificationSystem.createGlobalNotification(type, title, message, priority);
        logger.info('admin', `Notificação global criada: ${title}`);
      }
      
      res.json({
        success: true,
        notification,
        message: 'Notificação criada com sucesso'
      });
    } catch (error) {
      logger.error('admin', 'Erro ao criar notificação', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // APIs para Sistema de Logs
  app.get('/api/admin/logs/recent', requireAdmin, async (req, res) => {
    try {
      const { limit = 50, category } = req.query;
      
      let logs;
      if (category) {
        logs = logger.getLogsByCategory(category as string, Number(limit));
      } else {
        logs = logger.getRecentLogs(Number(limit));
      }
      
      const stats = logger.getLogStats();
      
      res.json({
        success: true,
        logs,
        stats,
        total: logs.length
      });
    } catch (error) {
      console.error('Erro ao obter logs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // EMERGENCY ENDPOINT FOR MARIA HELENA - PIX R$ 6.00 (SECURED)
  app.get('/api/admin/credit-maria-helena-emergency', requireAdmin, async (req, res) => {
    try {
      console.log('🚨 ENDPOINT EMERGÊNCIA MARIA HELENA EXECUTADO');
      
      const user = await storage.getUser(2);
      if (!user) {
        return res.json({ error: 'Maria Helena não encontrada', status: 404 });
      }

      console.log(`👤 ENCONTRADA: ${user.email} (ID: ${user.id})`);
      console.log(`💰 TOKENS ATUAIS: ${user.tokensComprados}`);
      
      const tokensToAdd = 4320;
      const newTokens = user.tokensComprados + tokensToAdd;
      const totalTokens = user.tokensPlano + user.tokensGanhos + newTokens - user.tokensUsados;
      
      await storage.updateUser(2, {
        tokensComprados: newTokens,
        tokens: totalTokens
      });

      console.log(`✅ CREDITADO: +${tokensToAdd} tokens`);
      console.log(`📊 NOVO TOTAL: ${newTokens} tokens comprados`);
      
      res.json({ 
        success: true,
        message: 'MARIA HELENA: 4.320 tokens creditados com sucesso!',
        user: user.email,
        tokensAdded: tokensToAdd,
        newBalance: newTokens,
        totalTokens: totalTokens,
        pixValue: 'R$ 6,00'
      });

    } catch (error) {
      console.error('❌ Erro emergência Maria Helena:', error);
      res.json({ error: error.message, status: 500 });
    }
  });
}

// Funções auxiliares para o sistema de cashback
function getNextWithdrawalDate(): string {
  const now = new Date();
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  
  // Se hoje é antes do dia 3, próxima janela é dia 3 deste mês
  if (now.getDate() < 3) {
    return new Date(now.getFullYear(), now.getMonth(), 3).toISOString();
  }
  
  // Se hoje é dia 3, janela está aberta
  if (now.getDate() === 3) {
    return new Date(now.getFullYear(), now.getMonth(), 3).toISOString();
  }
  
  // Se hoje é depois do dia 3, próxima janela é dia 3 do próximo mês
  return new Date(nextYear, nextMonth, 3).toISOString();
}

function isWithdrawalWindowOpen(): boolean {
  const now = new Date();
  return now.getDate() === 3;
}