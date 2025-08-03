import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, Calendar, FileText, CreditCard, TrendingDown, Zap, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TeamHiring {
  id: number;
  userId: number;
  professionals: string;
  projectTitle: string;
  projectDescription: string;
  totalTokens: number;
  discountPercentage: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  pending: {
    label: "Pendente",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
  active: {
    label: "Ativo",
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-400 border-green-500/30",
  },
  completed: {
    label: "Concluído",
    icon: CheckCircle,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    color: "bg-red-500/10 text-red-400 border-red-500/30",
  },
};

export default function TeamHirings() {
  const [selectedHiring, setSelectedHiring] = useState<TeamHiring | null>(null);

  // Mock user ID - em produção seria obtido da autenticação
  const userId = 1;

  const { data: teamHirings = [], isLoading } = useQuery({
    queryKey: ["/api/users", userId, "team-hirings"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/team-hirings`);
      if (!response.ok) throw new Error("Falha ao carregar contratações");
      return response.json();
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseProfessionals = (professionalsString: string) => {
    try {
      return JSON.parse(professionalsString);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cyan-400">Carregando contratações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button 
              variant="outline" 
              size="sm"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Orbit
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-400" />
            Contratações de Equipes
          </h1>
        </div>

        {teamHirings.length === 0 ? (
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhuma equipe contratada ainda</h3>
              <p className="text-gray-400 mb-4">
                Vá para o sistema orbital e selecione profissionais para formar sua primeira equipe
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                  Explorar Profissionais
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Contratações */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-cyan-400">Histórico de Contratações</h2>
              
              {teamHirings.map((hiring: TeamHiring) => {
                const professionals = parseProfessionals(hiring.professionals);
                const status = statusConfig[hiring.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <Card 
                    key={hiring.id}
                    className={`bg-gray-800/50 border-cyan-500/30 cursor-pointer transition-all hover:bg-gray-800/70 ${
                      selectedHiring?.id === hiring.id ? 'ring-2 ring-cyan-400' : ''
                    }`}
                    onClick={() => setSelectedHiring(hiring)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white mb-1">{hiring.projectTitle}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(hiring.createdAt)}
                          </div>
                        </div>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {professionals.length} profissionais
                          </span>
                          <span className="text-cyan-400 font-semibold">
                            {hiring.finalAmount.toLocaleString()} tokens
                          </span>
                        </div>
                        
                        {hiring.discountPercentage > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingDown className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">
                              {hiring.discountPercentage}% desconto aplicado
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detalhes da Contratação Selecionada */}
            <div className="lg:sticky lg:top-4">
              {selectedHiring ? (
                <Card className="bg-gray-800/50 border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-xl text-cyan-400 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Detalhes da Contratação
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Informações do Projeto */}
                    <div>
                      <h3 className="font-semibold text-white mb-2">{selectedHiring.projectTitle}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {selectedHiring.projectDescription}
                      </p>
                    </div>

                    <Separator className="border-cyan-500/20" />

                    {/* Profissionais */}
                    <div>
                      <h4 className="font-medium text-cyan-400 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Profissionais ({parseProfessionals(selectedHiring.professionals).length})
                      </h4>
                      
                      <div className="space-y-2">
                        {parseProfessionals(selectedHiring.professionals).map((professional: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {professional.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{professional.name}</p>
                              <p className="text-xs text-gray-400">{professional.title}</p>
                            </div>
                            <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                              {professional.hourlyRate} tokens/h
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="border-cyan-500/20" />

                    {/* Resumo Financeiro */}
                    <div>
                      <h4 className="font-medium text-cyan-400 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Resumo Financeiro
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Custo Original:</span>
                          <span className="text-white">{selectedHiring.totalTokens.toLocaleString()} tokens</span>
                        </div>
                        
                        {selectedHiring.discountPercentage > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-400">Desconto ({selectedHiring.discountPercentage}%):</span>
                            <span className="text-green-400">-{selectedHiring.discountAmount.toLocaleString()} tokens</span>
                          </div>
                        )}
                        
                        <Separator className="border-cyan-500/20" />
                        
                        <div className="flex justify-between">
                          <span className="text-cyan-400 font-semibold flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            Total Final:
                          </span>
                          <span className="text-cyan-400 font-bold">{selectedHiring.finalAmount.toLocaleString()} tokens</span>
                        </div>
                      </div>
                    </div>

                    {/* Status e Datas */}
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Status:</span>
                        <Badge variant="outline" className={statusConfig[selectedHiring.status as keyof typeof statusConfig]?.color || statusConfig.pending.color}>
                          {statusConfig[selectedHiring.status as keyof typeof statusConfig]?.label || 'Pendente'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Criado em: {formatDate(selectedHiring.createdAt)}</div>
                        {selectedHiring.updatedAt !== selectedHiring.createdAt && (
                          <div>Atualizado em: {formatDate(selectedHiring.updatedAt)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-800/50 border-cyan-500/30">
                  <CardContent className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">
                      Selecione uma contratação para ver os detalhes
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}