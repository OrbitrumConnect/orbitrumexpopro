import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, Phone, MessageCircle, Maximize2 } from "lucide-react";

interface Professional {
  id: number;
  name: string;
  title: string;
  lat: number;
  lng: number;
  status: 'disponivel' | 'ocupado' | 'em_rota';
  eta?: string;
  distance?: string;
  phone?: string;
}

interface MiniMapProps {
  userId?: number;
  onFullscreen?: () => void;
}

export default function MiniMap({ userId, onFullscreen }: MiniMapProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [userLocation] = useState({ lat: -23.550520, lng: -46.633309 }); // São Paulo como exemplo

  // Simular dados de profissionais próximos
  useEffect(() => {
    const mockProfessionals: Professional[] = [
      {
        id: 1,
        name: "Carlos Silva",
        title: "Eletricista",
        lat: -23.548520,
        lng: -46.635309,
        status: 'disponivel',
        distance: "2.1 km",
        phone: "(11) 99999-1234"
      },
      {
        id: 2,
        name: "Ana Santos",
        title: "Encanadora",
        lat: -23.552520,
        lng: -46.631309,
        status: 'em_rota',
        eta: "15 min",
        distance: "1.8 km",
        phone: "(11) 99999-5678"
      },
      {
        id: 3,
        name: "Roberto Lima",
        title: "Pintor",
        lat: -23.551520,
        lng: -46.634309,
        status: 'ocupado',
        distance: "1.5 km",
        phone: "(11) 99999-9012"
      }
    ];
    
    setProfessionals(mockProfessionals);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-500';
      case 'em_rota': return 'bg-yellow-500';
      case 'ocupado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'em_rota': return 'A Caminho';
      case 'ocupado': return 'Ocupado';
      default: return 'Offline';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glassmorphism border-cyan-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-cyan-400" />
              Mapa GPS - Profissionais Próximos
            </CardTitle>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-gray-400 hover:text-cyan-400"
              onClick={() => window.open('/rastreamento', '_blank')}
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Expandir
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Mini Mapa Simulado */}
          <div className="bg-gray-800/50 rounded-lg p-4 relative h-48 border border-gray-600/30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg"></div>
            
            {/* Sua Localização */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-cyan-500 rounded-full border-2 border-white animate-pulse"></div>
              <span className="absolute -bottom-6 -left-8 text-xs text-cyan-400 font-medium">Você</span>
            </div>
            
            {/* Profissionais no Mapa */}
            {professionals.map((prof, index) => (
              <div
                key={prof.id}
                className={`absolute w-3 h-3 rounded-full border-2 border-white cursor-pointer transform hover:scale-125 transition-transform ${getStatusColor(prof.status)}`}
                style={{
                  top: `${20 + index * 25}%`,
                  left: `${25 + index * 20}%`
                }}
                onClick={() => setSelectedProfessional(prof)}
              >
                <div className="absolute -top-6 -left-8 text-xs text-white font-medium bg-black/50 px-1 rounded">
                  {prof.name.split(' ')[0]}
                </div>
              </div>
            ))}
            
            {/* Legenda */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              <div className="bg-black/50 p-2 rounded space-y-1">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>A Caminho</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Ocupado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Profissionais */}
          <div className="space-y-2">
            <h4 className="text-white font-medium">Profissionais na Região:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedProfessional?.id === prof.id 
                      ? 'bg-cyan-500/20 border-cyan-500/50' 
                      : 'bg-gray-800/30 border-gray-600/30 hover:bg-gray-700/30'
                  }`}
                  onClick={() => setSelectedProfessional(prof)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(prof.status)}`}></div>
                    <div>
                      <div className="text-white font-medium text-sm">{prof.name}</div>
                      <div className="text-gray-400 text-xs">{prof.title}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-300">{prof.distance}</div>
                    <div className="text-xs text-gray-400">{getStatusText(prof.status)}</div>
                    {prof.eta && (
                      <div className="text-xs text-yellow-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {prof.eta}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profissional Selecionado */}
          {selectedProfessional && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 rounded-lg border border-cyan-500/30">
              <h5 className="text-white font-medium mb-2">{selectedProfessional.name}</h5>
              <p className="text-gray-300 text-sm mb-3">{selectedProfessional.title}</p>
              
              <div className="flex justify-center">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </Button>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-400">Distância: {selectedProfessional.distance}</span>
                <span className={`px-2 py-1 rounded-full ${getStatusColor(selectedProfessional.status)} text-white`}>
                  {getStatusText(selectedProfessional.status)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}