import React, { useState } from 'react';
import { MapPin, Clock, Truck } from 'lucide-react';
import TrackingMap from './TrackingMap';

interface ServiceTrackingButtonProps {
  professionalId: number;
  professionalName: string;
  serviceId: string;
  isActive?: boolean;
}

export default function ServiceTrackingButton({ 
  professionalId, 
  professionalName, 
  serviceId, 
  isActive = false 
}: ServiceTrackingButtonProps) {
  const [showTracking, setShowTracking] = useState(false);

  // Coordenadas fixas para demonstração
  // Em produção, viriam do banco de dados
  const professionalCoords = {
    lat: -23.5505, // São Paulo Centro
    lng: -46.6333
  };

  const clientCoords = {
    lat: -23.5629, // São Paulo Jardins
    lng: -46.6544
  };

  const handleTrackingClick = () => {
    setShowTracking(true);
  };

  return (
    <>
      <button
        onClick={handleTrackingClick}
        disabled={!isActive}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isActive 
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg' 
            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        <MapPin size={18} />
        <span>Rastrear em Tempo Real</span>
        {isActive && (
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </button>

      {showTracking && (
        <TrackingMap
          serviceId={serviceId}
          professionalName={professionalName}
          professionalLat={professionalCoords.lat}
          professionalLng={professionalCoords.lng}
          clientLat={clientCoords.lat}
          clientLng={clientCoords.lng}
          onClose={() => setShowTracking(false)}
        />
      )}
    </>
  );
}