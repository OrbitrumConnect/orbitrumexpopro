import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Users, 
  Gamepad2, 
  Coins, 
  Clock,
  Monitor,
  Eye,
  Settings,
  Search,
  UserCheck
} from "lucide-react";

interface RealTimeActivity {
  type: 'game_started' | 'game_completed' | 'tokens_spent' | 'team_created' | 'user_connected' | 'dashboard_activity' | 'search_performed' | 'profile_viewed';
  userId: number;
  username: string;
  timestamp: string;
  amount?: number;
  service?: string;
  score?: number;
  tokensEarned?: number;
  teamName?: string;
  activity?: string;
  activeTab?: string;
  plan?: string;
  userType?: string;
}

export function RealTimeMonitor() {
  const [activities, setActivities] = useState<RealTimeActivity[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    totalActions: 0,
    activeUsers: 0,
    gamesPlayed: 0,
    tokensSpent: 0
  });

  useEffect(() => {
    // Escutar logs do console para capturar atividades reais
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      
      // Capturar logs de atividade do dashboard
      if (args[0] && typeof args[0] === 'string' && args[0].includes('📊 ATIVIDADE TEMPO REAL')) {
        const activityData = args[1];
        if (activityData && activityData.user && activityData.activeTab) {
          const newActivity: RealTimeActivity = {
            type: 'dashboard_activity',
            userId: 1,
            username: activityData.user,
            timestamp: activityData.timestamp || new Date().toISOString(),
            activeTab: activityData.activeTab,
            plan: activityData.plan,
            userType: activityData.userType,
            activity: `${activityData.userType === 'professional' ? 'Dashboard Profissional' : 'Dashboard Cliente'} - ${activityData.activeTab}`
          };
          
          setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
          setRealTimeStats(prev => ({
            ...prev,
            totalActions: prev.totalActions + 1,
            activeUsers: prev.activeUsers + (Math.random() > 0.8 ? 1 : 0)
          }));
        }
      }
    };

    // Simular atividades diversas para demonstração
    const interval = setInterval(() => {
      const mockActivities: RealTimeActivity[] = [
        {
          type: 'search_performed',
          userId: 2,
          username: 'carlos_silva',
          timestamp: new Date().toISOString(),
          activity: 'Pesquisou por "desenvolvedor web"'
        },
        {
          type: 'profile_viewed',
          userId: 3,
          username: 'ana_santos',
          timestamp: new Date().toISOString(),
          service: 'João Pereira - Engenheiro Civil'
        },
        {
          type: 'game_started',
          userId: 4,
          username: 'roberto_lima',
          timestamp: new Date().toISOString()
        },
        {
          type: 'tokens_spent',
          userId: 5,
          username: 'maria_costa',
          timestamp: new Date().toISOString(),
          amount: 2500,
          service: 'Contatar Ana Santos'
        },
        {
          type: 'team_created',
          userId: 6,
          username: 'pedro_santos',
          timestamp: new Date().toISOString(),
          teamName: 'Equipe Marketing Digital'
        }
      ];

      // Adicionar atividade aleatória
      if (Math.random() > 0.6) {
        const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
        setActivities(prev => [
          { ...randomActivity, timestamp: new Date().toISOString() },
          ...prev.slice(0, 19)
        ]);
        
        setRealTimeStats(prev => ({
          ...prev,
          totalActions: prev.totalActions + 1,
          gamesPlayed: randomActivity.type === 'game_started' ? prev.gamesPlayed + 1 : prev.gamesPlayed,
          tokensSpent: randomActivity.amount ? prev.tokensSpent + randomActivity.amount : prev.tokensSpent
        }));
      }
    }, 3000);

    // Simular usuários conectados em tempo real
    const userInterval = setInterval(() => {
      setConnectedUsers(Math.floor(Math.random() * 12) + 8);
      setRealTimeStats(prev => ({
        ...prev,
        activeUsers: Math.floor(Math.random() * 6) + 4
      }));
    }, 10000);

    setIsConnected(true);

    return () => {
      console.log = originalLog;
      clearInterval(interval);
      clearInterval(userInterval);
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'game_started':
      case 'game_completed':
        return <Gamepad2 className="w-4 h-4 text-purple-400" />;
      case 'tokens_spent':
        return <Coins className="w-4 h-4 text-yellow-400" />;
      case 'team_created':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'user_connected':
        return <UserCheck className="w-4 h-4 text-green-400" />;
      case 'dashboard_activity':
        return <Settings className="w-4 h-4 text-cyan-400" />;
      case 'search_performed':
        return <Search className="w-4 h-4 text-orange-400" />;
      case 'profile_viewed':
        return <Eye className="w-4 h-4 text-pink-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityDescription = (activity: RealTimeActivity) => {
    switch (activity.type) {
      case 'game_started':
        return `${activity.username} iniciou um jogo orbital`;
      case 'game_completed':
        return `${activity.username} completou jogo (Score: ${activity.score}, Tokens: ${activity.tokensEarned})`;
      case 'tokens_spent':
        return `${activity.username} gastou ${activity.amount?.toLocaleString()} tokens → ${activity.service}`;
      case 'team_created':
        return `${activity.username} criou time "${activity.teamName}"`;
      case 'user_connected':
        return `${activity.username} conectou-se ao sistema`;
      case 'dashboard_activity':
        return `${activity.username} → ${activity.activity}${activity.plan ? ` (${activity.plan})` : ''}`;
      case 'search_performed':
        return `${activity.username} → ${activity.activity}`;
      case 'profile_viewed':
        return `${activity.username} visualizou perfil: ${activity.service}`;
      default:
        return `${activity.username} realizou uma ação`;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Usuários Online</p>
                <p className="text-2xl font-bold text-green-400">{connectedUsers}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">Ações Hoje</p>
                <p className="text-2xl font-bold text-blue-400">{realTimeStats.totalActions}</p>
              </div>
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Jogos Ativos</p>
                <p className="text-2xl font-bold text-purple-400">{realTimeStats.gamesPlayed}</p>
              </div>
              <Gamepad2 className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300">Tokens Gastos</p>
                <p className="text-2xl font-bold text-yellow-400">{realTimeStats.tokensSpent.toLocaleString()}</p>
              </div>
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed de Atividades em Tempo Real */}
      <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-cyan-400 flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Feed de Atividades em Tempo Real
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
              LIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {activities.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-cyan-400/50" />
                </div>
                <p className="text-lg font-medium">Aguardando atividades...</p>
                <p className="text-sm mt-2 text-gray-400">
                  As atividades dos usuários aparecerão aqui automaticamente
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-xl transition-all duration-300 border ${
                      index === 0 
                        ? 'bg-gradient-to-r from-cyan-900/30 to-blue-900/20 border-cyan-500/30 shadow-lg' 
                        : 'bg-gray-900/30 border-gray-700/30 hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-100 font-medium leading-relaxed">
                        {getActivityDescription(activity)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-gray-400">
                          {formatTime(activity.timestamp)}
                        </p>
                        {activity.plan && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                            {activity.plan}
                          </Badge>
                        )}
                        {activity.userType && (
                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                            {activity.userType === 'professional' ? 'Profissional' : 'Cliente'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}