// Sistema de otimização de memória para Orbitrum Connect
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private cleanupTasks: Array<() => void> = [];
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  public static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
      MemoryOptimizer.instance.initialize();
    }
    return MemoryOptimizer.instance;
  }

  private initialize(): void {
    // Monitorar uso de memória a cada 5 minutos
    this.memoryCheckInterval = setInterval(() => {
      this.checkAndCleanMemory();
    }, 5 * 60 * 1000);

    // Limpar ao sair da página
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  public registerCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  public checkAndCleanMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100;
      const usage = usedMB / limitMB;

      console.log(`🧠 Memória: ${usedMB}MB de ${limitMB}MB (${Math.round(usage * 100)}%)`);

      // Se uso de memória > 70%, executar limpeza
      if (usage > 0.7) {
        console.warn('🧹 Alto uso de memória detectado - executando limpeza automática');
        this.performCleanup();
      }
    }
  }

  private performCleanup(): void {
    // 1. Limpar cache do React Query antigo
    try {
      const queryClient = (window as any).queryClient;
      if (queryClient) {
        const queries = queryClient.getQueryCache().getAll();
        queries.forEach((query: any) => {
          // Remover queries antigas (mais de 30 minutos)
          if (query.state.dataUpdatedAt < Date.now() - 30 * 60 * 1000) {
            queryClient.getQueryCache().remove(query);
          }
        });
        console.log('✅ Cache antigo do React Query limpo');
      }
    } catch (error) {
      console.warn('Erro ao limpar cache React Query:', error);
    }

    // 2. Limpar localStorage excessivo
    this.cleanLocalStorage();

    // 3. Executar tarefas de limpeza registradas
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Erro ao executar tarefa de limpeza:', error);
      }
    });

    // 4. Forçar coleta de lixo se disponível
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('🗑️ Coleta de lixo forçada executada');
    }
  }

  private cleanLocalStorage(): void {
    const itemsToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Remover chaves antigas de query cache
        if (key.startsWith('react-query') || key.startsWith('tanstack-query')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp && Date.now() - data.timestamp > 60 * 60 * 1000) { // 1 hora
              itemsToRemove.push(key);
            }
          } catch {
            itemsToRemove.push(key); // Remove se não conseguir parsear
          }
        }
      }
    }

    itemsToRemove.forEach(key => localStorage.removeItem(key));
    
    if (itemsToRemove.length > 0) {
      console.log(`🧹 ${itemsToRemove.length} itens antigos removidos do localStorage`);
    }
  }

  public cleanup(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    this.cleanupTasks = [];
  }

  // Otimizações específicas para componentes pesados
  public optimizeComponent(componentName: string): {
    onMount: () => void;
    onUnmount: () => void;
  } {
    const startTime = performance.now();
    
    return {
      onMount: () => {
        console.log(`📊 ${componentName} montado`);
      },
      onUnmount: () => {
        const duration = performance.now() - startTime;
        console.log(`📊 ${componentName} desmontado após ${duration.toFixed(2)}ms`);
        
        // Se componente ficou muito tempo montado, executar limpeza
        if (duration > 60000) { // 1 minuto
          this.performCleanup();
        }
      }
    };
  }
}

// Função utilitária para componentes
export function useMemoryOptimization(componentName: string) {
  const optimizer = MemoryOptimizer.getInstance();
  const { onMount, onUnmount } = optimizer.optimizeComponent(componentName);
  
  // React precisa ser importado separadamente
  const { useEffect } = require('react');
  
  useEffect(() => {
    onMount();
    return onUnmount;
  }, []);
}

// Exportar instância singleton
export const memoryOptimizer = MemoryOptimizer.getInstance();