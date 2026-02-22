/**
 * Serviços de Usuários
 * Funções para gerenciar usuários no Supabase (Admin)
 */

import { supabase } from '../lib/supabase'

/**
 * Buscar todos os usuários
 * Requer permissão de admin/service_role
 */
export const getAllUsers = async () => {
  try {
    // Buscar usuários da tabela auth.users via função RPC
    const { data, error } = await supabase
      .rpc('get_all_users')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return { data: null, error }
  }
}

/**
 * Buscar detalhes de um usuário específico
 */
export const getUserDetails = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_details', { user_id: userId })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error)
    return { data: null, error }
  }
}

/**
 * Buscar pedidos de um usuário específico
 */
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar pedidos do usuário:', error)
    return { data: null, error }
  }
}

/**
 * Deletar usuário (requer permissão de admin)
 */
export const deleteUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('delete_user', { user_id: userId })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return { data: null, error }
  }
}

/**
 * Contar total de usuários
 */
export const getUsersCount = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_users_count')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao contar usuários:', error)
    return { data: null, error }
  }
}

export default {
  getAllUsers,
  getUserDetails,
  getUserOrders,
  deleteUser,
  getUsersCount
}
