import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Mail } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  showEmailIcon?: boolean;
  showResendButton?: boolean;
  onResend?: () => void;
}

export function NotificationModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  showEmailIcon = false,
  showResendButton = false,
  onResend
}: NotificationModalProps) {

  // Função para fechar modal com tratamento especial para Telegram
  const handleClose = (e?: React.MouseEvent | React.TouchEvent | boolean) => {
    if (e && typeof e === 'object' && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('🚀 Fechando modal de notificação...');
    onClose();
    
    // Tratamento especial para Telegram Mini App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      console.log('📱 Ambiente Telegram detectado, aplicando correções...');
      // Forçar atualização do estado
      setTimeout(() => {
        onClose();
      }, 50);
      // Dupla verificação
      setTimeout(() => {
        onClose();
      }, 150);
    }
  };
  
  const getIcon = () => {
    if (showEmailIcon) return <Mail className="h-8 w-8" />;
    
    switch (type) {
      case 'success':
        return <CheckCircle className="h-8 w-8" />;
      case 'error':
        return <AlertCircle className="h-8 w-8" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8" />;
      case 'info':
        return <Info className="h-8 w-8" />;
      default:
        return <CheckCircle className="h-8 w-8" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          iconColor: 'text-green-400',
          bgGradient: 'from-green-500/20 to-emerald-500/20',
          borderColor: 'border-green-500/40',
          buttonBg: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          iconColor: 'text-red-400',
          bgGradient: 'from-red-500/20 to-pink-500/20',
          borderColor: 'border-red-500/40',
          buttonBg: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-400',
          bgGradient: 'from-yellow-500/20 to-orange-500/20',
          borderColor: 'border-yellow-500/40',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'info':
        return {
          iconColor: 'text-[var(--neon-cyan)]',
          bgGradient: 'from-cyan-500/20 to-blue-500/20',
          borderColor: 'border-cyan-500/40',
          buttonBg: 'bg-cyan-600 hover:bg-cyan-700'
        };
      default:
        return {
          iconColor: 'text-[var(--neon-cyan)]',
          bgGradient: 'from-cyan-500/20 to-blue-500/20',
          borderColor: 'border-cyan-500/40',
          buttonBg: 'bg-cyan-600 hover:bg-cyan-700'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
                  <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm sm:max-w-md mx-auto bg-black/95 border text-white overflow-hidden" aria-describedby="notification-description">
              <DialogTitle className="sr-only">{title}</DialogTitle>
              <DialogDescription id="notification-description" className="sr-only">{message}</DialogDescription>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`relative p-6 text-center bg-gradient-to-br ${colors.bgGradient} ${colors.borderColor} border-2 rounded-xl backdrop-blur-sm`}
            >
              {/* Fechar X no canto */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Ícone principal com animação */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className={`mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br ${colors.bgGradient} border ${colors.borderColor} flex items-center justify-center ${colors.iconColor}`}
              >
                {getIcon()}
              </motion.div>

              {/* Título */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                {title}
              </motion.h3>

              {/* Mensagem */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-gray-300 text-sm leading-relaxed mb-6"
              >
                {message}
              </motion.p>

              {/* Botões de ação */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="space-y-3"
              >
                {/* Botão de reenvio de email se necessário */}
                {showResendButton && onResend && (
                  <Button
                    onClick={onResend}
                    onTouchStart={onResend}
                    onTouchEnd={onResend}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none touch-manipulation z-50 select-none"
                    style={{ 
                      minHeight: '44px',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar Email
                  </Button>
                )}
                
                {/* Botão principal */}
                <Button
                  onClick={handleClose}
                  onTouchStart={handleClose}
                  onTouchEnd={handleClose}
                  className={`w-full ${colors.buttonBg} text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black touch-manipulation z-50 select-none`}
                  style={{ 
                    minHeight: '44px',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  Entendi
                </Button>
              </motion.div>

              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse opacity-20" />
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}