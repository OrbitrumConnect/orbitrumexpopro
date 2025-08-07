interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  maxLogSize: number;
  categories: {
    [key: string]: boolean;
  };
}

class LogOptimizer {
  private config: LogConfig = {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    enableConsole: true,
    enableFile: false,
    maxLogSize: 100, // Máximo de logs em memória
    categories: {
      admin: true,
      auth: true,
      api: false, // Reduzir logs de API repetitivos
      cache: false,
      sync: true,
      game: false,
      payment: true,
      error: true
    }
  };

  private logBuffer: Array<{
    timestamp: Date;
    level: string;
    category: string;
    message: string;
  }> = [];

  // Log otimizado com categorias
  log(category: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    // Verificar se categoria está habilitada
    if (!this.config.categories[category]) {
      return;
    }

    // Verificar nível mínimo
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.config.level]) {
      return;
    }

    // Criar entrada de log
    const logEntry = {
      timestamp: new Date(),
      level: level.toUpperCase(),
      category: category.toUpperCase(),
      message
    };

    // Adicionar ao buffer
    this.logBuffer.push(logEntry);
    
    // Manter apenas os logs mais recentes
    if (this.logBuffer.length > this.config.maxLogSize) {
      this.logBuffer.shift();
    }

    // Log no console se habilitado
    if (this.config.enableConsole) {
      const emoji = this.getEmojiForLevel(level);
      const formattedMessage = `${emoji} [${category.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, ...args);
          break;
        case 'info':
          console.log(formattedMessage, ...args);
          break;
        case 'warn':
          console.warn(formattedMessage, ...args);
          break;
        case 'error':
          console.error(formattedMessage, ...args);
          break;
      }
    }
  }

  private getEmojiForLevel(level: string): string {
    switch (level) {
      case 'debug': return '🐛';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  // Métodos de conveniência
  debug(category: string, message: string, ...args: any[]): void {
    this.log(category, 'debug', message, ...args);
  }

  info(category: string, message: string, ...args: any[]): void {
    this.log(category, 'info', message, ...args);
  }

  warn(category: string, message: string, ...args: any[]): void {
    this.log(category, 'warn', message, ...args);
  }

  error(category: string, message: string, ...args: any[]): void {
    this.log(category, 'error', message, ...args);
  }

  // Configurar categorias de log
  setCategory(category: string, enabled: boolean): void {
    this.config.categories[category] = enabled;
    this.info('system', `Log category '${category}' ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Obter logs recentes para admin
  getRecentLogs(limit: number = 50): typeof this.logBuffer {
    return this.logBuffer.slice(-limit);
  }

  // Filtrar logs por categoria
  getLogsByCategory(category: string, limit: number = 20): typeof this.logBuffer {
    return this.logBuffer
      .filter(log => log.category.toLowerCase() === category.toLowerCase())
      .slice(-limit);
  }

  // Estatísticas de logs
  getLogStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    oldestLog: Date | null;
    newestLog: Date | null;
  } {
    const logsByLevel: Record<string, number> = {};
    const logsByCategory: Record<string, number> = {};

    this.logBuffer.forEach(log => {
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;
    });

    return {
      totalLogs: this.logBuffer.length,
      logsByLevel,
      logsByCategory,
      oldestLog: this.logBuffer.length > 0 ? this.logBuffer[0].timestamp : null,
      newestLog: this.logBuffer.length > 0 ? this.logBuffer[this.logBuffer.length - 1].timestamp : null
    };
  }

  // Modo produção - logs mínimos
  setProductionMode(): void {
    this.config.level = 'warn';
    this.config.categories = {
      admin: true,
      auth: true,
      api: false,
      cache: false,
      sync: false,
      game: false,
      payment: true,
      error: true
    };
    this.info('system', 'Log system configured for production mode');
  }

  // Modo desenvolvimento - logs detalhados
  setDevelopmentMode(): void {
    this.config.level = 'debug';
    Object.keys(this.config.categories).forEach(key => {
      this.config.categories[key] = true;
    });
    this.info('system', 'Log system configured for development mode');
  }

  // Limpar logs antigos
  clearOldLogs(): number {
    const initialCount = this.logBuffer.length;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.logBuffer = this.logBuffer.filter(log => log.timestamp > oneHourAgo);
    
    const cleared = initialCount - this.logBuffer.length;
    if (cleared > 0) {
      this.info('system', `Cleared ${cleared} old log entries`);
    }
    
    return cleared;
  }
}

// Instância única do sistema de logs
export const logger = new LogOptimizer();

// Configurar baseado no ambiente
if (process.env.NODE_ENV === 'production') {
  logger.setProductionMode();
} else {
  logger.setDevelopmentMode();
}

// Limpeza automática a cada hora
setInterval(() => {
  logger.clearOldLogs();
}, 60 * 60 * 1000);