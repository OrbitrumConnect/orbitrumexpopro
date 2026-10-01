// Configuração específica para o Vercel
export const VERCEL_ENV = {
  // Verificar se estamos no Vercel
  IS_VERCEL: (import.meta as any).env?.VITE_VERCEL === '1' || (import.meta as any).env?.VERCEL === '1',
  
  // Verificar se estamos em produção
  IS_PRODUCTION: (import.meta as any).env?.PROD === true || (import.meta as any).env?.NODE_ENV === 'production',
  
  // Supabase URL (Orbitrum)
  SUPABASE_URL: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://gnvxnsgewhjucdhwrrdi.supabase.co',
  
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


// Função para verificar se deve usar dados reais
export const shouldUseRealData = (): boolean => {
  return VERCEL_ENV.DATA_CONFIG.USE_REAL_DATA;
};

// Função para obter Supabase URL
export const getSupabaseUrl = (): string => {
  return VERCEL_ENV.SUPABASE_URL;
}; 