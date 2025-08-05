import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";
import type { Professional } from "@shared/schema";

interface SimpleOrbProps {
  professional: Professional;
  onClick: () => void;
}

export function SimpleOrb({ professional, onClick }: SimpleOrbProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const renderStars = () => {
    const fullStars = Math.floor(professional.rating);
    return (
      <div className="flex justify-center mt-1 space-x-0.5">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star
            key={i}
            className="text-yellow-400 w-1.5 h-1.5 fill-current"
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="flex flex-col items-center relative cursor-pointer"
      drag
      dragMomentum={false}
      dragElastic={0}
      whileHover={{ scale: isDragging ? 1 : 1.1 }}
      whileDrag={{ scale: 1.2, zIndex: 50 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setTimeout(() => setIsDragging(false), 100);
      }}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          console.log('CLIQUE NO ORB:', professional.name);
          onClick();
        }
      }}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="professional-orb w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-[var(--neon-cyan)] shadow-lg shadow-cyan-500/20">
        <img
          src={professional.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'}
          alt={professional.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback em caso de erro ao carregar imagem
            e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100';
          }}
        />
      </div>
      {renderStars()}
    </motion.div>
  );
}