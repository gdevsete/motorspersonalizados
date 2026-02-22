/**
 * Modal de Cadastro Rápido
 * Permite criar conta com os dados já preenchidos do pedido
 */

import { useState } from 'react'
import { FiX, FiUser, FiCheck, FiAlertCircle, FiMapPin, FiTruck, FiImage, FiPhone, FiMail } from 'react-icons/fi'
import { Button } from '../UI'

const ModalCadastroRapido = ({ isOpen, onClose, onConfirm, dadosCliente, loading }) => {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return
    }

    onConfirm(senha)
  }

  const handlePularCadastro = () => {
    onConfirm(null) // null indica que não quer criar conta
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0f0f0f] rounded-2xl border border-[#2a2a2a] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#ff1e1e]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-8 h-8 text-[#ff1e1e]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Criar sua conta?</h2>
            <p className="text-gray-400 text-sm">
              Com uma conta você pode acompanhar seus pedidos e fazer novas compras mais rápido!
            </p>
          </div>

          {/* Resumo do pedido */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6 space-y-4">
            <p className="text-sm font-semibold text-white border-b border-[#2a2a2a] pb-2">Resumo do seu pedido:</p>
            
            {/* Dados pessoais */}
            <div className="flex items-start gap-3">
              <FiUser className="w-4 h-4 text-[#ff1e1e] mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-white font-medium">{dadosCliente?.nome}</p>
                <p className="text-gray-400">{dadosCliente?.telefone}</p>
                {dadosCliente?.email && <p className="text-gray-400">{dadosCliente?.email}</p>}
              </div>
            </div>

            {/* Modelo da moto */}
            {dadosCliente?.modelo_moto && (
              <div className="flex items-start gap-3">
                <span className="text-[#ff1e1e] mt-0.5 flex-shrink-0">🏍️</span>
                <div className="text-sm">
                  <p className="text-gray-500">Modelo</p>
                  <p className="text-white">{dadosCliente.modelo_moto}</p>
                </div>
              </div>
            )}

            {/* Foto */}
            {dadosCliente?.fotoPreview && (
              <div className="flex items-start gap-3">
                <FiImage className="w-4 h-4 text-[#ff1e1e] mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Foto da moto</p>
                  <img 
                    src={dadosCliente.fotoPreview} 
                    alt="Moto" 
                    className="w-20 h-20 object-cover rounded-lg border border-[#2a2a2a]"
                  />
                </div>
              </div>
            )}

            {/* Personalizações */}
            {(dadosCliente?.placa || dadosCliente?.nomeGravado || dadosCliente?.embalagemPremium) && (
              <div className="flex items-start gap-3">
                <span className="text-[#ff1e1e] mt-0.5 flex-shrink-0">✨</span>
                <div className="text-sm space-y-1">
                  <p className="text-gray-500">Personalizações</p>
                  {dadosCliente?.placa && (
                    <p className="text-white">Placa: <span className="font-mono">{dadosCliente.placa}</span></p>
                  )}
                  {dadosCliente?.nomeGravado && (
                    <p className="text-white">Nome: {dadosCliente.nomeGravado}</p>
                  )}
                  {dadosCliente?.embalagemPremium && (
                    <p className="text-amber-400">📦 Embalagem Premium</p>
                  )}
                </div>
              </div>
            )}

            {/* Endereço */}
            {dadosCliente?.endereco && (
              <div className="flex items-start gap-3">
                <FiMapPin className="w-4 h-4 text-[#ff1e1e] mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-500">Entrega</p>
                  <p className="text-white">{dadosCliente.endereco}</p>
                  <p className="text-gray-400">CEP: {dadosCliente.cep}</p>
                </div>
              </div>
            )}

            {/* Frete */}
            {dadosCliente?.frete && (
              <div className="flex items-start gap-3">
                <FiTruck className="w-4 h-4 text-[#ff1e1e] mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-500">Frete</p>
                  <p className="text-white">{dadosCliente.frete.nome}</p>
                  <p className="text-gray-400">
                    {dadosCliente.frete.preco === 0 ? 'Grátis' : `R$ ${dadosCliente.frete.preco.toFixed(2)}`} 
                    {' - '}{dadosCliente.frete.prazo} dias úteis
                  </p>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-[#2a2a2a] pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total:</span>
                <span className="text-xl font-bold text-[#ff1e1e]">
                  R$ {dadosCliente?.valorTotal?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulário de senha */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Crie uma senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input-field w-full"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label">Confirme a senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="input-field w-full"
                placeholder="Digite novamente"
                autoComplete="new-password"
              />
            </div>

            {erro && (
              <p className="flex items-center gap-2 text-red-400 text-sm">
                <FiAlertCircle className="w-4 h-4" />
                {erro}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                fullWidth
                loading={loading}
                className="flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                Criar conta e finalizar
              </Button>

              <button
                type="button"
                onClick={handlePularCadastro}
                disabled={loading}
                className="text-gray-400 hover:text-white text-sm transition-colors py-2"
              >
                Continuar sem criar conta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ModalCadastroRapido
