/**
 * ChatWidget - Chat de suporte profissional integrado ao site
 * Com indicador de digitação em tempo real
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  FiMessageCircle, FiX, FiSend, FiUser, 
  FiHeadphones, FiMinimize2, FiCheck, FiArrowLeft
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
  const [showWelcome, setShowWelcome] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Mostrar popup de boas-vindas após 2 segundos
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('chatWelcomeSeen')
    if (!hasSeenWelcome && !isOpen) {
      const timer = setTimeout(() => {
        setShowWelcome(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Fechar popup de boas-vindas
  const dismissWelcome = () => {
    setShowWelcome(false)
    sessionStorage.setItem('chatWelcomeSeen', 'true')
  }

  // Scroll para última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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
      setHasUnread(false)
    } catch (error) {
      console.error('Erro ao iniciar chat:', error)
    } finally {
      setLoading(false)
    }
  }

  // Subscrever a novas mensagens e status de digitação
  useEffect(() => {
    if (!conversation) return

    const unsubscribe = subscribeToMessages(conversation.id, (newMsg) => {
      // Ignorar mensagens do próprio usuário (já foram adicionadas localmente)
      if (newMsg.is_from_user) return
      
      setMessages(prev => {
        // Evitar duplicatas
        if (prev.some(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      // Se mensagem é do admin e chat está fechado, mostrar notificação
      if (!isOpen) {
        setHasUnread(true)
      }
      setAdminTyping(false)
    })

    // Subscrever a status de digitação
    const typingChannel = supabase
      .channel(`typing:${conversation.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.is_admin) {
          setAdminTyping(true)
          // Limpar após 3 segundos
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000)
        }
      })
      .subscribe()

    return () => {
      unsubscribe()
      typingChannel.unsubscribe()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [conversation, isOpen])

  // Enviar status de digitação
  const handleTyping = useCallback(() => {
    if (!conversation) return
    
    supabase.channel(`typing:${conversation.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { is_admin: false, is_typing: true }
    })
  }, [conversation])

  // Abrir chat
  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
    dismissWelcome()
    if (!conversation) {
      initConversation()
    }
    // Focar no input após abrir
    setTimeout(() => inputRef.current?.focus(), 300)
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
      created_at: new Date().toISOString(),
      sending: true
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const sentMsg = await sendMessage(conversation.id, content, true)
      // Substituir mensagem temporária pela real
      setMessages(prev => prev.map(m => 
        m.id === tempMsg.id ? { ...sentMsg, sending: false } : m
      ))
    } catch (error) {
      console.error('Erro ao enviar:', error)
      // Marcar como erro e permitir reenvio
      setMessages(prev => prev.map(m => 
        m.id === tempMsg.id ? { ...m, error: true, sending: false, content } : m
      ))
      // Não restaurar o texto automaticamente - deixar o usuário decidir
    } finally {
      setSending(false)
    }
  }

  // Reenviar mensagem com erro
  const handleRetry = async (msgId, content) => {
    // Marcar como enviando novamente
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, error: false, sending: true } : m
    ))

    try {
      const sentMsg = await sendMessage(conversation.id, content, true)
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...sentMsg, sending: false } : m
      ))
    } catch (error) {
      console.error('Erro ao reenviar:', error)
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, error: true, sending: false } : m
      ))
    }
  }

  // Formatar hora
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formatar data
  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Hoje'
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  // Agrupar mensagens por data
  const groupMessagesByDate = (msgs) => {
    const groups = {}
    msgs.forEach(msg => {
      const date = formatDate(msg.created_at)
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <>
      {/* Popup de boas-vindas */}
      {showWelcome && !isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-50 animate-slideUp">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 shadow-2xl max-w-[280px] relative">
            {/* Seta apontando para o botão */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#1a1a1a] border-r border-b border-[#2a2a2a] transform rotate-45"></div>
            
            {/* Botão fechar */}
            <button
              onClick={dismissWelcome}
              className="absolute top-2 right-2 p-1 hover:bg-[#2a2a2a] rounded-full transition-colors"
            >
              <FiX className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* Conteúdo */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-full flex items-center justify-center shrink-0">
                <FiHeadphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium mb-1">Precisa de ajuda? 👋</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Clique no ícone ao lado para falar com nosso suporte em tempo real!
                </p>
              </div>
            </div>
            
            {/* Botão de ação */}
            <button
              onClick={() => {
                dismissWelcome()
                handleOpen()
              }}
              className="w-full mt-3 py-2 bg-[#ff1e1e] hover:bg-[#cc0000] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Iniciar conversa
            </button>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group"
          aria-label="Abrir chat de suporte"
        >
          {/* Pulse effect */}
          <span className="absolute inset-0 rounded-full bg-[#ff1e1e] animate-ping opacity-30"></span>
          
          {/* Botão principal */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 border-2 border-white/20">
            <FiMessageCircle className="w-7 h-7 text-white" />
            
            {/* Badge de nova mensagem */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-bounce shadow-lg">
                !
              </span>
            )}
          </div>
          
          {/* Tooltip */}
          <span className="absolute right-20 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-[#2a2a2a]">
            💬 Fale conosco
          </span>
        </button>
      )}

      {/* Janela de chat */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[360px] h-[100dvh] sm:h-[480px] bg-[#0a0a0a] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-[#2a2a2a] animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff1e1e] to-[#cc0000] p-3 sm:p-4 safe-area-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botão voltar - apenas mobile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FiHeadphones className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#ff1e1e]"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Suporte</h3>
                  <p className="text-[10px] sm:text-xs text-white/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Online agora
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Minimizar"
                >
                  <FiMinimize2 className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Fechar"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0a0a0a] to-[#111111]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="relative">
                  <div className="w-12 h-12 border-3 border-[#ff1e1e] border-t-transparent rounded-full animate-spin"></div>
                  <FiMessageCircle className="w-5 h-5 text-[#ff1e1e] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-gray-400 text-sm">Conectando...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-6 sm:py-8 px-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiMessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#ff1e1e]" />
                </div>
                <h4 className="font-bold text-white text-base sm:text-lg mb-2">Olá! 👋</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Bem-vindo ao suporte<br />
                  <span className="text-[#ff1e1e] font-medium">Motors Personalizados</span>
                </p>
                <p className="text-gray-500 text-xs mt-2 sm:mt-3">
                  Envie sua mensagem e responderemos<br />o mais rápido possível!
                </p>
                
                {/* Quick actions */}
                <div className="mt-4 sm:mt-6 space-y-2 max-w-xs mx-auto">
                  <p className="text-xs text-gray-500 mb-2">Perguntas frequentes:</p>
                  {['Prazo de entrega?', 'Formas de pagamento?', 'Rastrear pedido'].map((question) => (
                    <button
                      key={question}
                      onClick={() => setNewMessage(question)}
                      className="block w-full text-left px-3 sm:px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-sm text-gray-300 transition-colors border border-[#2a2a2a] hover:border-[#ff1e1e]/50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {Object.entries(messageGroups).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Separador de data */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#2a2a2a]"></div>
                      <span className="text-xs text-gray-500 bg-[#0a0a0a] px-3 py-1 rounded-full">
                        {date}
                      </span>
                      <div className="flex-1 h-px bg-[#2a2a2a]"></div>
                    </div>

                    {/* Mensagens do dia */}
                    {msgs.map((msg, index) => (
                      <div
                        key={msg.id || index}
                        className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'} mb-3 animate-fadeIn`}
                      >
                        {/* Avatar do suporte */}
                        {!msg.is_from_user && (
                          <div className="w-8 h-8 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                            <FiHeadphones className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className={`max-w-[75%] ${msg.is_from_user ? 'order-1' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-md ${
                              msg.is_from_user
                                ? 'bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] text-white rounded-br-md'
                                : 'bg-[#1a1a1a] text-white rounded-bl-md border border-[#2a2a2a]'
                            } ${msg.error ? 'opacity-60' : ''}`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1 ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-gray-500">
                              {formatTime(msg.created_at)}
                            </span>
                            {msg.is_from_user && (
                              <>
                                {msg.sending ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : msg.error ? (
                                  <button 
                                    onClick={() => handleRetry(msg.id, msg.content)}
                                    className="text-[10px] text-red-400 hover:text-red-300 underline"
                                  >
                                    Erro - Toque para reenviar
                                  </button>
                                ) : (
                                  <FiCheck className="w-3 h-3 text-green-400" />
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Avatar do usuário */}
                        {msg.is_from_user && (
                          <div className="w-8 h-8 bg-gradient-to-br from-[#2a2a2a] to-[#3a3a3a] rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                            <FiUser className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Indicador de digitação do admin */}
                {adminTyping && (
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-full flex items-center justify-center">
                      <FiHeadphones className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-md px-4 py-3 border border-[#2a2a2a]">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">Suporte digitando...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-[#2a2a2a] bg-[#0a0a0a] safe-area-bottom">
            <div className="flex gap-2 items-end">
              <div className="flex-1 min-w-0">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(e)
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff1e1e] focus:ring-1 focus:ring-[#ff1e1e]/50 transition-all resize-none text-sm"
                  style={{ maxHeight: '80px', minHeight: '42px', overflowY: 'auto', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  disabled={loading || sending}
                  onInput={(e) => {
                    e.target.style.height = '42px'
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || loading || sending}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#ff1e1e]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0"
              >
                {sending ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiSend className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>
            </div>
            
            {/* Footer info - escondido no mobile */}
            <div className="hidden sm:flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-600">
                Pressione Enter para enviar
              </p>
              {!user && (
                <a href="/login" className="text-[10px] text-[#ff1e1e] hover:underline">
                  Faça login para salvar o histórico
                </a>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Estilos de animação */}
      <style>{`
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        @media (max-width: 640px) {
          .safe-area-bottom {
            padding-bottom: max(env(safe-area-inset-bottom, 0), 8px);
          }
        }
      `}</style>
    </>
  )
}

export default ChatWidget
