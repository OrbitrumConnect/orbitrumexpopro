import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, FileText } from "lucide-react";
import { Users, Activity, DollarSign, Calendar, Eye, UserCheck, UserX, Clock, PiggyBank, Home, Bell, MessageCircle, Send, AlertTriangle, Database, Wallet, Shield, Ban, AlertCircle, Camera, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { RealTimeMonitor } from "@/components/admin/real-time-monitor";
import { DataSourcesTab } from "@/components/admin/data-sources-tab";
import ReportDownloads from "@/components/admin/ReportDownloads";
import { ReferralTab } from "@/components/admin/ReferralTab";
import AIAutoChatSystem from "@/components/AIAutoChatSystem";
import AICommanderNotifications from "@/components/AICommanderNotifications";
import MobileTelegramOptimizer from '@/components/MobileTelegramOptimizer';

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

interface WithdrawalRequest {
  id: number;
  userId: number;
  username: string;
  amount: number;
  pixKey: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  plan: string;
  availableBalance: number;
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [chatMessage, setChatMessage] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user: authUser } = useAuth();
  
  // Proteção - não renderizar nada se não estiver autenticado
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
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [moderationAction, setModerationAction] = useState({ type: '', userId: 0, reason: '', duration: 24 });
  const [selectedModerationUser, setSelectedModerationUser] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [selectedBanReason, setSelectedBanReason] = useState('');
  const [customBanReason, setCustomBanReason] = useState('');
  const [banDuration, setBanDuration] = useState(24);
  const [banType, setBanType] = useState('temporary');
  
  // Estados para crédito manual de tokens
  const [creditTokensData, setCreditTokensData] = useState({
    userId: '',
    amount: '',
    description: ''
  });

  // Verificar se o usuário tem permissão de admin
  useEffect(() => {
    console.log('🔍 AdminDashboard: Verificando permissões...', { isAuthenticated, authUser });
    
    if (!isAuthenticated) {
      console.log('❌ AdminDashboard: Usuário não autenticado, redirecionando...');
      setLocation('/');
      return;
    }
    
    if (authUser?.email !== 'passosmir4@gmail.com') {
      console.log('❌ AdminDashboard: Usuário sem permissão admin, redirecionando...', { email: authUser?.email });
      setLocation('/');
      return;
    }
    
    console.log('✅ AdminDashboard: Usuário admin autorizado');
  }, [isAuthenticated, authUser, setLocation]);

  // Atualizar horário em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // Paginação
  const usersPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Queries sem cache - sempre dados frescos
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: 3,
    staleTime: 0, // Sem cache - sempre buscar dados atualizados
    gcTime: 0, // Não manter cache
  });

  // Query para carteira administrativa separada
  const { data: adminWallet, isLoading: adminWalletLoading, refetch: refetchAdminWallet } = useQuery({
    queryKey: ["/api/admin/wallet"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Query para distribuição de planos
  const { data: planDistribution, isLoading: planDistributionLoading, refetch: refetchPlanDistribution } = useQuery({
    queryKey: ["/api/admin/plan-distribution"],
    enabled: selectedTab === 'plans',
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  });

  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      user: "Carlos Silva",
      message: "Como faço para sacar meus créditos?",
      response: "Os saques acontecem no dia 3 de cada mês. Você pode solicitar até 8.7% do seu saldo acumulado. A janela de saque fica aberta por 24 horas.",
      timestamp: "2025-07-16 14:30",
      status: "resolved"
    },
    {
      id: 2,
      user: "Ana Santos",
      message: "Qual a diferença entre os planos?",
      response: "Temos 4 planos: Básico (R$7), Standard (R$14), Pro (R$21) e Max (R$30). Cada plano oferece diferentes benefícios de cashback e tokens para uso na plataforma.",
      timestamp: "2025-07-16 15:45",
      status: "resolved"
    }
  ]);

  // Gerar notificações dinâmicas baseadas nos dados reais da API
  const notifications = stats ? [
    {
      id: 1,
      type: "info",
      message: "Sistema operando com dados reais via Supabase Auth",
      time: "há 5 minutos",
      urgent: false
    },
    {
      id: 2,
      type: "user",
      message: `${(stats as any)?.totalUsers || 0} usuários registrados na plataforma`,
      time: "há 15 minutos",
      urgent: false
    },
    {
      id: 3,
      type: "system",
              message: `Pool de saques configurada: R$ ${(stats as any)?.withdrawalPool?.totalAccumulated?.toFixed(2).replace('.', ',') || '0,00'}`,
      time: "há 30 minutos",
      urgent: false
    }
  ] : [
    {
      id: 1,
      type: "info",
      message: "Carregando dados do sistema...",
      time: "agora",
      urgent: false
    }
  ];

  const { data: withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/admin/withdrawals"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Removido console.log para evitar spam de logs

  const { data: users, isLoading: usersLoading, refetch: refetchUsers, error: usersError } = useQuery({
    queryKey: ["/api/admin/users", currentPage, usersPerPage],
    queryFn: async () => {
      console.log(`🔍 FAZENDO REQUISIÇÃO: /api/admin/users?page=${currentPage}&limit=${usersPerPage}`);
      const response = await fetch(`/api/admin/users?page=${currentPage}&limit=${usersPerPage}`);
      
      if (!response.ok) {
        console.error('❌ ERRO NA RESPOSTA:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('👥 USUÁRIOS RECEBIDOS NO FRONTEND:', data);
      console.log('👥 É ARRAY?', Array.isArray(data));
      console.log('👥 COMPRIMENTO:', data?.length);
      return data;
    },
    enabled: selectedTab === 'users', // Só executa quando a aba de usuários está selecionada
    retry: 1,
    staleTime: 5000,
  });

  // Debug dos usuários recebidos
  useEffect(() => {
    if (users) {
      console.log('👥 USUÁRIOS PROCESSADOS:', users);
      console.log('👥 TOTAL DE USUÁRIOS:', users.length);
    }
    if (usersError) {
      console.error('❌ ERRO AO CARREGAR USUÁRIOS:', usersError);
    }
  }, [users, usersError]);

  // Buscar atividades suspeitas
  const {
    data: suspiciousUsers,
    isLoading: suspiciousLoading,
    error: suspiciousError,
    refetch: refetchSuspicious
  } = useQuery({
    queryKey: ['/api/admin/suspicious-users'],
    enabled: selectedTab === 'moderation',
    staleTime: 30000
  });

  // Mutation to ban users
  const banishmentMutation = useMutation({
    mutationFn: async (banData: any) => {
      const response = await apiRequest("POST", "/api/admin/ban-user", banData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suspicious-users'] });
      toast({
        title: "Usuário Moderado",
        description: "Ação disciplinar aplicada com sucesso",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Erro ao banir usuário:', error);
      toast({
        title: "Erro na Moderação",
        description: "Não foi possível aplicar a ação disciplinar",
        variant: "destructive"
      });
    }
  });

  // Query para compras sem auto-refresh
  const { data: purchases, isLoading: purchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ["/api/admin/purchases"],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Query para documentos pendentes sem auto-refresh
  const { data: pendingDocuments, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ["/api/admin/pending-documents"],
    enabled: selectedTab === 'documents',
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Mutation para aprovar/rejeitar documentos
  const documentApprovalMutation = useMutation({
    mutationFn: async (approvalData: { userId: number; action: 'approve' | 'reject'; notes?: string }) => {
      const response = await apiRequest("POST", "/api/admin/review-documents", approvalData);
      return response.json();
    },
    onSuccess: () => {
      refetchDocuments();
      refetchUsers();
      toast({
        title: "Documentos Processados",
        description: "Verificação de documentos atualizada com sucesso",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Erro ao processar documentos:', error);
      toast({
        title: "Erro na Verificação",
        description: "Não foi possível processar os documentos",
        variant: "destructive"
      });
    }
  });

  // Mutation para creditar tokens manualmente
  const creditTokensMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: string; description: string }) => {
      return apiRequest('/api/admin/creditar-tokens', 'POST', JSON.stringify({
        userId: data.userId,
        amount: parseInt(data.amount),
        description: data.description
      }));
    },
    onSuccess: (response) => {
      toast({
        title: "Tokens creditados",
        description: `${(response as any).message}`,
        variant: "default"
      });
      setCreditTokensData({ userId: '', amount: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao creditar tokens",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Função para atualizar todos os dados manualmente
  const handleRefreshAll = async () => {
    console.log('🔄 Atualizando todos os dados...');
    await Promise.all([
      refetchStats(),
      refetchWithdrawals(),
      refetchUsers(),
      refetchPurchases(),
      refetchSuspicious(),
      refetchDocuments(),
      refetchAdminWallet(),
      refetchPlanDistribution()
    ]);
    console.log('✅ Dados atualizados com sucesso!');
  };

  // Função para banir usuário
  const handleBanUser = async (userId: number, reason: string, type: 'temporary' | 'permanent', duration?: number) => {
    try {
      await banishmentMutation.mutateAsync({
        userId,
        reason,
        type,
        duration
      });
      
      // Fechar modal após sucesso
      setShowModerationModal(false);
      setSelectedModerationUser(null);
      setSelectedBanReason('');
      setCustomBanReason('');
      
      console.log(`✅ Usuário ${userId} ${type === 'permanent' ? 'banido' : 'suspenso'} com sucesso`);
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
    }
  };

  // Regras de banimento baseadas no documento enviado
  const banishmentRules = [
    {
      id: 1,
      category: "🚫 Fraude financeira e abuso do sistema de tokens",
      severity: "Banimento automático e permanente",
      rules: [
        "Criação de múltiplas contas para gerar cashback falso",
        "Tentativas de burlar regras de saque ou cashback da plataforma",
        "Solicitações de Pix simuladas sem serviço real",
        "Uso de bots para farmar tokens ou benefícios"
      ],
      action: "permanent"
    },
    {
      id: 2,
      category: "🎭 Falsificação de identidade",
      severity: "Banimento após verificação",
      rules: [
        "Enviar documentos falsos no cadastro profissional",
        "Usar foto de outra pessoa ou identidade forjada",
        "Enganar usuários se passando por outro profissional"
      ],
      action: "permanent"
    },
    {
      id: 3,
      category: "⚠️ Atendimento abusivo ou perigoso",
      severity: "Banimento com avaliação humana",
      rules: [
        "Ameaças, assédio ou comportamento ofensivo durante o atendimento",
        "Uso do app para marcar encontros perigosos ou atividades ilegais",
        "Denúncias verificadas de comportamento antiético"
      ],
      action: "permanent"
    },
    {
      id: 4,
      category: "🤖 Uso indevido da IA do cérebro central",
      severity: "Suspensão temporária ou permanente",
      rules: [
        "Usar a IA para fazer pedidos criminosos ou conteúdos proibidos",
        "Tentativas de contornar limites do sistema com engenharia reversa",
        "Spam ou sobrecarga intencional da IA"
      ],
      action: "temporary"
    },
    {
      id: 5,
      category: "🎮 Violação das regras de jogo ou gamificação",
      severity: "Suspensão do sistema de tokens e banimento parcial",
      rules: [
        "Manipular partidas para ganhar pontos com facilidade",
        "Forçar derrotas ou criar contas para auto-farm",
        "Desistir propositalmente para manipular rankings"
      ],
      action: "temporary"
    },
    {
      id: 6,
      category: "💬 Ofensas dentro do app",
      severity: "Moderação + suspensão",
      rules: [
        "Discurso de ódio, racismo, machismo, homofobia, xenofobia",
        "Linguagem ofensiva contra qualquer membro da comunidade",
        "Ataques a outros usuários, profissionais ou à equipe Orbitrum"
      ],
      action: "temporary"
    },
    {
      id: 7,
      category: "🔄 Venda ou repasse de contas",
      severity: "Banimento permanente",
      rules: [
        "Transferir conta para outra pessoa",
        "Vender perfis com reputação alta",
        "Compartilhar login com terceiros"
      ],
      action: "permanent"
    },
    {
      id: 8,
      category: "💳 Violação das políticas de planos pagos",
      severity: "Suspensão do plano e possível bloqueio",
      rules: [
        "Usar plano pago para terceiros (conta familiar não autorizada)",
        "Solicitar reembolso fraudulento",
        "Disputas de Pix falsas ou forjadas"
      ],
      action: "temporary"
    },
    {
      id: 9,
      category: "🔍 Recusa em colaborar com verificação manual",
      severity: "Suspensão temporária",
      rules: [
        "Não colaborar quando a conta cair em verificação",
        "Recusar fornecimento de documentos solicitados",
        "Ignorar solicitações de esclarecimento"
      ],
      action: "temporary"
    },
    {
      id: 10,
      category: "⚡ Atos extremos",
      severity: "Banimento total + denúncia às autoridades",
      rules: [
        "Pedofilia, tráfico, terrorismo, planos ilegais via chat",
        "Tentativas de hack ou ataque ao sistema do Orbitrum",
        "Atividades criminosas documentadas"
      ],
      action: "permanent"
    }
  ];

  // Função para aplicar banimento (removida duplicata - usando a implementação do mutation acima)

  // Função para aplicar banimento automático
  const handleAutoBan = async (userId: number, ruleId: number) => {
    const rule = banishmentRules.find(r => r.id === ruleId);
    if (!rule) return;

    const reason = `Violação automática: ${rule.category}`;
    const type = rule.action;
    
    // Usar a mutation em vez da função duplicada
    await banishmentMutation.mutateAsync({
      userId,
      reason,
      type,
      duration: type === 'temporary' ? 168 : undefined
    });
  };

  // Verificar acesso antes de renderizar
  if (!isAuthenticated || authUser?.email !== 'passosmir4@gmail.com') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto glassmorphism">
          <CardHeader className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-400">Acesso Negado</CardTitle>
            <CardDescription>
              Esta área é restrita ao administrador master.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="neon-button">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Orbit
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Usar APENAS dados reais da API - sem fallback mock
  const currentStats = stats || {
    totalUsers: 0,
    activeUsers: 0,
    offlineUsers: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    totalWithdrawals: 0,
    monthlyStats: {
      newUsers: 0,
      revenue: 0,
      withdrawals: 0
    }
  };
  const currentWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];

  // Função removida - usava mockStats

  const handleWithdrawalAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await apiRequest('POST', `/api/admin/withdrawals/${id}/${action}`, {});
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Erro ao processar saque:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <MobileTelegramOptimizer />
      
      {/* Header Mobile Optimizado */}
      <div className="border-b border-gray-800 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto px-2 py-2 max-w-md sm:max-w-2xl lg:max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="flex gap-1">
                <Link href="/">
                  <button className="glassmorphism px-1.5 py-1 text-[10px] rounded-full hover:bg-white/10 transition-colors border border-cyan-500/30 shadow-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 scale-75 sm:scale-100">
                    <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span className="hidden sm:inline ml-1">Orbit</span>
                  </button>
                </Link>
                <Link href="/dashboard-selector">
                  <button className="glassmorphism px-1.5 py-1 text-[10px] rounded-full hover:bg-white/10 transition-colors border border-green-500/30 shadow-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 scale-75 sm:scale-100">
                    <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span className="hidden sm:inline ml-1">Dash</span>
                  </button>
                </Link>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-cyan-400 truncate">Admin Dashboard</h1>
                <p className="text-gray-400 text-[10px] sm:text-sm truncate">Painel de Controle</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                Ativo
              </div>
              
              {/* Botão de atualização compacto */}
              <button
                onClick={handleRefreshAll}
                disabled={statsLoading || withdrawalsLoading || usersLoading}
                className="glassmorphism flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 disabled:from-gray-600/20 disabled:to-gray-700/20 disabled:cursor-not-allowed text-cyan-400 hover:text-cyan-300 rounded-full transition-all duration-200 text-[10px] sm:text-sm font-semibold shadow-lg border border-cyan-400/30 scale-75 sm:scale-100"
              >
                <svg 
                  className={`w-3 h-3 ${statsLoading || withdrawalsLoading || usersLoading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                <span className="hidden sm:inline">
                  {statsLoading || withdrawalsLoading || usersLoading ? 'Sync...' : 'Sync'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-2 py-3 max-w-md sm:max-w-2xl lg:max-w-4xl">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-4 gap-0.5 p-0.5 bg-black/30 h-auto min-h-[28px] w-full sm:flex sm:flex-wrap sm:justify-center">
            <TabsTrigger value="overview" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Usuários</span>
              <span className="sm:hidden">👥</span>
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Tokens</span>
              <span className="sm:hidden">🪙</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Financeiro</span>
              <span className="sm:hidden">💰</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Saques</span>
              <span className="sm:hidden">💳</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Moderação</span>
              <span className="sm:hidden">🛡️</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Relatórios</span>
              <span className="sm:hidden">📋</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">📈</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex-shrink-0 text-[9px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1.5 h-6 sm:h-8 whitespace-nowrap scale-75 sm:scale-100">
              <span className="hidden sm:inline">Planos</span>
              <span className="sm:hidden">🚀</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 sm:space-y-6">
            {/* Header da Visão Geral compacto */}
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <div>
                <h2 className="text-sm sm:text-xl font-bold text-white">Visão Geral</h2>
                <p className="text-gray-400 text-xs sm:text-sm">Dados em tempo real</p>
              </div>
            </div>

            {/* Stats Cards - Grid Mobile Otimizado - TEMPORARILY DISABLED */}
            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-2xl font-bold text-white">0</div>
                  <p className="text-[9px] sm:text-xs text-green-400">+0 mês</p>
                </div>
              </div>

              <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-2xl font-bold text-green-400">0</div>
                  <p className="text-[9px] sm:text-xs text-gray-400">Online</p>
                </div>
              </div>

              <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-2xl font-bold text-red-400">0</div>
                  <p className="text-[9px] sm:text-xs text-gray-400">Inativos</p>
                </div>
              </div>

              <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm sm:text-2xl font-bold text-yellow-400">R$ 0,00</div>
                  <p className="text-[9px] sm:text-xs text-green-400">+R$ 0,00 mês</p>
                </div>
              </div>
            </div> */}

            {/* Caixa em Tempo Real - Mobile Optimizado */}
            <Card className="bg-black/30 border-gray-700 sm:bg-gradient-to-br sm:from-blue-900/30 sm:via-slate-800 sm:to-black/50 sm:border-blue-500/30">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg font-bold text-yellow-400">💰 Caixa - Tempo Real</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Depósitos e pagamentos</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 sm:pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-3xl font-bold text-green-400">
                      R$ 0,00
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-400">Total Caixa</p>
                    <p className="text-[9px] sm:text-xs text-green-400">Depósitos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">
                      R$ 0,00
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-400">Líquido</p>
                    <p className="text-[9px] sm:text-xs text-blue-400">Pós-saques</p>
                  </div>
                  <div className="text-center col-span-2 sm:col-span-1">
                    <div className="text-lg sm:text-2xl font-bold text-orange-400">
                      0
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-400">Clientes Ativos</p>
                    <p className="text-[9px] sm:text-xs text-orange-400">Receita</p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between items-center text-[10px] sm:text-sm">
                    <span className="text-gray-400">Atualização:</span>
                    <span className="text-cyan-400">Agora</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carteira Administrativa (Plano Max) */}
            {adminWallet && (
              <Card className="bg-black/30 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-cyan-400">🎮 Carteira Administrativa (Plano Max)</CardTitle>
                  <CardDescription>Tokens para testes e configuração do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400">
                        {((adminWallet as any).saldoTotal || 10000).toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-400">Tokens Disponíveis</p>
                      <p className="text-xs text-cyan-400">Recarga semanal</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">
                        {((adminWallet as any).utilizacaoSemana || 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-400">Utilizados esta semana</p>
                      <p className="text-xs text-cyan-400">Para testes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {(adminWallet as any).proximaRecarga || 'Domingo'}
                      </div>
                      <p className="text-sm text-gray-400">Próxima recarga</p>
                      <p className="text-xs text-green-400">Automática</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-cyan-900/20 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-cyan-400">🔄 Recarga automática ativa</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-gray-400">Finalidade:</span>
                      <span className="text-cyan-400">🎮 Apenas jogos e testes</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                    <div className="flex items-center gap-2 text-sm text-red-300">
                      <span className="text-red-400">⚠️</span>
                      <span>LIMITAÇÃO: Não válido para serviços profissionais</span>
                    </div>
                    <div className="text-xs text-red-400 mt-1">
                      Para contratar serviços, use dinheiro real através dos planos pagos
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Withdrawal Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Saques Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-400">{currentStats.pendingWithdrawals}</div>
                  <p className="text-xs text-gray-400">Aguardando aprovação</p>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Sacado</CardTitle>
                  <PiggyBank className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">R$ {(currentStats.totalWithdrawals || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-gray-400">Cashback pago</p>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Próxima Janela</CardTitle>
                  <Calendar className="h-4 w-4 text-cyan-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-400">3 AGO</div>
                  <p className="text-xs text-gray-400">Próximo dia de saque</p>
                </CardContent>
              </Card>
            </div>

            {/* Sistema de Permissões Administrativas */}
            <Card className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-500/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-400 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sistema de Permissões Admin
                </CardTitle>
                <CardDescription>Acesso total baseado em permissões especiais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-400/30">
                    <div className="text-2xl font-bold text-orange-400">∞</div>
                    <p className="text-xs text-gray-400">Acesso Total</p>
                    <p className="text-xs text-orange-300">Sem limitações</p>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-400/30">
                    <div className="text-xl font-bold text-red-400">Completo</div>
                    <p className="text-xs text-gray-400">Controle Sistema</p>
                    <p className="text-xs text-red-300">Todas funções</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-400/30">
                    <div className="text-xl font-bold text-yellow-400">Global</div>
                    <p className="text-xs text-gray-400">Permissões</p>
                    <p className="text-xs text-yellow-300">Sem restrições</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-400/30">
                    <div className="text-xl font-bold text-green-400">Ativo</div>
                    <p className="text-xs text-gray-400">Status Sistema</p>
                    <p className="text-xs text-green-300">Operacional</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tipo de Acesso:</span>
                      <span className="text-orange-400">Permissões Administrativas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sistema de Tokens:</span>
                      <span className="text-red-400">Não Aplicável</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Controle de Recursos:</span>
                      <span className="text-green-400">Acesso Irrestrito</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pool de Saques 8.7% */}
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-cyan-400">Pool de Saques - Sistema 8.7%</CardTitle>
                <CardDescription>Controle financeiro do cashback mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                                                R$ {(((currentStats as any).withdrawalPool?.totalAccumulated || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-400">Pool Mensal (8.7%)</p>
                    <p className="text-xs text-gray-500">{currentStats.withdrawalPool?.totalActiveUsers || 0} usuários elegíveis</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                                                R$ {(((currentStats as any).withdrawalPool?.monthlyLimit || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-400">Disponível Dia 3</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                                                R$ {(((currentStats as any).withdrawalPool?.currentMonthUsed || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-400">Utilizado Este Mês</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      R$ {(((currentStats as any).withdrawalPool?.remainingThisMonth || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-400">Restante Disponível</p>
                  </div>
                </div>
                <div className="mt-4 bg-gray-800 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, currentStats.withdrawalPool?.utilizationRate || 0))}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-400 mt-2">
                  Utilização: 4.7% do limite mensal
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Solicitações de Saque</CardTitle>
                <CardDescription className="text-gray-400">
                  Sistema: 8,7% mensal + Janela fixa no dia 3 de cada mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{withdrawal.username}</span>
                          <Badge variant="outline" className="text-xs">
                            {withdrawal.plan}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                                            Solicita: R$ {(withdrawal.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} •
                  Disponível: R$ {(withdrawal.availableBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500">
                          PIX: {withdrawal.pixKey} • {new Date(withdrawal.requestDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {withdrawal.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                            >
                              Rejeitar
                            </Button>
                          </>
                        ) : (
                          <Badge 
                            variant={withdrawal.status === 'approved' ? 'default' : 'destructive'}
                            className={withdrawal.status === 'approved' ? 'bg-green-600' : ''}
                          >
                            {withdrawal.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-3 sm:space-y-6">
            {/* Banner de Cashback - Mobile Otimizado */}
            <Card className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 border-orange-500/30">
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm sm:text-xl">💰</span>
                    </div>
                    <div>
                      <h3 className="text-orange-200 font-semibold text-xs sm:text-sm">Cashback - Dia 3</h3>
                      <p className="text-orange-300/80 text-[10px] sm:text-sm">
                        {(() => {
                          // Calcular total de usuários com cashback devido
                          const usuariosComCashback = users?.filter((u: any) => (u.tokensPlanos || 0) > 0) || [];
                          const totalCashback = usuariosComCashback.reduce((acc: number, u: any) => 
                            acc + ((u.tokensPlanos || 0) * 0.087), 0
                          );
                          const valorReais = (totalCashback / 1000).toFixed(2);
                          return `${usuariosComCashback.length} usuários • R$ ${valorReais}`;
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-200 text-[9px] sm:text-xs">Borda laranja: ✅ PIX ok</div>
                    <div className="text-red-300 text-[9px] sm:text-xs">Borda vermelha: ⚠️ Sem PIX</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-xl text-cyan-400">Gestão de Usuários</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Controle total de usuários</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 sm:pb-6">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="space-y-4">
                    {/* Header com informações da página */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-400">
                        Página {currentPage} • {users.length} usuários exibidos
                      </div>
                      <div className="text-sm text-cyan-400">
                        Total: {stats?.totalUsers || 0} usuários reais
                      </div>
                    </div>

                    {/* Grid ultra-compacto para mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                      {users.map((user: any) => {
                        // Calcular cashback para destacar visualmente usuários com cashback devido
                        const tokensPlanos = user.tokensPlanos || 0;
                        const cashbackDevido = tokensPlanos * 0.087;
                        const hasCashback = cashbackDevido > 0;
                        
                        return (
                        <Card key={user.id} className={`bg-gray-900/50 transition-all ${
                          hasCashback && user.pixKey 
                            ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' 
                            : hasCashback && !user.pixKey
                            ? 'border-red-500/50 shadow-lg shadow-red-500/10'
                            : 'border-gray-700'
                        }`}>
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex items-start justify-between mb-1 sm:mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white text-xs sm:text-sm truncate">{user.username}</h3>
                                <p className="text-[10px] sm:text-xs text-gray-400 truncate">{user.email}</p>
                              </div>
                              <Badge variant="outline" className={`text-[9px] sm:text-xs ml-1 scale-75 sm:scale-100 ${
                                user.plan === 'max' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                user.plan === 'pro' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                user.plan === 'standard' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                user.plan === 'basic' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                              }`}>
                                {user.plan || 'free'}
                              </Badge>
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">ID:</span>
                                <span className="text-white">{user.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Tokens:</span>
                                <span className="text-cyan-400">{(user.tokens || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Tipo:</span>
                                <span className="text-white text-[9px] sm:text-xs">{user.userType || 'client'}</span>
                              </div>
                              {/* Cálculo automático do Cashback compacto */}
                              <div className="flex justify-between pt-0.5 sm:pt-1 border-t border-gray-600/50">
                                <span className="text-orange-400 font-medium text-[9px] sm:text-xs">💰</span>
                                <span className="text-orange-400 font-medium text-[9px] sm:text-xs">
                                  {(() => {
                                    // Calcular 8,7% dos créditos de planos mensais apenas
                                    const tokensPlanos = user.tokensPlanos || 0;
                                    const cashbackDevido = tokensPlanos * 0.087;
                                    const valorReais = (cashbackDevido / 1000).toFixed(2);
                                    return `R$ ${valorReais}`;
                                  })()}
                                </span>
                              </div>
                              {user.pixKey ? (
                                <div className="flex justify-between">
                                  <span className="text-gray-400 text-[9px] sm:text-xs">🔑</span>
                                  <span className="text-green-400 truncate font-mono text-[8px] sm:text-xs">{user.pixKey.substring(0, 12)}...</span>
                                </div>
                              ) : (
                                <div className="flex justify-between">
                                  <span className="text-gray-400 text-[9px] sm:text-xs">🔑</span>
                                  <span className="text-red-400 text-[8px] sm:text-xs">Sem PIX</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>

                    {/* Controles de paginação */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="bg-gray-800 border-gray-600 hover:bg-gray-700"
                      >
                        ← Anterior
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {/* Números das páginas */}
                        {Array.from({ length: Math.min(5, Math.ceil((stats?.totalUsers || 0) / usersPerPage)) }, (_, i) => {
                          const pageNum = Math.max(1, currentPage - 2) + i;
                          const maxPages = Math.ceil((stats?.totalUsers || 0) / usersPerPage);
                          if (pageNum <= maxPages) {
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 p-0 ${
                                  pageNum === currentPage 
                                    ? 'bg-cyan-600 hover:bg-cyan-700' 
                                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={users.length < usersPerPage || currentPage >= Math.ceil((stats?.totalUsers || 0) / usersPerPage)}
                        className="bg-gray-800 border-gray-600 hover:bg-gray-700"
                      >
                        Próxima →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Nenhum usuário encontrado</p>
                      <p className="text-sm mt-2">Verifique os logs do servidor para mais detalhes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-black/30 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Verificação de Documentos
                </CardTitle>
                <CardDescription>
                  Análise e aprovação de documentos enviados pelos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p>Carregando documentos pendentes...</p>
                      </div>
                    </div>
                  ) : (pendingDocuments as any[]) && (pendingDocuments as any[]).length > 0 ? (
                    (pendingDocuments as any[]).map((doc: any) => (
                      <div key={doc.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white">{doc.username}</span>
                              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                                {doc.email}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-400 mb-3">
                              <p>Enviado em: {new Date(doc.submittedAt).toLocaleString('pt-BR')}</p>
                              <p>Status: <span className="text-yellow-400">Aguardando Revisão</span></p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                              <div className="bg-gray-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                  <Camera className="h-4 w-4" />
                                  <span className="text-sm font-medium">Selfie</span>
                                </div>
                                <p className="text-xs text-gray-400">Selfie com documento</p>
                              </div>
                              <div className="bg-gray-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm font-medium">Documento</span>
                                </div>
                                <p className="text-xs text-gray-400">RG/CNH frente e verso</p>
                              </div>
                              <div className="bg-gray-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                  <Home className="h-4 w-4" />
                                  <span className="text-sm font-medium">Residência</span>
                                </div>
                                <p className="text-xs text-gray-400">Comprovante de endereço</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => documentApprovalMutation.mutate({
                                userId: doc.id,
                                action: 'approve',
                                notes: 'Documentos aprovados após verificação'
                              })}
                              disabled={documentApprovalMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              onClick={() => documentApprovalMutation.mutate({
                                userId: doc.id,
                                action: 'reject',
                                notes: 'Documentos rejeitados - enviar novamente'
                              })}
                              disabled={documentApprovalMutation.isPending}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-gray-500">
                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Nenhum documento pendente</p>
                        <p className="text-sm mt-2">Todos os documentos foram verificados</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Usuários Suspeitos */}
              <div className="lg:col-span-2">
                <Card className="bg-black/30 border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Atividades Suspeitas
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Usuários com comportamento potencialmente problemático
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {suspiciousLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                      </div>
                    ) : (suspiciousUsers as any[]) && (suspiciousUsers as any[]).length > 0 ? (
                      <div className="space-y-4">
                                                  {(suspiciousUsers as any[]).map((user: any) => (
                          <div key={user.id} className="p-4 bg-gray-800/50 rounded-lg border border-red-500/20">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {user.username?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-white">{user.username}</h3>
                                  <p className="text-sm text-gray-400">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${
                                  user.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  user.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                  user.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}>
                                  {user.riskLevel === 'critical' ? 'CRÍTICO' :
                                   user.riskLevel === 'high' ? 'ALTO' :
                                   user.riskLevel === 'medium' ? 'MÉDIO' : 'BAIXO'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedModerationUser(user);
                                    setShowModerationModal(true);
                                  }}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Moderar
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">Jogos recentes:</span>
                                <span className="text-white">{user.recentGames || 0}</span>
                                <span className="text-gray-400">Tokens ganhos:</span>
                                <span className="text-white">{(user.tokensGained || 0).toLocaleString()}</span>
                                <span className="text-gray-400">Taxa desistência:</span>
                                <span className="text-white">{Math.round(((user.quitRate || 0) * 100) || 0)}%</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(user.flags || []).map((flag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-3 p-2 bg-gray-900/50 rounded">
                                <p className="text-sm text-gray-300">
                                  <strong>Ação recomendada:</strong> {user.recommendedAction || 'Monitorar atividade'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma atividade suspeita detectada</p>
                        <p className="text-sm mt-2">Sistema de monitoramento ativo 24/7</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Regras de Banimento */}
              <div>
                <Card className="bg-black/30 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Regras de Banimento
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Políticas de moderação da plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 overflow-y-auto">
                      <div className="space-y-4">
                        {banishmentRules.map((rule) => (
                          <div key={rule.id} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm text-cyan-400">{rule.category}</h4>
                              <Badge variant="outline" className={`text-xs ${
                                rule.action === 'permanent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`}>
                                {rule.action === 'permanent' ? 'PERMANENTE' : 'TEMPORÁRIO'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{rule.severity}</p>
                            <div className="space-y-1">
                              {rule.rules.slice(0, 2).map((ruleText, index) => (
                                <p key={index} className="text-xs text-gray-500">• {ruleText}</p>
                              ))}
                              {rule.rules.length > 2 && (
                                <p className="text-xs text-gray-600">... e mais {rule.rules.length - 2} regras</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Modal de Moderação */}
            {showModerationModal && selectedModerationUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="bg-black/90 border-gray-700 w-full max-w-md mx-4">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <Ban className="h-5 w-5" />
                      Moderar Usuário
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Aplicar ação disciplinar para {(selectedModerationUser as any).username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Tipo de Punição</label>
                      <select 
                        value={banType} 
                        onChange={(e) => setBanType(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      >
                        <option value="temporary">Suspensão Temporária</option>
                        <option value="permanent">Banimento Permanente</option>
                      </select>
                    </div>

                    {banType === 'temporary' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Duração (horas)</label>
                        <input 
                          type="number" 
                          value={banDuration} 
                          onChange={(e) => setBanDuration(Number(e.target.value))}
                          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          min="1"
                          max="8760"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Categoria da Infração</label>
                      <select 
                        value={selectedBanReason} 
                        onChange={(e) => setSelectedBanReason(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      >
                        <option value="">Selecionar categoria...</option>
                        {banishmentRules.map((rule) => (
                          <option key={rule.id} value={rule.category}>
                            {rule.category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Motivo Específico</label>
                      <textarea
                        value={customBanReason}
                        onChange={(e) => setCustomBanReason(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                        placeholder="Descreva o motivo específico..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const reason = selectedBanReason || customBanReason;
                          if (reason) {
                            handleBanUser((selectedModerationUser as any).id, reason, banType as 'temporary' | 'permanent', banType === 'temporary' ? banDuration : undefined);
                          }
                        }}
                        disabled={!selectedBanReason && !customBanReason}
                        className="flex-1"
                      >
                        Aplicar Punição
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowModerationModal(false);
                          setSelectedModerationUser(null);
                          setSelectedBanReason('');
                          setCustomBanReason('');
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5" />
                  Solicitações de Saque
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Sistema 8.7% mensal - Janela fica aberta no dia 3 de cada mês
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Pool de Saques - Tempo Real */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-cyan-900/30 border-cyan-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-cyan-300 mb-1">Pool Total Acumulada</h3>
                        <div className="text-2xl font-bold text-cyan-400">
                          R$ {((currentStats.withdrawalPool?.totalAccumulated || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-cyan-300 mt-1">
                          {currentStats.withdrawalPool?.totalActiveUsers || 0} usuários ativos
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-900/30 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-green-300 mb-1">Limite Mensal (8.7%)</h3>
                        <div className="text-2xl font-bold text-green-400">
                          R$ {((currentStats.withdrawalPool?.monthlyLimit || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-green-300 mt-1">Disponível para saque</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-900/30 border-orange-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-orange-300 mb-1">Utilizado Este Mês</h3>
                        <div className="text-2xl font-bold text-orange-400">
                          R$ {((currentStats.withdrawalPool?.currentMonthUsed || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-orange-300 mt-1">
                          {currentStats.withdrawalPool?.utilizationRate || 0}% do limite mensal
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-900/30 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-blue-300 mb-1">Restante Disponível</h3>
                        <div className="text-2xl font-bold text-blue-400">
                          R$ {(((currentStats as any).withdrawalPool?.remainingThisMonth || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-blue-300 mt-1">Próxima janela: 03/08/2025</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Horário Atual - Brasília */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Horário Atual (Brasília)</p>
                      <p className="text-xs text-gray-400">Sistema operando com timezone America/Sao_Paulo</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan-400">
                      {currentTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </div>
                    <p className="text-xs text-gray-400">
                      {currentTime.getDate() === 3 ? '🟢 Janela de saque ABERTA' : '🔴 Janela de saque fechada'}
                    </p>
                  </div>
                </div>

                {/* Lista de Solicitações */}
                {currentWithdrawals.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Solicitações Pendentes</h3>
                    {currentWithdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {withdrawal.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{withdrawal.username}</h4>
                                <p className="text-sm text-gray-400">
                                  Plano {(withdrawal.plan || 'free').toUpperCase()} • Saldo: R$ {((withdrawal.availableBalance || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Valor solicitado:</span>
                                <p className="font-bold text-green-400">R$ {((withdrawal.amount || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Chave PIX:</span>
                                <p className="font-mono text-cyan-400">{withdrawal.pixKey}</p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Solicitado em: {new Date(withdrawal.requestDate || Date.now()).toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {withdrawal.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                                >
                                  Aprovar PIX
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                                >
                                  Rejeitar
                                </Button>
                              </>
                            ) : (
                              <Badge 
                                variant={withdrawal.status === 'approved' ? 'default' : 'destructive'}
                                className={withdrawal.status === 'approved' ? 'bg-green-600 text-white' : ''}
                              >
                                {withdrawal.status === 'approved' ? '✅ PIX Aprovado' : '❌ Rejeitado'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhuma solicitação pendente</h3>
                    <p className="text-sm text-gray-500">
                      As solicitações de saque aparecem aqui no dia 3 de cada mês quando a janela está aberta.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Análise Financeira</CardTitle>
                <CardDescription className="text-gray-400">
                  Receitas, custos e margem operacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Relatórios financeiros detalhados em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Central de Notificações</CardTitle>
                <CardDescription className="text-gray-400">
                  Alertas e atualizações do sistema em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'info' ? 'bg-cyan-400' :
                        notification.type === 'user' ? 'bg-green-400' :
                        notification.type === 'system' ? 'bg-blue-400' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        notification.type === 'info' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                        notification.type === 'user' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        notification.type === 'system' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {notification.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <RealTimeMonitor />
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-400 flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  Fontes de Dados do Dashboard Administrativo
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Visualização técnica de onde cada dado está sendo coletado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Estatísticas Principais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">📊 Estatísticas Principais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-green-400">Total de Usuários: {currentStats.totalUsers}</h4>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            {stats ? "🔗 API Real" : "📋 Sem Dados"}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-300"><strong>API:</strong> <code>/api/admin/stats</code></p>
                          <p className="text-gray-300"><strong>Método:</strong> storage.getTotalUsers()</p>
                          <p className="text-gray-300"><strong>Fonte:</strong> MemStorage.users.size</p>
                          <p className="text-gray-400"><strong>Localização:</strong> server/storage.ts linha 500</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-blue-400">Usuários Ativos: {currentStats.activeUsers}</h4>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            {stats ? "🔗 API Real" : "📋 Sem Dados"}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-300"><strong>API:</strong> <code>/api/admin/stats</code></p>
                          <p className="text-gray-300"><strong>Método:</strong> storage.getActiveUsers()</p>
                          <p className="text-gray-300"><strong>Cálculo:</strong> Math.floor(users.size * 0.72)</p>
                          <p className="text-gray-400"><strong>Localização:</strong> server/storage.ts linha 506</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-yellow-400">Receita Total: R$ {(currentStats.totalRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            {stats ? "🔗 API Real" : "📋 Sem Dados"}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-300"><strong>API:</strong> <code>/api/admin/stats</code></p>
                          <p className="text-gray-300"><strong>Método:</strong> storage.getRevenueStats()</p>
                          <p className="text-gray-300"><strong>Valor:</strong> Hardcoded: 18650.75</p>
                          <p className="text-gray-400"><strong>Localização:</strong> server/storage.ts linha 511</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-cyan-400">Pool de Saques: R$ 219.243,60</h4>
                          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                            📋 Dados Mock
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-300"><strong>API:</strong> <code>/api/admin/stats/withdrawal-pool</code></p>
                          <p className="text-gray-300"><strong>Cálculo:</strong> activeUsers * averageBalance</p>
                          <p className="text-gray-300"><strong>Fórmula:</strong> 892 usuários × R$ 245,80</p>
                          <p className="text-gray-400"><strong>Localização:</strong> server/storage.ts linha 520</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Sistema de Tempo Real */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">⚡ Sistema de Tempo Real</h3>
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-cyan-400">Atividades dos Dashboards</h4>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          🔴 LIVE
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-300"><strong>Fonte:</strong> Console.log interceptation</p>
                        <p className="text-gray-300"><strong>Componente:</strong> RealTimeMonitor.tsx</p>
                        <p className="text-gray-300"><strong>Logs capturados:</strong> "📊 ATIVIDADE TEMPO REAL"</p>
                        <p className="text-gray-300"><strong>Mock adicional:</strong> Simulação a cada 3 segundos</p>
                        <p className="text-gray-400"><strong>Localização:</strong> client/src/components/admin/real-time-monitor.tsx</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notificações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">🔔 Notificações e Alertas</h3>
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-orange-400">Sistema de Notificações</h4>
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          📋 Estado Local
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-300"><strong>Fonte:</strong> useState local no componente</p>
                        <p className="text-gray-300"><strong>Dados:</strong> Array hardcoded com 3 notificações</p>
                        <p className="text-gray-300"><strong>Tipos:</strong> withdrawal, user, revenue</p>
                        <p className="text-gray-400"><strong>Localização:</strong> AdminDashboard.tsx linha 87-109</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SAC IA */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">🤖 SAC Inteligente</h3>
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-pink-400">Chat Automático</h4>
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          🧠 IA Local
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-300"><strong>Função:</strong> generateAIResponse()</p>
                        <p className="text-gray-300"><strong>Lógica:</strong> If/else baseado em keywords</p>
                        <p className="text-gray-300"><strong>Histórico:</strong> useState com chat mock</p>
                        <p className="text-gray-400"><strong>Localização:</strong> AdminDashboard.tsx linha 628-653</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status da API */}
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Status Atual das APIs</h3>
                  <div className="text-sm space-y-1">
                    <p className="text-red-300">• <code>/api/admin/stats</code> → 401 Unauthorized</p>
                    <p className="text-red-300">• <code>/api/admin/withdrawals</code> → 401 Unauthorized</p>
                    <p className="text-red-300">• <code>/api/admin/users</code> → 401 Unauthorized</p>
                    <p className="text-yellow-300 mt-2">
                      <strong>Motivo:</strong> Middleware requireAdmin bloqueando acesso (server/admin-routes.ts linha 7-35)
                    </p>
                    <p className="text-gray-400">
                      <strong>Solução:</strong> Sistema está usando dados mock como fallback para demonstração
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">📊 Relatórios Administrativos</h2>
              <p className="text-gray-400">Gere relatórios completos em PDF ou Excel com todas as métricas da plataforma</p>
            </div>
            <ReportDownloads />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat do SAC */}
              <Card className="bg-black/30 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    SAC Inteligente
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    IA responde automaticamente dúvidas sobre saques, planos e políticas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 mb-4 p-4 bg-gray-900/50 rounded-lg">
                    {chatHistory.map((chat) => (
                      <div key={chat.id} className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-cyan-400">{chat.user}</span>
                          <span className="text-xs text-gray-500">{chat.timestamp}</span>
                        </div>
                        <p className="text-gray-300 mb-2 text-sm">{chat.message}</p>
                        <div className="bg-blue-900/30 p-2 rounded border-l-2 border-blue-500">
                          <p className="text-blue-200 text-sm">{chat.response}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Simular pergunta de usuário..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="bg-gray-800 border-gray-600"
                    />
                    <Button 
                      onClick={() => {
                        if (chatMessage.trim()) {
                          const newChat = {
                            id: chatHistory.length + 1,
                            user: "Usuário Teste",
                            message: chatMessage,
                            response: generateAIResponse(chatMessage),
                            timestamp: new Date().toLocaleString('pt-BR'),
                            status: "resolved"
                          };
                          setChatHistory([newChat, ...chatHistory]);
                          setChatMessage("");
                        }
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas do SAC */}
              <Card className="bg-black/30 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Estatísticas do SAC</CardTitle>
                  <CardDescription className="text-gray-400">
                    Performance da IA e atendimento automatizado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Consultas hoje</span>
                      <span className="text-cyan-400 font-bold">127</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Taxa de resolução</span>
                      <span className="text-green-400 font-bold">94.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Tempo médio</span>
                      <span className="text-blue-400 font-bold">12s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Dúvidas sobre saques</span>
                      <span className="text-orange-400 font-bold">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Dúvidas sobre planos</span>
                      <span className="text-emerald-400 font-bold">32%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Políticas/Regras</span>
                      <span className="text-yellow-400 font-bold">23%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fontes">
            <DataSourcesTab />
          </TabsContent>

          {/* ABA DE TOKENS - CRÉDITO MANUAL */}
          <TabsContent value="tokens" className="space-y-6">
            <Card className="bg-black/30 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Crédito Manual de Tokens
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Para situações emergenciais onde o webhook falha ou PIX não creditou automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Formulário de Crédito */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6 rounded-lg border border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-white mb-4">💰 Creditar Tokens</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          User ID ou Email
                        </label>
                        <Input
                          placeholder="2 ou mariahelena@gmail.com"
                          value={creditTokensData.userId}
                          onChange={(e) => setCreditTokensData(prev => ({ ...prev, userId: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Quantidade de Tokens
                        </label>
                        <Input
                          type="number"
                          placeholder="4320"
                          value={creditTokensData.amount}
                          onChange={(e) => setCreditTokensData(prev => ({ ...prev, amount: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Descrição/Motivo
                        </label>
                        <Input
                          placeholder="PIX R$ 6,00 - Nubank confirmado"
                          value={creditTokensData.description}
                          onChange={(e) => setCreditTokensData(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        if (creditTokensData.userId && creditTokensData.amount && creditTokensData.description) {
                          creditTokensMutation.mutate(creditTokensData);
                        } else {
                          toast({
                            title: "Campos obrigatórios",
                            description: "Preencha todos os campos antes de creditar",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={creditTokensMutation.isPending}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                    >
                      {creditTokensMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Creditando...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Creditar Tokens
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Valores de referência */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">📊 Valores de Referência</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Pro Boost:</span>
                        <span className="text-white ml-2 font-medium">4.320 tokens</span>
                        <div className="text-xs text-gray-500">R$ 6,00</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Mega Boost:</span>
                        <span className="text-white ml-2 font-medium">7.200 tokens</span>
                        <div className="text-xs text-gray-500">R$ 9,00</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Ultra Boost:</span>
                        <span className="text-white ml-2 font-medium">14.400 tokens</span>
                        <div className="text-xs text-gray-500">R$ 18,00</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Super Boost:</span>
                        <span className="text-white ml-2 font-medium">25.600 tokens</span>
                        <div className="text-xs text-gray-500">R$ 32,00</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Usuários principais */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">👥 Usuários Frequentes</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Admin Master:</span>
                        <span className="text-white">ID: 1 - passosmir4@gmail.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Maria Helena:</span>
                        <span className="text-white">ID: 2 - mariahelena@gmail.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Paulo:</span>
                        <span className="text-white">ID: 3 - phpg69@gmail.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Comportamental */}
            <Card className="bg-black/30 border-teal-500/20">
              <CardHeader>
                <CardTitle className="text-teal-400 flex items-center gap-2">
                  📊 Analytics Comportamental - Tempo Real
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Monitoramento das atividades dos usuários nos dashboards cliente e profissional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Atividade Dashboard Cliente */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-4">🎯 Dashboard Cliente</h3>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-300">
                        <strong>Sistema Ativo:</strong> trackDropdownClick() integrado
                      </div>
                      <div className="text-sm text-gray-300">
                        <strong>Endpoint:</strong> /api/analytics/track
                      </div>
                      <div className="text-sm text-gray-300">
                        <strong>Categorias monitoradas:</strong>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cyan-400">• Visão Geral</span>
                            <span className="text-gray-400">Overview + Stats</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-400">• Conta</span>
                            <span className="text-gray-400">Perfil + Documentos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-400">• Comunicação</span>
                            <span className="text-gray-400">Times + Chats</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-400">• Crescimento</span>
                            <span className="text-gray-400">Referral + Insights</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Atividade Dashboard Profissional */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-indigo-500/20">
                    <h3 className="text-lg font-semibold text-indigo-400 mb-4">💼 Dashboard Profissional</h3>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-300">
                        <strong>Sistema Ativo:</strong> trackDropdownClick() integrado
                      </div>
                      <div className="text-sm text-gray-300">
                        <strong>Endpoint:</strong> /api/analytics/track
                      </div>
                      <div className="text-sm text-gray-300">
                        <strong>Categorias monitoradas:</strong>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cyan-400">• Dashboard</span>
                            <span className="text-gray-400">Visão Geral + Stats</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-400">• Conta</span>
                            <span className="text-gray-400">Perfil + Configurações</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-indigo-400">• Comunicação</span>
                            <span className="text-gray-400">Agenda + Chats + Solicitações</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-400">• Crescimento</span>
                            <span className="text-gray-400">Serviços + Marketing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Como Visualizar os Dados */}
                <div className="mt-6 bg-gradient-to-r from-teal-900/20 to-cyan-900/20 p-4 rounded-lg border border-teal-500/30">
                  <h4 className="text-lg font-semibold text-teal-400 mb-3">📈 Como Visualizar os Dados Coletados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-semibold text-cyan-400 mb-2">🔍 Console do Navegador (Tempo Real)</h5>
                      <div className="space-y-1 text-gray-300">
                        <p>• Pressione F12 no navegador</p>
                        <p>• Vá para aba "Console"</p>
                        <p>• Logs aparecem quando usuários clicam</p>
                        <p>• Formato: "📊 ATIVIDADE TEMPO REAL"</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-cyan-400 mb-2">📊 Dados Coletados</h5>
                      <div className="space-y-1 text-gray-300">
                        <p>• Nome do usuário</p>
                        <p>• Categoria clicada</p>
                        <p>• Tab específica</p>
                        <p>• Timestamp exato</p>
                        <p>• Tipo de dashboard</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
                    <h6 className="font-semibold text-yellow-400 mb-2">⚡ Sistema em Funcionamento:</h6>
                    <div className="text-xs text-gray-300 space-y-1">
                      <p>✅ Tracking automático ativo em todos os dashboards</p>
                      <p>✅ Endpoint /api/analytics/track recebendo dados</p>
                      <p>✅ Auto-aceitar solicitações (1h timeout) implementado</p>
                      <p>✅ Logs no console para monitoramento ao vivo</p>
                      <p>✅ Zero impacto na performance (tracking silencioso)</p>
                    </div>
                  </div>
                </div>

                {/* Nova seção: Auto-Aceitar Solicitações */}
                <div className="mt-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4 rounded-lg border border-green-500/30">
                  <h4 className="text-lg font-semibold text-green-400 mb-3">⚡ Auto-Aceitar Solicitações - Novo Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-semibold text-emerald-400 mb-2">🎯 Funcionalidade</h5>
                      <div className="space-y-1 text-gray-300">
                        <p>• Profissional pode ligar/desligar auto-aceitar</p>
                        <p>• Prazo padrão: 1 hora para aceitar automaticamente</p>
                        <p>• Toggle no dashboard profissional → Comunicação</p>
                        <p>• Status visual: ATIVO (verde) / INATIVO (cinza)</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-emerald-400 mb-2">📊 Dados para Admin</h5>
                      <div className="space-y-1 text-gray-300">
                        <p>• Qual profissional está usando auto-aceitar</p>
                        <p>• Quantas vezes foi ativado/desativado</p>
                        <p>• Última vez que foi usado</p>
                        <p>• Taxa de solicitações aceitas automaticamente</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-800/30 rounded border border-green-600">
                    <h6 className="font-semibold text-green-400 mb-2">💡 Como Funciona:</h6>
                    <div className="text-xs text-gray-300 space-y-1">
                      <p>1. Profissional ativa auto-aceitar no dashboard</p>
                      <p>2. Novas solicitações são aceitas automaticamente após 1 hora</p>
                      <p>3. Admin vê dados de uso em tempo real nesta aba Analytics</p>
                      <p>4. Sistema gera logs automáticos para monitoramento</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sistema de Auto-Aceitar */}
            <Card className="glassmorphism border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-400">
                  <span>🤖</span>
                  <span>Sistema de Auto-Aceitar</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Monitoramento das configurações de auto-aceitar por profissional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutoAcceptAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral">
            <ReferralTab />
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    🚀
                  </div>
                  Distribuição de Planos
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Análise detalhada da base de usuários por plano de assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {planDistributionLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin mx-auto mb-4 text-cyan-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Carregando distribuição de planos...</p>
                  </div>
                ) : planDistribution ? (
                  <div className="space-y-6">
                    {/* Resumo Geral */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="glassmorphism border-cyan-500/30">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{(planDistribution as any).totalUsers}</div>
                            <div className="text-xs text-gray-400">Total de Usuários</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glassmorphism border-green-500/30">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">R$ {(planDistribution as any).totalRevenue.toFixed(0)}</div>
                            <div className="text-xs text-gray-400">Receita Mensal</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glassmorphism border-blue-500/30">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {(planDistribution as any).planStats.filter((p: any) => p.userCount > 0).length}
                            </div>
                            <div className="text-xs text-gray-400">Planos Ativos</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Lista Detalhada de Planos */}
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Detalhamento por Plano:</h4>
                      {(planDistribution as any).planStats.map((plan: any, index: number) => (
                        <Card key={index} className={`glassmorphism ${
                          plan.planName === 'freeOrbitrum' ? 'border-cyan-500/30' :
                          plan.planName === 'explorador' ? 'border-yellow-500/30' :
                          plan.planName === 'conector' ? 'border-blue-500/30' :
                          plan.planName === 'orbitrumPro' ? 'border-purple-500/30' :
                          plan.planName === 'orbitrumMax' ? 'border-red-500/30' :
                          'border-gray-500/30'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                  plan.planName === 'freeOrbitrum' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400' :
                                  plan.planName === 'explorador' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400' :
                                  plan.planName === 'conector' ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400' :
                                  plan.planName === 'orbitrumPro' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400' :
                                  plan.planName === 'orbitrumMax' ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400' :
                                  'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400'
                                }`}>
                                  {plan.planName === 'freeOrbitrum' ? '🚀' :
                                   plan.planName === 'explorador' ? '🔭' :
                                   plan.planName === 'conector' ? '🌐' :
                                   plan.planName === 'orbitrumPro' ? '💎' :
                                   plan.planName === 'orbitrumMax' ? '👑' : '❓'}
                                </div>
                                <div>
                                  <div className="text-white font-medium">{plan.displayName}</div>
                                  <div className="text-xs text-gray-400">
                                    {plan.price > 0 ? `R$ ${plan.price}/mês` : 'Gratuito'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-white">{plan.userCount}</div>
                                <div className="text-xs text-gray-400">{plan.percentage}% dos usuários</div>
                                {plan.monthlyRevenue > 0 && (
                                  <div className="text-xs text-green-400 mt-1">
                                    R$ {plan.monthlyRevenue.toFixed(0)}/mês
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Barra de progresso visual */}
                            <div className="mt-3">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    plan.planName === 'freeOrbitrum' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                                    plan.planName === 'explorador' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                    plan.planName === 'conector' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                    plan.planName === 'orbitrumPro' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                    plan.planName === 'orbitrumMax' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                                    'bg-gradient-to-r from-gray-500 to-gray-600'
                                  }`}
                                  style={{ width: `${Math.max(parseFloat(plan.percentage), 2)}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Timestamp */}
                    <div className="text-center text-xs text-gray-500 mt-4">
                      Última atualização: {new Date((planDistribution as any).timestamp).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-lg">Erro ao carregar dados dos planos</div>
                    <div className="text-sm mt-2">
                      Tente atualizar os dados clicando em Sync
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente para Analytics do Sistema de Auto-Aceitar
function AutoAcceptAnalytics() {
  const { data: autoAcceptData, isLoading } = useQuery({
    queryKey: ['/api/admin/auto-accept-analytics'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-400">
          🤖 Carregando dados do auto-aceitar...
        </div>
      </div>
    );
  }

  const analytics = (autoAcceptData as any)?.data || [];
  const summary = (autoAcceptData as any)?.summary || { totalActive: 0, totalUsage: 0, averageResponseTime: 0 };

  return (
    <div className="space-y-4">
      {/* Resumo das estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glassmorphism border-green-500/30">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{summary.totalActive}</div>
              <div className="text-xs text-gray-400">Profissionais Ativos</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-blue-500/30">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{summary.totalUsage}</div>
              <div className="text-xs text-gray-400">Total Usos</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism border-cyan-500/30">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{summary.averageResponseTime.toFixed(1)}h</div>
              <div className="text-xs text-gray-400">Tempo Médio</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de profissionais com auto-aceitar ativo */}
      {analytics.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-white font-medium">Profissionais com Auto-Aceitar Ativo:</h4>
          {analytics.map((professional: any, index: number) => (
            <Card key={index} className="glassmorphism border-green-500/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{professional.professionalName}</div>
                    <div className="text-xs text-gray-400">{professional.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm font-medium">ATIVO</div>
                    <div className="text-xs text-gray-400">{professional.responseTimeHours}h prazo</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Usado: {professional.autoAcceptCount} vezes</span>
                  <span>Último uso: {professional.lastUsed}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-lg">Nenhum profissional usando auto-aceitar</div>
          <div className="text-sm mt-2">
            Os profissionais podem ativar no dashboard → Comunicação
          </div>
        </div>
      )}
    </div>
  );
}

// Função para gerar respostas automáticas da IA
function generateAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('saque') || lowerMessage.includes('sacar')) {
    return "🏦 **SAQUES**: Janela de saque abre dia 3 de cada mês (00:00). Máximo 8,7% do seu saldo acumulado. Processamento em até 24h após aprovação. Verifique se sua chave PIX está correta no perfil.";
  }
  
  if (lowerMessage.includes('plano') || lowerMessage.includes('assinatura')) {
    return "💎 **PLANOS**: 4 opções disponíveis - Básico (R$7), Standard (R$14), Pro (R$21), Max (R$30). Todos com cashback até 8,7% mensal. Cancelamento a qualquer momento. Sem taxa de adesão.";
  }
  
  if (lowerMessage.includes('política') || lowerMessage.includes('regra') || lowerMessage.includes('lgpd')) {
    return "🛡️ **POLÍTICAS**: Seguimos LGPD rigorosamente. Seus dados são criptografados e nunca compartilhados. Acesse /privacidade para política completa. Direito ao esquecimento disponível.";
  }
  
  if (lowerMessage.includes('token') || lowerMessage.includes('crédito')) {
    return "🪙 **TOKENS/CRÉDITOS**: Usados para conectar com profissionais. Nunca expiram. Recargas disponíveis. Cashback baseado em atividade na plataforma. 1 token = R$ 0,001.";
  }
  
  if (lowerMessage.includes('jogo') || lowerMessage.includes('jogar')) {
    return "🎮 **JOGOS**: 3 partidas/dia máximo. Custo: 250 tokens (R$ 0,25). Prêmio máximo: 850 tokens (R$ 0,85). Baseado em pontuação (mínimo 5000 pts, máximo 15000 pts). Sistema anti-fraude ativo.";
  }
  
  if (lowerMessage.includes('cancelar') || lowerMessage.includes('excluir') || lowerMessage.includes('deletar') || lowerMessage.includes('conta') || lowerMessage.includes('encerrar')) {
    return "⚠️ **CANCELAR CONTA**: Para cancelar sua conta, confirme digitando 'CONFIRMAR CANCELAMENTO'. Isso excluirá permanentemente todos os seus dados, tokens e histórico. Esta ação não pode ser desfeita.";
  }
  
  if (lowerMessage === 'confirmar cancelamento') {
    return "❌ **CONTA CANCELADA**: Sua solicitação de cancelamento foi processada. Em 24-48h todos os dados serão permanentemente excluídos. Obrigado por usar a Orbitrum Connect. Para reativação, entre em contato em até 48h.";
  }
  
  return "🤖 Olá! Sou o SAC Inteligente da Orbitrum. Como posso ajudar? Posso esclarecer dúvidas sobre: **saques**, **planos**, **políticas**, **tokens/créditos**, **jogos** e **cancelar conta**. Digite sua dúvida!";
}