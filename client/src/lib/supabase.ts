import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

// Se não há configuração do Supabase, criar um cliente mock
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado - usando dados mock')
  // Retornar um cliente mock que não faz nada
  export const supabase = {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  } as any
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
}