import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Star,
  Eye,
  FileText
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ServiceHistoryProps {
  userId: number;
  userType: 'professional' | 'client';
}

interface HistoryService {
  id: number;
  date: string;
  time: string;
  serviceType: string;
  professionalName?: string;
  clientName?: string;
  duration: number;
  cost: number;
  rating?: number;
  feedback?: string;
  completionCode: string;
  location: string;
  status: 'completed' | 'cancelled';
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ userId, userType }) => {
  // Query para buscar histórico de serviços
  const { data: history, isLoading } = useQuery({
    queryKey: [`/api/services/history/${userType}/${userId}`],
  });

  // Renderização dos detalhes do serviço
  const ServiceDetailsModal = ({ service }: { service: HistoryService }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20">
          <Eye className="w-4 h-4 mr-1" />
          Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-cyan-400" />
            Detalhes do Serviço
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Informações do Serviço</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Tipo de Serviço</p>
                <p className="text-white font-medium">{service.serviceType}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Código de Conclusão</p>
                <p className="text-cyan-400 font-mono">{service.completionCode}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Data</p>
                <p className="text-white">{new Date(service.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Horário</p>
                <p className="text-white">{service.time}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Duração</p>
                <p className="text-white">{service.duration} minutos</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Valor</p>
                <p className="text-green-400 font-medium">R$ {service.cost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Pessoas Envolvidas */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Participantes</h3>
            <div className="space-y-2">
              {userType === 'client' && service.professionalName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">Profissional:</span>
                  <span className="text-white">{service.professionalName}</span>
                </div>
              )}
              {userType === 'professional' && service.clientName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">Cliente:</span>
                  <span className="text-white">{service.clientName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-400">Local:</span>
                <span className="text-white">{service.location}</span>
              </div>
            </div>
          </div>

          {/* Avaliação */}
          {service.rating && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-400" />
                Avaliação
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${star <= (service.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="text-white">{service.rating}/5</span>
                </div>
                {service.feedback && (
                  <div className="bg-gray-700/50 rounded p-3">
                    <p className="text-gray-300 text-sm italic">"{service.feedback}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex justify-center">
            <Badge 
              variant={service.status === 'completed' ? 'default' : 'destructive'}
              className="px-4 py-2"
            >
              {service.status === 'completed' ? 'Serviço Concluído' : 'Serviço Cancelado'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
            Histórico de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {history?.map((service: HistoryService) => (
            <div key={service.id} className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-medium mb-1">{service.serviceType}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(service.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {userType === 'client' ? service.professionalName : service.clientName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">R$ {service.cost.toFixed(2)}</p>
                  {service.rating && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">{service.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {service.completionCode}
                  </Badge>
                  <Badge 
                    variant={service.status === 'completed' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {service.status === 'completed' ? 'Concluído' : 'Cancelado'}
                  </Badge>
                </div>
                <ServiceDetailsModal service={service} />
              </div>
            </div>
          ))}

          {(!history || history.length === 0) && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Nenhum serviço ainda</h3>
              <p className="text-gray-400 text-sm">
                Seu histórico de serviços aparecerá aqui após a conclusão
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceHistory;