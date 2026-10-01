import type { Express } from "express";
import { storage } from './storage';

// SISTEMA SIMPLES DE CRÉDITO MANUAL DE TOKENS
export function setupCreditRoutes(app: Express) {
  
  // Endpoint para crédito manual de tokens (ADMIN ONLY)
  app.post('/api/admin/credit-tokens', async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      // Validação básica
      if (!userId || !amount) {
        return res.status(400).json({ 
          success: false, 
          error: 'userId e amount são obrigatórios' 
        });
      }
      
      // Buscar usuário
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuário não encontrado' 
        });
      }
      
      // Calcular tokens baseado no valor em R$
      const tokenMultiplier = 720; // R$ 1,00 = 720 tokens
      const tokens = Math.floor(amount * tokenMultiplier);
      
      // Creditar tokens
      const newBalance = (user.purchaseTokens || 0) + tokens;
      
      await storage.updateUser(userId, {
        purchaseTokens: newBalance
      });
      
      res.json({
        success: true,
        message: `${tokens.toLocaleString()} tokens creditados com sucesso`,
        data: {
          userId,
          email: user.email,
          valorPago: amount,
          tokensCreditados: tokens,
          saldoAnterior: newBalance - tokens,
          saldoAtual: newBalance,
          motivo: reason
        }
      });
      
    } catch (error) {
      console.error('Erro ao creditar tokens:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  });
}