import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Brain } from "lucide-react";

interface PlansTriggerProps {
  onClick: () => void;
  isSearchActive?: boolean;
}

export function PlansTrigger({ onClick, isSearchActive = false }: PlansTriggerProps) {
  return (
    <motion.div 
      className={`fixed z-25 transition-all duration-500 ${
        isSearchActive 
          ? 'bottom-2 left-2 scale-[0.4] opacity-60' 
          : 'bottom-8 left-1 sm:bottom-12 sm:left-2 md:bottom-16 md:left-4 opacity-100'
      }`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: isSearchActive ? 0.6 : 1, 
        y: 0,
        scale: isSearchActive ? 0.4 : 1
      }}
      transition={{ delay: 1.5, duration: 0.5 }}
    >
      <div className="glassmorphism rounded-full px-3 py-2 flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 md:px-6 md:py-3 md:space-x-4 scale-[0.63] sm:scale-[0.72] md:scale-[0.9] shadow-2xl border border-cyan-400/30">
        {/* Plans Button - Gradiente harmonioso */}
        <Button 
          onClick={onClick}
          className="glassmorphism rounded-full p-2 transition-all group md:p-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 border border-cyan-400/50 hover:border-cyan-400 text-white shadow-lg hover:shadow-xl"
          variant="ghost"
          size="sm"
        >
          <motion.div
            whileHover={{ scale: 1.15, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center space-x-1.5 md:space-x-2"
          >
            <Rocket className="h-4 w-4 neon-text group-hover:text-cyan-300 md:h-5 md:w-5 text-cyan-400" />
            <span className="text-sm neon-text md:text-base font-medium text-cyan-300">Planos</span>
          </motion.div>
        </Button>

        {/* Instruction Text */}
        <div className="text-center">
          <p className="neon-text text-xs font-bold mb-0.5 md:text-sm">
            <Brain className="inline h-2.5 w-2.5 mr-1 md:h-3.5 md:w-3.5" />
            <span className="hidden sm:inline">Clique no Cérebro para Começar!</span>
            <span className="sm:hidden">Toque Cérebro!</span>
          </p>
          <div className="hidden md:flex space-x-2.5 text-xs opacity-75">
            <span>🖱️ Duplo clique = Perfil</span>
            <span>✋ Arraste = Mover</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}