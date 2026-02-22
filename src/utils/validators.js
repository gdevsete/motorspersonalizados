/**
 * Utilitários de validação
 */

/**
 * Validar email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validar telefone brasileiro
 */
export const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

/**
 * Validar senha (mínimo 6 caracteres)
 */
export const isValidPassword = (password) => {
  return password.length >= 6
}

/**
 * Validar se campo não está vazio
 */
export const isNotEmpty = (value) => {
  return value && value.trim().length > 0
}

/**
 * Validar cor hexadecimal
 */
export const isValidHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}
