/**
 * Meta Pixel (Facebook Pixel) - Helper Functions
 * ID: 1430145101936995
 */

/**
 * Verifica se o fbq está disponível
 */
const isFbqAvailable = () => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function'
}

/**
 * Rastreia um evento customizado do Meta Pixel
 * @param {string} eventName - Nome do evento
 * @param {object} params - Parâmetros adicionais
 */
export const trackEvent = (eventName, params = {}) => {
  if (isFbqAvailable()) {
    window.fbq('track', eventName, params)
  }
}

/**
 * Rastreia evento de visualização de conteúdo
 * @param {object} params - { content_name, content_category, content_ids, content_type, value, currency }
 */
export const trackViewContent = (params) => {
  trackEvent('ViewContent', {
    currency: 'BRL',
    ...params
  })
}

/**
 * Rastreia evento de adicionar ao carrinho
 * @param {object} params - { content_name, content_ids, content_type, value, currency }
 */
export const trackAddToCart = (params) => {
  trackEvent('AddToCart', {
    currency: 'BRL',
    ...params
  })
}

/**
 * Rastreia evento de início do checkout
 * @param {object} params - { content_name, content_ids, content_type, value, currency, num_items }
 */
export const trackInitiateCheckout = (params) => {
  trackEvent('InitiateCheckout', {
    currency: 'BRL',
    ...params
  })
}

/**
 * Rastreia evento de adicionar informações de pagamento
 * @param {object} params - { content_category, content_ids, contents, currency, value }
 */
export const trackAddPaymentInfo = (params) => {
  trackEvent('AddPaymentInfo', {
    currency: 'BRL',
    ...params
  })
}

/**
 * Rastreia evento de compra concluída
 * @param {object} params - { content_name, content_ids, content_type, value, currency, num_items }
 */
export const trackPurchase = (params) => {
  trackEvent('Purchase', {
    currency: 'BRL',
    ...params
  })
}

/**
 * Rastreia evento de lead (cadastro ou interesse)
 * @param {object} params - { content_name, content_category, value, currency }
 */
export const trackLead = (params) => {
  trackEvent('Lead', {
    currency: 'BRL',
    ...params
  })
}

/**
 * Rastreia evento de registro completo
 * @param {object} params - { content_name, status }
 */
export const trackCompleteRegistration = (params) => {
  trackEvent('CompleteRegistration', params)
}
