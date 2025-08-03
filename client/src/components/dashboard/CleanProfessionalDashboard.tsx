import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle, 
  Star,
  Wallet,
  Clock,
  Home,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  Brain,
  MessageCircle,
  ArrowUpCircle,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import GPSTracking from "@/components/GPSTracking";
import InteractiveCalendar from "@/components/InteractiveCalendar";
import ProfessionalInsights from "@/components/ProfessionalInsights";
import ProfessionalCalendarInsights from "@/components/ProfessionalCalendarInsights";
import BellNotificationTrigger from "@/components/BellNotificationTrigger";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import { TokensPurchaseTrigger } from "@/components/TokensPurchaseTrigger";

// Função para tracking de comportamento dos dropdowns
const trackDropdownClick = async (category: string, tab: string, user: any) => {
  try {
    console.log(`📊 ATIVIDADE TEMPO REAL - Dashboard Profissional:`, {
      user: user?.username || 'Profissional',
      activeTab: tab,
      timestamp: new Date().toISOString(),
      userType: 'professional'
    });
  } catch (error) {
    // Silenciar erro para não afetar UX
  }
};

interface ProfessionalDashboardProps {
  user: any;
}

export function CleanProfessionalDashboard({ user }: ProfessionalDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Queries para dados em tempo real
  const { data: pendingRequests } = useQuery({
    queryKey: ['/api/service-requests/professional', user.id, 'pending'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: acceptedServices } = useQuery({
    queryKey: ['/api/service-requests/professional', user.id, 'accepted'],
    staleTime: 5 * 60 * 1000,
  });

  // Query para carteira com dados reais do backend
  const { data: wallet } = useQuery({
    queryKey: ['/api/wallet/user', user.email],
    enabled: !!user?.email,
    staleTime: 30 * 1000, // 30 segundos
    queryFn: async () => {
      const response = await fetch('/api/wallet/user', {
        headers: {
          'User-Email': user.email,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/professional-stats', user.id],
    staleTime: 5 * 60 * 1000,
  });

  const pendingCount = pendingRequests?.length || 0;
  const acceptedCount = acceptedServices?.length || 0;
  const tokensTotal = wallet?.saldoTotal || 0;
  const tokensComprados = wallet?.tokensComprados || 0;
  const tokensPlano = wallet?.tokensPlano || 0;
  const tokensEarned = wallet?.tokensGanhos || 0;
  const rating = stats?.averageRating || 0;

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Sistema de notificações integrado com Home */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <BellNotificationTrigger />
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors border border-red-500/30 rounded-lg"
            title="Voltar ao Orbit"
          >
            <Home className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      
      {/* Botões de navegação para admin - 15% mais à direita */}
      {user?.email === 'passosmir4@gmail.com' && (
        <div className="fixed top-4 left-[65%] transform -translate-x-1/2 z-40 flex flex-row gap-1.5">
          <Link href="/dashboard-admin">
            <Button size="sm" className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[7px] px-1 py-0.5 h-4 w-10 scale-80">
              Admin
            </Button>
          </Link>
          <Link href="/dashboard-client">
            <Button size="sm" className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-[7px] px-1 py-0.5 h-4 w-10 scale-80">
              Cliente
            </Button>
          </Link>
        </div>
      )}
      
      <div className="container mx-auto px-3 py-6 max-w-md sm:max-w-2xl lg:max-w-4xl">
        {/* Header Compacto para Mobile */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Dashboard Pro
              </h1>
              <p className="text-gray-300 text-sm">
                {user.username}
              </p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Stats Cards Compactos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="glassmorphism border-red-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-red-500/20 rounded-lg">
                    <Bell className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Pendentes</p>
                    <p className="text-white font-semibold text-sm">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-green-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Aceitos</p>
                    <p className="text-white font-semibold text-sm">{acceptedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-yellow-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Rating</p>
                    <p className="text-white font-semibold text-sm">{rating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-cyan-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Tokens</p>
                    <p className="text-white font-semibold text-sm">{tokensEarned.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Mobile Optimized Navigation */}
        <div className="w-full bg-gray-900/50 border-b border-gray-700/50 p-2">
          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto sm:max-w-2xl sm:grid-cols-8">
            {[
              { id: 'overview', icon: Home, label: '🏠 Principal', color: 'from-cyan-500 to-cyan-600' },
              { id: 'map', icon: MapPin, label: '🗺️ GPS', color: 'from-cyan-600 to-sky-500' },
              { id: 'profile', icon: User, label: '👤 Perfil', color: 'from-sky-500 to-indigo-500' },
              { id: 'documents', icon: FileText, label: '📄 Docs', color: 'from-indigo-400 to-indigo-600' },
              { id: 'wallet', icon: Wallet, label: '💰 Carteira', color: 'from-indigo-500 to-blue-500' },
              { id: 'pending', icon: MessageCircle, label: '📩 Pedidos', color: 'from-blue-500 to-teal-500' },
              { id: 'calendar', icon: Calendar, label: '📅 Agenda', color: 'from-teal-500 to-emerald-500' },
              { id: 'insights', icon: Brain, label: '🧠 IA', color: 'from-emerald-500 to-emerald-600' },
              { id: 'calendar-insights', icon: TrendingUp, label: '📊 Analytics', color: 'from-emerald-600 to-green-500' },
            ].map((tab) => (
              <motion.div key={tab.id} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => {
                    trackDropdownClick('main', tab.id, user);
                    setActiveTab(tab.id);
                  }}
                  className={`
                    w-full h-10 sm:h-11 px-1 py-1 rounded-lg text-[9px] sm:text-[10px] font-medium transition-all duration-300
                    bg-gradient-to-r ${tab.color} hover:shadow-lg hover:scale-105 hover:shadow-yellow-400/10 hover:ring-1 hover:ring-yellow-400/20
                    ${activeTab === tab.id ? 'ring-2 ring-slate-300/50 shadow-xl scale-105' : ''}
                    text-gray-200 border-0 flex flex-col items-center justify-center space-y-0.5
                    touch-manipulation telegram-tabs
                  `}
                  style={{ minHeight: '40px' }}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="text-[9px] sm:text-[10px] leading-tight text-center">{tab.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          {/* GPS Map Tab */}
          {activeTab === 'map' && (
            <div>
              <GPSTracking 
                userType="professional" 
                userId={user?.id || 1} 
                username={user?.username || 'Profissional'} 
              />
            </div>
          )}

          {/* Principal/Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-4">
              <Card className="glassmorphism border-gray-500/30">
                <CardHeader>
                  <CardTitle className="text-gray-200 flex items-center space-x-2 text-lg">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span>Atividade Recente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-gray-400">Nenhuma atividade recente</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* IA Insights Tab */}
          {activeTab === 'insights' && (
            <ProfessionalInsights 
              professionalId={user?.id} 
              professionalName={user?.username}
            />
          )}

          {/* Calendar Insights Tab */}
          {activeTab === 'calendar-insights' && (
            <ProfessionalCalendarInsights 
              professionalId={user?.id}
              professionalName={user?.username}
            />
          )}

          {/* Pedidos/Solicitações Tab */}
          {activeTab === 'pending' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-gray-200 text-lg">Solicitações Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-400">
                    {pendingCount > 0 ? `${pendingCount} solicitações pendentes` : 'Nenhuma solicitação pendente'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agenda/Calendar Tab */}
          {activeTab === 'calendar' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-gray-200 text-lg">Agenda do Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-400">Calendário em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <ProfileEditor userType="professional" />
            </motion.div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="glassmorphism border-gray-500/30">
                <CardContent className="p-6">
                  <DocumentUpload 
                    user={user}
                    title="Documentos Profissionais"
                    description="Envie seus documentos profissionais para liberar serviços avançados e aumentar sua credibilidade"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {/* Resumo da Carteira */}
              <Card className="glassmorphism border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-cyan-400" />
                    Carteira Profissional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Saldo Total */}
                    <div className="text-center p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-300 text-sm">💰 Saldo Total</p>
                      <p className="text-white text-2xl font-bold">{tokensTotal.toLocaleString()}</p>
                      <p className="text-cyan-400 text-xs">R$ {(tokensTotal / 720).toFixed(2)}</p>
                    </div>
                    
                    {/* Tokens Comprados */}
                    <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20">
                      <p className="text-gray-300 text-sm">🛒 Tokens Comprados</p>
                      <p className="text-white text-2xl font-bold">{tokensComprados.toLocaleString()}</p>
                      <p className="text-purple-400 text-xs">R$ {(tokensComprados / 720).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção de Tokens para Serviços */}
              <Card className="glassmorphism border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-purple-400" />
                    Tokens para Contratar Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Saldo disponível:</span>
                      <span className="text-purple-400 font-bold">{tokensComprados.toLocaleString()} tokens</span>
                    </div>
                    
                    <div className="text-sm text-gray-400 space-y-2">
                      <p>• ✅ Válido para contratar profissionais</p>
                      <p>• ✅ Disponível imediatamente após compra</p>
                      <p>• ❌ Não gera cashback de 8,7%</p>
                      <p>• ❌ Não permite tokens em jogos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sistema de Planos e Cashback */}
              <Card className="glassmorphism border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                    Sistema de Cashback 8,7% Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                        <p className="text-gray-300 text-sm">Tokens do Plano</p>
                        <p className="text-emerald-400 font-bold">{tokensPlano.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 bg-green-500/10 rounded-lg">
                        <p className="text-gray-300 text-sm">Disponível Saque</p>
                        <p className="text-green-400 font-bold">R$ {((tokensPlano * 0.087) / 720).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Próximo saque:</span>
                      <span className="text-cyan-400">03/08/2025 às 00:00</span>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600 text-white"
                      disabled={new Date().getDate() !== 3 || tokensPlano <= 0}
                      onClick={async () => {
                        if (new Date().getDate() === 3 && tokensPlano > 0) {
                          const pixKey = prompt("Digite sua chave PIX para receber o saque:");
                          if (pixKey) {
                            try {
                              const response = await fetch('/api/wallet/withdraw-pix', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'User-Email': user.email
                                },
                                body: JSON.stringify({ pixKey })
                              });
                              
                              const result = await response.json();
                              if (result.success) {
                                alert(`✅ Saque processado! R$ ${result.valorSacado} enviado para ${pixKey}`);
                                window.location.reload(); // Atualizar dados
                              } else {
                                alert(`❌ Erro: ${result.error}`);
                              }
                            } catch (error) {
                              alert('❌ Erro ao processar saque');
                            }
                          }
                        }
                      }}
                    >
                      {new Date().getDate() === 3 ? 
                        (tokensPlano > 0 ? 'Solicitar Saque PIX' : 'Sem saldo para saque') : 
                        'Saque disponível dia 3'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Valores de Referência */}
              <Card className="glassmorphism border-gray-500/30">
                <CardHeader>
                  <CardTitle className="text-gray-200 text-lg">💡 Valores de Referência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">R$ 3,00 → 2.160 tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R$ 6,00 → 4.320 tokens</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">R$ 9,00 → 6.480 tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R$ 18,00 → 12.960 tokens</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar Tab - Nova aba de agenda interativa */}
          {activeTab === 'calendar' && (
            <div>
              <InteractiveCalendar 
                userType="professional"
                userId={user?.id || 1}
              />
            </div>
          )}

          {/* Insights Tab - IA Analytics */}
          {activeTab === 'insights' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-gray-200 text-lg">Insights Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfessionalInsights 
                  professionalId={user?.id || 1}
                  category="Tecnologia"
                  currentRating={rating}
                />
              </CardContent>
            </Card>
          )}

          {/* Calendar Insights Tab */}
          {activeTab === 'calendar-insights' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-gray-200 text-lg">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfessionalCalendarInsights 
                  professionalId={user?.id || 1}
                  category="Tecnologia"
                  currentRating={rating}
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Sistema de Notificações com Bell Trigger - Compacto */}
      <BellNotificationTrigger />
      
      {/* Trigger +Tokens - Compra Rápida */}
      <TokensPurchaseTrigger />
    </div>
  );
}

export default CleanProfessionalDashboard;