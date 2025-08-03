import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";

interface TelegramTriggerProps {
  isSearchActive?: boolean;
}

export function TelegramTrigger({ isSearchActive = false }: TelegramTriggerProps) {
  const handleTelegramClick = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('TelegramTrigger clicado');
    
    // Se estamos no Telegram Mini App, dar feedback visual
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      console.log('Detectado Telegram WebApp - dando feedback tátil');
      
      // Feedback tátil se disponível
      const webApp = (window as any).Telegram.WebApp;
      if (webApp.HapticFeedback && typeof webApp.HapticFeedback.impactOccurred === 'function') {
        try {
          webApp.HapticFeedback.impactOccurred('medium');
        } catch (e) {
          console.log('Erro ao dar feedback tátil:', e);
        }
      }
      
      console.log('Você já está no Telegram! Acesse @orbitrumconnect_bot diretamente');
      return;
    }
    
    // Estratégia melhorada para desktop
    console.log('Abrindo Telegram Bot - detectando ambiente');
    
    // Detectar se é mobile ou desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log('Mobile detectado - usando deep link + fallback');
      
      // Para mobile, tentar deep link primeiro
      try {
        window.location.href = 'tg://resolve?domain=orbitrumconnect_bot';
        
        // Fallback após 1 segundo se deep link não funcionar
        setTimeout(() => {
          console.log('Fallback para web mobile');
          window.open('https://t.me/orbitrumconnect_bot', '_blank', 'noopener,noreferrer');
        }, 1000);
      } catch (error) {
        console.log('Erro mobile, abrindo web');
        window.open('https://t.me/orbitrumconnect_bot', '_blank', 'noopener,noreferrer');
      }
    } else {
      console.log('Desktop detectado - abrindo Telegram diretamente');
      
      // Para desktop, múltiplas tentativas
      try {
        // Tentar abrir app Telegram desktop primeiro
        const telegramDesktop = window.open('tg://resolve?domain=orbitrumconnect_bot', '_self');
        
        // Se não conseguir, abrir web em nova aba
        setTimeout(() => {
          const webWindow = window.open('https://t.me/orbitrumconnect_bot', '_blank', 'noopener,noreferrer');
          console.log('Telegram web aberto:', webWindow ? 'sucesso' : 'falhou');
          
          // Se tudo falhar, redirecionar página atual
          if (!webWindow) {
            console.log('Redirecionando página atual');
            window.location.href = 'https://t.me/orbitrumconnect_bot';
          }
        }, 500);
      } catch (error) {
        console.log('Erro desktop, tentando fallback:', error);
        window.open('https://t.me/orbitrumconnect_bot', '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isSearchActive ? 0 : 1, 
        scale: isSearchActive ? 0.5 : 1 
      }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className={`fixed z-40 transition-all duration-500 ${
        isSearchActive 
          ? 'opacity-0 pointer-events-none' 
          : 'right-4 sm:right-6 bottom-32 sm:bottom-24 opacity-100'
      }`}
    >
      <motion.button
        onClick={handleTelegramClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 p-2 sm:p-3 rounded-full shadow-2xl backdrop-blur-sm border border-white/20 hover:border-cyan-400/50 transition-all duration-300 touch-manipulation scale-[0.7]"
        style={{ 
          minHeight: '40px',
          minWidth: '40px',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        aria-label="Abrir Telegram Bot"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full opacity-30 group-hover:opacity-50 blur-lg transition-opacity duration-300"></div>
        
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-white drop-shadow-lg" />
          <Send className="h-2 w-2 text-white ml-0.5 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 animate-ping"></div>
        
        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap border border-cyan-400/30">
            🤖 Telegram Bot
            <div className="text-xs text-gray-300">@orbitrumconnect_bot</div>
          </div>
          {/* Arrow */}
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-black/80 border-t-4 border-b-4 border-t-transparent border-b-transparent"></div>
        </div>
      </motion.button>
      
      {/* Text label abaixo do botão */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-2 text-center"
      >
        <div className="text-xs text-cyan-300 font-medium drop-shadow-lg">
          Telegram
        </div>
      </motion.div>
    </motion.div>
  );
}