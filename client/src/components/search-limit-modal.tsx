import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Home, Crown, Search } from "lucide-react";
import { useLocation } from "wouter";

interface SearchLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function SearchLimitModal({ isOpen, onClose, onLogin }: SearchLimitModalProps) {
  const [, setLocation] = useLocation();

  const handleHomeClick = () => {
    console.log('🏠 Home button clicked');
    onClose();
    setLocation('/');
  };

  const handleLoginClick = () => {
    console.log('🔑 Login button clicked');
    onClose();
    onLogin();
  };

  const handleEntendidoClick = () => {
    console.log('✅ Entendi button clicked');
    onClose();
    setLocation('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleEntendidoClick}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 0.7, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div 
              className="glassmorphism rounded-2xl p-6 max-w-sm w-full mx-4 border border-red-500/30 shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-red-400">Limite Atingido</h2>
                </div>
                <button
                  onClick={handleHomeClick}
                  className="text-gray-400 hover:text-cyan-400 transition-colors p-3 rounded-lg hover:bg-cyan-500/10 border border-gray-500/30 hover:border-cyan-500/50"
                  title="Voltar ao início"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start space-x-2">
                  <Search className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-1 text-sm">
                      Modo FREE: 1 pesquisa por mês
                    </p>
                    <p className="text-gray-300 text-xs">
                      Usuários no modo FREE têm direito a apenas <strong>1 pesquisa mensal</strong> no sistema orbital.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Crown className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-300 font-medium mb-1 text-sm">
                        Desbloqueie pesquisas ilimitadas
                      </p>
                      <p className="text-yellow-200 text-xs">
                        Faça login ou adquira um plano para ter acesso completo ao sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleLoginClick}
                  className="w-full neon-button py-2 px-4 rounded-lg font-medium transition-all text-sm"
                >
                  Fazer Login / Cadastro
                </button>
                <button
                  onClick={handleEntendidoClick}
                  className="w-full bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 py-2 px-4 rounded-lg font-medium transition-all border border-gray-500/30 text-sm"
                >
                  Entendi
                </button>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-3 border-t border-gray-600/30">
                <p className="text-center text-xs text-gray-400">
                  Limite renova automaticamente todo mês
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}