import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from '@/lib/isAdmin';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Shield } from "lucide-react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";

export default function DashboardSelector() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const isAdmin = isAdminUser(user);
  const userType = user?.userType || "client";
  
  // Regras de acesso híbrido:
  // - Clientes: Só dashboard cliente
  // - Profissionais: Ambos dashboards (podem consumir E prestar serviços)
  // - Admin: Acesso total (escolha manual)
  const canAccessClientDashboard = userType === 'client' || userType === 'professional' || isAdmin;
  const canAccessProfessionalDashboard = userType === 'professional' || isAdmin;

  // Debug info
  console.log('🚀 SELETOR DASHBOARD - User:', user?.username, 'Type:', userType, 'Admin:', isAdmin);
  console.log('🚀 ACESSO - Cliente:', canAccessClientDashboard, 'Profissional:', canAccessProfessionalDashboard);

  const handleNavigation = (path: string, dashboardType: string) => {
    console.log(`🚀 NAVEGANDO para ${dashboardType}: ${path}`);
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex" style={{ position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <div className="flex-1 min-w-0 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Escolha seu Dashboard</h1>
          <p className="text-gray-300">
            Olá <span className="text-cyan-400">{user?.username || "Usuário"}</span>, 
            selecione o dashboard que deseja acessar
          </p>
        </div>

        {/* Dashboard Options - Cards Principais Centralizados */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Dashboard Cliente */}
          <Card className="glassmorphism border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-xl text-white">Dashboard Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Acesse seus tokens, times, histórico de transações e funcionalidades de cliente
              </p>
              
              {canAccessClientDashboard ? (
                <Button 
                  className="neon-button w-full" 
                  onClick={() => handleNavigation('/dashboard-client', 'Dashboard Cliente')}
                >
                  Acessar Dashboard Cliente
                </Button>
              ) : (
                <Button disabled className="w-full bg-gray-600 text-gray-400">
                  Apenas para Clientes
                </Button>
              )}
              
              <div className="mt-3 text-xs text-gray-500">
                {userType === 'client' && "✓ Acesso como cliente"}
                {userType === 'professional' && "✓ Profissionais podem consumir serviços"}
                {isAdmin && "✓ Acesso administrativo total"}
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Profissional */}
          <Card className="glassmorphism border-green-500/30 hover:border-green-400 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-xl text-white">Dashboard Profissional</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Gerencie seus serviços, solicitações pendentes, estatísticas e pagamentos recebidos
              </p>
              
              {canAccessProfessionalDashboard ? (
                <Button 
                  className="neon-button w-full bg-green-500 hover:bg-green-600" 
                  onClick={() => handleNavigation('/dashboard-professional', 'Dashboard Profissional')}
                >
                  Acessar Dashboard Profissional
                </Button>
              ) : (
                <Button disabled className="w-full bg-gray-600 text-gray-400">
                  Apenas para Profissionais
                </Button>
              )}
              
              <div className="mt-3 text-xs text-gray-500">
                {userType === 'professional' && "✓ Acesso para prestação de serviços"}
                {userType === 'client' && "✗ Restrito a profissionais cadastrados"}
                {isAdmin && "✓ Acesso administrativo total"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Admin - Separado e centralizado para admin master */}
        {isAdmin && (
          <div className="max-w-md mx-auto">
            <Card className="glassmorphism border-red-500/30 hover:border-red-400 transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
                <CardTitle className="text-xl text-white">Dashboard Admin</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300 mb-6">
                  Administração completa da plataforma, usuários, moderação e sistema financeiro
                </p>
                
                <Button 
                  className="neon-button w-full bg-red-500 hover:bg-red-600" 
                  onClick={() => handleNavigation('/admin', 'Dashboard Admin')}
                >
                  Acessar Dashboard Admin
                </Button>
                
                <div className="mt-3 text-xs text-red-400">
                  ✓ Acesso exclusivo de administrador
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Info Debug */}
        <div className="max-w-2xl mx-auto mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Informações da Conta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="text-white ml-2">{user?.email || "Não autenticado"}</span>
            </div>
            <div>
              <span className="text-gray-500">Tipo:</span>
              <span className="text-cyan-400 ml-2">{userType}</span>
            </div>
            <div>
              <span className="text-gray-500">Admin:</span>
              <span className={`ml-2 ${isAdmin ? 'text-orange-400' : 'text-gray-400'}`}>
                {isAdmin ? "Sim" : "Não"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}