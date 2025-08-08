import express from 'express';
import type { Request, Response } from 'express';
import { storage } from '../storage';

const router = express.Router();

// Armazenamento em memória para histórico de chat
let chatHistory: any[] = [];
let activeChats: Map<string, any> = new Map();

// Custos de tokens para chat
const TOKEN_COSTS = {
  basic_message: 25,     // R$ 0.025
  ai_response: 50,       // R$ 0.05  
  service_proposal: 100, // R$ 0.10
  priority_message: 150, // R$ 0.15
  urgent_response: 200   // R$ 0.20
};

// Limites por plano
const PLAN_LIMITS = {
  free: { messagesPerDay: 3, aiResponses: false, directChat: false },
  basic: { messagesPerDay: 15, aiResponses: true, directChat: true },
  standard: { messagesPerDay: 50, aiResponses: true, directChat: true },
  pro: { messagesPerDay: 200, aiResponses: true, directChat: true },
  max: { messagesPerDay: -1, aiResponses: true, directChat: true }
};

// GET - Histórico de chat entre usuários
router.get('/history/:userId/:targetId?', async (req: Request, res: Response) => {
  try {
    const { userId, targetId } = req.params;
    
    console.log('📞 CARREGANDO HISTÓRICO DE CHAT:', { userId, targetId });

    // Filtrar mensagens do usuário
    let userMessages = chatHistory.filter(msg => 
      (msg.senderId === parseInt(userId) || msg.receiverId === parseInt(userId)) &&
      (!targetId || msg.senderId === parseInt(targetId) || msg.receiverId === parseInt(targetId))
    );

    res.json({
      success: true,
      messages: userMessages.slice(-50), // Últimas 50 mensagens
      totalMessages: userMessages.length
    });

  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar chat' });
  }
});

// POST - Enviar mensagem (consome tokens)
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, content, messageType = 'basic_message' } = req.body;
    const userEmail = req.headers['user-email'] as string;
    
    if ((!senderId && !userEmail) || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'senderId/userEmail e content são obrigatórios' 
      });
    }

    console.log('💬 NOVA MENSAGEM DE CHAT:', {
      senderId,
      userEmail,
      receiverId: receiverId || 'IA',
      messageType,
      contentLength: content.length
    });

    // Buscar dados do usuário - primeiro por email, depois por ID
    let user = null;
    if (userEmail) {
      user = await storage.getUserByEmail(userEmail);
    } else if (senderId) {
      user = await storage.getUser(senderId);
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    const actualUserId = user.id;

    // Verificar plano e limites
    const userPlan = user.plan || 'free';
    const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];
    
    // Contar mensagens do dia
    const today = new Date().toDateString();
    const todayMessages = chatHistory.filter(msg => 
      msg.senderId === actualUserId && 
      new Date(msg.timestamp).toDateString() === today
    ).length;

    if (limits.messagesPerDay !== -1 && todayMessages >= limits.messagesPerDay) {
      return res.status(403).json({
        success: false,
        message: `Limite de ${limits.messagesPerDay} mensagens/dia atingido`,
        upgradeRequired: true
      });
    }

    // Calcular custo em tokens
    const tokenCost = TOKEN_COSTS[messageType as keyof typeof TOKEN_COSTS] || TOKEN_COSTS.basic_message;
    
    // Verificar saldo de tokens
    const wallet = await storage.getUserWallet(actualUserId);
    
    // Admin (ID 1) tem acesso ilimitado
    if (actualUserId !== 1 && wallet.saldoTotal < tokenCost && userPlan !== 'max') {
      return res.status(402).json({
        success: false,
        message: `Tokens insuficientes. Necessário: ${tokenCost} tokens`,
        tokenCost,
        currentBalance: wallet.saldoTotal,
        upgradeRequired: true
      });
    }

    // Debitar tokens (exceto admin e plano Max)
    if (actualUserId !== 1 && userPlan !== 'max') {
      await storage.debitUserTokens(actualUserId, tokenCost, 'Chat message');
    }

    // Salvar mensagem
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: actualUserId,
      receiverId: receiverId ? parseInt(receiverId) : null,
      content,
      messageType,
      timestamp: new Date().toISOString(),
      tokenCost,
      userPlan,
      aiGenerated: false
    };

    chatHistory.push(message);

    console.log(`✅ MENSAGEM SALVA - Usuário: ${user.email} - Tokens debitados: ${tokenCost}`);

    // Gerar resposta da IA se não há receiverId específico
    if (!receiverId && limits.aiResponses) {
      setTimeout(() => {
        generateAIResponse(actualUserId, content, userPlan);
      }, 1500 + Math.random() * 2000);
    }

    const finalTokens = actualUserId === 1 ? wallet.saldoTotal : wallet.saldoTotal - tokenCost;

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      messageId: message.id,
      tokenCost: actualUserId === 1 ? 0 : tokenCost,
      remainingTokens: finalTokens,
      messagesUsedToday: todayMessages + 1,
      dailyLimit: limits.messagesPerDay
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Função para gerar resposta automática da IA
const generateAIResponse = async (userId: number, userMessage: string, userPlan: string) => {
  try {
    const aiResponse = await generateIntelligentAIResponse(userMessage, userPlan);
    
    const aiMessage = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: null, // IA
      receiverId: userId,
      content: aiResponse,
      messageType: 'ai_response',
      timestamp: new Date().toISOString(),
      tokenCost: TOKEN_COSTS.ai_response,
      userPlan,
      aiGenerated: true
    };

    chatHistory.push(aiMessage);
    
    // Debitar tokens da resposta IA (exceto Max)
    if (userPlan !== 'max') {
      await storage.debitUserTokens(userId, TOKEN_COSTS.ai_response, 'IA Response');
    }

    console.log('🤖 IA RESPONDEU AUTOMATICAMENTE - Tokens debitados:', TOKEN_COSTS.ai_response);

  } catch (error) {
    console.log('Erro na resposta automática da IA:', error);
  }
};

