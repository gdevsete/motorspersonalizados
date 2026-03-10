/**
 * TopBar - Barra promocional no topo do site
 * Exibe mensagem de frete grátis e gatilhos de urgência
 */

import { useState, useEffect } from 'react'
import { FiTruck, FiShield, FiClock } from 'react-icons/fi'

const TopBar = () => {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [purchaseCount, setPurchaseCount] = useState(27)

  // Mensagens rotativas
  const messages = [
    { icon: FiTruck, text: '🚚 FRETE GRÁTIS para todo Brasil!', highlight: 'FRETE GRÁTIS' },
    { icon: FiShield, text: '✅ Garantia de 7 dias ou seu dinheiro de volta', highlight: '7 dias' },
    { icon: FiClock, text: `🔥 ${purchaseCount} pessoas compraram nas últimas 24h`, highlight: `${purchaseCount} pessoas` },
  ]

  // Número dinâmico de compras - varia entre 23-47
  useEffect(() => {
    // Valor inicial aleatório
    const initial = 23 + Math.floor(Math.random() * 20)
    setPurchaseCount(initial)

    // Atualizar a cada 3-7 segundos
    const interval = setInterval(() => {
      setPurchaseCount(prev => {
        // 60% chance de aumentar, 40% de diminuir
        const change = Math.random() > 0.4 ? 1 : -1
        const newValue = prev + change
        // Manter entre 23 e 47
        if (newValue < 23) return 24
        if (newValue > 47) return 46
        return newValue
      })
    }, 3000 + Math.random() * 4000)

    return () => clearInterval(interval)
  }, [])

  // Rotacionar mensagens a cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [messages.length])

  const CurrentIcon = messages[currentMessage].icon

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#ff1e1e] to-[#ff4444] text-white py-1.5 px-2 sm:px-4">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-medium animate-fadeIn" key={currentMessage}>
          <CurrentIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-center leading-tight">{messages[currentMessage].text}</span>
        </div>
      </div>
    </div>
  )
}

export default TopBar
