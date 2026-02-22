/**
 * Utilitário para buscar endereço por CEP
 * Usa a API ViaCEP (gratuita)
 */

/**
 * Formata CEP para o padrão XXXXX-XXX
 */
export const formatarCEP = (valor) => {
  const numeros = valor.replace(/\D/g, '').slice(0, 8)
  
  if (numeros.length <= 5) return numeros
  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`
}

/**
 * Valida se o CEP está completo
 */
export const validarCEP = (cep) => {
  const numeros = cep.replace(/\D/g, '')
  return numeros.length === 8
}

/**
 * Busca endereço pelo CEP usando API ViaCEP
 * @param {string} cep - CEP a ser buscado
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const buscarCEP = async (cep) => {
  const cepLimpo = cep.replace(/\D/g, '')
  
  if (cepLimpo.length !== 8) {
    return { success: false, error: 'CEP inválido' }
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      return { success: false, error: 'CEP não encontrado' }
    }
    
    return {
      success: true,
      data: {
        cep: data.cep,
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return { success: false, error: 'Erro ao buscar CEP. Tente novamente.' }
  }
}
