import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Maximize2, Minimize2 } from "lucide-react";

// Declaração de tipos para Leaflet
declare global {
  interface Window {
    L: any;
  }
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

interface GPSMinimapProps {
  userType: 'professional' | 'client';
  isTracking: boolean;
  hasActiveService?: boolean;
  serviceId?: string;
  onLocationUpdate?: (location: LocationData) => void;
}

export default function GPSMinimap({ userType, isTracking, hasActiveService = false, serviceId, onLocationUpdate }: GPSMinimapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Carregar bibliotecas Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if (!window.L) {
          console.log('🗺️ Carregando bibliotecas Leaflet...');
          
          // Carregar CSS do Leaflet
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = '/attached_assets/leaflet_1753186547416.css';
          document.head.appendChild(cssLink);

          // Carregar JS do Leaflet
          const script = document.createElement('script');
          script.src = '/attached_assets/leaflet_1753186547417.js';
          script.onload = () => {
            console.log('✅ Leaflet carregado com sucesso!');
            setLeafletLoaded(true);
          };
          script.onerror = () => {
            console.error('❌ Erro ao carregar Leaflet');
            setMapError('Erro ao carregar bibliotecas do mapa');
          };
          document.head.appendChild(script);
        } else {
          setLeafletLoaded(true);
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar Leaflet:', error);
        setMapError('Erro ao inicializar sistema de mapas');
      }
    };

    loadLeaflet();
  }, []);

  // Inicializar mapa quando Leaflet estiver carregado
  useEffect(() => {
    if (leafletLoaded && mapContainerRef.current && !mapInitialized) {
      initializeMap();
    }
  }, [leafletLoaded, mapInitialized]);

  const initializeMap = async () => {
    if (!window.L || !mapContainerRef.current) return;

    try {
      console.log('🗺️ Inicializando minimap GPS...');
      
      // Criar mapa centrado no Brasil - aguarda localização real
      leafletMapRef.current = window.L.map(mapContainerRef.current, {
        center: [-15.7942, -47.8822], // Centro do Brasil
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        dragging: !isExpanded ? false : true
      });

      // Adicionar tiles do OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: false
      }).addTo(leafletMapRef.current);

      setMapInitialized(true);
      
      // Só obter localização quando há serviço ativo E tracking ativo
      if (isTracking && hasActiveService && navigator.geolocation) {
        console.log(`🚀 Iniciando rastreamento GPS para serviço ${serviceId}`);
        getCurrentLocation();
        
        // Atualizar localização a cada 30 segundos durante serviço ativo
        const locationInterval = setInterval(() => {
          if (hasActiveService) {
            getCurrentLocation();
          } else {
            clearInterval(locationInterval);
          }
        }, 30000);
      }

    } catch (error) {
      console.error('❌ Erro ao inicializar minimap:', error);
      setMapError('Erro ao inicializar minimap GPS');
    }
  };

  const getCurrentLocation = async () => {
    // Só usar GPS real quando tracking estiver ativo
    if (!navigator.geolocation) {
      setMapError('GPS não disponível neste dispositivo');
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy
          };
          
          console.log('📍 Localização GPS obtida:', locationData);
          setCurrentLocation(locationData);
          updateUserMarker(locationData);
          
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }
        },
        (error) => {
          console.error('❌ Erro GPS:', error);
          setMapError('Erro ao acessar GPS - Verifique permissões');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    } catch (error) {
      console.error('❌ Erro no sistema GPS:', error);
      setMapError('Sistema GPS indisponível');
    }
  };

  const updateUserMarker = (location: LocationData) => {
    if (!leafletMapRef.current || !window.L) return;

    // Remover marcador anterior
    if (userMarkerRef.current) {
      leafletMapRef.current.removeLayer(userMarkerRef.current);
    }

    // Criar novo marcador
    const icon = window.L.divIcon({
      html: `<div class="w-3 h-3 rounded-full ${userType === 'professional' ? 'bg-cyan-400' : 'bg-green-400'} border-2 border-white shadow-lg animate-pulse"></div>`,
      className: 'custom-minimap-marker',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    userMarkerRef.current = window.L.marker([location.lat, location.lng], { icon })
      .bindPopup(`
        <div class="text-center text-xs">
          <strong>${userType === 'professional' ? 'Profissional' : 'Cliente'}</strong><br/>
          <span class="text-gray-600">${new Date(location.timestamp).toLocaleTimeString()}</span>
        </div>
      `)
      .addTo(leafletMapRef.current);

    // Centralizar mapa na localização
    leafletMapRef.current.setView([location.lat, location.lng], 15);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current.invalidateSize();
        if (!isExpanded) {
          leafletMapRef.current.dragging.enable();
          leafletMapRef.current.scrollWheelZoom.enable();
          leafletMapRef.current.doubleClickZoom.enable();
        } else {
          leafletMapRef.current.dragging.disable();
          leafletMapRef.current.scrollWheelZoom.disable();
          leafletMapRef.current.doubleClickZoom.disable();
        }
      }, 100);
    }
  };

  return (
    <Card className="bg-gray-800/50 border border-cyan-500/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center">
            <Navigation className="w-4 h-4 mr-2 text-cyan-400" />
            GPS Minimap
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-400">{isTracking ? 'Ativo' : 'Parado'}</span>
            <Button
              onClick={toggleExpanded}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {!leafletLoaded ? (
          <div className={`${isExpanded ? 'h-48' : 'h-24'} flex items-center justify-center bg-gray-800 rounded border border-gray-600`}>
            <div className="text-center">
              <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-1" />
              <p className="text-xs text-gray-400">Carregando GPS...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Container do minimap */}
            <div 
              ref={mapContainerRef}
              className={`w-full ${isExpanded ? 'h-48' : 'h-32'} rounded bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 relative overflow-hidden border border-cyan-500/30 transition-all duration-300`}
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            >
              {!mapInitialized && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <MapPin className="w-5 h-5 text-cyan-400 mx-auto mb-1 animate-pulse" />
                    <p className="text-xs text-white">Inicializando...</p>
                  </div>
                </div>
              )}
              
              {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-center p-2">
                  <div>
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-red-400 font-medium text-xs mb-1">Erro no GPS</p>
                    <button
                      onClick={initializeMap}
                      className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs hover:bg-cyan-500/30 transition-colors"
                    >
                      Recarregar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Informações da localização baseadas no estado do serviço */}
            {hasActiveService && currentLocation ? (
              <div className="bg-gray-700/30 rounded p-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Serviço:</span>
                  <span className="text-green-400">{serviceId || 'Ativo'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Coordenadas:</span>
                  <span className="text-white font-mono">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Atualizado:</span>
                  <span className="text-white">{new Date(currentLocation.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Precisão:</span>
                  <span className="text-cyan-400">{currentLocation.accuracy?.toFixed(0)}m</span>
                </div>
              </div>
            ) : hasActiveService && isTracking ? (
              <div className="bg-gray-700/30 rounded p-2 text-center">
                <div className="text-xs text-green-400 mb-1">Serviço Ativo - Aguardando GPS...</div>
                <div className="text-xs text-gray-400">Localização será exibida em dispositivo móvel</div>
              </div>
            ) : (
              <div className="bg-gray-700/30 rounded p-2 text-center">
                <div className="text-xs text-gray-400">Aguardando serviço ser aceito...</div>
                <div className="text-xs text-cyan-400">GPS ativará quando profissional iniciar trajeto</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}