import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle } from "lucide-react";

interface DocumentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DocumentVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Documentos Pendentes",
  description = "Para comprar planos, você precisa verificar seus documentos primeiro."
}: DocumentVerificationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glassmorphism border-red-500/30 bg-gray-900/95">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-red-400 font-medium text-sm">
                  Verificação de Documentos Necessária
                </p>
                <p className="text-gray-300 text-sm">
                  Para garantir a segurança da plataforma e cumprir com as normas brasileiras,
                  precisamos verificar seus documentos antes de permitir compras.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-cyan-400 font-medium text-sm">
                  Processo Rápido e Seguro
                </p>
                <p className="text-gray-300 text-sm">
                  Envie seus documentos agora e nossa equipe fará a verificação em até 24 horas.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              Ir para Verificação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}