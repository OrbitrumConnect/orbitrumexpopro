import { useState, useEffect } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  daysRemaining?: number;
  isRead: boolean;
  expiresAt?: string;
  createdAt: string;
}

export function PlanExpiryNotification() {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Verificar notificações periodicamente
    const checkNotifications = async () => {
      try {
        const response = await apiRequest("GET", "/api/notifications");
        const data = await response.json();
        
        if ((data as any).success && (data as any).notifications?.length > 0) {
          const unreadNotifications = (data as any).notifications.filter((n: NotificationData) => !n.isRead);
          
          if (unreadNotifications.length > 0) {
            const latestNotification = unreadNotifications[0];
            setActiveNotification(latestNotification);
            setShowNotification(true);
            
            // Auto-hide após 10 segundos
            setTimeout(() => {
              setShowNotification(false);
              markAsRead(latestNotification.id);
            }, 10000);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    };

    // Verificar imediatamente e depois a cada 5 minutos
    checkNotifications();
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAsRead = async (notificationId: number) => {
    try {
      await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
    if (activeNotification) {
      markAsRead(activeNotification.id);
    }
  };

  if (!showNotification || !activeNotification) {
    return null;
  }

  const isWarning = activeNotification.type === 'plan_expiry_warning';
  const isExpired = activeNotification.type === 'plan_expired';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`
        p-4 rounded-lg shadow-2xl border backdrop-blur-sm
        ${isExpired 
          ? 'bg-red-900/90 border-red-500/50 text-red-100' 
          : 'bg-amber-900/90 border-amber-500/50 text-amber-100'
        }
        animate-in slide-in-from-right-full duration-500
      `}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${isExpired ? 'text-red-400' : 'text-amber-400'}`}>
            {isExpired ? <AlertTriangle size={20} /> : <Clock size={20} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">
              {activeNotification.title}
            </h4>
            <p className="text-xs opacity-90 leading-relaxed">
              {activeNotification.message}
            </p>
            
            {activeNotification.daysRemaining !== undefined && (
              <div className="mt-2 text-xs font-medium">
                {activeNotification.daysRemaining > 0 
                  ? `${activeNotification.daysRemaining} dias restantes`
                  : 'Plano expirado'
                }
              </div>
            )}
          </div>
          
          <button
            onClick={closeNotification}
            className={`
              flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors
              ${isExpired ? 'text-red-300 hover:text-red-100' : 'text-amber-300 hover:text-amber-100'}
            `}
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex justify-between items-center text-xs">
            <span className="opacity-75">
              {new Date(activeNotification.createdAt).toLocaleString('pt-BR')}
            </span>
            <button
              onClick={closeNotification}
              className="text-white/80 hover:text-white font-medium"
            >
              Entendi
            </button>
          </div>
        </div>
        
        {/* Barra de progresso automática */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-full w-full overflow-hidden">
          <div 
            className={`h-full ${isExpired ? 'bg-red-400' : 'bg-amber-400'} animate-pulse`}
            style={{
              animation: 'notification-progress 10s linear forwards'
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes notification-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}