interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class IntelligentCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private hitCount = 0;
  private missCount = 0;

  // Cache com TTL personalizado
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };
    
    this.cache.set(key, entry);
    console.log(`📦 Cache SET: ${key} (TTL: ${ttlMinutes}min)`);
  }

  // Buscar do cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      console.log(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }

    this.hitCount++;
    console.log(`✅ Cache HIT: ${key}`);
    return entry.data as T;
  }

  // Cache condicional - só armazena se dados mudaram
  setIfChanged<T>(key: string, newData: T, ttlMinutes: number = 5): boolean {
    const existing = this.get<T>(key);
    
    // Comparar dados (JSON stringify para comparação simples)
    const existingStr = existing ? JSON.stringify(existing) : null;
    const newStr = JSON.stringify(newData);
    
    if (existingStr !== newStr) {
      this.set(key, newData, ttlMinutes);
      console.log(`🔄 Cache UPDATED: ${key} (dados alterados)`);
      return true;
    }
    
    console.log(`➡️ Cache UNCHANGED: ${key}`);
    return false;
  }

  // Invalidar cache por padrão
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`🗑️ Cache INVALIDATED: ${count} entradas (padrão: ${pattern})`);
    }
    
    return count;
  }

  // Estatísticas do cache
  getStats(): {
    totalEntries: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    memoryUsage: string;
  } {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
    
    // Calcular uso de memória aproximado
    let memoryBytes = 0;
    for (const entry of this.cache.values()) {
      memoryBytes += JSON.stringify(entry.data).length * 2; // UTF-16 aproximado
    }
    
    const memoryKB = Math.round(memoryBytes / 1024);
    const memoryUsage = memoryKB > 1024 
      ? `${Math.round(memoryKB / 1024 * 100) / 100}MB`
      : `${memoryKB}KB`;

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      memoryUsage
    };
  }

  // Limpeza automática de entradas expiradas
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache CLEANUP: ${cleaned} entradas expiradas removidas`);
    }
    
    return cleaned;
  }

  // Cache inteligente para queries de usuários
  cacheUserQuery<T>(userId: number, queryType: string, data: T, ttlMinutes: number = 10): void {
    const key = `user:${userId}:${queryType}`;
    this.set(key, data, ttlMinutes);
  }

  getUserQueryCache<T>(userId: number, queryType: string): T | null {
    const key = `user:${userId}:${queryType}`;
    return this.get<T>(key);
  }

  // Cache para dados administrativos
  cacheAdminData<T>(dataType: string, data: T, ttlMinutes: number = 5): void {
    const key = `admin:${dataType}`;
    this.setIfChanged(key, data, ttlMinutes);
  }

  getAdminCache<T>(dataType: string): T | null {
    const key = `admin:${dataType}`;
    return this.get<T>(key);
  }

  // Invalidar cache quando usuário faz alterações
  invalidateUserCache(userId: number): number {
    return this.invalidatePattern(`user:${userId}:`);
  }

  // Invalidar cache admin quando há mudanças
  invalidateAdminCache(): number {
    return this.invalidatePattern(`admin:`);
  }
}

// Cache system singleton
export const cache = new IntelligentCache();

// Limpeza automática a cada 30 minutos
setInterval(() => {
  cache.cleanup();
}, 30 * 60 * 1000);

// Log de estatísticas a cada hora
setInterval(() => {
  const stats = cache.getStats();
  console.log(`📊 Cache Stats: ${stats.totalEntries} entries, ${stats.hitRate}% hit rate, ${stats.memoryUsage} memory`);
}, 60 * 60 * 1000);