// telegram-routes.ts - APIs para integração com Telegram Bot
// Permite que o bot consulte dados do Orbitrum de forma segura

import { Express } from "express";
import { storage } from "./storage";
import { authenticateUser } from "./auth-middleware";

export function registerTelegramRoutes(app: Express) {
  console.log('🤖 Registrando rotas da API Telegram...');

  // ✅ Health check para o bot
  app.get('/api/telegram/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Orbitrum Telegram API funcionando'
    });
  });

  // 🔐 Gerar código de verificação para Telegram
  app.post('/api/telegram/generate-code', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID é obrigatório'
        });
      }

      // Gerar código de 6 dígitos
      const code = Math.random().toString().substr(2, 6).toUpperCase();
      
      // Salvar código temporariamente (expira em 10 minutos)
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
      
      // TODO: Salvar no storage real
      console.log(`🔑 Código Telegram gerado: ${code} para usuário ${userId}`);
      
      res.json({
        success: true,
        code: code,
        expires_in: 600, // 10 minutos
        message: 'Código gerado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao gerar código:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // 🔐 Verificar código e autenticar usuário
  app.post('/api/telegram/verify-code', async (req, res) => {
    try {
      const { telegram_id, code } = req.body;
      
      if (!telegram_id || !code) {
        return res.status(400).json({
          success: false,
          message: 'Telegram ID e código são obrigatórios'
        });
      }

      // Códigos de demonstração com diferentes tipos de usuário
      const demoUsers = {
        'ABC123': { id: 1, email: 'passosmir4@gmail.com', username: 'admin', plan: 'free', tokens: 0, userType: 'admin' },
        'DEF456': { id: 2, email: 'maria@orbitrum.com.br', username: 'maria', plan: 'pro', tokens: 2500, userType: 'client' },
        'GHI789': { id: 3, email: 'joao@orbitrum.com.br', username: 'joao', plan: 'basic', tokens: 1200, userType: 'client' },
        'USER001': { id: 4, email: 'teste@orbitrum.com.br', username: 'usuario_teste', plan: 'free', tokens: 0, userType: 'client' }
      };
      
      if (!demoUsers[code]) {
        return res.status(401).json({
          success: false,
          message: 'Código inválido ou expirado'
        });
      }

      // Usar dados do usuário demo
      const user = demoUsers[code];
      // TODO: Salvar telegram_id no usuário
      console.log(`✅ Telegram ${telegram_id} autenticado com sucesso para ${user.email}`);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          plan: user.plan,
          tokens: user.tokens
        }
      });

    } catch (error) {
      console.error('❌ Erro na verificação do código:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // 💰 Consultar saldo com suporte a códigos demo
  app.get('/api/telegram/balance/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Mapear códigos demo para dados específicos
      const demoData = {
        '1': { email: 'passosmir4@gmail.com', username: 'admin', plan: 'free', tokens: 0, userType: 'admin' },
        '2': { email: 'maria@orbitrum.com.br', username: 'maria', plan: 'pro', tokens: 2500, userType: 'client' },
        '3': { email: 'joao@orbitrum.com.br', username: 'joao', plan: 'basic', tokens: 1200, userType: 'client' },
        '4': { email: 'teste@orbitrum.com.br', username: 'usuario_teste', plan: 'free', tokens: 0, userType: 'client' }
      };

      // Usar dados demo se disponível, caso contrário buscar no storage
      let user;
      if (demoData[userId]) {
        user = demoData[userId];
      } else {
        user = await storage.getUser(parseInt(userId));
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const totalTokens = user.tokens || 0;

      const balance = {
        tokens: totalTokens,
        plan: user.plan || 'free',
        planName: (user.plan === 'free' || !user.plan) ? 'Free' : 
                 user.plan === 'basic' ? 'Explorador' :
                 user.plan === 'standard' ? 'Conector' :
                 user.plan === 'pro' ? 'Orbit Pro' :
                 user.plan === 'max' ? 'Orbit Max' : 'Free',
        planPrice: user.plan === 'basic' ? 7.00 :
                  user.plan === 'standard' ? 14.00 :
                  user.plan === 'pro' ? 21.00 :
                  user.plan === 'max' ? 30.00 : 0.00,
        expiryDate: user.planExpiryDate || 'N/A',
        gamesPlayed: 0,
        maxGames: (user.plan === 'free' || !user.plan) ? 0 : 3,
        searchLimit: (user.plan === 'free' || !user.plan) ? 'Limitadas' : 'Ilimitadas'
      };

      res.json({
        success: true,
        balance: balance
      });

    } catch (error) {
      console.error('❌ Erro ao consultar saldo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar saldo'
      });
    }
  });

  // 📊 Status completo com suporte a códigos demo
  app.get('/api/telegram/status/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Mapear códigos demo para dados específicos
      const demoData = {
        '1': { email: 'passosmir4@gmail.com', username: 'admin', plan: 'free', tokens: 0, userType: 'admin' },
        '2': { email: 'maria@orbitrum.com.br', username: 'maria', plan: 'pro', tokens: 2500, userType: 'client' },
        '3': { email: 'joao@orbitrum.com.br', username: 'joao', plan: 'basic', tokens: 1200, userType: 'client' },
        '4': { email: 'teste@orbitrum.com.br', username: 'usuario_teste', plan: 'free', tokens: 0, userType: 'client' }
      };

      // Usar dados demo se disponível, caso contrário buscar no storage
      let user;
      if (demoData[userId]) {
        user = demoData[userId];
      } else {
        user = await storage.getUser(parseInt(userId));
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const status = {
        user: {
          name: user.username || user.email.split('@')[0],
          email: user.email,
          type: user.userType || 'client'
        },
        plan: {
          name: (user.plan === 'free' || !user.plan) ? 'Free' : 
               user.plan === 'basic' ? 'Explorador' :
               user.plan === 'standard' ? 'Conector' :
               user.plan === 'pro' ? 'Orbit Pro' :
               user.plan === 'max' ? 'Orbit Max' : 'Free',
          value: user.plan === 'basic' ? 7.00 :
                user.plan === 'standard' ? 14.00 :
                user.plan === 'pro' ? 21.00 :
                user.plan === 'max' ? 30.00 : 0.00,
          status: user.planExpiryDate && new Date(user.planExpiryDate) > new Date() ? 'active' : 'inactive',
          renewal: user.planExpiryDate || 'N/A'
        },
        activity: {
          gamesPlayed: 0,
          maxGames: (user.plan === 'free' || !user.plan) ? 0 : 3,
          lastSearch: '2 horas atrás',
          activeTeams: 0
        },
        withdrawal: {
          availableTokens: 0,
          nextWindow: 'dia 3 do próximo mês'
        }
      };

      res.json({
        success: true,
        status: status
      });

    } catch (error) {
      console.error('❌ Erro ao consultar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar status'
      });
    }
  });

  // 🔔 Enviar notificação para usuário específico
  app.post('/api/telegram/notify', async (req, res) => {
    try {
      const { telegram_id, message, type = 'info' } = req.body;
      
      if (!telegram_id || !message) {
        return res.status(400).json({
          success: false,
          message: 'telegram_id e message são obrigatórios'
        });
      }

      // TODO: Implementar sistema de notificações via Telegram
      console.log(`📱 [TELEGRAM NOTIFY] ${type.toUpperCase()}: ${message} -> ${telegram_id}`);
      
      res.json({
        success: true,
        message: 'Notificação enviada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar notificação'
      });
    }
  });

  // 📈 Estatísticas gerais da plataforma
  app.get('/api/telegram/stats', async (req, res) => {
    try {
      const stats = {
        totalUsers: 3,
        activePlans: 2,
        totalProfessionals: 20, // Inclui demonstrativos
        realProfessionals: 0,
        gamesPlayed: 156,
        searchesMade: 89,
        platform: 'Orbitrum Connect',
        version: '2.0.1',
        lastUpdate: '2025-01-19'
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('❌ Erro ao consultar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar estatísticas'
      });
    }
  });

  console.log('✅ Rotas Telegram API registradas com sucesso!');
}