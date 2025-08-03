import React, { useState } from 'react';
import { Phone, MessageSquare, AlertTriangle, Shield, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CompactModeTrigger } from './CompactModeTrigger';

interface GPSComplianceRulesProps {
  userType: 'professional' | 'client';
  serviceId?: string;
  isTrackingActive: boolean;
  hasActiveCall?: boolean;
  onAcceptMessaging: () => void;
  onRejectMessaging: () => void;
  onEndTracking: (reason: string) => void;
  onStartCall: () => void;
}

const GPSComplianceRules: React.FC<GPSComplianceRulesProps> = ({
  userType,
  serviceId,
  isTrackingActive,
  hasActiveCall = false,
  onAcceptMessaging,
  onRejectMessaging,
  onEndTracking,
  onStartCall
}) => {
  const [messagingConsent, setMessagingConsent] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [trackingEndReason, setTrackingEndReason] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const handleAcceptMessaging = () => {
    setMessagingConsent('accepted');
    onAcceptMessaging();
  };

  const handleRejectMessaging = () => {
    setMessagingConsent('rejected');
    onRejectMessaging();
  };

  const handleEndTracking = () => {
    if (hasActiveCall && !trackingEndReason.trim()) {
      alert('Durante chamadas ativas, é obrigatório informar o motivo do encerramento');
      return;
    }
    
    onEndTracking(trackingEndReason);
    setShowEndModal(false);
    setTrackingEndReason('');
  };

  const complianceRules = [
    {
      id: 'messaging',
      title: 'Permissão para Mensagens',
      description: 'Aceitar receber mensagens durante o rastreamento é obrigatório para coordenação do serviço',
      status: messagingConsent,
      required: true
    },
    {
      id: 'call_availability',
      title: 'Disponibilidade para Chamadas',
      description: 'Profissional deve estar disponível para chamadas durante execução do serviço',
      status: 'accepted',
      required: true
    },
    {
      id: 'tracking_termination',
      title: 'Regras de Encerramento',
      description: 'Rastreamento só pode ser encerrado com justificativa, especialmente durante chamadas',
      status: 'accepted',
      required: true
    }
  ];

  return (
    <div className="relative">      
      <Card className={`glassmorphism border-yellow-500/30 transition-all duration-300 ${isCompact ? 'h-14 overflow-hidden' : ''}`}>
        {/* Trigger para compactar APENAS as Regras GPS - Posicionado melhor */}
        <CompactModeTrigger onToggle={setIsCompact} />
        <CardHeader className={isCompact ? 'pb-2' : ''}>
          <CardTitle className="flex items-center space-x-2 text-yellow-400">
            <Shield className="w-5 h-5" />
            <span>Regras de Compliance GPS</span>
            {isCompact && (
              <span className="text-xs text-gray-400 ml-2">(compactado)</span>
            )}
          </CardTitle>
        </CardHeader>
      {!isCompact && (
        <CardContent className="space-y-4">
        
        {/* Status do Rastreamento */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-gray-200">Rastreamento GPS</span>
          </div>
          <Badge variant={isTrackingActive ? 'default' : 'secondary'} className={isTrackingActive ? 'bg-green-500/20 text-green-400' : ''}>
            {isTrackingActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        <Separator className="bg-gray-600/30" />

        {/* Regras de Compliance */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300">Requisitos Obrigatórios</h4>
          
          {complianceRules.map((rule) => (
            <div key={rule.id} className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg">
              <div className="mt-0.5">
                {rule.status === 'accepted' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                {rule.status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                {rule.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-200">{rule.title}</h5>
                <p className="text-xs text-gray-400 mt-1">{rule.description}</p>
                {rule.required && (
                  <Badge variant="outline" className="mt-2 border-yellow-500/30 text-yellow-400">
                    Obrigatório
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-gray-600/30" />

        {/* Controles de Permissões */}
        {messagingConsent === 'pending' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Permissão para Mensagens</span>
            </h4>
            <p className="text-xs text-gray-400">
              Durante o rastreamento, você receberá mensagens de coordenação do serviço. É obrigatório aceitar para prosseguir.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={handleAcceptMessaging}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectMessaging}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeitar
              </Button>
            </div>
          </div>
        )}

        {/* Controles de Comunicação */}
        {isTrackingActive && messagingConsent === 'accepted' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300">Comunicação Ativa</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={onStartCall}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={hasActiveCall}
              >
                <Phone className="w-4 h-4 mr-1" />
                {hasActiveCall ? 'Em chamada' : 'Iniciar Chamada'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEndModal(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Encerrar
              </Button>
            </div>

            {hasActiveCall && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-400">
                  <Phone className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Chamada ativa em andamento</span>
                </div>
                <p className="text-xs text-blue-300 mt-1">
                  Para encerrar rastreamento durante chamada, é obrigatório informar o motivo
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal de Encerramento */}
        {showEndModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span>Encerrar Rastreamento</span>
              </h3>
              
              {hasActiveCall && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <p className="text-sm text-red-400">
                    ⚠️ Chamada ativa detectada. É obrigatório informar o motivo do encerramento e comunicar ao cliente.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm text-gray-300">
                  Motivo do encerramento {hasActiveCall && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  value={trackingEndReason}
                  onChange={(e) => setTrackingEndReason(e.target.value)}
                  placeholder={hasActiveCall ? "Obrigatório durante chamadas ativas..." : "Descreva o motivo (opcional)"}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm resize-none"
                  rows={3}
                />
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleEndTracking}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                    disabled={hasActiveCall && !trackingEndReason.trim()}
                  >
                    Confirmar Encerramento
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEndModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aviso Legal */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-300">
            <Shield className="w-3 h-3 inline mr-1" />
            <strong>Compliance:</strong> A plataforma não interfere em decisões de encerramento. 
            Profissionais devem resolver questões diretamente com clientes via chamada quando necessário.
          </p>
        </div>

        </CardContent>
      )}
      </Card>
    </div>
  );
};

export default GPSComplianceRules;