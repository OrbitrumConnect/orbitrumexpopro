/**
 * QUERY KILLER - Solução extrema para eliminar queries desnecessárias
 * Implementa cache global e previne requisições repetidas
 */

// Cache global para dados estáticos
const GLOBAL_CACHE = new Map<string, { data: any; timestamp: number }>();

export class QueryKiller {
  private static instance: QueryKiller;
  private blockedQueries = new Set<string>();
  
  static getInstance(): QueryKiller {
    if (!QueryKiller.instance) {
      QueryKiller.instance = new QueryKiller();
    }
    return QueryKiller.instance;
  }

  // Bloquear queries específicas que fazem loop
  blockQuery(queryKey: string) {
    this.blockedQueries.add(queryKey);
    console.log(`🚫 Query BLOQUEADA: ${queryKey}`);
  }

  isBlocked(queryKey: string): boolean {
    return this.blockedQueries.has(queryKey);
  }

  // Cache global para dados demo
  cacheData(key: string, data: any) {
    GLOBAL_CACHE.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCachedData(key: string): any | null {
    const cached = GLOBAL_CACHE.get(key);
    if (cached) {
      // Cache infinito para dados demo
      return cached.data;
    }
    return null;
  }

  // Estatísticas de bloqueio
  getStats() {
    return {
      blockedQueries: Array.from(this.blockedQueries),
      cacheSize: GLOBAL_CACHE.size,
      cachedKeys: Array.from(GLOBAL_CACHE.keys())
    };
  }
}

// Hook para usar o cache global
export function useGlobalCache<T>(key: string, fetchFn: () => Promise<T>, enabled = true): T | null {
  const queryKiller = QueryKiller.getInstance();
  
  // Verificar se query está bloqueada
  if (queryKiller.isBlocked(key) || !enabled) {
    return null;
  }
  
  // Verificar cache global primeiro
  const cached = queryKiller.getCachedData(key);
  if (cached) {
    return cached;
  }
  
  // Se não tem cache, buscar uma única vez
  if (typeof window !== 'undefined') {
    fetchFn().then(data => {
      queryKiller.cacheData(key, data);
    }).catch(() => {
      // Bloquear query em caso de erro
      queryKiller.blockQuery(key);
    });
  }
  
  return null;
}