/**
 * Página de Pedido Confirmado
 * Dispara evento Purchase do Meta Pixel quando o pagamento é confirmado
 */

import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle, FiPackage, FiHome, FiUser } from 'react-icons/fi'
import { trackPurchase } from '../../utils/metaPixel'
import { useAuth } from '../../context/AuthContext'

const PedidoConfirmado = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const purchaseTracked = useRef(false)

  // Parâmetros do pedido via query string
  const orderId = searchParams.get('order_id') || searchParams.get('orderId')
  const orderValue = parseFloat(searchParams.get('value') || searchParams.get('valor') || '79')
  const orderModel = searchParams.get('model') || searchParams.get('modelo') || 'Miniatura Personalizada'

  useEffect(() => {
    // Verificar se já rastreou este pedido específico (evita duplicação)
    const trackedKey = `purchase_tracked_${orderId}`
    const alreadyTracked = sessionStorage.getItem(trackedKey)

    if (!alreadyTracked && !purchaseTracked.current && orderId) {
      purchaseTracked.current = true

      // Disparar evento Purchase do Meta Pixel
      trackPurchase({
        content_name: orderModel,
        content_ids: [orderId],
        content_type: 'product',
        value: orderValue,
        num_items: 1
      })

      // Marcar como rastreado para não duplicar
      sessionStorage.setItem(trackedKey, 'true')

      console.log('Meta Pixel Purchase event fired:', {
        orderId,
        value: orderValue,
        model: orderModel
      })
    }
  }, [orderId, orderValue, orderModel])

  // Se não tem order_id, mostrar página genérica
  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Obrigado pelo seu pedido!</h1>
          <p className="text-gray-400 mb-6">
            Seu pagamento está sendo processado.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff1e1e] hover:bg-[#ff3e3e] rounded-lg font-medium transition-colors"
          >
            <FiHome className="w-5 h-5" />
            Voltar ao Início
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container-custom max-w-2xl">
        {/* Ícone de sucesso */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Pagamento <span className="text-gradient">Confirmado!</span>
          </h1>
          <p className="text-gray-400">
            Seu pedido foi recebido e está sendo processado.
          </p>
        </div>

        {/* Card com detalhes do pedido */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiPackage className="text-[#ff1e1e]" />
            Detalhes do Pedido
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
              <span className="text-gray-400">Número do Pedido</span>
              <span className="font-mono font-medium">{orderId}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
              <span className="text-gray-400">Produto</span>
              <span>{orderModel}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
              <span className="text-gray-400">Valor Pago</span>
              <span className="text-[#ff1e1e] font-bold">
                R$ {orderValue.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Status</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                Pago
              </span>
            </div>
          </div>
        </div>

        {/* Próximos passos */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Próximos Passos</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#ff1e1e] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </span>
              <span>Você receberá um email de confirmação com os detalhes do pedido.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#ff1e1e] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </span>
              <span>Sua miniatura será produzida em até 5 dias úteis.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#ff1e1e] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </span>
              <span>Você receberá o código de rastreio assim que for enviado.</span>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to={`/rastreio?codigo=${orderId}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#ff1e1e] hover:bg-[#ff3e3e] rounded-lg font-medium transition-colors"
          >
            <FiPackage className="w-5 h-5" />
            Rastrear Pedido
          </Link>
          {user ? (
            <Link
              to="/minha-conta"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg font-medium transition-colors"
            >
              <FiUser className="w-5 h-5" />
              Minha Conta
            </Link>
          ) : (
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg font-medium transition-colors"
            >
              <FiHome className="w-5 h-5" />
              Voltar ao Início
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default PedidoConfirmado
