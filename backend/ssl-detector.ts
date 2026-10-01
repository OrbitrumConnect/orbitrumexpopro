/**
 * 🔒 SSL Detector - Orbitrum Connect
 * Detecta automaticamente se SSL está disponível
 */

export class SSLDetector {
  private static sslAvailable: boolean | null = null;
  
  /**
   * Testa se SSL está funcionando no domínio
   */
  static async checkSSL(domain: string): Promise<boolean> {
    try {
      // Tentar fazer uma requisição HTTPS
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5s timeout
      });
      
      this.sslAvailable = response.ok;
      return this.sslAvailable;
    } catch (error) {
      this.sslAvailable = false;
      return false;
    }
  }
  
  /**
   * Retorna o protocolo correto baseado na detecção SSL
   */
  static getProtocol(domain: string): string {
    // Para desenvolvimento, sempre HTTP
    if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
      return 'http';
    }
    
    // Para produção, usar HTTPS se disponível
    return this.sslAvailable ? 'https' : 'http';
  }
  
  /**
   * Retorna URL completa com protocolo correto
   */
  static getSecureUrl(domain: string): string {
    const protocol = this.getProtocol(domain);
    return `${protocol}://${domain}`;
  }
  
  /**
   * Força verificação SSL na inicialização
   */
  static async initialize(domain: string): Promise<void> {
    if (domain.includes('localhost')) {
      this.sslAvailable = false;
      return;
    }
    
    await this.checkSSL(domain);
    
    if (this.sslAvailable) {
      process.env.SSL_ENABLED = 'true';
    } else {
      process.env.SSL_ENABLED = 'false';
    }
  }
}