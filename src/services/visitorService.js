/**
 * Serviços de Visitantes
 * Rastreamento de visitantes online em tempo real
 */

import { supabase } from '../lib/supabase'

// Flag para desabilitar rastreamento se houver problemas
let trackingEnabled = true // Desabilitado até configurar RLS no Supabase

// ID único do visitante (sessão)
const getVisitorId = () => {
  try {
    let visitorId = sessionStorage.getItem('visitor_id')
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      sessionStorage.setItem('visitor_id', visitorId)
    }
    return visitorId
  } catch {
    return null
  }
}

/**
 * Registrar/atualizar presença do visitante
 */
export const updatePresence = async (page = '/') => {
  // Se rastreamento desabilitado, retornar silenciosamente
  if (!trackingEnabled) return { error: null }
  
  try {
    const visitorId = getVisitorId()
    if (!visitorId) return { error: null }
    
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    } catch {
      // Ignorar erro de autenticação
    }
    
    const { error } = await supabase
      .from('visitors')
      .upsert({
        id: visitorId,
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.user_metadata?.nome || null,
        current_page: page,
        last_seen: new Date().toISOString(),
        user_agent: navigator.userAgent,
        is_authenticated: !!user,
      }, {
        onConflict: 'id'
      })

    // Se tabela não existe, desabilitar rastreamento
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      trackingEnabled = false
      console.debug('Tabela visitors não existe, rastreamento desabilitado')
      return { error: null }
    }

    if (error) throw error
    return { error: null }
  } catch (error) {
    // Desabilitar em caso de erro persistente
    trackingEnabled = false
    return { error }
  }
}

/**
 * Remover presença do visitante (ao sair)
 */
export const removePresence = async () => {
  try {
    const visitorId = getVisitorId()
    
    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', visitorId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Erro ao remover presença:', error)
    return { error }
  }
}

/**
 * Buscar visitantes online (últimos 5 minutos)
 */
export const getOnlineVisitors = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .gte('last_seen', fiveMinutesAgo)
      .order('last_seen', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar visitantes:', error)
    return { data: null, error }
  }
}

/**
 * Contar visitantes online
 */
export const getOnlineCount = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { count, error } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', fiveMinutesAgo)

    if (error) throw error
    return { data: count, error: null }
  } catch (error) {
    console.error('Erro ao contar visitantes:', error)
    return { data: 0, error }
  }
}

/**
 * Limpar visitantes antigos (mais de 1 hora)
 */
export const cleanOldVisitors = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { error } = await supabase
      .from('visitors')
      .delete()
      .lt('last_seen', oneHourAgo)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Erro ao limpar visitantes antigos:', error)
    return { error }
  }
}

/**
 * Subscrição em tempo real para visitantes
 */
export const subscribeToVisitors = (callback) => {
  const subscription = supabase
    .channel('visitors-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'visitors'
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

export default {
  updatePresence,
  removePresence,
  getOnlineVisitors,
  getOnlineCount,
  cleanOldVisitors,
  subscribeToVisitors
}
