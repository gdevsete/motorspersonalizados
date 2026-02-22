/**
 * Serviços de Depoimentos
 * Funções para gerenciar depoimentos no Supabase
 */

import { supabase } from '../lib/supabase'

/**
 * Buscar todos os depoimentos ativos
 */
export const getTestimonials = async () => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar depoimentos:', error)
    return { data: null, error }
  }
}

/**
 * Criar novo depoimento (admin)
 */
export const createTestimonial = async (testimonialData) => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .insert([testimonialData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar depoimento:', error)
    return { data: null, error }
  }
}

/**
 * Deletar depoimento (admin)
 */
export const deleteTestimonial = async (id) => {
  try {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Erro ao deletar depoimento:', error)
    return { error }
  }
}

/**
 * Atualizar depoimento (admin)
 */
export const updateTestimonial = async (id, testimonialData) => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .update(testimonialData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao atualizar depoimento:', error)
    return { data: null, error }
  }
}
