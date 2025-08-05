import { queryClient, setupCacheCleanup } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { PerformanceMonitor } from "@/utils/performance-monitor";

// Inicializar otimizações de performance
setupCacheCleanup();
PerformanceMonitor.getInstance().optimizeApiCalls();
import { Toaster } from "@/components/ui/toaster";
import { PlanExpiryNotification } from "@/components/plan-expiry-notification";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { Route, Switch } from "wouter";
import Home from "@/pages/home";
// import Landing from "@/pages/landing";
import Teams from "@/pages/teams";
import Termos from "@/pages/termos";
import Privacidade from "@/pages/privacidade";
import Regras from "@/pages/regras";
import Certificacoes from "@/pages/certificacoes";
import CadastroProfissional from "@/pages/cadastro-profissional";
import Cadastro from "@/pages/cadastro";
import PlanosPagamento from "@/pages/PlanosPagamento";
import Pagamento from "@/pages/Pagamento";
import TokenStore from "@/pages/TokenStore";
import AdminDashboard from "@/pages/AdminDashboard-Safe";
import Dashboard from "@/pages/dashboard";
import DashboardSelector from "@/pages/dashboard-selector";
import ClientDashboard from "@/pages/dashboard-client";
import ProfessionalDashboard from "@/pages/dashboard-professional";
import DocumentVerification from "@/pages/DocumentVerification";
import ChatWindow from "@/pages/ChatWindow";
// import TrackingDemo from "@/pages/tracking-demo";
import ProfessionalTracking from "@/pages/professional-tracking";
import TeamHirings from "@/pages/team-hirings";
import { GamePage } from "@/pages/game";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/login-modal";
import { TelegramThemeProvider } from "@/components/telegram-integration";
import { HowItWorksModal } from "@/components/HowItWorksModal";
// import EmergencyFix from "@/pages/emergency-fix";
import { useState, useEffect } from "react";

function AppContent() {
  const [showWelcome, setShowWelcome] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Modal aparece sempre que usuário NÃO estiver logado (toda visita)
    // Dar um pequeno delay para garantir que o estado de auth foi carregado
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setShowWelcome(true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // Não salvar mais no localStorage - modal sempre aparece para não-logados
  };

  return (
    <TelegramThemeProvider>
      <TooltipProvider>
        <Toaster />
        <PlanExpiryNotification />
        <HowItWorksModal 
          isOpen={showWelcome} 
          onClose={handleCloseWelcome}
        />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/teams" component={Teams} />
        <Route path="/tokens" component={TokenStore} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard-selector" component={DashboardSelector} />
        <Route path="/dashboard-client" component={ClientDashboard} />
        <Route path="/dashboard-professional" component={ProfessionalDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/planos" component={PlanosPagamento} />
        <Route path="/pagamento" component={Pagamento} />
        <Route path="/jogo" component={GamePage} />
        <Route path="/termos" component={Termos} />
        <Route path="/privacidade" component={Privacidade} />
        <Route path="/regras" component={Regras} />
        <Route path="/certificacoes" component={Certificacoes} />
        <Route path="/cadastro-profissional" component={CadastroProfissional} />
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/verificacao-documentos" component={DocumentVerification} />
        <Route path="/team-hirings" component={TeamHirings} />
        {/* <Route path="/rastreamento" component={TrackingDemo} /> */}
        <Route path="/controle-gps" component={ProfessionalTracking} />
        {/* <Route path="/emergency-fix" component={EmergencyFix} /> */}
        <Route path="/chat/:chatId">
          {(params) => <ChatWindow chatId={params.chatId} />}
        </Route>
        <Route>
          <Home />
        </Route>
      </Switch>
      </TooltipProvider>
    </TelegramThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;