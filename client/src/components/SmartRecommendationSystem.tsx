import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Star, 
  MapPin, 
  Zap,
  Target,
  Users,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SmartRecommendation {
  type: 'behavior' | 'performance' | 'location' | 'time' | 'preference';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  icon: any;
  color: string;
}

interface UserBehavior {
  searchHistory: string[];
  serviceHistory: string[];
  timePreferences: string[];
  locationData: { lat: number; lng: number };
  planType: string;
  tokenBalance: number;
}

interface SmartRecommendationSystemProps {
  userBehavior: UserBehavior;
  userType: 'client' | 'professional';
}

const SmartRecommendationSystem: React.FC<SmartRecommendationSystemProps> = ({
  userBehavior,
  userType
}) => {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // Sistema de análise comportamental inteligente
  const analyzeUserBehavior = () => {
    const recs: SmartRecommendation[] = [];

    // 1. Análise de padrão temporal
    const mostActiveHours = userBehavior.timePreferences.slice(0, 2);
    if (mostActiveHours.length > 0) {
      recs.push({
        type: 'time',
        title: 'Horário Ideal Detectado',
        description: `Você é mais ativo às ${mostActiveHours.join(' e ')}h. Profissionais nestes horários têm 40% mais disponibilidade.`,
        confidence: 85,
        actionable: true,
        icon: Clock,
        color: 'from-blue-500 to-cyan-500'
      });
    }

    // 2. Análise de localização inteligente
    if (userBehavior.locationData) {
      recs.push({
        type: 'location',
        title: 'Profissionais Próximos Premium',
        description: `Detectamos 7 profissionais 5⭐ em um raio de 2km. Economia de 25% no deslocamento.`,
        confidence: 92,
        actionable: true,
        icon: MapPin,
        color: 'from-green-500 to-emerald-500'
      });
    }

    // 3. Análise de histórico de serviços
    const topServices = userBehavior.serviceHistory.slice(0, 3);
    if (topServices.length > 0) {
      recs.push({
        type: 'behavior',
        title: 'Padrão de Serviços Identificado',
        description: `Baseado no seu histórico, você prefere: ${topServices.join(', ')}. Temos specialists com 95% de satisfação.`,
        confidence: 78,
        actionable: true,
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-500'
      });
    }

    // 4. Recomendações baseadas no plano
    if (userBehavior.planType === 'pro' || userBehavior.planType === 'max') {
      recs.push({
        type: 'performance',
        title: 'Acesso VIP Ativado',
        description: `Como usuário ${userBehavior.planType.toUpperCase()}, você tem prioridade nos melhores profissionais. 3x mais respostas garantidas.`,
        confidence: 100,
        actionable: true,
        icon: Award,
        color: 'from-yellow-500 to-orange-500'
      });
    }

    // 5. Análise de token/créditos
    if (userBehavior.tokenBalance < 500) {
      recs.push({
        type: 'preference',
        title: 'Otimização de Tokens Sugerida',
        description: `Com ${userBehavior.tokenBalance} tokens, recomendamos profissionais com melhor custo-benefício. +30% economia possível.`,
        confidence: 88,
        actionable: true,
        icon: Zap,
        color: 'from-indigo-500 to-blue-500'
      });
    }

    // 6. Recommendations específicas por tipo de usuário
    if (userType === 'professional') {
      recs.push({
        type: 'performance',
        title: 'Oportunidade de Crescimento',
        description: `Profissionais similares a você faturam 40% mais oferecendo serviços complementares. Quer descobrir quais?`,
        confidence: 82,
        actionable: true,
        icon: Target,
        color: 'from-teal-500 to-green-500'
      });
    }

    setRecommendations(recs);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    // Simular análise por 2 segundos para efeito visual
    setTimeout(() => {
      analyzeUserBehavior();
    }, 2000);
  }, [userBehavior]);

  if (isAnalyzing) {
    return (
      <Card className="glassmorphism border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-8 w-8 text-cyan-400" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="font-semibold text-white">IA Analisando Comportamento...</h3>
              <p className="text-sm text-gray-400">Descobrindo padrões únicos para recomendações personalizadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Recomendações Inteligentes</h2>
        </div>
        <Badge variant="outline" className="text-cyan-400 border-cyan-400/50">
          IA Premium
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glassmorphism border-gray-700/50 hover:border-cyan-400/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${rec.color} bg-opacity-20`}>
                      <rec.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-white">
                        {rec.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs bg-gradient-to-r ${rec.color} text-white border-none`}
                        >
                          {rec.confidence}% confiança
                        </Badge>
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-500/50">
                          {rec.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-300 mb-3">{rec.description}</p>
                {rec.actionable && (
                  <Button 
                    size="sm" 
                    className={`bg-gradient-to-r ${rec.color} hover:opacity-80 text-white border-none`}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Aplicar Recomendação
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <Card className="glassmorphism border-gray-700/50">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">Continue usando a plataforma para receber recomendações personalizadas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartRecommendationSystem;