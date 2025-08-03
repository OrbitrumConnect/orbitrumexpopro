import React, { useState } from 'react';
import { MapPin, Clock, Car, Users, Play, Pause } from 'lucide-react';
import TrackingMap from '../components/TrackingMap';
import { Button } from '@/components/ui/button';

export default function TrackingDemo() {
  const [activeTrackings, setActiveTrackings] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Dados de demonstração
  const demoServices = [
    {
      id: 'service_1',
      professional: {
        id: 1,
        name: 'Carlos Silva',
        title: 'Pintor Profissional',
        avatar: '/api/placeholder/64/64',
        rating: 4.8,
        lat: -23.5505,
        lng: -46.6333
      },
      client: {
        name: 'João Eduardo',
        address: 'Rua das Palmeiras, 123',
        lat: -23.5629,
        lng: -46.6544
      },
      service: 'Pintura Residencial',
      estimatedTime: 25,
      distance: 8.5,
      status: 'em_rota',
      startTime: new Date(Date.now() - 10 * 60 * 1000) // 10 minutos atrás
    },
    {
      id: 'service_2',
      professional: {
        id: 2,
        name: 'Ana Santos',
        title: 'Desenvolvedora Full Stack',
        avatar: '/api/placeholder/64/64',
        rating: 4.9,
        lat: -23.5315,
        lng: -46.6394
      },
      client: {
        name: 'Maria Oliveira',
        address: 'Av. Paulista, 456',
        lat: -23.5618,
        lng: -46.6565
      },
      service: 'Consultoria em Tecnologia',
      estimatedTime: 15,
      distance: 4.2,
      status: 'parado',
      startTime: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos atrás
    },
    {
      id: 'service_3',
      professional: {
        id: 3,
        name: 'Roberto Lima',
        title: 'Personal Trainer',
        avatar: '/api/placeholder/64/64',
        rating: 4.7,
        lat: -23.5489,
        lng: -46.6388
      },
      client: {
        name: 'Pedro Costa',
        address: 'Rua da Consolação, 789',
        lat: -23.5547,
        lng: -46.6524
      },
      service: 'Treino Personalizado',
      estimatedTime: 8,
      distance: 2.1,
      status: 'chegando',
      startTime: new Date(Date.now() - 30 * 60 * 1000) // 30 minutos atrás
    }
  ];

  const toggleTracking = (serviceId: string) => {
    setActiveTrackings(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const openMap = (service: any) => {
    setSelectedService(service);
    setShowMap(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_rota': return 'text-yellow-400';
      case 'parado': return 'text-red-400';
      case 'chegando': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'em_rota': return 'Em Rota';
      case 'parado': return 'Parado';
      case 'chegando': return 'Chegando';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            Sistema de Rastreamento em Tempo Real
          </h1>
          <p className="text-slate-300 text-lg">
            Monitore seus profissionais e tempo de chegada
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20">
            <div className="flex items-center space-x-3">
              <Car className="text-cyan-400 h-8 w-8" />
              <div>
                <p className="text-slate-300 text-sm">Serviços Ativos</p>
                <p className="text-2xl font-bold text-white">
                  {activeTrackings.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20">
            <div className="flex items-center space-x-3">
              <Clock className="text-cyan-400 h-8 w-8" />
              <div>
                <p className="text-slate-300 text-sm">Tempo Médio</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(demoServices.reduce((acc, s) => acc + s.estimatedTime, 0) / demoServices.length)}min
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20">
            <div className="flex items-center space-x-3">
              <Users className="text-cyan-400 h-8 w-8" />
              <div>
                <p className="text-slate-300 text-sm">Profissionais</p>
                <p className="text-2xl font-bold text-white">
                  {demoServices.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {demoServices.map((service) => (
            <div
              key={service.id}
              className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
            >
              {/* Professional Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-lg">
                    {service.professional.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {service.professional.name}
                  </h3>
                  <p className="text-slate-300 text-sm">
                    {service.professional.title}
                  </p>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Serviço:</span>
                  <span className="text-white font-medium">{service.service}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Distância:</span>
                  <span className="text-white">{service.distance} km</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Tempo:</span>
                  <span className="text-white">{service.estimatedTime} min</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Status:</span>
                  <span className={`font-semibold ${getStatusColor(service.status)}`}>
                    {getStatusText(service.status)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => toggleTracking(service.id)}
                  variant={activeTrackings.includes(service.id) ? "destructive" : "default"}
                  className="flex-1"
                >
                  {activeTrackings.includes(service.id) ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Parar
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Rastrear
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => openMap(service)}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Mapa
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Tracking Map Modal */}
        {showMap && selectedService && (
          <TrackingMap
            serviceId={selectedService.id}
            professionalName={selectedService.professional.name}
            professionalLat={selectedService.professional.lat}
            professionalLng={selectedService.professional.lng}
            clientLat={selectedService.client.lat}
            clientLng={selectedService.client.lng}
            onClose={() => setShowMap(false)}
          />
        )}
      </div>
    </div>
  );
}