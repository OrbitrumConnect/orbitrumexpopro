import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Users, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OptimizedGPSMapProps {
  userType: 'professional' | 'client';
  isTracking?: boolean;
  hasActiveService?: boolean;
  serviceId?: string;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number;
}

const OptimizedGPSMap: React.FC<OptimizedGPSMapProps> = ({
  userType,
  isTracking = false,
  hasActiveService = false,
  serviceId,
  onLocationUpdate
}) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<Location[]>([]);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Detectar se é mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // Função otimizada para obter localização no mobile
  const getCurrentLocationOptimized = async (): Promise<Location | null> => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada neste dispositivo');
      return null;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: isMobile, // Apenas mobile usa alta precisão
        timeout: isMobile ? 15000 : 5000, // Mobile tem mais tempo
        maximumAge: 30000 // Cache por 30s
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy
          };
          
          setCurrentLocation(location);
          setIsLoadingLocation(false);
          onLocationUpdate?.(location);
          resolve(location);
        },
        (error) => {
          setIsLoadingLocation(false);
          let errorMessage = 'Erro ao obter localização';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout ao obter localização';
              break;
          }
          
          setLocationError(errorMessage);
          resolve(null);
        },
        options
      );
    });
  };

  // Desenhar mapa simples e funcional
  const drawSimpleMap = () => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo gradiente espacial
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid minimalista
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 4]);
    
    // Linhas verticais
    for (let i = 50; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    
    // Linhas horizontais
    for (let i = 40; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);

    // Borda externa
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Localização atual no centro
    if (currentLocation) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Aura de precisão
      ctx.beginPath();
      ctx.fillStyle = userType === 'professional' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(34, 197, 94, 0.1)';
      ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
      ctx.fill();

      // Círculo interno
      ctx.beginPath();
      ctx.fillStyle = userType === 'professional' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(34, 197, 94, 0.3)';
      ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
      ctx.fill();

      // Ponto do usuário
      ctx.beginPath();
      ctx.fillStyle = userType === 'professional' ? '#06b6d4' : '#22c55e';
      ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Borda brilhante
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
      ctx.stroke();

      // Pulso animado
      const pulseRadius = 15 + Math.sin(Date.now() / 500) * 5;
      ctx.beginPath();
      ctx.strokeStyle = userType === 'professional' ? '#06b6d4' : '#22c55e';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Texto indicativo quando sem localização
    if (!currentLocation && !isLoadingLocation) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Clique em "Atualizar" para obter localização', canvas.width / 2, canvas.height / 2 - 5);
      ctx.fillText('GPS funcionando em tempo real', canvas.width / 2, canvas.height / 2 + 10);
    }

    // Sempre mostrar indicador do tipo de usuário
    ctx.fillStyle = userType === 'professional' ? '#06b6d4' : '#22c55e';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(userType === 'professional' ? 'PROFISSIONAL' : 'CLIENTE', 8, 15);
  };

  // Inicializar rastreamento quando necessário
  useEffect(() => {
    if (isTracking && hasActiveService) {
      getCurrentLocationOptimized();
      
      // Watch position para updates contínuos
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const location: Location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: Date.now(),
              accuracy: position.coords.accuracy
            };
            
            setCurrentLocation(location);
            onLocationUpdate?.(location);
          },
          (error) => console.log('Watch position error:', error),
          {
            enableHighAccuracy: isMobile,
            maximumAge: 30000,
            timeout: 10000
          }
        );
        
        setWatchId(id);
      }
    }
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, hasActiveService]);

  // Redraw canvas automaticamente
  useEffect(() => {
    const animate = () => {
      drawSimpleMap();
      requestAnimationFrame(animate);
    };
    
    // Iniciar animação sempre
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [currentLocation, connectedUsers, isLoadingLocation, userType]);

  // Simular usuários conectados para demonstração
  useEffect(() => {
    if (currentLocation && hasActiveService) {
      const mockUsers: Location[] = [
        {
          lat: currentLocation.lat + 0.001,
          lng: currentLocation.lng + 0.001,
          timestamp: Date.now() - 30000,
          accuracy: 10
        },
        {
          lat: currentLocation.lat - 0.001,
          lng: currentLocation.lng + 0.002,
          timestamp: Date.now() - 60000,
          accuracy: 15
        }
      ];
      setConnectedUsers(mockUsers);
    }
  }, [currentLocation, hasActiveService]);

  return (
    <Card className="glassmorphism border-gray-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h3 className="text-gray-200 font-semibold">GPS Minimap</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {isTracking && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Zap className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            )}
            
            {hasActiveService && (
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Users className="w-3 h-3 mr-1" />
                Serviço
              </Badge>
            )}
          </div>
        </div>

        {/* Canvas Map - Ultra Otimizado para Mobile */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4 border border-gray-600/30">
          <canvas
            ref={mapCanvasRef}
            width={320}
            height={180}
            className="w-full h-auto max-w-full block"
            style={{ maxHeight: '180px', backgroundColor: '#0f172a' }}
          />
          
          {isLoadingLocation && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <div className="text-center">
                <Navigation className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-300">Obtendo localização...</p>
              </div>
            </div>
          )}
          
          {locationError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <div className="text-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-xs text-gray-300">{locationError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={getCurrentLocationOptimized}
            disabled={isLoadingLocation}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Navigation className="w-4 h-4 mr-1" />
            {isLoadingLocation ? 'Localizando...' : 'Atualizar'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            disabled={!currentLocation}
            className="border-gray-500/30 text-gray-400"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Expandir
          </Button>
        </div>

        {/* Informações da localização */}
        {currentLocation && (
          <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Lat:</span>
                <span className="text-gray-200 ml-1">{currentLocation.lat.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-400">Lng:</span>
                <span className="text-gray-200 ml-1">{currentLocation.lng.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-400">Precisão:</span>
                <span className="text-gray-200 ml-1">{currentLocation.accuracy.toFixed(0)}m</span>
              </div>
              <div>
                <span className="text-gray-400">Atualizado:</span>
                <span className="text-gray-200 ml-1">
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OptimizedGPSMap;