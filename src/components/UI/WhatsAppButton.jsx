/**
 * WhatsApp Button Component
 * Botão flutuante para contato via WhatsApp
 */

import { FaWhatsapp } from 'react-icons/fa'
import { WHATSAPP_NUMBER } from '../../utils/constants'

const WhatsAppButton = () => {
  const message = encodeURIComponent(
    'Olá! Vim do site Motors Personalizados e gostaria de saber mais sobre os chaveiros personalizados.'
  )
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Contato via WhatsApp"
    >
      <FaWhatsapp className="w-6 h-6" />
    </a>
  )
}

export default WhatsAppButton
