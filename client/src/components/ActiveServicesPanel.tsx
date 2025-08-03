import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, Phone, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import TrackingMap from './TrackingMap';

interface ActiveService {
  id: string;
  professionalId: number;
  professionalName: string;
  professionalAvatar?: string;
  professionalPhone?: string;
  professionalRating: number;
  serviceName: string;
  status: 'accepted' | 'on_way' | 'arrived' | 'in_progress';
  startTime: string;
  estimatedArrival?: number; // minutos
  currentLocation?: { lat: number; lng: number };
  clientLocation: { lat: number; lng: number };
  professionalLocation: { lat: number; lng: number };
}

interface ActiveServicesPanelProps {
  userId?: number;
}

export default function ActiveServicesPanel({ userId }: ActiveServicesPanelProps) {
  const [selectedService, setSelectedService] = useState<ActiveService | null>(null);
  const [showTracking, setShowTracking] = useState(false);

  // Query para buscar serviços ativos reais
  const { data: activeServices, isLoading } = useQuery({
    queryKey: ['/api/services/active', userId],
    enabled: !!userId,
    staleTime: 30000, // 30 segundos
    refetchInterval: 30000 // Atualizar a cada 30s
  });

  const services = activeServices || [];

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'accepted': return 'Aceito';
      case 'on_way': return 'A Caminho';
      case 'arrived': return 'Chegou';
      case 'in_progress': return 'Em Andamento';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'accepted': return 'text-blue-400 bg-blue-500/20';
      case 'on_way': return 'text-orange-400 bg-orange-500/20';
      case 'arrived': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-cyan-400 bg-cyan-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const handleTrackService = (service: ActiveService) => {
    setSelectedService(service);
    setShowTracking(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Carregando serviços...</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-700/50 rounded-full mx-auto mb-4 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400 mb-2">Nenhum serviço ativo no momento</p>
        <p className="text-gray-500 text-sm">Contrate profissionais para ver o rastreamento aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service: ActiveService) => (
        <Card key={service.id} className="bg-gray-800/50 border-gray-600/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img 
                  src={service.professionalAvatar || `https://picsum.photos/50/50?random=${service.professionalId}`}
                  alt={service.professionalName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50"
                />
                <div>
                  <h4 className="text-white font-medium">{service.professionalName}</h4>
                  <p className="text-gray-300 text-sm">{service.serviceName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < service.professionalRating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                      />
                    ))}
                    <span className="text-gray-400 text-xs ml-1">{service.professionalRating}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {getStatusLabel(service.status)}
                </span>
                {service.estimatedArrival && service.status === 'on_way' && (
                  <p className="text-cyan-400 text-sm mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {service.estimatedArrival}min
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {(service.status === 'on_way' || service.status === 'arrived') && (
                <Button 
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  onClick={() => handleTrackService(service)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Rastrear GPS
                </Button>
              )}
              
              {service.professionalPhone && (
                <Button 
                  size="sm"
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                  onClick={() => window.open(`tel:${service.professionalPhone}`, '_self')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar
                </Button>
              )}
              
              <Button 
                size="sm"
                variant="outline"
                className="border-gray-500/50 text-gray-300 hover:bg-gray-500/20"
                onClick={() => window.open(`/chat/${service.professionalId}`, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modal de Rastreamento */}
      {showTracking && selectedService && (
        <TrackingMap
          serviceId={selectedService.id}
          professionalName={selectedService.professionalName}
          professionalLat={selectedService.professionalLocation.lat}
          professionalLng={selectedService.professionalLocation.lng}
          clientLat={selectedService.clientLocation.lat}
          clientLng={selectedService.clientLocation.lng}
          onClose={() => {
            setShowTracking(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
}