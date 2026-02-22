/**
 * Serviços de Produtos
 * Funções para gerenciar produtos no Supabase
 */

import { supabase } from '../lib/supabase'

/**
 * Buscar todos os produtos ativos
 */
export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return { data: null, error }
  }
}

/**
 * Buscar todos os produtos (admin)
 */
export const getAllProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return { data: null, error }
  }
}

/**
 * Criar novo produto (admin)
 */
export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return { data: null, error }
  }
}

/**
 * Atualizar produto (admin)
 */
export const updateProduct = async (id, productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return { data: null, error }
  }
}

/**
 * Deletar produto (admin)
 */
export const deleteProduct = async (id) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return { error }
  }
}

/**
 * Toggle ativo/inativo do produto
 */
export const toggleProductActive = async (id, ativo) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ ativo })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao atualizar status do produto:', error)
    return { data: null, error }
  }
}
