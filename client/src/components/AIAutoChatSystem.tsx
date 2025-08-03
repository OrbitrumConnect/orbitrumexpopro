import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User as UserIcon, 
  Zap, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Coins,
  Crown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'professional' | 'client';
  timestamp: Date;
  type: 'text' | 'service_proposal' | 'service_accepted' | 'system_notification';
  aiGenerated?: boolean;
  tokenCost?: number;
  requiresPlan?: 'basic' | 'standard' | 'pro' | 'max';
}

interface AIAutoChatSystemProps {
  userType: 'client' | 'professional';
  userId: number;
  userPlan: 'free' | 'basic' | 'standard' | 'pro' | 'max';
  userTokens: number;
  targetUserId?: number; // Para chat direto com profissional/cliente específico
  serviceContext?: string; // Contexto do serviço sendo discutido
}

const AIAutoChatSystem: React.FC<AIAutoChatSystemProps> = ({
  userType,
  userId,
  userPlan,
  userTokens,
  targetUserId,
  serviceContext
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Definição dos custos de tokens por tipo de mensagem
  const tokenCosts = {
    basic_message: 10,
    medium_message: 20,
    long_message: 40
  };

  // Configurações de planos para chat com IA contextual
  const planLimits = {
    free: { messagesPerDay: 3, aiResponses: false, directChat: false, smartRecommendations: false },
    basic: { messagesPerDay: 15, aiResponses: true, directChat: true, smartRecommendations: true },
    standard: { messagesPerDay: 50, aiResponses: true, directChat: true, smartRecommendations: true },
    pro: { messagesPerDay: 200, aiResponses: true, directChat: true, smartRecommendations: true },
    max: { messagesPerDay: -1, aiResponses: true, directChat: true, smartRecommendations: true }
  };

  // Custo fixo por mensagem: 200 tokens
  const MESSAGE_COST = 200;
  const MAX_MESSAGE_LENGTH = 120; // Limite de caracteres por mensagem

  // Sistema de contexto inteligente
  const getContextualResponse = (message: string, userBehavior: any) => {
    const currentHour = new Date().getHours();
    const isUrgent = message.toLowerCase().includes('urgente') || message.toLowerCase().includes('emergência');
    const isPriceQuery = message.toLowerCase().includes('preço') || message.toLowerCase().includes('valor');
    const isScheduleQuery = message.toLowerCase().includes('horário') || message.toLowerCase().includes('quando');
    
    // IA contextual baseada em horário e comportamento
    if (currentHour >= 18 && currentHour <= 22) {
      return "🌙 Boa noite! Nossos profissionais estão finalizando os serviços do dia. Para emergências, temos profissionais disponíveis 24h no plano Pro.";
    }
    
    if (isUrgent) {
      return "🚨 Situação urgente detectada! Conectando você com profissionais disponíveis agora. Tempo médio de resposta: 15 minutos.";
    }
    
    if (isPriceQuery) {
      return "💰 Preços baseados em sua localização e urgência. Profissionais próximos oferecem 15% desconto. Quer ver orçamentos personalizados?";
    }
    
    if (isScheduleQuery) {
      return "📅 Horários disponíveis hoje: 9h-17h (padrão) | 18h-22h (adicional 20%) | 22h-9h (emergência +50%). Qual prefere?";
    }
    
    return "🤖 Olá! Como posso ajudar você a encontrar o profissional perfeito? Tenho acesso a análise comportamental para recomendações mais assertivas.";
  };

  useEffect(() => {
    initializeChat();
    loadChatHistory();
    
    // Simular conexão real-time
    const interval = setInterval(() => {
      checkForNewMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [userId, targetUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = () => {
    // Mensagem de boas-vindas da IA baseada no plano
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      content: generateWelcomeMessage(),
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      aiGenerated: true
    };

    setMessages([welcomeMessage]);
    
    // Adicionar mensagens automáticas baseadas no contexto
    if (serviceContext) {
      setTimeout(() => {
        addServiceContextMessage();
      }, 2000);
    }
  };

  const generateWelcomeMessage = (): string => {
    const planMessages = {
      free: `👋 Olá! Sou sua assistente IA da Orbitrum. Como usuário Free, você tem 3 mensagens gratuitas por dia. Para chat ilimitado com IA e profissionais, considere um plano pago!`,
      
      basic: `🌟 Olá! Sou sua assistente IA premium da Orbitrum. Como usuário Básico, você tem 15 mensagens por dia e respostas IA inteligentes. Como posso ajudar você hoje?`,
      
      standard: `💎 Bem-vindo de volta! Como usuário Standard, você tem 50 mensagens diárias e IA avançada. Estou aqui para otimizar suas conexões profissionais!`,
      
      pro: `🚀 Olá, usuário Pro! Com suas 200 mensagens diárias e IA premium, posso ajudar com matching avançado, negociações e muito mais!`,
      
      max: `👑 Olá, usuário Max! Você tem acesso ilimitado ao chat com IA premium e todas as funcionalidades avançadas. Como posso maximizar seus resultados hoje?`
    };

    return planMessages[userPlan] || planMessages.free;
  };

  const addServiceContextMessage = () => {
    if (!serviceContext) return;

    const contextMessage: ChatMessage = {
      id: `context-${Date.now()}`,
      content: `🔧 Vejo que você está interessado em "${serviceContext}". Posso ajudar com detalhes do serviço, negociação de preços, agendamento e conectar você com os melhores profissionais!`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      aiGenerated: true
    };

    setMessages(prev => [...prev, contextMessage]);
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history/${userId}${targetUserId ? `/${targetUserId}` : ''}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Email': localStorage.getItem('userEmail') || ''
        }
      });

      if (response.ok) {
        const history = await response.json();
        // Mesclar histórico real com mensagens atuais
        console.log('📞 Chat conectado - Histórico carregado');
      }
    } catch (error) {
      console.log('Usando chat em tempo real sem histórico');
    }
  };

  const checkForNewMessages = async () => {
    // Simular recebimento de mensagens em tempo real
    if (Math.random() < 0.1) { // 10% chance de nova mensagem
      receiveAutoMessage();
    }
  };

  const receiveAutoMessage = () => {
    const autoMessages = [
      `💡 Dica da IA: Profissionais com rating 4.8+ respondem 60% mais rápido!`,
      `🎯 Baseado no seu histórico, encontrei 3 profissionais ideais para você!`,
      `📊 Seu perfil está 85% completo. Completar aumenta suas chances de sucesso!`,
      `🚀 Nova funcionalidade: Agendamento automático já está disponível!`,
      `⭐ 15 profissionais estão online agora na sua região!`
    ];

    const randomMessage = autoMessages[Math.floor(Math.random() * autoMessages.length)];

    const autoMessage: ChatMessage = {
      id: `auto-${Date.now()}`,
      content: randomMessage,
      sender: 'ai',
      timestamp: new Date(),
      type: 'system_notification',
      aiGenerated: true
    };

    setMessages(prev => [...prev, autoMessage]);
  };

  const canSendMessage = (): boolean => {
    const limits = planLimits[userPlan];
    
    if (limits.messagesPerDay === -1) return true; // Ilimitado
    
    return messageCount < limits.messagesPerDay;
  };

  const getMessageCost = (messageType: keyof typeof tokenCosts): number => {
    return tokenCosts[messageType];
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !canSendMessage()) return;

    // Limitar tamanho da mensagem
    const trimmedMessage = newMessage.trim().substring(0, MAX_MESSAGE_LENGTH);
    
    // Custo fixo por mensagem: 25 tokens (padrão do backend)
    const cost = 25;

    // Verificar se tem tokens suficientes (exceto Max)
    if (userTokens < cost && userPlan !== 'max') {
      // Mostrar mensagem direcionando para +tokens
      const noTokensMessage: ChatMessage = {
        id: `no-tokens-${Date.now()}`,
        content: `💳 Ops! Você não tem tokens suficientes para esta mensagem (necessário: ${cost} tokens). 

🛒 Para continuar o chat IA:
1. Clique em "+Tokens" no menu
2. Compre tokens a partir de R$ 3,00
3. Volte aqui para continuar nossa conversa!

💡 Dica: Mensagens básicas custam 25 tokens!`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'system_notification'
      };
      
      setMessages(prev => [...prev, noTokensMessage]);
      setNewMessage('');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: trimmedMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      tokenCost: cost
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageCount(prev => prev + 1);

    // Enviar mensagem para backend (incluindo débito de tokens)
    await sendToBackend(trimmedMessage);
    
    setNewMessage('');
  };

  const sendToBackend = async (message: string) => {
    try {
      const userEmail = localStorage.getItem('userEmail') || '';
      console.log('💬 ENVIANDO MENSAGEM:', { message, userEmail, userId });
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Email': userEmail
        },
        body: JSON.stringify({
          senderId: userId,
          content: message,
          messageType: 'basic_message'
        })
      });

      const result = await response.json();
      console.log('💬 RESPOSTA BACKEND:', result);
      
      if (result.success) {
        // Resposta da IA será adicionada automaticamente pelo backend
        console.log('✅ MENSAGEM ENVIADA - Tokens debitados:', result.tokenCost);
        
        // Aguardar resposta da IA
        setTimeout(() => {
          checkForAIResponse();
        }, 2000);
      } else {
        console.error('❌ ERRO NO CHAT:', result.message);
      }
    } catch (error) {
      console.log('❌ Erro ao enviar mensagem:', error);
    }
  };

  const checkForAIResponse = async () => {
    try {
      const response = await fetch(`/api/chat/history/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Email': localStorage.getItem('userEmail') || ''
        }
      });

      if (response.ok) {
        const history = await response.json();
        
        // Adicionar novas mensagens IA que não estão na lista atual
        const aiMessages = history.messages.filter((msg: any) => 
          msg.aiGenerated && !messages.find(m => m.id === msg.id)
        );
        
        if (aiMessages.length > 0) {
          const newAIMessages = aiMessages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: 'ai' as const,
            timestamp: new Date(msg.timestamp),
            type: 'text' as const,
            aiGenerated: true,
            tokenCost: msg.tokenCost
          }));
          
          setMessages(prev => [...prev, ...newAIMessages]);
          console.log('🤖 IA RESPONDEU:', newAIMessages.length, 'mensagens');
        }
      }
    } catch (error) {
      console.log('Erro ao verificar resposta IA:', error);
    }
  };

  const debitTokens = async (amount: number) => {
    try {
      const userEmail = localStorage.getItem('userEmail') || '';
      console.log('💳 DEBITANDO TOKENS:', { amount, userEmail, userId });
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Email': userEmail
        },
        body: JSON.stringify({
          senderId: userId,
          content: newMessage.trim(),
          messageType: 'basic_message'
        })
      });

      const result = await response.json();
      console.log('💬 RESPOSTA CHAT:', result);
      
      if (!result.success) {
        console.error('Erro no chat:', result.message);
      }
    } catch (error) {
      console.log('Erro ao enviar mensagem:', error);
    }
  };

  const generateAIResponse = async (userInput: string) => {
    setIsAITyping(true);

    // Simular processamento da IA
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const aiResponse = await generateIntelligentResponse(userInput);

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      aiGenerated: true,
      tokenCost: getMessageCost('ai_response')
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsAITyping(false);

    // Debitar tokens da resposta IA
    await debitTokens(getMessageCost('ai_response'));
  };

  const generateIntelligentResponse = async (input: string): Promise<string> => {
    const lowerInput = input.toLowerCase();

    // Respostas inteligentes baseadas no contexto - MOBILE OTIMIZADO
    if (lowerInput.includes('preço') || lowerInput.includes('valor') || lowerInput.includes('quanto')) {
      return `💰 Preços a combinar com profissionais. Posso conectar com 5 opções! Ver?`;
    }

    if (lowerInput.includes('horário') || lowerInput.includes('quando') || lowerInput.includes('agenda')) {
      return `📅 12 disponíveis hoje, 8 amanhã. Horários populares: 9h-11h, 14h-16h. Verificar disponibilidade?`;
    }

    if (lowerInput.includes('melhor') || lowerInput.includes('recomend') || lowerInput.includes('indicar')) {
      return `⭐ 3 ideais: Ana (4.9★), Carlos (4.8★), João (4.7★). Ver perfis?`;
    }

    if (lowerInput.includes('urgente') || lowerInput.includes('rápido') || lowerInput.includes('hoje')) {
      return `🚨 4 disponíveis AGORA! Conectar por 200 tokens? Confirma?`;
    }

    // Resposta padrão inteligente - MOBILE CURTA
    const responses = [
      `🎯 ${userType === 'client' ? 'Cliente' : 'Pro'}: conexões IA, preços, agenda. O que fazer?`,
      
      `💡 Plano ${userPlan.toUpperCase()}: matching IA, chat direto, agenda. Explorar?`,
      
      `🚀 Usuário ativo! Análise comportamental + sugestões. Começar?`,
      
      `📊 Dados únicos! Estratégia para ${userType === 'client' ? 'profissionais perfeitos' : 'clientes ideais'}?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPlanUpgradeMessage = () => {
    return (
      <Alert className="mb-4">
        <Crown className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Chat Premium Bloqueado</p>
            <p className="text-sm">
              {userPlan === 'free' 
                ? 'Usuários Free têm 3 mensagens por dia. Upgrade para Básico (R$ 7/mês) para chat ilimitado!'
                : `Tokens insuficientes. Você precisa de ${tokenCosts.basic_message} tokens para enviar mensagens.`
              }
            </p>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                Fazer Upgrade
              </Button>
              <Button size="sm" variant="outline">
                Comprar Tokens
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="glassmorphism border-cyan-500/30 h-52 sm:h-56 flex flex-col scale-92 sm:scale-98">
      <CardHeader className="pb-1 px-2 sm:px-4">
        <CardTitle className="flex items-center justify-between text-cyan-400 text-xs sm:text-sm">
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs">IA</span>
          </div>
          
          <div className="flex items-center space-x-1 text-xs">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs px-1 py-0">
              {userPlan === 'max' ? 'MAX' : userPlan.charAt(0).toUpperCase()}
            </Badge>
            
            <div className="flex items-center space-x-0.5 text-yellow-400">
              <Coins className="w-3 h-3" />
              <span className="text-xs">{userTokens}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-1 sm:space-y-2 px-2 sm:px-4 pb-2 sm:pb-4">
        {showPlanUpgrade && getPlanUpgradeMessage()}

        {/* Área de mensagens - Mobile otimizada */}
        <div className="flex-1 overflow-y-auto space-y-0.5 max-h-20 sm:max-h-24" style={{ scrollBehavior: 'smooth' }}>
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] sm:max-w-[75%] p-0.5 sm:p-1 rounded text-xs ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : message.sender === 'ai'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                    : 'bg-gray-700/50'
                }`}>
                  <div className="flex items-start space-x-1">
                    {message.sender === 'ai' && <Bot className="w-3 h-3 mt-0.5 text-purple-400 flex-shrink-0" />}
                    {message.sender === 'user' && <UserIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-tight break-words">{
                        // Mensagens ultra compactas para mobile/Telegram
                        window.innerWidth < 640 && message.content.length > 45 
                          ? `${message.content.substring(0, 45)}...` 
                          : message.content
                      }</p>
                      
                      <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                        <span className="text-xs">{message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        {message.tokenCost && (
                          <div className="flex items-center space-x-0.5">
                            <Coins className="w-2.5 h-2.5" />
                            <span className="text-xs">{message.tokenCost}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAITyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-1 text-purple-400"
            >
              <Bot className="w-3 h-3" />
              <div className="flex space-x-0.5">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-xs">...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input de nova mensagem - Mobile compacto */}
        <div className="border-t border-gray-600/30 pt-1 sm:pt-2">
          <div className="flex space-x-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value.substring(0, MAX_MESSAGE_LENGTH))}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={
                !canSendMessage() 
                  ? `Limite`
                  : userTokens < MESSAGE_COST && userPlan !== 'max'
                  ? `200 tokens`
                  : "200 tokens/msg..."
              }
              className="bg-gray-700/50 border-gray-600/30 text-xs h-5 sm:h-6"
              disabled={!canSendMessage() || !isConnected || (userTokens < MESSAGE_COST && userPlan !== 'max')}
            />
            
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !canSendMessage() || !isConnected || (userTokens < MESSAGE_COST && userPlan !== 'max')}
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-1 h-5 sm:h-6"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span className="text-xs">
              {planLimits[userPlan].messagesPerDay === -1 
                ? '∞' 
                : `${messageCount}/${planLimits[userPlan].messagesPerDay}`
              }
            </span>
            
            <span className="flex items-center space-x-0.5 text-xs">
              <Coins className="w-2.5 h-2.5" />
              <span>
                {newMessage.length > 100 ? tokenCosts.long_message : 
                 newMessage.length > 50 ? tokenCosts.medium_message : 
                 tokenCosts.basic_message}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAutoChatSystem;