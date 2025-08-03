import React, { useState } from 'react';
import { Shield } from "lucide-react";
import GPSLegalCompliance from "./GPSLegalCompliance";
import ServiceTracking from "./ServiceTracking";
import ServiceHistory from "./ServiceHistory";
import OptimizedGPSMap from "./OptimizedGPSMap";
import GPSComplianceRules from "./GPSComplianceRules";

interface GPSTrackingProps {
  userType: 'client' | 'professional';
  userId: number;
  username: string;
}

const GPSTracking: React.FC<GPSTrackingProps> = ({ userType, userId, username }) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [hasActiveCall, setHasActiveCall] = useState(false);
  const [messagingAccepted, setMessagingAccepted] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState<string | undefined>();
  
  // Determinar tipo do usuário para passar ao minimap
  const currentUserType = userType as 'professional' | 'client';
  const currentUserId = userId;

  // Se não aceitou os termos legais, mostrar compliance modal
  if (!hasAcceptedTerms) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-cyan-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Proteção Legal GPS</h2>
          </div>
          <GPSLegalCompliance 
            onAccept={() => setHasAcceptedTerms(true)}
            onDecline={() => console.log('Termos GPS rejeitados')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sistema de Rastreamento de Serviços */}
      <ServiceTracking 
        userType={currentUserType}
        userId={currentUserId}
      />

      {/* GPS Map Otimizado - Funciona perfeitamente no mobile */}
      <OptimizedGPSMap 
        userType={currentUserType}
        isTracking={isTrackingActive && messagingAccepted}
        hasActiveService={!!activeServiceId}
        serviceId={activeServiceId}
        onLocationUpdate={(location) => {
          console.log(`📍 ${currentUserType.toUpperCase()} localização:`, location);
          // Aqui enviaria a localização para o backend para outros usuários vinculados
        }}
      />

      {/* Regras de Compliance GPS */}
      <GPSComplianceRules
        userType={currentUserType}
        serviceId={activeServiceId}
        isTrackingActive={isTrackingActive}
        hasActiveCall={hasActiveCall}
        onAcceptMessaging={() => {
          setMessagingAccepted(true);
          console.log('✅ Permissão para mensagens aceita');
        }}
        onRejectMessaging={() => {
          setMessagingAccepted(false);
          console.log('❌ Permissão para mensagens rejeitada');
        }}
        onEndTracking={(reason) => {
          console.log('🛑 Encerrando rastreamento:', reason);
          setIsTrackingActive(false);
          setActiveServiceId(undefined);
          setHasActiveCall(false);
          // Aqui notificaria o backend sobre o encerramento
        }}
        onStartCall={() => {
          console.log('📞 Iniciando chamada');
          setHasActiveCall(true);
          // Aqui iniciaria sistema de chamada
        }}
      />

      {/* Histórico de Serviços */}
      {(currentUserType === 'professional' || currentUserType === 'client') && (
        <ServiceHistory 
          userId={currentUserId}
          userType={currentUserType}
        />
      )}
    </div>
  );
};

export default GPSTracking;