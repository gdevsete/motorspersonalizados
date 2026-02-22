/**
 * useLocalStorage Hook
 * Persiste estado no localStorage com sincronização
 */

import { useState, useEffect } from 'react'

export const useLocalStorage = (key, initialValue) => {
  // Obter valor inicial do storage ou usar initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Atualizar localStorage quando valor muda
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

export default useLocalStorage
