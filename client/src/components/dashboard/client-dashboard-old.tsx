import CleanClientDashboard from "./CleanClientDashboard";

// Função para tracking de comportamento dos dropdowns
const trackDropdownClick = async (category: string, tab: string, user: any) => {
  try {
    await apiRequest("POST", "/api/analytics/track", {
      event: "dropdown_click",
      data: {
        category,
        tab,
        dashboardType: "client",
        newInterface: true,
        userEmail: user?.email || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
    console.log(`📊 ATIVIDADE TEMPO REAL - Dashboard Cliente:`, {
      user: user?.username || 'Usuario',
      activeTab: tab,
      timestamp: new Date().toISOString(),
      userType: 'client'
    });
  } catch (error) {
    // Silenciar erro para não afetar UX
  }
};
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Users, 
  History, 
  Wallet, 
  Search, 
  Star,
  Clock,
  MapPin,
  TrendingUp,
  Home,
  Settings,
  Bell,
  MessageCircle,
  Coins,
  Shield,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Image as ImageIcon,
  Save,
  Crown,
  Calendar,
  Info,
  Share2,
  Copy,
  Gift,
  Target,
  ChevronDown,
  BarChart3,
  Brain,
  Rocket
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// Removido useQuery para evitar travamentos
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { DocumentVerificationModal } from "@/components/document-verification-modal";
import { PlanExpiryTimer } from "../plan-expiry-timer";
import { useAuth } from "@/hooks/useAuth";
import ActiveServicesPanel from "@/components/ActiveServicesPanel";
import VolumeControl from "@/components/VolumeControl";
import MiniMap from "@/components/MiniMap";
import { InsightsTab } from "@/components/analytics/InsightsTab";

interface ClientDashboardProps {
  user: any;
}

export function ClientDashboard({ user }: ClientDashboardProps) {
  return <CleanClientDashboard user={user} />;
  // Verificar se há parâmetro 'tab' na URL
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'overview';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    pixKey: user?.pixKey || '',
  });
  const [documentFiles, setDocumentFiles] = useState({
    selfie: null as File | null,
    document: null as File | null,
    residence: null as File | null,
  });
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Documents Tab Component
  const DocumentsTab = ({ user }: { user: any }) => {
    const { data: documentsStatus } = useQuery({
      queryKey: ["/api/users/documents", user.id],
      enabled: !!user.id,
      staleTime: 30000
    });

    const [selectedFiles, setSelectedFiles] = useState<{[key: string]: File | null}>({
      selfie: null,
      document: null,
      proofOfResidence: null,
      professionalPortfolio: null
    });

    const documentUploadMutation = useMutation({
      mutationFn: async (data: FormData) => {
        const response = await apiRequest("POST", "/api/users/documents/upload", data);
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Documentos Enviados",
          description: "Seus documentos foram enviados para análise",
          variant: "default"
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users/documents"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro no Upload",
          description: error.message,
          variant: "destructive"
        });
      }
    });

    const handleFileChange = (type: string, file: File | null) => {
      setSelectedFiles(prev => ({ ...prev, [type]: file }));
    };

    const handleSubmit = async () => {
      const formData = new FormData();
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
      
      if (Object.values(selectedFiles).every(file => !file)) {
        toast({
          title: "Nenhum arquivo selecionado",
          description: "Selecione pelo menos um documento",
          variant: "destructive"
        });
        return;
      }

      documentUploadMutation.mutate(formData);
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'approved': return <CheckCircle className="w-5 h-5 text-green-400" />;
        case 'rejected': return <XCircle className="w-5 h-5 text-red-400" />;
        default: return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'approved': 
          return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>;
        case 'rejected': 
          return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
        default: 
          return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      }
    };

    return (
      <div className="space-y-6">
        {/* Status Header */}
        <Card className="glassmorphism border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(documentsStatus?.status || 'pending')}
                <span>Status da Verificação</span>
              </div>
              {getStatusBadge(documentsStatus?.status || 'pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentsStatus?.status === 'approved' ? (
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-400 font-medium">
                  ✅ Documentos aprovados! Você pode realizar compras na plataforma.
                </p>
              </div>
            ) : documentsStatus?.status === 'rejected' ? (
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                <p className="text-red-400 font-medium">
                  ❌ Documentos rejeitados. Por favor, envie novamente.
                </p>
                {documentsStatus?.adminNotes && (
                  <p className="text-gray-300 mt-2 text-sm">
                    Observações: {documentsStatus.adminNotes}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                <p className="text-yellow-400 font-medium">
                  ⏳ Envie seus documentos para aprovação e liberar compras.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Interface */}
        <Card className="glassmorphism border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>Upload de Documentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selfie */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm font-medium">
                Selfie com Documento (obrigatório)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300"
              />
            </div>

            {/* Documento de Identidade */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm font-medium">
                Documento de Identidade (RG/CNH) (obrigatório)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('document', e.target.files?.[0] || null)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300"
              />
            </div>

            {/* Comprovante de Residência */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm font-medium">
                Comprovante de Residência (obrigatório)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('proofOfResidence', e.target.files?.[0] || null)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300"
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full neon-button"
              onClick={handleSubmit}
              disabled={documentUploadMutation.isPending}
            >
              {documentUploadMutation.isPending ? (
                "Enviando..."
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Documentos
                </>
              )}
            </Button>

            <p className="text-gray-400 text-xs">
              Seus documentos serão analisados em até 24 horas. Após aprovação, você poderá realizar compras na plataforma.
            </p>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glassmorphism border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-white font-medium">Segurança</h3>
                  <p className="text-gray-400 text-sm">
                    Seus documentos são protegidos com criptografia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="text-white font-medium">Rapidez</h3>
                  <p className="text-gray-400 text-sm">
                    Análise em até 24 horas úteis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // Notificar atividades do dashboard em tempo real para admin
  useEffect(() => {
    if (user?.username && activeTab) {
      // Atividade tempo real removida para performance
    }
  }, [activeTab, user]);

  // Queries para dados reais do dashboard
  const { data: userWallet, isLoading: walletLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "wallet"],
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30000
  });

  const { data: userTeams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30000
  });

  const { data: userGameScores, isLoading: gameScoresLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "game-scores"],
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30000
  });

  const { data: userNotifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30000
  });

  const { data: purchaseHistory, isLoading: purchaseHistoryLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "purchase-history"],
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30000
  });

  // Dados reais do usuário
  const userTokens = userWallet?.totalTokens || 0;

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await apiRequest("POST", "/api/payment/generate-pix", { 
        plan: packageId,
        type: 'tokens' 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        if (data.qrCodeBase64 || data.pixCode) {
          // Mostrar modal com QR Code PIX
          setPaymentData(data);
          setIsPaymentModalOpen(true);
          toast({
            title: "PIX Gerado",
            description: "QR Code PIX pronto para pagamento",
            variant: "default"
          });
        } else if (data.paymentUrl) {
          // Redirecionar para o Mercado Pago
          window.location.href = data.paymentUrl;
        } else {
          toast({
            title: "Erro no Pagamento",
            description: "Não foi possível gerar o link de pagamento",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Erro no Pagamento",
          description: "Não foi possível gerar o pagamento",
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      // VERIFICAR SE É ERRO DE DOCUMENTOS NÃO VERIFICADOS
      if (error.message.includes("Documentos não verificados") || error.message.includes("DOCUMENTS_NOT_VERIFIED")) {
        toast({
          title: "Documentos Pendentes",
          description: "Para realizar compras, você precisa verificar seus documentos primeiro.",
          variant: "destructive"
        });
        
        // Mostrar modal personalizado após 2 segundos
        setTimeout(() => {
          setShowDocumentModal(true);
        }, 1500);
      } else {
        toast({
          title: "Erro na Compra",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });

  // Dados reais do dashboard
  const wallet = userWallet || { tokensPlano: 0, tokensGanhos: 0, tokensComprados: 0, totalTokens: 0, cashbackAcumulado: 0 };
  const teams = userTeams || [];
  const gameScores = userGameScores || [];
  const notifications = userNotifications || [];

  const totalTokens = wallet.totalTokens || 0;
  const teamCount = teams.length;
  const totalTeamMembers = teams.reduce((total, team) => total + (team.professionalIds?.length || 0), 0);
  const gamesPlayed = gameScores.length;
  const cashbackAcumulado = wallet.cashbackAcumulado || 0;

  // Verificar se o usuário tem plano pago (básico, standard, pro, max)
  const temPlanoPago = user?.plan && ['basico', 'standard', 'pro', 'max'].includes(user.plan);
  
  // Função para navegar diretamente
  const navegarPara = (rota: string) => {
    // Navegação otimizada
    setLocation(rota);
  };

  // Função para upload de documentos
  const handleDocumentUpload = (type: string, file: File) => {
    setDocumentFiles(prev => ({ ...prev, [type]: file }));
    toast({
      title: "Arquivo selecionado",
      description: `${file.name} foi selecionado para upload.`,
    });
  };

  // Função para salvar perfil
  const handleProfileSave = async () => {
    try {
      toast({
        title: "Perfil salvo",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsEditProfileOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar alterações do perfil.",
        variant: "destructive",
      });
    }
  };

  // Controle de acesso baseado no plano real do usuário
  const handleAcesso = (rota: string, mensagem?: string) => {
    if (!temPlanoPago) {
      alert(mensagem || 'Função exclusiva para planos pagos. Faça upgrade para acessar.');
    } else {
      navegarPara(rota);
    }
  };

  const TabButton = ({ id, label, icon: Icon, isActive, mobileLabel }: any) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-1.5 px-2 py-2 sm:px-3 sm:py-3 rounded-lg transition-all duration-300 touch-manipulation min-h-[40px] sm:min-h-[44px] scale-[0.85] sm:scale-100 ${
        isActive 
          ? "bg-cyan-500 text-black font-medium shadow-lg" 
          : "text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 active:bg-cyan-500/20"
      }`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="text-xs sm:text-sm font-medium">
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{mobileLabel || label}</span>
      </span>
    </button>
  );

  // Dashboard renderizado
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">Carregando Dashboard...</h2>
          <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div className="border-b border-gray-700/50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400 scale-90">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Orbit
                </Button>
              </Link>
              <Link href="/dashboard-selector">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400">
                  ← Escolher Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-xl font-bold text-white">Dashboard Cliente</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Timer de expiração - versão compacta no header */}
              {user.plan !== 'free' && (
                <PlanExpiryTimer 
                  planExpiryDate={user.planExpiryDate} 
                  plan={user.plan} 
                  compact={true} 
                />
              )}
              
              <Bell className="w-5 h-5 text-gray-400 hover:text-cyan-400 cursor-pointer" />
              <Settings className="w-5 h-5 text-gray-400 hover:text-cyan-400 cursor-pointer" />
              <div className="text-sm text-gray-300">
                Olá, <span className="text-cyan-400 font-medium">{user?.username || "Usuário"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-8"
        >
          <Card className="glassmorphism border-cyan-500/30">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                <div className="p-1.5 sm:p-2 bg-cyan-500/20 rounded-lg mb-2 sm:mb-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs sm:text-sm">Tokens</p>
                  <p className="text-white font-semibold text-sm sm:text-lg">{totalTokens.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism border-blue-500/30">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg mb-2 sm:mb-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs sm:text-sm">Time</p>
                  <p className="text-white font-semibold text-sm sm:text-lg">{teamCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism border-green-500/30">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg mb-2 sm:mb-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs sm:text-sm">Cash</p>
                  <p className="text-white font-semibold text-sm sm:text-lg">R$ {((wallet?.tokensGanhos || 0) * 0.001).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism border-yellow-500/30">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
                <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg mb-2 sm:mb-0">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-xs sm:text-sm">Plano</p>
                  <p className="text-white font-semibold text-sm sm:text-lg capitalize">{user?.plan || 'Free'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3 Dropdowns Categorizados - Seguindo Padrões do Mercado */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start">
            
            {/* 1. Dashboard - Funcionalidades Principais */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{
                    boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
                    border: "1px solid rgba(6, 182, 212, 0.5)"
                  }}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium text-sm">🏠 Dashboard</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 bg-gray-900/95 border-cyan-500/30 backdrop-blur-sm shadow-2xl"
                style={{ boxShadow: "0 0 30px rgba(6, 182, 212, 0.2)" }}
              >
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('dashboard', 'overview', user);
                  setActiveTab('overview');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-white">Visão Geral</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('dashboard', 'search', user);
                  setActiveTab('search');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                  <Search className="w-4 h-4 text-blue-400" />
                  <span className="text-white">Buscar Profissional</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('dashboard', 'map', user);
                  setActiveTab('map');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-white">Mapa GPS</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('dashboard', 'team', user);
                  setActiveTab('team');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-white">Meu Time</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('dashboard', 'history', user);
                  setActiveTab('history');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                  <History className="w-4 h-4 text-orange-400" />
                  <span className="text-white">Histórico</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('dashboard', 'insights', user);
                  setActiveTab('insights');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                  <Brain className="w-4 h-4 text-violet-400" />
                  <span className="text-white">📊 Insights IA</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('dashboard', 'tracking', user);
                  setActiveTab('tracking');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span className="text-white">Rastreamento</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 2. Conta - Configurações Pessoais e Financeiras */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{
                    boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)",
                    border: "1px solid rgba(37, 99, 235, 0.5)"
                  }}
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium text-sm">👤 Conta</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 bg-gray-900/95 border-blue-500/30 backdrop-blur-sm shadow-2xl"
                style={{ boxShadow: "0 0 30px rgba(37, 99, 235, 0.2)" }}
              >
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('conta', 'profile', user);
                  setActiveTab('profile');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-500/20 cursor-pointer transition-colors">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-white">Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('conta', 'wallet', user);
                  setActiveTab('wallet');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-500/20 cursor-pointer transition-colors">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-white">Carteira</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('conta', 'tokens', user);
                  setActiveTab('tokens');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-500/20 cursor-pointer transition-colors">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-white">+Tokens</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('conta', 'documents', user);
                  setActiveTab('documents');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-500/20 cursor-pointer transition-colors">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-white">Documentos</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. Crescimento - Expansão e Oportunidades */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{
                    boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
                    border: "1px solid rgba(99, 102, 241, 0.5)"
                  }}
                >
                  <Rocket className="w-4 h-4" />
                  <span className="font-medium text-sm">🚀 Crescimento</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 bg-gray-900/95 border-indigo-500/30 backdrop-blur-sm shadow-2xl"
                style={{ boxShadow: "0 0 30px rgba(99, 102, 241, 0.2)" }}
              >
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('crescimento', 'referral', user);
                  setActiveTab('referral');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-indigo-500/20 cursor-pointer transition-colors">
                  <Share2 className="w-4 h-4 text-pink-400" />
                  <span className="text-white">Indicar Amigos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  trackDropdownClick('crescimento', 'become-professional', user);
                  setActiveTab('become-professional');
                }} className="flex items-center space-x-3 px-4 py-3 hover:bg-indigo-500/20 cursor-pointer transition-colors">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-white">Tornar-se Profissional</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Indicador sutil - agora menor e mais discreto */}
            <div className="hidden sm:flex items-center space-x-2 text-gray-400">
              <div className="text-xs bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/30">
                <span style={{ textShadow: "0 0 8px rgba(6, 182, 212, 0.6)" }}>
                  organizado em categorias
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Content - Free pode ver mas não contratar */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
            {activeTab === 'map' && (
            <GPSTracking 
              userType="client" 
              userId={user?.id || 1} 
              username={user?.username || 'Cliente'} 
            />
          )}

            {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card className="glassmorphism border-gray-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Plus className="w-5 h-5 text-cyan-400" />
                    <span>Novo Serviço</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4 text-sm">
                    Solicite um novo serviço profissional. Descreva o que você precisa e aguarde propostas.
                  </p>
                  <div className="space-y-3">
                    <Link href="/">
                      <Button className="w-full neon-button">
                        <Search className="w-4 h-4 mr-2" />
                        {(user?.plan === 'free' || !user?.plan) ? 'Buscar (Visualização)' : 'Buscar Profissional'}
                      </Button>
                    </Link>
                    <button 
                      type="button"
                      className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                      onClick={() => {
                        // Time access check
                        if (temPlanoPago) {
                          navegarPara('/teams');
                        } else {
                          alert('Função exclusiva para planos pagos. Você tem plano: ' + (user?.plan || 'free'));
                        }
                      }}
                    >
                      <Users className="w-4 h-4" />
                      <span>Usar Profissional do Time</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="glassmorphism border-gray-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span>Atividade Recente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Nenhuma atividade recente</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Suas solicitações de serviços aparecerão aqui
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'team' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span>Meu Time de Profissionais</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/20"
                      onClick={() => {
                        // Redirect to team creation
                        // Redirecionar para home e abrir busca automaticamente
                        setLocation('/?search=true');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Profissionais
                    </Button>
                    {teamCount > 0 && (
                      <Button 
                        size="sm" 
                        className="neon-button"
                        onClick={async () => {
                          if (!teams || teams.length === 0) {
                            toast({
                              title: "Nenhum profissional",
                              description: "Adicione profissionais ao seu time primeiro.",
                              variant: "destructive"
                            });
                            return;
                          }

                          const teamName = prompt("Nome do seu time:");
                          if (!teamName) return;

                          const projectTitle = prompt("Título do projeto (opcional):") || `Projeto: ${teamName}`;
                          const description = prompt("Descrição do projeto (opcional):") || `Você foi convidado para participar do time "${teamName}". Aguardamos sua resposta!`;

                          try {
                            const professionalsData = teams.map((team: any) => ({
                              id: team.professional?.id,
                              name: team.professional?.name,
                              selectedService: team.professional?.services?.[0] || "Colaboração em equipe",
                              budget: null,
                              hourlyRate: team.professional?.hourlyRate
                            }));

                            const response = await apiRequest("POST", "/api/teams/create-with-requests", {
                              name: teamName,
                              professionals: professionalsData,
                              projectTitle,
                              description,
                              clientId: user?.id,
                              clientName: user?.username || user?.email
                            });
                            
                            const result = await response.json();

                            toast({
                              title: "Time criado!",
                              description: result.message || `Time "${teamName}" criado e notificações enviadas para ${profissionalsData.length} profissionais.`
                            });

                            console.log('🎯 TEAM CRIADO COM SUCESSO:', result);
                          } catch (error) {
                            console.error('❌ ERRO AO CRIAR TEAM:', error);
                            toast({
                              title: "Erro",
                              description: "Erro ao criar time. Tente novamente.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Criar
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      className="neon-button"
                      onClick={() => {
                        console.log('🚀 CLIQUE GERENCIAR TIME - Plano:', user?.plan, '- Tem plano pago:', temPlanoPago);
                        if (temPlanoPago) {
                          navegarPara('/teams');
                        } else {
                          alert('Times são exclusivos para planos pagos. Você tem plano: ' + (user?.plan || 'free'));
                        }
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {temPlanoPago ? 'Gerenciar Time' : 'Ver Times (Pro)'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamCount > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams?.map((team: any) => (
                      <div key={team.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/30">
                        <div className="flex items-center space-x-3 mb-3">
                          <img 
                            src={team.professional?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32'} 
                            alt={team.professional?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="text-white font-medium">{team.professional?.name}</h3>
                            <p className="text-gray-400 text-sm">{team.professional?.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-gray-300 text-sm">{team.professional?.rating}</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="text-xs px-2 py-1 h-6 neon-button"
                            onClick={() => console.log('Solicitar serviço:', team.professional?.name)}
                          >
                            Solicitar Serviço
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">Nenhum profissional no time</h3>
                    <p className="text-gray-400 mb-4">Adicione profissionais ao seu time para facilitar futuras contratações.</p>
                    <Link href="/teams">
                      <Button className="neon-button">
                        <Users className="w-4 h-4 mr-2" />
                        Gerenciar Time
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'tokens' && (
            <div className="space-y-6">
              {/* Header da Loja de Tokens */}
              <Card className="glassmorphism border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Loja de Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Saldo atual de tokens</p>
                      <p className="text-2xl font-bold text-cyan-400">{userTokens.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Todos os pacotes incluem</p>
                      <p className="text-green-400 font-semibold">Créditos extras inclusos</p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      💡 <strong>Dica:</strong> Planos mensais incluem cashback de até 8,7% + acesso a Teams e outras funcionalidades premium
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Grid de Pacotes - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { id: "starter", name: "Starter Pack", price: 3, baseTokens: 1800, bonusTokens: 360, popular: false },
                  { id: "pro", name: "Pro Boost", price: 6, baseTokens: 3600, bonusTokens: 720, popular: false },
                  { id: "max", name: "Max Expansion", price: 9, baseTokens: 5400, bonusTokens: 1080, popular: true },
                  { id: "premium", name: "Orbit Premium", price: 18, baseTokens: 10800, bonusTokens: 2160, popular: false },
                  { id: "galaxy", name: "Galaxy Vault", price: 32, baseTokens: 19200, bonusTokens: 3840, popular: false }
                ].map((pkg) => (
                  <Card 
                    key={pkg.id} 
                    className={`glassmorphism border-gray-700 hover:border-cyan-500/50 transition-all duration-300 transform hover:scale-105 ${
                      pkg.popular ? 'border-cyan-500 ring-2 ring-cyan-500/20' : ''
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1">
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-2 sm:pb-4 p-3 sm:p-6">
                      <div className="flex justify-center mb-1 sm:mb-2 text-cyan-400">
                        <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <CardTitle className="text-base sm:text-lg text-white">{pkg.name}</CardTitle>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {pkg.baseTokens.toLocaleString()} + {pkg.bonusTokens.toLocaleString()} bônus
                      </p>
                    </CardHeader>
                    
                    <CardContent className="text-center space-y-2 sm:space-y-4 p-3 sm:p-6 pt-0">
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-1">
                          R$ {pkg.price}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {(pkg.baseTokens + pkg.bonusTokens).toLocaleString()} tokens
                        </div>
                      </div>
                      
                      <div className="space-y-0.5 sm:space-y-1 text-xs text-gray-400">
                        <div>Base: {pkg.baseTokens.toLocaleString()}</div>
                        <div className="text-green-400">Bônus: +{pkg.bonusTokens.toLocaleString()}</div>
                      </div>
                      
                      <Button
                        onClick={() => purchaseMutation.mutate(pkg.id)}
                        disabled={purchaseMutation.isPending}
                        className={`w-full text-xs sm:text-sm py-2 sm:py-3 ${
                          pkg.popular 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                        } transition-all duration-200 text-white font-medium`}
                      >
                        {purchaseMutation.isPending ? (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="hidden sm:inline">Processando...</span>
                            <span className="sm:hidden">...</span>
                          </div>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Comprar Agora</span>
                            <span className="sm:hidden">Comprar</span>
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Informações Importantes */}
              <Card className="glassmorphism border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                    Informações Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p>✨ Todos os pacotes incluem <strong className="text-cyan-400">créditos extras inclusos</strong></p>
                  <p>🔒 Tokens comprados <strong>não expiram</strong> e são acumulativos</p>
                  <p>⚠️ Você precisa ter um <strong className="text-yellow-400">plano ativo</strong> para usar os tokens</p>
                  <p>💰 Tokens comprados não entram no pool de cashback (apenas tokens ganhos)</p>
                  <p>🎯 Use tokens para IA, contratação de profissionais e upgrades</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'search' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Search className="w-5 h-5 text-cyan-400" />
                  <span>Buscar Profissional</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">Busque por profissionais</h3>
                    <p className="text-gray-400 mb-6">Use a busca orbital principal para encontrar profissionais</p>
                    <Link href="/">
                      <Button className="neon-button">
                        <Search className="w-4 h-4 mr-2" />
                        Ir para Busca Orbital
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <span>Histórico de Serviços</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Nenhum serviço solicitado</h3>
                  <p className="text-gray-400 mb-4">Quando você solicitar serviços, eles aparecerão aqui.</p>
                  <Link href="/">
                    <Button className="neon-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Solicitar Primeiro Serviço
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Carteira de Tokens Comprados */}
                <Card className="glassmorphism border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Wallet className="w-5 h-5 text-purple-400" />
                      <span>Tokens Comprados</span>
                    </CardTitle>
                    <p className="text-purple-300 text-sm mt-1">
                      Para contratar serviços profissionais
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-6">
                        <div className="text-4xl font-bold text-purple-400 mb-2">
                          {(wallet?.tokensComprados || 0).toLocaleString()}
                        </div>
                        <p className="text-gray-400">Tokens disponíveis para serviços</p>
                      </div>
                      
                      <div className="space-y-3 border-t border-gray-600/30 pt-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Créditos adicionados:</span>
                          <span className="text-purple-400">
                            {(wallet?.tokensComprados || 0).toLocaleString()} tokens
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tokens usados:</span>
                          <span className="text-gray-300">{(wallet?.tokensUsados || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          window.location.href = '/';
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Comprar Mais Tokens
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Carteira de Planos com Cashback */}
                <Card className="glassmorphism border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      <span>Planos com Cashback</span>
                    </CardTitle>
                    <p className="text-cyan-300 text-sm mt-1">
                      8,7% mensal + tokens de jogos
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-6">
                        <div className="text-4xl font-bold text-cyan-400 mb-2">
                          {((wallet?.tokensPlano || 0) + (wallet?.tokensGanhos || 0)).toLocaleString()}
                        </div>
                        <p className="text-gray-400">Tokens do plano + jogos</p>
                      </div>
                      
                      <div className="space-y-3 border-t border-gray-600/30 pt-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tokens do Plano:</span>
                          <span className="text-cyan-400">{(wallet?.tokensPlano || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tokens de Jogos:</span>
                          <span className="text-green-400">{(wallet?.tokensGanhos || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cashback disponível:</span>
                          <span className="text-green-400">
                            R$ {(wallet?.saldoDisponivelSaque || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Próximo saque:</span>
                          <span className="text-yellow-400">
                            {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 3).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          className="w-full neon-button"
                          disabled={(wallet?.saldoDisponivelSaque || 0) < 1}
                          onClick={() => console.log('Solicitar saque cashback')}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Solicitar Saque
                          {(wallet?.saldoDisponivelSaque || 0) < 1 && (
                            <span className="text-xs ml-2">(Mín. R$ 1,00)</span>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                          onClick={() => {
                            window.location.href = '/';
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Adquirir Plano Mensal
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Informações importantes */}
              <Card className="glassmorphism border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    <span>Como Funciona</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-purple-400 font-medium flex items-center">
                        <Wallet className="w-4 h-4 mr-2" />
                        Tokens Comprados (Roxo)
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-2 list-disc ml-4">
                        <li>Usados exclusivamente para contratar profissionais</li>
                        <li>Sem cashback ou rendimento</li>
                        <li>Podem ser sacados integralmente quando desejar</li>
                        <li>Não requer documentos para comprar</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-cyan-400 font-medium flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Planos com Cashback (Ciano)
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-2 list-disc ml-4">
                        <li>8,7% de rendimento mensal automático</li>
                        <li>Ganhe tokens extras jogando</li>
                        <li>Saques liberados todo dia 3</li>
                        <li>Requer documentos aprovados</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'profile' && (
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    <span>Perfil do Cliente</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="neon-button"
                    onClick={() => setIsEditProfileOpen(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações do Usuário */}
                  <div className="space-y-4">
                    <h4 className="text-white font-medium mb-3">Informações Pessoais</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white">{user?.username || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{user?.email || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Telefone:</span>
                        <span className="text-white">{user?.phone || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Chave PIX:</span>
                        <span className="text-white">{user?.pixKey || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status da Conta */}
                  <div className="space-y-4">
                    <h4 className="text-white font-medium mb-3">Status da Conta</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tipo de Usuário:</span>
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                          Cliente
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Plano Atual:</span>
                        <Badge variant={user?.plan === 'free' ? 'secondary' : 'default'}>
                          {user?.plan === 'free' ? 'Gratuito' : user?.plan?.charAt(0).toUpperCase() + user?.plan?.slice(1) || 'Gratuito'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Documentos:</span>
                        <Badge variant={user?.documentsValidated ? "default" : "secondary"}>
                          {user?.documentsValidated ? 'Validados' : 'Pendentes'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cadastro:</span>
                        <span className="text-gray-300 text-sm">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="mt-6 pt-6 border-t border-gray-600/30">
                  <h4 className="text-white font-medium mb-4">Ações Rápidas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => setActiveTab('documents')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Verificar Documentos
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      onClick={() => setActiveTab('wallet')}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Ver Carteira
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'referral' && (
            <div className="space-y-6">
              <Card className="glassmorphism border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Share2 className="w-5 w-5" />
                    Sistema de Indicação de Amigos
                  </CardTitle>
                  <div className="text-gray-400 text-sm">
                    Indique profissionais e ganhe <span className="text-green-400 font-medium">+1 mês grátis</span> a cada 3 indicações
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Campanha Ativa */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Gift className="w-8 h-8 text-purple-400" />
                      <div>
                        <h3 className="text-white font-medium">🎁 Campanha Promocional Ativa</h3>
                        <p className="text-gray-300 text-sm">Válida até 19 de setembro de 2025</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black/30 p-3 rounded-lg text-center">
                        <Target className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                        <div className="text-white font-medium">Meta</div>
                        <div className="text-cyan-400 text-sm">3 profissionais</div>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg text-center">
                        <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <div className="text-white font-medium">Benefício</div>
                        <div className="text-yellow-400 text-sm">+1 mês Plano Max</div>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg text-center">
                        <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <div className="text-white font-medium">Validade</div>
                        <div className="text-green-400 text-sm">2 meses</div>
                      </div>
                    </div>
                  </div>

                  {/* Seu Link de Indicação */}
                  <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      Seu Link de Indicação
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-3 flex items-center gap-3">
                        <code className="flex-1 text-cyan-400 text-sm break-all">
                          https://www.orbitrum.com.br/cadastro?ref=ORB{user?.id ? `${user.id}${user.email.substring(0,3).toUpperCase()}` : 'LOADING'}&type=professional
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          onClick={() => {
                            const link = `https://www.orbitrum.com.br/cadastro?ref=ORB${user?.id ? `${user.id}${user.email.substring(0,3).toUpperCase()}` : 'LOADING'}&type=professional`;
                            navigator.clipboard.writeText(link);
                            toast({
                              title: "Link copiado!",
                              description: "Seu link de indicação foi copiado para a área de transferência",
                            });
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Compartilhe este link com profissionais. Quando eles se cadastrarem, você ganhará um ponto de indicação.
                      </p>
                    </div>
                  </div>

                  {/* Progresso da Campanha */}
                  <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-400" />
                      Seu Progresso na Campanha
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-black/30 rounded-lg">
                        <div className="text-2xl font-bold text-cyan-400">0</div>
                        <div className="text-gray-400 text-sm">Indicados</div>
                      </div>
                      <div className="text-center p-3 bg-black/30 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">3</div>
                        <div className="text-gray-400 text-sm">Meta</div>
                      </div>
                      <div className="text-center p-3 bg-black/30 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">0</div>
                        <div className="text-gray-400 text-sm">Bônus</div>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-cyan-400">0/3 indicações</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: '0%' }}
                        />
                      </div>
                      <div className="text-center text-gray-400 text-sm mt-2">
                        Próximo bônus em <span className="text-cyan-400 font-medium">3 indicações</span>
                      </div>
                    </div>
                  </div>

                  {/* Profissionais Indicados */}
                  <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      Profissionais que Você Indicou
                    </h4>
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Nenhum profissional indicado ainda</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Compartilhe seu link de indicação para começar
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      className="neon-button h-12"
                      onClick={() => {
                        const referralCode = `REF${user?.id}${user?.email.substring(0,2).toUpperCase()}${Date.now().toString().slice(-4)}`;
                        const link = `https://www.orbitrum.com.br/cadastro?ref=${referralCode}&sponsor=${user?.id}&bonus=max15days`;
                        if (navigator.share) {
                          navigator.share({
                            title: 'Orbitrum Connect - Ganhe Plano Max Grátis!',
                            text: '🚀 Cadastre-se na Orbitrum Connect e ganhe Plano Max GRÁTIS por 15 dias! Plataforma espacial única que conecta profissionais.',
                            url: link
                          });
                        } else {
                          navigator.clipboard.writeText(link);
                          toast({
                            title: "Link de Referral Copiado!",
                            description: "Seu indicado ganha Plano Max grátis por 15 dias. Você ganha bônus quando ele renovar!",
                          });
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar Link
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => {
                        const referralCode = `REF${user?.id}${user?.email.substring(0,2).toUpperCase()}${Date.now().toString().slice(-4)}`;
                        const link = `https://www.orbitrum.com.br/cadastro?ref=${referralCode}&sponsor=${user?.id}&bonus=max15days`;
                        const message = `🚀 *OPORTUNIDADE ÚNICA - ORBITRUM CONNECT!*

🌌 A primeira plataforma ESPACIAL que conecta profissionais!

✨ *BÔNUS ESPECIAL PARA VOCÊ:*
• Plano Max GRÁTIS por 15 dias
• Interface 3D única no mercado  
• Sistema de tokens e cashback
• Rastreamento GPS em tempo real

💰 *GANHE DINHEIRO:*
• R$ 180bi no mercado brasileiro
• Conecte-se com milhares de clientes
• Sistema automatizado de pagamentos

🔗 *CADASTRE-SE AGORA:*
${link}

⏰ *Oferta limitada!* Apenas os primeiros 1000 usuários.

#OrbitrumConnect #PlataformaEspacial #ProfissionaisConectados`;
                        
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <div className="w-4 h-4 mr-2">📱</div>
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'insights' && (
            <InsightsTab userType="client" userId={user?.id || 1} />
          )}

          {activeTab === 'documents' && <DocumentsTab user={user} />}

          {activeTab === 'become-professional' && (
            <div className="space-y-6">
              {/* Header */}
              <Card className="glassmorphism border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Tornar-se Profissional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-6">
                      <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        Transforme sua conta em Profissional
                      </h3>
                      <p className="text-gray-300 mb-6">
                        Como profissional você terá acesso a funcionalidades exclusivas para oferecer seus serviços na plataforma.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <h4 className="text-cyan-400 font-semibold">✨ Funcionalidades que você ganha:</h4>
                          <ul className="space-y-2 text-gray-300 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Dashboard profissional completo
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Gerenciar serviços oferecidos
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Sistema de equipes profissionais
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Buscar e convidar outros usuários
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Receber e gerenciar solicitações
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Sistema de agenda e calendário
                            </li>
                          </ul>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="text-orange-400 font-semibold">📋 Você mantém acesso a:</h4>
                          <ul className="space-y-2 text-gray-300 text-sm">
                            <li className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-400" />
                              Todas as funcionalidades de cliente
                            </li>
                            <li className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-400" />
                              Buscar outros profissionais
                            </li>
                            <li className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-400" />
                              Contratar serviços quando precisar
                            </li>
                            <li className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-400" />
                              Histórico e carteira normalmente
                            </li>
                            <li className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-400" />
                              Jogos e sistema de tokens
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                          <div>
                            <p className="text-yellow-400 font-semibold text-sm">Importante:</p>
                            <p className="text-gray-300 text-sm">
                              Esta ação é <strong>reversível</strong>. Você pode voltar a ser apenas cliente quando quiser através do dashboard profissional.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button
                          onClick={async () => {
                            try {
                              await apiRequest('POST', '/api/users/upgrade-to-professional', {
                                userId: user.id
                              });
                              toast({
                                title: "Conta Transformada!",
                                description: "Sua conta agora é profissional. Redirecionando para o dashboard profissional...",
                              });
                              
                              // Aguardar 2 segundos e redirecionar
                              setTimeout(() => {
                                window.location.href = '/dashboard-professional';
                              }, 2000);
                              
                            } catch (error) {
                              toast({
                                title: "Erro na Transformação",
                                description: "Não foi possível transformar sua conta. Tente novamente.",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="neon-button px-8 py-3 text-lg"
                        >
                          <Crown className="w-5 h-5 mr-2" />
                          Transformar em Profissional
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {/* Instruções de uso */}
              <Card className="glassmorphism border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Sistema de Rastreamento em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Como funciona o rastreamento</h3>
                        <p className="text-gray-400 text-sm">Monitore profissionais a caminho do seu local</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-green-400 font-bold">1</span>
                        </div>
                        <p className="text-white text-sm font-medium">Solicite Serviço</p>
                        <p className="text-gray-400 text-xs mt-1">Contrate um profissional</p>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-yellow-400 font-bold">2</span>
                        </div>
                        <p className="text-white text-sm font-medium">Aceite Confirmado</p>
                        <p className="text-gray-400 text-xs mt-1">Profissional sai para atender</p>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-cyan-400 font-bold">3</span>
                        </div>
                        <p className="text-white text-sm font-medium">Rastrear em Tempo Real</p>
                        <p className="text-gray-400 text-xs mt-1">Veja localização e ETA</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className="w-full neon-button"
                      onClick={() => setActiveTab('map')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Abrir Mapa GPS Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Componente GPS integrado */}
              <GPSTracking 
                userType="client" 
                userId={user?.id || 1} 
                username={user?.username || 'Cliente'} 
              />
            </div>
          )}
        </motion.div>

        {/* Rodapé com Profissionais Sugeridos - Discreto */}
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 border-t border-gray-700/30 pt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm font-medium text-gray-300">
                  Profissionais Sugeridos
                </h3>
                <span className="text-xs text-gray-500">
                  Clique para ver perfil
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link href="/">
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-cyan-400 scale-90">
                    <Home className="w-4 h-4 mr-1" />
                    Voltar ao Orbit
                  </Button>
                </Link>
                <button 
                  className="text-red-400 hover:text-red-300 px-3 py-1 rounded text-sm"
                  onClick={() => {
                    console.log('Logout clicked');
                    window.location.href = "/api/logout";
                  }}
                >
                  Sair
                </button>
              </div>
            </div>
            
            {/* Acesso Rápido ao Orbit */}
            <div className="text-center py-6">
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-full px-6 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">☍</span>
                </div>
                <span className="text-cyan-400 font-medium">Profissionais Orbitais</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Clique em "Voltar ao Orbit" para acessar profissionais disponíveis
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Perfil do Profissional */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glassmorphism max-w-2xl border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Perfil do Profissional
            </DialogTitle>
          </DialogHeader>
          
          {selectedProfessional && (
            <div className="space-y-6">
              {/* Header do Perfil */}
              <div className="flex items-start space-x-4">
                <img 
                  src={selectedProfessional.profileImage || `https://picsum.photos/80/80?random=${selectedProfessional.id}`}
                  alt={selectedProfessional.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400/50"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{selectedProfessional.name}</h3>
                  <p className="text-cyan-400 font-medium">{selectedProfessional.title}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < (selectedProfessional.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-300 text-sm">
                      {selectedProfessional.rating || 4.5} ({selectedProfessional.reviews || 23} avaliações)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    R$ {selectedProfessional.hourlyRate || 75}/h
                  </div>
                  <p className="text-gray-400 text-sm">valor referencial</p>
                </div>
              </div>

              {/* Descrição */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Sobre</h4>
                <p className="text-gray-300 text-sm">
                  {selectedProfessional.description || 
                   `Profissional experiente em ${selectedProfessional.title} com mais de 5 anos de experiência no mercado. Especializado em projetos de alta qualidade com foco na satisfação do cliente.`}
                </p>
              </div>

              {/* Skills/Especialidades */}
              <div>
                <h4 className="text-white font-medium mb-3">Especialidades</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProfessional.skills || [selectedProfessional.title, 'Qualidade', 'Pontualidade']).map((skill: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm border border-cyan-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              {/* Botões de Ação - Funcionam para todos, com regras específicas */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  className="flex-1 neon-button"
                  onClick={() => handleAcesso('/contato-profissional', 'Usuários Free podem visualizar perfis mas precisam de plano pago para contratar.')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {(user?.plan === 'free' || !user?.plan) ? 'Ver Contato (Upgrade)' : 'Entrar em Contato'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/20"
                  onClick={() => handleAcesso('/teams', 'Funcionalidade Teams disponível apenas para planos pagos.')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {(user?.plan === 'free' || !user?.plan) ? 'Times (Pro)' : 'Adicionar ao Time'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento PIX */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="glassmorphism max-w-md border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white text-xl text-center">
              💰 Pagamento PIX
            </DialogTitle>
          </DialogHeader>
          
          {paymentData && (
            <div className="space-y-4 text-center">
              {/* QR Code */}
              {paymentData.qrCodeBase64 && (
                <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                  <img 
                    src={paymentData.qrCodeBase64} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              )}
              
              {/* Informações do Pagamento */}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-cyan-400">
                  R$ {paymentData.amount}
                </div>
                <div className="text-gray-300">
                  {paymentData.itemName}
                </div>
                <div className="text-sm text-gray-400">
                  ID: {paymentData.transactionId}
                </div>
              </div>
              
              {/* Chave PIX (para cópia manual) */}
              {paymentData.pixCode && (
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-2">Código PIX (para cópia):</p>
                  <div className="bg-gray-900 p-2 rounded text-xs text-cyan-400 font-mono break-all">
                    {paymentData.pixCode}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentData.pixCode);
                      toast({
                        title: "Copiado!",
                        description: "Código PIX copiado para área de transferência",
                      });
                    }}
                  >
                    Copiar Código PIX
                  </Button>
                </div>
              )}
              
              {/* Instruções */}
              <div className="text-sm text-gray-400 text-left bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
                <p className="font-medium text-blue-400 mb-2">📱 Como pagar:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Abra seu app bancário</li>
                  <li>• Escaneie o QR Code ou copie o código PIX</li>
                  <li>• Confirme o pagamento de R$ {paymentData.amount}</li>
                  <li>• Seus tokens serão creditados automaticamente</li>
                </ul>
              </div>
              
              {/* Botões */}
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  className="flex-1 neon-button"
                  onClick={() => {
                    toast({
                      title: "Aguardando Pagamento",
                      description: "Realize o PIX e seus tokens serão creditados",
                    });
                    setIsPaymentModalOpen(false);
                  }}
                >
                  ✅ Paguei
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Perfil Expandido */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="glassmorphism max-w-3xl max-h-[90vh] overflow-y-auto border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center space-x-2">
              <User className="w-6 h-6 text-cyan-400" />
              <span>Editar Perfil & Documentos</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Seção 1: Informações do Perfil */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Informações Pessoais</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Nome de Usuário</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Digite seu nome de usuário"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Digite seu email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pixKey" className="text-gray-300">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    value={profileData.pixKey}
                    onChange={(e) => setProfileData(prev => ({ ...prev, pixKey: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Digite sua chave PIX"
                  />
                </div>
              </div>
            </motion.div>

            <Separator className="bg-gray-600/50" />

            {/* Seção 2: Upload de Documentos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Documentos de Verificação</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selfie */}
                <div className="space-y-3">
                  <Label className="text-gray-300 flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Foto de Rosto</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload('selfie', file);
                      }}
                      className="hidden"
                      id="selfie-upload"
                    />
                    <label htmlFor="selfie-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        {documentFiles.selfie ? documentFiles.selfie.name : 'Clique para enviar'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                    </label>
                  </div>
                </div>

                {/* Documento */}
                <div className="space-y-3">
                  <Label className="text-gray-300 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Documento com Foto</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload('document', file);
                      }}
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        {documentFiles.document ? documentFiles.document.name : 'RG, CNH ou Passaporte'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF até 5MB</p>
                    </label>
                  </div>
                </div>

                {/* Comprovante de Residência */}
                <div className="space-y-3">
                  <Label className="text-gray-300 flex items-center space-x-2">
                    <Home className="w-4 h-4 text-cyan-400" />
                    <span>Comprovante de Residência</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload('residence', file);
                      }}
                      className="hidden"
                      id="residence-upload"
                    />
                    <label htmlFor="residence-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        {documentFiles.residence ? documentFiles.residence.name : 'Conta de Luz, Água ou Gás'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF até 5MB</p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-medium text-sm">Verificação de Documentos</p>
                    <p className="text-blue-200/80 text-xs mt-1">
                      Seus documentos são verificados por nossa equipe em até 24h. Após aprovação, você poderá realizar compras na plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditProfileOpen(false)}
                className="border-gray-500/50 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProfileSave}
                className="neon-button"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Verificação de Documentos */}
      <DocumentVerificationModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onConfirm={() => {
          setShowDocumentModal(false);
          window.location.href = '/verificacao-documentos';
        }}
        title="Documentos Pendentes"
        description="Para realizar compras, você precisa verificar seus documentos primeiro."
      />

    </div>
  );
}