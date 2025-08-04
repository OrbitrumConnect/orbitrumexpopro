import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { X, Play, Coins, Info, Trophy, Timer, Heart, Target } from "lucide-react";
import { NewOrbitGame } from "./new-orbit-game";
// import type { WalletView } from "@shared/token-operations";
import type { User } from "@shared/schema";

interface NewGameOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewGameOverlay({ isOpen, onClose }: NewGameOverlayProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [guestGamesPlayed, setGuestGamesPlayed] = useState(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/1"],
    enabled: isOpen && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = user?.email === 'passosmir4@gmail.com';
  const isFreeMode = !isAdmin && (!isAuthenticated || !user || user.plan === 'free');

  const { data: wallet } = useQuery<any>({
    queryKey: isAdmin ? ["/api/admin/wallet"] : ["/api/users/1/wallet"],
    enabled: isOpen && isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const chargeTokens = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not found");
      
      if (isAdmin) {
        return { success: true };
      }
      
      const newTokenBalance = user.tokens - 250;
      if (newTokenBalance < 0) {
        throw new Error("Saldo insuficiente");
      }
      
      return apiRequest("PATCH", "/api/users/1/tokens", { 
        tokens: newTokenBalance 
      });
    },
    onSuccess: () => {
      if (!isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["/api/users/1"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/1/wallet"] });
      }
      setGameStarted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message === "Saldo insuficiente" 
          ? "Você precisa de pelo menos 250 tokens para jogar"
          : "Erro ao processar pagamento",
        variant: "destructive",
      });
    },
  });

  const handleStartGame = () => {
    if (isAdmin) {
      setGameStarted(true);
      return;
    }

    if (!isAuthenticated) {
      if (guestGamesPlayed < 3) {
        setGuestGamesPlayed(prev => prev + 1);
        setGameStarted(true);
      } else {
        toast({
          title: "Limite Atingido",
          description: "Faça login para continuar jogando e ganhar tokens reais",
          variant: "destructive",
        });
      }
      return;
    }
    
    if (user && (isAdmin || (user as any).gamesPlayedToday < 2)) {
      if (isAdmin || (wallet && wallet.saldoTotal >= 250)) {
        chargeTokens.mutate();
      } else {
        toast({
          title: "Saldo Insuficiente",
          description: "Você precisa de pelo menos 250 tokens para jogar",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Limite Diário",
        description: "Você já jogou 2 vezes hoje. Volte amanhã!",
        variant: "destructive",
      });
    }
  };

  const handleGameEnd = () => {
    setGameStarted(false);
  };

  const handleClose = () => {
    setGameStarted(false);
    onClose();
  };

  const canPlay = isAdmin 
    ? true
    : isAuthenticated 
      ? (user && (user as any).gamesPlayedToday < 2 && (wallet?.saldoTotal ?? 0) >= 250)
      : (guestGamesPlayed < 3);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "radial-gradient(circle at center, rgba(139, 69, 19, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%)"
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[85vh] overflow-auto"
        >
          {gameStarted ? (
            <div className="glassmorphism rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold neon-text">Orbit Shooter</h2>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <NewOrbitGame onGameEnd={handleGameEnd} />
            </div>
          ) : (
            <div className="glassmorphism rounded-2xl p-6 text-center max-w-xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold neon-text">Orbit Shooter</h2>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Game Preview */}
              <div className="w-full h-32 sm:h-40 bg-gradient-to-b from-indigo-900 to-purple-900 rounded-lg mb-4 sm:mb-6 flex items-center justify-center border-2 border-cyan-400">
                <div className="text-center">
                  <div className="text-6xl mb-2">🚀</div>
                  <p className="text-gray-300">Controle sua nave e destrua os profissionais!</p>
                </div>
              </div>

              {/* Game Info */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="glassmorphism p-2 sm:p-4 rounded-lg">
                  <Timer className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-300">Duração</p>
                  <p className="text-sm sm:text-lg font-bold text-blue-400">50s</p>
                </div>
                
                <div className="glassmorphism p-2 sm:p-4 rounded-lg">
                  <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-300">Vidas</p>
                  <p className="text-sm sm:text-lg font-bold text-red-400">3</p>
                </div>
                
                {!isFreeMode && !isAdmin && (
                  <>
                    <div className="glassmorphism p-2 sm:p-4 rounded-lg">
                      <Coins className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-gray-300">Custo</p>
                      <p className="text-sm sm:text-lg font-bold text-yellow-400">250</p>
                    </div>
                    
                    <div className="glassmorphism p-2 sm:p-4 rounded-lg">
                      <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-green-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-gray-300">Prêmio</p>
                      <p className="text-sm sm:text-lg font-bold text-green-400">850</p>
                    </div>
                  </>
                )}
              </div>

              {/* User Status */}
              {!isAuthenticated ? (
                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400 rounded-lg">
                  <Info className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-300 text-sm">
                    <strong>Modo Visitante</strong><br />
                    Jogos restantes: {3 - guestGamesPlayed}/3<br />
                    Faça login para ganhar tokens reais!
                  </p>
                </div>
              ) : isAdmin ? (
                <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400 rounded-lg">
                  <Info className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-300 text-sm">
                    <strong>Modo Administrador</strong><br />
                    Jogos ilimitados e gratuitos
                  </p>
                </div>
              ) : isFreeMode ? (
                <div className="mb-6 p-4 bg-orange-500/20 border border-orange-400 rounded-lg">
                  <Info className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-300 text-sm">
                    <strong>Modo FREE</strong><br />
                    Jogos sem recompensas de tokens<br />
                    Adquira um plano para ganhar tokens!
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-400 rounded-lg">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <Coins className="h-5 w-5 text-green-400" />
                    <span className="text-green-300">
                      Saldo: {wallet?.saldoTotal || 0} tokens
                    </span>
                  </div>
                  <p className="text-green-300 text-sm">
                    Jogos hoje: {(user as any)?.gamesPlayedToday || 0}/2
                  </p>
                </div>
              )}

              {/* Important Notice */}
              <div className="mb-4 p-4 bg-blue-500/20 border border-blue-400 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-blue-400" />
                  <span className="font-bold text-blue-300">AVISO IMPORTANTE</span>
                </div>
                <p className="text-blue-200 text-sm">
                  <strong>Este é um JOGO DE HABILIDADE, não um cassino.</strong><br />
                  Baseado na sua destreza para controlar a nave e acertar alvos.<br />
                  Resultado depende 100% da sua habilidade e estratégia.
                </p>
              </div>

              {/* Game Rules */}
              <div className="mb-6 text-left glassmorphism p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-3">Regras do Jogo:</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <h4 className="text-cyan-400 font-semibold mb-2">💰 Sistema de Tokens (Apenas Planos Pagos):</h4>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Restrição:</strong> Sistema válido apenas para usuários com planos ativos</li>
                      <li>• Custo por jogo: 250 tokens consumidos ao entrar</li>
                      <li>• Fonte: Tokens debitados da carteira do usuário</li>
                      <li>• Meta mínima: 400 tokens durante a partida para ganhar</li>
                      <li>• Prêmio: Jogadores acima de 400 recebem tokens na carteira</li>
                      <li>• Perda: Tokens perdidos vão para carteira administrativa</li>
                      <li>• Limite diário: 2 partidas máximo por usuário</li>
                      <li>• Plano gratuito: Apenas modo diversão sem recompensas</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-red-400 font-semibold mb-2">🎮 Como Jogar:</h4>
                    <ul className="space-y-1 ml-4">
                      <li>• <Target className="inline h-3 w-3 mr-1" />Mova com WASD/setas ou toque</li>
                      <li>• <Heart className="inline h-3 w-3 mr-1" />3 vidas (inimigos = -1, luas = -2)</li>
                      <li>• <Trophy className="inline h-3 w-3 mr-1" />16 tokens por inimigo eliminado</li>
                      <li>• <Timer className="inline h-3 w-3 mr-1" />Sobreviva 50 segundos</li>
                      <li>• <Coins className="inline h-3 w-3 mr-1" />Quanto mais acertos, mais tokens</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-yellow-400 font-semibold mb-2">🌙 Obstáculos Perigosos:</h4>
                    <ul className="space-y-1 ml-4">
                      <li>• Luas rotativas com brilho vermelho</li>
                      <li>• Causam duplo dano (2 vidas perdidas)</li>
                      <li>• Ricocheteiam nas paredes</li>
                      <li>• Máximo 2 luas simultâneas</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Play Button */}
              <Button
                onClick={handleStartGame}
                disabled={!canPlay || chargeTokens.isPending}
                className="w-full py-4 text-lg font-bold neon-button"
              >
                {chargeTokens.isPending ? (
                  "Processando..."
                ) : !canPlay ? (
                  isAuthenticated ? "Limite Diário Atingido" : "Limite de Jogos Atingido"
                ) : (
                  <>
                    <Play className="mr-2 h-6 w-6" />
                    {isAdmin ? "JOGAR (Admin)" : 
                     isFreeMode ? "JOGAR (Modo FREE)" :
                     isAuthenticated ? "JOGAR (250 tokens)" : 
                     "JOGAR (Visitante)"}
                  </>
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-400 mt-4">
                  Crie uma conta para jogar ilimitadamente e ganhar tokens reais
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}