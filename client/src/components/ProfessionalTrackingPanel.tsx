import React, { useState, useEffect } from 'react';
import { MapPin, Clock, X, CheckCircle, Navigation, AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Service {
  id: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  serviceName: string;
  estimatedDuration: number;
  status: 'pending' | 'accepted' | 'on_way' | 'arrived' | 'completed' | 'cancelled';
  clientLat?: number;
  clientLng?: number;
}

interface ProfessionalTrackingPanelProps {
  services: Service[];
  onUpdateService: (serviceId: string, status: Service['status'], reason?: string) => void;
}

export default function ProfessionalTrackingPanel({ services, onUpdateService }: ProfessionalTrackingPanelProps) {
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isTrackingGPS, setIsTrackingGPS] = useState(false);

  // Som de notificação high-tech suave
  const playNotificationSound = (type: 'start' | 'arrive' | 'cancel') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sons diferentes para cada ação
    switch(type) {
      case 'start':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
        break;
      case 'arrive':
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.5);
        break;
      case 'cancel':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.4);
        break;
    }
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Iniciar rastreamento GPS
  const startGPSTracking = (serviceId: string) => {
    if (!navigator.geolocation) {
      alert('GPS não disponível neste dispositivo');
      return;
    }

    playNotificationSound('start');
    setIsTrackingGPS(true);
    
    // Obter localização inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Erro GPS:', error);
        alert('Erro ao acessar GPS. Verifique as permissões.');
        setIsTrackingGPS(false);
      },
      { enableHighAccuracy: true }
    );

    // Rastreamento contínuo
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        
        // Atualizar servidor com localização
        fetch('/api/tracking/update-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          })
        }).catch(console.error);
      },
      (error) => console.error('Erro GPS contínuo:', error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    // Atualizar status para "a caminho"
    onUpdateService(serviceId, 'on_way');

    // Armazenar watchId para parar depois
    (window as any).currentWatchId = watchId;
  };

  // Parar rastreamento GPS
  const stopGPSTracking = () => {
    if ((window as any).currentWatchId) {
      navigator.geolocation.clearWatch((window as any).currentWatchId);
      (window as any).currentWatchId = null;
    }
    setIsTrackingGPS(false);
  };

  // Confirmar chegada
  const handleArrived = (serviceId: string) => {
    playNotificationSound('arrive');
    stopGPSTracking();
    onUpdateService(serviceId, 'arrived');
    
    // Notificar cliente via WebSocket/API
    fetch('/api/tracking/notify-arrival', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId })
    }).catch(console.error);
  };

  // Cancelar serviço
  const handleCancel = (serviceId: string) => {
    if (!cancelReason.trim()) {
      alert('Por favor, informe o motivo do cancelamento');
      return;
    }

    playNotificationSound('cancel');
    stopGPSTracking();
    onUpdateService(serviceId, 'cancelled', cancelReason);
    setShowCancelModal(null);
    setCancelReason('');
  };

  const getStatusColor = (status: Service['status']) => {
    switch(status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'accepted': return 'text-blue-400 bg-blue-500/20';
      case 'on_way': return 'text-orange-400 bg-orange-500/20';
      case 'arrived': return 'text-green-400 bg-green-500/20';
      case 'completed': return 'text-green-600 bg-green-600/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusLabel = (status: Service['status']) => {
    switch(status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceito';
      case 'on_way': return 'A Caminho';
      case 'arrived': return 'Chegou';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Navigation className="w-6 h-6 text-cyan-400" />
          Controle de Serviços
        </h2>
        {isTrackingGPS && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            GPS Ativo
          </div>
        )}
      </div>

      {services.length === 0 ? (
        <Card className="glassmorphism border-gray-500/30">
          <CardContent className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum serviço ativo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className="glassmorphism border-gray-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{service.serviceName}</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                    {getStatusLabel(service.status)}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informações do Cliente */}
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-white font-medium">{service.clientName}</p>
                      <p className="text-gray-300 text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {service.clientAddress}
                      </p>
                      {service.clientPhone && (
                        <p className="text-gray-300 text-sm flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {service.clientPhone}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Duração estimada</p>
                      <p className="text-cyan-400 font-medium">{service.estimatedDuration}min</p>
                    </div>
                  </div>
                </div>

                {/* Localização atual (se estiver rastreando) */}
                {currentLocation && service.status === 'on_way' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-sm font-medium mb-1">📍 Localização Atual</p>
                    <p className="text-gray-300 text-xs">
                      Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Botões de Controle */}
                <div className="flex gap-2">
                  {service.status === 'accepted' && (
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      onClick={() => startGPSTracking(service.id)}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      A Caminho
                    </Button>
                  )}

                  {service.status === 'on_way' && (
                    <>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                        onClick={() => handleArrived(service.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Cheguei
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        onClick={() => setShowCancelModal(service.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  )}

                  {(service.status === 'pending' || service.status === 'accepted') && (
                    <Button 
                      variant="outline" 
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      onClick={() => setShowCancelModal(service.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cancelamento */}
      <Dialog open={!!showCancelModal} onOpenChange={() => setShowCancelModal(null)}>
        <DialogContent className="glassmorphism max-w-md border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Cancelar Serviço
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Por favor, informe o motivo do cancelamento. O cliente será notificado automaticamente.
            </p>
            
            <Textarea
              placeholder="Ex: Trânsito intenso, emergência familiar, problema técnico..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              rows={3}
            />
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelReason('');
                }}
              >
                Voltar
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => showCancelModal && handleCancel(showCancelModal)}
                disabled={!cancelReason.trim()}
              >
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}