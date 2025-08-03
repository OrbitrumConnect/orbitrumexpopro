import { motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { useState } from "react";
import type { Professional } from "@shared/schema";

interface ProfessionalOrbProps {
  professional: Professional;
  onDoubleClick: () => void;
  onRemove?: (id: number) => void;
}

export function ProfessionalOrb({ professional, onDoubleClick, onRemove }: ProfessionalOrbProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const renderStars = () => {
    const fullStars = Math.floor(professional.rating);
    const hasHalfStar = professional.rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex justify-center mt-1 space-x-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }, (_, i) => (
          <Star
            key={`full-${i}`}
            className="text-yellow-400 w-1.5 h-1.5 fill-current"
            style={{ textShadow: '0 0 2px rgba(255, 235, 59, 0.6)' }}
          />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <Star
            key="half"
            className="text-yellow-400 w-1.5 h-1.5"
            style={{ textShadow: '0 0 2px rgba(255, 235, 59, 0.6)' }}
          />
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star
            key={`empty-${i}`}
            className="text-gray-500 w-1.5 h-1.5"
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="flex flex-col items-center relative group z-20"
      whileHover={{ scale: 1.1 }}
      style={{ cursor: 'pointer' }}
      drag={false}
      dragConstraints={{ left: -400, right: 400, top: -300, bottom: 300 }}
      onDragStart={() => {
        console.log('🔥 DRAG START for:', professional.name);
        setIsDragging(true);
      }}
      onDragEnd={() => {
        console.log('🔥 DRAG END for:', professional.name);
        setTimeout(() => {
          console.log('🔥 RESETTING isDragging to false for:', professional.name);
          setIsDragging(false);
        }, 50);
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div 
        className="professional-orb orb-professional w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden cursor-pointer relative"
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔥 ORB CLICKED:', professional.name);
          console.log('🔥 CALLING onDoubleClick for:', professional.name);
          onDoubleClick();
        }}
      >
        <img
          src={professional.avatar}
          alt={professional.name}
          className="w-full h-full object-cover"
        />
        
        {/* Close button X vermelho neon - appears on hover */}
        {isHovered && !isDragging && (
          <motion.button
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 z-10"
            style={{
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8), 0 0 12px rgba(239, 68, 68, 0.6)',
              filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: '0 0 12px rgba(239, 68, 68, 1), 0 0 16px rgba(239, 68, 68, 0.8)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Removing professional:', professional.id);
              onRemove?.(professional.id);
            }}
          >
            <X className="w-2.5 h-2.5 text-white" />
          </motion.button>
        )}
      </div>
      {renderStars()}
      
      {/* Tooltip with name */}
      {isHovered && !isDragging && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 glassmorphism px-2 py-1 rounded text-xs whitespace-nowrap z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {professional.name}
        </motion.div>
      )}
    </motion.div>
  );
}
