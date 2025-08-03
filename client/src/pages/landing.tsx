import { StarfieldBackground } from "@/components/starfield-background";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { Rocket, Users, Shield, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleLoginSuccess = () => {
    setLoginModalOpen(false);
    // A autenticação será gerenciada pelo AuthContext
    setTimeout(() => {
      window.location.reload(); // Recarregar para atualizar o estado
    }, 500);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <StarfieldBackground />
      
      {/* Header simplificado */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <nav className="flex justify-between items-center glassmorphism rounded-full px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--electric-blue)]" />
            <span className="font-bold text-xl neon-text">Orbtrum Connect</span>
            <span className="text-xs bg-blue-500 bg-opacity-20 border border-blue-400 px-2 py-1 rounded text-blue-300 font-semibold">
              BETA
            </span>
          </div>
          
          <Button 
            onClick={() => setLoginModalOpen(true)}
            className="neon-button rounded-full font-semibold px-4 py-2"
          >
            <Shield className="mr-2 h-4 w-4" />
            ENTRAR
          </Button>
        </nav>
      </header>

      {/* Conteúdo principal */}
      <main className="min-h-screen flex items-center justify-center relative pt-16 pb-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[var(--neon-cyan)] to-purple-400 bg-clip-text text-transparent">
                Conecte-se ao Futuro
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              A plataforma de networking profissional mais avançada do universo
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mb-12"
          >
            <div className="glassmorphism p-6 rounded-lg">
              <Rocket className="h-12 w-12 text-[var(--neon-cyan)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sistema Orbital</h3>
              <p className="text-gray-400">Visualize profissionais em órbita interativa</p>
            </div>
            
            <div className="glassmorphism p-6 rounded-lg">
              <Users className="h-12 w-12 text-[var(--neon-cyan)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Times Espaciais</h3>
              <p className="text-gray-400">Monte equipes de até 10 profissionais</p>
            </div>
            
            <div className="glassmorphism p-6 rounded-lg">
              <Star className="h-12 w-12 text-[var(--neon-cyan)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sistema de Tokens</h3>
              <p className="text-gray-400">Ganhe tokens jogando e conectando</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button 
              onClick={() => setLoginModalOpen(true)}
              className="neon-button rounded-full font-semibold px-8 py-4 text-lg"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              ACESSAR PLATAFORMA
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              * Acesso restrito a usuários cadastrados
            </p>
          </motion.div>
        </div>
      </main>

      <LoginModal 
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}