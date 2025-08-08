import { EventEmitter } from 'events';
import type { User } from '../shared/schema';

interface Notification {
  id: string;
  userId: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

class NotificationSystem extends EventEmitter {
  private notifications: Map<number, Notification[]> = new Map();
  private globalNotifications: Notification[] = [];

  // Criar notificação para usuário específico
  createUserNotification(
    userId: number, 
    type: Notification['type'], 
    title: string, 
    message: string,
    priority: Notification['priority'] = 'normal'
  ): Notification {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      createdAt: new Date(),
      read: false,
      priority
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    this.notifications.get(userId)!.unshift(notification);
    
    // Manter apenas 50 notificações por usuário
    if (this.notifications.get(userId)!.length > 50) {
      this.notifications.get(userId)!.splice(50);
    }

    // Emitir evento para WebSocket
    this.emit('userNotification', { userId, notification });
    
    console.log(`📧 Notificação criada para usuário ${userId}: ${title}`);
    return notification;
  }

  // Criar notificação global (todos os usuários)
  createGlobalNotification(
    type: Notification['type'], 
    title: string, 
    message: string,
    priority: Notification['priority'] = 'normal'
  ): Notification {
    const notification: Notification = {
      id: `global-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: -1, // -1 indica notificação global
      type,
      title,
      message,
      createdAt: new Date(),
      read: false,
      priority
    };

    this.globalNotifications.unshift(notification);
    
    // Manter apenas 20 notificações globais
    if (this.globalNotifications.length > 20) {
      this.globalNotifications.splice(20);
    }

    // Emitir evento para WebSocket
    this.emit('globalNotification', { notification });
    
    console.log(`📢 Notificação global criada: ${title}`);
    return notification;
  }

  // Buscar notificações do usuário
  getUserNotifications(userId: number, limit: number = 10): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];
    const globalNotifications = this.globalNotifications.slice(0, 5); // Máximo 5 globais
    
    return [...userNotifications, ...globalNotifications]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Marcar notificação como lida
  markAsRead(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        return true;
      }
    }

    // Verificar notificações globais
    const globalNotification = this.globalNotifications.find(n => n.id === notificationId);
    if (globalNotification) {
      globalNotification.read = true;
      return true;
    }

    return false;
  }

  // Marcar todas como lidas
  markAllAsRead(userId: number): number {
    let count = 0;
    const userNotifications = this.notifications.get(userId);
    
    if (userNotifications) {
      userNotifications.forEach(n => {
        if (!n.read) {
          n.read = true;
          count++;
        }
      });
    }

    return count;
  }

  // Contar notificações não lidas
  getUnreadCount(userId: number): number {
    const userNotifications = this.notifications.get(userId) || [];
    const unreadGlobal = this.globalNotifications.filter(n => !n.read).length;
    const unreadUser = userNotifications.filter(n => !n.read).length;
    
    return unreadUser + Math.min(unreadGlobal, 5); // Máximo 5 globais contam
  }

  // Notificações do sistema automáticas
  notifyNewUser(user: User): void {
    this.createGlobalNotification(
      'info',
      '👋 Novo usuário registrado',
      `${user.username} acabou de se juntar ao Orbitrum Connect`,
      'normal'
    );
  }

  notifySystemUpdate(message: string): void {
    this.createGlobalNotification(
      'info',
      '🔄 Atualização do Sistema',
      message,
      'normal'
    );
  }

  notifyMaintenanceMode(enabled: boolean): void {
    this.createGlobalNotification(
      enabled ? 'warning' : 'success',
      enabled ? '🚧 Manutenção Programada' : '✅ Manutenção Concluída',
      enabled 
        ? 'O sistema entrará em manutenção em breve. Salve seu progresso.'
        : 'O sistema está funcionando normalmente.',
      'high'
    );
  }

  notifyPlanExpiry(userId: number, plan: string, daysLeft: number): void {
    const urgency = daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'high' : 'normal';
    
    this.createUserNotification(
      userId,
      daysLeft <= 3 ? 'warning' : 'info',
      '⏰ Plano próximo do vencimento',
      `Seu plano ${plan} vence em ${daysLeft} dias. Renove para manter os benefícios.`,
      urgency
    );
  }

  notifyTokensLow(userId: number, currentTokens: number): void {
    if (currentTokens <= 500) {
      this.createUserNotification(
        userId,
        'warning',
        '🪙 Tokens em baixa',
        `Você tem apenas ${currentTokens} tokens restantes. Considere comprar mais.`,
        'normal'
      );
    }
  }

  // Limpar notificações antigas (executar periodicamente)
  cleanupOldNotifications(): number {
    let cleaned = 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Limpar notificações de usuários
    for (const [userId, notifications] of this.notifications.entries()) {
      const before = notifications.length;
      this.notifications.set(
        userId, 
        notifications.filter(n => n.createdAt > thirtyDaysAgo)
      );
      cleaned += before - this.notifications.get(userId)!.length;
    }

    // Limpar notificações globais
    const beforeGlobal = this.globalNotifications.length;
    this.globalNotifications = this.globalNotifications.filter(n => n.createdAt > thirtyDaysAgo);
    cleaned += beforeGlobal - this.globalNotifications.length;

    if (cleaned > 0) {
      console.log(`🧹 Limpeza automática: ${cleaned} notificações antigas removidas`);
    }

    return cleaned;
  }
}

// Instância única do sistema de notificações
export const notificationSystem = new NotificationSystem();

// Limpeza automática a cada 24 horas
setInterval(() => {
  notificationSystem.cleanupOldNotifications();
}, 24 * 60 * 60 * 1000);