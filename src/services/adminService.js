/**
 * Admin Service
 * Gerenciamento seguro de administradores via Supabase
 */

import { supabase } from '../lib/supabase'

// Super admin hardcoded (fallback enquanto tabela não existe)
const SUPER_ADMIN_EMAIL = 'gordao@gmail.com'

/**
 * Verifica se o usuário atual é admin
 * @returns {Promise<{isAdmin: boolean, isSuperAdmin: boolean, email?: string}>}
 */
export const getAdminStatus = async () => {
  try {
    // Primeiro, tenta usar a função RPC do banco (mais seguro)
    const { data, error } = await supabase.rpc('get_admin_status')
    
    if (error) {
      // Se a função não existe (tabela admins não foi criada ainda),
      // faz fallback para verificar apenas o super admin por email
      console.warn('Tabela admins não encontrada, usando fallback:', error.message)
      
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email?.toLowerCase()
      
      if (userEmail === SUPER_ADMIN_EMAIL) {
        return { isAdmin: true, isSuperAdmin: true, email: userEmail }
      }
      
      return { isAdmin: false, isSuperAdmin: false }
    }
    
    return {
      isAdmin: data?.is_admin || false,
      isSuperAdmin: data?.is_super_admin || false,
      email: data?.email
    }
  } catch (err) {
    console.error('Erro ao verificar admin:', err)
    return { isAdmin: false, isSuperAdmin: false }
  }
}

/**
 * Lista todos os administradores (apenas para admins)
 * @returns {Promise<Array>}
 */
export const listAdmins = async () => {
  try {
    const { data, error } = await supabase.rpc('list_admins')
    
    if (error) {
      console.error('Erro ao listar admins:', error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Erro ao listar admins:', err)
    return []
  }
}

/**
 * Adiciona um novo administrador (apenas super admin)
 * @param {string} email - Email do novo admin
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const addAdmin = async (email) => {
  try {
    const { data, error } = await supabase.rpc('add_admin', { 
      admin_email: email.toLowerCase().trim() 
    })
    
    if (error) {
      console.error('Erro ao adicionar admin:', error)
      return { success: false, error: error.message }
    }
    
    return data
  } catch (err) {
    console.error('Erro ao adicionar admin:', err)
    return { success: false, error: 'Erro inesperado' }
  }
}

/**
 * Remove um administrador (apenas super admin)
 * @param {string} email - Email do admin a remover
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const removeAdmin = async (email) => {
  try {
    const { data, error } = await supabase.rpc('remove_admin', { 
      admin_email: email.toLowerCase().trim() 
    })
    
    if (error) {
      console.error('Erro ao remover admin:', error)
      return { success: false, error: error.message }
    }
    
    return data
  } catch (err) {
    console.error('Erro ao remover admin:', err)
    return { success: false, error: 'Erro inesperado' }
  }
}
