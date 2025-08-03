import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface RealTimeActivity {
  type: 'game_started' | 'game_completed' | 'tokens_spent' | 'team_created' | 'user_connected';
  userId: number;
  username: string;
  timestamp: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeActivities, setRealTimeActivities] = useState<RealTimeActivity[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // console.log('🔗 WebSocket conectado'); // Silenciado para evitar spam de logs
      setIsConnected(true);
      
      // Autenticar no WebSocket
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
        userType: user.userType || 'client',
        username: user.username
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem WebSocket:', error);
      }
    };

    ws.onclose = () => {
      // console.log('🔌 WebSocket desconectado'); // Silenciado para logs limpos
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      // console.error('❌ Erro WebSocket:', error); // Silenciado - erro do Vite, não nosso
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isAuthenticated, user]);

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'real_time_activity':
        setRealTimeActivities(prev => [message.data, ...prev.slice(0, 49)]); // Manter apenas últimas 50
        break;
      
      case 'user_connected':
        setConnectedUsers(prev => {
          const exists = prev.find(u => u.userId === message.data.userId);
          if (!exists) {
            return [...prev, message.data];
          }
          return prev;
        });
        break;
      
      case 'admin_notification':
        // Mostrar notificação para o usuário
        console.log('📢 Notificação do admin:', message.data);
        break;
    }
  };

  const sendMessage = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  };

  const notifyGameStarted = () => {
    sendMessage('game_started', { userId: user?.id });
  };

  const notifyTokensSpent = (amount: number, service: string) => {
    sendMessage('tokens_spent', { 
      userId: user?.id, 
      amount, 
      service 
    });
  };

  const notifyTeamCreated = (teamName: string) => {
    sendMessage('team_created', { 
      userId: user?.id, 
      teamName 
    });
  };

  const notifyDashboardActivity = (activity: string, details?: any) => {
    sendMessage('dashboard_activity', {
      data: {
        userId: user?.id,
        username: user?.username,
        activity,
        details
      }
    });
  };

  return {
    isConnected,
    realTimeActivities,
    connectedUsers,
    notifyGameStarted,
    notifyTokensSpent,
    notifyTeamCreated,
    notifyDashboardActivity
  };
}