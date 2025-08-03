import { createClient } from '@supabase/supabase-js';

// Função para testar conexão Supabase no frontend
export const testSupabaseConnection = async () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente Supabase não configuradas');
    return { success: false, error: 'Missing environment variables' };
  }
  
  console.log('🔗 Testando conexão Supabase...');
  console.log('URL:', supabaseUrl);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste 1: Verificar conectividade
    console.log('📡 Testando conectividade...');
    const { data: pingData, error: pingError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (pingError) {
      console.error('❌ Erro de conectividade:', pingError);
      return { success: false, error: pingError };
    }
    
    console.log('✅ Conectividade OK');
    
    // Teste 2: Inserir dados de teste
    console.log('📝 Testando inserção...');
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        { 
          nome_completo: "Teste Frontend Orbitrum", 
          email: `teste-${Date.now()}@orbitrum.com`, 
          tipo: "user",
          telefone: "(11) 99999-9999",
          cpf: "123.456.789-00"
        }
      ])
      .select();

    if (error) {
      console.error('❌ Erro na inserção:', error);
      return { success: false, error };
    }

    console.log('✅ Inserção bem-sucedida!', data);
    
    // Teste 3: Limpar dados de teste
    if (data && data.length > 0) {
      await supabase
        .from('usuarios')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Dados de teste removidos');
    }
    
    return { success: true, data };
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
    return { success: false, error: err };
  }
};

// Função para ser chamada no console do navegador
(window as any).testSupabase = testSupabaseConnection;