import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Brain, Users, Star, Wallet, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [typingMessage, setTypingMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [showBrainAnimation, setShowBrainAnimation] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasSpokenOrbitrum, setHasSpokenOrbitrum] = useState(false);

  const welcomeMessages = [
    "Bem-vindo ao futuro das conexões profissionais",
    "Uma nova forma de encontrar quem você precisa",
    "Experiência orbital única e intuitiva"
  ];

  // Efeito de digitação para as mensagens de boas-vindas
  useEffect(() => {
    if (!showWelcome || !isOpen) return;

    const currentMessage = welcomeMessages[messageIndex];
    let charIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (charIndex < currentMessage.length) {
        setTypingMessage(currentMessage.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        
        // Aguardar 2.5 segundos antes da próxima mensagem (1.5 + 1 segundo extra)
        setTimeout(() => {
          if (messageIndex < welcomeMessages.length - 1) {
            setMessageIndex(messageIndex + 1);
            setTypingMessage("");
          } else {
            // Finalizar boas-vindas e dar tempo para ler (10 segundos)
            setTimeout(() => {
              setShowWelcome(false);
              // Esperar 10 segundos antes da animação do cérebro
              setTimeout(() => {
                setShowBrainAnimation(true);
                // Som neural apenas cibernético quando ativa automaticamente
                playNeuralSound();
              }, 10000);
            }, 1000);
          }
        }, 2500);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [messageIndex, showWelcome, isOpen, hasSpokenOrbitrum]);

  // Reset quando modal abre
  useEffect(() => {
    if (isOpen) {
      setShowWelcome(true);
      setMessageIndex(0);
      setTypingMessage("");
      setShowBrainAnimation(false);
      setIsClosing(false);
      setHasSpokenOrbitrum(false);
    }
  }, [isOpen]);

  // Função para fechar com animação de TV
  // Som neural cibernético 
  const playNeuralSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Sequência de tons harmônicos para "conectando"
      const frequencies = [220, 440, 660, 880, 1100]; // Tons ascendentes
      const duration = 300; // 300ms por tom
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Onda senoidal para som mais suave
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.2);
        
        // Envelope suave
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.2);
        gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + index * 0.2 + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + index * 0.2 + duration / 1000);
        
        oscillator.start(audioCtx.currentTime + index * 0.2);
        oscillator.stop(audioCtx.currentTime + index * 0.2 + duration / 1000);
      });
    } catch (error) {
      console.log('Som neural não disponível:', error);
    }
  };

  // Voz neural humanoide espacial
  const speakOrbitrum = () => {
    if (hasSpokenOrbitrum || !('speechSynthesis' in window)) return;
    
    setHasSpokenOrbitrum(true);
    speechSynthesis.cancel(); // Limpar fila de fala
    
    const utterance = new SpeechSynthesisUtterance('Orbitrum');
    utterance.rate = 0.9; // Levemente mais lento para efeito espacial
    utterance.pitch = 0.8; // Tom mais grave e profundo
    utterance.volume = 0.9; // Volume alto e claro
    
    // Buscar voz mais adequada para efeito espacial/robótico
    const voices = speechSynthesis.getVoices();
    const spatialVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Male') ||
      voice.lang.includes('en') // Inglês pode soar mais robótico
    ) || voices[0];
    
    if (spatialVoice) utterance.voice = spatialVoice;
    
    speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const quickFeatures = [
    {
      icon: <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />,
      title: "Interface Orbital Neural",
      desc: "Cérebro central que desperta conexões profissionais únicas"
    },
    {
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />,
      title: "Busca Inteligente", 
      desc: "Sistema avançado que encontra exatamente quem você precisa"
    },
    {
      icon: <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />,
      title: "Perfis Completos",
      desc: "Avaliações, portfólio e histórico para decisões seguras"
    },
    {
      icon: <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />,
      title: "Sistema Financeiro",
      desc: "Pagamentos seguros e sistema de recompensas integrado"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`w-[90vw] max-w-3xl sm:max-w-5xl h-[90vh] sm:max-h-[93vh] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 transition-all duration-800 scale-[1.10] ${
        isClosing ? 'scale-y-0 opacity-0 transform-gpu' : ''
      }`}>
        <DialogHeader className="relative border-b border-slate-800/50 pb-4">
          
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center"
                >
                  <Brain className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="h-12 sm:h-16 flex items-center justify-center px-4"
                >
                  <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-center">
                    {typingMessage}
                    <span className="animate-pulse">|</span>
                  </h2>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Sistema Orbital Neural
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-base text-gray-300">
                  A revolução na contratação de profissionais
                </DialogDescription>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showWelcome && !showBrainAnimation && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 sm:space-y-6 overflow-y-auto max-h-[70vh] px-2 py-4"
            >
              {/* Features Grid - Mobile Responsivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {quickFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-600/20 hover:border-cyan-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-lg font-semibold text-white mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Convite Suave */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-purple-500/20 text-center"
              >
                <h3 className="text-lg sm:text-xl font-bold text-purple-400 mb-2 sm:mb-3">
                  ✨ Pronto para Começar?
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  Desperte o neural brain e descubra uma nova forma de conectar-se com profissionais
                </p>
              </motion.div>

              {/* CTA Principal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center pt-4 sm:pt-6 border-t border-slate-700/50"
              >
                <Button
                  onClick={() => {
                    setShowBrainAnimation(true);
                    // Som apenas cibernético ao clicar
                    playNeuralSound();
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg rounded-full shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Tocar no Cérebro
                </Button>
                <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-3">
                  Ative o sistema neural em 10 segundos
                </p>
              </motion.div>
            </motion.div>
          )}
          
          {/* Animação do Cérebro */}
          {showBrainAnimation && (
            <motion.div
              key="brain-animation"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[450px] sm:h-[550px] text-center"
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ 
                  scale: [1, 1.2, 1.5, 2],
                  rotate: [0, 180, 360, 720],
                  opacity: [1, 0.8, 0.5, 0]
                }}
                transition={{ 
                  duration: 5, // 5 segundos total
                  ease: "easeInOut",
                  times: [0, 0.2, 0.6, 1] // 3 segundos normais, 2 segundos néon
                }}
                onAnimationStart={() => {
                  // Som cibernético começa um pouco antes
                  setTimeout(() => {
                    playNeuralSound();
                  }, 3000); // 3 segundos após início
                  
                  // Voz neural humanoide espacial quando cérebro se conecta
                  setTimeout(() => {
                    speakOrbitrum();
                  }, 4200); // 4.2 segundos - momento da conexão neural
                }}
                onAnimationComplete={() => {
                  setTimeout(handleClose, 500);
                }}
                className="relative"
              >
                <motion.div 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(6, 182, 212, 0)",
                      "0 0 0 rgba(6, 182, 212, 0)",
                      "0 0 0 rgba(6, 182, 212, 0)",
                      "0 0 60px rgba(6, 182, 212, 0.4)", // Néon ciano 40% nos últimos 2 segundos
                      "0 0 80px rgba(6, 182, 212, 0.4)"
                    ]
                  }}
                  transition={{
                    duration: 5,
                    times: [0, 0.4, 0.6, 0.8, 1]
                  }}
                >
                  <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  
                  {/* Pulsos de energia */}
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ 
                      duration: 2.5,
                      repeat: 2,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-4 border-cyan-400"
                  />
                  
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ 
                      duration: 3,
                      repeat: 2,
                      delay: 0.5,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-2 border-blue-400"
                  />
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 sm:mt-8"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-2 sm:mb-3">
                  🧠 Neural Brain Ativado
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  Conectando você ao universo de profissionais...
                </p>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ 
                    duration: 2,
                    times: [0, 0.3, 0.7, 1],
                    delay: 1
                  }}
                  className="mt-4 sm:mt-6 text-center"
                >
                  <motion.div 
                    className="text-lg sm:text-xl text-white font-bold"
                    animate={{
                      color: [
                        "#ffffff",
                        "#ffffff", 
                        "#ffffff",
                        "#06b6d4", // Ciano nos últimos 2 segundos
                        "#06b6d4"
                      ]
                    }}
                    transition={{
                      duration: 5,
                      times: [0, 0.4, 0.6, 0.8, 1]
                    }}
                  >
                    Iniciando Órbitas...
                  </motion.div>
                  <div className="flex justify-center mt-2 sm:mt-3 space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ 
                          scale: [0, 1, 0],
                          backgroundColor: [
                            "#06b6d4",
                            "#06b6d4",
                            "#06b6d4",
                            "#06b6d4",
                            "#22d3ee" // Mais brilhante nos últimos segundos
                          ]
                        }}
                        transition={{
                          scale: {
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2
                          },
                          backgroundColor: {
                            duration: 5,
                            times: [0, 0.4, 0.6, 0.8, 1]
                          }
                        }}
                        className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}