import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Download, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DownloadPCButtonProps {
  className?: string;
  showText?: boolean;
}

export function DownloadPCButton({ className = "", showText = true }: DownloadPCButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Simular preparação do download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Criar link para download (quando o .exe estiver pronto)
      const link = document.createElement('a');
      link.href = '/api/download/orbitrum-setup.exe'; // Endpoint futuro
      link.download = 'Orbitrum-Setup.exe';
      
      // Para desenvolvimento, mostrar modal informativo
      setShowModal(true);
      setIsDownloading(false);
    } catch (error) {
      console.error('Erro no download:', error);
      setIsDownloading(false);
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`
          relative overflow-hidden
          bg-gradient-to-r from-purple-600 to-blue-600 
          hover:from-purple-700 hover:to-blue-700
          text-white border-0 shadow-lg
          transition-all duration-300
          hover:shadow-purple-500/25
          disabled:opacity-50
          ${className}
        `}
        size={showText ? "sm" : "sm"}
      >
        <div className="flex items-center space-x-2">
          {isDownloading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Download className="h-4 w-4" />
            </motion.div>
          ) : (
            <Monitor className="h-4 w-4" />
          )}
          
          {showText && (
            <span className="text-xs font-medium">
              {isDownloading ? "Preparando..." : "Baixar PC"}
            </span>
          )}
        </div>
        
        {/* Efeito de brilho */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </Button>

      {/* Modal informativo */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-white">
                  Orbitrum para PC
                </h3>
                
                <div className="space-y-3 text-gray-300 text-sm">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Aplicativo Nativo Windows</p>
                      <p className="text-xs text-gray-400">Instalação completa com atalho na área de trabalho</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Todas as Funcionalidades</p>
                      <p className="text-xs text-gray-400">PIX, dashboards, jogos, Telegram - tudo incluído</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Atualizações Automáticas</p>
                      <p className="text-xs text-gray-400">Sempre sincronizado com a versão web</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <p className="text-xs text-amber-300 font-medium">
                        Em Desenvolvimento
                      </p>
                    </div>
                    <p className="text-xs text-amber-300/80 mt-1">
                      O executável está sendo preparado. Em breve estará disponível para download!
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    size="sm"
                  >
                    Entendi
                  </Button>
                  <Button
                    onClick={() => {
                      window.open('https://t.me/orbitrumconnetc_bot', '_blank');
                      setShowModal(false);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    Telegram
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}