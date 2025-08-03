import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VolumeControl() {
  const [volume, setVolume] = useState(50); // Volume padrão 50%
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(50);

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('orbitrum_volume');
    const savedMuted = localStorage.getItem('orbitrum_muted');
    
    if (savedVolume) {
      setVolume(parseInt(savedVolume));
      setLastVolume(parseInt(savedVolume));
    }
    if (savedMuted) {
      setIsMuted(savedMuted === 'true');
    }
  }, []);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('orbitrum_volume', volume.toString());
    localStorage.setItem('orbitrum_muted', isMuted.toString());
  }, [volume, isMuted]);

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    setLastVolume(vol);
    
    if (vol > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(lastVolume > 0 ? lastVolume : 50);
    } else {
      setIsMuted(true);
      setVolume(0);
    }
  };

  const currentVolume = isMuted ? 0 : volume;

  return (
    <Card className="glassmorphism border-gray-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          {currentVolume === 0 ? (
            <VolumeX className="w-5 h-5 text-red-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-cyan-400" />
          )}
          Controle de Som
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-400 text-sm font-medium mb-2">Volume das Notificações</p>
          <p className="text-gray-300 text-xs">
            Controle o volume dos alertas GPS e notificações do sistema
          </p>
        </div>

        <div className="space-y-4">
          {/* Slider de Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Volume</span>
              <span className="text-cyan-400 font-medium">{currentVolume}%</span>
            </div>
            
            <Slider
              value={[currentVolume]}
              onValueChange={handleVolumeChange}
              max={100}
              min={0}
              step={1}
              disabled={isMuted}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Botão Mute/Unmute */}
          <Button 
            variant="outline"
            className={`w-full ${
              isMuted 
                ? 'border-red-500/50 text-red-400 hover:bg-red-500/20' 
                : 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20'
            }`}
            onClick={toggleMute}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                Desmutar Sons
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Mutar Sons
              </>
            )}
          </Button>
        </div>

        {/* Teste de Som */}
        <div className="border-t border-gray-600/30 pt-4">
          <Button 
            size="sm"
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
            onClick={() => {
              // Reproduzir som de teste
              if (currentVolume > 0) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.type = 'sine';
                
                // Aplicar volume configurado
                const volumeLevel = currentVolume / 100 * 0.1;
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volumeLevel, audioContext.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
              }
            }}
          >
            🔊 Testar Som
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook para uso global do volume
export const useVolumeSettings = () => {
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setMutedState] = useState(false);

  useEffect(() => {
    const savedVolume = localStorage.getItem('orbitrum_volume');
    const savedMuted = localStorage.getItem('orbitrum_muted');
    
    if (savedVolume) setVolumeState(parseInt(savedVolume));
    if (savedMuted) setMutedState(savedMuted === 'true');
  }, []);

  const playNotificationSound = (type: 'start' | 'arrive' | 'cancel' = 'start') => {
    const currentVolume = isMuted ? 0 : volume;
    
    if (currentVolume === 0) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sons diferentes para cada ação
    switch(type) {
      case 'start':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
        break;
      case 'arrive':
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.5);
        break;
      case 'cancel':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.4);
        break;
    }
    
    oscillator.type = 'sine';
    const volumeLevel = (currentVolume / 100) * 0.1; // Volume ajustável
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volumeLevel, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  return { volume, isMuted, playNotificationSound };
};