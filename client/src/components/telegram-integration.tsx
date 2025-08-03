// telegram-integration.tsx - Integração com Telegram Mini Apps
import { useEffect, useState } from 'react';
import { TelegramLoadingScreen } from './TelegramLoadingScreen';

// Declaração de tipos para Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
      };
    };
  }
}

export function useTelegramWebApp() {
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    // Verificar se está rodando no Telegram WebApp
    if (window.Telegram?.WebApp) {
      setIsInTelegram(true);
      setWebApp(window.Telegram.WebApp);
      
      // Configurar WebApp
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      console.log('🤖 Telegram Mini App inicializado!');
      console.log('Usuário:', window.Telegram.WebApp.initDataUnsafe.user);
      console.log('Tema:', window.Telegram.WebApp.colorScheme);
    }
  }, []);

  return { isInTelegram, webApp };
}

export function TelegramThemeProvider({ children }: { children: React.ReactNode }) {
  const { isInTelegram, webApp } = useTelegramWebApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInTelegram && webApp) {
      // Aplicar tema do Telegram
      const theme = webApp.themeParams;
      const root = document.documentElement;
      
      if (theme.bg_color) {
        root.style.setProperty('--telegram-bg', theme.bg_color);
      }
      if (theme.text_color) {
        root.style.setProperty('--telegram-text', theme.text_color);
      }
      if (theme.button_color) {
        root.style.setProperty('--telegram-button', theme.button_color);
      }

      // Simular tempo de loading
      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      return () => clearTimeout(loadingTimer);
    } else {
      // Não está no Telegram, não precisa de loading
      setIsLoading(false);
    }
  }, [isInTelegram, webApp]);

  // Mostrar loading screen apenas no Telegram
  if (isInTelegram && isLoading) {
    return <TelegramLoadingScreen />;
  }

  return (
    <div className={isInTelegram ? 'telegram-app' : ''}>
      {children}
    </div>
  );
}

export function TelegramMainButton({ 
  text, 
  onClick, 
  show = true 
}: { 
  text: string; 
  onClick: () => void; 
  show?: boolean; 
}) {
  const { isInTelegram, webApp } = useTelegramWebApp();

  useEffect(() => {
    if (isInTelegram && webApp) {
      webApp.MainButton.text = text;
      webApp.MainButton.onClick(onClick);
      
      if (show) {
        webApp.MainButton.show();
      } else {
        webApp.MainButton.hide();
      }
    }

    return () => {
      if (isInTelegram && webApp) {
        webApp.MainButton.hide();
      }
    };
  }, [isInTelegram, webApp, text, onClick, show]);

  return null;
}

export function TelegramBackButton({ onClick }: { onClick: () => void }) {
  const { isInTelegram, webApp } = useTelegramWebApp();

  useEffect(() => {
    if (isInTelegram && webApp) {
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    }

    return () => {
      if (isInTelegram && webApp) {
        webApp.BackButton.hide();
      }
    };
  }, [isInTelegram, webApp, onClick]);

  return null;
}