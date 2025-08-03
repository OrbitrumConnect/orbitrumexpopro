import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Calendar, 
  Star,
  TrendingUp,
  Settings,
  FileText,
  Wallet,
  User,
  Home,
  BarChart3,
  Users
} from "lucide-react";
import { Link } from "wouter";

interface SimpleProfessionalDashboardProps {
  user: any;
}

export function SimpleProfessionalDashboard({ user }: SimpleProfessionalDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }: any) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      onClick={() => onClick(id)}
      className={`text-xs px-2 py-1 h-8 ${
        isActive 
          ? "bg-cyan-500 text-white" 
          : "text-gray-300 hover:text-cyan-400 hover:bg-gray-800"
      }`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Orbit
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-cyan-400">
              Dashboard Profissional
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">
              Bem-vindo, <span className="text-cyan-400">{user?.username || "Profissional"}</span>
            </p>
            <Badge variant="outline" className="text-xs mt-1">
              {user?.plan || "free"} plan
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex flex-wrap gap-2">
          <TabButton 
            id="overview" 
            icon={BarChart3} 
            label="Visão Geral" 
            isActive={activeTab === 'overview'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="services" 
            icon={Briefcase} 
            label="Serviços" 
            isActive={activeTab === 'services'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="calendar" 
            icon={Calendar} 
            label="Agenda" 
            isActive={activeTab === 'calendar'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="wallet" 
            icon={Wallet} 
            label="Carteira" 
            isActive={activeTab === 'wallet'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="profile" 
            icon={User} 
            label="Perfil" 
            isActive={activeTab === 'profile'} 
            onClick={setActiveTab} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">Visão Geral</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Ganhos Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">R$ 0,00</div>
                  <div className="text-xs text-gray-400">Este mês</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Trabalhos Concluídos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">0</div>
                  <div className="text-xs text-gray-400">Total</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Avaliação Média</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400 flex items-center">
                    <Star className="w-6 h-6 mr-1" />
                    5.0
                  </div>
                  <div className="text-xs text-gray-400">0 avaliações</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                  <p className="text-sm">Comece a oferecer seus serviços para ver atividades aqui</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-cyan-400">Meus Serviços</h2>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Briefcase className="w-4 h-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-8">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-400">Nenhum serviço cadastrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Cadastre seus serviços para começar a receber solicitações
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-cyan-400">Agenda</h2>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-400">Agenda vazia</p>
                <p className="text-sm text-gray-500 mt-2">
                  Seus compromissos aparecerão aqui
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-cyan-400">Carteira Profissional</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Saldo Disponível</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">R$ 0,00</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Tokens: {user?.tokens || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-blue-400">Ganhos Este Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">R$ 0,00</div>
                  <div className="text-sm text-gray-400 mt-2">
                    0 serviços realizados
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-cyan-400">Perfil Profissional</h2>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300">Nome de Usuário</label>
                  <p className="text-white">{user?.username || "Não definido"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-300">Email</label>
                  <p className="text-white">{user?.email || "Não definido"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-300">Plano Atual</label>
                  <Badge variant="outline" className="ml-2">
                    {user?.plan || "free"}
                  </Badge>
                </div>
                <Button className="mt-4" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}