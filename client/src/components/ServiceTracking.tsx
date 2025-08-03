import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  AlertCircle,
  User,
  Calendar,
  Star,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ServiceTrackingProps {
  userType: 'professional' | 'client' | 'admin';
  userId: number;
  serviceId?: number;
}

interface ServiceStatus {
  id: number;
  clientId: number;
  professionalId: number;
  serviceType: string;
  status: 'pending' | 'traveling' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  arrivalTime?: string;
  completionTime?: string;
  completionCode?: string;
  clientLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  professionalLocation?: {
    lat: number;
    lng: number;
  };
  estimatedDuration: number;
  actualDuration?: number;
  rating?: number;
  feedback?: string;
  cost: number;
}

const ServiceTracking: React.FC<ServiceTrackingProps> = ({ 
  userType, 
  userId, 
  serviceId 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completionCode, setCompletionCode] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Query para buscar serviços ativos
  const { data: activeServices, isLoading } = useQuery({
    queryKey: [`/api/services/tracking/${userType}/${userId}`],
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Mutation para atualizar status do serviço
  const updateServiceMutation = useMutation({
    mutationFn: async (data: { serviceId: number; status: string; additionalData?: any }) => {
      const response = await fetch('/api/services/tracking/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Email': localStorage.getItem('userEmail') || '',
        },
        body: JSON.stringify({
          serviceId: data.serviceId,
          status: data.status,
          userId,
          userType,
          timestamp: new Date().toISOString(),
          location: await getCurrentLocation(),
          ...data.additionalData
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/tracking/${userType}/${userId}`] });
      
      if (data.completionCode) {
        setCompletionCode(data.completionCode);
        setShowCompletionModal(true);
      }
      
      toast({
        title: "Status Atualizado",
        description: data.message,
      });
    }
  });

  // Função para obter localização atual
  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
          resolve({ lat: 0, lng: 0 }); // Fallback
        }
      );
    });
  };

  // Renderização para Profissional
  const renderProfessionalView = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-cyan-400" />
            Controle de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.isArray(activeServices) ? activeServices.map((service: ServiceStatus) => (
            <div key={service.id} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">{service.serviceType}</h3>
                  <p className="text-gray-400 text-sm">Cliente ID: {service.clientId}</p>
                </div>
                <Badge variant={getStatusVariant(service.status)}>
                  {getStatusText(service.status)}
                </Badge>
              </div>

              <div className="flex gap-2">
                {service.status === 'pending' && (
                  <Button
                    onClick={() => updateServiceMutation.mutate({
                      serviceId: service.id,
                      status: 'traveling'
                    })}
                    className="neon-button flex-1"
                    disabled={updateServiceMutation.isPending}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Iniciar Trajeto
                  </Button>
                )}

                {service.status === 'traveling' && (
                  <Button
                    onClick={() => updateServiceMutation.mutate({
                      serviceId: service.id,
                      status: 'arrived'
                    })}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    disabled={updateServiceMutation.isPending}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Cheguei
                  </Button>
                )}

                {service.status === 'arrived' && (
                  <Button
                    onClick={() => updateServiceMutation.mutate({
                      serviceId: service.id,
                      status: 'completed',
                      additionalData: { generateCode: true }
                    })}
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                    disabled={updateServiceMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Serviço
                  </Button>
                )}
              </div>

              {service.status === 'traveling' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                  <p className="text-blue-400 text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    A caminho do cliente - {service.estimatedDuration} min estimados
                  </p>
                </div>
              )}
            </div>
          )) : null}

          {(!activeServices || activeServices.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              <Navigation className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum serviço ativo no momento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Renderização para Cliente
  const renderClientView = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-green-400" />
            Acompanhar Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeServices?.map((service: ServiceStatus) => (
            <div key={service.id} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">{service.serviceType}</h3>
                  <p className="text-gray-400 text-sm">Profissional ID: {service.professionalId}</p>
                </div>
                <Badge variant={getStatusVariant(service.status)}>
                  {getStatusText(service.status)}
                </Badge>
              </div>

              <div className="flex gap-2">
                {service.status === 'arrived' && (
                  <Button
                    onClick={() => updateServiceMutation.mutate({
                      serviceId: service.id,
                      status: 'in_progress'
                    })}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                    disabled={updateServiceMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Chegada
                  </Button>
                )}

                {service.status === 'completed' && !service.rating && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-yellow-600 hover:bg-yellow-700 flex-1">
                        <Star className="w-4 h-4 mr-2" />
                        Avaliar Serviço
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Avaliar Serviço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-white mb-2 block">Avaliação (1-5 estrelas)</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`}
                              >
                                ⭐
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-white mb-2 block">Comentário</label>
                          <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="Como foi o serviço?"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            updateServiceMutation.mutate({
                              serviceId: service.id,
                              status: 'rated',
                              additionalData: { rating, feedback }
                            });
                            setRating(0);
                            setFeedback('');
                          }}
                          className="neon-button w-full"
                        >
                          Enviar Avaliação
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {service.completionCode && (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <p className="text-green-400 text-sm font-medium">
                    Código de Conclusão: {service.completionCode}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Salve este código para seus registros
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // Renderização para Admin
  const renderAdminView = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-purple-400" />
            Monitoramento de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeServices?.map((service: ServiceStatus) => (
            <div key={service.id} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">{service.serviceType}</h3>
                  <p className="text-gray-400 text-sm">
                    Cliente: {service.clientId} | Profissional: {service.professionalId}
                  </p>
                </div>
                <Badge variant={getStatusVariant(service.status)}>
                  {getStatusText(service.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Início</p>
                  <p className="text-white">{service.startTime ? new Date(service.startTime).toLocaleTimeString() : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Chegada</p>
                  <p className="text-white">{service.arrivalTime ? new Date(service.arrivalTime).toLocaleTimeString() : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Duração</p>
                  <p className="text-white">{service.actualDuration || service.estimatedDuration} min</p>
                </div>
                <div>
                  <p className="text-gray-400">Valor</p>
                  <p className="text-white">R$ {service.cost.toFixed(2)}</p>
                </div>
              </div>

              {service.rating && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">{service.rating}/5 estrelas</span>
                  </div>
                  {service.feedback && (
                    <p className="text-gray-300 text-sm mt-1">{service.feedback}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // Função auxiliar para definir variante do status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'traveling': return 'default';
      case 'arrived': return 'outline';
      case 'in_progress': return 'destructive';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  // Função auxiliar para texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'traveling': return 'A Caminho';
      case 'arrived': return 'Chegou';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Modal de código de conclusão
  const CompletionModal = () => (
    <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
            Serviço Concluído!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <h3 className="text-green-400 font-bold text-xl mb-2">
              Código: {completionCode}
            </h3>
            <p className="text-gray-300 text-sm">
              Este código confirma a conclusão do serviço
            </p>
          </div>
          <Button 
            onClick={() => setShowCompletionModal(false)}
            className="neon-button w-full"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Navigation className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
          <p className="text-white">Carregando rastreamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {userType === 'professional' && renderProfessionalView()}
      {userType === 'client' && renderClientView()}
      {userType === 'admin' && renderAdminView()}
      <CompletionModal />
    </div>
  );
};

export default ServiceTracking;