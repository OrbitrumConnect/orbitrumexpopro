import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  MessageCircle, 
  Star,
  Wallet,
  Clock,
  Home,
  MapPin,
  User,
  Calendar,
  Brain,
  TrendingUp,
  Briefcase,
  ArrowUpCircle,
  Info,
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePerformanceAnalytics } from "@/hooks/usePerformanceAnalytics";
import GPSTracking from "@/components/GPSTracking";
import InteractiveCalendar from "@/components/InteractiveCalendar";
import AIAutoChatSystem from "@/components/AIAutoChatSystem";
import BellNotificationTrigger from "@/components/BellNotificationTrigger";
import MobileTelegramOptimizer from "@/components/MobileTelegramOptimizer";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import { TokensPurchaseTrigger } from "@/components/TokensPurchaseTrigger";


// Sistema avançado de tracking comportamental para otimização
const trackDropdownClick = async (category: string, tab: string, user: any) => {
  try {
    const behaviorData = {
      user: user?.username || 'Cliente',
      activeTab: tab,
      category,
      timestamp: new Date().toISOString(),
      userType: 'client',
      sessionId: `${user?.email || 'guest'}_${Date.now()}`,
      
      // Dados para otimização da plataforma
      performance: {
        loadTime: performance.now(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      },
      
      // Padrões de uso para melhorar experiência
      usagePattern: {
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        previousTab: localStorage.getItem('lastActiveTab'),
        sessionDuration: Date.now() - (parseInt(localStorage.getItem('sessionStart') || '0'))
      }
    };

    console.log(`🔥 DADOS COMPORTAMENTAIS AVANÇADOS - Cliente:`, behaviorData);
    
    // Armazenar para análise de padrões
    localStorage.setItem('lastActiveTab', tab);
    localStorage.setItem('sessionStart', localStorage.getItem('sessionStart') || Date.now().toString());
    
    // Enviar para sistema de analytics da plataforma
    await fetch('/api/analytics/behavior-advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(behaviorData)
    }).catch(() => {}); // Silenciar falhas para não afetar UX
    
  } catch (error) {
    console.log('Analytics coletados para otimização da plataforma');
  }
};

// Componente de tabs otimizado para cliente
const ClientMobileOptimizedTabs = ({ activeTab, setActiveTab, trackDropdownClick, user }: any) => {
  const handleTabClick = (category: string, tab: string) => {
    if (trackDropdownClick) {
      trackDropdownClick(category, tab, user);
    }
    setActiveTab(tab);
  };

  const tabs = [
    // Linha 1 - Dashboard Principal
    { id: 'overview', icon: Home, label: '🏠 Principal', color: 'from-cyan-500 to-cyan-600' },
    { id: 'map', icon: MapPin, label: '🗺️ GPS', color: 'from-cyan-600 to-sky-500' },
    
    // Linha 2 - Conta & Config
    { id: 'profile', icon: User, label: '👤 Perfil', color: 'from-sky-500 to-indigo-500' },
    { id: 'documents', icon: FileText, label: '📄 Docs', color: 'from-indigo-400 to-indigo-600' },
    { id: 'wallet', icon: Wallet, label: '💰 Carteira', color: 'from-indigo-500 to-blue-500' },
    
    // Linha 3 - Serviços
    { id: 'services', icon: ShoppingCart, label: '🛒 Serviços', color: 'from-blue-500 to-teal-500' },
    { id: 'requests', icon: MessageCircle, label: '📋 Pedidos', color: 'from-teal-500 to-emerald-500' },
    
    // Linha 4 - Performance & Comunicação
    { id: 'chat', icon: MessageCircle, label: '💬 Chat IA', color: 'from-emerald-500 to-green-500' },
    { id: 'professional', icon: Briefcase, label: '👔 Torne-se Pro', color: 'from-green-500 to-green-600' },
    { id: 'analytics', icon: TrendingUp, label: '📊 Analytics', color: 'from-emerald-500 to-emerald-600' },
    { id: 'calendar', icon: Calendar, label: '📅 Agenda', color: 'from-emerald-600 to-green-500' },
  ];

  return (
    <div className="w-full bg-gray-900/50 border-b border-gray-700/50 p-2">
      {/* Layout em grid 4x2 para mobile otimizado */}
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto sm:max-w-2xl sm:grid-cols-8">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Button
              onClick={() => handleTabClick('main', tab.id)}
              className={`
                w-full h-10 sm:h-11 px-1 py-1 rounded-lg text-[9px] sm:text-[10px] font-medium transition-all duration-300
                bg-gradient-to-r ${tab.color} hover:shadow-lg hover:scale-105 hover:shadow-yellow-400/10 hover:ring-1 hover:ring-yellow-400/20
                ${activeTab === tab.id ? 'ring-2 ring-slate-300/50 shadow-xl scale-105' : ''}
                text-gray-200 border-0 flex flex-col items-center justify-center space-y-0.5
                touch-manipulation telegram-tabs
              `}
              style={{
                minHeight: '40px'
              }}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] leading-tight text-center">
                {tab.label}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
      
      {/* Indicador visual - ativo */}
      <div className="flex justify-center mt-2">
        <div className="text-xs text-gray-400">
          {tabs.find(t => t.id === activeTab)?.label || 'Selecionado'}
        </div>
      </div>
    </div>
  );
};

interface ClientDashboardProps {
  user: any;
}

