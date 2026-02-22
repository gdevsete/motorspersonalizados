/**
 * Chat Service - Gerencia mensagens do chat de suporte
 */

import { supabase } from '../lib/supabase'

// Criar ou obter conversa do usuário
export const getOrCreateConversation = async (userId, userEmail, userName) => {
  try {
    // Verificar se já existe conversa ativa
    const { data: existing, error: findError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existing) return existing

    // Criar nova conversa
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar conversa:', error)
    throw error
  }
}

// Criar conversa para visitante anônimo
export const getOrCreateGuestConversation = async () => {
  try {
    // Verificar se já tem ID de visitante no localStorage
    let guestId = localStorage.getItem('chat_guest_id')
    
    if (guestId) {
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('guest_id', guestId)
        .eq('status', 'active')
        .single()

      if (existing) return existing
    }

    // Criar novo ID de visitante
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('chat_guest_id', guestId)

    // Criar conversa
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        guest_id: guestId,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar conversa de visitante:', error)
    throw error
  }
}

// Enviar mensagem
export const sendMessage = async (conversationId, content, isFromUser = true) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        content,
        is_from_user: isFromUser
      })
      .select()
      .single()

    if (error) throw error

    // Atualizar última mensagem da conversa
    await supabase
      .from('chat_conversations')
      .update({ 
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_count: isFromUser ? supabase.raw('unread_count + 1') : 0
      })
      .eq('id', conversationId)

    return data
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    throw error
  }
}

// Buscar mensagens de uma conversa
export const getMessages = async (conversationId) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return []
  }
}

// Buscar todas as conversas (admin)
export const getAllConversations = async () => {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return []
  }
}

// Marcar mensagens como lidas
export const markAsRead = async (conversationId) => {
  try {
    await supabase
      .from('chat_conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId)
  } catch (error) {
    console.error('Erro ao marcar como lido:', error)
  }
}

// Fechar conversa
export const closeConversation = async (conversationId) => {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao fechar conversa:', error)
    throw error
  }
}

// Subscrever a novas mensagens em tempo real
export const subscribeToMessages = (conversationId, callback) => {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}

// Subscrever a todas conversas (admin)
export const subscribeToConversations = (callback) => {
  const subscription = supabase
    .channel('all_conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_conversations'
      },
      () => {
        callback()
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}
