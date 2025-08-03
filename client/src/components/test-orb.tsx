import { Star } from "lucide-react";
import type { Professional } from "@shared/schema";

interface TestOrbProps {
  professional: Professional;
  onClick: () => void;
}

export function TestOrb({ professional, onClick }: TestOrbProps) {
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
    <div 
      className="flex flex-col items-center cursor-pointer" 
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => {
        e.stopPropagation();
        console.log('CLIQUE DETECTADO NO ORB:', professional.name);
        onClick();
      }}
    >
      <div 
        className="professional-orb w-10 h-10 rounded-full border-2 border-cyan-400 hover:scale-110 transition-transform overflow-hidden"
        style={{ 
          backgroundImage: `url(${professional.avatar})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      {renderStars()}
    </div>
  );
}