/**
 * Admin Page - Painel Administrativo Simplificado
 * Gerencia pedidos, clientes e visitantes online
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/UI'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, ORDER_STATUS } from '../../utils'
import { 
  FiPackage, FiUsers, FiActivity, FiEye, FiTrash2, 
  FiRefreshCw, FiCalendar, FiX, FiPlus,
  FiUser, FiMapPin, FiImage, FiMessageCircle, FiSend, FiCheck, FiTruck, FiCopy
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import {
  getAllConversations,
  getMessages,
  sendMessage,
  markAsRead,
  closeConversation,
  subscribeToConversations
} from '../../services/chatService'

// Emails de administradores (via variável de ambiente)
// Configure no Vercel: VITE_ADMIN_EMAILS=email1@x.com,email2@x.com
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'gordao@gmail.com')
  .toLowerCase()
  .split(',')
  .map(email => email.trim())
  .filter(Boolean)

const Admin = () => {
  const { user, loading: authLoading } = useAuth()
  
  // Verificar se é admin
  const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase())

  // Estados
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [visitors, setVisitors] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingVisitors, setLoadingVisitors] = useState(true)
  
  // Chat states
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newReply, setNewReply] = useState('')
  const [loadingChat, setLoadingChat] = useState(true)
  const [sendingReply, setSendingReply] = useState(false)
  const [userTyping, setUserTyping] = useState(false)
  const typingTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)
  
  // Modal de pedido
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  
  // Estados de rastreio
  const [codigoRastreio, setCodigoRastreio] = useState('')
  const [transportadora, setTransportadora] = useState('correios')
  const [savingRastreio, setSavingRastreio] = useState(false)
  
  // Estados de atualizações de rastreio
  const [rastreioAtualizacoes, setRastreioAtualizacoes] = useState([])
  const [novaAtualizacao, setNovaAtualizacao] = useState({
    status: '',
    descricao: '',
    local: ''
  })
  const [savingAtualizacao, setSavingAtualizacao] = useState(false)

  // Status pré-definidos para atualizações
  const STATUS_RASTREIO = [
    'Pedido Recebido',
    'Pagamento Confirmado',
    'Em Produção',
    'Objeto Postado',
    'Objeto em Trânsito',
    'Saiu para Entrega',
    'Objeto Entregue',
    'Tentativa de Entrega',
    'Aguardando Retirada'
  ]

  // Gerar código de rastreio automático
  const gerarCodigoRastreio = () => {
    const prefixo = transportadora === 'correios' ? 'BR' : 'JD'
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const codigo = `${prefixo}${timestamp}${random}`
    setCodigoRastreio(codigo)
    return codigo
  }

  // Salvar dados de rastreio
  const handleSalvarRastreio = async () => {
    if (!selectedOrder || !codigoRastreio.trim()) {
      toast.error('Informe o código de rastreio')
      return
    }

    setSavingRastreio(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          codigo_rastreio: codigoRastreio.trim(),
          transportadora: transportadora,
          status: 'enviado' // Atualiza para enviado automaticamente
        })
        .eq('id', selectedOrder.id)

      if (error) throw error
      
      toast.success('Rastreio salvo com sucesso!')
      
      // Atualizar estado local
      setSelectedOrder(prev => ({ 
        ...prev, 
        codigo_rastreio: codigoRastreio.trim(),
        transportadora: transportadora,
        status: 'enviado'
      }))
      
      loadOrders()
    } catch (error) {
      console.error('Erro ao salvar rastreio:', error)
      toast.error('Erro ao salvar rastreio')
    } finally {
      setSavingRastreio(false)
    }
  }

  // Copiar código de rastreio
  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoRastreio)
    toast.success('Código copiado!')
  }

  // Adicionar nova atualização de rastreio
  const handleAdicionarAtualizacao = async () => {
    if (!novaAtualizacao.status || !novaAtualizacao.descricao) {
      toast.error('Preencha o status e descrição')
      return
    }

    setSavingAtualizacao(true)
    try {
      const atualizacao = {
        status: novaAtualizacao.status,
        descricao: novaAtualizacao.descricao,
        local: novaAtualizacao.local || 'Sapiranga/RS',
        data: new Date().toISOString()
      }

      // Adicionar no início do array (mais recente primeiro)
      const novasAtualizacoes = [atualizacao, ...rastreioAtualizacoes]

      const { error } = await supabase
        .from('orders')
        .update({ rastreio_atualizacoes: novasAtualizacoes })
        .eq('id', selectedOrder.id)

      if (error) throw error

      setRastreioAtualizacoes(novasAtualizacoes)
      setSelectedOrder(prev => ({ ...prev, rastreio_atualizacoes: novasAtualizacoes }))
      setNovaAtualizacao({ status: '', descricao: '', local: '' })
      toast.success('Atualização adicionada!')
      loadOrders()
    } catch (error) {
      console.error('Erro ao adicionar atualização:', error)
      toast.error('Erro ao adicionar atualização')
    } finally {
      setSavingAtualizacao(false)
    }
  }

  // Remover atualização
  const handleRemoverAtualizacao = async (index) => {
    if (!confirm('Remover esta atualização?')) return

    try {
      const novasAtualizacoes = rastreioAtualizacoes.filter((_, i) => i !== index)
      
      const { error } = await supabase
        .from('orders')
        .update({ rastreio_atualizacoes: novasAtualizacoes })
        .eq('id', selectedOrder.id)

      if (error) throw error

      setRastreioAtualizacoes(novasAtualizacoes)
      setSelectedOrder(prev => ({ ...prev, rastreio_atualizacoes: novasAtualizacoes }))
      toast.success('Atualização removida!')
      loadOrders()
    } catch (error) {
      console.error('Erro ao remover atualização:', error)
      toast.error('Erro ao remover atualização')
    }
  }

  // Atualizar campos quando selecionar pedido
  useEffect(() => {
    if (selectedOrder) {
      setCodigoRastreio(selectedOrder.codigo_rastreio || '')
      setTransportadora(selectedOrder.transportadora || 'correios')
      setRastreioAtualizacoes(selectedOrder.rastreio_atualizacoes || [])
      setNovaAtualizacao({ status: '', descricao: '', local: '' })
    }
  }, [selectedOrder])

  // Carregar pedidos
  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoadingOrders(false)
    }
  }

  // Carregar visitantes online (dos últimos 5 minutos)
  const loadVisitors = async () => {
    setLoadingVisitors(true)
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .gte('last_seen', fiveMinutesAgo)
        .order('last_seen', { ascending: false })

      if (error) {
        // Se tabela não existe, retornar vazio
        if (error.code === '42P01') {
          setVisitors([])
          return
        }
        throw error
      }
      setVisitors(data || [])
    } catch (error) {
      console.error('Erro ao carregar visitantes:', error)
      setVisitors([])
    } finally {
      setLoadingVisitors(false)
    }
  }

  // Carregar usuários cadastrados
  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .rpc('get_all_users')

      if (error) {
        // Se função não existe, tentar alternativa
        if (error.code === '42883') {
          console.log('Função get_all_users não existe, usando fallback')
          // Fallback: buscar emails únicos dos pedidos
          const { data: ordersData } = await supabase
            .from('orders')
            .select('email, nome_cliente, created_at')
            .order('created_at', { ascending: false })
          
          if (ordersData) {
            // Agrupar por email único
            const uniqueUsers = ordersData.reduce((acc, order) => {
              if (order.email && !acc.find(u => u.email === order.email)) {
                acc.push({
                  email: order.email,
                  nome: order.nome_cliente,
                  created_at: order.created_at
                })
              }
              return acc
            }, [])
            setUsers(uniqueUsers)
          }
          return
        }
        throw error
      }
      
      // Mapear dados da função RPC
      setUsers(data?.map(u => ({
        id: u.id,
        email: u.email,
        nome: u.raw_user_meta_data?.nome || 'N/A',
        created_at: u.created_at
      })) || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  // Carregar conversas de chat
  const loadConversations = async () => {
    setLoadingChat(true)
    try {
      const data = await getAllConversations()
      setConversations(data || [])
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      setConversations([])
    } finally {
      setLoadingChat(false)
    }
  }

  // Selecionar conversa
  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv)
    setUserTyping(false)
    try {
      const msgs = await getMessages(conv.id)
      setChatMessages(msgs)
      await markAsRead(conv.id)
      // Atualizar lista de conversas
      setConversations(prev => 
        prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      )
      // Scroll para última mensagem
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // Enviar status de digitação do admin
  const handleAdminTyping = useCallback(() => {
    if (!selectedConversation) return
    
    supabase.channel(`typing:${selectedConversation.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { is_admin: true, is_typing: true }
    })
  }, [selectedConversation])

  // Subscrever ao canal de digitação quando conversa é selecionada
  useEffect(() => {
    if (!selectedConversation) return

    const typingChannel = supabase
      .channel(`typing:${selectedConversation.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload.is_admin) {
          setUserTyping(true)
          // Limpar após 3 segundos
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setUserTyping(false), 3000)
        }
      })
      .subscribe()

    return () => {
      typingChannel.unsubscribe()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [selectedConversation])

  // Enviar resposta
  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!newReply.trim() || !selectedConversation || sendingReply) return

    setSendingReply(true)
    try {
      const msg = await sendMessage(selectedConversation.id, newReply.trim(), false)
      setChatMessages(prev => [...prev, msg])
      setNewReply('')
      // Scroll para última mensagem
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (error) {
      console.error('Erro ao enviar:', error)
      toast.error('Erro ao enviar resposta')
    } finally {
      setSendingReply(false)
    }
  }

  // Fechar conversa
  const handleCloseConversation = async (convId) => {
    if (!confirm('Fechar esta conversa?')) return
    try {
      await closeConversation(convId)
      loadConversations()
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null)
        setChatMessages([])
      }
      toast.success('Conversa fechada')
    } catch (error) {
      toast.error('Erro ao fechar conversa')
    }
  }

  // Atualizar status do pedido
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      
      toast.success('Status atualizado!')
      loadOrders()
      
      // Atualizar modal se aberto
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  // Deletar pedido/cliente
  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return
    
    try {
      console.log('Deletando pedido:', orderId)
      
      const { error, count } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .select()

      console.log('Resultado delete:', { error, count })

      if (error) {
        console.error('Erro Supabase:', error)
        throw error
      }
      
      // Remover da lista local imediatamente
      setOrders(prev => prev.filter(o => o.id !== orderId))
      
      toast.success('Pedido excluído!')
      setShowOrderModal(false)
    } catch (error) {
      console.error('Erro ao excluir pedido:', error)
      toast.error(`Erro ao excluir: ${error.message || 'Sem permissão'}`)
    }
  }

  // Deletar usuário completamente (auth + pedidos)
  const handleDeleteUser = async (userEmail) => {
    if (!userEmail) {
      toast.error('Email do usuário não encontrado')
      return
    }
    
    if (!confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${userEmail} e todos os seus pedidos? Esta ação não pode ser desfeita!`)) return
    
    try {
      console.log('Deletando usuário:', userEmail)
      
      const { error } = await supabase
        .rpc('delete_user_completely', { user_email: userEmail })

      if (error) {
        console.error('Erro Supabase:', error)
        throw error
      }
      
      // Remover pedidos do usuário da lista local
      setOrders(prev => prev.filter(o => o.email !== userEmail))
      // Remover usuário da lista local
      setUsers(prev => prev.filter(u => u.email !== userEmail))
      
      toast.success('Usuário e pedidos excluídos permanentemente!')
      setShowOrderModal(false)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast.error(`Erro ao excluir usuário: ${error.message || 'Verifique se a função foi criada no Supabase'}`)
    }
  }

  // Carregar dados ao montar
  useEffect(() => {
    if (isAdmin) {
      loadOrders()
      loadUsers()
      loadVisitors()
      loadConversations()
      
      // Atualizar visitantes a cada 30 segundos
      const visitorInterval = setInterval(loadVisitors, 30000)
      
      // Subscrever a novas conversas em tempo real
      const unsubscribeChat = subscribeToConversations(() => {
        loadConversations()
      })
      
      return () => {
        clearInterval(visitorInterval)
        unsubscribeChat()
      }
    }
  }, [isAdmin])

  // Loading da autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Não é admin - redirecionar
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  // Abrir modal de pedido
  const openOrderModal = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Painel <span className="text-gradient">Admin</span>
            </h1>
            <p className="text-gray-400">Gerencie pedidos e veja visitantes online</p>
          </div>
          <button
            onClick={() => {
              loadOrders()
              loadUsers()
              loadVisitors()
              loadConversations()
              toast.success('Dados atualizados!')
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white transition-all"
          >
            <FiRefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Cards Grid */}
        <div className="space-y-6">
          
          {/* Card: Pedidos */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiPackage className="text-[#ff1e1e]" />
              Pedidos ({orders.length})
            </h2>

            {loadingOrders ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FiPackage className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] text-left">
                      <th className="pb-3 text-gray-400 font-medium">Cliente</th>
                      <th className="pb-3 text-gray-400 font-medium">Moto</th>
                      <th className="pb-3 text-gray-400 font-medium">Valor</th>
                      <th className="pb-3 text-gray-400 font-medium">Status</th>
                      <th className="pb-3 text-gray-400 font-medium">Data</th>
                      <th className="pb-3 text-gray-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                        <td className="py-4">
                          <div className="font-medium">{order.nome_cliente || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{order.email || 'N/A'}</div>
                        </td>
                        <td className="py-4">
                          <div>{order.modelo_moto || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{order.placa_personalizada || ''}</div>
                        </td>
                        <td className="py-4 font-medium text-green-500">
                          {formatCurrency(order.valor_total || 0)}
                        </td>
                        <td className="py-4">
                          <select
                            value={order.status || 'pendente'}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer
                              ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}
                          >
                            {Object.entries(ORDER_STATUS).map(([key, value]) => (
                              <option key={key} value={value}>{STATUS_LABELS[value]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 text-gray-400 text-sm">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openOrderModal(order)}
                              className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#ff1e1e] transition-colors"
                              title="Ver detalhes"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-red-600 transition-colors"
                              title="Excluir"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Usuários */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiUsers className="text-[#ff1e1e]" />
              Usuários Cadastrados ({users.length})
            </h2>

            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FiUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] text-left">
                      <th className="pb-3 text-gray-400 font-medium">Nome</th>
                      <th className="pb-3 text-gray-400 font-medium">Email</th>
                      <th className="pb-3 text-gray-400 font-medium">Cadastro</th>
                      <th className="pb-3 text-gray-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, index) => (
                      <tr key={u.id || index} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/50">
                        <td className="py-4">
                          <div className="font-medium flex items-center gap-2">
                            <FiUser className="w-4 h-4 text-gray-400" />
                            {u.nome || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 text-gray-300">{u.email}</td>
                        <td className="py-4 text-gray-400 text-sm">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-red-600 transition-colors"
                            title="Excluir usuário"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Online */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiActivity className="text-green-500" />
              Visitantes Online ({visitors.length})
            </h2>

            {loadingVisitors ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FiUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum visitante online no momento</p>
                <p className="text-sm mt-2">Os visitantes aparecem aqui em tempo real</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitors.map(visitor => (
                  <div key={visitor.id} className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {visitor.is_authenticated ? (
                          <>
                            <FiUser className="w-4 h-4 text-[#ff1e1e]" />
                            <span className="font-medium">{visitor.user_name || visitor.user_email || 'Usuário logado'}</span>
                          </>
                        ) : (
                          <>
                            <FiUser className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Visitante anônimo</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Página: {visitor.current_page || '/'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(visitor.last_seen).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Chat de Suporte */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiMessageCircle className="text-[#ff1e1e]" />
              Chat de Suporte ({conversations.filter(c => c.status === 'active').length})
              {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full ml-2">
                  {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)} novas
                </span>
              )}
            </h2>

            {loadingChat ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiMessageCircle className="w-10 h-10 text-gray-500" />
                </div>
                <p className="font-medium">Nenhuma conversa de suporte</p>
                <p className="text-sm mt-2 text-gray-500">As mensagens dos clientes aparecerão aqui em tempo real</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Lista de conversas */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3 px-1">
                    Conversas ({conversations.length})
                  </p>
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedConversation?.id === conv.id
                          ? 'bg-gradient-to-r from-[#ff1e1e]/20 to-[#cc0000]/10 border-[#ff1e1e] shadow-lg shadow-[#ff1e1e]/10'
                          : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] border-[#2a2a2a] hover:border-[#ff1e1e]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              conv.user_id ? 'bg-gradient-to-br from-[#ff1e1e] to-[#cc0000]' : 'bg-gradient-to-br from-[#2a2a2a] to-[#3a3a3a]'
                            }`}>
                              <FiUser className={`w-5 h-5 ${conv.user_id ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                            {conv.status === 'active' && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a1a]"></span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white block">
                              {conv.user_name || conv.user_email?.split('@')[0] || 'Visitante'}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {conv.user_id ? 'Usuário cadastrado' : 'Visitante anônimo'}
                            </span>
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="w-6 h-6 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 truncate pl-13 mb-2">
                        {conv.last_message || 'Nova conversa'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                          conv.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {conv.status === 'active' ? '● Ativo' : '○ Fechado'}
                        </span>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-gray-500">
                            {new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat ativo */}
                <div className="bg-[#0a0a0a] rounded-xl flex flex-col h-[500px] border border-[#2a2a2a]">
                  {selectedConversation ? (
                    <>
                      {/* Header do chat */}
                      <div className="p-4 border-b border-[#2a2a2a] bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] rounded-t-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#2a2a2a] to-[#3a3a3a] rounded-full flex items-center justify-center">
                                <FiUser className="w-5 h-5 text-gray-400" />
                              </div>
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a0a]"></span>
                            </div>
                            <div>
                              <span className="font-bold text-white">
                                {selectedConversation.user_name || selectedConversation.user_email || 'Visitante'}
                              </span>
                              <p className="text-xs text-gray-400">
                                {selectedConversation.user_email || selectedConversation.guest_id?.slice(0, 20) || 'Anônimo'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCloseConversation(selectedConversation.id)}
                            className="text-xs px-4 py-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors font-medium"
                          >
                            Fechar Conversa
                          </button>
                        </div>
                      </div>

                      {/* Mensagens */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0a0a0a] to-[#111111]">
                        {chatMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                            Nenhuma mensagem ainda
                          </div>
                        ) : (
                          <>
                            {chatMessages.map((msg, index) => (
                              <div
                                key={msg.id || index}
                                className={`flex ${msg.is_from_user ? 'justify-start' : 'justify-end'} animate-fadeIn`}
                              >
                                {/* Avatar do usuário (esquerda) */}
                                {msg.is_from_user && (
                                  <div className="w-8 h-8 bg-gradient-to-br from-[#2a2a2a] to-[#3a3a3a] rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                    <FiUser className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}

                                <div className={`max-w-[75%]`}>
                                  <div
                                    className={`rounded-2xl px-4 py-3 shadow-md ${
                                      msg.is_from_user
                                        ? 'bg-[#1a1a1a] text-white rounded-bl-md border border-[#2a2a2a]'
                                        : 'bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] text-white rounded-br-md'
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                  </div>
                                  <div className={`flex items-center gap-1.5 mt-1 ${msg.is_from_user ? 'justify-start' : 'justify-end'}`}>
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {!msg.is_from_user && (
                                      <FiCheck className="w-3 h-3 text-green-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Avatar admin (direita) */}
                                {!msg.is_from_user && (
                                  <div className="w-8 h-8 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                                    <span className="text-xs font-bold text-white">A</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {/* Indicador de digitação do usuário */}
                            {userTyping && (
                              <div className="flex items-center gap-2 animate-fadeIn">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#2a2a2a] to-[#3a3a3a] rounded-full flex items-center justify-center">
                                  <FiUser className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-md px-4 py-3 border border-[#2a2a2a]">
                                  <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">Cliente digitando...</span>
                              </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Input de resposta */}
                      <form onSubmit={handleSendReply} className="p-4 border-t border-[#2a2a2a] bg-[#0a0a0a]">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newReply}
                            onChange={(e) => {
                              setNewReply(e.target.value)
                              handleAdminTyping()
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendReply(e)
                              }
                            }}
                            placeholder="Digite sua resposta..."
                            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff1e1e]/50 focus:border-[#ff1e1e] transition-all"
                            disabled={sendingReply}
                          />
                          <button
                            type="submit"
                            disabled={!newReply.trim() || sendingReply}
                            className="w-12 h-12 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#ff1e1e]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingReply ? (
                              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <FiSend className="w-5 h-5 text-white" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2">Pressione Enter para enviar</p>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiMessageCircle className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="font-medium mb-1">Nenhuma conversa selecionada</p>
                        <p className="text-sm text-gray-500">Selecione uma conversa à esquerda</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal de Detalhes do Pedido */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
                <h3 className="text-xl font-bold">Detalhes do Pedido</h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <select
                    value={selectedOrder.status || 'pendente'}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className={`px-4 py-2 rounded-lg font-medium border-0 cursor-pointer
                      ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-500/20 text-gray-400'}`}
                  >
                    {Object.entries(ORDER_STATUS).map(([key, value]) => (
                      <option key={key} value={value}>{STATUS_LABELS[value]}</option>
                    ))}
                  </select>
                </div>

                {/* Cliente */}
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FiUser className="text-[#ff1e1e]" />
                    Dados do Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Nome:</span>
                      <p className="mt-1">{selectedOrder.nome_cliente || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="mt-1">{selectedOrder.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Telefone:</span>
                      <p className="mt-1">{selectedOrder.telefone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                {selectedOrder.endereco_logradouro && (
                  <div className="bg-[#0a0a0a] rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FiMapPin className="text-[#ff1e1e]" />
                      Endereço de Entrega
                    </h4>
                    <p className="text-sm">
                      {selectedOrder.endereco_logradouro}, {selectedOrder.endereco_numero}
                      {selectedOrder.endereco_complemento && ` - ${selectedOrder.endereco_complemento}`}
                      <br />
                      {selectedOrder.endereco_bairro} - {selectedOrder.endereco_cidade}/{selectedOrder.endereco_estado}
                      <br />
                      CEP: {selectedOrder.endereco_cep}
                    </p>
                  </div>
                )}

                {/* Moto */}
                <div className="bg-[#0a0a0a] rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FiPackage className="text-[#ff1e1e]" />
                    Dados da Miniatura
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Modelo da Moto:</span>
                      <p className="mt-1">{selectedOrder.modelo_moto || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Placa Personalizada:</span>
                      <p className="mt-1">{selectedOrder.placa_personalizada || 'Não'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Nome Gravado:</span>
                      <p className="mt-1">{selectedOrder.nome_gravado || 'Não'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Embalagem Premium:</span>
                      <p className="mt-1">{selectedOrder.embalagem_premium ? 'Sim' : 'Não'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Valor Total:</span>
                      <p className="mt-1 text-green-500 font-bold text-lg">{formatCurrency(selectedOrder.valor_total || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Frete */}
                {selectedOrder.frete_tipo && (
                  <div className="bg-[#0a0a0a] rounded-lg p-4">
                    <h4 className="font-medium mb-3">Frete</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Tipo:</span>
                        <p className="mt-1">{selectedOrder.frete_tipo}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Valor:</span>
                        <p className="mt-1">{formatCurrency(selectedOrder.frete_valor || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Prazo:</span>
                        <p className="mt-1">{selectedOrder.frete_prazo} dias</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Imagem de Referência */}
                {selectedOrder.foto_moto_url && (
                  <div className="bg-[#0a0a0a] rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FiImage className="text-[#ff1e1e]" />
                      Foto da Moto
                    </h4>
                    <img 
                      src={selectedOrder.foto_moto_url} 
                      alt="Foto da moto" 
                      className="w-full max-h-64 object-contain rounded-lg"
                    />
                  </div>
                )}

                {/* Observações */}
                {selectedOrder.observacoes && (
                  <div className="bg-[#0a0a0a] rounded-lg p-4">
                    <h4 className="font-medium mb-2">Observações:</h4>
                    <p className="text-sm text-gray-300">{selectedOrder.observacoes}</p>
                  </div>
                )}

                {/* Rastreio */}
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#ff1e1e]/30">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FiTruck className="text-[#ff1e1e]" />
                    Rastreio do Envio
                  </h4>
                  
                  {/* Selector de Transportadora */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">Transportadora:</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="transportadora"
                          value="correios"
                          checked={transportadora === 'correios'}
                          onChange={(e) => setTransportadora(e.target.value)}
                          className="w-4 h-4 accent-[#ff1e1e]"
                        />
                        <img 
                          src="/logo-correios.png" 
                          alt="Correios" 
                          style={{ height: '25px', width: 'auto' }}
                        />
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="transportadora"
                          value="jadlog"
                          checked={transportadora === 'jadlog'}
                          onChange={(e) => setTransportadora(e.target.value)}
                          className="w-4 h-4 accent-[#ff1e1e]"
                        />
                        <img 
                          src="/logo-jadlog.png" 
                          alt="Jadlog" 
                          style={{ height: '35px', width: 'auto' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Código de Rastreio */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">Código de Rastreio:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codigoRastreio}
                        onChange={(e) => setCodigoRastreio(e.target.value.toUpperCase())}
                        placeholder="Digite ou gere o código"
                        className="flex-1 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] focus:border-[#ff1e1e] outline-none text-white font-mono"
                      />
                      <button
                        onClick={gerarCodigoRastreio}
                        type="button"
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Gerar
                      </button>
                      {codigoRastreio && (
                        <button
                          onClick={copiarCodigo}
                          type="button"
                          className="px-3 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
                          title="Copiar código"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botão salvar */}
                  <button
                    onClick={handleSalvarRastreio}
                    disabled={savingRastreio || !codigoRastreio.trim()}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors
                      ${codigoRastreio.trim() 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 cursor-not-allowed'}`}
                  >
                    {savingRastreio ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Salvar Rastreio e Marcar como Enviado
                      </>
                    )}
                  </button>

                  {/* Status atual do rastreio */}
                  {selectedOrder.codigo_rastreio && (
                    <div className="mt-4 p-3 bg-green-900/30 border border-green-600/50 rounded-lg">
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <FiCheck className="w-4 h-4" />
                        Código cadastrado: <span className="font-mono font-bold">{selectedOrder.codigo_rastreio}</span>
                        {selectedOrder.transportadora && (
                          <span>({selectedOrder.transportadora === 'correios' ? 'Correios' : 'Jadlog'})</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Adicionar Atualização */}
                  {selectedOrder.codigo_rastreio && (
                    <div className="mt-6 border-t border-[#3a3a3a] pt-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <FiPlus className="w-4 h-4 text-[#ff1e1e]" />
                        Adicionar Atualização de Rastreio
                      </h5>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Status:</label>
                          <select
                            value={novaAtualizacao.status}
                            onChange={(e) => setNovaAtualizacao(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] focus:border-[#ff1e1e] outline-none text-white text-sm"
                          >
                            <option value="">Selecione o status...</option>
                            {STATUS_RASTREIO.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Descrição:</label>
                          <input
                            type="text"
                            value={novaAtualizacao.descricao}
                            onChange={(e) => setNovaAtualizacao(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Ex: Objeto saiu do centro de distribuição"
                            className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] focus:border-[#ff1e1e] outline-none text-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Local:</label>
                          <input
                            type="text"
                            value={novaAtualizacao.local}
                            onChange={(e) => setNovaAtualizacao(prev => ({ ...prev, local: e.target.value }))}
                            placeholder="Ex: São Paulo/SP"
                            className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] focus:border-[#ff1e1e] outline-none text-white text-sm"
                          />
                        </div>
                        
                        <button
                          onClick={handleAdicionarAtualizacao}
                          disabled={savingAtualizacao || !novaAtualizacao.status || !novaAtualizacao.descricao}
                          className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors
                            ${novaAtualizacao.status && novaAtualizacao.descricao
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-600 cursor-not-allowed'}`}
                        >
                          {savingAtualizacao ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <FiPlus className="w-4 h-4" />
                              Adicionar Atualização
                            </>
                          )}
                        </button>
                      </div>

                      {/* Lista de atualizações existentes */}
                      {rastreioAtualizacoes.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-xs font-medium text-gray-400 mb-2">Histórico ({rastreioAtualizacoes.length}):</h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {rastreioAtualizacoes.map((atualizacao, index) => (
                              <div key={index} className="flex items-start justify-between gap-2 p-2 bg-[#1a1a1a] rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{atualizacao.status}</p>
                                  <p className="text-xs text-gray-400 truncate">{atualizacao.descricao}</p>
                                  <p className="text-xs text-gray-500">
                                    {atualizacao.local} - {new Date(atualizacao.data).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoverAtualizacao(index)}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                                  title="Remover atualização"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Data */}
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Pedido em: {formatDate(selectedOrder.created_at)}
                </div>
              </div>

              {/* Footer do Modal */}
              <div className="flex flex-col gap-3 p-6 border-t border-[#2a2a2a]">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 py-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="flex-1 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Excluir Pedido
                  </button>
                </div>
                
                {/* Botão para excluir usuário completamente */}
                {selectedOrder.email && (
                  <button
                    onClick={() => handleDeleteUser(selectedOrder.email)}
                    className="w-full py-3 rounded-lg bg-red-800 hover:bg-red-900 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiUsers className="w-4 h-4" />
                    Excluir Usuário Permanentemente ({selectedOrder.email})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estilos de animação */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Admin
