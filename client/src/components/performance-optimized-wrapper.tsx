import React, { memo, useMemo, useEffect } from 'react';
import { PerformanceMonitor } from '@/utils/performance-monitor';

interface PerformanceOptimizedWrapperProps {
  children: React.ReactNode;
  componentName: string;
  className?: string;
}

// Wrapper para otimização automática de componentes
export const PerformanceOptimizedWrapper = memo(({ 
  children, 
  componentName, 
  className 
}: PerformanceOptimizedWrapperProps) => {
  const performanceMonitor = useMemo(() => PerformanceMonitor.getInstance(), []);

  useEffect(() => {
    performanceMonitor.startTimer(componentName);
    
    return () => {
      const duration = performanceMonitor.endTimer(componentName);
      
      // Log componentes lentos para otimização futura
      if (duration > 150) {
        console.warn(`⚠️ Componente ${componentName} demorou ${duration.toFixed(2)}ms para renderizar`);
      }
    };
  }, [componentName, performanceMonitor]);

  // Verificar uso de memória periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      performanceMonitor.checkMemoryUsage();
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [performanceMonitor]);

  return (
    <div className={className} data-component={componentName}>
      {children}
    </div>
  );
});

PerformanceOptimizedWrapper.displayName = 'PerformanceOptimizedWrapper';