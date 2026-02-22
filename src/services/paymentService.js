/**
 * Payment Service - Integração com BlackCat Pagamentos
 * Gerencia criação de pagamentos PIX
 */

// Em produção usa API serverless, em dev chama direto (apenas para teste)
const IS_PRODUCTION = import.meta.env.PROD
const BLACKCAT_API_URL = 'https://api.blackcatpagamentos.online/api/sales/create-sale'
const BLACKCAT_SECRET_KEY = 'sk_live_78615fa90151ee748c94803c2ee205e147ead6b33562f20b890f9e1003895c4e'

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
    let response
    let data

    if (IS_PRODUCTION) {
      // Em produção, usa API serverless
      response = await fetch('/api/create-pix-payment', {
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

      data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro ao criar pagamento')
      }

      return data
    } else {
      // Em desenvolvimento, chama API diretamente (apenas para teste)
      const payload = {
        amount: amount,
        currency: 'BRL',
        paymentMethod: 'pix',
        items: items.map(item => ({
          title: item.title,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          tangible: false
        })),
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone.replace(/\D/g, ''),
          document: {
            number: customer.document.number.replace(/\D/g, ''),
            type: customer.document.type || 'cpf'
          }
        },
        pix: {
          expiresInDays: 1
        },
        metadata: `Pedido ${orderId} - Motors Personalizados`,
        externalRef: orderId || `ORDER-${Date.now()}`
      }

      response = await fetch(BLACKCAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BLACKCAT_SECRET_KEY
        },
        body: JSON.stringify(payload)
      })

      data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Erro ao criar pagamento')
      }

      // Normalizar resposta
      const qrCodeBase64Raw = data.data?.paymentData?.qrCodeBase64 || ''
      const qrCodeBase64 = qrCodeBase64Raw && !qrCodeBase64Raw.startsWith('data:')
        ? `data:image/png;base64,${qrCodeBase64Raw}`
        : qrCodeBase64Raw

      return {
        success: true,
        transactionId: data.data?.transactionId,
        status: data.data?.status,
        amount: data.data?.amount,
        qrCode: data.data?.paymentData?.qrCode,
        qrCodeBase64: qrCodeBase64,
        copyPaste: data.data?.paymentData?.copyPaste,
        expiresAt: data.data?.paymentData?.expiresAt,
        invoiceUrl: data.data?.invoiceUrl
      }
    }

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
