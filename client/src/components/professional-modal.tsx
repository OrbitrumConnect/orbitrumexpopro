import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { X, Star, Users, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import ServiceTrackingButton from "./ServiceTrackingButton";
import { TeamSelectionSystem } from "./team-selection-system";
import type { Professional, User } from "@shared/schema";

interface ProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: number;
  onAddToTeam?: () => void;
}

export function ProfessionalModal({ isOpen, onClose, professionalId, onAddToTeam }: ProfessionalModalProps) {
  console.log('Professional modal rendered:', { isOpen, professionalId });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const { data: professional, isLoading, error } = useQuery<Professional>({
    queryKey: ["/api/professionals", professionalId],
    enabled: isOpen && !!professionalId,
  });

  // Get current user to check plan (só se autenticado)
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/1"],
    enabled: isAuthenticated,
  });

  // Buscar serviços do profissional
  const { data: services, isLoading: servicesLoading } = useQuery<any[]>({
    queryKey: ["/api/professionals", professionalId, "services"],
    enabled: isOpen && !!professionalId,
  });

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionData, setConnectionData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingService, setPendingService] = useState<{serviceType: string; tokenCost: number; serviceName: string} | null>(null);
  const [showTeamSelection, setShowTeamSelection] = useState(false);

  // Mutation for connecting with professionals using tokens - consome diretamente da carteira
  const connectMutation = useMutation({
    mutationFn: async ({ serviceType, tokenCost }: { serviceType: string; tokenCost: number }) => {
      // Primeiro verificar se tem tokens suficientes
      const walletResponse = await fetch('/api/users/1/wallet');
      const walletData = await walletResponse.json();
      const totalTokens = walletData.tokensPlano + walletData.tokensGanhos + walletData.tokensComprados;
      
      if (totalTokens < tokenCost) {
        throw new Error(`Tokens insuficientes! Você tem ${totalTokens} tokens, precisa de ${tokenCost}.`);
      }
      
      // Consumir tokens diretamente
      const response = await fetch(`/api/professionals/${professionalId}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serviceType, tokenCost }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao conectar");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Conexão realizada e tokens deduzidos:", data);
      
      // Mostrar comissão do profissional na confirmação
      const commissionText = data.professionalCommission ? 
        ` (+${data.professionalCommission} tokens para ${professional?.name})` : '';
      
      toast({
        title: "✅ Serviço Ativado!",
        description: `${data.message || 'Conexão estabelecida'}${commissionText}`,
        variant: "default",
      });
      setConnectionData(data);
      setShowConnectionModal(true);
      // Atualizar saldo da carteira
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro na Conexão",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleConnect = (serviceType: string, tokenCost: number, serviceName?: string) => {
    // Mostrar modal de confirmação antes de consumir tokens
    setPendingService({ 
      serviceType, 
      tokenCost, 
      serviceName: serviceName || serviceType.replace(/_/g, ' ').toUpperCase() 
    });
    setShowConfirmModal(true);
  };

  const confirmTokenConsumption = () => {
    if (pendingService) {
      connectMutation.mutate({ 
        serviceType: pendingService.serviceType, 
        tokenCost: pendingService.tokenCost 
      });
      setShowConfirmModal(false);
      setPendingService(null);
    }
  };

  const cancelTokenConsumption = () => {
    setShowConfirmModal(false);
    setPendingService(null);
  };

  const addToTeamMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/teams/add-professional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ professionalId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ SUCCESS - Profissional adicionado:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setShowTeamModal(true);
    },
    onError: (error: any) => {
      console.log("❌ ERROR:", error);
      // Se já está no time, mostrar modal mesmo assim
      if (error.message && error.message.includes("400")) {
        toast({
          title: "Já está no time!",
          description: `${professional?.name} já faz parte do seu time.`,
          variant: "default",
        });
        setShowTeamModal(true); // Mostrar modal mesmo se já estiver no time
      } else {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível adicionar ao time.",
          variant: "destructive",
        });
      }
    }
  });

  console.log('Professional data:', { professional, isLoading, error });

  if (!isOpen) return null;
  if (isLoading) return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-white">Carregando...</div>
    </div>
  );
  if (!professional) return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="glassmorphism rounded-lg p-6 text-white text-center">
        <p>Profissional não encontrado</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500 rounded">Fechar</button>
      </div>
    </div>
  );

  const renderStars = () => {
    const fullStars = Math.floor(professional.rating);
    return (
      <div className="flex items-center mt-1">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={i} className="text-[var(--neon-cyan)] w-3 h-3 sm:w-4 sm:h-4 fill-current mr-1" />
        ))}
        <span className="ml-1 sm:ml-2 text-xs sm:text-sm">{professional.rating}</span>
        <span className="text-gray-400 ml-1 sm:ml-2 text-xs sm:text-sm">({professional.reviewCount} reviews)</span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glassmorphism rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl w-full mx-2 sm:mx-4 max-h-[95vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Beta Notice - Mobile Optimized */}
            <div className="bg-blue-500 bg-opacity-20 border border-blue-400 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
              <p className="text-blue-300 text-xs sm:text-sm font-semibold text-center">
                BETA
              </p>
            </div>

            {/* Demo Professional Notice */}
            {(professional as any).isDemo && (
              <div className="bg-amber-500 bg-opacity-20 border border-amber-400 rounded-lg p-4 mb-6">
                <h3 className="text-amber-300 text-sm font-semibold text-center mb-2">
                  🤖 Agente IA Demonstrativo
                </h3>
                <p className="text-amber-200 text-sm text-center">
                  Este é um profissional demonstrativo para fins visuais da plataforma. 
                  Os dados apresentados são fictícios e servem apenas para mostrar como 
                  os perfis reais aparecerão quando profissionais se cadastrarem.
                </p>
              </div>
            )}
            {/* Header - Mobile Optimized */}
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-[var(--neon-cyan)] flex-shrink-0">
                  <img
                    src={professional.avatar}
                    alt={professional.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <h2 className="font-bold text-lg sm:text-xl md:text-2xl neon-text truncate">{professional.name}</h2>
                    {(professional as any).isDemo && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full self-start">
                        <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-amber-300 font-medium">Demo</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[var(--neon-cyan)] text-sm sm:text-base truncate">{professional.title}</p>
                  <div className="mt-1">
                    {renderStars()}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 flex-shrink-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
            
            {/* Token Explanation */}
            <div className="glassmorphism rounded-lg p-4 mb-6 bg-cyan-500 bg-opacity-10 border border-cyan-400">
              <h3 className="text-sm font-semibold text-[var(--neon-cyan)] mb-2 text-center">
                🛠️ Como Funcionam os Tokens
              </h3>
              <p className="text-cyan-300 text-sm text-center">
                Os tokens são a moeda virtual da plataforma para usar funcionalidades e intermediação de contatos. 
                A plataforma não oferece serviços diretamente - apenas conecta usuários. Cada usuário escolhe o 
                profissional baseado no perfil, ranking e confiabilidade.
              </p>
            </div>

            {/* Contact and Scheduling Section - Mobile Optimized */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="glassmorphism rounded-lg p-3 sm:p-4 border border-cyan-400">
                <h3 className="font-semibold text-[var(--neon-cyan)] mb-2 sm:mb-3 text-sm sm:text-base">💬 Chat Instantâneo</h3>
                <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                  💬 Chat direto de 24h + sessão instantânea com {professional.name.split(' ')[0]} - <span className="text-cyan-400 font-semibold">2.000 tokens</span>
                </p>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => handleConnect("chat_instantaneo", 2000, "Chat Instantâneo + Comunicação 24h")}
                    className="w-full neon-button text-xs sm:text-sm py-2"
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? "Consumindo tokens..." : "💬 Chat + Comunicação (2.000 tokens)"}
                  </Button>
                ) : (
                  <div className="text-center">
                    <Lock className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs text-gray-400">Faça login para acessar</p>
                  </div>
                )}
              </div>
              
              <div className="glassmorphism rounded-lg p-4 border border-amber-400">
                <h3 className="font-semibold text-amber-300 mb-3">📝 Consultoria por Escrita</h3>
                <p className="text-sm text-gray-300 mb-2">
                  💬 Chat direto de 24h + consultoria por escrito detalhada
                </p>
                <div className="bg-amber-500/20 rounded p-2 mb-3">
                  <p className="text-xs text-amber-200">
                    ⏱️ <strong>Resposta em até 24 horas + Chat imediato</strong><br/>
                    📬 Consultoria + comunicação direta com profissional
                  </p>
                </div>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => handleConnect("consultoria_escrita", 1500, "Consultoria por Escrita + Chat 24h")}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm border border-amber-400"
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? "Consumindo tokens..." : "📝 Consultoria + Chat (1.500 tokens)"}
                  </Button>
                ) : (
                  <div className="text-center">
                    <Lock className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs text-gray-400">Faça login para acessar</p>
                  </div>
                )}
              </div>
              
              <div className="glassmorphism rounded-lg p-4 border border-red-500">
                <h3 className="font-semibold text-red-400 mb-3 flex items-center">
                  🚨 Combinar Projeto
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  💬 Chat direto de 24h + intermediação de contato para projetos especiais
                </p>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => handleConnect("combinar_projeto", 1000, "Intermediação + Chat 24h")}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm border border-red-400"
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? "Consumindo tokens..." : "🚨 Chat + Intermediação (1.000 tokens)"}
                  </Button>
                ) : (
                  <div className="text-center">
                    <Lock className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs text-gray-400">Faça login para acessar</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Services Grid - Dynamic Professional Services */}
            {services && services.length > 0 && (
              <>
                <h3 className="text-lg sm:text-xl mb-3 sm:mb-4 neon-text">🛠️ Serviços Específicos</h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {services.map((service) => (
                    <div key={service.id} className="glassmorphism rounded-lg p-3 sm:p-4 border border-cyan-500/30">
                      <h4 className="font-semibold text-[var(--neon-cyan)] mb-2 text-sm sm:text-base">{service.serviceName}</h4>
                      <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">{service.description}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-cyan-400">{service.tokenPrice} tokens</span>
                          <span className="text-xs text-gray-400">⏱️ {service.estimatedDuration}</span>
                        </div>
                        {isAuthenticated && user?.plan !== 'free' ? (
                          <Button 
                            onClick={() => handleConnect(service.serviceType, service.tokenPrice, service.serviceName)}
                            className="neon-button text-xs sm:text-sm py-1.5 sm:py-2 w-full sm:w-auto"
                            disabled={connectMutation.isPending}
                          >
                            {connectMutation.isPending ? "Contratando..." : "💼 Contratar"}
                          </Button>
                        ) : (
                          <div className="text-center">
                            <Lock className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                            <p className="text-xs text-gray-400">Login necessário</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Fallback Services Grid for backwards compatibility */}
            <h3 className="text-lg sm:text-xl mb-3 sm:mb-4 neon-text">Serviços Disponíveis</h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {(professional.services || professional.skills || []).map((service, index) => {
                // Definir preços baseado no tipo de serviço
                let price = 1500; // padrão
                let description = `Serviço especializado em ${service.toLowerCase()}`;
                
                if (service.includes('Machine Learning') || service.includes('Neural Networks')) {
                  price = 3000;
                  description = 'Tópico técnico especializado';
                } else if (service.includes('AI Strategy')) {
                  price = 2500;
                  description = 'Alta complexidade, menor volume';
                } else if (service.includes('Direito') || service.includes('Trabalhista') || service.includes('Família')) {
                  price = 1500;
                  description = 'Serviço especializado em direito civil';
                }
                
                return (
                  <div key={index} className="glassmorphism rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-[var(--neon-cyan)] mb-2 text-sm sm:text-base truncate">{service}</h3>
                    <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                      💬 Chat direto de 24h + {description.toLowerCase()}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-cyan-400">{price} tokens + Chat 24h</span>
                      {isAuthenticated ? (
                        <Button 
                          onClick={() => handleConnect(`servico_${service.toLowerCase().replace(/\s+/g, '_')}`, price, service)}
                          className="neon-button text-xs sm:text-sm py-1.5 sm:py-2 w-full sm:w-auto"
                          disabled={connectMutation.isPending}
                        >
                          {connectMutation.isPending ? "Conectando..." : "Conectar"}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center space-x-1 text-gray-400">
                          <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs">Login necessário</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Marketplace Items - Mobile Optimized */}
            <h3 className="text-lg sm:text-xl mb-3 sm:mb-4 neon-text">Produtos e Recursos</h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="glassmorphism rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold mb-2 text-sm sm:text-base">📋 Plano de Trabalho (template)</h4>
                <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                  💬 Chat direto de 24h + template personalizado para organização de projetos
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-cyan-400">1.000 tokens + Chat 24h</span>
                  {isAuthenticated ? (
                    <Button 
                      onClick={() => handleConnect("plano_trabalho", 1000, "Plano de Trabalho (Template)")}
                      className="neon-button text-xs sm:text-sm py-1.5 w-full sm:w-auto"
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? "Conectando..." : "Acessar"}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center space-x-1 text-gray-400">
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs">Login necessário</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="glassmorphism rounded-lg p-4">
                <h4 className="font-semibold mb-2">🎓 Curso Online</h4>
                <p className="text-sm text-gray-300 mb-3">
                  💬 Chat direto de 24h + material didático completo e exclusivo
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cyan-400">5.000 tokens + Chat 24h</span>
                  {isAuthenticated ? (
                    <Button 
                      onClick={() => handleConnect("curso_online", 5000, "Curso Online")}
                      className="neon-button text-sm"
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? "Conectando..." : "Conectar"}
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Lock className="h-4 w-4" />
                      <span className="text-xs">Login necessário</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="glassmorphism rounded-lg p-4">
                <h4 className="font-semibold mb-2">⚡ Consultoria Express (30min)</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Atendimento rápido e focado por videochamada
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold">1.500 tokens</span>
                  {isAuthenticated ? (
                    <Button 
                      onClick={() => handleConnect("consultoria_express", 1500, "Consultoria Express (30min)")}
                      className="neon-button text-sm"
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? "Consumindo tokens..." : "Conectar"}
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Lock className="h-4 w-4" />
                      <span className="text-xs">Login necessário</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="glassmorphism rounded-lg p-4">
                <h4 className="font-semibold mb-2">📱 Suporte WhatsApp (7 dias)</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Canal direto por 7 dias para dúvidas
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold">2.000 tokens</span>
                  <Button 
                    onClick={() => handleConnect("suporte_whatsapp", 2000, "Suporte WhatsApp (7 dias)")}
                    className="neon-button text-sm"
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? "Consumindo tokens..." : "Conectar"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Sistema de Rastreamento em Tempo Real */}
            {isAuthenticated && (
              <div className="mt-6 pt-6 border-t border-gray-600">
                <div className="glassmorphism rounded-lg p-4 mb-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-500/20">
                  <h4 className="font-semibold mb-2 text-green-400">🚗 Rastreamento em Tempo Real</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Monitore a localização do profissional e tempo de chegada quando o serviço for ativo
                  </p>
                  <ServiceTrackingButton 
                    professionalId={professional.id}
                    professionalName={professional.name}
                    serviceId={`service_${professional.id}_${Date.now()}`}
                    isActive={true} // Por enquanto sempre ativo para demonstração
                  />
                </div>
              </div>
            )}
            
            {/* Add to Team Button - Apenas para usuários autenticados com planos pagos */}
            {isAuthenticated ? (
              (user && user.plan !== 'free') || (user?.email === 'passosmir4@gmail.com') ? (
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        console.log("🔥 BOTÃO CLICADO - Forçando modal");
                        setShowTeamModal(true); // FORÇA o modal a aparecer
                        addToTeamMutation.mutate(); // E tenta adicionar
                      }}
                      disabled={addToTeamMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-500 to-[var(--neon-cyan)] hover:from-purple-600 hover:to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      {addToTeamMutation.isPending ? 'Adicionando...' : 'Adicionar ao Time'}
                    </Button>
                    
                    <Button
                      onClick={() => setShowTeamSelection(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Montar Equipe Completa
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Monte sua equipe de até 10 profissionais com descontos automáticos
                  </p>
                </div>
              ) : (
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="text-center text-gray-400 text-sm">
                    <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>Funcionalidade de Teams disponível apenas para planos pagos</p>
                    <Button 
                      onClick={() => {/* Open plans modal */}}
                      className="mt-3 neon-button text-sm"
                    >
                      Ver Planos
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-600">
                <div className="text-center text-gray-400 text-sm">
                  <Lock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Faça login para acessar as funcionalidades de Teams</p>
                  <p className="text-xs mt-1">Exploração de perfis liberada - Teams requer cadastro</p>
                </div>
              </div>
            )}

            {/* Token Confirmation Modal */}
            <AnimatePresence>
              {showConfirmModal && (
                <motion.div
                  className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="glassmorphism rounded-xl p-6 max-w-md w-full mx-4 border border-yellow-400/50"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🪙</span>
                      </div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">
                        Confirmar Consumo de Tokens
                      </h3>
                      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 mb-4">
                        <p className="font-semibold text-yellow-300 mb-1">
                          Serviço: {pendingService?.serviceName}
                        </p>
                        <p className="text-sm text-gray-300 mb-2">
                          Profissional: {professional?.name}
                        </p>
                        <p className="text-2xl font-bold text-yellow-400">
                          💰 {pendingService?.tokenCost.toLocaleString()} tokens
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Os tokens serão deduzidos imediatamente da sua carteira após confirmação.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={confirmTokenConsumption}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3"
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending ? "⏳ Consumindo..." : "✅ Confirmar e Consumir Tokens"}
                      </Button>
                      <Button
                        onClick={cancelTokenConsumption}
                        variant="outline"
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        ❌ Cancelar
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Team Navigation Modal */}
            <AnimatePresence>
              {showTeamModal && (
                <motion.div
                  className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="glassmorphism rounded-xl p-6 max-w-md w-full mx-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold neon-text mb-2">
                        Time Atualizado!
                      </h3>
                      <p className="text-gray-300 text-sm">
                        <span className="font-semibold text-[var(--neon-cyan)]">{professional?.name}</span> está 
                        em seu time. Deseja ir para a aba "Teams" para gerenciar sua equipe 
                        ou continuar navegando?
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => {
                          setShowTeamModal(false);
                        }}
                      >
                        Continuar Navegando
                      </Button>
                      <Button
                        className="flex-1 neon-button"
                        onClick={() => {
                          setShowTeamModal(false);
                          onClose();
                          // Navigate to teams page using wouter
                          setLocation('/teams');
                        }}
                      >
                        Ir para Teams
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sistema de Seleção de Equipes */}
            <TeamSelectionSystem
              isOpen={showTeamSelection}
              onClose={() => setShowTeamSelection(false)}
              initialProfessional={professional}
            />

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
