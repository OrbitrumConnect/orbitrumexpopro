import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  MessageCircle, 
  Radar, 
  Award, 
  Star, 
  Zap,
  Target,
  Eye,
  X
} from 'lucide-react';

interface NotificationData {
  id: string;
  type: 'daily_access' | 'client_message' | 'new_professional' | 'achievement';
  title: string;
  message: string;
  icon: any;
  color: string;
  effect: 'decolagem' | 'ping' | 'radar' | 'brilho_dourado';
  userName?: string;
}

interface AICommanderNotificationsProps {
  user: any;
  onShowReports?: () => void;
}

const AICommanderNotifications: React.FC<AICommanderNotificationsProps> = ({ 
  user, 
  onShowReports 
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null);
  const [showCommanderMessage, setShowCommanderMessage] = useState(false);

  // Simular notificações baseadas em eventos reais
  const generateNotifications = () => {
    const currentHour = new Date().getHours();
    const userName = user?.username || 'Comandante';
    
    // Só gera notificações se houver dados reais do usuário
    if (!user || !user.email) return;

    const possibleNotifications: NotificationData[] = [];

    // 1. Acesso diário (apenas primeira vez na sessão)
    const lastAccess = localStorage.getItem('lastDailyAccess');
    const today = new Date().toDateString();
    const sessionWelcome = sessionStorage.getItem('sessionWelcome');
    
    if (lastAccess !== today && !sessionWelcome) {
      possibleNotifications.push({
        id: 'daily_' + Date.now(),
        type: 'daily_access',
        title: '🚀 Nova Missão Diária',
        message: `${userName}! Nova missão diária. +1 token!`,
        icon: Rocket,
        color: 'from-green-500 to-emerald-500',
        effect: 'decolagem',
        userName
      });
      localStorage.setItem('lastDailyAccess', today);
      sessionStorage.setItem('sessionWelcome', 'shown');
    }

    // 2. Mensagem de cliente (extremamente raro)
    if (Math.random() > 0.995 && currentHour >= 9 && currentHour <= 18) {
      possibleNotifications.push({
        id: 'message_' + Date.now(),
        type: 'client_message',
        title: '💬 Comunicação Interestelar',
        message: `${userName}, nova comunicação recebida! Verifique painel.`,
        icon: MessageCircle,
        color: 'from-blue-500 to-cyan-500',
        effect: 'ping',
        userName
      });
    }

    // 3. Profissional na área (quase nunca aparece)
    if (user.userType === 'client' && Math.random() > 0.998) {
      possibleNotifications.push({
        id: 'professional_' + Date.now(),
        type: 'new_professional',
        title: '📡 Radar Detectou Especialista',
        message: `${userName}, novo especialista detectado! Rating 4.8⭐ disponível.`,
        icon: Radar,
        color: 'from-cyan-500 to-blue-500',
        effect: 'radar',
        userName
      });
    }

    // 4. Conquista (baseado em uso real - muito raro)
    const userActivity = (user.searchHistory?.length || 0) + (user.serviceHistory?.length || 0);
    if (userActivity >= 5 && userActivity % 5 === 0 && Math.random() > 0.9) {
      possibleNotifications.push({
        id: 'achievement_' + Date.now(),
        type: 'achievement',
        title: '🏅 Trio Estelar Conquistado',
        message: `Parabéns ${userName}! Trio Estelar conquistado!`,
        icon: Award,
        color: 'from-yellow-500 to-orange-500',
        effect: 'brilho_dourado',
        userName
      });
    }

    // Adicionar notificações válidas
    if (possibleNotifications.length > 0) {
      setNotifications(prev => [...prev, ...possibleNotifications]);
    }
  };

  // Mostrar mensagem do comandante IA
  const showCommanderReport = (notification: NotificationData) => {
    setActiveNotification(notification);
    setShowCommanderMessage(true);
    
    // Auto-fechar após 8 segundos
    setTimeout(() => {
      setShowCommanderMessage(false);
      setActiveNotification(null);
    }, 8000);
  };

  // Efeitos visuais por tipo
  const getVisualEffect = (effect: string) => {
    switch (effect) {
      case 'decolagem':
        return {
          initial: { scale: 0.8, rotate: -10 },
          animate: { scale: [0.8, 1.2, 1], rotate: [0, 5, 0] },
          transition: { duration: 0.8 }
        };
      case 'ping':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 0.5, repeat: 2 }
        };
      case 'radar':
        return {
          initial: { rotate: 0 },
          animate: { rotate: 360 },
          transition: { duration: 2, repeat: 1 }
        };
      case 'brilho_dourado':
        return {
          initial: { boxShadow: '0 0 0 rgba(255, 215, 0, 0)' },
          animate: { boxShadow: '0 0 30px rgba(255, 215, 0, 0.8)' },
          transition: { duration: 1, repeat: 3, repeatType: 'reverse' as const }
        };
      default:
        return {};
    }
  };

  // Gerar notificações em intervalos
  useEffect(() => {
    generateNotifications();
    
    const interval = setInterval(() => {
      generateNotifications();
    }, 120000); // Verificar a cada 2 minutos

    return () => clearInterval(interval);
  }, [user]);

  // Remover notificação
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {/* Lista de Notificações */}
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50"
            style={{ marginTop: `${index * 60}px` }}
          >
            <motion.div {...getVisualEffect(notification.effect)}>
              <Card className="glassmorphism border-gray-700/50 w-48 sm:w-56 cursor-pointer hover:border-cyan-400/50 transition-all">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${notification.color} bg-opacity-20`}>
                        <notification.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-xs">{notification.title}</h4>
                        <p className="text-gray-300 text-xs mt-0.5 leading-tight">
                          {notification.message.length > 45 ? notification.message.substring(0, 45) + '...' : notification.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button 
                            size="sm"
                            onClick={() => showCommanderReport(notification)}
                            className={`bg-gradient-to-r ${notification.color} hover:opacity-80 text-white border-none text-xs h-6 px-2`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Relatório
                          </Button>
                          <Badge variant="outline" className="text-xs text-gray-400 border-gray-500/50">
                            IA
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Mensagem do Comandante IA */}
      <AnimatePresence>
        {showCommanderMessage && activeNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-cyan-400/50 max-w-md w-full p-6 text-center"
            >
              {/* Avatar IA Comandante */}
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center"
              >
                <Zap className="h-8 w-8 text-white" />
              </motion.div>

              <h3 className="text-white font-bold text-lg mb-2">Comandante IA</h3>
              
              <div className="space-y-3 mb-6">
                <p className="text-cyan-400 font-semibold">
                  "Olá, comandante {activeNotification.userName}!"
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Seu desempenho hoje foi incrível. Órbitas completadas com sucesso! 
                  Detectei atividade excepcional em seus sistemas.
                </p>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center justify-center space-x-2"
                >
                  <Target className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm font-semibold">Missão: SUCESSO</span>
                  <Target className="h-4 w-4 text-green-400" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    setShowCommanderMessage(false);
                    setActiveNotification(null);
                    onShowReports?.();
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-none"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Ver Relatórios da Missão
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setShowCommanderMessage(false);
                    setActiveNotification(null);
                  }}
                  className="w-full text-gray-400 hover:text-white"
                >
                  Continuar Navegação
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICommanderNotifications;