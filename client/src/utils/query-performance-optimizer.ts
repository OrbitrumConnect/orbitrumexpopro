/**
 * Utilitário para otimização global de queries
 * Reduz drasticamente o número de requisições repetidas
 */

export const ULTRA_OPTIMIZED_QUERY_CONFIG = {
  // Para dados demo/estáticos que NUNCA mudam
  staticData: {
    staleTime: Infinity, // Cache infinito
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: false,
    retryOnMount: false,
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    notifyOnChangeProps: ['data', 'error'] as const,
  },
  
  // Para dados que mudam raramente (planos, configurações)
  semiStatic: {
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
  },
  
  // Para dados dinâmicos (wallet, notifications)
  dynamic: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
    gcTime: 30 * 60 * 1000, // 30 minutos
  }
};

/**
 * Hook para condicionar queries baseado na autenticação
 */
export function getQueryCondition(isAuthenticated: boolean, type: 'user' | 'professional' | 'admin') {
  return {
    enabled: !isAuthenticated && typeof window !== 'undefined',
    ...ULTRA_OPTIMIZED_QUERY_CONFIG.staticData
  };
}

/**
 * Configuração específica para diferentes tipos de dados
 */
export const QUERY_CONFIGS = {
  // Dados demo de usuários (nunca mudam)
  demoUser: {
    ...ULTRA_OPTIMIZED_QUERY_CONFIG.staticData,
    enabled: (isAuth: boolean) => !isAuth && typeof window !== 'undefined',
  },
  
  // Profissionais demo (nunca mudam)
  demoProfessionals: {
    ...ULTRA_OPTIMIZED_QUERY_CONFIG.staticData,
  },
  
  // Wallet demo (nunca muda)
  demoWallet: {
    ...ULTRA_OPTIMIZED_QUERY_CONFIG.staticData,
  },
  
  // Dados reais de usuários (mudam raramente)
  realUser: {
    ...ULTRA_OPTIMIZED_QUERY_CONFIG.semiStatic,
  },
  
  // Notificações (dados dinâmicos)
  notifications: {
    ...ULTRA_OPTIMIZED_QUERY_CONFIG.dynamic,
  },
};