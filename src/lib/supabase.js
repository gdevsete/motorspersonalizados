/**
 * Cliente Supabase
 * Configuração centralizada para conexão com Supabase
 */

import { createClient } from '@supabase/supabase-js'

// Variáveis de ambiente do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL ou Anon Key não configuradas. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY'
  )
}

// Criação do cliente Supabase com configurações otimizadas
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Persistir sessão no localStorage
      persistSession: true,
      // Auto refresh do token
      autoRefreshToken: true,
      // Detectar sessão em outras abas
      detectSessionInUrl: true,
    },
  }
)

export default supabase
