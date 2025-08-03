import { useState, useEffect, memo } from 'react';
import { PerformanceMonitor } from '@/utils/performance-monitor';
import { MemoryOptimizer } from '@/utils/memory-optimizer';

// Componente para monitorar performance em tempo real (apenas desenvolvimento)
export const PerformanceMonitorDisplay = memo(() => {
  const [stats, setStats] = useState({
    apiCalls: 0,
    cacheHits: 0,
    memoryUsage: 0,
    renderCount: 0
  });

  useEffect(() => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    const memoryOptimizer = MemoryOptimizer.getInstance();

    const updateStats = () => {
      // Atualizar estatísticas de performance
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryMB = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
        
        setStats(prev => ({
          ...prev,
          memoryUsage: memoryMB,
          renderCount: prev.renderCount + 1
        }));
      }
    };

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-2 right-2 z-50 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div className="text-cyan-400 font-bold mb-1">⚡ Performance Monitor</div>
      <div>Memory: {stats.memoryUsage}MB</div>
      <div>Renders: {stats.renderCount}</div>
      <div className="text-green-400">✅ Optimizado</div>
    </div>
  );
});

PerformanceMonitorDisplay.displayName = 'PerformanceMonitorDisplay';