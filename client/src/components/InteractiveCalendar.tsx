import React, { useState, useRef } from 'react';
import { Calendar, Upload, FileText, Camera, MapPin, Clock, Plus, Edit3, Trash2, Save, Sync } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ServiceCalendarSync from './ServiceCalendarSync';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'service' | 'meeting' | 'document' | 'personal';
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  location?: string;
  time?: string;
  status: 'planned' | 'completed' | 'cancelled';
}

interface InteractiveCalendarProps {
  userType: 'client' | 'professional';
  userId: number;
}

const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({ userType, userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obter eventos para um dia específico
  const getEventsForDate = (date: string): CalendarEvent[] => {
    return events.filter(event => event.date === date);
  };

  // Gerar calendário do mês atual
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Formatar data para string
  const formatDateString = (day: number): string => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Clique em um dia
  const handleDayClick = (day: number) => {
    const dateString = formatDateString(day);
    setSelectedDate(dateString);
    setShowDayDetail(true);
  };

  // Navegação do calendário
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileUpload = (files: File[]) => {
    if (!selectedDate) return;

    files.forEach(file => {
      const newDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      // Adicionar documento ao evento do dia selecionado
      setEvents(prev => {
        const existingEventIndex = prev.findIndex(event => event.date === selectedDate);
        
        if (existingEventIndex >= 0) {
          // Adicionar ao evento existente
          const updated = [...prev];
          updated[existingEventIndex].documents.push(newDocument);
          return updated;
        } else {
          // Criar novo evento
          const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            date: selectedDate,
            title: 'Documento Adicionado',
            description: `Documento ${file.name} adicionado`,
            type: 'document',
            documents: [newDocument],
            status: 'planned'
          };
          return [...prev, newEvent];
        }
      });
    });
  };

  // Salvar evento editado
  const handleSaveEvent = () => {
    if (!editingEvent) return;

    setEvents(prev => {
      const index = prev.findIndex(e => e.id === editingEvent.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = editingEvent;
        return updated;
      }
      return [...prev, editingEvent];
    });
    
    setEditingEvent(null);
  };

  // Remover evento
  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {/* Sistema de Sincronização Automática */}
      <ServiceCalendarSync 
        userType={userType} 
        userId={userId}
        onEventUpdate={(eventId, status) => {
          console.log(`Evento ${eventId} atualizado para: ${status}`);
          // Aqui podemos atualizar o calendário local se necessário
        }}
      />

      {/* Header do Calendário */}
      <Card className="glassmorphism border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-cyan-400">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Agenda Interativa</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigateMonth('prev')}
                className="border-gray-500/30"
              >
                ←
              </Button>
              <span className="text-gray-200 font-semibold min-w-[150px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigateMonth('next')}
                className="border-gray-500/30"
              >
                →
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Grid do Calendário */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Cabeçalho dos dias */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-gray-400">
                {day}
              </div>
            ))}
            
            {/* Dias do mês */}
            {generateCalendar().map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2 h-12"></div>;
              }

              const dateString = formatDateString(day);
              const dayEvents = getEventsForDate(dateString);
              const isToday = dateString === new Date().toISOString().split('T')[0];
              const isSelected = selectedDate === dateString;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    p-2 h-12 border border-gray-600/30 rounded cursor-pointer transition-all
                    hover:bg-cyan-500/10 hover:border-cyan-500/50
                    ${isToday ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-gray-800/30'}
                    ${isSelected ? 'ring-2 ring-cyan-400' : ''}
                    relative
                  `}
                >
                  <div className="text-sm font-medium text-gray-200">{day}</div>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex space-x-1">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <div
                          key={`${event.id}-${idx}`}
                          className={`w-2 h-2 rounded-full ${
                            event.type === 'service' ? 'bg-green-500' :
                            event.type === 'meeting' ? 'bg-blue-500' :
                            event.type === 'document' ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-400">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">Serviço</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">Reunião</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-400">Documento</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-400">Pessoal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Dia */}
      {showDayDetail && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-gray-600 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-cyan-400">
                <span>Detalhes - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDayDetail(false)}
                  className="border-gray-500/30"
                >
                  Fechar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto space-y-4">
              
              {/* Área de Drop de Arquivos */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-all
                  ${isDragging 
                    ? 'border-cyan-400 bg-cyan-500/10' 
                    : 'border-gray-600 bg-gray-800/30'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">
                  Arraste documentos aqui ou clique para selecionar
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-cyan-500/30 text-cyan-400"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Arquivos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handleFileUpload(files);
                  }}
                />
              </div>

              {/* Eventos do Dia */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-200">Eventos do Dia</h3>
                
                {getEventsForDate(selectedDate).map((event, eventIndex) => (
                  <div key={`event-${event.id}-${eventIndex}`} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                    {editingEvent?.id === event.id ? (
                      // Modo de edição
                      <div className="space-y-3">
                        <Input
                          value={editingEvent.title}
                          onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                          placeholder="Título do evento"
                          className="bg-gray-700 border-gray-600"
                        />
                        <Textarea
                          value={editingEvent.description}
                          onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                          placeholder="Descrição"
                          className="bg-gray-700 border-gray-600"
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={editingEvent.time || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                            placeholder="Horário (ex: 14:00)"
                            className="bg-gray-700 border-gray-600"
                          />
                          <Input
                            value={editingEvent.location || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                            placeholder="Local"
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSaveEvent} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4 mr-1" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingEvent(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo de visualização
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="secondary"
                              className={`
                                ${event.type === 'service' ? 'bg-green-500/20 text-green-400' :
                                  event.type === 'meeting' ? 'bg-blue-500/20 text-blue-400' :
                                  event.type === 'document' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-purple-500/20 text-purple-400'}
                              `}
                            >
                              {event.type === 'service' ? 'Serviço' :
                               event.type === 'meeting' ? 'Reunião' :
                               event.type === 'document' ? 'Documento' : 'Pessoal'}
                            </Badge>
                            <h4 className="font-semibold text-gray-200">{event.title}</h4>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingEvent(event)}
                              className="border-gray-500/30"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="border-red-500/30 text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 mb-2">{event.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          {event.time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Documentos anexados */}
                        {event.documents.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-gray-300">Documentos Anexados</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {event.documents.map(doc => (
                                <div key={doc.id} className="flex items-center space-x-2 p-2 bg-gray-700/50 rounded">
                                  <FileText className="w-4 h-4 text-cyan-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-200 truncate">{doc.name}</p>
                                    <p className="text-xs text-gray-400">
                                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum evento agendado para este dia</p>
                    <Button
                      size="sm"
                      className="mt-2 bg-cyan-600 hover:bg-cyan-700"
                      onClick={() => {
                        const newEvent: CalendarEvent = {
                          id: Date.now().toString(),
                          date: selectedDate,
                          title: 'Novo Evento',
                          description: 'Descrição do evento',
                          type: 'personal',
                          documents: [],
                          status: 'planned'
                        };
                        setEditingEvent(newEvent);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Criar Evento
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InteractiveCalendar;