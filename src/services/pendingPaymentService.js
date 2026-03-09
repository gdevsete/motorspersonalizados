/**
 * Pending Payment Service
 * Gerencia pagamentos PIX pendentes (não pagos)
 */

import { supabase } from '../lib/supabase'

/**
 * Salvar um pagamento pendente
 * @param {Object} params - Dados do pagamento
 * @returns {Promise<Object>} Pagamento salvo
 */
export const savePendingPayment = async ({
  userId,
  transactionId,
  orderId,
  qrCode,
  qrCodeBase64,
  copyPaste,
  expiresAt,
  modelo,
  valor,
  imagemUrl,
  customerName,
  customerEmail,
  customerPhone,
  customerCpf
}) => {
  try {
    // Log para debug
    console.log('Tentando salvar pagamento pendente:', { userId, transactionId, orderId })

    const { data, error } = await supabase
      .from('pending_payments')
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        order_id: orderId,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        copy_paste: copyPaste,
        expires_at: expiresAt,
        modelo: modelo,
        valor: valor,
        imagem_url: imagemUrl,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_cpf: customerCpf,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro Supabase ao salvar pagamento pendente:', error.message, error.code, error.details)
      throw error
    }

    console.log('Pagamento pendente salvo com sucesso:', data?.id)
    return data
  } catch (error) {
    console.error('Erro em savePendingPayment:', error.message || error)
    throw error
  }
}

/**
 * Listar pagamentos pendentes do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de pagamentos pendentes
 */
export const getPendingPayments = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar pagamentos pendentes:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro em getPendingPayments:', error)
    return []
  }
}

/**
 * Buscar um pagamento pendente específico
 * @param {string} transactionId - ID da transação
 * @returns {Promise<Object|null>} Pagamento encontrado ou null
 */
export const getPendingPaymentByTransaction = async (transactionId) => {
  try {
    const { data, error } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Não encontrado
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro em getPendingPaymentByTransaction:', error)
    return null
  }
}

/**
 * Marcar pagamento como pago
 * @param {string} transactionId - ID da transação
 * @returns {Promise<Object>} Pagamento atualizado
 */
export const markPaymentAsPaid = async (transactionId) => {
  try {
    const { data, error } = await supabase
      .from('pending_payments')
      .update({ status: 'paid' })
      .eq('transaction_id', transactionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro em markPaymentAsPaid:', error)
    throw error
  }
}

/**
 * Cancelar/remover pagamento pendente
 * @param {string} transactionId - ID da transação
 * @returns {Promise<void>}
 */
export const cancelPendingPayment = async (transactionId) => {
  try {
    const { error } = await supabase
      .from('pending_payments')
      .update({ status: 'cancelled' })
      .eq('transaction_id', transactionId)

    if (error) throw error
  } catch (error) {
    console.error('Erro em cancelPendingPayment:', error)
    throw error
  }
}

/**
 * Deletar pagamento pendente
 * @param {string} id - ID do pagamento
 * @returns {Promise<void>}
 */
export const deletePendingPayment = async (id) => {
  try {
    const { error } = await supabase
      .from('pending_payments')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Erro em deletePendingPayment:', error)
    throw error
  }
}
