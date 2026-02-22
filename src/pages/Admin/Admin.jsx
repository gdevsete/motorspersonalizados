/**
 * Admin Page
 * Painel administrativo para gerenciar pedidos, produtos e depoimentos
 */

import { useState, useEffect } from 'react'
import { useOrders } from '../../hooks/useOrders'
import { getTestimonials, createTestimonial, deleteTestimonial } from '../../services/testimonialService'
import { getAllProducts, createProduct, updateProduct, deleteProduct, toggleProductActive } from '../../services/productService'
import { Button, Input, LoadingSpinner } from '../../components/UI'
import { OrderSkeleton } from '../../components/UI/Skeleton'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, ORDER_STATUS } from '../../utils'
import { 
  FiPackage, FiMessageSquare, FiBox, FiEye, FiEdit2, 
  FiTrash2, FiPlus, FiX, FiExternalLink, FiCheck
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const Admin = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState('pedidos')
  
  // Estados
  const { orders, loading: loadingOrders, fetchAllOrders, changeStatus } = useOrders()
  const [testimonials, setTestimonials] = useState([])
  const [products, setProducts] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  
  // Modais
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showTestimonialModal, setShowTestimonialModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)

  // Formulários
  const [newTestimonial, setNewTestimonial] = useState({
    nome: '', cidade: '', comentario: '', nota: 5
  })
  const [newProduct, setNewProduct] = useState({
    nome: '', preco_base: '', descricao: '', ativo: true
  })

  // Carregar dados
  useEffect(() => {
    fetchAllOrders()
    loadTestimonials()
    loadProducts()
  }, [fetchAllOrders])

  const loadTestimonials = async () => {
    setLoadingTestimonials(true)
    const { data } = await getTestimonials()
    if (data) setTestimonials(data)
    setLoadingTestimonials(false)
  }

  const loadProducts = async () => {
    setLoadingProducts(true)
    const { data } = await getAllProducts()
    if (data) setProducts(data)
    setLoadingProducts(false)
  }

  // Handlers
  const handleStatusChange = async (orderId, newStatus) => {
    const { error } = await changeStatus(orderId, newStatus)
    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success('Status atualizado!')
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handleAddTestimonial = async (e) => {
    e.preventDefault()
    const { error } = await createTestimonial(newTestimonial)
    if (error) {
      toast.error('Erro ao adicionar depoimento')
    } else {
      toast.success('Depoimento adicionado!')
      setNewTestimonial({ nome: '', cidade: '', comentario: '', nota: 5 })
      setShowTestimonialModal(false)
      loadTestimonials()
    }
  }

  const handleDeleteTestimonial = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este depoimento?')) return
    const { error } = await deleteTestimonial(id)
    if (error) {
      toast.error('Erro ao excluir depoimento')
    } else {
      toast.success('Depoimento excluído!')
      loadTestimonials()
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    const { error } = await createProduct({
      ...newProduct,
      preco_base: parseFloat(newProduct.preco_base)
    })
    if (error) {
      toast.error('Erro ao adicionar produto')
    } else {
      toast.success('Produto adicionado!')
      setNewProduct({ nome: '', preco_base: '', descricao: '', ativo: true })
      setShowProductModal(false)
      loadProducts()
    }
  }

  const handleToggleProduct = async (id, currentStatus) => {
    const { error } = await toggleProductActive(id, !currentStatus)
    if (error) {
      toast.error('Erro ao atualizar produto')
    } else {
      toast.success('Produto atualizado!')
      loadProducts()
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    const { error } = await deleteProduct(id)
    if (error) {
      toast.error('Erro ao excluir produto')
    } else {
      toast.success('Produto excluído!')
      loadProducts()
    }
  }

  // Tabs config
  const tabs = [
    { id: 'pedidos', label: 'Pedidos', icon: FiPackage, count: orders.length },
    { id: 'depoimentos', label: 'Depoimentos', icon: FiMessageSquare, count: testimonials.length },
    { id: 'produtos', label: 'Produtos', icon: FiBox, count: products.length },
  ]

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Painel <span className="text-gradient">Admin</span>
          </h1>
          <p className="text-gray-400">
            Gerencie pedidos, produtos e depoimentos
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-[#ff1e1e] text-white' 
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs 
                ${activeTab === tab.id ? 'bg-white/20' : 'bg-[#2a2a2a]'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Conteúdo das Tabs */}
        {/* PEDIDOS */}
        {activeTab === 'pedidos' && (
          <div>
            {loadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="card text-center py-12">
                <FiPackage className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold">{order.modelo_moto}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]} text-white`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {order.nome_cliente} • {order.telefone}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-[#ff1e1e]">
                          {formatCurrency(order.valor_total)}
                        </p>

                        {/* Status select */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="input-field py-2 text-sm w-40"
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>

                        {/* Ver detalhes */}
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEPOIMENTOS */}
        {activeTab === 'depoimentos' && (
          <div>
            <div className="flex justify-end mb-6">
              <Button onClick={() => setShowTestimonialModal(true)}>
                <FiPlus className="w-5 h-5 mr-2" />
                Adicionar Depoimento
              </Button>
            </div>

            {loadingTestimonials ? (
              <LoadingSpinner className="py-12" />
            ) : testimonials.length === 0 ? (
              <div className="card text-center py-12">
                <FiMessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum depoimento encontrado</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold">{testimonial.nome}</p>
                        <p className="text-sm text-gray-500">{testimonial.cidade}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < testimonial.nota ? 'text-yellow-400' : 'text-gray-600'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 italic">
                      "{testimonial.comentario}"
                    </p>
                    <button
                      onClick={() => handleDeleteTestimonial(testimonial.id)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      <FiTrash2 className="w-4 h-4 inline mr-1" />
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUTOS */}
        {activeTab === 'produtos' && (
          <div>
            <div className="flex justify-end mb-6">
              <Button onClick={() => setShowProductModal(true)}>
                <FiPlus className="w-5 h-5 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {loadingProducts ? (
              <LoadingSpinner className="py-12" />
            ) : products.length === 0 ? (
              <div className="card text-center py-12">
                <FiBox className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className={`card ${!product.ativo ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold">{product.nome}</p>
                        <p className="text-[#ff1e1e] font-bold">
                          {formatCurrency(product.preco_base)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${product.ativo ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                        {product.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      {product.descricao || 'Sem descrição'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleProduct(product.id, product.ativo)}
                        className="flex-1 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors text-sm"
                      >
                        {product.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal - Ver Pedido */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Detalhes do Pedido</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.nome_cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{selectedOrder.telefone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Modelo</p>
                  <p className="font-medium">{selectedOrder.modelo_moto}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor</p>
                  <p className="font-medium text-[#ff1e1e]">{formatCurrency(selectedOrder.valor_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cor Principal</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-white/20"
                      style={{ backgroundColor: selectedOrder.cor_principal }}
                    />
                    <span>{selectedOrder.cor_principal}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cor Roda</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-white/20"
                      style={{ backgroundColor: selectedOrder.cor_roda }}
                    />
                    <span>{selectedOrder.cor_roda}</span>
                  </div>
                </div>
                {selectedOrder.placa_personalizada && (
                  <div>
                    <p className="text-sm text-gray-500">Placa</p>
                    <p className="font-mono">{selectedOrder.placa_personalizada}</p>
                  </div>
                )}
                {selectedOrder.nome_gravado && (
                  <div>
                    <p className="text-sm text-gray-500">Nome Gravado</p>
                    <p>{selectedOrder.nome_gravado}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Embalagem Premium</p>
                  <p>{selectedOrder.embalagem_premium ? 'Sim' : 'Não'}</p>
                </div>
              </div>

              {selectedOrder.foto_moto_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Foto da Moto</p>
                  <a
                    href={selectedOrder.foto_moto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={selectedOrder.foto_moto_url}
                      alt="Foto da moto"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
              <Button onClick={() => setShowOrderModal(false)} fullWidth variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Adicionar Depoimento */}
      {showTestimonialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Adicionar Depoimento</h2>
              <button
                onClick={() => setShowTestimonialModal(false)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTestimonial} className="space-y-4">
              <Input
                label="Nome"
                value={newTestimonial.nome}
                onChange={(e) => setNewTestimonial(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do cliente"
                required
              />
              <Input
                label="Cidade"
                value={newTestimonial.cidade}
                onChange={(e) => setNewTestimonial(prev => ({ ...prev, cidade: e.target.value }))}
                placeholder="São Paulo, SP"
                required
              />
              <div>
                <label className="label">Comentário</label>
                <textarea
                  value={newTestimonial.comentario}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, comentario: e.target.value }))}
                  placeholder="O que o cliente disse..."
                  className="input-field min-h-[100px]"
                  required
                />
              </div>
              <div>
                <label className="label">Nota</label>
                <select
                  value={newTestimonial.nota}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, nota: parseInt(e.target.value) }))}
                  className="input-field"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} estrelas</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowTestimonialModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Adicionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Adicionar Produto */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Adicionar Produto</h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <Input
                label="Nome do Produto"
                value={newProduct.nome}
                onChange={(e) => setNewProduct(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Chaveiro Premium"
                required
              />
              <Input
                label="Preço Base (R$)"
                type="number"
                step="0.01"
                value={newProduct.preco_base}
                onChange={(e) => setNewProduct(prev => ({ ...prev, preco_base: e.target.value }))}
                placeholder="79.00"
                required
              />
              <div>
                <label className="label">Descrição</label>
                <textarea
                  value={newProduct.descricao}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do produto..."
                  className="input-field min-h-[80px]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowProductModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Adicionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
