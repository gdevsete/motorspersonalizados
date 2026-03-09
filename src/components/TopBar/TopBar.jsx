/**
 * TopBar - Barra promocional no topo do site
 * Exibe mensagem de frete grátis e gatilhos de urgência
 */

import { useState, useEffect } from 'react'
import { FiTruck, FiShield, FiClock } from 'react-icons/fi'

const TopBar = () => {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [purchaseCount, setPurchaseCount] = useState(0)

  // Mensagens rotativas
  const messages = [
    { icon: FiTruck, text: '🚚 FRETE GRÁTIS para todo Brasil!', highlight: 'FRETE GRÁTIS' },
    { icon: FiShield, text: '✅ Garantia de 7 dias ou seu dinheiro de volta', highlight: '7 dias' },
    { icon: FiClock, text: `🔥 ${purchaseCount} pessoas compraram nas últimas 24h`, highlight: `${purchaseCount} pessoas` },
  ]

  // Gerar número de compras "realista" entre 12-47
  useEffect(() => {
    const baseCount = 12
    const randomAdd = Math.floor(Math.random() * 35)
    setPurchaseCount(baseCount + randomAdd)
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
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#ff1e1e] to-[#ff4444] text-white py-2 px-4">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-2 text-sm font-medium animate-fadeIn" key={currentMessage}>
          <CurrentIcon className="w-4 h-4" />
          <span>{messages[currentMessage].text}</span>
        </div>
      </div>
    </div>
  )
}

export default TopBar
