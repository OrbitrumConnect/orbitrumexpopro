import { getSupabase } from "./supabase-auth";
import { storage } from "./storage";

/**
 * Sistema de dados reais - Converte dados do Supabase para o sistema
 */
export class RealDataSystem {
  
  /**
   * Busca dados reais do usuário autenticado
   */
  static async getCurrentUser() {
    try {
      const supabase = getSupabase();
      const authUser = await supabase.auth.getUser();
      
      if (!authUser.data.user) {
        return null;
      }

      // Buscar no storage ou criar se não existir
      let user = await storage.getUserByEmail(authUser.data.user.email);
      
      if (!user) {
        // Criar usuário baseado no Supabase
        user = await storage.createUser({
          email: authUser.data.user.email,
          username: authUser.data.user.user_metadata?.name || authUser.data.user.email.split('@')[0],
          plan: 'free',
          tokensPlano: 0,
          tokensGanhos: 0,
          tokensComprados: 0,
          isAdmin: authUser.data.user.email === 'passosmir4@gmail.com',
          adminLevel: authUser.data.user.email === 'passosmir4@gmail.com' ? 10 : 0,
          userType: authUser.data.user.email === 'passosmir4@gmail.com' ? 'admin' : 'client',
          planExpiresAt: null,
          gamesPlayedToday: 0,
          gameResetDate: new Date().toISOString().split('T')[0]
        });
      }
      
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return null;
    }
  }

  /**
   * Dados reais do dashboard profissional
   */
  static async getProfessionalDashboardData(userId: number) {
    try {
      const [
        pendingRequests,
        acceptedServices,
        stats,
        wallet,
        teamRequests,
        activeChats
      ] = await Promise.all([
        storage.getPendingServices(userId),
        storage.getAcceptedServices(userId),
        storage.getProfessionalStats(userId),
        storage.getUserWallet(userId),
        storage.getTeamRequestsForProfessional(userId),
        storage.getActiveChats(userId)
      ]);

      return {
        pendingRequests: pendingRequests || [],
        acceptedServices: acceptedServices || [],
        stats: stats || {
          totalEarnings: 0,
          completedJobs: 0,
          averageRating: 0,
          responseTime: '0 min',
          completionRate: 0
        },
        wallet: wallet || {
          tokensPlano: 0,
          tokensGanhos: 0,
          tokensComprados: 0,
          totalTokens: 0,
          cashbackAcumulado: 0
        },
        teamRequests: teamRequests || [],
        activeChats: activeChats || []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard profissional:', error);
      return {
        pendingRequests: [],
        acceptedServices: [],
        stats: {
          totalEarnings: 0,
          completedJobs: 0,
          averageRating: 0,
          responseTime: '0 min',
          completionRate: 0
        },
        wallet: {
          tokensPlano: 0,
          tokensGanhos: 0,
          tokensComprados: 0,
          totalTokens: 0,
          cashbackAcumulado: 0
        },
        teamRequests: [],
        activeChats: []
      };
    }
  }

  /**
   * Dados reais do dashboard cliente
   */
  static async getClientDashboardData(userId: number) {
    try {
      const [
        wallet,
        teams,
        gameScores,
        notifications,
        documentsStatus,
        purchaseHistory
      ] = await Promise.all([
        storage.getUserWallet(userId),
        storage.getUserTeams(userId),
        storage.getUserGameScores(userId),
        storage.getUserNotifications(userId),
        storage.getUserDocuments(userId),
        storage.getUserPurchaseHistory(userId)
      ]);

      return {
        wallet: wallet || {
          tokensPlano: 0,
          tokensGanhos: 0,
          tokensComprados: 0,
          totalTokens: 0,
          cashbackAcumulado: 0
        },
        teams: teams || [],
        gameScores: gameScores || [],
        notifications: notifications || [],
        documentsStatus: documentsStatus || { status: 'pending', adminNotes: null },
        purchaseHistory: purchaseHistory || []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard cliente:', error);
      return {
        wallet: {
          tokensPlano: 0,
          tokensGanhos: 0,
          tokensComprados: 0,
          totalTokens: 0,
          cashbackAcumulado: 0
        },
        teams: [],
        gameScores: [],
        notifications: [],
        documentsStatus: { status: 'pending', adminNotes: null },
        purchaseHistory: []
      };
    }
  }

  /**
   * Estatísticas reais para o dashboard
   */
  static async getUserStatistics(userId: number) {
    try {
      const user = await storage.getUser(userId);
      if (!user) return null;

      const [
        wallet,
        teams,
        gameScores,
        activeServices
      ] = await Promise.all([
        storage.getUserWallet(userId),
        storage.getUserTeams(userId),
        storage.getUserGameScores(userId),
        storage.getActiveServices(userId)
      ]);

      const totalTeamMembers = teams.reduce((total, team) => 
        total + (team.professionalIds?.length || 0), 0
      );

      const totalGamesPlayed = gameScores.length;
      const totalTokensEarned = gameScores.reduce((total, score) => 
        total + (score.tokensEarned || 0), 0
      );

      return {
        totalTokens: wallet?.totalTokens || 0,
        teamCount: totalTeamMembers,
        cashbackAcumulado: wallet?.cashbackAcumulado || 0,
        currentPlan: user.plan || 'free',
        gamesPlayed: totalGamesPlayed,
        tokensEarned: totalTokensEarned,
        activeServices: activeServices?.length || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      return null;
    }
  }
}