/**
 * Minha Conta Page
 * Página do usuário com listagem de pedidos e dados completos
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { supabase } from '../../lib/supabase'
import { getPendingPayments, cancelPendingPayment } from '../../services/pendingPaymentService'
import { OrderSkeleton } from '../../components/UI/Skeleton'
import { LoadingSpinner } from '../../components/UI'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../utils'
import { FiPackage, FiPlus, FiExternalLink, FiUser, FiMail, FiPhone, FiMapPin, FiTruck, FiChevronDown, FiChevronUp, FiImage, FiLogOut, FiCreditCard, FiClock, FiX, FiCopy } from 'react-icons/fi'
import toast from 'react-hot-toast'

const MinhaConta = () => {
  const { user, loading: authLoading } = useAuth()
  const { orders, loading, error, fetchUserOrders } = useOrders()
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [pendingPayments, setPendingPayments] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [expandedPayment, setExpandedPayment] = useState(null)
  const navigate = useNavigate()

  // Fazer logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erro no logout:', error)
        toast.error('Erro ao sair da conta')
        return
      }
      
      // Limpar storage
      sessionStorage.clear()
      
      toast.success('Você saiu da conta')
      navigate('/')
      
      // Forçar reload para limpar estado
      window.location.reload()
    } catch (err) {
      console.error('Erro inesperado no logout:', err)
      toast.error('Erro ao sair')
    }
  }

  // Carregar pedidos quando usuário estiver disponível
  useEffect(() => {
    if (user) {
      fetchUserOrders()
      loadPendingPayments()
    }
  }, [user, fetchUserOrders])

  // Carregar pagamentos pendentes
  const loadPendingPayments = async () => {
    if (!user?.id) return
    setLoadingPending(true)
    try {
      const payments = await getPendingPayments(user.id)
      setPendingPayments(payments)
    } catch (err) {
      console.error('Erro ao carregar pagamentos pendentes:', err)
    } finally {
      setLoadingPending(false)
    }
  }

  // Cancelar pagamento pendente
  const handleCancelPayment = async (transactionId) => {
    try {
      await cancelPendingPayment(transactionId)
      toast.success('Pagamento cancelado')
      loadPendingPayments()
    } catch (err) {
      toast.error('Erro ao cancelar pagamento')
    }
  }

  // Copiar código PIX
  const handleCopyPix = async (copyPaste) => {
    try {
      await navigator.clipboard.writeText(copyPaste)
      toast.success('Código PIX copiado!')
    } catch (err) {
      toast.error('Erro ao copiar')
    }
  }

  // Calcular tempo restante do PIX
  const getTimeLeft = (expiresAt) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires - now

    if (diff <= 0) return 'Expirado'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  // Toggle expandir pedido
  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  // Mostrar loading enquanto autenticação está carregando
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Minha <span className="text-gradient">Conta</span>
          </h1>
          <p className="text-gray-400">
            Gerencie seus pedidos e informações da conta
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Informações do usuário */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#ff1e1e]/20 rounded-full 
                              flex items-center justify-center">
                  <FiUser className="w-10 h-10 text-[#ff1e1e]" />
                </div>
                <h2 className="text-xl font-bold">
                  {user?.user_metadata?.nome || 'Usuário'}
                </h2>
                <p className="text-gray-400 text-sm flex items-center justify-center gap-2 mt-2">
                  <FiMail className="w-4 h-4" />
                  {user?.email}
                </p>
                {user?.user_metadata?.telefone && (
                  <p className="text-gray-400 text-sm flex items-center justify-center gap-2 mt-1">
                    <FiPhone className="w-4 h-4" />
                    {user?.user_metadata?.telefone}
                  </p>
                )}
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-[#ff1e1e]">{orders.length}</p>
                  <p className="text-xs text-gray-400">Total Pedidos</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {orders.filter(o => o.status === 'entregue').length}
                  </p>
                  <p className="text-xs text-gray-400">Entregues</p>
                </div>
              </div>

              {/* Ações */}
              <Link
                to="/personalizar"
                className="btn-glow w-full flex items-center justify-center gap-2 mb-3"
              >
                <FiPlus className="w-5 h-5" />
                Novo Pedido
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 border border-red-500/50 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
              >
                <FiLogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="lg:col-span-2 space-y-8">
            {/* Seção de Pagamentos Pendentes */}
            {pendingPayments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FiCreditCard className="w-6 h-6 text-amber-500" />
                    Pagamentos Pendentes
                  </h2>
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                    {pendingPayments.length} aguardando
                  </span>
                </div>
                
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="card border-2 border-amber-500/30 bg-amber-500/5">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex gap-4">
                          {payment.imagem_url ? (
                            <img
                              src={payment.imagem_url}
                              alt={payment.modelo}
                              className="w-16 h-16 object-cover rounded-lg border border-[#2a2a2a]"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                              <span className="text-2xl">🏍️</span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold">{payment.modelo || 'Miniatura Personalizada'}</h3>
                            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                              <FiClock className="w-4 h-4 text-amber-400" />
                              Expira em: <span className="text-amber-400 font-medium">{getTimeLeft(payment.expires_at)}</span>
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-[#ff1e1e]">
                          {formatCurrency(payment.valor)}
                        </p>
                      </div>

                      {/* QR Code e Copia e Cola */}
                      <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                          {/* QR Code */}
                          {payment.qr_code_base64 && (
                            <div className="flex-shrink-0">
                              <img
                                src={payment.qr_code_base64}
                                alt="QR Code PIX"
                                className="w-32 h-32 rounded-lg bg-white p-2"
                              />
                            </div>
                          )}
                          
                          {/* Código Copia e Cola */}
                          <div className="flex-1 w-full">
                            <p className="text-xs text-gray-500 mb-2">Código PIX Copia e Cola:</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={payment.copy_paste}
                                readOnly
                                className="flex-1 bg-[#1a1a1a] rounded-lg px-4 py-3 text-sm font-mono text-gray-300 border border-[#2a2a2a] truncate"
                              />
                              <button
                                onClick={() => handleCopyPix(payment.copy_paste)}
                                className="px-4 py-3 bg-[#ff1e1e] hover:bg-[#ff3e3e] rounded-lg transition-colors flex items-center gap-2"
                              >
                                <FiCopy className="w-5 h-5" />
                                <span className="hidden sm:inline">Copiar</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCancelPayment(payment.transaction_id)}
                          className="flex-1 py-2 px-4 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiX className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meus Pedidos */}
            <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiPackage className="w-6 h-6 text-[#ff1e1e]" />
                Meus Pedidos
              </h2>
              <span className="text-sm text-gray-400">
                {orders.length} pedido{orders.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              // Loading skeletons
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
              </div>
            ) : error ? (
              // Estado de erro
              <div className="card text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full 
                              flex items-center justify-center">
                  <FiPackage className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Erro ao carregar pedidos</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button 
                  onClick={fetchUserOrders}
                  className="btn-glow inline-flex items-center gap-2"
                >
                  Tentar novamente
                </button>
              </div>
            ) : orders.length === 0 ? (
              // Estado vazio
              <div className="card text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-[#1a1a1a] rounded-full 
                              flex items-center justify-center">
                  <FiPackage className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Nenhum pedido ainda</h3>
                <p className="text-gray-400 mb-6">
                  Crie sua primeira miniatura personalizada agora!
                </p>
                <Link to="/personalizar" className="btn-glow inline-flex items-center gap-2">
                  <FiPlus className="w-5 h-5" />
                  Criar miniatura
                </Link>
              </div>
            ) : (
              // Lista de pedidos
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="card">
                    {/* Header do Pedido */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex gap-4">
                        {/* Thumbnail da foto */}
                        {order.foto_moto_url ? (
                          <a
                            href={order.foto_moto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <img
                              src={order.foto_moto_url}
                              alt={order.modelo_moto}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-[#2a2a2a] hover:border-[#ff1e1e] transition-colors"
                            />
                          </a>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                            <FiImage className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-bold">{order.modelo_moto}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]} text-white`}>
                              {STATUS_LABELS[order.status]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Pedido em {formatDate(order.created_at)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.nome_cliente}
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-[#ff1e1e]">
                        {formatCurrency(order.valor_total)}
                      </p>
                    </div>

                    {/* Resumo dos adicionais */}
                    <div className="flex flex-wrap gap-2 py-3 border-t border-[#2a2a2a]">
                      {order.placa_personalizada && (
                        <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs">
                          Placa: <span className="font-mono">{order.placa_personalizada}</span>
                        </span>
                      )}
                      {order.nome_gravado && (
                        <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs">
                          Nome: {order.nome_gravado}
                        </span>
                      )}
                      {order.embalagem_premium && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                          Embalagem Premium
                        </span>
                      )}
                      {order.frete_tipo && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center gap-1">
                          <FiTruck className="w-3 h-3" />
                          {order.frete_tipo === 'correios_gratis' ? 'Correios Grátis' : 
                           order.frete_tipo === 'sedex' ? 'Sedex 10' : 'Jadlog PAC'}
                        </span>
                      )}
                    </div>

                    {/* Botão expandir */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedOrder === order.id ? (
                        <>
                          <FiChevronUp className="w-4 h-4" />
                          Ocultar detalhes
                        </>
                      ) : (
                        <>
                          <FiChevronDown className="w-4 h-4" />
                          Ver detalhes completos
                        </>
                      )}
                    </button>

                    {/* Detalhes expandidos */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-[#2a2a2a] pt-4 mt-2 space-y-4 animate-fadeIn">
                        {/* Dados do cliente */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <FiUser className="w-4 h-4" />
                            Dados do Cliente
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0a0a] rounded-lg p-4">
                            <div>
                              <p className="text-xs text-gray-500">Nome</p>
                              <p className="text-sm">{order.nome_cliente}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Telefone</p>
                              <p className="text-sm">{order.telefone || '-'}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500">E-mail</p>
                              <p className="text-sm">{order.email || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Endereço de entrega */}
                        {order.endereco_cep && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              <FiMapPin className="w-4 h-4" />
                              Endereço de Entrega
                            </h4>
                            <div className="bg-[#0a0a0a] rounded-lg p-4">
                              <p className="text-sm">
                                {order.endereco_logradouro}, {order.endereco_numero}
                                {order.endereco_complemento && ` - ${order.endereco_complemento}`}
                              </p>
                              <p className="text-sm text-gray-400">
                                {order.endereco_bairro}, {order.endereco_cidade} - {order.endereco_estado}
                              </p>
                              <p className="text-sm text-gray-500">
                                CEP: {order.endereco_cep}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Informações do frete */}
                        {order.frete_tipo && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              <FiTruck className="w-4 h-4" />
                              Informações de Envio
                            </h4>
                            <div className="bg-[#0a0a0a] rounded-lg p-4 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Método</p>
                                <p className="text-sm">
                                  {order.frete_tipo === 'correios_gratis' ? 'Correios Grátis' : 
                                   order.frete_tipo === 'sedex' ? 'Sedex 10' : 'Jadlog PAC'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Valor</p>
                                <p className="text-sm">
                                  {order.frete_valor === 0 ? (
                                    <span className="text-green-400">Grátis</span>
                                  ) : (
                                    formatCurrency(order.frete_valor)
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Prazo</p>
                                <p className="text-sm">{order.frete_prazo} dias úteis</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Rastreio */}
                        {(order.codigo_rastreio || order.status === 'enviado' || order.status === 'entregue') && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              <FiPackage className="w-4 h-4" />
                              Rastreio do Pedido
                            </h4>
                            <div className="bg-[#0a0a0a] rounded-lg p-4">
                              {order.codigo_rastreio ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500">Código de Rastreio</p>
                                      <p className="text-sm font-mono font-bold text-white">{order.codigo_rastreio}</p>
                                    </div>
                                    {order.transportadora && (
                                      <img 
                                        src={order.transportadora === 'jadlog' ? '/logo-jadlog.png' : '/logo-correios.png'}
                                        alt={order.transportadora === 'jadlog' ? 'Jadlog' : 'Correios'}
                                        style={{ height: '30px', width: 'auto' }}
                                      />
                                    )}
                                  </div>
                                  <Link
                                    to={`/rastreio?codigo=${order.codigo_rastreio}`}
                                    className="flex items-center gap-2 text-sm text-[#ff1e1e] hover:underline"
                                  >
                                    <FiExternalLink className="w-4 h-4" />
                                    Ver rastreio completo
                                  </Link>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400">
                                  O código de rastreio será disponibilizado em breve.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Observações */}
                        {order.observacoes && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Observações</h4>
                            <p className="text-sm text-gray-400 bg-[#0a0a0a] rounded-lg p-4">
                              {order.observacoes}
                            </p>
                          </div>
                        )}

                        {/* Link para foto ampliada */}
                        {order.foto_moto_url && (
                          <a
                            href={order.foto_moto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[#ff1e1e] hover:underline"
                          >
                            <FiExternalLink className="w-4 h-4" />
                            Ver foto em tamanho original
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MinhaConta
