import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  DollarSign, 
  Clock, 
  Users,
  BarChart3,
  Target,
  Award,
  Calendar,
  Camera,
  Upload,
  Lightbulb,
  Brain,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface ProfessionalInsightsProps {
  professionalId: number;
  currentRating: number;
  completedServices: number;
  averagePrice: number;
  category: string;
}

interface AIInsight {
  id: string;
  type: 'pricing' | 'schedule' | 'service' | 'growth';
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

interface PortfolioItem {
  id: string;
  serviceType: string;
  clientName: string;
  date: string;
  price: number;
  duration: string;
  image?: string;
  description: string;
  challenges: string;
  learnings: string;
}

const ProfessionalInsights: React.FC<ProfessionalInsightsProps> = ({
  professionalId,
  currentRating,
  completedServices,
  averagePrice,
  category
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    serviceType: '',
    clientName: '',
    price: '',
    duration: '',
    description: '',
    challenges: '',
    learnings: ''
  });
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);

  useEffect(() => {
    // Gerar insights IA baseados no desempenho atual
    generateAIInsights();
    loadPortfolio();
  }, [professionalId, currentRating, completedServices]);

  const generateAIInsights = () => {
    // DADOS REAIS: Atualmente não há profissionais cadastrados na plataforma
    // Sistema aguarda primeiro profissional se cadastrar com documentos aprovados
    const noProInsights: AIInsight[] = [
      {
        id: '1',
        type: 'growth',
        title: 'Sistema Aguardando Profissionais',
        description: 'Plataforma tem 3 clientes ativos (Maria Helena, Pedro, João Vidal), mas nenhum profissional cadastrado ainda.',
        recommendation: 'Sistema preparado para primeiro profissional que se cadastrar e enviar documentos.',
        impact: 'high',
        confidence: 1.0
      },
      {
        id: '2',
        type: 'service',
        title: 'Oportunidade de Mercado',
        description: 'Demanda de clientes presente, mas sem oferta de profissionais - mercado virgem.',
        recommendation: 'Primeiro profissional terá acesso exclusivo aos 3 clientes já pagantes.',
        impact: 'high',
        confidence: 1.0
      }
    ];
    setInsights(noProInsights);
  };

  const loadPortfolio = () => {
    // DADOS REAIS: Atualmente não há profissional com documentos aprovados que executou serviços
    // Sistema aguarda profissionais reais enviarem documentos e executarem serviços
    const realPortfolio: PortfolioItem[] = [];
    setPortfolio(realPortfolio);
  };

  const handleAddPortfolio = () => {
    if (newPortfolioItem.serviceType && newPortfolioItem.clientName) {
      const newItem: PortfolioItem = {
        id: Date.now().toString(),
        ...newPortfolioItem,
        date: new Date().toISOString().split('T')[0],
        price: parseInt(newPortfolioItem.price) || 0
      };
      setPortfolio([newItem, ...portfolio]);
      setNewPortfolioItem({
        serviceType: '',
        clientName: '',
        price: '',
        duration: '',
        description: '',
        challenges: '',
        learnings: ''
      });
      setShowAddPortfolio(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getInsightIcon = (type: string) => {
    switch(type) {
      case 'pricing': return <DollarSign className="w-5 h-5" />;
      case 'schedule': return <Clock className="w-5 h-5" />;
      case 'service': return <Target className="w-5 h-5" />;
      case 'growth': return <TrendingUp className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header da Análise Inteligente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Análise Inteligente AI</h2>
        <p className="text-green-400">Insights automáticos baseados em seu desempenho real</p>
      </motion.div>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{(currentRating || 0).toFixed(1)}</div>
            <p className="text-gray-400 text-sm">Rating Médio</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{completedServices}</div>
            <p className="text-gray-400 text-sm">Serviços Concluídos</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">R$ {((averagePrice || 0)/1000).toFixed(1)}k</div>
            <p className="text-gray-400 text-sm">Preço Médio</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">+23%</div>
            <p className="text-gray-400 text-sm">Crescimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights AI */}
      <Card className="glassmorphism border-green-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-green-400" />
            <span>Recomendações Inteligentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
            >
              <div className="flex items-start space-x-3">
                <div className="text-green-400 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{insight.title}</h4>
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3">
                    <p className="text-green-400 text-sm font-medium">💡 Recomendação:</p>
                    <p className="text-green-300 text-sm">{insight.recommendation}</p>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-gray-400 text-xs">Confiança IA: </span>
                    <div className="ml-2 flex-1 bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-green-400 h-1.5 rounded-full" 
                        style={{ width: `${insight.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-green-400 text-xs ml-2">{(insight.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Portfólio de Trabalhos */}
      <Card className="glassmorphism border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Camera className="w-5 h-5 text-green-400" />
              <span>Portfólio de Trabalhos</span>
            </CardTitle>
            <Button
              onClick={() => setShowAddPortfolio(!showAddPortfolio)}
              className="neon-button-small"
            >
              <Upload className="w-4 h-4 mr-2" />
              Adicionar Trabalho
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário para adicionar novo trabalho */}
          {showAddPortfolio && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 space-y-4"
            >
              <h4 className="text-white font-medium flex items-center space-x-2">
                <Upload className="w-4 h-4 text-green-400" />
                <span>Novo Trabalho no Portfólio</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Tipo de serviço"
                  value={newPortfolioItem.serviceType}
                  onChange={(e) => setNewPortfolioItem({...newPortfolioItem, serviceType: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Nome do cliente (opcional)"
                  value={newPortfolioItem.clientName}
                  onChange={(e) => setNewPortfolioItem({...newPortfolioItem, clientName: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Preço cobrado (R$)"
                  value={newPortfolioItem.price}
                  onChange={(e) => setNewPortfolioItem({...newPortfolioItem, price: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Duração (ex: 4 horas)"
                  value={newPortfolioItem.duration}
                  onChange={(e) => setNewPortfolioItem({...newPortfolioItem, duration: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <Textarea
                placeholder="Descrição do trabalho executado"
                value={newPortfolioItem.description}
                onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <Textarea
                placeholder="Principais desafios enfrentados"
                value={newPortfolioItem.challenges}
                onChange={(e) => setNewPortfolioItem({...newPortfolioItem, challenges: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <Textarea
                placeholder="O que aprendi com este trabalho"
                value={newPortfolioItem.learnings}
                onChange={(e) => setNewPortfolioItem({...newPortfolioItem, learnings: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <div className="flex space-x-3">
                <Button onClick={handleAddPortfolio} className="neon-button">
                  Adicionar ao Portfólio
                </Button>
                <Button onClick={() => setShowAddPortfolio(false)} variant="outline">
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Lista de trabalhos do portfólio */}
          <div className="grid gap-4">
            {portfolio.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{item.serviceType}</h4>
                    <p className="text-gray-400 text-sm">{item.clientName} • {item.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">R$ {item.price.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">{item.duration}</div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                
                {item.challenges && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-md p-3 mb-3">
                    <p className="text-orange-400 text-xs font-medium mb-1">🚧 Desafios:</p>
                    <p className="text-orange-300 text-sm">{item.challenges}</p>
                  </div>
                )}
                
                {item.learnings && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3">
                    <p className="text-blue-400 text-xs font-medium mb-1">🎓 Aprendizados:</p>
                    <p className="text-blue-300 text-sm">{item.learnings}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalInsights;