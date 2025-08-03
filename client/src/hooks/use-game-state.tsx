import { useState, useEffect, useRef } from "react";

interface GameState {
  score: number;
  timeLeft: number;
  gameOver: boolean;
  isPaused: boolean;
}

export function useGameState(initialTime: number = 45) {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: initialTime,
    gameOver: false,
    isPaused: false,
  });

  const timerRef = useRef<NodeJS.Timeout>();

  const startGame = () => {
    setGameState(prev => ({ ...prev, gameOver: false, isPaused: false }));
    
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0, gameOver: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPaused: true }));
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeGame = () => {
    setGameState(prev => ({ ...prev, isPaused: false }));
    startGame();
  };

  const resetGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameState({
      score: 0,
      timeLeft: initialTime,
      gameOver: false,
      isPaused: false,
    });
  };

  const addScore = (points: number) => {
    setGameState(prev => ({ ...prev, score: prev.score + points }));
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    gameState,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    addScore,
  };
}
