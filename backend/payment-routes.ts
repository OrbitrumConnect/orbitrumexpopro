import type { Express } from "express";
import { PaymentProcessor, PLANS, CashbackSystem } from './payment-system';
import { storage } from './storage';
import { isAdminMaster, adminBypass } from './admin-bypass';
import { PixTracker } from './pix-tracking';
import { mercadoPagoService } from './mercado-pago-config';
import { SimplePixGenerator } from './simple-pix-generator';

export function setupPaymentRoutes(app: Express) {

  // Gerar PIX para pagamento (APENAS APÓS VERIFICAÇÃO DE DOCUMENTOS)
  app.post('/api/payment/generate-pix', async (req, res) => {
    try {
      const { plan, provider = 'mercadopago', type = 'plan' } = req.body;
      const userId = req.user?.id || '1'; // Usuário logado

      // VERIFICAÇÃO OBRIGATÓRIA: Usuário deve ter documentos aprovados
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(401).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      // BYPASS ADMINISTRATIVO: Admin pode comprar sem verificação
      const bypass = adminBypass(user);

      // BLOQUEIO: Verificar se documentos foram aprovados (exceto admin)
      if (!bypass && (!user.canMakePurchases || user.documentsStatus !== 'approved')) {
        return res.status(403).json({
          error: 'Documentos não verificados',
          message: 'Para realizar compras, você precisa enviar e ter seus documentos aprovados.',
          code: 'DOCUMENTS_NOT_VERIFIED',
          documentsStatus: user.documentsStatus,
          redirectTo: '/verificacao-documentos'
        });
      }

      // Definir preços dos pacotes de tokens
      const TOKEN_PACKAGES = {
        'starter': { price: 3, tokens: 2160, name: 'Starter Pack' },
        'pro': { price: 6, tokens: 4320, name: 'Pro Boost' },
        'max': { price: 9, tokens: 6480, name: 'Max Expansion' },
        'premium': { price: 18, tokens: 12960, name: 'Orbit Premium' },
        'galaxy': { price: 32, tokens: 23040, name: 'Galaxy Vault' }
      };

      let amount, itemName;

      if (type === 'tokens') {
        const tokenPackage = TOKEN_PACKAGES[plan as keyof typeof TOKEN_PACKAGES];
        if (!tokenPackage) {
          return res.status(400).json({ error: 'Pacote de tokens inválido' });
        }
        amount = tokenPackage.price;
        itemName = `${tokenPackage.name} - ${tokenPackage.tokens.toLocaleString()} tokens`;
      } else {
        if (!PLANS[plan as keyof typeof PLANS]) {
          return res.status(400).json({ error: 'Plano inválido' });
        }
        amount = PLANS[plan as keyof typeof PLANS].price;
        itemName = `Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
      }

      // SISTEMA HÍBRIDO: MP + PIX DIRETO com fallback automático
      let pixData;

      try {
        if (provider === 'mercadopago') {
          pixData = await mercadoPagoService.createPixPayment(amount, itemName, userId);
        } else {
          throw new Error('Forçar uso de PIX direto');
        }
      } catch (error: any) {
        // FALLBACK: PIX direto usando PaymentProcessor existente
        pixData = await PaymentProcessor.generatePixPayment(
          userId,
          plan,
          'direct',
          amount,
          itemName,
          type
        );
      }

      // REGISTRAR TRANSAÇÃO PIX NO SISTEMA DE RASTREAMENTO
      const userForTracking = await storage.getUser(parseInt(userId));
      const userEmail = userForTracking?.email || `user${userId}@orbitrum.com`;

      // Registrar transação para rastreamento automático
      const transaction = PixTracker.registerTransaction(
        parseInt(userId),
        userEmail,
        amount
      );

      // Salvar dados do pagamento pendente
      await storage.createPayment({
        userId: userId,
        plan,
        amount: pixData.amount,
        transactionId: pixData.transactionId,
        provider,
        status: 'pending',
        paymentDate: new Date(),
        type: type || 'plan',
        trackingId: transaction.id  // Vincular com sistema de rastreamento
      });

      res.json({
        success: true,
        trackingId: transaction.id,  // Retornar ID para frontend
        ...pixData
      });

    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Verificar status do pagamento
  app.post('/api/payment/check-status', async (req, res) => {
    try {
      const { transactionId } = req.body;

      const payment = await storage.getPaymentByTransaction(transactionId);
      if (!payment) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      // Verificar status na API do provedor
      const status = await PaymentProcessor.checkPaymentStatus(
        transactionId,
        payment.provider as any
      );

      if (status === 'confirmed' && payment.status === 'pending') {
        // Confirmar pagamento
        await PaymentProcessor.confirmPayment(transactionId);
        await storage.updatePaymentStatus(transactionId, 'confirmed');
      }

      res.json({
        status,
        transactionId,
        payment: payment
      });

    } catch (error) {
      console.error('Erro ao verificar status:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Webhook Mercado Pago - Aplicação 7104494430748102
  app.post('/api/payment/webhook/mercadopago', async (req, res) => {
    try {
      const { id, live_mode, type, date_created, action, api_version, data } = req.body;

      if (type === 'payment' && (action === 'payment.updated' || action === 'payment.created')) {
        const paymentId = data.id;

        // Buscar detalhes do pagamento
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_RECEBIMENTO_ACCESS_TOKEN;

        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!paymentResponse.ok) {
          console.error('❌ Erro ao buscar pagamento MP:', paymentResponse.status);
          return res.status(200).json({ received: true, error: 'payment_not_found' });
        }

        const payment = await paymentResponse.json();

        if (payment.status === 'approved' && payment.status_detail === 'accredited') {
          const amount = payment.transaction_amount;
          const description = payment.description || '';
          const externalReference = payment.external_reference || '';

          // Identificar usuário por múltiplas fontes
          let userId, itemType = 'tokens';

          // Método 1: External reference (orbitrum_user_ID_timestamp)
          if (externalReference && externalReference.includes('orbitrum_')) {
            const parts = externalReference.split('_');
            if (parts.length >= 3 && parts[0] === 'orbitrum' && parts[1] === 'user') {
              userId = parts[2];
              itemType = externalReference.includes('plano') ? 'plan' : 'tokens';
            }
          }

          // Método 2: Description
          if (!userId && description.includes('orbitrum_')) {
            const match = description.match(/orbitrum_(\d+)_/);
            userId = match ? match[1] : null;
            itemType = description.includes('plano') ? 'plan' : 'tokens';
          }

          // Método 3: Rastreamento inteligente por valor + timestamp
          if (!userId) {
            userId = await PixTracker.identifyUserByPayment(amount, new Date(payment.date_created));
          }

          if (userId) {
            // Processar crédito automático
            await PixTracker.processPixPayment(
              userId,
              amount,
              paymentId,
              itemType
            );
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('❌ Erro no webhook MP:', error);
      res.status(500).json({ error: 'Erro no webhook' });
    }
  });

  // Webhook PicPay
  app.post('/api/payment/webhook/picpay', async (req, res) => {
    try {
      const success = await PaymentProcessor.handlePicPayWebhook(req.body);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('❌ Erro no webhook PicPay:', error);
      res.status(500).json({ error: 'Erro no webhook' });
    }
  });

  // Webhook PIX direto (para quando usar sua própria chave PIX)
  app.post('/api/payment/webhook/direct', async (req, res) => {
    try {
      const success = await PaymentProcessor.handleDirectPixWebhook(req.body);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('❌ Erro no webhook PIX direto:', error);
      res.status(500).json({ error: 'Erro no webhook' });
    }
  });

  // Listar planos disponíveis
  app.get('/api/payment/plans', (req, res) => {
    res.json({
      plans: PLANS,
      currency: 'BRL'
    });
  });

  // Histórico de pagamentos do usuário
  app.get('/api/payment/history', async (req, res) => {
    try {
      const userId = req.user?.id || '1';

      const payments = await storage.getUserPayments(userId.toString());

      res.json({
        payments,
        total: payments.length
      });

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ============================
  // SISTEMA DE CASHBACK
  // ============================

  // Verificar cashback disponível
  app.get('/api/cashback/available', async (req, res) => {
    try {
      const userId = req.user?.id || '1';

      const available = await CashbackSystem.calculateAvailableCashback(userId.toString());

      res.json({
        availableCashback: available,
        minimumWithdrawal: 10.00,
        monthlyLimit: 8.7,
        resetDay: 3
      });

    } catch (error) {
      console.error('Erro ao verificar cashback:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Solicitar saque de cashback
  app.post('/api/cashback/withdraw', async (req, res) => {
    try {
      const userId = req.user?.id || '1';
      const { amount, pixKey } = req.body;

      if (!amount || !pixKey) {
        return res.status(400).json({ error: 'Valor e chave PIX são obrigatórios' });
      }

      const result = await CashbackSystem.processCashbackWithdrawal(
        userId.toString(),
        parseFloat(amount),
        pixKey
      );

      res.json(result);

    } catch (error) {
      console.error('Erro no saque de cashback:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Histórico de saques de cashback
  app.get('/api/cashback/history', async (req, res) => {
    try {
      const userId = req.user?.id || '1';

      const withdrawals = await storage.getCashbackHistory(userId.toString());

      res.json({
        withdrawals,
        total: withdrawals.length
      });

    } catch (error) {
      console.error('Erro ao buscar histórico de cashback:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}
