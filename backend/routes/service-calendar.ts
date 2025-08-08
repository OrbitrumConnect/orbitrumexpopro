import express from 'express';
import type { Request, Response } from 'express';
import { storage } from '../storage';

const router = express.Router();

// Armazenamento de serviços sincronizados
let serviceCalendar: any[] = [];
let serviceNotifications: any[] = [];

// POST - Adicionar serviço aceito ao calendário automático
router.post('/add-service', async (req: Request, res: Response) => {
  try {
    const { 
      professionalId, 
      clientId, 
      serviceType, 
      date, 
      time, 
      price, 
      description,
      address,
      estimatedDuration 
    } = req.body;

    if (!professionalId || !clientId || !serviceType || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados obrigatórios: professionalId, clientId, serviceType, date, time' 
      });
    }

    // Buscar dados do profissional e cliente
    const professional = await storage.getUser(professionalId);
    const client = await storage.getUser(clientId);
    
    if (!professional || !client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profissional ou cliente não encontrado' 
      });
    }

    const serviceEntry = {
      id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      professionalId: parseInt(professionalId),
      clientId: parseInt(clientId),
      professionalName: professional.username,
      clientName: client.username,
      serviceType,
      scheduledDate: new Date(`${date}T${time}`),
      price: parseFloat(price) || 0,
      description: description || `Serviço de ${serviceType}`,
      address,
      estimatedDuration: estimatedDuration || 120, // 2 horas padrão
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      canCancel: true,
      requiresMutualConsent: true
    };

    serviceCalendar.push(serviceEntry);

    console.log('📅 SERVIÇO ADICIONADO AO CALENDÁRIO:', {
      id: serviceEntry.id,
      professional: professional.username,
      client: client.username,
      service: serviceType,
      date: `${date} ${time}`
    });

    // Criar notificações para ambas as partes
    const notifications = [
      {
        id: `notif-prof-${Date.now()}`,
        userId: professionalId,
        type: 'service_scheduled',
        title: 'Novo Serviço Agendado',
        message: `Serviço de ${serviceType} agendado para ${date} às ${time} com ${client.username}`,
        serviceId: serviceEntry.id,
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: `notif-client-${Date.now()}`,
        userId: clientId,
        type: 'service_confirmed',
        title: 'Serviço Confirmado',
        message: `${professional.username} confirmou seu serviço de ${serviceType} para ${date} às ${time}`,
        serviceId: serviceEntry.id,
        timestamp: new Date().toISOString(),
        read: false
      }
    ];

    serviceNotifications.push(...notifications);

    res.json({
      success: true,
      message: 'Serviço adicionado ao calendário com sucesso',
      service: serviceEntry,
      notifications: notifications.length
    });

  } catch (error) {
    console.error('Erro ao adicionar serviço:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// GET - Obter serviços do calendário por usuário
router.get('/user-services/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    let userServices = serviceCalendar.filter(service => 
      service.professionalId === parseInt(userId) || 
      service.clientId === parseInt(userId)
    );

    // Filtrar por período se fornecido
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      userServices = userServices.filter(service => {
        const serviceDate = new Date(service.scheduledDate);
        return serviceDate >= start && serviceDate <= end;
      });
    }

    // Ordenar por data
    userServices.sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    res.json({
      success: true,
      services: userServices,
      total: userServices.length
    });

  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// POST - Solicitar cancelamento (requer consentimento mútuo)
router.post('/request-cancellation', async (req: Request, res: Response) => {
  try {
    const { serviceId, userId, reason } = req.body;

    if (!serviceId || !userId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'serviceId, userId e reason são obrigatórios' 
      });
    }

    const serviceIndex = serviceCalendar.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Serviço não encontrado' 
      });
    }

    const service = serviceCalendar[serviceIndex];
    
    // Verificar se usuário pode cancelar
    if (service.professionalId !== parseInt(userId) && service.clientId !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuário não autorizado para este serviço' 
      });
    }

    // Atualizar status do serviço
    service.cancellationRequested = {
      requestedBy: parseInt(userId),
      requestedAt: new Date().toISOString(),
      reason,
      status: 'pending',
      awaitingConsentFrom: service.professionalId === parseInt(userId) ? service.clientId : service.professionalId
    };

    service.status = 'cancellation_requested';

    // Criar notificação para a outra parte
    const otherUserId = service.professionalId === parseInt(userId) ? service.clientId : service.professionalId;
    const requester = await storage.getUser(parseInt(userId));
    const otherUser = await storage.getUser(otherUserId);

    const notification = {
      id: `notif-cancel-${Date.now()}`,
      userId: otherUserId,
      type: 'cancellation_request',
      title: 'Solicitação de Cancelamento',
      message: `${requester?.username} solicitou cancelamento do serviço de ${service.serviceType}. Motivo: ${reason}`,
      serviceId,
      actionRequired: true,
      timestamp: new Date().toISOString(),
      read: false
    };

    serviceNotifications.push(notification);

    console.log('❌ CANCELAMENTO SOLICITADO:', {
      serviceId,
      requestedBy: requester?.username,
      awaitingConsent: otherUser?.username,
      reason
    });

    res.json({
      success: true,
      message: 'Solicitação de cancelamento enviada',
      awaiting_consent_from: otherUser?.username,
      service: service
    });

  } catch (error) {
    console.error('Erro ao solicitar cancelamento:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// POST - Responder à solicitação de cancelamento
router.post('/respond-cancellation', async (req: Request, res: Response) => {
  try {
    const { serviceId, userId, response, reason } = req.body; // response: 'accept' | 'reject'

    if (!serviceId || !userId || !response) {
      return res.status(400).json({ 
        success: false, 
        message: 'serviceId, userId e response são obrigatórios' 
      });
    }

    const serviceIndex = serviceCalendar.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Serviço não encontrado' 
      });
    }

    const service = serviceCalendar[serviceIndex];
    
    // Verificar se há solicitação pendente
    if (!service.cancellationRequested || service.cancellationRequested.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhuma solicitação de cancelamento pendente' 
      });
    }

    // Verificar se usuário é o autorizado a responder
    if (service.cancellationRequested.awaitingConsentFrom !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuário não autorizado a responder esta solicitação' 
      });
    }

    const responder = await storage.getUser(parseInt(userId));
    const requester = await storage.getUser(service.cancellationRequested.requestedBy);

    if (response === 'accept') {
      // Cancelamento aceito - remover do calendário
      service.status = 'cancelled';
      service.cancellationRequested.status = 'accepted';
      service.cancellationRequested.respondedAt = new Date().toISOString();
      service.cancellationRequested.responseReason = reason;

      // Notificar o solicitante
      const notification = {
        id: `notif-cancel-accept-${Date.now()}`,
        userId: service.cancellationRequested.requestedBy,
        type: 'cancellation_accepted',
        title: 'Cancelamento Aprovado',
        message: `${responder?.username} aprovou o cancelamento do serviço de ${service.serviceType}`,
        serviceId,
        timestamp: new Date().toISOString(),
        read: false
      };

      serviceNotifications.push(notification);

      console.log('✅ CANCELAMENTO APROVADO:', {
        serviceId,
        approvedBy: responder?.username,
        originalRequester: requester?.username
      });

      res.json({
        success: true,
        message: 'Cancelamento aprovado com sucesso',
        service: service
      });

    } else {
      // Cancelamento rejeitado - manter serviço ativo
      service.status = 'confirmed';
      service.cancellationRequested.status = 'rejected';
      service.cancellationRequested.respondedAt = new Date().toISOString();
      service.cancellationRequested.responseReason = reason;

      // Notificar o solicitante
      const notification = {
        id: `notif-cancel-reject-${Date.now()}`,
        userId: service.cancellationRequested.requestedBy,
        type: 'cancellation_rejected',
        title: 'Cancelamento Rejeitado',
        message: `${responder?.username} rejeitou o cancelamento do serviço de ${service.serviceType}. ${reason ? `Motivo: ${reason}` : ''}`,
        serviceId,
        timestamp: new Date().toISOString(),
        read: false
      };

      serviceNotifications.push(notification);

      console.log('❌ CANCELAMENTO REJEITADO:', {
        serviceId,
        rejectedBy: responder?.username,
        originalRequester: requester?.username,
        reason
      });

      res.json({
        success: true,
        message: 'Cancelamento rejeitado - serviço mantido',
        service: service
      });
    }

  } catch (error) {
    console.error('Erro ao responder cancelamento:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// GET - Obter notificações de serviços
router.get('/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userNotifications = serviceNotifications
      .filter(notif => notif.userId === parseInt(userId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20); // Últimas 20 notificações

    res.json({
      success: true,
      notifications: userNotifications,
      unreadCount: userNotifications.filter(n => !n.read).length
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// POST - Marcar notificação como lida
router.post('/mark-notification-read', async (req: Request, res: Response) => {
  try {
    const { notificationId, userId } = req.body;

    const notification = serviceNotifications.find(n => 
      n.id === notificationId && n.userId === parseInt(userId)
    );

    if (notification) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// GET - Estatísticas do calendário
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const userServices = serviceCalendar.filter(service => 
      service.professionalId === parseInt(userId) || 
      service.clientId === parseInt(userId)
    );

    const stats = {
      totalServices: userServices.length,
      confirmedServices: userServices.filter(s => s.status === 'confirmed').length,
      completedServices: userServices.filter(s => s.status === 'completed').length,
      cancelledServices: userServices.filter(s => s.status === 'cancelled').length,
      pendingCancellations: userServices.filter(s => s.status === 'cancellation_requested').length,
      upcomingServices: userServices.filter(s => 
        s.status === 'confirmed' && new Date(s.scheduledDate) > new Date()
      ).length,
      totalRevenue: userServices
        .filter(s => s.status === 'completed' && s.professionalId === parseInt(userId))
        .reduce((sum, s) => sum + s.price, 0)
    };

    res.json({ success: true, stats });

  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

export default router;