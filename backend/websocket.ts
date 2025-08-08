import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ClientData {
  userId: number;
  userType: 'client' | 'professional' | 'admin';
  username: string;
}

export class DashboardWebSocket {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientData> = new Map();
  private activeTracking: Map<string, any> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws, req) => {
      // console.log('🔗 Nova conexão WebSocket'); // Silenciado para logs limpos
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          // console.error('❌ Erro ao processar mensagem WS:', error); // Silenciado
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        // Remover sessões de rastreamento associadas a esta conexão
        for (const [serviceId, tracking] of this.activeTracking.entries()) {
          if (tracking.ws === ws) {
            this.activeTracking.delete(serviceId);
            console.log(`🛑 Rastreamento auto-finalizado para serviço ${serviceId}`);
          }
        }
        // console.log('🔌 Conexão WebSocket fechada'); // Silenciado
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'auth':
        this.clients.set(ws, {
          userId: message.userId,
          userType: message.userType,
          username: message.username
        });
        // console.log(`✅ Cliente autenticado: ${message.username} (${message.userType})`); // Silenciado
        
        // Notificar admin sobre nova conexão
        this.broadcastToAdmins({
          type: 'user_connected',
          data: {
            userId: message.userId,
            username: message.username,
            userType: message.userType,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'tracking_start':
        // Iniciar rastreamento de um serviço
        this.activeTracking.set(message.serviceId, {
          professionalId: message.professionalId,
          startTime: Date.now(),
          lastUpdate: Date.now(),
          ws: ws
        });
        console.log(`🚗 Rastreamento iniciado para serviço ${message.serviceId}`);
        
        // Confirmar início do rastreamento
        ws.send(JSON.stringify({
          type: 'tracking_started',
          serviceId: message.serviceId,
          timestamp: new Date().toISOString()
        }));
        break;
        
      case 'tracking_stop':
        // Parar rastreamento
        this.activeTracking.delete(message.serviceId);
        console.log(`🛑 Rastreamento finalizado para serviço ${message.serviceId}`);
        break;
        
      case 'position_update':
        // Atualizar posição do profissional
        const tracking = this.activeTracking.get(message.serviceId);
        if (tracking) {
          tracking.lastUpdate = Date.now();
          tracking.position = message.position;
          
          // Broadcast para todos os clientes conectados
          this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'position_update',
                serviceId: message.serviceId,
                position: message.position,
                distance: message.distance,
                estimatedArrival: message.estimatedArrival,
                timestamp: new Date().toISOString()
              }));
            }
          });
        }
        break;

      case 'dashboard_activity':
        // Transmitir atividade do dashboard para admin
        this.broadcastToAdmins({
          type: 'dashboard_activity',
          data: {
            ...message.data,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'game_started':
        this.broadcastToAdmins({
          type: 'real_time_activity',
          data: {
            type: 'game_started',
            userId: message.userId,
            username: this.clients.get(ws)?.username,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'tokens_spent':
        this.broadcastToAdmins({
          type: 'real_time_activity',
          data: {
            type: 'tokens_spent',
            userId: message.userId,
            username: this.clients.get(ws)?.username,
            amount: message.amount,
            service: message.service,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'team_created':
        this.broadcastToAdmins({
          type: 'real_time_activity',
          data: {
            type: 'team_created',
            userId: message.userId,
            username: this.clients.get(ws)?.username,
            teamName: message.teamName,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'admin_notification':
        // Admin enviando notificação para usuários específicos
        if (message.targetUserId) {
          this.sendToUser(message.targetUserId, {
            type: 'admin_notification',
            data: message.data
          });
        } else {
          // Broadcast para todos
          this.broadcast({
            type: 'admin_notification',
            data: message.data
          });
        }
        break;
    }
  }

  private broadcastToAdmins(message: any) {
    this.clients.forEach((clientData, ws) => {
      if (clientData.userType === 'admin' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  private sendToUser(userId: number, message: any) {
    this.clients.forEach((clientData, ws) => {
      if (clientData.userId === userId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  private broadcast(message: any) {
    this.clients.forEach((clientData, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Métodos públicos para enviar notificações
  public notifyTokenUsage(userId: number, username: string, amount: number, service: string) {
    this.broadcastToAdmins({
      type: 'real_time_activity',
      data: {
        type: 'tokens_spent',
        userId,
        username,
        amount,
        service,
        timestamp: new Date().toISOString()
      }
    });
  }

  public notifyGameActivity(userId: number, username: string, score: number, tokensEarned: number) {
    this.broadcastToAdmins({
      type: 'real_time_activity',
      data: {
        type: 'game_completed',
        userId,
        username,
        score,
        tokensEarned,
        timestamp: new Date().toISOString()
      }
    });
  }

  public getConnectedUsers() {
    const users: any[] = [];
    this.clients.forEach((clientData) => {
      users.push({
        userId: clientData.userId,
        username: clientData.username,
        userType: clientData.userType
      });
    });
    return users;
  }
}

let dashboardWS: DashboardWebSocket;

export function initializeWebSocket(server: Server) {
  dashboardWS = new DashboardWebSocket(server);
  return dashboardWS;
}

export function getDashboardWS() {
  return dashboardWS;
}