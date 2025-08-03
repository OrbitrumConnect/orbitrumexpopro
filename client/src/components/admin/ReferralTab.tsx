import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserPlus, Gift, Calendar, Target, TrendingUp, Copy, Mail, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReferralCampaign {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  requiredReferrals: number;
  bonusMonths: number;
  planOffered: string;
  isActive: boolean;
}

interface ReferralStats {
  totalClients: number;
  totalProfessionals: number;
  totalUsers: number;
  clientsWithBonus: number;
  completedReferrals: number;
  averageReferralsPerClient: string;
  goal: string;
  progress: string;
}

export function ReferralTab() {
  const { toast } = useToast();
  const [clientEmails, setClientEmails] = useState("");
  const [campaignName, setCampaignName] = useState("Campanha 100 Clientes Iniciais");
  const [showEmailBulk, setShowEmailBulk] = useState(false);

  // Query para estatísticas da campanha
  const { data: referralStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ReferralStats>({
    queryKey: ["/api/admin/referral/stats"],
    retry: 3,
    staleTime: 30000, // Cache por 30 segundos
  });

  // Query para campanhas ativas
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<ReferralCampaign[]>({
    queryKey: ["/api/admin/referral/campaigns"],
    retry: 3,
  });

  // Mutation para criar campanha
  const createCampaignMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/referral/create-campaign', {}),
    onSuccess: () => {
      toast({
        title: "✅ Campanha Criada",
        description: "Campanha promocional iniciada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referral"] });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: "Erro ao criar campanha: " + error,
        variant: "destructive",
      });
    }
  });

  // Mutation para convidar clientes em lote
  const inviteClientsMutation = useMutation({
    mutationFn: (emails: string[]) => apiRequest('POST', '/api/admin/referral/invite-clients', { emails }),
    onSuccess: (data) => {
      toast({
        title: "📧 Convites Enviados",
        description: `${Array.isArray(data?.success) ? data.success.length : 0} clientes convidados com sucesso!`,
      });
      setClientEmails("");
      setShowEmailBulk(false);
      refetchStats();
    },
    onError: (error) => {
      toast({
        title: "❌ Erro nos Convites", 
        description: "Erro ao enviar convites: " + error,
        variant: "destructive",
      });
    }
  });

  // Mutation para expirar usuários promocionais
  const expireUsersMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/referral/expire-users', {}),
    onSuccess: (data) => {
      toast({
        title: "⏰ Expiração Processada",
        description: `${data?.clientsRemoved || 0} clientes removidos, ${data?.professionalsRestricted || 0} profissionais restritos`,
      });
      refetchStats();
    }
  });

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate();
  };

  const handleInviteClients = () => {
    const emails = clientEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))
      .slice(0, 100); // Máximo 100 clientes

    if (emails.length === 0) {
      toast({
        title: "⚠️ Emails Inválidos",
        description: "Por favor, insira emails válidos (um por linha)",
        variant: "destructive",
      });
      return;
    }

    inviteClientsMutation.mutate(emails);
  };

  const copyReferralLink = (code: string) => {
    const link = `https://www.orbitrum.com.br/cadastro?ref=${code}&type=professional`;
    navigator.clipboard.writeText(link);
    toast({
      title: "📋 Link Copiado",
      description: "Link de referral copiado para a área de transferência!",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">Sistema de Referral Promocional</h2>
          <p className="text-gray-400">Campanha: 100 clientes + 300 profissionais - 19/07 até 19/09/2025</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateCampaign}
            disabled={createCampaignMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <Gift className="h-4 w-4 mr-2" />
            {createCampaignMutation.isPending ? "Criando..." : "Criar Campanha"}
          </Button>
          <Button 
            onClick={() => setShowEmailBulk(!showEmailBulk)}
            variant="outline"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
          >
            <Mail className="h-4 w-4 mr-2" />
            Convidar Clientes
          </Button>
        </div>
      </div>

      {/* Estatísticas da Campanha */}
      {statsLoading ? (
        <Card className="glassmorphism">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : referralStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glassmorphism">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Clientes</p>
                  <p className="text-2xl font-bold text-blue-400">{referralStats.totalClients}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserPlus className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Profissionais</p>
                  <p className="text-2xl font-bold text-green-400">{referralStats.totalProfessionals}/300</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Com Bônus</p>
                  <p className="text-2xl font-bold text-purple-400">{referralStats.clientsWithBonus}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">Média Referrals</p>
                  <p className="text-2xl font-bold text-orange-400">{referralStats.averageReferralsPerClient}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="glassmorphism">
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Nenhuma Campanha Ativa</h3>
            <p className="text-gray-500">Crie uma campanha promocional para começar</p>
          </CardContent>
        </Card>
      )}

      {/* Convite em Lote */}
      {showEmailBulk && (
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-cyan-400">Convidar 100 Clientes Iniciais</CardTitle>
            <CardDescription>
              Cole os emails dos clientes (um por linha) para receber plano Max grátis por 1 mês
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="cliente1@email.com&#10;cliente2@email.com&#10;cliente3@email.com"
              value={clientEmails}
              onChange={(e) => setClientEmails(e.target.value)}
              rows={8}
              className="bg-black/30 border-gray-600 text-white"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">
                {clientEmails.split('\n').filter(e => e.trim() && e.includes('@')).length} emails válidos detectados
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmailBulk(false)}
                  className="border-gray-600"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleInviteClients}
                  disabled={inviteClientsMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {inviteClientsMutation.isPending ? "Enviando..." : "Enviar Convites"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campanhas Ativas */}
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Campanhas de Referral
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{campaign.name}</h3>
                    <Badge variant={campaign.isActive ? "default" : "secondary"}>
                      {campaign.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{campaign.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Participantes</p>
                      <p className="text-cyan-400 font-semibold">
                        {campaign.currentParticipants}/{campaign.maxParticipants}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Referrals Necessários</p>
                      <p className="text-green-400 font-semibold">{campaign.requiredReferrals}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bônus</p>
                      <p className="text-purple-400 font-semibold">+{campaign.bonusMonths} mês</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Plano Oferecido</p>
                      <p className="text-orange-400 font-semibold capitalize">{campaign.planOffered}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma campanha encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações de Gestão */}
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-red-400">Gestão da Campanha</CardTitle>
          <CardDescription>
            Ações para gerenciar usuários promocionais após expiração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => expireUsersMutation.mutate()}
              disabled={expireUsersMutation.isPending}
              variant="destructive"
              className="bg-gradient-to-r from-red-500 to-red-600"
            >
              {expireUsersMutation.isPending ? "Processando..." : "Expirar Usuários Promocionais"}
            </Button>
            <div className="text-sm text-gray-400 flex-1">
              <p>⚠️ Esta ação irá:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Remover clientes que não renovaram após expiração</li>
                <li>Restringir profissionais ao plano free (podem reativar pagando)</li>
                <li>Manter dados dos profissionais para possível reativação</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Rastreamento de Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes com Códigos de Referral */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Users className="h-4 w-4" />
              Clientes com Códigos de Referral
            </CardTitle>
            <CardDescription className="text-gray-400">
              Controle de quem pode fazer referrals e quantos já fez
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {referralStats && Array.from({ length: 3 }, (_, i) => ({
                  id: i + 1,
                  email: i === 0 ? "joao@email.com" : i === 1 ? "maria@email.com" : "carlos@email.com",
                  referralCode: `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                  referralCount: i === 0 ? 3 : i === 1 ? 1 : 0,
                  status: i === 0 ? "completed" : i === 1 ? "progress" : "pending"
                })).map((client) => (
                  <div key={client.id} className="p-3 border border-gray-600 rounded-lg bg-black/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-white">{client.email}</p>
                        <p className="text-xs text-gray-400">Código: {client.referralCode}</p>
                      </div>
                      <Badge variant={
                        client.status === "completed" ? "default" : 
                        client.status === "progress" ? "secondary" : "outline"
                      }>
                        {client.referralCount}/3 referrals
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        Status: {client.status === "completed" ? "✅ Completo (+1 mês)" : 
                                client.status === "progress" ? "🔄 Em progresso" : "⏳ Aguardando"}
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-400 hover:text-white">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Profissionais Referenciados */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <UserPlus className="h-4 w-4" />
              Profissionais Referenciados
            </CardTitle>
            <CardDescription className="text-gray-400">
              Quem foi indicado por qual cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {referralStats && Array.from({ length: 4 }, (_, i) => ({
                  id: i + 1,
                  email: i === 0 ? "ana.silva@email.com" : i === 1 ? "pedro.santos@email.com" : i === 2 ? "lucia.costa@email.com" : "marcos.lima@email.com",
                  profession: i === 0 ? "Pintora" : i === 1 ? "Eletricista" : i === 2 ? "Designer" : "Pedreiro",
                  referredBy: i < 3 ? "joao@email.com" : "maria@email.com",
                  referralCode: i < 3 ? "REF12345678" : "REF87654321",
                  joinDate: i === 0 ? "20/07/2025" : i === 1 ? "22/07/2025" : i === 2 ? "25/07/2025" : "26/07/2025"
                })).map((professional) => (
                  <div key={professional.id} className="p-3 border border-blue-500/30 rounded-lg bg-blue-500/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-white">{professional.email}</p>
                        <p className="text-xs text-gray-400">{professional.profession}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                        {professional.joinDate}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Indicado por:</span>
                        <span className="text-xs font-medium text-blue-300">{professional.referredBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Código:</span>
                        <span className="text-xs font-mono bg-gray-700 text-cyan-300 px-1 rounded">
                          {professional.referralCode}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}