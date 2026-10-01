/**
 * Sistema de Referral Promocional Orbitrum Connect
 * 
 * CAMPANHA INICIAL:
 * - 100 clientes iniciais com plano Max grátis por 1 mês
 * - Cada cliente pode convidar 3 profissionais
 * - Total: 400 usuários (100 clientes + 300 profissionais)
 * - Bônus: 3 referrals = +1 mês grátis (total 2 meses)
 * - Após expiração: clientes sem renovação são removidos, profissionais mantidos restritos
 */

import moment from 'moment-timezone';
import crypto from 'crypto';
import { storage } from './storage';

export interface ReferralCampaign {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  requiredReferrals: number;
  bonusMonths: number;
  planOffered: string;
  isActive: boolean;
}

export interface ReferralLink {
  code: string;
  url: string;
  expiresAt: Date;
}

export class ReferralSystem {
  private static instance: ReferralSystem;
  
  static getInstance(): ReferralSystem {
    if (!this.instance) {
      this.instance = new ReferralSystem();
    }
    return this.instance;
  }

  /**
   * Cria a campanha inicial de 100 clientes
   */
  async createInitialCampaign(): Promise<ReferralCampaign> {
    const now = moment().tz('America/Sao_Paulo');
    const endDate = moment('2025-09-19').tz('America/Sao_Paulo'); // Até 19/09/2025

    const campaign = {
      name: "Campanha 100 Clientes Iniciais",
      description: "100 clientes + 300 profissionais com plano Max grátis. Bonus de +1 mês para quem trouxer 3 referrals.",
      startDate: now.toDate(),
      endDate: endDate.toDate(),
      maxParticipants: 100, // Apenas 100 clientes iniciais
      currentParticipants: 0,
      requiredReferrals: 3, // Precisa trazer 3 profissionais
      bonusMonths: 1, // +1 mês extra (total 2 meses)
      planOffered: "max",
      isActive: true
    };

    // Salvar no storage (se disponível) ou manter em memória
    return campaign as ReferralCampaign;
  }

  /**
   * Gera código único de referral para usuário
   */
  generateReferralCode(userId: number, email: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${userId}_${email}_${Date.now()}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
    
    return `ORB${hash}`;
  }

  /**
   * Cria link de referral promocional
   */
  async createReferralLink(userId: number, userType: 'client' | 'professional' = 'client'): Promise<ReferralLink> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const code = this.generateReferralCode(userId, user.email);
    const url = `https://www.orbitrum.com.br/cadastro?ref=${code}&type=${userType}`;
    const expiresAt = moment().tz('America/Sao_Paulo').add(2, 'months').toDate();

    // Atualizar usuário com código promocional
    await storage.updateUser(userId, {
      isPromotionalUser: true,
      promotionalCode: code,
      promotionalPhase: 'active'
    });

