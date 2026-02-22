/**
 * ChatWidget - Chat de suporte integrado ao site
 */

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  FiMessageCircle, FiX, FiSend, FiUser, 
  FiHeadphones, FiMinimize2 
} from 'react-icons/fi'
import {
  getOrCreateConversation,
  getOrCreateGuestConversation,
  sendMessage,
  getMessages,
  subscribeToMessages
} from '../../services/chatService'

const ChatWidget = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Inicializar conversa quando abrir o chat
  const initConversation = async () => {
    setLoading(true)
    try {
      let conv
      if (user) {
        conv = await getOrCreateConversation(
          user.id,
          user.email,
          user.user_metadata?.nome || user.email
        )
      } else {
        conv = await getOrCreateGuestConversation()
      }
      setConversation(conv)

      // Carregar mensagens existentes
      const msgs = await getMessages(conv.id)
      setMessages(msgs)
    } catch (error) {
      console.error('Erro ao iniciar chat:', error)
    } finally {
      setLoading(false)
    }
  }

  // Subscrever a novas mensagens
  useEffect(() => {
    if (!conversation) return

    const unsubscribe = subscribeToMessages(conversation.id, (newMsg) => {
      setMessages(prev => [...prev, newMsg])
    })

    return () => unsubscribe()
  }, [conversation])

  // Abrir chat
  const handleOpen = () => {
    setIsOpen(true)
    if (!conversation) {
      initConversation()
    }
  }

  // Enviar mensagem
  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation || sending) return

    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Adicionar mensagem localmente para feedback imediato
    const tempMsg = {
      id: `temp_${Date.now()}`,
      content,
      is_from_user: true,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      await sendMessage(conversation.id, content, true)
    } catch (error) {
      console.error('Erro ao enviar:', error)
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  // Formatar hora
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-[#ff1e1e] to-[#ff4444] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
          aria-label="Abrir chat de suporte"
        >
          <FiMessageCircle className="w-6 h-6 text-white" />
          
          {/* Badge de nova mensagem */}
          {messages.some(m => !m.is_from_user && !m.read) && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
              !
            </span>
          )}
          
          {/* Tooltip */}
          <span className="absolute right-16 bg-[#1a1a1a] text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Fale conosco
          </span>
        </button>
      )}

      {/* Janela de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-[#0a0a0a] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#2a2a2a] animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff1e1e] to-[#ff4444] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FiHeadphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Suporte</h3>
                <p className="text-xs text-white/80">Motors Personalizados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiMinimize2 className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-2 border-[#ff1e1e] border-t-transparent rounded-full"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-white mb-2">Olá! 👋</h4>
                <p className="text-sm text-gray-400">
                  Como podemos te ajudar hoje?<br />
                  Envie sua mensagem abaixo.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.is_from_user
                          ? 'bg-[#ff1e1e] text-white rounded-br-sm'
                          : 'bg-[#1a1a1a] text-white rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className={`text-xs mt-1 block ${
                        msg.is_from_user ? 'text-white/60' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-[#2a2a2a] bg-[#0a0a0a]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff1e1e] transition-colors"
                disabled={loading || sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || loading || sending}
                className="w-12 h-12 bg-[#ff1e1e] rounded-lg flex items-center justify-center hover:bg-[#ff3333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <FiSend className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            {!user && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                <a href="/login" className="text-[#ff1e1e] hover:underline">Faça login</a> para salvar seu histórico
              </p>
            )}
          </form>
        </div>
      )}

      {/* Estilos de animação */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default ChatWidget
