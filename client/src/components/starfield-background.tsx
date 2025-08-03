import { useEffect, useState } from "react";

interface ShootingStar {
  id: number;
  top: string;
  left: string;
  delay: number;
  duration: number;
  direction?: 'left-to-right' | 'right-to-left';
}

interface StaticStar {
  id: number;
  top: string;
  left: string;
  size: number;
  pulseDelay: number;
  pulseDuration: number;
}

export function StarfieldBackground() {
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [staticStars, setStaticStars] = useState<StaticStar[]>([]);

  useEffect(() => {
    // Sistema de ondas escalonadas para fluxo natural
    const createNaturalFlow = () => {
      const leftToRightStars: ShootingStar[] = [];
      const rightToLeftStars: ShootingStar[] = [];
      
      // Esquerda para direita - 6 estrelas com variação vertical
      for (let i = 0; i < 6; i++) {
        // Algumas estrelas mais altas (primeiras 2), outras distribuídas
        const heightVariation = i < 2 
          ? Math.random() * 25 + 5    // Primeiras 2: 5%-30% (mais altas)
          : Math.random() * 60 + 20;  // Outras 4: 20%-80% (distribuídas)
          
        leftToRightStars.push({
          id: i,
          top: `${heightVariation}%`,
          left: '0%',
          delay: (i * 2.5) + Math.random() * 1.8,
          duration: 3 + Math.random() * 2,
          direction: 'left-to-right',
        });
      }

      // Direita para esquerda - 4 estrelas com variação vertical
      for (let i = 0; i < 4; i++) {
        // Primeira estrela mais alta, outras distribuídas
        const heightVariation = i === 0 
          ? Math.random() * 20 + 8    // Primeira: 8%-28% (mais alta)
          : Math.random() * 65 + 15;  // Outras 3: 15%-80% (distribuídas)
          
        rightToLeftStars.push({
          id: i + 100,
          top: `${heightVariation}%`,
          left: '100%',
          delay: (i * 3.2) + 1.5 + Math.random() * 2,
          duration: 3.5 + Math.random() * 2.5,
          direction: 'right-to-left',
        });
      }
      
      return [...leftToRightStars, ...rightToLeftStars];
    };
    
    setShootingStars(createNaturalFlow());

    // Criar estrelas estáticas com pulsação (85 total - mais 20 estrelas)
    const staticStarArray: StaticStar[] = [];
    const minDistance = 7; // Distância mínima reduzida para comportar mais estrelas
    
    for (let i = 0; i < 85; i++) {
      let attempts = 0;
      let validPosition = false;
      let newStar: StaticStar;
      
      do {
        newStar = {
          id: i,
          top: `${Math.random() * 85 + 7.5}%`, // 7.5% - 92.5%
          left: `${Math.random() * 85 + 7.5}%`, // 7.5% - 92.5%
          size: Math.random() * 1.04 + 0.312, // 4% maior: 0.312px - 1.352px
          pulseDelay: Math.random() * 8, // 0-8s delay
          pulseDuration: 1.2 + Math.random() * 3.5, // 1.2-4.7s duration
        };
        
        // Verificar distância de outras estrelas
        validPosition = staticStarArray.every(existingStar => {
          const topDiff = Math.abs(parseFloat(newStar.top) - parseFloat(existingStar.top));
          const leftDiff = Math.abs(parseFloat(newStar.left) - parseFloat(existingStar.left));
          return Math.sqrt(topDiff * topDiff + leftDiff * leftDiff) >= minDistance;
        });
        
        attempts++;
      } while (!validPosition && attempts < 50);
      
      staticStarArray.push(newStar);
    }
    
    setStaticStars(staticStarArray);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Static Starfield */}
      <div className="starfield" />
      
      {/* Shooting Stars - Enhanced for mobile visibility */}
      {shootingStars.map((star) => (
        <div
          key={star.id}
          className={`shooting-star ${
            star.direction === 'right-to-left' 
              ? 'animate-shooting-star-reverse' 
              : 'animate-shooting-star'
          }`}
          style={{
            top: star.top,
            left: star.left,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {/* Static Pulsing Stars */}
      {staticStars.map((star) => (
        <div
          key={`static-${star.id}`}
          className="static-star animate-pulse-star"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.pulseDelay}s`,
            animationDuration: `${star.pulseDuration}s`,
          }}
        />
      ))}
    </div>
  );
}
