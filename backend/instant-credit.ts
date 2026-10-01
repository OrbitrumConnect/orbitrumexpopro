// Sistema de Crédito Instantâneo - Para garantir que tokens apareçam imediatamente
import { storage } from './storage';

interface InstantCreditRequest {
  userEmail: string;
  tokens: number;
  pixAmount: number;
  description: string;
}

export class InstantCreditSystem {
  
  // Creditar tokens instantaneamente para um usuário
  static async creditInstantly(request: InstantCreditRequest) {
    try {
      // Buscar usuário por email
      const user = await storage.getUserByEmail(request.userEmail);
      if (!user) {
        throw new Error(`Usuário não encontrado: ${request.userEmail}`);
      }
      
      // Creditar tokens diretamente
      const tokensAnteriores = user.tokensComprados || 0;
      const novosTokens = tokensAnteriores + request.tokens;
      
      await storage.updateUserTokensComprados(user.id, novosTokens);
      
      // Notificar via WebSocket se disponível
      this.notifyUserInstantly(user.id, request.tokens);
      
      return {
        success: true,
        userEmail: user.email,
        userId: user.id,
        tokensAdded: request.tokens,
        totalTokens: novosTokens,
        pixAmount: request.pixAmount,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('❌ ERRO NO CRÉDITO INSTANTÂNEO:', error.message);
      throw error;
    }
  }
  
  // Notificar usuário via WebSocket (se disponível)
  private static notifyUserInstantly(userId: number, tokens: number) {
    try {
      // Implementar notificação WebSocket aqui se necessário
      // Notification sent
    } catch (error) {
      // WebSocket not available
    }
  }
  
  // Listar todos os créditos pendentes que precisam ser processados
  static async listPendingCredits() {
    const users = await storage.getAllUsers();
    const pendingCredits = [];
    
    for (const user of users) {
      if (user.tokensComprados > 0) {
        pendingCredits.push({
          userId: user.id,
          email: user.email,
          tokens: user.tokensComprados,
          lastUpdated: user.updatedAt || new Date()
        });
      }
    }
    
    return pendingCredits;
  }
}