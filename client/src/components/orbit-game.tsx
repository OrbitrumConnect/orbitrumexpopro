import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Professional {
  id: number;
  name: string;
  avatar: string;
  x: number;
  y: number;
  speed: number;
  direction: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  speed: number;
}

interface OrbitGameProps {
  onGameEnd: (score: number, tokensEarned: number) => void;
  onClose: () => void;
}

export const OrbitGame: React.FC<OrbitGameProps> = ({ onGameEnd, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const gameArea = { width: 800, height: 600 };

  // Initialize professionals
  useEffect(() => {
    const newProfessionals: Professional[] = [];
    for (let i = 0; i < 8; i++) {
      newProfessionals.push({
        id: i,
        name: `Professional ${i + 1}`,
        avatar: `/avatars/professional-${i + 1}.jpg`,
        x: Math.random() * gameArea.width,
        y: Math.random() * gameArea.height,
        speed: Math.random() * 2 + 1,
        direction: Math.random() * Math.PI * 2
      });
    }
    setProfessionals(newProfessionals);
  }, []);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = setInterval(() => {
      // Update professionals
      setProfessionals(prev => prev.map(prof => {
        const newX = prof.x + Math.cos(prof.direction) * prof.speed;
        const newY = prof.y + Math.sin(prof.direction) * prof.speed;

        // Bounce off walls
        let newDirection = prof.direction;
        if (newX <= 0 || newX >= gameArea.width) {
          newDirection = Math.PI - prof.direction;
        }
        if (newY <= 0 || newY >= gameArea.height) {
          newDirection = -prof.direction;
        }

        return {
          ...prof,
          x: Math.max(0, Math.min(gameArea.width, newX)),
          y: Math.max(0, Math.min(gameArea.height, newY)),
          direction: newDirection
        };
      }));

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + Math.cos(Math.atan2(mousePos.y - bullet.y, mousePos.x - bullet.x)) * bullet.speed,
          y: bullet.y + Math.sin(Math.atan2(mousePos.y - bullet.y, mousePos.x - bullet.x)) * bullet.speed
        }))
        .filter(bullet => bullet.x >= 0 && bullet.x <= gameArea.width && bullet.y >= 0 && bullet.y <= gameArea.height)
      );

      // Check collisions
      setBullets(prev => {
        const newBullets = [...prev];
        setProfessionals(prevProf => {
          const newProfessionals = [...prevProf];
          
          newBullets.forEach((bullet, bulletIndex) => {
            newProfessionals.forEach((prof, profIndex) => {
              const distance = Math.sqrt(
                Math.pow(bullet.x - prof.x, 2) + Math.pow(bullet.y - prof.y, 2)
              );
              
              if (distance < 30) {
                // Hit!
                setScore(prevScore => prevScore + 10);
                newProfessionals.splice(profIndex, 1);
                newBullets.splice(bulletIndex, 1);
                
                // Respawn professional
                setTimeout(() => {
                  setProfessionals(prev => [...prev, {
                    ...prof,
                    x: Math.random() * gameArea.width,
                    y: Math.random() * gameArea.height,
                    direction: Math.random() * Math.PI * 2
                  }]);
                }, 2000);
              }
            });
          });
          
          return newProfessionals;
        });
        
        return newBullets;
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, mousePos]);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          const tokensEarned = Math.floor(score / 10);
          onGameEnd(score, tokensEarned);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, score, onGameEnd]);

  // Mouse handling
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleClick = () => {
    if (!isPlaying) return;

    const newBullet: Bullet = {
      id: Date.now(),
      x: mousePos.x,
      y: mousePos.y,
      speed: 8
    };

    setBullets(prev => [...prev, newBullet]);
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(60);
    setBullets([]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-lg p-6 border border-cyan-400"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-cyan-400 text-xl font-bold">Orbit Shooter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex justify-between items-center mb-4 text-white">
          <div>Score: {score}</div>
          <div>Time: {timeLeft}s</div>
          <div>Tokens: {Math.floor(score / 10)}</div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={gameArea.width}
            height={gameArea.height}
            className="border border-cyan-400 rounded cursor-crosshair"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,20,0.8) 100%)' }}
          />

          {/* Draw game elements */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={gameArea.width}
            height={gameArea.height}
          >
            {/* Draw professionals */}
            {professionals.map(prof => (
              <motion.circle
                key={prof.id}
                cx={prof.x}
                cy={prof.y}
                r="15"
                fill="url(#professionalGradient)"
                stroke="rgba(34, 211, 238, 0.8)"
                strokeWidth="2"
                animate={{
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Draw bullets */}
            {bullets.map(bullet => (
              <motion.circle
                key={bullet.id}
                cx={bullet.x}
                cy={bullet.y}
                r="3"
                fill="rgba(34, 211, 238, 1)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              />
            ))}

            {/* Gradients */}
            <defs>
              <radialGradient id="professionalGradient">
                <stop offset="0%" stopColor="rgba(34, 211, 238, 0.8)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {!isPlaying && (
          <div className="mt-4 text-center">
            <button
              onClick={startGame}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded font-bold"
            >
              Start Game
            </button>
          </div>
        )}

        <div className="mt-4 text-gray-400 text-sm">
          <p>🎯 Click to shoot at professionals</p>
          <p>⏱️ Game lasts 60 seconds</p>
          <p>💰 Earn 1 token per 10 points</p>
        </div>
      </motion.div>
    </div>
  );
};