    return {
      code,
      url,
      expiresAt
    };
  }

  /**
   * Convida 100 clientes iniciais e ativa plano Max por 1 mês
   */
  async inviteInitialClients(clientEmails: string[]): Promise<{ success: string[], failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];
    const maxClients = 100;

    for (let i = 0; i < Math.min(clientEmails.length, maxClients); i++) {
      const email = clientEmails[i];
      
      try {
        // Verificar se já existe
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          failed.push(`${email} - Já cadastrado`);
          continue;
        }

        // Criar usuário promocional
        const promotionalUser = {
          username: email.split('@')[0],
          email: email,
          emailVerified: false,
          userType: 'client',
          plan: 'max', // Plano Max grátis
          tokens: 30000, // Tokens do plano Max
          tokensPlano: 30000,
          isPromotionalUser: true,
          promotionalPhase: 'active',
          planActivatedAt: new Date(),
          planExpiryDate: moment().tz('America/Sao_Paulo').add(1, 'month').toDate(),
          promotionalPlanExpiry: moment().tz('America/Sao_Paulo').add(1, 'month').toDate()
        };

        const newUser = await storage.createUser(promotionalUser);
        
        // Gerar código de referral
        const referralLink = await this.createReferralLink(newUser.id, 'professional');
        
        success.push(`${email} - Plano Max ativado até ${moment(promotionalUser.planExpiryDate).format('DD/MM/YYYY')}`);

      } catch (error) {
        failed.push(`${email} - Erro: ${error}`);
        console.error(`❌ Erro ao convidar ${email}:`, error);
      }
    }

    return { success, failed };
  }

  /**
   * Processa cadastro via link de referral
   */
  async processReferralSignup(referralCode: string, newUserData: any): Promise<{ success: boolean, message: string, bonusApplied?: boolean }> {
    try {
      // Buscar quem gerou o código
      const referrer = await storage.getUserByPromotionalCode(referralCode);
      if (!referrer) {
        return { success: false, message: 'Código de referral inválido' };
      }

      // Verificar se campanha ainda está ativa
      if (referrer.promotionalPhase !== 'active') {
        return { success: false, message: 'Campanha promocional expirada' };
      }

      // Criar o novo usuário (profissional)
      const newUserFullData = {
        ...newUserData,
        userType: 'professional',
        plan: 'max', // Plano Max grátis
        tokens: 30000,
        tokensPlano: 30000,
        isPromotionalUser: true,
        promotionalPhase: 'active',
        referredBy: referralCode,
        planActivatedAt: new Date(),
        planExpiryDate: moment().tz('America/Sao_Paulo').add(1, 'month').toDate(),
        promotionalPlanExpiry: moment().tz('America/Sao_Paulo').add(1, 'month').toDate()
      };

      const newUser = await storage.createUser(newUserFullData);

      // Incrementar contador de referrals do cliente
      const updatedReferralCount = (referrer.referralCount || 0) + 1;
      let bonusApplied = false;

      // Verificar se atingiu meta (3 referrals = +1 mês)
      if (updatedReferralCount === 3) {
        const newExpiryDate = moment(referrer.promotionalPlanExpiry || referrer.planExpiryDate)
          .add(1, 'month')
          .toDate();

        await storage.updateUser(referrer.id, {
          referralCount: updatedReferralCount,
          promotionalBonusMonths: 1,
          promotionalPlanExpiry: newExpiryDate,
          planExpiryDate: newExpiryDate
        });

        bonusApplied = true;
      } else {
        await storage.updateUser(referrer.id, {
          referralCount: updatedReferralCount
        });
      }

      return {
        success: true,
        message: `Cadastro realizado com sucesso! Plano Max ativo por 1 mês.`,
        bonusApplied
      };

    } catch (error) {
      console.error('❌ Erro ao processar referral:', error);
      return { success: false, message: 'Erro interno ao processar convite' };
    }
  }

  /**
   * Expira usuários da campanha promocional
   */
  async expirePromotionalUsers(): Promise<{ clientsRemoved: number, professionalsRestricted: number }> {
    const now = moment().tz('America/Sao_Paulo');
    let clientsRemoved = 0;
    let professionalsRestricted = 0;

    try {
      // Buscar usuários promocionais expirados
      const expiredUsers = await storage.getExpiredPromotionalUsers();

      for (const user of expiredUsers) {
        if (user.userType === 'client') {
          // Clientes: remover se não renovaram
          if (user.plan === 'free' || user.plan === 'max' && user.isPromotionalUser) {
            await storage.deleteUser(user.id);
            clientsRemoved++;
          }
        } else if (user.userType === 'professional') {
          // Profissionais: manter mas restringir
          await storage.updateUser(user.id, {
            plan: 'free',
            tokens: 0,
            tokensPlano: 0,
            promotionalPhase: 'expired'
          });
          professionalsRestricted++;
        }
      }

    } catch (error) {
      console.error('❌ Erro ao expirar usuários promocionais:', error);
    }

    return { clientsRemoved, professionalsRestricted };
  }

  /**
   * Gera relatório da campanha
   */
  async getCampaignReport(): Promise<any> {
    try {
      // Usar diretamente os stats do storage que já funcionam
      const stats = await storage.getReferralStats();
      return stats;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      
      // Retornar dados básicos em caso de erro
      return {
        totalClients: 0,
        totalProfessionals: 0,
        totalUsers: 0,
        clientsWithBonus: 0,
        completedReferrals: 0,
        averageReferralsPerClient: "0.0",
        goal: "100 clientes + 300 profissionais",
        progress: "0/100 clientes, 0/300 profissionais"
      };
    }
  }
}

export const referralSystem = ReferralSystem.getInstance();