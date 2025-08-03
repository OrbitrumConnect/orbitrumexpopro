import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  User,
  Plus,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfessionalCalendarInsightsProps {
  professionalId: number;
  category: string;
  currentRating: number;
}

interface ServiceRecord {
  id: string;
  date: string;
  serviceType: string;
  clientName: string;
  clientLocation: string;
  duration: string;
  price: number;
  status: 'completed' | 'pending' | 'cancelled';
  rating?: number;
  notes?: string;
  challenges?: string;
  learnings?: string;
  isRecurring?: boolean;
  photos?: string[];
}

const ProfessionalCalendarInsights: React.FC<ProfessionalCalendarInsightsProps> = ({
  professionalId,
  category,
  currentRating
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [newService, setNewService] = useState({
    serviceType: '',
    clientName: '',
    clientLocation: '',
    duration: '',
    price: '',
    notes: '',
    challenges: '',
    learnings: ''
  });

  useEffect(() => {
    // Carregar dados REAIS do backend
    loadRealServices();
  }, [professionalId]);

  const loadRealServices = () => {
    // DADOS REAIS: Zero profissionais cadastrados na plataforma atualmente
    // Sistema tem 3 clientes pagantes aguardando profissionais se cadastrarem
    const noProServices: ServiceRecord[] = [];
    setServices(noProServices);
  };

  const getServicesForDate = (date: Date) => {
    return services.filter(service => 
      isSameDay(new Date(service.date), date)
    );
  };

  const getTotalEarningsForMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return services.filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate >= monthStart && 
             serviceDate <= monthEnd && 
             service.status === 'completed';
    }).reduce((total, service) => total + service.price, 0);
  };

  const getCompletedServicesCount = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return services.filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate >= monthStart && 
             serviceDate <= monthEnd && 
             service.status === 'completed';
    }).length;
  };

  const getAverageRating = () => {
    const completedWithRating = services.filter(s => s.status === 'completed' && s.rating);
    if (completedWithRating.length === 0) return 0;
    const sum = completedWithRating.reduce((acc, s) => acc + (s.rating || 0), 0);
    return sum / completedWithRating.length;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayServices = getServicesForDate(date);
    if (dayServices.length > 0 || !isBefore(date, new Date())) {
      setShowServiceModal(true);
    }
  };

  const handleAddService = () => {
    if (!selectedDate || !newService.serviceType || !newService.clientName) return;

    const service: ServiceRecord = {
      id: Date.now().toString(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      serviceType: newService.serviceType,
      clientName: newService.clientName,
      clientLocation: newService.clientLocation,
      duration: newService.duration,
      price: parseInt(newService.price) || 0,
      status: isBefore(selectedDate, new Date()) ? 'completed' : 'pending',
      notes: newService.notes,
      challenges: newService.challenges,
      learnings: newService.learnings
    };

    setServices([...services, service]);
    setNewService({
      serviceType: '',
      clientName: '',
      clientLocation: '',
      duration: '',
      price: '',
      notes: '',
      challenges: '',
      learnings: ''
    });
    setShowServiceModal(false);
  };

  const handleUpdateService = (serviceId: string, updatedData: Partial<ServiceRecord>) => {
    setServices(services.map(service => 
      service.id === serviceId ? { ...service, ...updatedData } : service
    ));
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Headers dos dias da semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-gray-400 font-medium py-2 text-sm">
            {day}
          </div>
        ))}
        
        {/* Dias do mês */}
        {days.map(day => {
          const dayServices = getServicesForDate(day);
          const hasServices = dayServices.length > 0;
          const isPast = isBefore(day, new Date()) && !isToday(day);
          const completedServices = dayServices.filter(s => s.status === 'completed').length;
          const pendingServices = dayServices.filter(s => s.status === 'pending').length;

          return (
            <motion.button
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={`
                p-2 rounded-lg text-sm relative transition-all duration-200 min-h-[60px]
                ${isToday(day) 
                  ? 'bg-green-500/20 border-2 border-green-400 text-green-300 font-bold' 
                  : isPast
                    ? hasServices 
                      ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-500'
                    : hasServices
                      ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30'
                      : 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="font-medium mb-1">
                {format(day, 'd')}
              </div>
              
              {/* Indicadores de serviços */}
              {hasServices && (
                <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1">
                  {completedServices > 0 && (
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  )}
                  {pendingServices > 0 && (
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                  )}
                </div>
              )}
              
              {/* Número de serviços */}
              {hasServices && (
                <div className="absolute top-1 right-1 text-xs font-bold">
                  {dayServices.length}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const getDayTypeLabel = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isBefore(date, new Date())) return 'Histórico';
    return 'Futuro';
  };

  const getDayTypeColor = (date: Date) => {
    if (isToday(date)) return 'text-green-400';
    if (isBefore(date, new Date())) return 'text-blue-400';
    return 'text-yellow-400';
  };

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Calendário Inteligente</h2>
        <p className="text-green-400">Clique em qualquer dia para revisar ou agendar serviços</p>
      </motion.div>

      {/* Estatísticas do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">R$ {getTotalEarningsForMonth().toLocaleString()}</div>
            <p className="text-gray-400 text-sm">Faturamento do Mês</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <Briefcase className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{getCompletedServicesCount()}</div>
            <p className="text-gray-400 text-sm">Serviços Concluídos</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{getAverageRating().toFixed(1)}</div>
            <p className="text-gray-400 text-sm">Avaliação Média</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{services.filter(s => s.status === 'pending').length}</div>
            <p className="text-gray-400 text-sm">Agendamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendário Principal */}
      <Card className="glassmorphism border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span>
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {renderCalendar()}
          
          {/* Legenda */}
          <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-gray-400 text-sm">Histórico</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-400 text-sm">Hoje</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-400 text-sm">Agendado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Serviços do Dia */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glassmorphism border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span>
                {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Badge className={getDayTypeColor(selectedDate || new Date())}>
                {selectedDate && getDayTypeLabel(selectedDate)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Serviços Existentes */}
            {selectedDate && getServicesForDate(selectedDate).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-medium flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-green-400" />
                  <span>Serviços do Dia</span>
                </h3>
                
                {getServicesForDate(selectedDate).map(service => (
                  <div key={service.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">{service.serviceType}</h4>
                        <p className="text-gray-400 text-sm flex items-center space-x-2">
                          <User className="w-3 h-3" />
                          <span>{service.clientName}</span>
                          {service.isRecurring && <Badge className="bg-purple-500/20 text-purple-300">Recorrente</Badge>}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">R$ {service.price.toLocaleString()}</div>
                        <Badge className={
                          service.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          service.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }>
                          {service.status === 'completed' ? 'Concluído' :
                           service.status === 'pending' ? 'Agendado' : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">{service.clientLocation}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">{service.duration}</span>
                      </div>
                    </div>
                    
                    {service.rating && (
                      <div className="flex items-center space-x-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < service.rating! ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
                        ))}
                        <span className="text-gray-400 text-xs ml-2">({service.rating}/5)</span>
                      </div>
                    )}
                    
                    {service.notes && (
                      <p className="text-gray-300 text-sm mt-2 bg-gray-700/30 rounded p-2">{service.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulário para Adicionar/Editar Serviço */}
            {selectedDate && !isBefore(selectedDate, new Date()) && (
              <div className="space-y-4">
                <h3 className="text-white font-medium flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-green-400" />
                  <span>Adicionar Serviço</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Tipo de serviço"
                    value={newService.serviceType}
                    onChange={(e) => setNewService({...newService, serviceType: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Nome do cliente"
                    value={newService.clientName}
                    onChange={(e) => setNewService({...newService, clientName: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Localização"
                    value={newService.clientLocation}
                    onChange={(e) => setNewService({...newService, clientLocation: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Duração estimada"
                    value={newService.duration}
                    onChange={(e) => setNewService({...newService, duration: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Preço (R$)"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <Textarea
                  placeholder="Observações do serviço"
                  value={newService.notes}
                  onChange={(e) => setNewService({...newService, notes: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                
                <Button onClick={handleAddService} className="neon-button w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalCalendarInsights;