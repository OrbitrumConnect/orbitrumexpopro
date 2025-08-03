import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  X, 
  Trash2, 
  Archive,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'radar' | 'communication';
  timestamp: Date;
  read: boolean;
  urgent?: boolean;
  expiresAt: Date;
  source?: string;
}

const BellNotificationTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [trashedNotifications, setTrashedNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');

  useEffect(() => {
    // Carregar notificações salvas do localStorage
    const savedNotifications = localStorage.getItem('orbitrum-notifications');
    const savedTrash = localStorage.getItem('orbitrum-notifications-trash');
    
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
        expiresAt: new Date(n.expiresAt)
      }));
      setNotifications(parsed);
    }
    
    if (savedTrash) {
      const parsedTrash = JSON.parse(savedTrash).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
        expiresAt: new Date(n.expiresAt)
      }));
      setTrashedNotifications(parsedTrash);
    }

    // Verificar notificações expiradas a cada 30 minutos (reduzido)
    const interval = setInterval(() => {
      checkExpiredNotifications();
    }, 30 * 60 * 1000);

    // Notificações de demonstração - apenas se necessário (muito raro)
    const shouldShowDemo = Math.random() > 0.95; // 5% chance apenas
    if (shouldShowDemo) {
      setTimeout(() => {
        addNotification({
          title: "Sistema Ativo",
          message: "Plataforma monitorando profissionais na região",
          type: "radar",
          urgent: false,
          source: "Sistema IA"
        });
      }, 8000);
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Salvar notificações no localStorage
    localStorage.setItem('orbitrum-notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    // Salvar lixeira no localStorage
    localStorage.setItem('orbitrum-notifications-trash', JSON.stringify(trashedNotifications));
  }, [trashedNotifications]);

  const addNotification = (data: Omit<Notification, 'id' | 'timestamp' | 'read' | 'expiresAt'>) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
      ...data
    };

    setNotifications(prev => [notification, ...prev]);
  };

  const checkExpiredNotifications = () => {
    const now = new Date();
    setNotifications(prev => {
      const expired = prev.filter(n => n.expiresAt <= now);
      const active = prev.filter(n => n.expiresAt > now);
      
      // Mover expiradas para lixeira
      if (expired.length > 0) {
        setTrashedNotifications(prevTrash => [...expired, ...prevTrash]);
      }
      
      return active;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setTrashedNotifications(prev => [notification, ...prev]);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const permanentDelete = (id: string) => {
    setTrashedNotifications(prev => prev.filter(n => n.id !== id));
  };

  const restoreFromTrash = (id: string) => {
    const notification = trashedNotifications.find(n => n.id === id);
    if (notification) {
      // Estender expiração por mais 3 dias
      const restoredNotification = {
        ...notification,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };
      setNotifications(prev => [restoredNotification, ...prev]);
    }
    setTrashedNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'radar': return <Star className="w-3 h-3 text-cyan-400" />;
      case 'communication': return <Bell className="w-3 h-3 text-purple-400" />;
      default: return <Info className="w-3 h-3 text-blue-400" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      case 'radar': return 'border-cyan-500/30 bg-cyan-500/10';
      case 'communication': return 'border-purple-500/30 bg-purple-500/10';
      default: return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Bell Trigger - Compacto para mobile */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="sm"
          className="relative bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-600/80 hover:to-blue-600/80 
                     backdrop-blur-sm border border-cyan-500/30 w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0 scale-80 sm:scale-85"
        >
          <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] sm:text-[9px] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 
                         flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Panel de Notificações - Otimizado para mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-12 right-0 sm:top-14"
          >
            <Card className="glassmorphism border-cyan-500/30 w-72 sm:w-80 max-h-96 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400">Notificações</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Tabs */}
                    <div className="flex bg-gray-700/50 rounded p-0.5">
                      <Button
                        size="sm"
                        variant={activeTab === 'active' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('active')}
                        className="text-xs px-2 py-1 h-6"
                      >
                        Ativas ({notifications.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeTab === 'trash' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('trash')}
                        className="text-xs px-2 py-1 h-6"
                      >
                        Lixeira ({trashedNotifications.length})
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      className="w-6 h-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <div className="max-h-80 overflow-y-auto">
                  {activeTab === 'active' && (
                    <>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          Nenhuma notificação ativa
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {notifications.map(notification => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className={`p-2 mx-2 my-1 rounded-lg border cursor-pointer transition-all
                                         ${getTypeColor(notification.type)}
                                         ${notification.read ? 'opacity-60' : 'opacity-100'}
                                         hover:bg-opacity-20`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1 min-w-0">
                                  {getNotificationIcon(notification.type)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-1">
                                      <h4 className="text-xs font-semibold text-white truncate">
                                        {notification.title}
                                      </h4>
                                      {!notification.read && (
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-300 mt-0.5 leading-tight">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-gray-400">
                                        {notification.timestamp.toLocaleTimeString('pt-BR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Expira em {Math.ceil((notification.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="w-5 h-5 p-0 ml-1 flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'trash' && (
                    <>
                      {trashedNotifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          Lixeira vazia
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {trashedNotifications.map(notification => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className={`p-2 mx-2 my-1 rounded-lg border opacity-50
                                         ${getTypeColor(notification.type)}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1 min-w-0">
                                  {getNotificationIcon(notification.type)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-white truncate">
                                      {notification.title}
                                    </h4>
                                    <p className="text-xs text-gray-300 mt-0.5 leading-tight line-through">
                                      {notification.message}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Removida em {notification.timestamp.toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => restoreFromTrash(notification.id)}
                                    className="w-5 h-5 p-0"
                                    title="Restaurar"
                                  >
                                    <Archive className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => permanentDelete(notification.id)}
                                    className="w-5 h-5 p-0"
                                    title="Excluir permanentemente"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BellNotificationTrigger;