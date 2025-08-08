// Configuração específica para o Vercel
export const VERCEL_ENV = {
  // Verificar se estamos no Vercel
  IS_VERCEL: import.meta.env.VITE_VERCEL === '1' || import.meta.env.VERCEL === '1',
  
  // Verificar se estamos em produção
  IS_PRODUCTION: import.meta.env.PROD === true || import.meta.env.NODE_ENV === 'production',
  
  // Supabase URL (removido Railway)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://gnvxnsgewhjucdhwrrdi.supabase.co',
  
  // Configuração de dados
  DATA_CONFIG: {
    // Sempre usar dados reais (R$ 41,00)
    USE_REAL_DATA: true,
    // Fonte de dados
    SOURCE: 'supabase',
    // Receita total real
    TOTAL_REVENUE: 41.00
  }
};

// Log para debug no Vercel
if (VERCEL_ENV.IS_VERCEL) {
  console.log('🚀 Vercel Environment:', {
    isVercel: VERCEL_ENV.IS_VERCEL,
    isProduction: VERCEL_ENV.IS_PRODUCTION,
    supabaseUrl: VERCEL_ENV.SUPABASE_URL,
    useRealData: VERCEL_ENV.DATA_CONFIG.USE_REAL_DATA,
    totalRevenue: VERCEL_ENV.DATA_CONFIG.TOTAL_REVENUE
  });
}

// Função para verificar se deve usar dados reais
export const shouldUseRealData = (): boolean => {
  return VERCEL_ENV.DATA_CONFIG.USE_REAL_DATA;
};

// Função para obter Supabase URL
export const getSupabaseUrl = (): string => {
  return VERCEL_ENV.SUPABASE_URL;
}; 