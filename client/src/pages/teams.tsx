import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Star, X, UserPlus, Crown, Briefcase, ArrowLeft, Eye, UserMinus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { ProfessionalModal } from "@/components/professional-modal";
import { StarfieldBackground } from "@/components/starfield-background";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import type { Professional, User } from "@shared/schema";

export default function Teams() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { user: authUser } = useAuth();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/1"],
    enabled: isAuthenticated && !authUser?.email, // Só buscar se não há usuário autenticado
  });

  // Admin bypass - verificar se é admin usando usuário autenticado
  const isAdmin = authUser?.email === 'passosmir4@gmail.com';
  
  // Usar usuário autenticado ou fallback para demo
  const currentUser = authUser || user;
  
  // Debug para verificar status do admin
  console.log('🎯 TEAMS ACCESS CHECK:', {
    isAuthenticated,
    authUser: authUser?.email,
    isAdmin,
    currentUserPlan: currentUser?.plan,
    shouldBlock: currentUser?.plan === 'free' && !isAdmin
  });

  const { data: teams = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    enabled: isAuthenticated,
  });

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });



  const removeFromTeamMutation = useMutation({
    mutationFn: async ({ teamId, professionalId }: { teamId: number; professionalId: number }) => {
      return apiRequest(`/api/teams/${teamId}/remove-professional`, 'POST', JSON.stringify({
        professionalId,
      }));
    },
    onSuccess: () => {
      toast({
        title: "Profissional removido",
        description: "Profissional removido do time com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={i} className="text-[var(--neon-cyan)] w-3 h-3 fill-current" />
        ))}
        <span className="ml-1 text-sm">{rating}</span>
      </div>
    );
  };

  const getTeamProfessionals = (team: any) => {
    if (!team.professionalIds || team.professionalIds.length === 0) return [];
    return professionals.filter(p => team.professionalIds.includes(p.id.toString()));
  };

  const handleViewProfile = (professionalId: number) => {
    setSelectedProfessionalId(professionalId);
    setProfessionalModalOpen(true);
  };

  const handleRemoveFromTeam = (teamId: number, professionalId: number) => {
    if (confirm("Tem certeza que deseja remover este profissional do time?")) {
      removeFromTeamMutation.mutate({ teamId, professionalId });
    }
  };

  // Validação de acesso - usuários deslogados
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <StarfieldBackground />
        <div className="min-h-screen text-white flex items-center justify-center px-4 relative z-10">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg p-4 text-center max-w-xs">
            <Lock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-400 text-xs mb-3">
              Teams exclusivo para usuários cadastrados
            </p>
            <div className="space-y-1.5">
              <Button className="neon-button w-full text-xs py-1.5">
                Login
              </Button>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full border-gray-500 text-gray-400 hover:bg-gray-700 text-xs py-1.5">
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validação de acesso - plano gratuito (admin bypass)
  if (currentUser?.plan === 'free' && !isAdmin) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <StarfieldBackground />
        <div className="min-h-screen text-white flex items-center justify-center px-4 relative z-10">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg p-4 text-center max-w-xs">
            <Crown className="mx-auto h-8 w-8 text-[var(--neon-cyan)] mb-2" />
            <h2 className="text-lg font-semibold mb-2">Teams Premium</h2>
            <p className="text-gray-400 text-xs mb-3">
              Disponível apenas para planos pagos
            </p>
            <div className="space-y-1.5">
              <Button className="neon-button w-full text-xs py-1.5">
                Fazer Upgrade
              </Button>
              <Link href="/dashboard-client" className="block">
                <Button variant="outline" className="w-full border-gray-500 text-gray-400 hover:bg-gray-700 text-xs py-1.5">
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--space-black)] text-white relative">
      <Header 
        onOpenGame={() => window.location.href = '/jogo'}
        onOpenPlans={() => window.location.href = '/?plans=true'}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24">
        <div className="mb-6 sm:mb-8">
          {/* Botão Voltar */}
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard-client')}
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4" style={{ 
            color: 'hsl(180, 100%, 50%)', 
            textShadow: '0 0 10px hsl(180, 100%, 50%), 0 0 20px hsl(180, 100%, 50%), 0 0 30px hsl(180, 100%, 50%)',
            filter: 'brightness(0.9)'
          }}>
            <Users className="inline mr-2 sm:mr-3 h-6 sm:h-10 w-6 sm:w-10" />
            Meus Times
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Monte equipes de até 10 profissionais para seus projetos
          </p>
        </div>

        {/* Team Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Individual Teams */}
          <div className="glassmorphism rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-2xl font-semibold" style={{ 
                color: 'hsl(180, 100%, 50%)', 
                textShadow: '0 0 8px hsl(180, 100%, 50%), 0 0 16px hsl(180, 100%, 50%)',
                filter: 'brightness(0.9)'
              }}>
                <UserPlus className="inline mr-1 sm:mr-2 h-5 sm:h-6 w-5 sm:w-6" />
                Times Personalizados
              </h2>
              <Button
                onClick={() => {
                  // Redirecionar para home para adicionar mais profissionais
                  window.location.href = '/';
                }}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 touch-manipulation transition-all duration-200 text-sm px-4 py-3 sm:px-4 sm:py-2 w-full sm:w-auto min-h-[44px] active:scale-98"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Profissionais
              </Button>
            </div>

            <div className="space-y-4">
              {teams.filter(team => team.name !== "Por Todos").map((team) => {
                const teamProfessionals = getTeamProfessionals(team);
                return (
                  <motion.div
                    key={team.id}
                    className="glassmorphism rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-all touch-manipulation active:scale-98"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">{team.name}</h3>
                      <span className="text-[var(--neon-cyan)] text-sm">
                        {teamProfessionals.length}/10 profissionais
                      </span>
                    </div>

                    {selectedTeam === team.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-3"
                      >
                        {teamProfessionals.length === 0 ? (
                          <p className="text-gray-400 text-sm">
                            Nenhum profissional adicionado ainda. 
                            Adicione profissionais através de seus perfis.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {teamProfessionals.map((prof) => (
                              <div
                                key={prof.id}
                                className="flex items-center justify-between bg-black/30 rounded-lg p-2 sm:p-3"
                              >
                                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                  <img
                                    src={prof.avatar}
                                    alt={prof.name}
                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-[var(--neon-cyan)] flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-xs sm:text-sm truncate">{prof.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{prof.title}</p>
                                    <div className="flex items-center">
                                      <div className="flex">
                                        {Array.from({ length: Math.floor(prof.rating) }, (_, i) => (
                                          <Star key={i} className="text-[var(--neon-cyan)] w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                                        ))}
                                      </div>
                                      <span className="ml-1 text-xs">{prof.rating}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewProfile(prof.id);
                                    }}
                                    className="text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] hover:text-black touch-manipulation transition-all duration-200 p-2 h-10 w-10 sm:p-1 sm:h-8 sm:w-8 active:scale-95"
                                  >
                                    <Eye className="h-4 w-4 sm:h-3 sm:w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFromTeam(team.id, prof.id);
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 touch-manipulation transition-all duration-200 p-2 h-10 w-10 sm:p-1 sm:h-8 sm:w-8 active:scale-95"
                                  >
                                    <UserMinus className="h-4 w-4 sm:h-3 sm:w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}

              {teams.filter(team => team.name !== "Por Todos").length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum time criado ainda.</p>
                  <p className="text-sm">Crie seu primeiro time para começar!</p>
                </div>
              )}
            </div>
          </div>

          {/* "Por Todos" Team */}
          <div className="glassmorphism rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold" style={{ 
                color: 'hsl(180, 100%, 50%)', 
                textShadow: '0 0 8px hsl(180, 100%, 50%), 0 0 16px hsl(180, 100%, 50%)',
                filter: 'brightness(0.9)'
              }}>
                <Briefcase className="inline mr-2 h-6 w-6" />
                Por Todos
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                Equipe completa para empresas e profissionais que precisam de uma força de trabalho robusta
              </p>
            </div>

            {(() => {
              const porTodosTeam = teams.find(team => team.name === "Por Todos");
              const teamProfessionals = porTodosTeam ? getTeamProfessionals(porTodosTeam) : [];
              
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--neon-cyan)]">
                      {teamProfessionals.length} profissionais disponíveis
                    </span>
                    <Button className="neon-button text-sm">
                      Contratar Time Completo
                    </Button>
                  </div>

                  {teamProfessionals.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {teamProfessionals.slice(0, 20).map((prof) => (
                        <div
                          key={prof.id}
                          className="flex items-center space-x-3 bg-black/30 rounded-lg p-3"
                        >
                          <img
                            src={prof.avatar}
                            alt={prof.name}
                            className="w-8 h-8 rounded-full border border-[var(--neon-cyan)]"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{prof.name}</p>
                            <p className="text-xs text-gray-400">{prof.title}</p>
                            {renderStars(prof.rating)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="glassmorphism rounded-lg p-4 text-center">
                    <h3 className="font-semibold text-[var(--neon-cyan)] mb-2">
                      💼 Ideal para Empresas
                    </h3>
                    <p className="text-sm text-gray-300">
                      Acesso a todos os profissionais da plataforma para projetos grandes e complexos.
                      Perfeito para empresas que precisam de múltiplas especialidades.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Instructions */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4" style={{ 
            color: 'hsl(180, 100%, 50%)', 
            textShadow: '0 0 6px hsl(180, 100%, 50%), 0 0 12px hsl(180, 100%, 50%)',
            filter: 'brightness(0.9)'
          }}>Como Funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <UserPlus className="mx-auto h-8 w-8 text-[var(--neon-cyan)] mb-2" />
              <h4 className="font-semibold mb-2">1. Adicione Profissionais</h4>
              <p className="text-gray-400">
                Navegue pelos perfis e clique em "Adicionar ao Time" nos profissionais que desejar.
              </p>
            </div>
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 text-[var(--neon-cyan)] mb-2" />
              <h4 className="font-semibold mb-2">2. Monte Sua Equipe</h4>
              <p className="text-gray-400">
                Organize times de até 10 profissionais para diferentes projetos ou necessidades.
              </p>
            </div>
            <div className="text-center">
              <Briefcase className="mx-auto h-8 w-8 text-[var(--neon-cyan)] mb-2" />
              <h4 className="font-semibold mb-2">3. Gerencie Projetos</h4>
              <p className="text-gray-400">
                Use seus times para colaborar em projetos e coordenar diferentes especialidades.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Modal */}
      {professionalModalOpen && selectedProfessionalId && (
        <ProfessionalModal
          isOpen={professionalModalOpen}
          onClose={() => {
            setProfessionalModalOpen(false);
            setSelectedProfessionalId(null);
          }}
          professionalId={selectedProfessionalId}
        />
      )}


    </div>
  );
}