/**
 * Admin Page - Painel Administrativo Simplificado
 * Gerencia pedidos, clientes e visitantes online
 */

import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/UI'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, ORDER_STATUS } from '../../utils'
import { 
  FiPackage, FiUsers, FiActivity, FiEye, FiTrash2, 
  FiRefreshCw, FiCalendar, FiX,
  FiUser, FiMapPin, FiImage
} from 'react-icons/fi'
import toast from 'react-hot-toast'

// Email do administrador
const ADMIN_EMAIL = 'gordao@gmail.com'

const Admin = () => {
  const { user, loading: authLoading } = useAuth()
  
  // Verificar se é admin
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  // Estados
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [visitors, setVisitors] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingVisitors, setLoadingVisitors] = useState(true)
  
  // Modal de pedido
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

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
      
      // Atualizar visitantes a cada 30 segundos
      const interval = setInterval(loadVisitors, 30000)
      return () => clearInterval(interval)
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
    </div>
  )
}

export default Admin
