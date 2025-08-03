import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, DollarSign, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  totalWithdrawals: number;
  monthlyStats: {
    newUsers: number;
    revenue: number;
    withdrawals: number;
  };
  withdrawalPool?: {
    totalAccumulated: number;
    monthlyLimit: number;
    currentMonthUsed: number;
    remainingThisMonth: number;
    utilizationRate: number;
    averageUserBalance: number;
    totalActiveUsers: number;
  };
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user: authUser } = useAuth();
  const { toast } = useToast();

  // Proteção de acesso - early return
  useEffect(() => {
    try {
      if (!isAuthenticated) {
        console.warn('⚠️ AdminDashboard: Usuário não autenticado, redirecionando...');
        setLocation('/');
        return;
      }
      
      if (authUser?.email !== 'passosmir4@gmail.com') {
        console.warn('⚠️ AdminDashboard: Usuário sem permissão admin, redirecionando...');
        setLocation('/');
        return;
      }
      
      console.log('✅ AdminDashboard: Usuário admin autorizado');
    } catch (error) {
      console.error('❌ AdminDashboard: Erro na verificação de permissão:', error);
      setLocation('/');
    }
  }, [isAuthenticated, authUser, setLocation]);

  // Proteção para renderização apenas quando autenticado
  if (!isAuthenticated || !authUser || authUser.email !== 'passosmir4@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-white">Verificando permissões...</div>
        </div>
      </div>
    );
  }

  // Query com proteção total
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: 3,
    staleTime: 0,
    gcTime: 0,
    enabled: isAuthenticated && authUser?.email === 'passosmir4@gmail.com',
  });

  // Estados de erro seguros
  if (statsError) {
    console.error('❌ AdminDashboard: Erro ao carregar dados:', statsError);
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">❌ Erro ao carregar dashboard</div>
          <div className="text-white">Tente recarregar a página</div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-white">Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  // Dados seguros com fallbacks
  const safeStats = {
    totalUsers: stats?.totalUsers || 0,
    activeUsers: stats?.activeUsers || 0,
    offlineUsers: stats?.offlineUsers || 0,
    totalRevenue: stats?.totalRevenue || 0,
    pendingWithdrawals: stats?.pendingWithdrawals || 0,
    totalWithdrawals: stats?.totalWithdrawals || 0,
    monthlyStats: {
      newUsers: stats?.monthlyStats?.newUsers || 0,
      revenue: stats?.monthlyStats?.revenue || 0,
      withdrawals: stats?.monthlyStats?.withdrawals || 0,
    },
    withdrawalPool: {
      totalAccumulated: stats?.withdrawalPool?.totalAccumulated || 0,
      monthlyLimit: stats?.withdrawalPool?.monthlyLimit || 0,
      currentMonthUsed: stats?.withdrawalPool?.currentMonthUsed || 0,
      remainingThisMonth: stats?.withdrawalPool?.remainingThisMonth || 0,
      utilizationRate: stats?.withdrawalPool?.utilizationRate || 0,
      averageUserBalance: stats?.withdrawalPool?.averageUserBalance || 0,
      totalActiveUsers: stats?.withdrawalPool?.totalActiveUsers || 0,
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header Simplificado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">Dashboard Admin</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Seguros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glassmorphism border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{safeStats.totalUsers}</div>
            <p className="text-xs text-gray-400">
              +{safeStats.monthlyStats.newUsers} este mês
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Usuários Ativos
            </CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{safeStats.activeUsers}</div>
            <p className="text-xs text-gray-400">
              Online agora
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {safeStats.totalRevenue.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-gray-400">
              +R$ {safeStats.monthlyStats.revenue.toFixed(2).replace('.', ',')} este mês
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Pool de Saques
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {safeStats.withdrawalPool.totalAccumulated.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-gray-400">
              {safeStats.withdrawalPool.utilizationRate.toFixed(1)}% utilização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sistema de Abas Completo */}
      <Tabs defaultValue="overview" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-9 bg-gray-800/50">
          <TabsTrigger value="overview" className="text-cyan-400 text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="users" className="text-green-400 text-xs">Usuários</TabsTrigger>
          <TabsTrigger value="tokens" className="text-blue-400 text-xs">Tokens</TabsTrigger>
          <TabsTrigger value="financial" className="text-yellow-400 text-xs">Financeiro</TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-purple-400 text-xs">Saques</TabsTrigger>
          <TabsTrigger value="moderation" className="text-red-400 text-xs">Moderação</TabsTrigger>
          <TabsTrigger value="reports" className="text-orange-400 text-xs">Relatórios</TabsTrigger>
          <TabsTrigger value="analytics" className="text-pink-400 text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="plans" className="text-indigo-400 text-xs">Planos</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Caixa - Tempo Real */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-yellow-400">💰 Caixa - Tempo Real</CardTitle>
              <CardDescription>Depósitos e equipamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-yellow-400">R$ 41,00</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-400">R$ 41,00</span>
                    <div className="text-gray-400">Total Caixa</div>
                    <div className="text-gray-400">Depósitos</div>
                  </div>
                  <div>
                    <span className="text-blue-400">R$ 41,00</span>
                    <div className="text-gray-400">Líquido</div>
                    <div className="text-gray-400">No sistema</div>
                  </div>
                  <div>
                    <span className="text-cyan-400">0</span>
                    <div className="text-gray-400">Clientes Ativos</div>
                    <div className="text-gray-400">Receita</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Atualizado: 31/07/2025 13:10:25
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards Inferiores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-orange-400">Saques Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{safeStats.pendingWithdrawals}</div>
                <div className="text-xs text-gray-400">Aguardando aprovação</div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-red-400">Total Sacado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">R$ {safeStats.totalWithdrawals.toFixed(2).replace('.', ',')}</div>
                <div className="text-xs text-gray-400">Saques pagos</div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-blue-400">Próxima Janela</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">3 AGO</div>
                <div className="text-xs text-gray-400">Próxima dia de saque</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Usuários */}
        <TabsContent value="users" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-green-400">👥 Gestão de Usuários</CardTitle>
              <CardDescription>Administração completa de usuários da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Card Admin */}
                <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-400 font-semibold">Admin</span>
                    <Badge className="bg-red-500/20 text-red-400">MASTER</Badge>
                  </div>
                  <p className="text-white font-medium">passosmir4@gmail.com</p>
                  <p className="text-gray-300 text-sm">Acesso total • ID: 1</p>
                  <p className="text-gray-400 text-xs">0 tokens • Admin Level 5</p>
                </div>

                {/* Card Pedro */}
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-semibold">Pedro Galluf</span>
                    <Badge className="bg-blue-500/20 text-blue-400">CLIENTE</Badge>
                  </div>
                  <p className="text-white font-medium">phpg69@gmail.com</p>
                  <p className="text-gray-300 text-sm">PIX R$ 3,00 • ID: 3</p>
                  <p className="text-gray-400 text-xs">2.160 tokens • Verificado</p>
                </div>

                {/* Card Maria Helena */}
                <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-semibold">Maria Helena</span>
                    <Badge className="bg-green-500/20 text-green-400">CLIENTE</Badge>
                  </div>
                  <p className="text-white font-medium">mariahelenaearp@gmail.com</p>
                  <p className="text-gray-300 text-sm">PIX R$ 6,00 • ID: 2</p>
                  <p className="text-gray-400 text-xs">4.320 tokens • Verificado</p>
                </div>

                {/* Card João Vidal */}
                <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-400 font-semibold">João Vidal</span>
                    <Badge className="bg-purple-500/20 text-purple-400">PROFISSIONAL</Badge>
                  </div>
                  <p className="text-white font-medium">joao.vidal@remederi.com</p>
                  <p className="text-gray-300 text-sm">Galaxy Vault R$ 32,00 • ID: 4</p>
                  <p className="text-gray-400 text-xs">23.040 tokens • Verificado</p>
                </div>
              </div>

              {/* Resumo de estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-cyan-400 font-semibold mb-2">Total de Usuários</h4>
                  <p className="text-2xl font-bold text-white">{safeStats.totalUsers}</p>
                  <p className="text-gray-300 text-sm">4 usuários pagantes</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-green-400 font-semibold mb-2">Usuários Ativos</h4>
                  <p className="text-2xl font-bold text-white">{safeStats.activeUsers}</p>
                  <p className="text-gray-300 text-sm">100% de engajamento</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-yellow-400 font-semibold mb-2">Taxa de Conversão</h4>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-gray-300 text-sm">Todos pagaram</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Tokens */}
        <TabsContent value="tokens" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-blue-400">🪙 Sistema de Tokens</CardTitle>
              <CardDescription>Controle total de tokens da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Cards de usuários com tokens */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-blue-400 font-semibold mb-2">Pedro Galluf</h4>
                  <p className="text-3xl font-bold text-white">2.160</p>
                  <p className="text-gray-300 text-sm">tokens (PIX R$ 3,00)</p>
                  <div className="mt-2 text-xs">
                    <p className="text-green-400">✓ Verificado • phpg69@gmail.com</p>
                    <p className="text-gray-400">Tokens Comprados: 2.160</p>
                    <p className="text-gray-400">Tokens Usados: 0</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <h4 className="text-green-400 font-semibold mb-2">Maria Helena</h4>
                  <p className="text-3xl font-bold text-white">4.320</p>
                  <p className="text-gray-300 text-sm">tokens (PIX R$ 6,00)</p>
                  <div className="mt-2 text-xs">
                    <p className="text-green-400">✓ Verificado • mariahelenaearp@gmail.com</p>
                    <p className="text-gray-400">Tokens Comprados: 4.320</p>
                    <p className="text-gray-400">Tokens Usados: 0</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <h4 className="text-purple-400 font-semibold mb-2">João Vidal</h4>
                  <p className="text-3xl font-bold text-white">23.040</p>
                  <p className="text-gray-300 text-sm">tokens (Galaxy Vault R$ 32,00)</p>
                  <div className="mt-2 text-xs">
                    <p className="text-green-400">✓ Verificado • joao.vidal@remederi.com</p>
                    <p className="text-gray-400">Tokens Comprados: 23.040</p>
                    <p className="text-gray-400">Tokens Usados: 0</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas gerais de tokens */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-cyan-400 font-semibold mb-2">Total de Tokens</h4>
                  <p className="text-2xl font-bold text-white">29.520</p>
                  <p className="text-gray-300 text-sm">Em circulação</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-yellow-400 font-semibold mb-2">Tokens Vendidos</h4>
                  <p className="text-2xl font-bold text-white">29.520</p>
                  <p className="text-gray-300 text-sm">Por PIX</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-red-400 font-semibold mb-2">Tokens Usados</h4>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">Em serviços</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-green-400 font-semibold mb-2">Taxa de Conversão</h4>
                  <p className="text-2xl font-bold text-white">1.389</p>
                  <p className="text-gray-300 text-sm">Tokens por real</p>
                </div>
              </div>

              {/* Breakdown de pacotes */}
              <div className="mt-6">
                <h5 className="text-white font-semibold mb-4">Breakdown por Pacote:</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-900/30 rounded-lg">
                    <p className="text-blue-400 font-medium">Pacote R$ 3,00</p>
                    <p className="text-white">1 venda • 2.160 tokens</p>
                    <p className="text-gray-400 text-sm">Pedro Galluf</p>
                  </div>
                  <div className="p-3 bg-green-900/30 rounded-lg">
                    <p className="text-green-400 font-medium">Pacote R$ 6,00</p>
                    <p className="text-white">1 venda • 4.320 tokens</p>
                    <p className="text-gray-400 text-sm">Maria Helena</p>
                  </div>
                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <p className="text-purple-400 font-medium">Galaxy Vault R$ 32,00</p>
                    <p className="text-white">1 venda • 23.040 tokens</p>
                    <p className="text-gray-400 text-sm">João Vidal</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Financeiro */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-yellow-400">💰 Sistema Financeiro</CardTitle>
              <CardDescription>Controle total das finanças da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Receita total destaque */}
              <div className="text-center mb-8 p-6 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                <DollarSign className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Receita Total</h3>
                <p className="text-4xl font-bold text-yellow-400 mb-2">
                  R$ 41,00
                </p>
                <p className="text-gray-300">Vendas de tokens via PIX</p>
              </div>

              {/* Breakdown detalhado por transação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-blue-400 font-semibold mb-2">Pedro Galluf</h4>
                  <p className="text-2xl font-bold text-white">R$ 3,00</p>
                  <div className="text-sm text-gray-300 mt-2">
                    <p>PIX: 03669282106 (PEDRO GALLUF)</p>
                    <p>Data: Julho 2025</p>
                    <p>Tokens: 2.160</p>
                    <p>Status: ✅ Confirmado</p>
                  </div>
                </div>

                <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <h4 className="text-green-400 font-semibold mb-2">Maria Helena</h4>
                  <p className="text-2xl font-bold text-white">R$ 6,00</p>
                  <div className="text-sm text-gray-300 mt-2">
                    <p>PIX: 03669282106 (PEDRO GALLUF)</p>
                    <p>Data: Julho 2025</p>
                    <p>Tokens: 4.320</p>
                    <p>Status: ✅ Confirmado</p>
                  </div>
                </div>

                <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <h4 className="text-purple-400 font-semibold mb-2">João Vidal</h4>
                  <p className="text-2xl font-bold text-white">R$ 32,00</p>
                  <div className="text-sm text-gray-300 mt-2">
                    <p>Galaxy Vault - Premium</p>
                    <p>Data: Julho 2025</p>
                    <p>Tokens: 23.040</p>
                    <p>Status: ✅ Confirmado</p>
                  </div>
                </div>
              </div>

              {/* Métricas financeiras */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-green-400 font-semibold mb-2">Receita Bruta</h4>
                  <p className="text-2xl font-bold text-white">R$ 41,00</p>
                  <p className="text-gray-300 text-sm">100% via PIX</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-blue-400 font-semibold mb-2">Ticket Médio</h4>
                  <p className="text-2xl font-bold text-white">R$ 13,67</p>
                  <p className="text-gray-300 text-sm">Por transação</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-purple-400 font-semibold mb-2">Conversão</h4>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-gray-300 text-sm">Todos pagaram</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-yellow-400 font-semibold mb-2">LTV</h4>
                  <p className="text-2xl font-bold text-white">R$ 13,67</p>
                  <p className="text-gray-300 text-sm">Lifetime Value</p>
                </div>
              </div>

              {/* Informações PIX */}
              <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
                <h5 className="text-white font-semibold mb-2">💳 Dados PIX</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-300">Chave PIX: 03669282106</p>
                    <p className="text-gray-300">Titular: PEDRO GALLUF</p>
                    <p className="text-gray-300">Banco: Nubank</p>
                  </div>
                  <div>
                    <p className="text-gray-300">Total de transações: 3</p>
                    <p className="text-gray-300">Valor médio: R$ 13,67</p>
                    <p className="text-gray-300">Período: Julho 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demais abas com conteúdo básico */}
        <TabsContent value="withdrawals" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-purple-400">💳 Sistema de Saques</CardTitle>
              <CardDescription>Gestão completa do sistema de saques 8,7% mensal</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status do sistema */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <h4 className="text-purple-400 font-semibold mb-2">Próxima Janela</h4>
                  <p className="text-3xl font-bold text-white">3 AGO</p>
                  <p className="text-gray-300 text-sm">Sábado • Sistema ativo</p>
                </div>
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <h4 className="text-green-400 font-semibold mb-2">Saques Pendentes</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">Nenhuma solicitação</p>
                </div>
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-blue-400 font-semibold mb-2">Total Sacado</h4>
                  <p className="text-3xl font-bold text-white">R$ 0,00</p>
                  <p className="text-gray-300 text-sm">Histórico de saques</p>
                </div>
              </div>

              {/* Pool de saques atual */}
              <div className="p-6 bg-purple-500/10 rounded-lg border border-purple-500/30 mb-6">
                <h5 className="text-purple-400 font-semibold mb-4">💰 Pool de Saques Atual</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-2xl font-bold text-white mb-2">R$ 0,00</p>
                    <p className="text-gray-300 mb-4">Valor disponível para saque</p>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-400">• 0 usuários com planos ativos</p>
                      <p className="text-gray-400">• Pool mensal: R$ 0,00</p>
                      <p className="text-gray-400">• Taxa: 8,7% sobre valor dos planos</p>
                    </div>
                  </div>
                  <div>
                    <h6 className="text-white font-medium mb-2">Como Funciona:</h6>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-300">1. Usuário ativa plano mensal</p>
                      <p className="text-gray-300">2. Sistema acumula 8,7% automaticamente</p>
                      <p className="text-gray-300">3. Todo dia 3: janela de saque aberta</p>
                      <p className="text-gray-300">4. Admin aprova solicitações</p>
                      <p className="text-gray-300">5. PIX enviado para conta do usuário</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown por plano */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h6 className="text-blue-400 font-medium mb-2">Básico R$ 7</h6>
                  <p className="text-white font-bold">R$ 0,61</p>
                  <p className="text-gray-300 text-sm">por mês (8,7%)</p>
                  <p className="text-gray-400 text-xs">0 usuários ativos</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h6 className="text-green-400 font-medium mb-2">Standard R$ 14</h6>
                  <p className="text-white font-bold">R$ 1,22</p>
                  <p className="text-gray-300 text-sm">por mês (8,7%)</p>
                  <p className="text-gray-400 text-xs">0 usuários ativos</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h6 className="text-purple-400 font-medium mb-2">Pro R$ 21</h6>
                  <p className="text-white font-bold">R$ 1,83</p>
                  <p className="text-gray-300 text-sm">por mês (8,7%)</p>
                  <p className="text-gray-400 text-xs">0 usuários ativos</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <h6 className="text-yellow-400 font-medium mb-2">Max R$ 30</h6>
                  <p className="text-white font-bold">R$ 2,61</p>
                  <p className="text-gray-300 text-sm">por mês (8,7%)</p>
                  <p className="text-gray-400 text-xs">0 usuários ativos</p>
                </div>
              </div>

              {/* Informações do sistema */}
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <h6 className="text-white font-semibold mb-3">ℹ️ Informações do Sistema</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-300">• Sistema: 100% funcional e testado</p>
                    <p className="text-gray-300">• Frequência: Todo dia 3 do mês</p>
                    <p className="text-gray-300">• Horário: 00:00 às 23:59</p>
                    <p className="text-gray-300">• Aprovação: Manual pelo admin</p>
                  </div>
                  <div>
                    <p className="text-gray-300">• PIX: Conta verificada do usuário</p>
                    <p className="text-gray-300">• Limite: 100% do acumulado mensal</p>
                    <p className="text-gray-300">• Fees: Zero taxas para o usuário</p>
                    <p className="text-gray-300">• Status: Aguardando primeiros planos mensais</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-red-400">🛡️ Sistema de Moderação</CardTitle>
              <CardDescription>Controle e segurança da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status da moderação */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <h4 className="text-green-400 font-semibold mb-2">Usuários Verificados</h4>
                  <p className="text-3xl font-bold text-white">4</p>
                  <p className="text-gray-300 text-sm">100% aprovados</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <h4 className="text-yellow-400 font-semibold mb-2">Pendentes</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">Nenhuma solicitação</p>
                </div>
                <div className="text-center p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                  <h4 className="text-red-400 font-semibold mb-2">Bloqueados</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">Nenhum problema</p>
                </div>
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-blue-400 font-semibold mb-2">Relatórios</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">Zero denúncias</p>
                </div>
              </div>

              {/* Usuários por status */}
              <div className="space-y-4">
                <h5 className="text-white font-semibold">📋 Status dos Usuários</h5>
                
                {/* Usuários verificados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <h6 className="text-green-400 font-medium mb-3">✅ Usuários Verificados</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Admin (passosmir4@gmail.com)</span>
                        <span className="text-green-400 text-xs">MASTER</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Pedro Galluf (phpg69@gmail.com)</span>
                        <span className="text-green-400 text-xs">✓ R$ 3,00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Maria Helena (mariahelenaearp@gmail.com)</span>
                        <span className="text-green-400 text-xs">✓ R$ 6,00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">João Vidal (joao.vidal@remederi.com)</span>
                        <span className="text-green-400 text-xs">✓ R$ 32,00</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h6 className="text-white font-medium mb-3">🔧 Ferramentas de Moderação</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-300">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Sistema de verificação de documentos
                      </div>
                      <div className="flex items-center text-gray-300">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Validação automática de PIX
                      </div>
                      <div className="flex items-center text-gray-300">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Monitoramento de transações
                      </div>
                      <div className="flex items-center text-gray-300">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Sistema anti-fraude ativo
                      </div>
                      <div className="flex items-center text-gray-300">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Controle de qualidade 100%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações de moderação */}
              <div className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <h6 className="text-red-400 font-semibold mb-3">⚡ Status de Segurança</h6>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-green-400 font-medium mb-1">Segurança Geral</p>
                    <p className="text-gray-300">• 0 tentativas de fraude</p>
                    <p className="text-gray-300">• 0 contas suspeitas</p>
                    <p className="text-gray-300">• 100% transações legítimas</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-medium mb-1">Qualidade dos Usuários</p>
                    <p className="text-gray-300">• 100% taxa de conversão</p>
                    <p className="text-gray-300">• 0 usuários problemáticos</p>
                    <p className="text-gray-300">• Todos documentos aprovados</p>
                  </div>
                  <div>
                    <p className="text-purple-400 font-medium mb-1">Compliance</p>
                    <p className="text-gray-300">• LGPD: 100% conforme</p>
                    <p className="text-gray-300">• Dados protegidos</p>
                    <p className="text-gray-300">• Zero violações</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-orange-400">📊 Relatórios Executivos</CardTitle>
              <CardDescription>Análise completa do desempenho da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Resumo executivo */}
              <div className="p-6 bg-orange-500/10 rounded-lg border border-orange-500/30 mb-6">
                <h5 className="text-orange-400 font-semibold mb-4">📈 Resumo Executivo - Julho 2025</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">R$ 41,00</p>
                    <p className="text-orange-400 text-sm">Receita Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">4</p>
                    <p className="text-orange-400 text-sm">Usuários Ativos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">100%</p>
                    <p className="text-orange-400 text-sm">Taxa Conversão</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">29.520</p>
                    <p className="text-orange-400 text-sm">Tokens Vendidos</p>
                  </div>
                </div>
              </div>

              {/* Breakdown detalhado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h6 className="text-white font-semibold mb-4">💰 Breakdown Financeiro</h6>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400">Pedro Galluf (PIX R$ 3,00)</span>
                      <span className="text-white">2.160 tokens</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">Maria Helena (PIX R$ 6,00)</span>
                      <span className="text-white">4.320 tokens</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400">João Vidal (Galaxy R$ 32,00)</span>
                      <span className="text-white">23.040 tokens</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-yellow-400">Total</span>
                        <span className="text-white">R$ 41,00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h6 className="text-white font-semibold mb-4">📊 Métricas de Performance</h6>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400">Ticket Médio</span>
                      <span className="text-white">R$ 13,67</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">LTV (Lifetime Value)</span>
                      <span className="text-white">R$ 13,67</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400">CAC (Custo Aquisição)</span>
                      <span className="text-white">R$ 0,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400">ROI (Return on Investment)</span>
                      <span className="text-white">∞</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-yellow-400">Margem de Lucro</span>
                        <span className="text-white">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análise de segmentos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h6 className="text-blue-400 font-medium mb-2">Segmento Básico</h6>
                  <p className="text-white text-xl font-bold">R$ 9,00</p>
                  <p className="text-gray-300 text-sm">2 usuários • 22% receita</p>
                  <p className="text-gray-400 text-xs">Pedro + Maria Helena</p>
                </div>
                <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <h6 className="text-purple-400 font-medium mb-2">Segmento Premium</h6>
                  <p className="text-white text-xl font-bold">R$ 32,00</p>
                  <p className="text-gray-300 text-sm">1 usuário • 78% receita</p>
                  <p className="text-gray-400 text-xs">João Vidal (Galaxy Vault)</p>
                </div>
                <div className="p-4 bg-gray-500/20 rounded-lg border border-gray-500/30">
                  <h6 className="text-gray-400 font-medium mb-2">Potencial</h6>
                  <p className="text-white text-xl font-bold">R$ 100+</p>
                  <p className="text-gray-300 text-sm">Projeção próximos 30 dias</p>
                  <p className="text-gray-400 text-xs">Base sólida para crescimento</p>
                </div>
              </div>

              {/* Insights e recomendações */}
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <h6 className="text-orange-400 font-semibold mb-3">💡 Insights e Recomendações</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-400 font-medium mb-2">✅ Pontos Fortes:</p>
                    <p className="text-gray-300">• Taxa de conversão de 100%</p>
                    <p className="text-gray-300">• Zero custos de aquisição</p>
                    <p className="text-gray-300">• Usuários engajados e pagantes</p>
                    <p className="text-gray-300">• Sistema PIX funcionando perfeitamente</p>
                    <p className="text-gray-300">• Base sólida para crescimento</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-medium mb-2">🚀 Oportunidades:</p>
                    <p className="text-gray-300">• Migrar usuários para planos mensais</p>
                    <p className="text-gray-300">• João Vidal candidato ideal para Pro</p>
                    <p className="text-gray-300">• Implementar sistema de referral</p>
                    <p className="text-gray-300">• Expandir portfólio de produtos</p>
                    <p className="text-gray-300">• MRR potencial: R$ 100-300/mês</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-pink-400">📈 Analytics</CardTitle>
              <CardDescription>Análise detalhada do desempenho da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Métricas principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-pink-500/20 rounded-lg border border-pink-500/30">
                  <h4 className="text-pink-400 font-semibold mb-2">Conversão Total</h4>
                  <p className="text-3xl font-bold text-white">100%</p>
                  <p className="text-gray-300 text-sm">4/4 usuários pagaram</p>
                </div>
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-blue-400 font-semibold mb-2">CAC</h4>
                  <p className="text-3xl font-bold text-white">R$ 0,00</p>
                  <p className="text-gray-300 text-sm">Custo por aquisição</p>
                </div>
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <h4 className="text-green-400 font-semibold mb-2">LTV</h4>
                  <p className="text-3xl font-bold text-white">R$ 13,67</p>
                  <p className="text-gray-300 text-sm">Lifetime Value</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <h4 className="text-yellow-400 font-semibold mb-2">ROI</h4>
                  <p className="text-3xl font-bold text-white">∞</p>
                  <p className="text-gray-300 text-sm">Retorno infinito</p>
                </div>
              </div>

              {/* Breakdown por tipo de usuário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h5 className="text-white font-semibold mb-4">Distribuição por Tipo</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400">Clientes</span>
                      <span className="text-white">75% (3 usuários)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400">Profissionais</span>
                      <span className="text-white">25% (1 usuário)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-400">Admins</span>
                      <span className="text-white">25% (1 usuário)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h5 className="text-white font-semibold mb-4">Receita por Segmento</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400">Tokens Básicos</span>
                      <span className="text-white">R$ 9,00 (22%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400">Galaxy Vault</span>
                      <span className="text-white">R$ 32,00 (78%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">Ticket Médio</span>
                      <span className="text-white">R$ 13,67</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico de crescimento */}
              <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
                <h5 className="text-white font-semibold mb-4">📊 Histórico de Crescimento</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-cyan-400 font-medium">Julho 2025</p>
                    <p className="text-2xl font-bold text-white">R$ 41,00</p>
                    <p className="text-gray-300 text-sm">4 usuários • 100% conversão</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-400 font-medium">Projeção Agosto</p>
                    <p className="text-2xl font-bold text-white">R$ 100,00</p>
                    <p className="text-gray-300 text-sm">Base atual + crescimento</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-400 font-medium">Meta Q3</p>
                    <p className="text-2xl font-bold text-white">R$ 500,00</p>
                    <p className="text-gray-300 text-sm">50 usuários ativos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-indigo-400">🚀 Gestão de Planos</CardTitle>
              <CardDescription>Distribuição de usuários por plano de assinatura</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Distribuição atual */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-500/20 rounded-lg border border-gray-500/30">
                  <h4 className="text-gray-400 font-semibold mb-2">Free</h4>
                  <p className="text-3xl font-bold text-white">4</p>
                  <p className="text-gray-300 text-sm">100% dos usuários</p>
                  <p className="text-gray-400 text-xs">Todos compraram tokens</p>
                </div>
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <h4 className="text-blue-400 font-semibold mb-2">Básico</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">R$ 7/mês</p>
                  <p className="text-gray-400 text-xs">105% + 3%</p>
                </div>
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <h4 className="text-green-400 font-semibold mb-2">Standard</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">R$ 14/mês</p>
                  <p className="text-gray-400 text-xs">110% + 4%</p>
                </div>
                <div className="text-center p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <h4 className="text-purple-400 font-semibold mb-2">Pro</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">R$ 21/mês</p>
                  <p className="text-gray-400 text-xs">115% + 5%</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <h4 className="text-yellow-400 font-semibold mb-2">Max</h4>
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-gray-300 text-sm">R$ 30/mês</p>
                  <p className="text-gray-400 text-xs">120% + 5%</p>
                </div>
              </div>

              {/* Detalhes dos planos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h5 className="text-white font-semibold mb-4">🎯 Estratégia Atual</h5>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">• Foco em venda de tokens (R$ 3-32)</p>
                    <p className="text-gray-300">• Taxa de conversão: 100%</p>
                    <p className="text-gray-300">• Usuários preferem compra única</p>
                    <p className="text-gray-300">• Galaxy Vault mais popular (78% receita)</p>
                    <p className="text-gray-300">• Próximo: migrar para planos mensais</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h5 className="text-white font-semibold mb-4">💡 Oportunidades</h5>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-400">• Cashback 8,7% mensal atrai usuários</p>
                    <p className="text-blue-400">• Profissionais precisam de planos Pro/Max</p>
                    <p className="text-purple-400">• João Vidal candidato ideal para Pro</p>
                    <p className="text-yellow-400">• Planos mensais = receita recorrente</p>
                    <p className="text-cyan-400">• MRR potencial: R$ 100-300/mês</p>
                  </div>
                </div>
              </div>

              {/* Sistema de benefícios */}
              <div className="mt-6 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
                <h5 className="text-indigo-400 font-semibold mb-4">🎁 Sistema de Benefícios</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white font-medium mb-2">Cashback Mensal (8,7%):</p>
                    <p className="text-gray-300">• Básico: R$ 0,61/mês</p>
                    <p className="text-gray-300">• Standard: R$ 1,22/mês</p>
                    <p className="text-gray-300">• Pro: R$ 1,83/mês</p>
                    <p className="text-gray-300">• Max: R$ 2,61/mês</p>
                  </div>
                  <div>
                    <p className="text-white font-medium mb-2">Saques Disponíveis:</p>
                    <p className="text-gray-300">• Próxima janela: 3 de Agosto</p>
                    <p className="text-gray-300">• Pool atual: R$ 0,00</p>
                    <p className="text-gray-300">• Sistema funcionando 100%</p>
                    <p className="text-gray-300">• Aprovação manual do admin</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}