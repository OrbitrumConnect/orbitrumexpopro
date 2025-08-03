import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, Eye, Clock, Star, 
  Users, Target, Zap, Calendar, MapPin,
  BarChart3, PieChart, Activity, Brain
} from "lucide-react";

interface InsightsTabProps {
  userType: 'client' | 'professional' | 'admin';
  userId?: number;
  realTimeData?: any;
}

export function InsightsTab({ userType, userId, realTimeData }: InsightsTabProps) {
  
  // Dados em tempo real (serão populados conforme usuários usam a plataforma)
  const getInsightsData = () => {
    const baseData = {
      lastUpdate: new Date().toLocaleString('pt-BR'),
      hasRealData: realTimeData && Object.keys(realTimeData).length > 0
    };

    switch (userType) {
      case 'professional':
        return {
          ...baseData,
          profileViews: realTimeData?.profileViews || 0,
          contactsReceived: realTimeData?.contactsReceived || 0,
          servicesCompleted: realTimeData?.servicesCompleted || 0,
          averageRating: realTimeData?.averageRating || 0,
          conversionRate: realTimeData?.conversionRate || 0,
          responseTime: realTimeData?.responseTime || '0min',
          topCategories: realTimeData?.topCategories || [],
          peakHours: realTimeData?.peakHours || [],
          geographicReach: realTimeData?.geographicReach || {}
        };
      
      case 'client':
        return {
          ...baseData,
          servicesContracted: realTimeData?.servicesContracted || 0,
          favoriteCategories: realTimeData?.favoriteCategories || [],
          tokensSpent: realTimeData?.tokensSpent || 0,
          averageTicket: realTimeData?.averageTicket || 0,
          recontractionRate: realTimeData?.recontractionRate || 0,
          satisfactionScore: realTimeData?.satisfactionScore || 0,
          searchPatterns: realTimeData?.searchPatterns || [],
          preferredRegions: realTimeData?.preferredRegions || []
        };
      
      case 'admin':
        return {
          ...baseData,
          totalInteractions: realTimeData?.totalInteractions || 0,
          platformGrowth: realTimeData?.platformGrowth || 0,
          conversionTrends: realTimeData?.conversionTrends || [],
          demandHeatmap: realTimeData?.demandHeatmap || {},
          topPerformers: realTimeData?.topPerformers || [],
          bottlenecks: realTimeData?.bottlenecks || [],
          revenueProjection: realTimeData?.revenueProjection || 0,
          userRetention: realTimeData?.userRetention || 0
        };
      
      default:
        return baseData;
    }
  };

  const data = getInsightsData();

  const ProfessionalInsights = () => (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card className="glassmorphism border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Activity className="h-5 w-5" />
            Performance em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{data.profileViews}</div>
              <div className="text-sm text-gray-400 flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" />
                Visualizações
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.contactsReceived}</div>
              <div className="text-sm text-gray-400">Contatos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.servicesCompleted}</div>
              <div className="text-sm text-gray-400">Serviços</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{data.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-400 flex items-center justify-center gap-1">
                <Star className="h-3 w-3" />
                Avaliação
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Analytics */}
      <Card className="glassmorphism border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Target className="h-5 w-5" />
            Conversão e Eficiência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Taxa de Conversão</span>
            <div className="flex items-center gap-2">
              <Progress value={data.conversionRate} className="w-20" />
              <span className="text-white font-bold">{data.conversionRate}%</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Tempo de Resposta</span>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {data.responseTime}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="glassmorphism border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Brain className="h-5 w-5" />
            Recomendações IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.hasRealData ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="font-semibold text-green-400">Otimização Sugerida</div>
                <div className="text-sm text-gray-300">Baseada no seu padrão de uso</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Brain className="h-12 w-12 text-gray-500 mx-auto mb-2" />
              <div className="text-gray-400">Coletando dados comportamentais...</div>
              <div className="text-xs text-gray-500 mt-1">
                Recomendações aparecem após primeiros usos
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const ClientInsights = () => (
    <div className="space-y-6">
      {/* Usage Overview */}
      <Card className="glassmorphism border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <BarChart3 className="h-5 w-5" />
            Histórico de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{data.servicesContracted}</div>
              <div className="text-sm text-gray-400">Serviços Contratados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.tokensSpent}</div>
              <div className="text-sm text-gray-400">Tokens Gastos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">R$ {data.averageTicket}</div>
              <div className="text-sm text-gray-400">Ticket Médio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Patterns */}
      <Card className="glassmorphism border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <PieChart className="h-5 w-5" />
            Padrões Comportamentais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.hasRealData ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Recontratar Serviços</span>
                <span className="text-green-400">{data.recontractionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Satisfação Geral</span>
                <span className="text-yellow-400">{data.satisfactionScore}/5</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              Padrões aparecem após mais interações na plataforma
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      <Card className="glassmorphism border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Zap className="h-5 w-5" />
            Sugestões Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Zap className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            <div className="text-gray-400">IA analisando seus padrões...</div>
            <div className="text-xs text-gray-500 mt-1">
              Sugestões personalizadas em breve
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AdminInsights = () => (
    <div className="space-y-6">
      {/* Platform Overview */}
      <Card className="glassmorphism border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <TrendingUp className="h-5 w-5" />
            Analytics da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{data.totalInteractions}</div>
              <div className="text-sm text-gray-400">Interações Totais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">+{data.platformGrowth}%</div>
              <div className="text-sm text-gray-400">Crescimento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.userRetention}%</div>
              <div className="text-sm text-gray-400">Retenção</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">R$ {data.revenueProjection}</div>
              <div className="text-sm text-gray-400">Projeção</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heat Map Preview */}
      <Card className="glassmorphism border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <MapPin className="h-5 w-5" />
            Mapa de Demanda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            <div className="text-gray-400">Coletando dados geográficos...</div>
            <div className="text-xs text-gray-500 mt-1">
              Mapa de calor aparece com mais usuários
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="glassmorphism border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Activity className="h-5 w-5" />
            Saúde do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Performance Geral</span>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Excelente
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Última Atualização</span>
              <span className="text-xs text-gray-400">{data.lastUpdate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {userType === 'professional' && 'Insights Profissionais'}
            {userType === 'client' && 'Analytics Pessoais'}
            {userType === 'admin' && 'Intelligence Dashboard'}
          </h2>
          <p className="text-gray-400 text-sm">
            Dados atualizados em tempo real • {data.lastUpdate}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-xs text-green-400">Ao vivo</span>
        </div>
      </div>

      {/* Render appropriate insights based on user type */}
      {userType === 'professional' && <ProfessionalInsights />}
      {userType === 'client' && <ClientInsights />}
      {userType === 'admin' && <AdminInsights />}
    </div>
  );
}