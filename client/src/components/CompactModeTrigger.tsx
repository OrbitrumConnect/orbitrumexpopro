import React, { useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';

interface CompactModeTriggerProps {
  onToggle: (isCompact: boolean) => void;
}

export function CompactModeTrigger({ onToggle }: CompactModeTriggerProps) {
  const [isCompact, setIsCompact] = useState(false);

  const handleToggle = () => {
    const newState = !isCompact;
    setIsCompact(newState);
    onToggle(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className="absolute top-3 right-3 z-20 glassmorphism p-1.5 rounded-full border border-yellow-500/30 shadow-lg hover:border-yellow-400/50 transition-all duration-300 scale-90"
      style={{ 
        boxShadow: '0 0 12px rgba(255, 193, 7, 0.4)',
        backdropFilter: 'blur(10px)'
      }}
      title={isCompact ? "Expandir Regras GPS" : "Minimizar Regras GPS"}
    >
      {isCompact ? (
        <Maximize2 className="h-3 w-3 text-yellow-400" />
      ) : (
        <Minimize2 className="h-3 w-3 text-yellow-400" />
      )}
    </button>
  );
}