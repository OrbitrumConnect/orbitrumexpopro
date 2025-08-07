import type { Express } from "express";
import { storage } from "./storage";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    memory: boolean;
  };
  version: string;
  uptime: number;
}

export async function checkHealth(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  const services = {
    database: await checkDatabase(),
    auth: await checkAuth(),
    storage: await checkStorage(),
    memory: checkMemory()
  };
  
  const allHealthy = Object.values(services).every(Boolean);
  const status = allHealthy ? 'healthy' : 'degraded';
  
  return {
    status,
    timestamp: new Date().toISOString(),
    services,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  };
}

async function checkDatabase(): Promise<boolean> {
  try {
    // Testar conexão básica
    await storage.getUsers();
    return true;
  } catch (error) {
    console.warn('⚠️ Database health check failed:', error);
    return false;
  }
}

async function checkAuth(): Promise<boolean> {
  try {
    // Verificar se as variáveis de ambiente estão presentes
      const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
    return hasSupabaseUrl && hasSupabaseKey;
  } catch (error) {
    console.warn('⚠️ Auth health check failed:', error);
    return false;
  }
}

async function checkStorage(): Promise<boolean> {
  try {
    // Testar operação básica de storage
    await storage.getUsers();
    return true;
  } catch (error) {
    console.warn('⚠️ Storage health check failed:', error);
    return false;
  }
}

function checkMemory(): boolean {
  try {
    const memUsage = process.memoryUsage();
    const maxMemory = 512 * 1024 * 1024; // 512MB limite
    return memUsage.heapUsed < maxMemory;
  } catch (error) {
    console.warn('⚠️ Memory health check failed:', error);
    return false;
  }
}

export function setupHealthCheck(app: Express) {
  // Endpoint básico de health check
  app.get('/health', async (req, res) => {
    try {
      const health = await checkHealth();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 207 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
  
  // Endpoint detalhado para admin
  app.get('/health/detailed', async (req, res) => {
    try {
      const health = await checkHealth();
      const detailed = {
        ...health,
        details: {
          nodejs: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV || 'development',
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          pid: process.pid
        }
      };
      
      res.json(detailed);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
  
  // Iniciar verificações periódicas
  setInterval(async () => {
    try {
      const health = await checkHealth();
      if (health.status !== 'healthy') {
        console.warn('⚠️ Sistema não está 100% saudável:', health);
      }
    } catch (error) {
      console.error('🚨 Erro no health check automático:', error);
    }
  }, 5 * 60 * 1000); // A cada 5 minutos
  
  console.log('✅ Health check configurado - /health e /health/detailed');
}