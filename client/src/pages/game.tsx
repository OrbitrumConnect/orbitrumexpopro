import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NewOrbitGame } from "@/components/new-orbit-game";
import { StarfieldBackground } from "@/components/starfield-background";
import { Home, Play } from "lucide-react";

export function GamePage() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleGameEnd = () => {
    setGameStarted(false);
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: '#020914', overflow: 'hidden' }}>
      <StarfieldBackground />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ background: 'rgba(2,9,20,0.8)' }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          
          <h1 className="text-xl sm:text-2xl font-bold text-cyan-400">Orbit Shooter</h1>
          
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto">
          {gameStarted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glassmorphism rounded-2xl p-3 sm:p-6 scale-[0.8] sm:scale-100"
            >
              <NewOrbitGame onGameEnd={handleGameEnd} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center glassmorphism rounded-2xl p-4 sm:p-8 max-w-2xl mx-auto scale-[0.8] sm:scale-100"
            >
              <div className="mb-6">
                <div className="text-6xl sm:text-8xl mb-4">🚀</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-4">
                  Orbit Shooter
                </h2>
                <p className="text-gray-300 text-sm sm:text-base">
                  Controle sua nave espacial e destrua os profissionais orbitais para ganhar pontos e tokens!
                </p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glassmorphism p-3 sm:p-4 rounded-lg">
                  <div className="text-2xl mb-2">⏱️</div>
                  <p className="text-xs sm:text-sm text-gray-300">Duração</p>
                  <p className="text-sm sm:text-lg font-bold text-blue-400">50 segundos</p>
                </div>
                
                <div className="glassmorphism p-3 sm:p-4 rounded-lg">
                  <div className="text-2xl mb-2">❤️</div>
                  <p className="text-xs sm:text-sm text-gray-300">Vidas</p>
                  <p className="text-sm sm:text-lg font-bold text-red-400">3 vidas</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6 text-left glassmorphism p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">Como Jogar:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-300 mb-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Desktop:</h4>
                    <ul className="space-y-1">
                      <li>• WASD ou Setas: Mover</li>
                      <li>• Espaço: Atirar</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Mobile:</h4>
                    <ul className="space-y-1">
                      <li>• Toque: Mover nave</li>
                      <li>• Disparo automático</li>
                    </ul>
                  </div>
                </div>
                
                {/* Pontuação e Regras */}
                <div className="border-t border-white/20 pt-4">
                  <h4 className="font-semibold text-cyan-400 mb-2">Sistema de Tokens (Apenas Planos Pagos):</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-300">
                    <li>• Elegibilidade: Apenas usuários com planos ativos</li>
                    <li>• Custo: 250 tokens consumidos ao entrar</li>
                    <li>• 16 tokens por inimigo eliminado</li>
                    <li>• Meta: 400 tokens para ganhar prêmios</li>
                    <li>• Vitória: Tokens ganhos para sua carteira</li>
                    <li>• Derrota: Tokens perdidos para admin</li>
                    <li>• Limite: 2 jogos por dia</li>
                    <li>• Plano gratuito: Modo diversão sem tokens</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleStartGame}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold neon-button"
              >
                <Play className="mr-2 h-6 w-6" />
                INICIAR JOGO
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}