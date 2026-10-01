// Script para processar PIX manualmente quando necessário
import { PixTracker } from './pix-tracking';

export async function processPixManual(amount: number, adminEmail: string = 'passosmir4@gmail.com'): Promise<void> {
  try {
    // Tentar processar via sistema automático primeiro
    const result = await PixTracker.processPixPayment(amount);
    
    if (result.success) {
      return;
    }

    // Calcular tokens
    const tokens = Math.floor(amount * 720);

  } catch (error) {
    console.error(`❌ Erro ao processar PIX manual:`, error);
  }
}