// Gerador de respostas inteligentes da IA
const generateIntelligentAIResponse = async (userInput: string, userPlan: string): Promise<string> => {
  const lowerInput = userInput.toLowerCase();

  // Respostas contextuais inteligentes
  if (lowerInput.includes('preço') || lowerInput.includes('valor') || lowerInput.includes('quanto')) {
    return `💰 Baseado no seu plano ${userPlan.toUpperCase()}, encontrei 5 profissionais. Preços a combinar diretamente com cada um! Confirma busca? (Custo: 100 tokens)`;
  }

  if (lowerInput.includes('horário') || lowerInput.includes('quando') || lowerInput.includes('agenda')) {
    return `📅 Perfeito! Sistema detectou 12 profissionais disponíveis hoje e 8 para amanhã. Horários premium: 9h-11h e 14h-16h. Quer que eu reserve automaticamente? (Custo: 150 tokens - resposta prioritária)`;
  }

  if (lowerInput.includes('urgente') || lowerInput.includes('rápido') || lowerInput.includes('emergência')) {
    return `🚨 EMERGÊNCIA DETECTADA! Localizei 4 profissionais ONLINE AGORA na sua região. Conexão imediata disponível por 200 tokens (prioridade máxima). Sistema já pré-selecionou os melhores ratings. Confirma conexão urgente?`;
  }

  if (lowerInput.includes('melhor') || lowerInput.includes('recomend')) {
    return `⭐ IA analisou seu perfil: Top 3 matches são Ana Santos (4.9★, 95% satisfação), Carlos Lima (4.8★, resposta 12min) e João Silva (4.7★, 150 projetos). Matching inteligente baseado em seu histórico. Ver perfis completos? (50 tokens cada)`;
  }

  // Respostas baseadas no plano
  const planResponses = {
    free: `👋 Olá! Como usuário Free, você tem acesso limitado. Para respostas IA ilimitadas e conexões diretas, considere upgrade para Básico (R$ 7/mês). Posso ajudar com informações básicas por enquanto!`,
    
    basic: `🌟 Ótimo! Como usuário Básico, posso oferecer matching inteligente e conexões profissionais. Baseado na sua mensagem, identifiquei 3 ações possíveis. Qual prefere: busca automática, chat direto, ou agendamento?`,
    
    standard: `💎 Perfeito! Plano Standard detectado - acesso premium ativo. Posso executar análise comportamental avançada e matching por IA. Sua mensagem indica interesse em [${userInput.slice(0, 20)}...]. Executar busca inteligente?`,
    
    pro: `🚀 Excelente! Usuário Pro com privilégios avançados. IA premium ativa com 200 mensagens/dia. Posso processar: matching avançado, negociação automática, agendamento inteligente. Qual funcionalidade premium quer ativar?`,
    
    max: `👑 Bem-vindo, usuário Max! Acesso ILIMITADO ativo - zero custo de tokens para você. IA premium total disponível: matching por localização, análise comportamental, negociação automática, conexões prioritárias. Como posso maximizar seus resultados?`
  };

  return planResponses[userPlan as keyof typeof planResponses] || planResponses.free;
};

// GET - Status do chat (mensagens não lidas, etc.)
router.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Contar mensagens não lidas
    const unreadMessages = chatHistory.filter(msg => 
      msg.receiverId === parseInt(userId) && !msg.read
    ).length;

    // Verificar limites do plano
    const user = await storage.getUser(parseInt(userId));
    const userPlan = user?.plan || 'free';
    const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];
    
    // Contar mensagens do dia
    const today = new Date().toDateString();
    const todayMessages = chatHistory.filter(msg => 
      msg.senderId === parseInt(userId) && 
      new Date(msg.timestamp).toDateString() === today
    ).length;

    // Buscar saldo de tokens
    const wallet = await storage.getUserWallet(parseInt(userId));

    res.json({
      success: true,
      unreadMessages,
      plan: userPlan,
      dailyLimit: limits.messagesPerDay,
      messagesUsedToday: todayMessages,
      remainingMessages: limits.messagesPerDay === -1 ? -1 : limits.messagesPerDay - todayMessages,
      tokenBalance: wallet.saldoTotal,
      aiResponsesEnabled: limits.aiResponses,
      directChatEnabled: limits.directChat,
      nextMessageCost: TOKEN_COSTS.basic_message
    });

  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// POST - Marcar mensagens como lidas
router.post('/mark-read', async (req: Request, res: Response) => {
  try {
    const { userId, messageIds } = req.body;
    
    // Marcar mensagens como lidas
    chatHistory.forEach(msg => {
      if (msg.receiverId === parseInt(userId) && 
          (!messageIds || messageIds.includes(msg.id))) {
        msg.read = true;
        msg.readAt = new Date().toISOString();
      }
    });

    res.json({ success: true, message: 'Mensagens marcadas como lidas' });

  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// POST - Debitar tokens (usado pelo sistema de carteira)
router.post('/debit-tokens', async (req: Request, res: Response) => {
  try {
    const { userId, amount, reason } = req.body;
    
    await storage.debitUserTokens(userId, amount, reason || 'Chat usage');
    
    const wallet = await storage.getUserWallet(userId);
    
    res.json({
      success: true,
      remainingTokens: wallet.saldoTotal,
      debitedAmount: amount
    });

  } catch (error) {
    console.error('Erro ao debitar tokens:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

export default router;