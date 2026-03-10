/**
 * Checkout - Página de pagamento PIX
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiCopy, FiCheck, FiArrowLeft, FiClock, FiShield, FiAlertCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { createPixPayment, formatCurrency, validateCPF, formatCPF, formatPhone, toCents } from '../../services/paymentService'
import { savePendingPayment, markPaymentAsPaid } from '../../services/pendingPaymentService'
import { useAuth } from '../../context/AuthContext'
import { trackInitiateCheckout, trackAddPaymentInfo } from '../../utils/metaPixel'

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Dados do pedido (vindo da página de personalização)
  const orderData = location.state?.orderData

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.nome || '',
    email: user?.email || '',
    phone: '',
    cpf: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Estados do pagamento
  const [paymentData, setPaymentData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)

  // Redirecionar se não tiver dados do pedido
  useEffect(() => {
    if (!orderData) {
      toast.error('Nenhum pedido encontrado')
      navigate('/personalizar')
    }
  }, [orderData, navigate])

  // Meta Pixel - Rastrear início do checkout
  useEffect(() => {
    if (orderData) {
      trackInitiateCheckout({
        content_name: `Miniatura Personalizada - ${orderData.modelo || 'Moto'}`,
        content_ids: [orderData.orderId || 'miniatura-personalizada'],
        content_type: 'product',
        value: orderData.preco || 79,
        num_items: 1
      })
    }
  }, [orderData])

  // Timer de expiração do PIX
  useEffect(() => {
    if (!paymentData?.expiresAt) return

    const updateTimer = () => {
      const now = new Date()
      const expires = new Date(paymentData.expiresAt)
      const diff = expires - now

      if (diff <= 0) {
        setTimeLeft(null)
        toast.error('PIX expirado. Gere um novo.')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [paymentData])

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!paymentData?.transactionId) return

    const checkPaymentStatus = async () => {
      try {
        setCheckingPayment(true)
        const response = await fetch(`/api/check-payment-status?transactionId=${paymentData.transactionId}`)
        const data = await response.json()

        if (data.success && data.isPaid) {
          // Marcar pagamento como pago no banco
          if (paymentData.transactionId) {
            try {
              await markPaymentAsPaid(paymentData.transactionId)
            } catch (err) {
              console.error('Erro ao marcar pagamento como pago:', err)
            }
          }

          // Pagamento confirmado! Redirecionar para página de confirmação
          const params = new URLSearchParams({
            order_id: orderData.orderId || paymentData.transactionId,
            value: orderData.preco || 79,
            modelo: orderData.modelo || 'Moto'
          })
          navigate(`/pedido-confirmado?${params.toString()}`)
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
      } finally {
        setCheckingPayment(false)
      }
    }

    // Verificar imediatamente
    checkPaymentStatus()

    // Polling a cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000)

    return () => clearInterval(interval)
  }, [paymentData, orderData, navigate])

  // Validar formulário
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (formData.name.trim().split(' ').length < 2) {
      newErrors.name = 'Digite o nome completo'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido'
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Criar pagamento
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Corrija os erros no formulário')
      return
    }

    setLoading(true)

    try {
      const payment = await createPixPayment({
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone,
          document: {
            number: formData.cpf,
            type: 'cpf'
          }
        },
        items: [
          {
            title: `Miniatura Personalizada - ${orderData.modelo || 'Moto'}`,
            unitPrice: toCents(orderData.preco || 79),
            quantity: 1
          }
        ],
        amount: toCents(orderData.preco || 79),
        orderId: orderData.orderId || `MP-${Date.now()}`
      })

      setPaymentData(payment)
      toast.success('PIX gerado com sucesso!')

      // Salvar pagamento pendente no banco (se usuário logado)
      if (user?.id && payment.transactionId) {
        try {
          await savePendingPayment({
            userId: user.id,
            transactionId: payment.transactionId,
            orderId: orderData.orderId || `MP-${Date.now()}`,
            qrCode: payment.qrCode,
            qrCodeBase64: payment.qrCodeBase64,
            copyPaste: payment.copyPaste,
            expiresAt: payment.expiresAt,
            modelo: orderData.modelo || 'Moto',
            valor: orderData.preco || 79,
            imagemUrl: orderData.imagem || null,
            customerName: formData.name.trim(),
            customerEmail: formData.email.trim(),
            customerPhone: formData.phone,
            customerCpf: formData.cpf
          })
          console.log('Pagamento pendente salvo no banco')
        } catch (err) {
          console.error('Erro ao salvar pagamento pendente:', err)
          // Não bloqueia o fluxo
        }
      }

      // Meta Pixel - Rastrear informações de pagamento adicionadas
      trackAddPaymentInfo({
        content_ids: [orderData.orderId || 'miniatura-personalizada'],
        content_type: 'product',
        value: orderData.preco || 79
      })

      // O evento Purchase será disparado na página de confirmação após pagamento

    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      toast.error(error.message || 'Erro ao gerar PIX')
    } finally {
      setLoading(false)
    }
  }

  // Copiar código PIX
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.copyPaste)
      setCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      toast.error('Erro ao copiar')
    }
  }

  // Formatar input
  const handleInputChange = (field, value) => {
    let formatted = value

    if (field === 'cpf') {
      formatted = value.replace(/\D/g, '').slice(0, 11)
      if (formatted.length > 0) {
        formatted = formatCPF(formatted)
      }
    }

    if (field === 'phone') {
      formatted = value.replace(/\D/g, '').slice(0, 11)
      if (formatted.length > 0) {
        formatted = formatPhone(formatted)
      }
    }

    setFormData(prev => ({ ...prev, [field]: formatted }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  if (!orderData) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-4 sm:py-8 md:py-16">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 sm:mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Finalizar <span className="text-gradient">Pedido</span>
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Coluna Esquerda - Resumo do Pedido */}
          <div className="order-2 md:order-1">
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-4">
                {/* Item */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center overflow-hidden">
                    {orderData.imagem ? (
                      <img src={orderData.imagem} alt="Miniatura" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🏍️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Miniatura Personalizada</h3>
                    <p className="text-sm text-gray-400">{orderData.modelo || 'Moto personalizada'}</p>
                    {orderData.cor && (
                      <p className="text-sm text-gray-500">Cor: {orderData.cor}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#ff1e1e]">
                      {formatCurrency(toCents(orderData.preco || 79))}
                    </p>
                  </div>
                </div>

                {/* Divisor */}
                <div className="border-t border-[#2a2a2a] pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal</span>
                    <span>{formatCurrency(toCents(orderData.preco || 79))}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Frete</span>
                    <span className="text-green-500">Grátis</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#2a2a2a]">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-xl font-bold text-[#ff1e1e]">
                      {formatCurrency(toCents(orderData.preco || 79))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
              <FiShield className="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Pagamento 100% Seguro</p>
                <p className="text-xs text-gray-500">Seus dados estão protegidos</p>
              </div>
            </div>

            {/* Selos de Confiança */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="flex flex-col items-center gap-1 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                <span className="text-xl">🔒</span>
                <span className="text-xs text-gray-400 text-center">Compra Segura</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                <span className="text-xl">✅</span>
                <span className="text-xs text-gray-400 text-center">Garantia 7 dias</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                <span className="text-xl">🚚</span>
                <span className="text-xs text-gray-400 text-center">Frete Grátis</span>
              </div>
            </div>

            {/* Mini Depoimento */}
            <div className="mt-4 p-4 bg-gradient-to-r from-[#ff1e1e]/10 to-transparent rounded-xl border border-[#ff1e1e]/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0">
                  <span className="text-sm">⭐</span>
                </div>
                <div>
                  <p className="text-sm text-gray-300 italic">"Ficou incrível! A miniatura ficou igualzinha à minha moto."</p>
                  <p className="text-xs text-gray-500 mt-1">— Carlos M., São Paulo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário ou QR Code */}
          <div className="order-1 md:order-2">
            {!paymentData ? (
              /* Formulário de dados */
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">Seus Dados</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`input ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Seu nome completo"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">E-mail</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`input ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone (WhatsApp)</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`input ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block text-sm font-medium mb-2">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf || ''}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className={`input ${errors.cpf ? 'border-red-500' : ''}`}
                      placeholder="000.000.000-00"
                    />
                    {errors.cpf && (
                      <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>
                    )}
                  </div>

                  {/* Método de pagamento */}
                  <div className="pt-4 border-t border-[#2a2a2a]">
                    <p className="text-sm font-medium mb-3">Método de Pagamento</p>
                    <div className="p-4 bg-[#1a1a1a] rounded-xl border-2 border-[#ff1e1e]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#32bcad]/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl">💳</span>
                        </div>
                        <div>
                          <p className="font-medium">PIX</p>
                          <p className="text-xs text-gray-400">Pagamento instantâneo</p>
                        </div>
                        <div className="ml-auto">
                          <span className="w-5 h-5 bg-[#ff1e1e] rounded-full flex items-center justify-center">
                            <FiCheck className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-glow w-full py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Gerando PIX...
                      </span>
                    ) : (
                      `Pagar ${formatCurrency(toCents(orderData.preco || 79))}`
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* QR Code PIX */
              <div className="card text-center">
                <h2 className="text-lg font-semibold mb-2">Pague com PIX</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Escaneie o QR Code ou copie o código abaixo
                </p>

                {/* Timer */}
                {timeLeft && (
                  <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <FiClock className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-500 font-mono font-bold">{timeLeft}</span>
                    <span className="text-sm text-yellow-500/80">para pagar</span>
                  </div>
                )}

                {/* QR Code */}
                <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                  {paymentData.qrCodeBase64 ? (
                    <img 
                      src={paymentData.qrCodeBase64} 
                      alt="QR Code PIX" 
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
                      <FiAlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Valor */}
                <p className="text-2xl font-bold text-[#ff1e1e] mb-4">
                  {formatCurrency(paymentData.amount || toCents(orderData.preco || 79))}
                </p>

                {/* Código PIX */}
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Código PIX Copia e Cola</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={paymentData.copyPaste || ''}
                      readOnly
                      className="input flex-1 text-xs font-mono truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-[#ff1e1e] hover:bg-[#cc0000] text-white'
                      }`}
                    >
                      {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Instruções */}
                <div className="text-left space-y-3 p-4 bg-[#1a1a1a] rounded-xl">
                  <p className="text-sm font-medium">Como pagar:</p>
                  <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha pagar com PIX</li>
                    <li>Escaneie o QR Code ou cole o código</li>
                    <li>Confirme o pagamento</li>
                  </ol>
                </div>

                {/* Aviso nota fiscal */}
                <p className="mt-4 text-xs text-gray-500 text-center">
                  📧 A nota fiscal será enviada automaticamente para seu e-mail após a confirmação do pagamento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
