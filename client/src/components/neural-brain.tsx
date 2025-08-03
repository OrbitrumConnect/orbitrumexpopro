import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface NeuralBrainProps {
  onClick: () => void;
}

export function NeuralBrain({ onClick }: NeuralBrainProps) {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: i * 0.4,
    position: {
      top: i === 0 ? -10 : i === 1 ? 15 : i === 2 ? 10 : i === 4 ? -8 : i === 5 ? 18 : -5,
      left: i === 0 ? 20 : i === 1 ? -5 : i === 2 ? -8 : i === 4 ? 30 : i === 5 ? -12 : 25,
      right: i === 1 ? -5 : i === 3 ? 25 : i === 5 ? -12 : undefined,
      bottom: i === 2 ? 10 : i === 3 ? -5 : i === 4 ? -8 : undefined,
    }
  }));

  return (
    <motion.div 
      className="relative z-30 cursor-pointer touch-manipulation"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{ touchAction: 'manipulation' }}
    >
      <div className="neural-brain w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center">
        <Brain className="text-2xl md:text-4xl text-white" size={36} />
      </div>
      
      {/* Neural Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle absolute"
          style={{
            ...particle.position,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}
