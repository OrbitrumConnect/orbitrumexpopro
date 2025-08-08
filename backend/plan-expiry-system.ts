import cron from 'node-cron';
import moment from 'moment-timezone';
import { storage } from './storage';

interface PlanExpiryNotification {
  userId: string;
  planName: string;
  expiryDate: Date;
  daysRemaining: number;
  lastNotified?: Date;
}

class PlanExpirySystem {
  private static instance: PlanExpirySystem;
  private notifications: Map<string, PlanExpiryNotification> = new Map();

  static getInstance(): PlanExpirySystem {
    if (!PlanExpirySystem.instance) {
      PlanExpirySystem.instance = new PlanExpirySystem();
    }
    return PlanExpirySystem.instance;
  }

  initialize() {
    console.log('🚀 Inicializando sistema de expiração de planos... (Horário de Brasília)');
    
    // Cron job para verificar expirações todos os dias ao meio-dia (12:00)
    cron.schedule('0 12 * * *', () => {
      this.checkPlanExpiries();
    }, {
      timezone: 'America/Sao_Paulo'
    });

    // Verificação inicial
    this.checkPlanExpiries();
  }

  private async checkPlanExpiries() {
    try {
      const now = moment().tz('America/Sao_Paulo');
      console.log(`🔍 Verificando expirações de planos - ${now.format('DD/MM/YYYY HH:mm:ss')}`);

      // Buscar todos os usuários com planos ativos
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        if (user.plan && user.plan !== 'free' && user.planExpiryDate) {
          const expiryDate = moment(user.planExpiryDate).tz('America/Sao_Paulo');
          const daysRemaining = expiryDate.diff(now, 'days');
          
          // Verificar se deve notificar (5 dias antes)
          if (daysRemaining === 5) {
            await this.sendExpiryNotification(user, daysRemaining);
          }
          
          // Verificar se o plano expirou
          if (daysRemaining <= 0) {
            await this.expirePlan(user);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar expirações de planos:', error);
    }
  }

  private async sendExpiryNotification(user: any, daysRemaining: number) {
    const userId = user.id.toString();
    const today = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
    
    // Verificar se já foi notificado hoje
    const notification = this.notifications.get(userId);
    if (notification && notification.lastNotified && 
        moment(notification.lastNotified).format('YYYY-MM-DD') === today) {
      return; // Já notificado hoje
    }

    // Criar notificação
    const newNotification: PlanExpiryNotification = {
      userId,
      planName: user.plan,
      expiryDate: user.planExpiryDate,
      daysRemaining,
      lastNotified: new Date()
    };

    this.notifications.set(userId, newNotification);

    // Salvar notificação no storage para exibir no frontend
    await storage.createUserNotification({
      userId: user.id,
      type: 'plan_expiry_warning',
      title: 'Plano Expirando',
      message: `Seu plano ${user.plan.toUpperCase()} expira em ${daysRemaining} dias!`,
      data: { daysRemaining, planName: user.plan },
      expiresAt: moment().add(10, 'seconds').toDate() // Expira em 10 segundos
    });

    console.log(`⚠️ Notificação enviada para ${user.username}: Plano ${user.plan} expira em ${daysRemaining} dias`);
  }

  private async expirePlan(user: any) {
    try {
      console.log(`⏰ Expirando plano ${user.plan} do usuário ${user.username}`);
      
      // Atualizar usuário para plano free
      await storage.updateUserPlan(user.id, {
        plan: 'free',
        planExpiryDate: null,
        planActivatedAt: null
      });

      // Criar notificação de expiração
      await storage.createUserNotification({
        userId: user.id,
        type: 'plan_expired',
        title: 'Plano Expirado',
        message: `Seu plano ${user.plan.toUpperCase()} expirou. Você foi movido para o plano FREE.`,
        data: { expiredPlan: user.plan },
        expiresAt: moment().add(1, 'day').toDate() // Expira em 1 dia
      });

      console.log(`✅ Plano ${user.plan} expirado para ${user.username} - movido para FREE`);
    } catch (error) {
      console.error('❌ Erro ao expirar plano:', error);
    }
  }

  // Método para ativar um novo plano
  async activatePlan(userId: number, planId: string) {
    const now = moment().tz('America/Sao_Paulo');
    const expiryDate = now.clone().add(31, 'days'); // 30 dias + 23:59 = 31 dias

    await storage.updateUserPlan(userId, {
      plan: planId,
      planActivatedAt: now.toDate(),
      planExpiryDate: expiryDate.toDate()
    });

    console.log(`✅ Plano ${planId} ativado para usuário ${userId} - expira em ${expiryDate.format('DD/MM/YYYY HH:mm:ss')}`);
    
    return {
      plan: planId,
      activatedAt: now.toDate(),
      expiryDate: expiryDate.toDate()
    };
  }

  // Método para verificar se usuário pode comprar novo plano - BLOQUEIO TOTAL até expiração
  canPurchaseNewPlan(user: any): { canPurchase: boolean; reason?: string; daysRemaining?: number } {
    // Usuários sem plano ou com plano free podem comprar
    if (!user.plan || user.plan === 'free' || !user.planExpiryDate) {
      return { canPurchase: true };
    }

    const now = moment().tz('America/Sao_Paulo');
    const expiryDate = moment(user.planExpiryDate).tz('America/Sao_Paulo');
    const daysRemaining = Math.ceil(expiryDate.diff(now, 'days', true));

    // REGRA RÍGIDA: Só pode comprar PLANOS após a expiração completa (daysRemaining <= 0)
    // TOKENS podem ser comprados normalmente na loja "+Tokens"
    if (daysRemaining > 0) {
      return {
        canPurchase: false,
        reason: `Você possui um plano ${user.plan.toUpperCase()} ativo até ${expiryDate.format('DD/MM/YYYY')}. Novos planos só podem ser adquiridos após a expiração completa. Você pode comprar tokens extras na loja "+Tokens".`,
        daysRemaining
      };
    }

    // Plano expirado - pode comprar novo
    return { canPurchase: true };
  }
}

export const planExpirySystem = PlanExpirySystem.getInstance();