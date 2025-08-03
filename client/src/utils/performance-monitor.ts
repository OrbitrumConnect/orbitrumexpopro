// Performance monitoring utilities for Orbitrum Connect
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  public startTimer(componentName: string): void {
    this.metrics.set(`${componentName}_start`, performance.now());
  }

  public endTimer(componentName: string): number {
    const start = this.metrics.get(`${componentName}_start`);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.metrics.set(`${componentName}_duration`, duration);
    
    // Log slow components (>100ms)
    if (duration > 100) {
      console.warn(`🐌 Componente lento: ${componentName} (${duration.toFixed(2)}ms)`);
    }
    
    return duration;
  }

  // Memory usage tracking
  public checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100;
      
      if (used > limit * 0.8) {
        console.warn(`🚨 Alto uso de memória: ${used}MB de ${limit}MB (${Math.round(used/limit*100)}%)`);
      }
    }
  }

  // Network request optimization
  public optimizeApiCalls(): void {
    // Clear old cached data every 30 minutes
    setInterval(() => {
      if (window.localStorage.length > 50) {
        console.log('🧹 Limpando cache antigo...');
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('react-query')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.slice(0, 10).forEach(key => {
          window.localStorage.removeItem(key);
        });
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
}

// Debounce utility for API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Image lazy loading utility
export function lazyLoadImages(): void {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}