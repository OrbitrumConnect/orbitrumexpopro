import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Play, Pause, Home, Coins, Trophy, Target, Timer, Heart } from "lucide-react";
import type { WalletView } from "@shared/token-operations";

interface NewOrbitGameProps {
  onGameEnd: () => void;
}

interface GameState {
  score: number;
  timeLeft: number;
  lives: number;
  gameStarted: boolean;
  gameOver: boolean;
  isPaused: boolean;
  tokensEarned: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  avatar: string;
  speedX: number;
  speedY: number;
  life: number;
}

interface Moon {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

const DEMO_PROFESSIONALS = [
  { name: "Carlos Silva", avatar: "👨‍🎨", profession: "Pintor" },
  { name: "Ana Santos", avatar: "👩‍💻", profession: "Dev" },
  { name: "Roberto Lima", avatar: "💪", profession: "Personal" },
  { name: "Maria Costa", avatar: "✂️", profession: "Cabelo" },
  { name: "José Oliveira", avatar: "🔧", profession: "Elétrica" },
  { name: "Lucia Ferreira", avatar: "🏠", profession: "Arquiteta" },
  { name: "Pedro Souza", avatar: "📸", profession: "Foto" },
  { name: "Fernanda Rocha", avatar: "🎨", profession: "Design" }
];

export function NewOrbitGame({ onGameEnd }: NewOrbitGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const playerRef = useRef<Player>({ x: 400, y: 500, width: 40, height: 40 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const moonsRef = useRef<Moon[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotTime = useRef(0);
  const bulletIdCounter = useRef(0);
  const enemyIdCounter = useRef(0);
  const moonIdCounter = useRef(0);
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: 50,
    lives: 3,
    gameStarted: false,
    gameOver: false,
    isPaused: false,
    tokensEarned: 0
  });

  // FPS monitoring
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);
  
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  // Verificar tipo de usuário
  const isAdmin = user?.email === 'passosmir4@gmail.com';
  const isFreeMode = !isAdmin && (!isAuthenticated || !user || user.plan === 'free');

  // Query para wallet em tempo real
  const { data: wallet } = useQuery<WalletView>({
    queryKey: isAdmin ? ["/api/admin/wallet"] : ["/api/users/1/wallet"],
    enabled: isAuthenticated && gameState.gameStarted,
    refetchInterval: 2000,
    staleTime: 1000
  });

  // Mutation para salvar pontuação (FREE mode)
  const freeGameMutation = useMutation({
    mutationFn: async (data: { score: number; tokensEarned: number; duration: number }) => {
      return apiRequest('POST', '/api/game-scores/free', data);
    }
  });

  // Mutation para salvar pontuação (jogo pago)
  const gameEndMutation = useMutation({
    mutationFn: async (data: { score: number; tokensEarned: number; duration: number }) => {
      return apiRequest('POST', '/api/game-scores', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet"] });
    }
  });

  // Calcular tokens ganhos - Meta mínima 400 tokens
  const calculateTokens = useCallback((score: number) => {
    if (isFreeMode || isAdmin) return 0;
    
    // Meta mínima: 400 tokens (R$ 0,40)
    // Entrada: 250 tokens consumidos da carteira do plano
    // Prêmio: Tokens ganhos acima de 400 vão para carteira do plano
    const minScore = 400; // Meta mínima: 400 tokens  
    const maxScore = 1000; // Pontos para prêmio máximo
    
    // Verificação: abaixo de 400 tokens = perde os 250 de entrada
    if (score < minScore) {
      console.log(`🎯 Score ${score} < ${minScore}: 0 tokens ganhos (perde 250 de entrada)`);
      return 0;
    }
    
    // Calcula tokens ganhos acima da meta de 400
    const tokensEarned = score - minScore;
    console.log(`🎯 Score ${score}: ${tokensEarned} tokens ganhos (acima da meta 400)`);
    return tokensEarned;
  }, [isFreeMode, isAdmin]);

  // Inicializar jogo
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 640;
    canvas.width = isMobile ? 480 : 700;
    canvas.height = isMobile ? 320 : 500;

    // Reset state
    playerRef.current = { 
      x: (canvas.width / 2) - 20, 
      y: canvas.height - 80, 
      width: isMobile ? 35 : 40, 
      height: isMobile ? 35 : 40 
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    moonsRef.current = []; // Limpar luas também
    bulletIdCounter.current = 0;
    enemyIdCounter.current = 0;
    moonIdCounter.current = 0;

    setGameState({
      score: 0,
      timeLeft: 50,
      lives: 3,
      gameStarted: true,
      gameOver: false,
      isPaused: false,
      tokensEarned: 0
    });
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Previne scroll da página para teclas de movimento e espaço
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(key)) {
        e.preventDefault();
      }
      keysRef.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Previne comportamento padrão também no keyup
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(key)) {
        e.preventDefault();
      }
      keysRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Prevent page scroll during game
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      // Disable page scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Prevent touch scroll on document
      const preventScroll = (e: TouchEvent) => {
        if (e.target instanceof HTMLCanvasElement) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('touchstart', preventScroll, { passive: false });
      
      return () => {
        // Re-enable page scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('touchstart', preventScroll);
      };
    }
  }, [gameState.gameStarted, gameState.gameOver]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas || !gameState.gameStarted || gameState.gameOver) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    setTouchPosition({
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    });
    setIsTouching(true);
  }, [gameState.gameStarted, gameState.gameOver]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isTouching) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    setTouchPosition({
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    });
  }, [isTouching]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTouching(false);
  }, []);

  // Shoot bullet (optimized rate limit)
  const shootBullet = useCallback(() => {
    const now = Date.now();
    if (now - lastShotTime.current < 100) return; // Tiro mais rápido - menos lag

    const player = playerRef.current;
    if (bulletsRef.current.length < 10) { // Limit bullets on screen
      bulletsRef.current.push({
        id: bulletIdCounter.current++,
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10
      });
    }
    lastShotTime.current = now;
  }, []);

  // Spawn enemy
  const spawnEnemy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const professional = DEMO_PROFESSIONALS[Math.floor(Math.random() * DEMO_PROFESSIONALS.length)];
    const enemy: Enemy = {
      id: enemyIdCounter.current++,
      x: Math.random() * (canvas.width - 50),
      y: -50,
      width: 50,
      height: 50,
      name: professional.name,
      avatar: professional.avatar,
      speedX: (Math.random() - 0.5) * 2,
      speedY: 1 + Math.random() * 2,
      life: 2 // Inimigos precisam de 2 tiros
    };

    enemiesRef.current.push(enemy);
  }, []);

  // Spawn moon obstacle
  const spawnMoon = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const moon: Moon = {
      id: moonIdCounter.current++,
      x: Math.random() * (canvas.width - 45),
      y: -45,
      width: 45,
      height: 45,
      speedX: (Math.random() - 0.5) * 3,
      speedY: 1 + Math.random() * 1.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 5
    };

    moonsRef.current.push(moon);
  }, []);

  // Game loop with FPS optimization
  const gameLoop = useCallback(() => {
    if (gameState.gameOver || gameState.isPaused) return;

    // FPS calculation
    frameCount.current++;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      setFps(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
      frameCount.current = 0;
      lastTime.current = now;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // High performance clear
    ctx.fillStyle = 'rgba(0, 0, 20, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update player
    const player = playerRef.current;
    const speed = window.innerWidth < 640 ? 6 : 8;

    // Keyboard movement
    if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
      player.x = Math.max(0, player.x - speed);
    }
    if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
      player.x = Math.min(canvas.width - player.width, player.x + speed);
    }
    if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
      player.y = Math.max(0, player.y - speed);
    }
    if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
      player.y = Math.min(canvas.height - player.height, player.y + speed);
    }

    // Touch movement
    if (isTouching) {
      const targetX = Math.max(0, Math.min(canvas.width - player.width, touchPosition.x - player.width / 2));
      const targetY = Math.max(0, Math.min(canvas.height - player.height, touchPosition.y - player.height / 2));
      
      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        player.x += (dx / distance) * speed;
        player.y += (dy / distance) * speed;
      }
    }

    // Auto shoot for mobile and space/enter for desktop
    if (keysRef.current.has(' ') || keysRef.current.has('enter') || isTouching) {
      shootBullet();
    }

    // Draw player (spaceship)
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Add glow effect
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 15, player.y + 10, 10, 20);
    ctx.shadowBlur = 0;

    // Update bullets (performance optimized)
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const bullet = bulletsRef.current[i];
      bullet.y -= 12;
      
      if (bullet.y < -10) {
        bulletsRef.current.splice(i, 1);
        continue;
      }
      
      // Draw bullet
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Update enemies (ultra optimized)
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      enemy.x += enemy.speedX;
      enemy.y += enemy.speedY;
      
      // Bounce off walls
      if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
        enemy.speedX *= -1;
      }
      
      if (enemy.y > canvas.height + 50) {
        enemiesRef.current.splice(i, 1);
        continue;
      }
      
      // Draw enemy with reduced visual complexity
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // Ultra optimized text rendering
      if (frameCount.current % 3 === 0) { // Draw text every 3rd frame for performance
        ctx.fillStyle = '#ffffff';
        ctx.font = window.innerWidth < 640 ? '12px Arial' : '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.avatar, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2 + 4);
      }
    }

    // Update moons (dangerous obstacles)
    for (let i = moonsRef.current.length - 1; i >= 0; i--) {
      const moon = moonsRef.current[i];
      moon.x += moon.speedX;
      moon.y += moon.speedY;
      moon.rotation += moon.rotationSpeed;
      
      // Bounce off walls
      if (moon.x <= 0 || moon.x >= canvas.width - moon.width) {
        moon.speedX *= -1;
      }
      
      if (moon.y > canvas.height + 45) {
        moonsRef.current.splice(i, 1);
        continue;
      }
      
      // Draw moon as circle with rotation and danger glow
      ctx.save();
      const centerX = moon.x + moon.width / 2;
      const centerY = moon.y + moon.height / 2;
      const radius = moon.width / 2;
      
      // Danger glow effect
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Moon emoji with rotation
      ctx.translate(centerX, centerY);
      ctx.rotate((moon.rotation * Math.PI) / 180);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🌙', 0, 6);
      ctx.restore();
    }

    // Collision detection (optimized loops)
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const bullet = bulletsRef.current[i];
      for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
        const enemy = enemiesRef.current[j];
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          // Hit! Reduzir vida do inimigo
          enemy.life = (enemy.life || 2) - 1;
          bulletsRef.current.splice(i, 1);
          
          if (enemy.life <= 0) {
            // Inimigo morto - 16 tokens
            setGameState(prev => ({ ...prev, score: prev.score + 16 }));
            enemiesRef.current.splice(j, 1);
          }
          break;
        }
      }
    }

    // Player-enemy collision (optimized)
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        // Hit player!
        setGameState(prev => {
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            return { ...prev, lives: 0, gameOver: true };
          }
          return { ...prev, lives: newLives };
        });
        enemiesRef.current.splice(i, 1);
        break;
      }
    }

    // Player-moon collision (more dangerous - 2 lives damage)
    for (let i = moonsRef.current.length - 1; i >= 0; i--) {
      const moon = moonsRef.current[i];
      if (
        player.x < moon.x + moon.width &&
        player.x + player.width > moon.x &&
        player.y < moon.y + moon.height &&
        player.y + player.height > moon.y
      ) {
        // Hit by moon - double damage!
        setGameState(prev => {
          const newLives = prev.lives - 2; // 2 damage from moons
          if (newLives <= 0) {
            return { ...prev, lives: 0, gameOver: true };
          }
          return { ...prev, lives: newLives };
        });
        moonsRef.current.splice(i, 1);
        break;
      }
    }

    // Spawn enemies (reduced frequency for better performance)
    if (Math.random() < 0.015 && enemiesRef.current.length < 8) {
      spawnEnemy();
    }

    // Spawn moons (much less frequent, more dangerous)
    if (Math.random() < 0.005 && moonsRef.current.length < 2) {
      spawnMoon();
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.gameOver, gameState.isPaused, isTouching, touchPosition, shootBullet, spawnEnemy, spawnMoon]);

  // Timer
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver || gameState.isPaused) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0, gameOver: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStarted, gameState.gameOver, gameState.isPaused]);

  // Start game loop
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver && !gameState.isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver, gameState.isPaused, gameLoop]);

  // Handle game over once
  useEffect(() => {
    if (gameState.gameOver && gameState.gameStarted && gameState.timeLeft === 0) {
      const tokens = calculateTokens(gameState.score);
      
      if (!isFreeMode && !isAdmin) {
        gameEndMutation.mutate({
          score: gameState.score,
          tokensEarned: tokens,
          duration: 50
        });
      } else {
        freeGameMutation.mutate({
          score: gameState.score,
          tokensEarned: 0,
          duration: 50
        });
      }
      
      setGameState(prev => ({ ...prev, tokensEarned: tokens }));
    }
  }, [gameState.gameOver, gameState.timeLeft]);

  const handleStartGame = () => {
    initGame();
  };

  const handlePauseGame = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleEndGame = () => {
    setGameState({
      score: 0,
      timeLeft: 50,
      lives: 3,
      gameStarted: false,
      gameOver: false,
      isPaused: false,
      tokensEarned: 0
    });
    onGameEnd();
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-1 sm:p-4 scale-[0.8] sm:scale-100">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-1 sm:mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            <span className="text-sm sm:text-lg font-bold text-yellow-400">{gameState.score}</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            <span className="text-sm sm:text-lg font-bold text-blue-400">{gameState.timeLeft}s</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
            <span className="text-sm sm:text-lg font-bold text-red-400">{gameState.lives}</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-400">
            <span>FPS: {fps}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {gameState.gameStarted && (
            <Button
              onClick={handlePauseGame}
              variant="outline"
              size="sm"
              className="neon-button"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={handleEndGame}
            variant="outline"
            size="sm"
            className="neon-button"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-cyan-400 rounded-lg bg-gradient-to-b from-indigo-900 to-purple-900"
          style={{ 
            aspectRatio: window.innerWidth < 640 ? '3/2' : '7/5',
            maxHeight: window.innerWidth < 640 ? '280px' : '450px',
            touchAction: 'none', // Prevent any default touch behaviors
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Game Overlays */}
        <AnimatePresence>
          {!gameState.gameStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Orbit Shooter</h3>
                <p className="text-gray-300 mb-6">
                  {isFreeMode 
                    ? "Modo Diversão - Sem recompensas" 
                    : isAdmin 
                      ? "Modo Admin - Jogos Ilimitados"
                      : "Ganhe até 850 tokens!"
                  }
                </p>
                <Button
                  onClick={handleStartGame}
                  className="neon-button px-8 py-3"
                >
                  <Play className="mr-2 h-5 w-5" />
                  JOGAR
                </Button>
              </div>
            </motion.div>
          )}

          {gameState.isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-4">Jogo Pausado</h3>
                <Button
                  onClick={handlePauseGame}
                  className="neon-button"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {gameState.gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 rounded-lg"
            >
              <div className="text-center glassmorphism p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-white mb-4">Game Over!</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-yellow-400">
                    <Target className="inline mr-2 h-4 w-4" />
                    Pontuação: {gameState.score}
                  </p>
                  {!isFreeMode && !isAdmin && (
                    <p className="text-green-400">
                      <Coins className="inline mr-2 h-4 w-4" />
                      Tokens Ganhos: {gameState.tokensEarned}
                    </p>
                  )}
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleStartGame}
                    className="neon-button"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Jogar Novamente
                  </Button>
                  <Button
                    onClick={handleEndGame}
                    variant="outline"
                    className="neon-button"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Game Instructions */}
      <div className="mt-2 sm:mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
        <div>
          <h4 className="font-semibold text-white mb-2">Controles Desktop:</h4>
          <ul className="space-y-1">
            <li>• WASD ou Setas: Mover nave</li>
            <li>• Espaço ou Enter: Atirar</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-2">Controles Mobile:</h4>
          <ul className="space-y-1">
            <li>• Toque na tela: Mover nave</li>
            <li>• Disparo automático</li>
          </ul>
        </div>
      </div>
    </div>
  );
}