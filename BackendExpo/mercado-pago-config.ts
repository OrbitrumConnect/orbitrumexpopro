// Configuração Mercado Pago - Aplicação 7104494430748102 - PIX Nubank
import { MercadoPagoConfig, Payment } from 'mercadopago';

export class MercadoPagoService {
  private client: MercadoPagoConfig;
  
  constructor() {
    // Configurar com sua aplicação específica 7104494430748102
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
      options: {
        timeout: 5000,
        idempotencyKey: 'orbitrum-pix'
      }
    });
    console.log('🔧 MP configurado com aplicação: 7104494430748102');
  }

  // Criar pagamento PIX - Vai gerar PIX para sua conta Nubank
  async createPixPayment(amount: number, description: string, userId: string) {
    const paymentData = {
      transaction_amount: amount,
      description: `Orbitrum Tokens - ${description}`,
      payment_method_id: "pix",
      payer: {
        email: `user${userId}@orbitrum.com.br`,
        first_name: "Cliente",
        last_name: "Orbitrum",
        identification: {
          type: "CPF",
          number: "00000000000"  // CPF genérico para cliente
        }
      },
      // Webhook para automação
      notification_url: `${process.env.WEBHOOK_URL || 'https://www.orbitrum.com.br'}/api/payment/webhook/mercadopago`,
      external_reference: `orbitrum_user_${userId}_${Date.now()}`,
      metadata: {
        user_id: userId,
        platform: "orbitrum",
        pix_destination: "03669282106" // Sua conta Nubank receberá
      }
    };

    try {
      console.log('💳 Criando PIX MP para recebimento em Nubank 03669282106');
      const payment = new Payment(this.client);
      const response = await payment.create({ body: paymentData });
      
      return {
        id: response.id,
        status: response.status,
        qr_code: response.point_of_interaction?.transaction_data?.qr_code || '',
        qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64 || '',
        transaction_id: response.id?.toString(),
        amount: amount,
        pix_key: "03669282106", // Confirma que PIX vai para sua conta
        external_reference: paymentData.external_reference
      };
    } catch (error) {
      console.error('❌ Erro MP createPixPayment:', error);
      throw error;
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(paymentId: string) {
    try {
      const payment = new Payment(this.client);
      const response = await payment.get({ id: paymentId });
      
      return {
        status: response.status,
        status_detail: response.status_detail,
        amount: response.transaction_amount,
        approved: response.status === 'approved',
        external_reference: response.external_reference
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status MP:', error);
      return null;
    }
  }

  // Processar webhook - PIX aprovado na sua conta Nubank
  async processWebhook(webhookData: any) {
    try {
      if (webhookData.type === 'payment' && webhookData.data?.id) {
        console.log(`🔔 Webhook MP recebido: ${webhookData.data.id}`);
        
        const paymentStatus = await this.checkPaymentStatus(webhookData.data.id);
        
        if (paymentStatus?.approved) {
          console.log(`✅ PIX APROVADO no Nubank: R$ ${paymentStatus.amount}`);
          console.log(`📧 Ref: ${paymentStatus.external_reference}`);
          
          return {
            success: true,
            amount: paymentStatus.amount,
            paymentId: webhookData.data.id,
            external_reference: paymentStatus.external_reference
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro processando webhook:', error);
    }
    
    return { success: false };
  }
}

export const mercadoPagoService = new MercadoPagoService();