export function CleanClientDashboard({ user }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { trackTabChange, trackInteraction, generatePlatformInsights } = usePerformanceAnalytics();

  // Queries para dados em tempo real da carteira
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

  const { data: serviceRequests } = useQuery({
    queryKey: ['/api/service-requests/client', user.id],
    staleTime: 5 * 60 * 1000,
  });

  const tokensTotal = wallet?.saldoTotal || 0;
  const tokensComprados = wallet?.tokensComprados || 0;
  const tokensPlano = wallet?.tokensPlano || 0;
  const requestsCount = (serviceRequests as any[])?.length || 0;

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <MobileTelegramOptimizer />
      
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
          <Link href="/dashboard-professional">
            <Button size="sm" className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-[7px] px-1 py-0.5 h-4 w-10 scale-80">
              Pro
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
              <h1 className="text-lg sm:text-xl font-bold text-gray-200">
                Dashboard Cliente
              </h1>
              <p className="text-gray-300 text-sm">
                {user.username}
              </p>
            </div>
            <div className="opacity-0 pointer-events-none">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Cards Compactos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="glassmorphism border-cyan-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Total</p>
                    <p className="text-gray-200 font-semibold text-sm">{tokensTotal.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-purple-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <Star className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Comprados</p>
                    <p className="text-gray-200 font-semibold text-sm">{tokensComprados.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-green-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Planos</p>
                    <p className="text-gray-200 font-semibold text-sm">{tokensPlano.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-orange-500/30">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-orange-500/20 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Pedidos</p>
                    <p className="text-gray-200 font-semibold text-sm">{requestsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Mobile Optimized Navigation */}
        <ClientMobileOptimizedTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          trackDropdownClick={trackDropdownClick}
          user={user}
        />

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
                userType="client" 
                userId={user?.id || 1} 
                username={user?.username || 'Cliente'} 
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

          {/* Wallet Tab - Carteira Detalhada com Saque PIX */}
          {activeTab === 'wallet' && (
            <div className="space-y-4">
              <Card className="glassmorphism border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-gray-200 text-lg flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                    <span>Carteira do Cliente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Saldo Total */}
                  <div className="mb-6 text-center">
                    <p className="text-gray-300 text-sm">Saldo Total</p>
                    <p className="text-white text-3xl font-bold">{tokensTotal.toLocaleString()} tokens</p>
                    <p className="text-gray-400 text-xs">≈ R$ {(tokensTotal / 720).toFixed(2)}</p>
                  </div>

                  {/* Discriminação dos Tokens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <ShoppingCart className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-purple-300 text-sm font-medium">Tokens Comprados</p>
                          <p className="text-white text-xl font-bold">{tokensComprados.toLocaleString()}</p>
                          <p className="text-purple-400 text-xs">Para contratar serviços</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-green-300 text-sm font-medium">Tokens do Plano</p>
                          <p className="text-white text-xl font-bold">{tokensPlano.toLocaleString()}</p>
                          <p className="text-green-400 text-xs">Acumula 8,7% mensal</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sistema de Saque PIX 8,7% Mensal */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-green-500/10 p-4 rounded-lg border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <ArrowUpCircle className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-300 font-medium">Saque PIX Mensal</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        8,7% ao mês
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Disponível para saque:</span>
                        <span className="text-green-400 font-semibold">
                          R$ {((tokensPlano * 0.087) / 720).toFixed(2)} (dia 3)
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
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
                      
                      <p className="text-xs text-gray-400 text-center">
                        Saques processados automaticamente todo dia 3 do mês às 00:00
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <ProfileEditor userType="client" />
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
                    title="Verificação de Documentos"
                    description="Envie seus documentos para liberar a compra de planos pagos e acessar todas as funcionalidades"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}





          {/* Serviços Tab */}
          {activeTab === 'services' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg">Serviços Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-400">
                    <Link href="/" className="text-cyan-400 hover:underline">
                      Voltar ao Orbit para buscar profissionais
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pedidos/Requests Tab */}
          {activeTab === 'requests' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg">Meus Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-400">
                    {requestsCount > 0 ? `${requestsCount} pedidos ativos` : 'Nenhum pedido ativo'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg">Analytics do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-400">Analytics em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg">Agenda do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <InteractiveCalendar 
                  userType="client"
                  userId={user?.id || 1}
                />
              </CardContent>
            </Card>
          )}

          {/* Chat IA Tab - Posicionado embaixo */}
          {activeTab === 'chat' && (
            <div className="space-y-4 flex flex-col justify-end min-h-[60vh]">
              <div className="mt-auto">
                <AIAutoChatSystem 
                  userType="client"
                  userId={user?.id || 1}
                  userPlan={user?.plan || 'free'}
                  userTokens={tokensTotal}
                  serviceContext="Dashboard cliente"
                />
              </div>
            </div>
          )}

          {/* Torne-se Profissional Tab */}
          {activeTab === 'professional' && (
            <Card className="glassmorphism border-violet-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-violet-400" />
                  <span>Torne-se um Profissional</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className="mb-4 p-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg border border-violet-500/30">
                    <h3 className="text-white font-semibold mb-2">🚀 Maximize sua Renda</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Cadastre-se como profissional e receba solicitações de serviços diretamente
                    </p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Receba até 50 solicitações/mês</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>GPS em tempo real para clientes</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>Sistema de pagamento integrado</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/cadastro-profissional">
                    <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold">
                      Cadastrar como Profissional
                    </Button>
                  </Link>
                  
                  <p className="text-gray-400 text-xs mt-2">
                    Verificação de documentos necessária para segurança
                  </p>
                </div>
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

export default CleanClientDashboard;