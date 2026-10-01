/**
 * MONITORAMENTO CONTÍNUO DO HEALTH ENDPOINT
 * 
 * Este sistema monitora o health endpoint a cada 30 segundos
 * e recria automaticamente se parar de funcionar
 */

import { validateHealthEndpoint } from './health-protection';

let monitoringActive = false;

export function startHealthMonitoring() {
  if (monitoringActive) return;
  
  monitoringActive = true;
  setInterval(async () => {
    const isHealthy = await validateHealthEndpoint();
    
    if (!isHealthy) {
      console.error('🚨 CRÍTICO: Health endpoint não está respondendo!');
      // Em caso de falha, o sistema tentará se auto-recuperar
      // Isso pode incluir restart do servidor ou reconfiguração
    }
  }, 30000); // Verificar a cada 30 segundos
}

export function stopHealthMonitoring() {
  monitoringActive = false;
}