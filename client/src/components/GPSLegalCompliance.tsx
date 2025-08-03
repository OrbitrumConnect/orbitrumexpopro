import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Eye,
  Lock,
  Globe
} from "lucide-react";

interface GPSLegalComplianceProps {
  onAccept: () => void;
  onDecline?: () => void;
  showAsModal?: boolean;
}

const GPSLegalCompliance: React.FC<GPSLegalComplianceProps> = ({ 
  onAccept, 
  onDecline,
  showAsModal = true 
}) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAcceptTerms = () => {
    setHasAccepted(true);
    setIsOpen(false);
    onAccept();
  };

  const handleDeclineTerms = () => {
    setIsOpen(false);
    if (onDecline) onDecline();
  };

  const ComplianceContent = () => (
    <div className="space-y-6">
      {/* Cabeçalho de Proteção Legal */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Proteção Legal GPS - Orbitrum</h3>
            <p className="text-cyan-400 text-sm">Conforme LGPD Lei 13.709/18 e Licenças de Software</p>
          </div>
        </div>
        
        <div className="bg-cyan-500/5 rounded-md p-3 border border-cyan-500/20">
          <p className="text-gray-300 text-sm">
            <strong>Sua proteção está garantida:</strong> Utilizamos apenas tecnologias licenciadas 
            e cumprimos integralmente a legislação brasileira de proteção de dados.
          </p>
        </div>
      </div>

      {/* Tecnologias Utilizadas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" />
            Tecnologias e Licenças
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-white font-medium">Leaflet.js</p>
                  <p className="text-gray-400 text-xs">Biblioteca de mapas interativos</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                BSD-2-Clause
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-white font-medium">OpenStreetMap</p>
                  <p className="text-gray-400 text-xs">Dados de mapas colaborativos</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Open Database License
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">Geolocalização HTML5</p>
                  <p className="text-gray-400 text-xs">API nativa do navegador</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                Padrão W3C
              </Badge>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium text-sm">Todas as licenças são compatíveis</span>
            </div>
            <p className="text-gray-300 text-xs">
              ✓ Uso comercial permitido | ✓ Código aberto | ✓ Sem royalties | ✓ Créditos mantidos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Conformidade LGPD */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Conformidade LGPD - Lei 13.709/18
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" />
              Como protegemos seus dados de localização
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Consentimento Explícito</p>
                  <p className="text-gray-400">Sempre solicitamos permissão antes de acessar sua localização</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Finalidade Específica</p>
                  <p className="text-gray-400">Localização usada apenas para conectar com profissionais próximos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Não Compartilhamento</p>
                  <p className="text-gray-400">Dados nunca vendidos ou compartilhados com terceiros</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Controle Total</p>
                  <p className="text-gray-400">Você pode desativar o rastreamento a qualquer momento</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium text-sm">Transparência</span>
              </div>
              <p className="text-gray-300 text-xs">
                Política de Privacidade detalhada disponível em /privacidade
              </p>
            </div>
            
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-medium text-sm">Segurança</span>
              </div>
              <p className="text-gray-300 text-xs">
                Dados criptografados e armazenados com segurança
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seus Direitos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            Seus Direitos (Art. 18 da LGPD)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">Confirmação da existência de tratamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">Acesso aos dados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">Correção de dados incompletos</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">Eliminação dos dados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">Revogação do consentimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">Informações sobre compartilhamento</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-4 bg-gray-700" />
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-400 font-medium text-sm mb-1">
              Para exercer seus direitos:
            </p>
            <p className="text-gray-300 text-xs">
              Entre em contato através do canal de atendimento no Telegram ou email oficial da plataforma
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aviso Importante */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-orange-400 font-medium mb-2">Importante</h4>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                • O rastreamento GPS é <strong>opcional</strong> e pode ser desativado a qualquer momento
              </p>
              <p>
                • Dados de localização são usados <strong>apenas</strong> para melhorar sua experiência na plataforma
              </p>
              <p>
                • A plataforma <strong>não se responsabiliza</strong> por uso inadequado das informações por terceiros
              </p>
              <p>
                • Profissionais devem respeitar a privacidade e segurança dos clientes durante atendimentos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Aceite/Recusa */}
      {!hasAccepted && (
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
          <Button 
            onClick={handleAcceptTerms}
            className="neon-button px-8 py-3 w-full sm:w-auto"
          >
            <Shield className="w-4 h-4 mr-2" />
            Aceito e Concordo
          </Button>
          <Button 
            onClick={handleDeclineTerms}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20 px-8 py-3 w-full sm:w-auto"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Não Aceito
          </Button>
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20">
            <Shield className="w-4 h-4 mr-2" />
            Proteção Legal GPS
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Proteção Legal - Sistema GPS Orbitrum
            </DialogTitle>
          </DialogHeader>
          <ComplianceContent />
        </DialogContent>
      </Dialog>
    );
  }

  return <ComplianceContent />;
};

export default GPSLegalCompliance;