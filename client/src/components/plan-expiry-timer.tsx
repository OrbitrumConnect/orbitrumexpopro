import { useState, useEffect } from 'react';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlanExpiryTimerProps {
  planExpiryDate?: string;
  plan?: string;
  compact?: boolean;
}

export function PlanExpiryTimer({ planExpiryDate, plan, compact = false }: PlanExpiryTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!planExpiryDate || plan === 'free') return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(planExpiryDate).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [planExpiryDate, plan]);

  if (!planExpiryDate || plan === 'free') return null;

  const isUrgent = timeLeft.days < 5;
  const isVeryUrgent = timeLeft.days < 2;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-xs ${
        timeLeft.expired ? 'text-red-400' : 
        isVeryUrgent ? 'text-red-400' : 
        isUrgent ? 'text-yellow-400' : 'text-gray-400'
      }`}>
        <Clock className="h-3 w-3" />
        {timeLeft.expired ? (
          <span>Expirado</span>
        ) : (
          <span>
            {timeLeft.days}d {timeLeft.hours}h
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      className={`glassmorphism rounded-lg p-3 border ${
        timeLeft.expired ? 'border-red-500/50 bg-red-900/20' : 
        isVeryUrgent ? 'border-red-500/50 bg-red-900/20' : 
        isUrgent ? 'border-yellow-500/50 bg-yellow-900/20' : 
        'border-cyan-500/30 bg-cyan-900/10'
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {timeLeft.expired ? (
          <AlertTriangle className="h-5 w-5 text-red-400" />
        ) : isVeryUrgent ? (
          <AlertTriangle className="h-5 w-5 text-red-400" />
        ) : isUrgent ? (
          <Clock className="h-5 w-5 text-yellow-400" />
        ) : (
          <Calendar className="h-5 w-5 text-cyan-400" />
        )}
        
        <div className="flex-1">
          <div className={`font-semibold text-sm ${
            timeLeft.expired ? 'text-red-400' : 
            isVeryUrgent ? 'text-red-400' : 
            isUrgent ? 'text-yellow-400' : 'text-cyan-400'
          }`}>
            {timeLeft.expired ? 'Plano Expirado' : 
             isVeryUrgent ? 'Plano Expira em Breve!' : 
             isUrgent ? 'Atenção: Plano Expirando' : 
             `Plano ${plan?.toUpperCase()} Ativo`}
          </div>
          
          {timeLeft.expired ? (
            <div className="text-xs text-gray-300">
              Renove seu plano para continuar aproveitando os benefícios
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-1">
              <div className="text-xs text-gray-300">
                Expira em:
              </div>
              <div className="flex items-center gap-2 text-sm font-mono">
                <div className={`px-2 py-1 rounded ${
                  isVeryUrgent ? 'bg-red-800/50 text-red-200' : 
                  isUrgent ? 'bg-yellow-800/50 text-yellow-200' : 
                  'bg-cyan-800/50 text-cyan-200'
                }`}>
                  {timeLeft.days}d
                </div>
                <div className={`px-2 py-1 rounded ${
                  isVeryUrgent ? 'bg-red-800/50 text-red-200' : 
                  isUrgent ? 'bg-yellow-800/50 text-yellow-200' : 
                  'bg-cyan-800/50 text-cyan-200'
                }`}>
                  {timeLeft.hours.toString().padStart(2, '0')}h
                </div>
                <div className={`px-2 py-1 rounded ${
                  isVeryUrgent ? 'bg-red-800/50 text-red-200' : 
                  isUrgent ? 'bg-yellow-800/50 text-yellow-200' : 
                  'bg-cyan-800/50 text-cyan-200'
                }`}>
                  {timeLeft.minutes.toString().padStart(2, '0')}m
                </div>
                <div className={`px-2 py-1 rounded ${
                  isVeryUrgent ? 'bg-red-800/50 text-red-200' : 
                  isUrgent ? 'bg-yellow-800/50 text-yellow-200' : 
                  'bg-cyan-800/50 text-cyan-200'
                }`}>
                  {timeLeft.seconds.toString().padStart(2, '0')}s
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}