import { useEffect } from 'react';

export default function MobileTelegramOptimizer() {
  useEffect(() => {
    // Otimizações específicas para Telegram Web App
    try {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const webApp = (window as any).Telegram.WebApp;
        webApp.ready();
        webApp.expand();
        
        // Configurar tema para mobile
        webApp.setHeaderColor('bg_color');
        webApp.setBackgroundColor('#0f172a');
      }
    } catch (error) {
      // Silent fail - não é Telegram environment
    }

    // CSS inline para garantir otimização mobile
    const style = document.createElement('style');
    style.textContent = `
      /* Otimizações Mobile Telegram */
      @media (max-width: 640px) {
        .admin-dashboard-mobile {
          font-size: 12px;
          line-height: 1.3;
        }
        
        .admin-dashboard-mobile * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          touch-action: manipulation;
        }
        
        .admin-dashboard-mobile input,
        .admin-dashboard-mobile textarea,
        .admin-dashboard-mobile select {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* Scrollbar otimizada para mobile */
        .admin-dashboard-mobile::-webkit-scrollbar {
          width: 3px;
        }
        
        .admin-dashboard-mobile::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        
        .admin-dashboard-mobile::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.5);
          border-radius: 3px;
        }
        
        /* Touch targets mínimos 44px */
        .admin-dashboard-mobile button,
        .admin-dashboard-mobile .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Notificações compactas no Telegram */
        .notification-compact {
          max-width: 260px !important;
          padding: 4px 8px !important;
          font-size: 9px !important;
          line-height: 1.0 !important;
        }
        
        /* Abas compactas específicas para Telegram */
        .telegram-tabs {
          height: 40px !important;
          font-size: 10px !important;
          padding: 4px 5px !important;
        }
        
        /* Cards ultra-compactos para Telegram */
        .telegram-card {
          padding: 4px 6px !important;
          margin: 2px !important;
          font-size: 9px !important;
        }
        
        /* Espaçamento mobile otimizado */
        .admin-dashboard-mobile .gap-mobile {
          gap: 0.25rem;
        }
        
        .admin-dashboard-mobile .p-mobile {
          padding: 0.5rem;
        }
        
        .admin-dashboard-mobile .m-mobile {
          margin: 0.25rem;
        }
      }
      
      /* Telegram WebApp específico */
      .tg-viewport {
        height: 100vh !important;
        overflow-y: auto;
      }
      
      /* Performance otimizada */
      .admin-dashboard-mobile .will-change-scroll {
        will-change: scroll-position;
        -webkit-overflow-scrolling: touch;
      }
    `;
    
    document.head.appendChild(style);
    
    // Adicionar classe ao body para identificação
    document.body.classList.add('admin-dashboard-mobile');
    
    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('admin-dashboard-mobile');
    };
  }, []);

  return null; // Componente invisível
}