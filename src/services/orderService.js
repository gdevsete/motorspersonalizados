/**
 * Serviços de Pedidos
 * Funções para gerenciar pedidos no Supabase
 */

import { supabase } from '../lib/supabase'

// Helper para timeout em promises (30 segundos padrão)
const withTimeout = (promise, ms = 30000) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Tempo limite excedido')), ms)
  })
  return Promise.race([promise, timeout])
}

/**
 * Criar novo pedido
 */
export const createOrder = async (orderData) => {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()
    )

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return { data: null, error }
  }
}

/**
 * Buscar pedidos do usuário
 */
export const getUserOrders = async (userId) => {
  try {
    // Sem timeout para leitura - deixar o Supabase gerenciar
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return { data: [], error }
  }
}

/**
 * Buscar todos os pedidos (admin)
 */
export const getAllOrders = async () => {
  try {
    // Sem timeout para leitura - deixar o Supabase gerenciar
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Erro ao buscar todos os pedidos:', error)
    return { data: [], error }
  }
}

/**
 * Atualizar status do pedido
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()
    )

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return { data: null, error }
  }
}

/**
 * Buscar pedido por ID
 */
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
    )

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return { data: null, error }
  }
}

/**
 * Upload de imagem da moto
 */
export const uploadMotoImage = async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await withTimeout(
      supabase.storage
        .from('moto-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        }),
      30000 // 30s para upload
    )

    if (error) throw error

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('moto-images')
      .getPublicUrl(fileName)

    return { data: publicUrl, error: null }
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return { data: null, error }
  }
}
