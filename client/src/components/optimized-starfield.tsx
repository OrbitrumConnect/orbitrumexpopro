import { memo, useMemo } from 'react';

interface OptimizedStarfieldProps {
  className?: string;
}

// Starfield otimizado para reduzir re-renders
export const OptimizedStarfield = memo(({ className }: OptimizedStarfieldProps) => {
  // Memoizar as estrelas para evitar recriação
  const stars = useMemo(() => {
    const starArray = [];
    
    // Reduzir número de estrelas para performance
    for (let i = 0; i < 80; i++) { // Reduzido de 150+ para 80
      starArray.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 1,
        animationDelay: Math.random() * 3,
      });
    }
    
    return starArray;
  }, []);

  // Memoizar estrelas cadentes para performance
  const shootingStars = useMemo(() => {
    const shootingArray = [];
    
    // Reduzir estrelas cadentes de 10 para 6
    for (let i = 0; i < 6; i++) {
      shootingArray.push({
        id: `shooting-${i}`,
        top: Math.random() * 80 + 10,
        animationDelay: Math.random() * 8 + 2,
        direction: i % 2 === 0 ? 'left-to-right' : 'right-to-left',
      });
    }
    
    return shootingArray;
  }, []);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className || ''}`}>
      {/* Estrelas estáticas */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.animationDelay}s`,
            animationDuration: '3s',
          }}
        />
      ))}
      
      {/* Estrelas cadentes otimizadas */}
      {shootingStars.map((star) => (
        <div
          key={star.id}
          className={`absolute h-px bg-gradient-to-r ${
            star.direction === 'left-to-right' 
              ? 'from-transparent via-cyan-400 to-transparent animate-shooting-star'
              : 'from-transparent via-purple-400 to-transparent animate-shooting-star-reverse'
          }`}
          style={{
            top: `${star.top}%`,
            width: '100px',
            animationDelay: `${star.animationDelay}s`,
            animationDuration: '2s',
            left: star.direction === 'left-to-right' ? '-100px' : 'calc(100% + 100px)',
          }}
        />
      ))}
    </div>
  );
});

OptimizedStarfield.displayName = 'OptimizedStarfield';