import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Activity,
  Bell, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  Calendar, 
  Star,
  TrendingUp,
  Settings,
  FileText,
  Wallet,
  Clock,
  User,
  MapPin,
  Home,
  Upload,
  Image as ImageIcon,
  Shield,
  Save,
  RotateCcw,
  Trash2,
  BarChart3,
  Download,
  Users,
  UserPlus,
  Building,
  Search,
  Camera,
  FileImage,
  Plus,
  Edit,
  Briefcase,
  ChevronDown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CertificationSystem } from "./CertificationSystem";
import MiniMap from "@/components/MiniMap";
import GPSTracking from "@/components/GPSTracking";
import ProfessionalInsights from "@/components/ProfessionalInsights";
import ProfessionalCalendarInsights from "@/components/ProfessionalCalendarInsights";
import MobileOptimizedTabs from "./MobileOptimizedTabs";
import CleanProfessionalDashboard from "./CleanProfessionalDashboard";

// Função para tracking de comportamento dos dropdowns
const trackDropdownClick = async (category: string, tab: string, user: any) => {
  try {
    await apiRequest("POST", "/api/analytics/track", {
      event: "dropdown_click",
      data: {
        category,
        tab,
        dashboardType: "professional",
        newInterface: true,
        userEmail: user?.email || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
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

export function ProfessionalDashboard({ user }: ProfessionalDashboardProps) {
  return <CleanProfessionalDashboard user={user} />;
  const [activeTab, setActiveTab] = useState('overview');
  const [requestsTab, setRequestsTab] = useState('pending');
  const [teamSubTab, setTeamSubTab] = useState('overview');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    cpf: '',
    photo: null as File | null,
    documents: null as File | null
  });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [enabledServices, setEnabledServices] = useState<string[]>([
    "Pintura Residencial", "Reparos em Parede" // Serviços já habilitados
  ]);
  const [customServices, setCustomServices] = useState<Array<{name: string, description: string}>>([
    // Serviços personalizados já criados
  ]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
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
  
  // Notificar atividades do dashboard em tempo real para admin
  useEffect(() => {
    if (user?.username && activeTab) {
      console.log('📊 ATIVIDADE TEMPO REAL - Dashboard Profissional:', {
        user: user.username,
        activeTab,
        timestamp: new Date().toISOString(),
        userType: 'professional'
      });
    }
  }, [activeTab, user]);
  const [, setLocation] = useLocation();

  const { data: pendingRequests } = useQuery({
    queryKey: ['/api/services/pending'],
    enabled: !!user.id,
  });

  const { data: acceptedServices } = useQuery({
    queryKey: ['/api/services/accepted'],
    enabled: !!user.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/professional/stats', user.id],
    enabled: !!user.id,
  });

  const { data: wallet } = useQuery({
    queryKey: ['/api/users', user.id, 'wallet'],
    enabled: !!user.id,
  });

  // Query para buscar chats ativos do profissional
  const { data: activeChats } = useQuery({
    queryKey: ['/api/chats'],
    enabled: !!user.id,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Dados reais do dashboard profissional
  const realStats = stats || {
    totalEarnings: 0,
    completedJobs: 0,
    averageRating: 0,
    responseTime: '0 min',
    completionRate: 0
  };

  const realWallet = wallet || { 
    tokensPlano: 0, 
    tokensGanhos: 0, 
    tokensComprados: 0, 
    totalTokens: 0, 
    cashbackAcumulado: 0 
  };

  const realPendingRequests = pendingRequests || [];
  const realAcceptedServices = acceptedServices || [];
  const realActiveChats = activeChats || [];

  // Queries para sistema de equipes profissionais
  const { data: professionalTeam } = useQuery({
    queryKey: ['/api/professional-teams', user.id],
    enabled: !!user.id,
  });

  const { data: teamEmployees, refetch: refetchEmployees } = useQuery({
    queryKey: ['/api/professional-teams/employees', professionalTeam?.id],
    enabled: !!professionalTeam?.id,
  });

  // Query para status do auto-aceitar
  const { data: autoAcceptStatus, refetch: refetchAutoAcceptStatus } = useQuery({
    queryKey: ['/api/professional', user.id, 'auto-accept'],
    enabled: !!user.id,
  });

  // Atualizar estado local quando a query retorna dados
  useEffect(() => {
    if (autoAcceptStatus) {
      setAutoAcceptEnabled(autoAcceptStatus.enabled);
    }
  }, [autoAcceptStatus]);

  // Função para atualizar configuração de auto-aceitar
  const updateAutoAccept = async (enabled: boolean) => {
    try {
      const result = await apiRequest("POST", `/api/professional/${user.id}/auto-accept`, {
        enabled
      });

      if (result.success) {
        setAutoAcceptEnabled(enabled);
        await refetchAutoAcceptStatus();
        
        toast({
          title: enabled ? "Auto-Aceitar Ativado" : "Auto-Aceitar Desativado",
          description: enabled 
            ? "Solicitações serão aceitas automaticamente em 1 hora" 
            : "Solicitações não serão mais aceitas automaticamente",
          variant: "default"
        });
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar configuração",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar auto-aceitar:", error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive"
      });
    }
  };

  const { data: userSearchResults } = useQuery({
    queryKey: ['/api/professional-teams/search-users', searchQuery],
    enabled: !!searchQuery && searchQuery.length > 2,
  });

  const { data: pendingInvitations } = useQuery({
    queryKey: ['/api/professional-teams/invitations', user.id],
    enabled: !!user.id,
  });

  // Query para buscar solicitações de equipe para o profissional
  const { data: teamRequests } = useQuery({
    queryKey: ['/api/team-requests/professional', user.id],
    enabled: !!user.id,
  });

  // Separar solicitações por status
  const pendingTeamRequests = teamRequests?.filter(req => req.status === 'pending') || [];
  const trashedRequests = teamRequests?.filter(req => req.status === 'trashed') || [];
  const acceptedTeamRequests = teamRequests?.filter(req => req.status === 'accepted') || [];

  // Função para restaurar solicitação da lixeira
  const restoreRequest = async (requestId: number) => {
    try {
      await apiRequest('PATCH', `/api/team-requests/${requestId}/restore`);
      queryClient.invalidateQueries(['/api/team-requests/professional', user.id]);
      toast({
        title: "Solicitação Restaurada",
        description: "A solicitação foi movida de volta para pendentes.",
      });
    } catch (error) {
      console.error('Erro ao restaurar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar a solicitação.",
        variant: "destructive",
      });
    }
  };

  const searchPlatformUsers = async (query: string) => {
    try {
      const response = await apiRequest('GET', `/api/users/search?query=${encodeURIComponent(query)}`);
      setSearchUsers(response?.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setSearchUsers([]);
    }
  };

  // Funções para gerenciamento de equipes profissionais
  const createProfessionalTeam = async () => {
    try {
      const teamData = {
        professionalId: user.id,
        teamName: `Equipe ${user.username}`,
        companyName: user.companyName || `Empresa ${user.username}`,
        cnpj: user.cnpj || '',
        description: 'Equipe profissional especializada',
        maxEmployees: 10
      };

      await apiRequest('POST', '/api/professional-teams', teamData);
      queryClient.invalidateQueries(['/api/professional-teams', user.id]);
      toast({
        title: "Equipe Criada",
        description: "Sua equipe profissional foi criada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a equipe.",
        variant: "destructive",
      });
    }
  };

  const addNewEmployee = async () => {
    try {
      const employeeData = {
        teamId: professionalTeam.id,
        name: newEmployee.name,
        cpf: newEmployee.cpf,
        photoUrl: '', // TODO: Upload de imagem
        documents: '', // TODO: Upload de documentos
        status: 'active'
      };

      await apiRequest('POST', '/api/professional-teams/employees', employeeData);
      refetchEmployees();
      setNewEmployee({ name: '', cpf: '', photo: null, documents: null });
      setShowAddEmployeeModal(false);
      toast({
        title: "Funcionário Adicionado",
        description: "O funcionário foi adicionado à equipe com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o funcionário.",
        variant: "destructive",
      });
    }
  };

  const inviteUserToTeam = async (userId: number) => {
    try {
      const invitationData = {
        teamId: professionalTeam.id,
        invitedUserId: userId,
        message: `Você foi convidado para fazer parte da equipe ${professionalTeam.teamName}`
      };

      await apiRequest('POST', '/api/professional-teams/invitations', invitationData);
      toast({
        title: "Convite Enviado",
        description: "O convite foi enviado para o usuário!",
      });
      setShowInviteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    }
  };

  const removeEmployee = async (employeeId: number) => {
    try {
      await apiRequest('DELETE', `/api/professional-teams/employees/${employeeId}`);
      refetchEmployees();
      toast({
        title: "Funcionário Removido",
        description: "O funcionário foi removido da equipe.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o funcionário.",
        variant: "destructive",
      });
    }
  };

  // Funções para aceitar e rejeitar solicitações
  const acceptRequest = async (requestId: number) => {
    try {
      await apiRequest('PATCH', `/api/team-requests/${requestId}/accept`);
      queryClient.invalidateQueries(['/api/team-requests/professional', user.id]);
      toast({
        title: "Solicitação Aceita",
        description: "Você aceitou a solicitação de equipe!",
      });
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a solicitação.",
        variant: "destructive",
      });
    }
  };

  const rejectRequest = async (requestId: number) => {
    try {
      await apiRequest('PATCH', `/api/team-requests/${requestId}/reject`);
      queryClient.invalidateQueries(['/api/team-requests/professional', user.id]);
      toast({
        title: "Solicitação Rejeitada",
        description: "A solicitação foi movida para canceladas.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação.",
        variant: "destructive",
      });
    }
  };

  const pendingCount = pendingRequests?.length || 0;
  const acceptedCount = acceptedServices?.length || 0;
  const tokensEarned = wallet?.tokensGanhos || 0;
  const rating = stats?.averageRating || 0;

  // Atualizar dados do perfil quando user muda
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        pixKey: user.pixKey || '',
      });
    }
  }, [user]);

  const handleProfileSave = async () => {
    try {
      // Aqui seria a lógica para salvar as mudanças do perfil
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
      setIsEditProfileOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    }
  };

  const handleDocumentUpload = (type: 'selfie' | 'document' | 'residence', file: File) => {
    setDocumentFiles(prev => ({
      ...prev,
      [type]: file
    }));
    
    toast({
      title: "Documento Selecionado",
      description: `${file.name} foi selecionado para upload.`,
    });
  };

  const TabButton = ({ id, label, icon: Icon, isActive, badge }: any) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 relative px-3 py-3 sm:px-4 sm:py-2 h-auto min-h-[44px] touch-manipulation transition-all duration-300 ${
        isActive 
          ? "neon-button text-black font-medium shadow-lg" 
          : "text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 active:bg-cyan-500/20"
      }`}
    >
      <Icon className="w-4 h-4 sm:w-4 sm:h-4" />
      <span className="text-sm sm:text-base font-medium">{label}</span>
      {badge && (
        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
          {badge}
        </Badge>
      )}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gray-900" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard Profissional
            </h1>
            <p className="text-gray-300">
              Bem-vindo, {user.username}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/dashboard-selector">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400">
                ← Escolher Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400 scale-90">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Orbit
              </Button>
            </Link>
            <Button className="neon-button flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glassmorphism border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Solicitações Pendentes</p>
                  <p className="text-white font-semibold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Serviços Aceitos</p>
                  <p className="text-white font-semibold">{acceptedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Avaliação Média</p>
                  <p className="text-white font-semibold">{rating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism border-cyan-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Tokens Ganhos</p>
                  <p className="text-white font-semibold">{tokensEarned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Mobile Optimized Navigation - Dashboard Profissional */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <MobileOptimizedTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          trackDropdownClick={trackDropdownClick}
          user={user}
        /> 
              className="w-64 bg-gray-900/95 border-cyan-500/30 backdrop-blur-sm shadow-2xl"
              style={{ boxShadow: "0 0 30px rgba(6, 182, 212, 0.2)" }}
            >
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('dashboard', 'overview', user);
                setActiveTab('overview');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white">Visão Geral</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('dashboard', 'map', user);
                setActiveTab('map');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-white">🗺️ Mapa GPS</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('dashboard', 'my-services', user);
                setActiveTab('my-services');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span className="text-white">⚙️ Meus Serviços</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('dashboard', 'custom-services', user);
                setActiveTab('custom-services');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="text-white">🎯 Serviços Personalizados</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('dashboard', 'my-team', user);
                setActiveTab('my-team');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-cyan-500/20 cursor-pointer transition-colors">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-white">Minha Equipe</span>
                {teamEmployees?.length > 0 && (
                  <Badge className="bg-indigo-500 text-white">{teamEmployees.length}</Badge>
                )}
              </DropdownMenuItem>

      </motion.div>
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
                <User className="w-4 h-4 text-violet-400" />
                <span className="text-white">Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('conta', 'wallet', user);
                setActiveTab('wallet');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-500/20 cursor-pointer transition-colors">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-white">Carteira</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('conta', 'certifications', user);
                setActiveTab('certifications');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-500/20 cursor-pointer transition-colors">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-white">🏗️ Certificações</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Comunicação - Interações e Relacionamentos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
                  border: "1px solid rgba(99, 102, 241, 0.5)"
                }}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium text-sm">💬 Comunicação</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-64 bg-gray-900/95 border-indigo-500/30 backdrop-blur-sm shadow-2xl"
              style={{ boxShadow: "0 0 30px rgba(99, 102, 241, 0.2)" }}
            >
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('comunicacao', 'pending', user);
                setActiveTab('pending');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-indigo-500/20 cursor-pointer transition-colors">
                <Bell className="w-4 h-4 text-red-400" />
                <span className="text-white">Solicitações</span>
                {pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white">{pendingCount}</Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('comunicacao', 'accepted', user);
                setActiveTab('accepted');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-indigo-500/20 cursor-pointer transition-colors">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-white">Serviços Aceitos</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('comunicacao', 'chats', user);
                setActiveTab('chats');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-indigo-500/20 cursor-pointer transition-colors">
                <MessageCircle className="w-4 h-4 text-pink-400" />
                <span className="text-white">💬 Chats Ativos</span>
                {activeChats?.length > 0 && (
                  <Badge className="bg-pink-500 text-white">{activeChats.length}</Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('comunicacao', 'calendar', user);
                setActiveTab('calendar');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-indigo-500/20 cursor-pointer transition-colors">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span className="text-white">📅 Calendário</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. Crescimento - Expansão e Performance */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{
                  boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)",
                  border: "1px solid rgba(34, 197, 94, 0.5)"
                }}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium text-sm">🚀 Crescimento</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-64 bg-gray-900/95 border-green-500/30 backdrop-blur-sm shadow-2xl"
              style={{ boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)" }}
            >
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('crescimento', 'insights', user);
                setActiveTab('insights');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-green-500/20 cursor-pointer transition-colors">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span className="text-white">📊 Análise Inteligente</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                trackDropdownClick('crescimento', 'calendar-insights', user);
                setActiveTab('calendar-insights');
              }} className="flex items-center space-x-3 px-4 py-3 hover:bg-green-500/20 cursor-pointer transition-colors">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span className="text-white">📅 Calendário Inteligente</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'map' && (
          <div>
            <GPSTracking 
              userType="professional" 
              userId={user?.id || 1} 
              username={user?.username || 'Profissional'} 
            />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>Atividade Recente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Nenhuma atividade recente</h3>
                  <p className="text-gray-400">Suas atividades e notificações aparecerão aqui.</p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Taxa de Resposta:</span>
                    <span className="text-green-400 font-semibold">{realStats.completionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Serviços Concluídos:</span>
                    <span className="text-white font-semibold">{realStats.completedJobs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avaliação Média:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tempo Médio de Resposta:</span>
                    <span className="text-cyan-400 font-semibold">{realStats.responseTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'my-services' && (
          <Card className="glassmorphism border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span>Gerenciar Meus Serviços</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Selecione quais serviços da sua categoria profissional você oferece no Orbitrum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Determinar categoria do profissional (simulado - em produção viria do banco)
                const professionalCategory = "Casa e Construção"; // Pode ser "Tecnologia", "Cuidados Pessoais", etc.
                const availableServices = [
                  "Pintura Residencial", "Pintura Comercial", "Textura e Grafiato", 
                  "Impermeabilização", "Reparos em Parede", "Limpeza Pós-Obra",
                  "Pedreiro Geral", "Alvenaria", "Reboco e Massa", "Pisos e Azulejos",
                  "Eletricista Residencial", "Eletricista Predial", "Instalação de Ventiladores",
                  "Encanador Geral", "Desentupimento", "Vazamentos"
                ];

                const toggleService = (service: string) => {
                  setEnabledServices(prev => 
                    prev.includes(service) 
                      ? prev.filter(s => s !== service)
                      : [...prev, service]
                  );
                };

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium mb-1">Categoria: {professionalCategory}</h3>
                        <p className="text-gray-400 text-sm">
                          {enabledServices.length} de {availableServices.length} serviços habilitados
                        </p>
                      </div>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={async () => {
                          try {
                            // Aqui salvaria no backend via API
                            await apiRequest("POST", "/api/professional/services", {
                              services: enabledServices
                            });
                            toast({
                              title: "Serviços Atualizados",
                              description: `${enabledServices.length} serviços salvos com sucesso!`,
                            });
                          } catch (error) {
                            toast({
                              title: "Erro",
                              description: "Não foi possível salvar os serviços.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableServices.map((service) => {
                        const isEnabled = enabledServices.includes(service);
                        return (
                          <div
                            key={service}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isEnabled
                                ? "border-cyan-500/50 bg-cyan-500/10"
                                : "border-gray-600/50 bg-gray-800/30 hover:border-gray-500/50"
                            }`}
                            onClick={() => toggleService(service)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-white font-medium mb-1">{service}</h4>
                                <p className="text-gray-400 text-sm">
                                  {isEnabled ? "✅ Habilitado" : "⭕ Desabilitado"}
                                </p>
                              </div>
                              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${
                                isEnabled ? "bg-cyan-500" : "bg-gray-600"
                              }`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                  isEnabled ? "translate-x-6" : "translate-x-0"
                                }`} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4 border border-yellow-500/30">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <Bell className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-1">Como Funciona</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            • Apenas serviços <strong>habilitados</strong> aparecerão para clientes no sistema orbital<br/>
                            • Você pode habilitar/desabilitar serviços a qualquer momento<br/>
                            • Clientes verão seus serviços e poderão solicitar orçamentos<br/>
                            • Preços são baseados no sistema de tokens da plataforma
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {activeTab === 'custom-services' && (
          <Card className="glassmorphism border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Serviços Personalizados</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Crie serviços únicos que você oferece. Aparecerão no sistema orbital com preço fixo de 2000 tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Formulário para criar novo serviço personalizado */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/30">
                  <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Criar Novo Serviço Personalizado</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="service-name" className="text-gray-300">Nome do Serviço</Label>
                      <Input
                        id="service-name"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Ex: Consultoria Especializada em Pintura Artística"
                        className="bg-gray-700/50 border-gray-600 text-white mt-1"
                        maxLength={60}
                      />
                      <p className="text-gray-400 text-xs mt-1">{newServiceName.length}/60 caracteres</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="service-description" className="text-gray-300">Descrição Detalhada</Label>
                      <textarea
                        id="service-description"
                        value={newServiceDescription}
                        onChange={(e) => setNewServiceDescription(e.target.value)}
                        placeholder="Descreva em detalhes o que inclui este serviço, sua especialidade, diferencial..."
                        className="w-full h-24 bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white mt-1 resize-none"
                        maxLength={200}
                      />
                      <p className="text-gray-400 text-xs mt-1">{newServiceDescription.length}/200 caracteres</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                          <Wallet className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Preço Fixo: 2000 tokens</p>
                          <p className="text-gray-400 text-sm">Todos os serviços personalizados têm o mesmo valor</p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => {
                          if (newServiceName.trim() && newServiceDescription.trim()) {
                            setCustomServices(prev => [...prev, {
                              name: newServiceName.trim(),
                              description: newServiceDescription.trim()
                            }]);
                            setNewServiceName('');
                            setNewServiceDescription('');
                            toast({
                              title: "Serviço Criado",
                              description: "Serviço personalizado adicionado com sucesso!",
                            });
                          } else {
                            toast({
                              title: "Campos Obrigatórios",
                              description: "Preencha nome e descrição do serviço.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!newServiceName.trim() || !newServiceDescription.trim()}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Criar Serviço
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de serviços personalizados criados */}
                <div>
                  <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span>Meus Serviços Personalizados ({customServices.length})</span>
                  </h3>
                  
                  {customServices.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-600/50">
                      <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <h4 className="text-white font-medium mb-2">Nenhum serviço personalizado</h4>
                      <p className="text-gray-400">Crie serviços únicos que destacam suas especialidades</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customServices.map((service, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-green-500/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                <span>{service.name}</span>
                              </h4>
                              <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                                {service.description}
                              </p>
                              <div className="flex items-center space-x-4">
                                <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
                                  2000 tokens
                                </Badge>
                                <Badge variant="outline" className="text-green-400 border-green-500/50">
                                  ✅ Ativo no Orbital
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-600/20"
                              onClick={() => {
                                setCustomServices(prev => prev.filter((_, i) => i !== index));
                                toast({
                                  title: "Serviço Removido",
                                  description: "Serviço personalizado foi removido.",
                                  variant: "destructive",
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informações importantes */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-yellow-500/30">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Bell className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Informações Importantes</h4>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• Serviços personalizados aparecem no sistema orbital automaticamente</li>
                        <li>• Preço fixo de <strong>2000 tokens</strong> para todos os serviços personalizados</li>
                        <li>• Clientes podem solicitar seus serviços únicos diretamente</li>
                        <li>• Você pode criar até 5 serviços personalizados por categoria</li>
                        <li>• Descrições detalhadas ajudam clientes a entender seu diferencial</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'my-team' && (
          <div className="space-y-6">
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Minha Equipe Profissional</span>
                  {teamEmployees?.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300">
                      {teamEmployees.length} funcionários
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie sua equipe de funcionários parceiros. Como empresa/CNPJ, você pode formar uma equipe com desconto de 10% adicional nos serviços.
                </CardDescription>
                
                {/* Sub-abas para gerenciamento da equipe */}
                <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setTeamSubTab('overview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      teamSubTab === 'overview'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Building className="w-4 h-4 mr-2 inline" />
                    Visão Geral
                  </button>
                  <button
                    onClick={() => setTeamSubTab('add-employee')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      teamSubTab === 'add-employee'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2 inline" />
                    Adicionar Funcionário
                  </button>
                  <button
                    onClick={() => setTeamSubTab('search-platform')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      teamSubTab === 'search-platform'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Search className="w-4 h-4 mr-2 inline" />
                    Buscar na Plataforma
                  </button>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Conteúdo das sub-abas */}
                {teamSubTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Estatísticas da Equipe */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-800/50 border-gray-600/30">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                              <Users className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-white">{teamEmployees?.length || 0}</p>
                              <p className="text-gray-400 text-sm">Funcionários</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800/50 border-gray-600/30">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <Briefcase className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-white">10%</p>
                              <p className="text-gray-400 text-sm">Desconto Profissional</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800/50 border-gray-600/30">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <Building className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-white">Ativa</p>
                              <p className="text-gray-400 text-sm">Status Empresa</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Lista da Equipe */}
                    {(!teamEmployees || teamEmployees.length === 0) ? (
                      <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-600/30">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-lg font-medium mb-2">Nenhum Funcionário Cadastrado</h3>
                        <p className="text-gray-400 max-w-md mx-auto mb-6">
                          Comece a montar sua equipe de funcionários parceiros. Você pode adicionar novos colaboradores ou buscar profissionais já cadastrados na plataforma.
                        </p>
                        <div className="space-x-3">
                          <Button 
                            onClick={() => setTeamSubTab('add-employee')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Adicionar Funcionário
                          </Button>
                          <Button 
                            onClick={() => setTeamSubTab('search-platform')}
                            variant="outline"
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-900/20"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Buscar na Plataforma
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {teamEmployees.map((employee, index) => (
                          <Card key={index} className="bg-gray-800/50 border-gray-600/30">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium">{employee.name}</h4>
                                    <p className="text-gray-400 text-sm">CPF: {employee.cpf}</p>
                                    <p className="text-cyan-300 text-sm">
                                      {employee.fromPlatform ? '🔗 Usuário da Plataforma' : '📝 Funcionário Cadastrado'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-500/50 text-blue-400 hover:bg-blue-900/20"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {teamSubTab === 'add-employee' && (
                  <div className="space-y-6">
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <UserPlus className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-1">Adicionar Funcionário Parceiro</h4>
                          <p className="text-gray-400 text-sm">
                            Cadastre um novo funcionário com nome, CPF, foto e documentos. Como profissional/empresa, você terá 10% de desconto adicional na formação de equipes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gray-800/50 border-gray-600/30">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Dados Básicos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="employee-name" className="text-gray-300">Nome Completo</Label>
                            <Input
                              id="employee-name"
                              value={newEmployee.name}
                              onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Digite o nome completo"
                              className="bg-gray-700/50 border-gray-600/50 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="employee-cpf" className="text-gray-300">CPF</Label>
                            <Input
                              id="employee-cpf"
                              value={newEmployee.cpf}
                              onChange={(e) => setNewEmployee(prev => ({ ...prev, cpf: e.target.value }))}
                              placeholder="000.000.000-00"
                              className="bg-gray-700/50 border-gray-600/50 text-white"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50 border-gray-600/30">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Documentos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-gray-300">Foto do Funcionário</Label>
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                className="w-full border-dashed border-gray-500/50 text-gray-400 hover:bg-gray-700/50"
                                onClick={() => document.getElementById('photo-upload')?.click()}
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Adicionar Foto
                              </Button>
                              <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setNewEmployee(prev => ({ ...prev, photo: file }));
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-gray-300">Documentos</Label>
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                className="w-full border-dashed border-gray-500/50 text-gray-400 hover:bg-gray-700/50"
                                onClick={() => document.getElementById('docs-upload')?.click()}
                              >
                                <FileImage className="w-4 h-4 mr-2" />
                                Adicionar Documentos
                              </Button>
                              <input
                                id="docs-upload"
                                type="file"
                                accept="image/*,application/pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files?.[0]) setNewEmployee(prev => ({ ...prev, documents: files[0] }));
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewEmployee({ name: '', cpf: '', photo: null, documents: null });
                          setTeamSubTab('overview');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!newEmployee.name || !newEmployee.cpf) {
                            toast({
                              title: "Dados Obrigatórios",
                              description: "Nome e CPF são obrigatórios.",
                              variant: "destructive",
                            });
                            return;
                          }

                          try {
                            // Criar equipe se não existir
                            if (!professionalTeam) {
                              await createProfessionalTeam();
                              return;
                            }

                            // Adicionar funcionário
                            await addNewEmployee();
                          } catch (error) {
                            console.error('Erro ao adicionar funcionário:', error);
                            toast({
                              title: "Erro",
                              description: "Não foi possível adicionar o funcionário.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar à Equipe
                      </Button>
                    </div>
                  </div>
                )}

                {teamSubTab === 'search-platform' && (
                  <div className="space-y-6">
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Search className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-1">Buscar Usuários da Plataforma</h4>
                          <p className="text-gray-400 text-sm">
                            Encontre profissionais já cadastrados na plataforma para adicionar à sua equipe. Eles receberão uma notificação do convite.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <Input
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length > 2) {
                              searchPlatformUsers(e.target.value);
                            }
                          }}
                          placeholder="Digite nome, email ou CPF para buscar..."
                          className="bg-gray-700/50 border-gray-600/50 text-white"
                        />
                      </div>
                    </div>

                    {/* Resultados da busca */}
                    {searchQuery && searchUsers.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-white text-lg font-medium">Usuários Encontrados</h3>
                        {searchUsers.map((searchUser) => (
                          <Card key={searchUser.id} className="bg-gray-800/50 border-gray-600/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium">{searchUser.fullName || searchUser.username}</h4>
                                    <p className="text-gray-400 text-sm">{searchUser.email}</p>
                                    <p className="text-cyan-300 text-sm">
                                      {searchUser.userType === 'professional' ? '💼 Profissional' : '👤 Cliente'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => {
                                    setSelectedUser(searchUser);
                                    setShowInviteModal(true);
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Convidar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : searchQuery && searchQuery.length > 2 ? (
                      <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-600/30">
                        <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                        <p className="text-gray-400">
                          Não encontramos usuários com esse nome, email ou CPF.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-600/30">
                        <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-lg font-medium mb-2">Busque Profissionais</h3>
                        <p className="text-gray-400">
                          Use o campo de busca acima para encontrar usuários cadastrados na plataforma e convidá-los para sua equipe.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'team-requests' && (
          <div className="space-y-6">
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-cyan-400" />
                  <span>Solicitações de Equipe</span>
                  {teamRequests?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {teamRequests.length}
                    </Badge>
                  )}
                </CardTitle>
                {/* Abas para Pendentes e Canceladas */}
                <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setRequestsTab('pending')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      requestsTab === 'pending'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    Pendentes
                    {pendingTeamRequests?.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-cyan-500/20 text-cyan-300">
                        {pendingTeamRequests.length}
                      </Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setRequestsTab('trashed')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      requestsTab === 'trashed'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    Canceladas
                    {trashedRequests?.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-orange-500/20 text-orange-300">
                        {trashedRequests.length}
                      </Badge>
                    )}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Exibir solicitações com base na aba selecionada */}
                {requestsTab === 'pending' && (
                  <>
                    {!pendingTeamRequests || pendingTeamRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">Nenhuma solicitação pendente</p>
                        <p className="text-gray-500 text-sm">
                          Quando clientes quiserem formar uma equipe com você, as solicitações aparecerão aqui.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingTeamRequests.map((request: any) => (
                          <TeamRequestCard 
                            key={request.id} 
                            request={request} 
                            type="pending" 
                            onAccept={acceptRequest}
                            onReject={rejectRequest}
                            onRestore={restoreRequest}
                            userId={user.id}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {requestsTab === 'trashed' && (
                  <>
                    {!trashedRequests || trashedRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">Nenhuma solicitação cancelada</p>
                        <p className="text-gray-500 text-sm">
                          Solicitações rejeitadas ficam aqui por 5 minutos antes de expirar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {trashedRequests.map((request: any) => (
                          <TeamRequestCard 
                            key={request.id} 
                            request={request} 
                            type="trashed" 
                            onAccept={acceptRequest}
                            onReject={rejectRequest}
                            onRestore={restoreRequest}
                            userId={user.id}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="space-y-6">
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-cyan-400" />
                  <span>Chats Ativos de 24 Horas</span>
                  {activeChats?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeChats.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!activeChats || activeChats.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">Nenhum Chat Ativo</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Chats de 24 horas serão ativados automaticamente após clientes consumirem seus serviços.
                      Use os botões "Contatar Cliente" nos serviços aceitos para iniciar conversas.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activeChats.map((chat: any) => {
                      const timeRemaining = () => {
                        const now = new Date().getTime();
                        const expires = new Date(chat.expiresAt).getTime();
                        const remaining = expires - now;
                        
                        if (remaining <= 0) return "EXPIRADO";
                        
                        const hours = Math.floor(remaining / (1000 * 60 * 60));
                        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                        
                        return `${hours}h ${minutes}m`;
                      };

                      const isExpired = timeRemaining() === "EXPIRADO";

                      return (
                        <motion.div
                          key={chat.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            isExpired 
                              ? 'bg-red-900/20 border-red-500/30' 
                              : 'bg-gray-800/50 border-gray-600/50 hover:border-cyan-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {chat.clientName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{chat.clientName}</h4>
                                <p className="text-gray-400 text-sm">{chat.serviceType}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={isExpired ? "destructive" : "outline"} className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {timeRemaining()}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {chat.tokenCost} tokens
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {!isExpired ? (
                                <Button 
                                  size="sm" 
                                  className="neon-button"
                                  onClick={() => {
                                    window.open(`/chat/${chat.id}`, '_blank', 'width=600,height=500,resizable=yes,scrollbars=yes');
                                  }}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Abrir Chat
                                </Button>
                              ) : (
                                <Badge variant="destructive" className="px-3 py-1">
                                  Expirado
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Chat preview */}
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-gray-500 text-xs">
                              Criado em: {new Date(chat.createdAt).toLocaleString('pt-BR')}
                            </p>
                            {!isExpired && (
                              <p className="text-cyan-400 text-xs mt-1">
                                💬 Janela de chat ativa - Responda rapidamente para melhor experiência do cliente
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'pending' && (
          <Card className="glassmorphism border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-red-400" />
                  <span>Solicitações Pendentes</span>
                  {pendingCount > 0 && (
                    <Badge variant="destructive">{pendingCount}</Badge>
                  )}
                </div>
                {/* Auto-Aceitar Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Auto-Aceitar:</span>
                  <Button
                    size="sm"
                    variant={autoAcceptEnabled ? "default" : "outline"}
                    className={autoAcceptEnabled 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "border-gray-500 text-gray-400 hover:bg-gray-700"
                    }
                    onClick={async () => {
                      await updateAutoAccept(!autoAcceptEnabled);
                      trackDropdownClick('Comunicação', 'auto-aceitar-toggle', user);
                    }}
                  >
                    {autoAcceptEnabled ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        ATIVO
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        INATIVO
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
              {autoAcceptEnabled && (
                <CardDescription className="text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-500/30 mt-2">
                  ⚡ Auto-Aceitar ATIVO: Novas solicitações serão aceitas automaticamente após 1 hora
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {pendingCount > 0 ? (
                <div className="space-y-4">
                  {pendingRequests?.map((request: any) => (
                    <div key={request.id} className="p-4 bg-gray-800/50 rounded-lg border border-red-500/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-2">{request.description}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{request.user?.username}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Urgência: {request.urgency}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
                              {request.suggestedTokens} tokens
                            </Badge>
                            <Badge variant="destructive" className="text-xs">
                              Expira em: {Math.floor((new Date(request.responseDeadline).getTime() - Date.now()) / (1000 * 60))} min
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-600/20">
                          <XCircle className="w-4 h-4 mr-1" />
                          Recusar
                        </Button>
                        <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/20">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contatar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Nenhuma solicitação pendente</h3>
                  <p className="text-gray-400">Quando você receber novas solicitações, elas aparecerão aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'accepted' && (
          <Card className="glassmorphism border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Serviços Aceitos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {acceptedCount > 0 ? (
                <div className="space-y-4">
                  {acceptedServices?.map((service: any) => (
                    <div key={service.id} className="p-4 bg-gray-800/50 rounded-lg border border-green-500/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-2">{service.description}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{service.user?.username}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{service.location}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={
                                service.status === 'em_andamento' 
                                  ? "text-yellow-400 border-yellow-500/50" 
                                  : "text-green-400 border-green-500/50"
                              }
                            >
                              {service.status === 'em_andamento' ? 'Em Andamento' : 'Concluído'}
                            </Badge>
                            <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
                              {service.tokens} tokens
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {service.status === 'em_andamento' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Marcar como Concluído
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/20"
                          onClick={async () => {
                            try {
                              // Criar chat direto baseado no serviço aceito
                              const chatId = `chat_${service.user?.id}_${user.id}_${service.id}_${Date.now()}`;
                              const chatExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                              
                              await apiRequest("POST", "/api/chats", {
                                chatSession: {
                                  id: chatId,
                                  clientId: service.user?.id,
                                  clientName: service.user?.username,
                                  professionalId: user.id,
                                  professionalName: user.username,
                                  serviceType: service.description,
                                  tokenCost: service.tokens,
                                  createdAt: new Date().toISOString(),
                                  expiresAt: chatExpiresAt.toISOString(),
                                  isActive: true
                                }
                              });
                              
                              // Notificar sucesso
                              toast({
                                title: "Chat Ativado",
                                description: `Janela de 24h com ${service.user?.username} disponível!`,
                              });
                              
                              // Opcional: abrir interface de chat
                              window.open(`/chat/${chatId}`, '_blank', 'width=600,height=400');
                              
                            } catch (error) {
                              toast({
                                title: "Erro",
                                description: "Erro ao contatar cliente. Verifique a conexão.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contatar Cliente
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Nenhum serviço aceito</h3>
                  <p className="text-gray-400">Quando você aceitar solicitações, eles aparecerão aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'calendar' && (
          <Card className="glassmorphism border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span>📅 Calendário de Compromissos</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Compromissos gerados automaticamente dos serviços aceitos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acceptedCount > 0 ? (
                <div className="space-y-4">
                  {acceptedServices?.map((service: any) => (
                    <motion.div 
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-800/50 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-2 flex items-center space-x-2">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                            <span>{service.description}</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2 text-gray-400">
                              <User className="w-4 h-4 text-cyan-400" />
                              <span>Cliente: {service.user?.username}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400">
                              <MapPin className="w-4 h-4 text-cyan-400" />
                              <span>Local: {service.location}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400">
                              <Clock className="w-4 h-4 text-cyan-400" />
                              <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-cyan-400 border-cyan-500/50"
                        >
                          💬 Chat 24h Ativo
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="neon-button text-xs"
                            onClick={async () => {
                              try {
                                // Criar sessão de chat baseada no serviço aceito
                                const chatId = `chat_${service.user?.id}_${user.id}_${service.id}_${Date.now()}`;
                                const chatExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
                                
                                await apiRequest("POST", "/api/chats", {
                                  chatSession: {
                                    id: chatId,
                                    clientId: service.user?.id,
                                    clientName: service.user?.username,
                                    professionalId: user.id,
                                    professionalName: user.username,
                                    serviceType: service.description,
                                    tokenCost: service.tokens,
                                    createdAt: new Date().toISOString(),
                                    expiresAt: chatExpiresAt.toISOString(),
                                    isActive: true
                                  }
                                });
                                
                                // Abrir chat em nova janela ou modal
                                window.open(`/chat/${chatId}`, '_blank', 'width=600,height=400');
                                
                                toast({
                                  title: "Chat Iniciado",
                                  description: `Chat de 24h com ${service.user?.username} ativado!`,
                                });
                              } catch (error) {
                                toast({
                                  title: "Erro",
                                  description: "Erro ao iniciar chat. Tente novamente.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Abrir Chat
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs border-green-500/50 text-green-400 hover:bg-green-600/20"
                            onClick={() => {
                              toast({
                                title: "Serviço Concluído",
                                description: "Funcionalidade em desenvolvimento...",
                              });
                            }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Concluir
                          </Button>
                        </div>
                        <span className="text-xs text-gray-400">
                          💰 {service.tokens} tokens recebidos
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Nenhum compromisso agendado</h3>
                  <p className="text-gray-400">Aceite serviços para ver seus compromissos aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'performance' && (
          <Card className="glassmorphism border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span>📊 Relatório de Performance</span>
                </div>
                <Button 
                  onClick={() => {
                    const performanceData = {
                      professional: user.username,
                      periodo: 'Último mês',
                      servicosAceitos: acceptedCount,
                      avaliacaoMedia: rating.toFixed(1),
                      tokensGanhos: tokensEarned.toLocaleString(),
                      taxaSucesso: `${realStats.completionRate}%`,
                      tempoResposta: realStats.responseTime,
                      satisfacaoCliente: `${rating.toFixed(1)}/5`
                    };
                    
                    // Simular download do PDF
                    const blob = new Blob([JSON.stringify(performanceData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `performance-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    toast({
                      title: "PDF Gerado",
                      description: "Relatório de performance baixado com sucesso!",
                    });
                  }}
                  className="neon-button text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Análise detalhada do seu desempenho profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Métricas Principais */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-6 rounded-lg border border-cyan-500/30"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{acceptedCount}</div>
                    <p className="text-gray-300 text-sm">Serviços Concluídos</p>
                    <div className="text-xs text-green-400 mt-1">+18% este mês</div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 rounded-lg border border-yellow-500/30"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">{rating.toFixed(1)}</div>
                    <p className="text-gray-300 text-sm">Avaliação Média</p>
                    <div className="text-xs text-green-400 mt-1">+0.3 este mês</div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-lg border border-green-500/30"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">94.5%</div>
                    <p className="text-gray-300 text-sm">Taxa de Sucesso</p>
                    <div className="text-xs text-green-400 mt-1">+2.1% este mês</div>
                  </div>
                </motion.div>

                {/* Detalhes Adicionais */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="md:col-span-2 lg:col-span-3 bg-gray-800/30 p-6 rounded-lg border border-gray-600/30"
                >
                  <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span>Métricas Detalhadas</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <div className="text-lg font-semibold text-white">2.3h</div>
                      <div className="text-xs text-gray-400">Tempo Resposta</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <Wallet className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <div className="text-lg font-semibold text-white">{tokensEarned.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Tokens Ganhos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <div className="text-lg font-semibold text-white">{Math.floor(acceptedCount * 0.89)}</div>
                      <div className="text-xs text-gray-400">Clientes Recorrentes</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <Star className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <div className="text-lg font-semibold text-white">4.8/5</div>
                      <div className="text-xs text-gray-400">Satisfação Cliente</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'profile' && (
          <Card className="glassmorphism border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>Perfil Profissional</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <img 
                    src={user.profilePhoto || '/placeholder-avatar.png'} 
                    alt={user.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500/50"
                  />
                  <div>
                    <h3 className="text-white text-xl font-semibold">{user.fullName || user.username}</h3>
                    <p className="text-gray-400">{user.email}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-medium">{rating.toFixed(1)}</span>
                      <span className="text-gray-400 text-sm">({stats?.totalReviews || 0} avaliações)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Informações de Contato</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Telefone:</span>
                        <span className="text-white">{user.phone || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Documentação</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <Badge variant={user.documentsValidated ? "default" : "secondary"}>
                          {user.documentsValidated ? 'Validado' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pix Validado:</span>
                        <Badge variant={user.pixKeyValidated ? "default" : "secondary"}>
                          {user.pixKeyValidated ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button className="neon-button" onClick={() => setIsEditProfileOpen(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                  <Button variant="outline" className="border-gray-500/50 text-gray-300">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'certifications' && (
          <CertificationSystem 
            professionalId={user.id} 
            category="Casa e Construção" 
            specialty="Pintor" 
          />
        )}

        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                  <span>Tokens Ganhos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {tokensEarned.toLocaleString()}
                    </div>
                    <p className="text-gray-400">Total de tokens ganhos</p>
                  </div>
                  
                  <div className="space-y-3 border-t border-gray-600/30 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Este mês:</span>
                      <span className="text-green-400">{Math.floor(tokensEarned * 0.3).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Última semana:</span>
                      <span className="text-white">{Math.floor(tokensEarned * 0.1).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Disponível para saque:</span>
                      <span className="text-cyan-400">{Math.floor(tokensEarned * 0.87).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span>Controle de Saques</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      R$ {(tokensEarned * 0.001).toFixed(2)}
                    </div>
                    <p className="text-gray-400">Valor disponível</p>
                  </div>
                  
                  <Button className="w-full neon-button">
                    Solicitar Saque
                  </Button>
                  
                  <div className="text-center text-sm text-gray-400">
                    <p>Próxima janela de saque: dia 3</p>
                    <p>Limite mensal: 8.7% do acumulado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Aba Análise Inteligente */}
        {activeTab === 'insights' && (
          <ProfessionalInsights
            professionalId={user.id}
            currentRating={4.2}
            completedServices={15}
            averagePrice={2500}
            category="Casa e Construção"
          />
        )}

        {/* Aba Calendário Inteligente */}
        {activeTab === 'calendar-insights' && (
          <ProfessionalCalendarInsights
            professionalId={user.id}
            category="Casa e Construção"
            currentRating={4.2}
          />
        )}
        </motion.div>

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

        {/* Modal de Convite para Usuário */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent className="glassmorphism max-w-md border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center space-x-2">
                <UserPlus className="w-6 h-6 text-purple-400" />
                <span>Convidar para Equipe</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">{selectedUser.fullName || selectedUser.username}</h3>
                  <p className="text-gray-400">{selectedUser.email}</p>
                  <Badge className={selectedUser.userType === 'professional' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}>
                    {selectedUser.userType === 'professional' ? '💼 Profissional' : '👤 Cliente'}
                  </Badge>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Convite para Equipe Profissional</h4>
                  <p className="text-gray-400 text-sm">
                    Você está convidando este usuário para fazer parte da sua equipe profissional. 
                    Eles receberão uma notificação e poderão aceitar ou recusar o convite.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedUser(null);
                    }}
                    className="border-gray-500/50 text-gray-300 hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      if (!professionalTeam) {
                        createProfessionalTeam();
                        toast({
                          title: "Criando Equipe",
                          description: "Criando sua equipe profissional primeiro...",
                        });
                      } else {
                        inviteUserToTeam(selectedUser.id);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente para cartões de solicitação de equipe
interface TeamRequestCardProps {
  request: any;
  type: 'pending' | 'trashed';
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onRestore: (id: number) => void;
  userId: number;
}

function TeamRequestCard({ request, type, onAccept, onReject, onRestore }: TeamRequestCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge className="bg-cyan-500/20 text-cyan-300">Pendente</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500/20 text-green-300">Aceito</Badge>;
      case 'trashed':
        return <Badge className="bg-red-500/20 text-red-300">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{request.status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-white font-medium">{request.projectTitle || 'Solicitação de Equipe'}</h4>
          <p className="text-gray-400 text-sm">Cliente: {request.clientName}</p>
          {request.selectedService && (
            <p className="text-cyan-300 text-sm">Serviço: {request.selectedService}</p>
          )}
        </div>
        {getStatusBadge()}
      </div>
      
      <p className="text-gray-300 text-sm mb-4">{request.description || request.message}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Criado: {formatDate(request.createdAt)}</span>
        {request.budget && (
          <span>Orçamento: R$ {request.budget.toLocaleString('pt-BR')}</span>
        )}
        {request.hourlyRate && (
          <span>Valor/hora: R$ {request.hourlyRate.toLocaleString('pt-BR')}</span>
        )}
      </div>

      {/* Botões baseados no tipo */}
      {type === 'pending' && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => onAccept(request.id)}
            className="neon-button text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(request.id)}
            className="text-xs border-red-500/50 text-red-400 hover:bg-red-900/20"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-500/50 text-blue-400 hover:bg-blue-900/20"
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            Conversar
          </Button>
        </div>
      )}

      {type === 'trashed' && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => onRestore(request.id)}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Restaurar
          </Button>
          <div className="text-xs text-gray-500 flex items-center">
            <Trash2 className="w-3 h-3 mr-1" />
            Expira em 5 min
          </div>
        </div>
      )}

      {/* Informações de contato se aceito */}
      {request.status === 'accepted' && request.contactInfo && (
        <div className="bg-green-900/20 border border-green-500/30 rounded p-3 mt-4">
          <p className="text-green-300 text-sm font-medium mb-1">Informações de Contato:</p>
          <p className="text-green-200 text-xs">{request.contactInfo}</p>
        </div>
      )}

      {/* Resposta profissional */}
      {request.professionalResponse && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mt-3">
          <p className="text-blue-300 text-sm font-medium mb-1">Sua Resposta:</p>
          <p className="text-blue-200 text-xs">{request.professionalResponse}</p>
        </div>
      )}
    </motion.div>
  );
}