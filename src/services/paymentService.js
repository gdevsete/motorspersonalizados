/**
 * Payment Service - Integração com BlackCat Pagamentos
 * Gerencia criação de pagamentos PIX
 */

const API_BASE_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3000/api'

/**
 * Criar pagamento PIX
 * @param {Object} params - Parâmetros do pagamento
 * @param {Object} params.customer - Dados do cliente
 * @param {Array} params.items - Itens da compra
 * @param {number} params.amount - Valor em centavos
 * @param {string} params.orderId - ID do pedido
 * @returns {Promise<Object>} Dados do pagamento PIX
 */
export const createPixPayment = async ({ customer, items, amount, orderId }) => {
  try {
    const response = await fetch('/api/create-pix-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer,
        items,
        amount,
        externalRef: orderId,
        metadata: `Pedido ${orderId} - Motors Personalizados`
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.details || data.error || 'Erro ao criar pagamento')
    }

    return data

  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error)
    throw error
  }
}

/**
 * Formatar valor em centavos para reais
 * @param {number} cents - Valor em centavos
 * @returns {string} Valor formatado em reais
 */
export const formatCurrency = (cents) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

/**
 * Converter reais para centavos
 * @param {number} reais - Valor em reais
 * @returns {number} Valor em centavos
 */
export const toCents = (reais) => {
  return Math.round(reais * 100)
}

/**
 * Validar CPF
 * @param {string} cpf - CPF para validar
 * @returns {boolean} Se o CPF é válido
 */
export const validateCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '')
  
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(10))) return false
  
  return true
}

/**
 * Formatar CPF
 * @param {string} cpf - CPF para formatar
 * @returns {string} CPF formatado
 */
export const formatCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '')
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formatar telefone
 * @param {string} phone - Telefone para formatar
 * @returns {string} Telefone formatado
 */
export const formatPhone = (phone) => {
  phone = phone.replace(/\D/g, '')
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}
