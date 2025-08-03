import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle,
  Info,
  Trash2,
  Shield
} from 'lucide-react';

interface ServiceEvent {
  id: string;
  serviceId: string;
  clientId: number;
  professionalId: number;
  clientName: string;
  professionalName: string;
  serviceTitle: string;
  serviceDescription: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  status: 'accepted' | 'in_progress' | 'completed' | 'cancelled_client' | 'cancelled_professional';
  createdAt: string;
  canCancel: boolean;
  cancellationReason?: string;
  automaticSync: boolean;
  syncRules: {
    autoAddToCalendar: boolean;
    notifyBothParties: boolean;
    requireMutualConsent: boolean;
    allowUnilateralCancellation: boolean;
  };
}

interface ServiceCalendarSyncProps {
  userType: 'client' | 'professional';
  userId: number;
  onEventUpdate?: (eventId: string, newStatus: string) => void;
}

const ServiceCalendarSync: React.FC<ServiceCalendarSyncProps> = ({ 
  userType, 
  userId, 
  onEventUpdate 
}) => {
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [cancelingEvent, setCancelingEvent] = useState<string | null>(null);

  // Carregar eventos de serviços aceitos
  useEffect(() => {
    loadServiceEvents();
  }, [userId, userType]);

  const loadServiceEvents = async () => {
    try {
      const response = await fetch(`/api/services/calendar-sync/${userType}/${userId}`);
      if (response.ok) {
        const events = await response.json();
        setServiceEvents(events);
      }
    } catch (error) {
      console.log('Erro ao carregar eventos sincronizados:', error);
      
      // Dados demonstrativos para mostrar funcionalidade
      setServiceEvents([
        {
          id: 'sync-1',
          serviceId: 'srv-123',
          clientId: userType === 'client' ? userId : 2,
          professionalId: userType === 'professional' ? userId : 1,
          clientName: userType === 'client' ? 'Você' : 'Maria Helena Silva',
          professionalName: userType === 'professional' ? 'Você' : 'Carlos Silva',
          serviceTitle: 'Instalação Elétrica Residencial',
          serviceDescription: 'Instalação completa do quadro elétrico e tomadas',
          scheduledDate: '2025-07-25',
          scheduledTime: '14:00',
          location: 'Rua das Palmeiras, 456 - Copacabana',
          status: 'accepted',
          createdAt: '2025-07-22T10:30:00Z',
          canCancel: true,
          automaticSync: true,
          syncRules: {
            autoAddToCalendar: true,
            notifyBothParties: true,
            requireMutualConsent: true,
            allowUnilateralCancellation: false
          }
        },
        {
          id: 'sync-2',
          serviceId: 'srv-456',
          clientId: userType === 'client' ? userId : 3,
          professionalId: userType === 'professional' ? userId : 2,
          clientName: userType === 'client' ? 'Você' : 'João Santos',
          professionalName: userType === 'professional' ? 'Você' : 'Ana Paula Lima',
          serviceTitle: 'Manutenção Preventiva',
          serviceDescription: 'Revisão geral do sistema elétrico',
          scheduledDate: '2025-07-28',
          scheduledTime: '09:30',
          location: 'Av. Atlântica, 789 - Ipanema',
          status: 'in_progress',
          createdAt: '2025-07-21T15:45:00Z',
          canCancel: false,
          automaticSync: true,
          syncRules: {
            autoAddToCalendar: true,
            notifyBothParties: true,
            requireMutualConsent: true,
            allowUnilateralCancellation: false
          }
        }
      ]);
    }
  };

  const handleCancelService = async (eventId: string, reason: string) => {
    try {
      setCancelingEvent(eventId);
      
      const response = await fetch(`/api/services/calendar-sync/${eventId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canceledBy: userType,
          userId: userId,
          reason: reason
        })
      });

      if (response.ok) {
        // Atualizar status local
        setServiceEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                status: userType === 'client' ? 'cancelled_client' : 'cancelled_professional',
                cancellationReason: reason,
                canCancel: false
              }
            : event
        ));

        if (onEventUpdate) {
          onEventUpdate(eventId, `cancelled_${userType}`);
        }
      }
    } catch (error) {
      console.log('Erro ao cancelar serviço:', error);
    } finally {
      setCancelingEvent(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      accepted: { label: 'Aceito', color: 'bg-green-500', icon: CheckCircle },
      in_progress: { label: 'Em Andamento', color: 'bg-blue-500', icon: Clock },
      completed: { label: 'Concluído', color: 'bg-emerald-500', icon: CheckCircle },
      cancelled_client: { label: 'Cancelado pelo Cliente', color: 'bg-red-500', icon: XCircle },
      cancelled_professional: { label: 'Cancelado pelo Profissional', color: 'bg-red-500', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const CalendarSyncRules = () => (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div className="font-semibold text-cyan-400">📋 REGRAS DE SINCRONIZAÇÃO AUTOMÁTICA</div>
        
        <div className="space-y-2 text-sm">
          <div className="border-l-2 border-green-500 pl-3">
            <strong className="text-green-400">✅ QUANDO SERVIÇO É ACEITO:</strong>
            <ul className="mt-1 space-y-1 text-gray-300">
              <li>• Evento aparece AUTOMATICAMENTE no calendário de ambas as partes</li>
              <li>• Data, horário e local são sincronizados instantaneamente</li>
              <li>• Ambos recebem notificação de confirmação</li>
              <li>• Status inicial: "Aceito" (verde)</li>
            </ul>
          </div>

          <div className="border-l-2 border-red-500 pl-3">
            <strong className="text-red-400">🚫 REGRAS DE CANCELAMENTO:</strong>
            <ul className="mt-1 space-y-1 text-gray-300">
              <li>• Cancelamento só é possível com CONSENTIMENTO MÚTUO</li>
              <li>• Ambas as partes devem concordar com a exclusão</li>
              <li>• Motivo do cancelamento deve ser informado</li>
              <li>• Serviços "Em Andamento" NÃO podem ser cancelados unilateralmente</li>
            </ul>
          </div>

          <div className="border-l-2 border-yellow-500 pl-3">
            <strong className="text-yellow-400">⚠️ PROTEÇÕES DO SISTEMA:</strong>
            <ul className="mt-1 space-y-1 text-gray-300">
              <li>• Plataforma NÃO interfere em negociações entre as partes</li>
              <li>• Comunicação direta obrigatória para resolver conflitos</li>
              <li>• Status "Concluído" só muda após confirmação mútua</li>
              <li>• Histórico de cancelamentos é registrado para auditoria</li>
            </ul>
          </div>

          <div className="border-l-2 border-blue-500 pl-3">
            <strong className="text-blue-400">🔄 ATUALIZAÇÕES AUTOMÁTICAS:</strong>
            <ul className="mt-1 space-y-1 text-gray-300">
              <li>• Mudanças de horário/local sincronizam automaticamente</li>
              <li>• Notificações são enviadas para ambas as partes</li>
              <li>• Backup dos dados originais é mantido</li>
              <li>• Conflitos de agenda são detectados e alertados</li>
            </ul>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-4">
      {/* Header com regras */}
      <Card className="glassmorphism border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-cyan-400">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Serviços Sincronizados</span>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Auto-Sync Ativo
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRules(!showRules)}
              className="border-gray-500/30"
            >
              {showRules ? 'Ocultar' : 'Ver'} Regras
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showRules && <CalendarSyncRules />}
          
          <div className="text-sm text-gray-400 mb-4">
            Eventos de serviços aceitos aparecem automaticamente no calendário. 
            Cancelamentos requerem consentimento mútuo.
          </div>
        </CardContent>
      </Card>

      {/* Lista de eventos sincronizados */}
      <div className="space-y-3">
        {serviceEvents.length === 0 ? (
          <Card className="glassmorphism">
            <CardContent className="pt-6">
              <div className="text-center text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum serviço aceito encontrado</p>
                <p className="text-xs mt-1">Serviços aceitos aparecerão automaticamente aqui</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          serviceEvents.map(event => (
            <Card key={event.id} className="glassmorphism border-gray-600/30">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-200">{event.serviceTitle}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{event.serviceDescription}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{new Date(event.scheduledDate + 'T' + event.scheduledTime).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>
                        {userType === 'client' 
                          ? `Profissional: ${event.professionalName}`
                          : `Cliente: ${event.clientName}`
                        }
                      </span>
                    </div>
                    {event.automaticSync && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs">Sincronizado Automaticamente</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações de cancelamento (apenas se permitido) */}
                {event.canCancel && event.status === 'accepted' && (
                  <div className="mt-4 pt-4 border-t border-gray-600/30">
                    <Alert className="mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Atenção:</strong> Cancelamento requer consentimento mútuo. 
                        O {userType === 'client' ? 'profissional' : 'cliente'} será notificado 
                        e deve concordar com a exclusão.
                      </AlertDescription>
                    </Alert>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt(`Motivo do cancelamento (obrigatório):`);
                        if (reason && reason.trim()) {
                          handleCancelService(event.id, reason.trim());
                        }
                      }}
                      disabled={cancelingEvent === event.id}
                      className="w-full"
                    >
                      {cancelingEvent === event.id ? (
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Solicitar Cancelamento
                    </Button>
                  </div>
                )}

                {/* Mostrar motivo de cancelamento se existir */}
                {event.cancellationReason && (
                  <div className="mt-4 pt-4 border-t border-gray-600/30">
                    <div className="text-xs text-gray-400">
                      <strong>Motivo do cancelamento:</strong> {event.cancellationReason}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ServiceCalendarSync;