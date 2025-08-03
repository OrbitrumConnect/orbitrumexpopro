import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Rocket, X, Search, Globe, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFreePlanStatus } from "@/hooks/usePlanValidation";

interface FreePlanLimitsProps {
  onUpgrade: () => void;
}

interface FreePlanUsage {
  planetas: { usado: number; limite: number };
  buscasIA: { usado: number; limite: number };
  perfis: { usado: number; limite: number };
  mensagensRecebidas: { usado: number; limite: number };
  resetDate: string; // Data do próximo reset (1º do mês)
}

export function FreePlanLimits({ onUpgrade }: FreePlanLimitsProps) {
  const { user } = useAuth();
  const { data: planStatus, isLoading } = useFreePlanStatus();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitType, setLimitType] = useState<string>("");
  const [usage, setUsage] = useState<FreePlanUsage>({
    planetas: { usado: 0, limite: 2 },
    buscasIA: { usado: 0, limite: 10 },
    perfis: { usado: 0, limite: 1 },
    mensagensRecebidas: { usado: 0, limite: 2 },
    resetDate: new Date().toISOString()
  });

  // Verificar se usuário tem plano Free Orbitrum
  const isFreePlan = planStatus?.isFreePlan && planStatus?.planName === "Free Orbitrum";

  // Se não é plano free, não mostrar limitações
  if (!isFreePlan || planStatus?.unlimited || isLoading) {
    return null;
  }

  const limits = planStatus.limits;
  if (!limits) {
    return null;
  }

  // Atualizar lógica de uso para usar dados do backend
  useEffect(() => {
    if (user?.plan === 'freeOrbitrum') {
      const savedUsage = localStorage.getItem(`free-usage-${user.email}`);
      const now = new Date();
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      if (savedUsage) {
        const parsed = JSON.parse(savedUsage);
        
        // Verificar se precisa resetar (passou do dia 1º)
        const resetDate = new Date(parsed.resetDate);
        if (now >= resetDate) {
          // Reset mensal
          const newUsage: FreePlanUsage = {
            planetas: { usado: 0, limite: 2 },
            buscasIA: { usado: 0, limite: 10 },
            perfis: { usado: 0, limite: 1 },
            mensagensRecebidas: { usado: 0, limite: 2 },
            resetDate: firstDayNextMonth.toISOString()
          };
          setUsage(newUsage);
          localStorage.setItem(`free-usage-${user.email}`, JSON.stringify(newUsage));
        } else {
          setUsage(parsed);
        }
      } else {
        // Primeira vez - criar novo registro
        const newUsage: FreePlanUsage = {
          planetas: { usado: 0, limite: 2 },
          buscasIA: { usado: 0, limite: 10 },
          perfis: { usado: 0, limite: 1 },
          mensagensRecebidas: { usado: 0, limite: 2 },
          resetDate: firstDayNextMonth.toISOString()
        };
        setUsage(newUsage);
        localStorage.setItem(`free-usage-${user.email}`, JSON.stringify(newUsage));
      }
    }
  }, [user]);

  // Função para verificar se pode usar uma funcionalidade
  const canUse = (type: keyof FreePlanUsage): boolean => {
    if (!usage || user?.plan !== 'free') return true;
    if (type === 'resetDate') return true;
    
    const limit = usage[type] as { usado: number; limite: number };
    return limit.usado < limit.limite;
  };

  // Função para incrementar uso
  const incrementUsage = (type: keyof FreePlanUsage): boolean => {
    if (!usage || user?.plan !== 'free') return true;
    if (type === 'resetDate') return true;

    const limit = usage[type] as { usado: number; limite: number };
    
    if (limit.usado >= limit.limite) {
      setLimitType(type);
      setShowLimitModal(true);
      return false;
    }

    const newUsage = {
      ...usage,
      [type]: { ...limit, usado: limit.usado + 1 }
    };
    
    setUsage(newUsage);
    localStorage.setItem(`free-usage-${user.email}`, JSON.stringify(newUsage));
    return true;
  };

  // Função para obter mensagem personalizada por tipo de limite
  const getLimitMessage = (type: string): string => {
    switch (type) {
      case 'planetas':
        return 'Você visualizou 2 planetas profissionais! Próximas visualizações em 3 dias.';
      case 'buscasIA':
        return 'Você atingiu o limite de 10 buscas IA este mês!';
      case 'perfis':
        return 'Você visualizou 1 perfil completo hoje!';
      case 'mensagensRecebidas':
        return 'Você atingiu o limite de 2 mensagens recebidas este mês!';
      default:
        return 'Você atingiu o limite do plano Free Orbitrum este mês!';
    }
  };

  // Exportar funções para uso em outros componentes
  if (typeof window !== 'undefined') {
    (window as any).freeOrbitrumLimits = {
      canUse,
      incrementUsage,
      usage
    };
  }

  if (user?.plan !== 'free' || !usage) return null;

  return (
    <>
      {/* Indicador de uso no canto da tela */}
      <motion.div 
        className="fixed top-20 right-4 z-30 glassmorphism rounded-lg p-2 border border-cyan-400/30 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2 }}
      >
        <div className="text-xs text-cyan-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>🚀 Free</span>
            <span className="text-cyan-300">Orbitrum</span>
          </div>
          <div className="text-[10px] space-y-0.5">
            <div>🪐 {usage.planetas.usado}/{usage.planetas.limite}</div>
            <div>🔍 {usage.buscasIA.usado}/{usage.buscasIA.limite}</div>
            <div>👤 {usage.perfis.usado}/{usage.perfis.limite}</div>
            <div>💬 {usage.mensagensRecebidas.usado}/{usage.mensagensRecebidas.limite}</div>
          </div>
        </div>
      </motion.div>

      {/* Modal de limite atingido */}
      <AnimatePresence>
        {showLimitModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLimitModal(false)}
          >
            <motion.div 
              className="glassmorphism rounded-lg p-6 max-w-md w-full border border-cyan-400/30 bg-black/40"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  <span className="text-2xl">🚀</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowLimitModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  ✋ {getLimitMessage(limitType)}
                </h3>
                
                <p className="text-gray-300 text-sm">
                  Para continuar aproveitando a galáxia profissional do Orbitrum Connect, 
                  atualize seu plano agora mesmo.
                </p>
                
                <p className="text-cyan-400 text-sm font-medium">
                  Escolha entre opções acessíveis a partir de <strong>R$7/mês</strong>.
                </p>
                
                <p className="text-gray-400 text-xs">
                  🌌 Libere buscas, mensagens, destaque e muito mais!
                </p>

                <div className="space-y-3 pt-2">
                  <Button 
                    onClick={() => {
                      setShowLimitModal(false);
                      onUpgrade();
                    }}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold"
                  >
                    🔓 Desbloquear recursos
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLimitModal(false)}
                    className="w-full border-gray-500 text-gray-400 hover:bg-gray-700"
                  >
                    Continuar com Free
                  </Button>
                </div>

                {usage && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <p className="text-xs text-gray-500">
                      Próximo reset: {new Date(usage.resetDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook para usar as limitações do plano free em outros componentes
export function useFreePlanLimits() {
  const { user } = useAuth();
  
  const checkLimit = (type: 'planetas' | 'buscasIA' | 'perfis' | 'mensagensRecebidas'): boolean => {
    if (user?.plan !== 'free') return true;
    
    if (typeof window !== 'undefined' && (window as any).freeOrbitrumLimits) {
      return (window as any).freeOrbitrumLimits.canUse(type);
    }
    
    return false;
  };
  
  const useLimit = (type: 'planetas' | 'buscasIA' | 'perfis' | 'mensagensRecebidas'): boolean => {
    if (user?.plan !== 'free') return true;
    
    if (typeof window !== 'undefined' && (window as any).freeOrbitrumLimits) {
      return (window as any).freeOrbitrumLimits.incrementUsage(type);
    }
    
    return false;
  };
  
  return {
    isFree: user?.plan === 'free',
    checkLimit,
    useLimit
  };
}