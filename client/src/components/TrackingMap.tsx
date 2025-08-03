import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Car, Navigation, X } from 'lucide-react';

interface TrackingMapProps {
  serviceId: string;
  professionalName: string;
  professionalLat: number;
  professionalLng: number;
  clientLat: number;
  clientLng: number;
  onClose: () => void;
}

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

export default function TrackingMap({ 
  serviceId, 
  professionalName, 
  professionalLat, 
  professionalLng, 
  clientLat, 
  clientLng, 
  onClose 
}: TrackingMapProps) {
  const [currentPosition, setCurrentPosition] = useState<Position>({
    lat: professionalLat,
    lng: professionalLng,
    timestamp: Date.now()
  });
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);
  const [isMoving, setIsMoving] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Calcular distância usando Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Simular movimento do profissional
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMoving) return;

      const distance = calculateDistance(
        currentPosition.lat, 
        currentPosition.lng, 
        clientLat, 
        clientLng
      );

      if (distance < 0.1) { // Chegou (100m)
        setIsMoving(false);
        setDistanceRemaining(0);
        setEstimatedArrival(0);
        return;
      }

      // Velocidade média: 30 km/h no trânsito urbano
      const speedKmh = 30;
      const speedMs = speedKmh / 3600; // km/s
      const timeStep = 2; // segundos

      // Calcular nova posição
      const bearing = Math.atan2(
        clientLng - currentPosition.lng,
        clientLat - currentPosition.lat
      );
      
      const distanceStep = speedMs * timeStep;
      const newLat = currentPosition.lat + (distanceStep * Math.cos(bearing)) / 111; // 111 km por grau
      const newLng = currentPosition.lng + (distanceStep * Math.sin(bearing)) / (111 * Math.cos(currentPosition.lat * Math.PI / 180));

      setCurrentPosition({
        lat: newLat,
        lng: newLng,
        timestamp: Date.now()
      });

      const newDistance = calculateDistance(newLat, newLng, clientLat, clientLng);
      setDistanceRemaining(newDistance);
      setEstimatedArrival(Math.ceil((newDistance / speedKmh) * 60)); // minutos
    }, 2000);

    return () => clearInterval(interval);
  }, [currentPosition, clientLat, clientLng, isMoving]);

  // Inicializar WebSocket para atualizações em tempo real
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || "localhost:3000";
    const wsUrl = `${protocol}//${host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('🔗 WebSocket conectado para rastreamento');
      wsRef.current?.send(JSON.stringify({
        type: 'tracking_start',
        serviceId,
        professionalId: professionalName
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'position_update') {
        setCurrentPosition(data.position);
        setDistanceRemaining(data.distance);
        setEstimatedArrival(data.estimatedArrival);
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [serviceId, professionalName]);

  // Inicializar cálculos
  useEffect(() => {
    const initialDistance = calculateDistance(
      professionalLat, 
      professionalLng, 
      clientLat, 
      clientLng
    );
    setDistanceRemaining(initialDistance);
    setEstimatedArrival(Math.ceil((initialDistance / 30) * 60)); // 30 km/h
  }, [professionalLat, professionalLng, clientLat, clientLng]);

  const startTracking = () => {
    setIsMoving(true);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">
              Rastreamento em Tempo Real
            </h2>
            <p className="text-slate-300">
              {professionalName} está a caminho
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="text-cyan-400" size={20} />
              <span className="text-slate-300 font-medium">Distância</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {distanceRemaining.toFixed(1)} km
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="text-cyan-400" size={20} />
              <span className="text-slate-300 font-medium">Tempo Estimado</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatTime(estimatedArrival)}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Car className="text-cyan-400" size={20} />
              <span className="text-slate-300 font-medium">Status</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {isMoving ? 'Em movimento' : 'Parado'}
            </p>
          </div>
        </div>

        {/* Mapa Simulado */}
        <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-500/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cyan-400">
              Localização Atual
            </h3>
            <div className="flex items-center space-x-2">
              <Navigation className="text-cyan-400" size={16} />
              <span className="text-slate-300 text-sm">
                {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
              </span>
            </div>
          </div>
          
          <div 
            ref={mapRef}
            className="w-full h-64 bg-slate-700 rounded-lg relative overflow-hidden"
          >
            {/* Mapa simulado com CSS */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800">
              {/* Ruas simuladas */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-0 w-full h-px bg-slate-500"></div>
                <div className="absolute top-1/2 left-0 w-full h-px bg-slate-500"></div>
                <div className="absolute top-3/4 left-0 w-full h-px bg-slate-500"></div>
                <div className="absolute top-0 left-1/4 w-px h-full bg-slate-500"></div>
                <div className="absolute top-0 left-1/2 w-px h-full bg-slate-500"></div>
                <div className="absolute top-0 left-3/4 w-px h-full bg-slate-500"></div>
              </div>
              
              {/* Marcador do Cliente */}
              <div 
                className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: '75%',
                  top: '75%'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-blue-600 px-2 py-1 rounded whitespace-nowrap">
                  Você
                </div>
              </div>
              
              {/* Marcador do Profissional */}
              <div 
                className="absolute w-6 h-6 bg-cyan-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-2000"
                style={{
                  left: `${25 + (isMoving ? 40 : 0)}%`,
                  top: `${25 + (isMoving ? 40 : 0)}%`
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-cyan-600 px-2 py-1 rounded whitespace-nowrap">
                  {professionalName}
                </div>
                {isMoving && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-75"></div>
                )}
              </div>
              
              {/* Linha de rota */}
              <svg className="absolute inset-0 w-full h-full">
                <line 
                  x1="25%" 
                  y1="25%" 
                  x2="75%" 
                  y2="75%" 
                  stroke="#06b6d4" 
                  strokeWidth="2" 
                  strokeDasharray="5,5"
                  className="opacity-60"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={startTracking}
            disabled={isMoving}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isMoving ? 'Rastreando...' : 'Iniciar Rastreamento'}
          </button>
          
          <button
            onClick={() => setIsMoving(false)}
            disabled={!isMoving}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Pausar
          </button>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>
            Atualização a cada 2 segundos • Velocidade média: 30 km/h
          </p>
          <p className="mt-1">
            Última atualização: {new Date(currentPosition.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}