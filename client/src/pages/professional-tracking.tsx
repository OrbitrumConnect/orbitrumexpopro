import React, { useState, useEffect } from 'react';
import { ArrowLeft, Navigation } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ProfessionalTrackingPanel from '@/components/ProfessionalTrackingPanel';
import { useAuth } from '@/hooks/useAuth';

// Dados de demonstração para o profissional
const demoServices = [
  {
    id: 'service_1',
    clientName: 'João Eduardo',
    clientAddress: 'Rua das Palmeiras, 123 - Vila Mariana, São Paulo',
    clientPhone: '(11) 99999-1234',
    serviceName: 'Pintura de Quarto',
    estimatedDuration: 180,
    status: 'accepted' as const,
    clientLat: -23.5629,
    clientLng: -46.6544
  },
  {
    id: 'service_2',
    clientName: 'Maria Santos',
    clientAddress: 'Av. Paulista, 1500 - Bela Vista, São Paulo',
    clientPhone: '(11) 98888-5678',
    serviceName: 'Consultoria em Tecnologia',
    estimatedDuration: 120,
    status: 'on_way' as const,
    clientLat: -23.5618,
    clientLng: -46.6565
  }
];

export default function ProfessionalTracking() {
  const { user } = useAuth();
  const [services, setServices] = useState(demoServices);

  const handleUpdateService = (serviceId: string, status: any, reason?: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, status, cancelReason: reason }
        : service
    ));

    // Notificar cliente via API/WebSocket
    fetch('/api/professional/update-service-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId,
        status,
        reason,
        professionalId: user?.id,
        timestamp: Date.now()
      })
    }).catch(console.error);

    console.log(`Serviço ${serviceId} atualizado para: ${status}`, reason ? `Motivo: ${reason}` : '');
  };

  return (
    <div className="min-h-screen bg-gray-900" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div className="border-b border-gray-700/50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard-professional">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-xl font-bold text-white">Controle GPS de Serviços</h1>
            </div>
            <div className="text-sm text-gray-300">
              Profissional: <span className="text-cyan-400 font-medium">{user?.username || "Demo"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Instruções */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Navigation className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white text-lg font-medium mb-2">Como usar o sistema GPS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-green-400 font-medium">1. A Caminho</p>
                  <p className="text-gray-300">Ativa GPS e inicia rastreamento em tempo real</p>
                </div>
                <div>
                  <p className="text-blue-400 font-medium">2. Cheguei</p>
                  <p className="text-gray-300">Para o GPS e notifica o cliente da chegada</p>
                </div>
                <div>
                  <p className="text-red-400 font-medium">3. Cancelar</p>
                  <p className="text-gray-300">Cancela o serviço informando o motivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Controle */}
        <ProfessionalTrackingPanel 
          services={services}
          onUpdateService={handleUpdateService}
        />
      </div>
    </div>
  );
}