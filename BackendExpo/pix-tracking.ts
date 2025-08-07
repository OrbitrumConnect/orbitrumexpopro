import { storage } from './storage';

// Interface para transação PIX
interface PixTransaction {
  id: string;
  userId: number;
  userEmail: string;
  amount: number;
  tokens: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'expired';
  pixKey?: string;
  qrCode?: string;
}

// Storage para transações PIX em memória
const pixTransactions = new Map<string, PixTransaction>();
const pendingTransactions = new Set<string>();

export class PixTracker {
  
  // Registrar nova transação PIX
  static registerTransaction(userId: number, userEmail: string, amount: number): PixTransaction {
    const transactionId = `PIX_${Date.now()}_${userId}`;
    const tokens = Math.floor(amount * 720); // R$ 1,00 = 720 tokens
    
    const transaction: PixTransaction = {
      id: transactionId,
      userId,
      userEmail,
      amount,
      tokens,
      timestamp: new Date(),
      status: 'pending'
    };
    
    pixTransactions.set(transactionId, transaction);
    pendingTransactions.add(transactionId);
    
    console.log(`🏷️ TRANSAÇÃO PIX REGISTRADA:`);
    console.log(`📋 ID: ${transactionId}`);
    console.log(`👤 Usuário: ${userEmail} (ID: ${userId})`);
    console.log(`💰 Valor: R$ ${amount.toFixed(2)}`);
    console.log(`🪙 Tokens: ${tokens.toLocaleString()}`);
    
    return transaction;
  }
  
  // Buscar transação por valor e janela de tempo (15 minutos)
  static findTransactionByAmount(amount: number): PixTransaction | null {
    const now = new Date();
    const timeWindow = 15 * 60 * 1000; // 15 minutos
    
    for (const [, transaction] of pixTransactions) {
      if (transaction.status === 'pending' && 
          Math.abs(transaction.amount - amount) < 0.01 && // Tolerância de R$ 0,01
          now.getTime() - transaction.timestamp.getTime() < timeWindow) {
        return transaction;
      }
    }
    
    return null;
  }
  
  // Processar pagamento PIX quando detectado
  static async processPixPayment(amount: number): Promise<{success: boolean; userEmail?: string; tokensAdded?: number; transactionId?: string; message?: string}> {
    const transaction = this.findTransactionByAmount(amount);
    
    if (!transaction) {
      console.log(`❌ PIX de R$ ${amount.toFixed(2)} não correlacionado com nenhum usuário`);
      return {
        success: false,
        message: `PIX de R$ ${amount.toFixed(2)} não correlacionado com nenhum usuário`
      };
    }
    
    try {
      // Creditar tokens automaticamente
      const user = await storage.getUser(transaction.userId);
      if (!user) {
        console.error(`❌ Usuário ${transaction.userId} não encontrado`);
        return {
          success: false,
          message: `Usuário ${transaction.userId} não encontrado`
        };
      }
      
      const newBalance = (user.tokens || 0) + transaction.tokens;
      await storage.updateUser(transaction.userId, {
        tokens: newBalance,
        tokensComprados: (user.tokensComprados || 0) + transaction.tokens
      });
      
      // Marcar transação como completa
      transaction.status = 'completed';
      pixTransactions.set(transaction.id, transaction);
      pendingTransactions.delete(transaction.id);
      
      console.log(`✅ PIX PROCESSADO AUTOMATICAMENTE:`);
      console.log(`👤 Usuário: ${transaction.userEmail}`);
      console.log(`💰 Valor: R$ ${transaction.amount.toFixed(2)}`);
      console.log(`🪙 Tokens creditados: ${transaction.tokens.toLocaleString()}`);
      console.log(`💼 Saldo atual: ${newBalance.toLocaleString()}`);
      
      return {
        success: true,
        userEmail: transaction.userEmail,
        tokensAdded: transaction.tokens,
        transactionId: transaction.id
      };
      
    } catch (error) {
      console.error(`❌ Erro ao processar PIX:`, error);
      return {
        success: false,
        message: `Erro ao processar PIX: ${error}`
      };
    }
  }
  
  // Listar transações pendentes para admin
  static getPendingTransactions(): PixTransaction[] {
    return Array.from(pendingTransactions)
      .map(id => pixTransactions.get(id))
      .filter(Boolean) as PixTransaction[];
  }
  
  // Expirar transações antigas (mais de 30 minutos)
  static expireOldTransactions(): void {
    const now = new Date();
    const expirationTime = 30 * 60 * 1000; // 30 minutos
    
    for (const [, transaction] of pixTransactions) {
      if (transaction.status === 'pending' && 
          now.getTime() - transaction.timestamp.getTime() > expirationTime) {
        transaction.status = 'expired';
        pixTransactions.set(transaction.id, transaction);
        pendingTransactions.delete(transaction.id);
        
        console.log(`⏰ Transação expirada: ${transaction.id} (${transaction.userEmail})`);
      }
    }
  }
  
  // Simular detecção de PIX (será substituído pelo webhook real)
  static simulatePixDetection(amount: number): void {
    console.log(`🔍 PIX DETECTADO: R$ ${amount.toFixed(2)}`);
    this.processPixPayment(amount);
  }
}

// Iniciar limpeza automática de transações expiradas
setInterval(() => {
  PixTracker.expireOldTransactions();
}, 5 * 60 * 1000); // A cada 5 minutos

export { PixTransaction };