import cron from 'node-cron';
import moment from 'moment-timezone';
import { storage } from './storage';

/**
 * Sistema automático de saques Orbitrum Connect
 * - Abre janela de saque dia 3 às 00:00
 * - Fecha janela dia 4 às 00:00 (24h disponível)
 * - Envia notificações automáticas
 * - Processa saques via Mercado Pago
 */
export class WithdrawalSystem {
  private static instance: WithdrawalSystem;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): WithdrawalSystem {
    if (!WithdrawalSystem.instance) {
      WithdrawalSystem.instance = new WithdrawalSystem();
    }
    return WithdrawalSystem.instance;
  }

  private getBrazilTime(): moment.Moment {
    return moment().tz('America/Sao_Paulo');
  }

  private getCurrentBrazilDate(): string {
    return this.getBrazilTime().format('DD/MM/YYYY HH:mm:ss');
  }

  public initialize() {
    if (this.isInitialized) {
      return;
    }

    // Abre janela de saque: dia 3 às 00:00
    cron.schedule('0 0 3 * *', async () => {
      await this.openWithdrawalWindow();
    }, {
      timezone: "America/Sao_Paulo"
    });

    // Fecha janela de saque: dia 4 às 00:00
    cron.schedule('0 0 4 * *', async () => {
      await this.closeWithdrawalWindow();
    }, {
      timezone: "America/Sao_Paulo"
    });

    // Notificação dia 2->3 às 00:00 (aviso que abre amanhã)
    cron.schedule('0 0 3 * *', async () => {
      await this.sendWithdrawalNotifications();
    }, {
      timezone: "America/Sao_Paulo"
    });

    // Verifica janela atual na inicialização
    this.checkCurrentWithdrawalWindow();

    this.isInitialized = true;
  }

  private async openWithdrawalWindow() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Log do evento no sistema
    await storage.logSystemEvent(
      'WITHDRAWAL_WINDOW_OPENED',
      `Janela de saque aberta para ${dateStr}`,
      JSON.stringify({ date: dateStr, duration: '24h' })
    );

    // Calcular valores disponíveis para cada usuário
    const users = await storage.getAllUsersAdmin({});
    for (const user of users) {
      if (user.plan !== 'free') {
        // Calcular 8.7% do saldo acumulado do usuário
        const availableAmount = Math.floor(user.creditosAcumulados * 0.087);
        if (availableAmount > 0) {
          await storage.updateUserWithdrawalAmount(user.id, availableAmount);
          
          // Enviar notificação para o usuário
          await storage.createUserNotification({
            userId: user.id,
            title: '💰 Janela de Saque Aberta!',
            message: `Você pode sacar até R$ ${(availableAmount/1000).toFixed(2)} nas próximas 24h.`,
            type: 'withdrawal_available',
            urgent: true
          });
        }
      }
    }

  }

  private async closeWithdrawalWindow() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Log do evento no sistema  
    await storage.logSystemEvent(
      'WITHDRAWAL_WINDOW_CLOSED',
      `Janela de saque fechada para ${dateStr}`,
      JSON.stringify({ date: dateStr, action: 'returned_to_pool' })
    );

    // Retornar valores não utilizados para a pool
    const users = await storage.getAllUsersAdmin({});
    let totalReturned = 0;
    
    for (const user of users) {
      if (user.saqueDisponivel > 0) {
        totalReturned += user.saqueDisponivel;
        await storage.updateUserWithdrawalAmount(user.id, 0);
        
        // Notificar usuário sobre expiração
        await storage.createUserNotification({
          userId: user.id,
          title: '⏰ Janela de Saque Expirada',
          message: `Sua oportunidade de saque expirou. Próxima janela: dia 3 do próximo mês.`,
          type: 'withdrawal_reminder',
          urgent: false
        });
      }
    }

  }

  private async sendWithdrawalNotifications() {
    const users = await storage.getAllUsersAdmin({});
    let notificationsSent = 0;
    
    for (const user of users) {
      if (user.plan !== 'free' && user.notificacaoSaque) {
        await storage.createUserNotification({
          userId: user.id,
          title: '🚨 Janela de Saque Hoje!',
          message: 'A janela de saque está aberta por 24h. Acesse agora e retire seus créditos.',
          type: 'withdrawal_available',
          urgent: true
        });
        notificationsSent++;
      }
    }

  }

  private checkCurrentWithdrawalWindow() {
    const today = new Date();
    const day = today.getDate();
    
    if (day === 3) {
      // Janela ativa
    } else {
      // Janela fechada
    }
  }

  public async processUserWithdrawal(userId: number, amount: number, pixKey: string): Promise<{success: boolean, message: string}> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    // Verificar se janela está aberta
    const today = new Date();
    if (today.getDate() !== 3) {
      return { success: false, message: 'Janela de saque fechada. Disponível apenas no dia 3 de cada mês.' };
    }

    // Verificar saldo disponível
    if (amount > user.saqueDisponivel) {
      return { success: false, message: `Valor indisponível. Máximo: R$ ${(user.saqueDisponivel/1000).toFixed(2)}` };
    }

    // Processar saque via Mercado Pago
    const withdrawal = {
      userId,
      amount,
      pixKey,
      windowDate: today.toISOString().split('T')[0]
    };

    try {
      const result = await storage.processWithdrawal(withdrawal);
      
      if (result.success) {
        // Atualizar saldos do usuário
        await storage.updateUserWithdrawalAmount(userId, user.saqueDisponivel - amount);
        await storage.updateUserTotalWithdrawn(userId, user.creditosSacados + amount);
        
        // Notificar sucesso
        await storage.createUserNotification({
          userId,
          title: '✅ Saque Processado!',
          message: `Saque de R$ ${(amount/1000).toFixed(2)} processado via PIX. Chegará em até 2h úteis.`,
          type: 'withdrawal_reminder',
          urgent: false
        });

        return { success: true, message: 'Saque processado com sucesso! Valor chegará via PIX em até 2h úteis.' };
      }
      
      return { success: false, message: 'Erro ao processar saque. Tente novamente.' };
      
    } catch (error) {
      console.error('Erro no processamento de saque:', error);
      return { success: false, message: 'Erro interno. Contate o suporte.' };
    }
  }

  public getWithdrawalWindowStatus(): {isOpen: boolean, nextWindow: string, timeRemaining?: string} {
    const today = new Date();
    const day = today.getDate();
    
    if (day === 3) {
      // Calcular tempo restante até meia-noite
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - today.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        isOpen: true,
        nextWindow: 'Próximo mês - dia 3',
        timeRemaining: `${hours}h ${minutes}min restantes`
      };
    }
    
    const nextWindowDate = day < 3 ? 'dia 3 deste mês' : 'dia 3 do próximo mês';
    return {
      isOpen: false,
      nextWindow: nextWindowDate
    };
  }
}

export const withdrawalSystem = WithdrawalSystem.getInstance();