import { Express } from 'express';
import { IStorage } from './storage';

// Sistema de notificações push para Telegram
export class TelegramNotificationService {
  private static instance: TelegramNotificationService;
  private notifications: Map<string, any[]> = new Map(); // telegram_id -> notifications[]
  
  static getInstance(): TelegramNotificationService {
    if (!TelegramNotificationService.instance) {
      TelegramNotificationService.instance = new TelegramNotificationService();
    }
    return TelegramNotificationService.instance;
  }

  // 📨 Adicionar notificação para usuário
  addNotification(telegram_id: string, notification: any) {
    if (!this.notifications.has(telegram_id)) {
      this.notifications.set(telegram_id, []);
    }
    
    const userNotifications = this.notifications.get(telegram_id)!;
    userNotifications.push({
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    
    console.log(`📨 Notificação adicionada para Telegram ${telegram_id}:`, notification.message);
  }

  // 📨 Buscar notificações pendentes
  getPendingNotifications(telegram_id: string) {
    return this.notifications.get(telegram_id) || [];
  }

  // 📨 Marcar notificação como lida
  markAsRead(telegram_id: string, notification_id: string) {
    const userNotifications = this.notifications.get(telegram_id);
    if (userNotifications) {
      const index = userNotifications.findIndex(n => n.id === notification_id);
      if (index !== -1) {
        userNotifications.splice(index, 1);
      }
    }
  }

  // 🔔 Enviar notificação push (integração futura com Bot API)
  async sendPushNotification(telegram_id: string, message: string, type: string = 'info') {
    try {
      // TODO: Integrar com Bot API para envio direto
      console.log(`🔔 Push notification para ${telegram_id}: ${message}`);
      
      // Por enquanto, armazenar para consulta
      this.addNotification(telegram_id, {
        type,
        message,
        push: true
      });
      
      return { success: true, message: 'Notificação enviada' };
    } catch (error) {
      console.error('❌ Erro ao enviar push notification:', error);
      return { success: false, error: 'Falha no envio' };
    }
  }
}

export function setupTelegramNotificationRoutes(app: Express, storage: IStorage) {
  const notificationService = TelegramNotificationService.getInstance();

  // 📨 Buscar notificações pendentes para usuário
  app.get('/api/telegram/notifications/:telegram_id', async (req, res) => {
    try {
      const { telegram_id } = req.params;
      const notifications = notificationService.getPendingNotifications(telegram_id);
      
      res.json({
        success: true,
        notifications: notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar notificações'
      });
    }
  });

  // 🔔 Enviar notificação push
  app.post('/api/telegram/push-notification', async (req, res) => {
    try {
      const { telegram_id, message, type } = req.body;
      
      if (!telegram_id || !message) {
        return res.status(400).json({
          success: false,
          message: 'Telegram ID e mensagem são obrigatórios'
        });
      }
      
      const result = await notificationService.sendPushNotification(telegram_id, message, type);
      res.json(result);
    } catch (error) {
      console.error('❌ Erro ao enviar push notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar notificação'
      });
    }
  });

  // 📨 Marcar notificação como lida
  app.post('/api/telegram/mark-read', async (req, res) => {
    try {
      const { telegram_id, notification_id } = req.body;
      
      if (!telegram_id || !notification_id) {
        return res.status(400).json({
          success: false,
          message: 'Telegram ID e notification ID são obrigatórios'
        });
      }
      
      notificationService.markAsRead(telegram_id, notification_id);
      
      res.json({
        success: true,
        message: 'Notificação marcada como lida'
      });
    } catch (error) {
      console.error('❌ Erro ao marcar notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar notificação'
      });
    }
  });

  // 🎮 Eventos automáticos do sistema que geram notificações
  
  // Sistema real: Notificar sobre novos tokens de jogos
  app.post('/api/telegram/auto-notify/game-tokens', async (req, res) => {
    try {
      const { user_id, tokens_earned, game_score } = req.body;
      
      // Sistema de notificações reais - requer usuário autenticado
      const user = await storage.getUser(user_id);
      if (!user || !user.telegramId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Usuário não encontrado ou sem Telegram vinculado' 
        });
      }
      
      await notificationService.sendPushNotification(
        user.telegramId,
        `🎮 Parabéns! Você ganhou ${tokens_earned} tokens no jogo! Pontuação: ${game_score}`,
        'game_reward'
      );
      
      res.json({
        success: true,
        message: 'Notificação de jogo enviada'
      });
    } catch (error) {
      console.error('❌ Erro na notificação automática:', error);
      res.status(500).json({
        success: false,
        message: 'Erro na notificação automática'
      });
    }
  });

  // Sistema real: Notificar sobre expiração de plano
  app.post('/api/telegram/auto-notify/plan-expiry', async (req, res) => {
    try {
      const { user_id, days_remaining, plan_name } = req.body;
      
      // Sistema de notificações reais - requer usuário autenticado
      const user = await storage.getUser(user_id);
      if (!user || !user.telegramId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Usuário não encontrado ou sem Telegram vinculado' 
        });
      }
      
      await notificationService.sendPushNotification(
        user.telegramId,
        `⏰ Seu plano ${plan_name} expira em ${days_remaining} dias. Renove para continuar aproveitando todos os benefícios!`,
        'plan_warning'
      );
      
      res.json({
        success: true,
        message: 'Notificação de plano enviada'
      });
    } catch (error) {
      console.error('❌ Erro na notificação de plano:', error);
      res.status(500).json({
        success: false,
        message: 'Erro na notificação de plano'
      });
    }
  });

  console.log('📨 Sistema de notificações Telegram configurado');
}