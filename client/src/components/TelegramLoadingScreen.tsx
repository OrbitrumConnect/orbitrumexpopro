import React from 'react';
import { motion } from 'framer-motion';

export function TelegramLoadingScreen() {
  const [showText, setShowText] = React.useState(false);

  React.useEffect(() => {
    // Mostrar texto após 1 segundo
    const timer = setTimeout(() => setShowText(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0A0B1E] via-[#1A1B3A] to-[#0A0B1E] flex flex-col items-center justify-center z-[9999]">
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold neon-text mb-4"
            animate={{ 
              textShadow: [
                '0 0 20px var(--neon-cyan)',
                '0 0 30px var(--neon-cyan)',
                '0 0 20px var(--neon-cyan)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ORBITRUM
          </motion.h1>
          <motion.h2 
            className="text-2xl md:text-3xl font-light text-[var(--neon-cyan)] tracking-[0.3em]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            CONNECT
          </motion.h2>
        </motion.div>

        {/* Central Orbital Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative w-48 h-48 md:w-64 md:h-64"
        >
          {/* Central Core */}
          <motion.div
            className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--electric-blue)] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 20px var(--neon-cyan)',
                '0 0 40px var(--neon-cyan)',
                '0 0 20px var(--neon-cyan)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Orbiting Elements */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-6 h-6 bg-cyan-400/80 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-12px',
                marginTop: '-12px'
              }}
              animate={{
                rotate: 360,
                x: [0, Math.cos(i * 60 * Math.PI / 180) * 80],
                y: [0, Math.sin(i * 60 * Math.PI / 180) * 80]
              }}
              transition={{
                duration: 3 + (i * 0.2),
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}

          {/* Orbit Rings */}
          <motion.div
            className="absolute inset-0 border-2 border-cyan-400/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 border border-cyan-400/20 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 20 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <p className="text-lg text-[var(--neon-cyan)] font-medium">
            Carregando Universo...
          </p>
          <div className="flex space-x-1 justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[var(--neon-cyan)] rounded-full"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center text-sm text-cyan-300/80"
        >
          <div className="flex items-center justify-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span>Conectando ao Telegram...</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--space-black)] to-transparent" />
    </div>
  );
}