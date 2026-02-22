/**
 * Personalizar Page
 * Formulário de personalização de miniatura com cálculo de preço
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { Button, Input } from '../../components/UI'
import ModalCadastroRapido from '../../components/ModalCadastroRapido'
import { PRICES, FRETE_OPTIONS, formatCurrency, formatarCEP, validarCEP, buscarCEP } from '../../utils'
import { supabase } from '../../lib/supabase'
import { FiUpload, FiX, FiCheck, FiShoppingCart, FiAlertCircle, FiMapPin, FiTruck, FiLoader } from 'react-icons/fi'
import toast from 'react-hot-toast'

/**
 * Formata telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
const formatarTelefone = (valor) => {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const numerosLimitados = numeros.slice(0, 11)
  
  // Aplica a máscara
  if (numerosLimitados.length === 0) return ''
  if (numerosLimitados.length <= 2) return `(${numerosLimitados}`
  if (numerosLimitados.length <= 6) return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2)}`
  if (numerosLimitados.length <= 10) {
    return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 6)}-${numerosLimitados.slice(6)}`
  }
  return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 7)}-${numerosLimitados.slice(7)}`
}

/**
 * Formata placa brasileira: ABC-1234 (antiga) ou ABC1D23 (Mercosul)
 */
const formatarPlaca = (valor) => {
  // Remove caracteres especiais, mantém letras e números
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  // Limita a 7 caracteres
  const limitado = limpo.slice(0, 7)
  
  // Se tem 4+ caracteres, adiciona hífen após as 3 primeiras letras (formato antigo)
  if (limitado.length > 3) {
    // Verifica se parece formato Mercosul (ABC1D23)
    const possiveisLetras = limitado.slice(0, 3)
    const resto = limitado.slice(3)
    
    // Formato Mercosul: 3 letras + 1 número + 1 letra + 2 números
    if (resto.length >= 2 && /^[0-9][A-Z]/.test(resto)) {
      return limitado // Retorna sem hífen para Mercosul
    }
    
    // Formato antigo: 3 letras + hífen + 4 números
    return `${possiveisLetras}-${resto}`
  }
  
  return limitado
}

/**
 * Valida se a placa está em formato válido
 */
const validarPlaca = (placa) => {
  if (!placa || placa.length === 0) return true // Vazio é válido (opcional)
  
  const limpa = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  
  // Placa antiga: 3 letras + 4 números
  const regexAntiga = /^[A-Z]{3}[0-9]{4}$/
  
  // Placa Mercosul: 3 letras + 1 número + 1 letra + 2 números
  const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
  
  return regexAntiga.test(limpa) || regexMercosul.test(limpa)
}

const Personalizar = () => {
  const { user } = useAuth()
  const { submitOrder, loading } = useOrders()
  const navigate = useNavigate()

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefone: '',
    modelo_moto: '',
    placa_personalizada: '',
    nome_gravado: '',
    embalagem_premium: false,
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Frete
    frete_selecionado: 'correios_gratis',
  })

  // Estado do arquivo
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [placaErro, setPlacaErro] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [cepErro, setCepErro] = useState('')
  const [showModalCadastro, setShowModalCadastro] = useState(false)
  const [cadastroLoading, setCadastroLoading] = useState(false)

  // Obter frete selecionado
  const freteSelecionado = FRETE_OPTIONS.find(f => f.id === formData.frete_selecionado) || FRETE_OPTIONS[0]

  // Cálculo do preço
  const calcularPreco = useCallback(() => {
    let total = PRICES.BASE
    // Só cobra placa se for válida e completa
    if (formData.placa_personalizada.trim() && validarPlaca(formData.placa_personalizada)) {
      total += PRICES.PLACA_PERSONALIZADA
    }
    if (formData.nome_gravado.trim()) total += PRICES.NOME_GRAVADO
    if (formData.embalagem_premium) total += PRICES.EMBALAGEM_PREMIUM
    // Adiciona frete
    const frete = FRETE_OPTIONS.find(f => f.id === formData.frete_selecionado)
    if (frete) total += frete.preco
    return total
  }, [formData.placa_personalizada, formData.nome_gravado, formData.embalagem_premium, formData.frete_selecionado])

  // Manipular mudanças nos inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handler específico para telefone com formatação
  const handleTelefoneChange = (e) => {
    const formatted = formatarTelefone(e.target.value)
    setFormData(prev => ({ ...prev, telefone: formatted }))
  }

  // Handler específico para placa com formatação e validação
  const handlePlacaChange = (e) => {
    const formatted = formatarPlaca(e.target.value)
    setFormData(prev => ({ ...prev, placa_personalizada: formatted }))
    
    // Valida apenas se o usuário digitou algo
    if (formatted.length > 0) {
      const limpa = formatted.replace(/[^A-Z0-9]/gi, '')
      if (limpa.length === 7) {
        if (!validarPlaca(formatted)) {
          setPlacaErro('Use formato: ABC-1234 ou ABC1D23')
        } else {
          setPlacaErro('')
        }
      } else if (limpa.length > 0 && limpa.length < 7) {
        setPlacaErro('Complete a placa')
      }
    } else {
      setPlacaErro('')
    }
  }

  // Handler específico para CEP com formatação e busca automática
  const handleCepChange = async (e) => {
    const formatted = formatarCEP(e.target.value)
    setFormData(prev => ({ ...prev, cep: formatted }))
    setCepErro('')
    
    // Se CEP foi apagado, limpar todos os campos de endereço
    if (formatted.replace(/\D/g, '').length === 0) {
      setFormData(prev => ({
        ...prev,
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
      }))
      return
    }
    
    // Busca automática quando CEP completo
    if (validarCEP(formatted)) {
      setBuscandoCep(true)
      const resultado = await buscarCEP(formatted)
      setBuscandoCep(false)
      
      if (resultado.success) {
        setFormData(prev => ({
          ...prev,
          logradouro: resultado.data.logradouro,
          bairro: resultado.data.bairro,
          cidade: resultado.data.cidade,
          estado: resultado.data.estado,
        }))
        setCepErro('')
      } else {
        setCepErro(resultado.error)
      }
    }
  }

  // Manipular upload de imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida')
        return
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB')
        return
      }

      setImageFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remover imagem
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.nome_cliente.trim()) {
      toast.error('Informe seu nome')
      return false
    }

    if (!formData.telefone.trim()) {
      toast.error('Informe seu telefone')
      return false
    }

    const telefoneLimpo = formData.telefone.replace(/\D/g, '')
    if (telefoneLimpo.length < 10) {
      toast.error('Telefone incompleto. Use formato (XX) XXXXX-XXXX')
      return false
    }

    if (!formData.modelo_moto.trim()) {
      toast.error('Informe o modelo da moto')
      return false
    }

    if (formData.placa_personalizada.trim() && !validarPlaca(formData.placa_personalizada)) {
      toast.error('Placa inválida. Use formato ABC-1234 ou ABC1D23')
      return false
    }

    if (!validarCEP(formData.cep)) {
      toast.error('Informe um CEP válido')
      return false
    }

    if (!formData.logradouro.trim()) {
      toast.error('Informe o endereço')
      return false
    }

    if (!formData.numero.trim()) {
      toast.error('Informe o número do endereço')
      return false
    }

    if (!formData.cidade.trim() || !formData.estado.trim()) {
      toast.error('Cidade e estado são obrigatórios')
      return false
    }

    return true
  }

  // Enviar pedido
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) return

    // Se não estiver logado, mostra modal de cadastro
    if (!user) {
      setShowModalCadastro(true)
      return
    }

    // Usuário já logado - criar pedido diretamente
    await finalizarPedido()
  }

  // Finalizar pedido (chamado após login/cadastro ou para usuários já logados)
  const finalizarPedido = async (userId = user?.id) => {
    if (!userId) {
      toast.error('Erro de autenticação. Tente novamente.')
      return
    }

    // Preparar dados do pedido com campos corretos
    const orderData = {
      nome_cliente: formData.nome_cliente,
      telefone: formData.telefone,
      email: formData.email,
      modelo_moto: formData.modelo_moto,
      placa_personalizada: formData.placa_personalizada || null,
      nome_gravado: formData.nome_gravado || null,
      embalagem_premium: formData.embalagem_premium,
      observacoes: formData.observacoes || null,
      // Campos de endereço
      endereco_cep: formData.cep,
      endereco_logradouro: formData.logradouro,
      endereco_numero: formData.numero,
      endereco_complemento: formData.complemento || null,
      endereco_bairro: formData.bairro,
      endereco_cidade: formData.cidade,
      endereco_estado: formData.estado,
      // Campos de frete
      frete_tipo: freteSelecionado.id,
      frete_valor: freteSelecionado.preco,
      frete_prazo: freteSelecionado.prazo,
      // Total
      valor_total: calcularPreco(),
    }

    const { data, error } = await submitOrder(orderData, imageFile)

    if (error) {
      toast.error('Erro ao criar pedido. Tente novamente.')
      return
    }

    toast.success('Pedido criado com sucesso!')
    navigate('/minha-conta')
  }

  // Callback do modal de cadastro
  const handleModalCadastro = async (senha) => {
    // Se senha é null, usuário quer continuar sem conta
    if (senha === null) {
      toast.error('É necessário criar uma conta para finalizar o pedido')
      setShowModalCadastro(false)
      navigate('/login', { state: { from: '/personalizar' } })
      return
    }

    // Verificar se email foi preenchido
    if (!formData.email || !formData.email.trim()) {
      toast.error('É necessário informar um e-mail válido para criar a conta')
      setShowModalCadastro(false)
      return
    }

    setCadastroLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: senha,
        options: {
          data: {
            nome: formData.nome_cliente,
            telefone: formData.telefone,
          }
        }
      })

      if (authError) {
        // Verificar se é rate limit
        if (authError.message?.includes('rate') || authError.status === 429) {
          toast.error('Muitas tentativas. Aguarde 1 minuto e tente novamente.')
        } else {
          toast.error(authError.message || 'Erro ao criar conta')
        }
        setCadastroLoading(false)
        return
      }

      // Conta criada com sucesso
      if (authData.user) {
        toast.success('Conta criada com sucesso!')
        setShowModalCadastro(false)
        
        // Finalizar pedido
        await finalizarPedido(authData.user.id)
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error)
      toast.error('Erro ao criar conta. Tente novamente.')
    }

    setCadastroLoading(false)
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="section-header">
          <span className="section-badge bg-[#1a1a1a] text-[#ff1e1e]">
            Personalização
          </span>
          <h1 className="section-title">
            Crie sua <span className="text-gradient">miniatura exclusiva</span>
          </h1>
          <p className="section-description">
            Preencha os dados abaixo e personalize cada detalhe da sua miniatura
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="card">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#ff1e1e] rounded-lg flex items-center justify-center text-sm">
                    1
                  </span>
                  Seus Dados
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Nome completo *"
                    name="nome_cliente"
                    value={formData.nome_cliente}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    required
                  />
                  <Input
                    label="E-mail *"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    type="email"
                    required
                  />
                  <Input
                    label="Telefone/WhatsApp *"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(11) 99999-9999"
                    type="tel"
                    required
                  />
                </div>
              </div>

              {/* Upload da Foto */}
              <div className="card">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#ff1e1e] rounded-lg flex items-center justify-center text-sm">
                    2
                  </span>
                  Foto da Moto
                </h2>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-contain rounded-lg bg-[#1a1a1a]"
                    />
                    
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full 
                               flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 
                                  text-center cursor-pointer hover:border-[#ff1e1e] transition-colors">
                      <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400 mb-2">
                        Clique para fazer upload ou arraste a imagem
                      </p>
                      <p className="text-sm text-gray-600">
                        PNG, JPG ou JPEG (máx. 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}

                <Input
                  label="Modelo da moto *"
                  name="modelo_moto"
                  value={formData.modelo_moto}
                  onChange={handleChange}
                  placeholder="Ex: Honda CB 500, Yamaha MT-07..."
                  className="mt-4"
                  required
                />
              </div>

              {/* Personalização */}
              <div className="card">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#ff1e1e] rounded-lg flex items-center justify-center text-sm">
                    3
                  </span>
                  Personalização
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Placa Personalizada */}
                  <div>
                    <Input
                      label={`Placa personalizada (+${formatCurrency(PRICES.PLACA_PERSONALIZADA)})`}
                      name="placa_personalizada"
                      value={formData.placa_personalizada}
                      onChange={handlePlacaChange}
                      placeholder="ABC-1234 ou ABC1D23"
                      maxLength={8}
                    />
                    {placaErro && (
                      <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                        <FiAlertCircle className="w-3 h-3" />
                        {placaErro}
                      </p>
                    )}
                    {formData.placa_personalizada && !placaErro && validarPlaca(formData.placa_personalizada) && (
                      <p className="flex items-center gap-1 text-xs text-green-400 mt-1">
                        <FiCheck className="w-3 h-3" />
                        Placa válida
                      </p>
                    )}
                  </div>

                  {/* Nome Gravado */}
                  <div>
                    <Input
                      label={`Nome gravado (+${formatCurrency(PRICES.NOME_GRAVADO)})`}
                      name="nome_gravado"
                      value={formData.nome_gravado}
                      onChange={handleChange}
                      placeholder="Seu nome ou apelido"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Embalagem Premium */}
                <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      name="embalagem_premium"
                      checked={formData.embalagem_premium}
                      onChange={handleChange}
                      className="w-5 h-5 mt-0.5 accent-[#ff1e1e]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Embalagem Premium</span>
                        <span className="px-2 py-0.5 bg-[#ff1e1e]/20 text-[#ff1e1e] 
                                       text-xs rounded-full">
                          +{formatCurrency(PRICES.EMBALAGEM_PREMIUM)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Caixa especial com acabamento premium, perfeita para presente
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Endereço e Frete */}
              <div className="card">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#ff1e1e] rounded-lg flex items-center justify-center text-sm">
                    4
                  </span>
                  Entrega
                </h2>

                {/* CEP */}
                <div className="mb-4">
                  <label className="label">CEP *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      {!formData.cep && (
                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                      )}
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleCepChange}
                        className={`input-field w-full ${!formData.cep ? 'pl-10' : 'pl-4'}`}
                        maxLength={9}
                      />
                      {buscandoCep && (
                        <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ff1e1e] animate-spin" />
                      )}
                    </div>
                  </div>
                  {cepErro && (
                    <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {cepErro}
                    </p>
                  )}
                  {formData.logradouro && !cepErro && (
                    <p className="flex items-center gap-1 text-xs text-green-400 mt-1">
                      <FiCheck className="w-3 h-3" />
                      Endereço encontrado
                    </p>
                  )}
                </div>

                {/* Campos de endereço */}
                {formData.logradouro && (
                  <div className="space-y-4 mb-6 animate-fade-in">
                    <Input
                      label="Rua/Logradouro"
                      name="logradouro"
                      value={formData.logradouro}
                      onChange={handleChange}
                      disabled
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Número *"
                        name="numero"
                        value={formData.numero}
                        onChange={handleChange}
                        placeholder="123"
                        required
                      />
                      <div className="col-span-2">
                        <Input
                          label="Complemento"
                          name="complemento"
                          value={formData.complemento}
                          onChange={handleChange}
                          placeholder="Apto, Bloco..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Bairro"
                        name="bairro"
                        value={formData.bairro}
                        disabled
                      />
                      <Input
                        label="Cidade/Estado"
                        value={`${formData.cidade} - ${formData.estado}`}
                        disabled
                      />
                    </div>
                  </div>
                )}

                {/* Opções de Frete */}
                <div className="mt-6">
                  <label className="label flex items-center gap-2 mb-3">
                    <FiTruck className="w-5 h-5 text-[#ff1e1e]" />
                    Escolha o frete
                  </label>
                  <div className="space-y-3">
                    {FRETE_OPTIONS.map((frete) => (
                      <label
                        key={frete.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.frete_selecionado === frete.id
                            ? 'border-[#ff1e1e] bg-[#ff1e1e]/10'
                            : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="frete_selecionado"
                          value={frete.id}
                          checked={formData.frete_selecionado === frete.id}
                          onChange={handleChange}
                          className="w-5 h-5 accent-[#ff1e1e]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{frete.nome}</span>
                            <span className={`font-bold ${frete.preco === 0 ? 'text-green-400' : 'text-white'}`}>
                              {frete.preco === 0 ? 'GRÁTIS' : formatCurrency(frete.preco)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{frete.descricao}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botão de submit (mobile) */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  className="flex items-center justify-center gap-2"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  Finalizar Pedido - {formatCurrency(calcularPreco())}
                </Button>
              </div>
            </form>
          </div>

          {/* Resumo do Pedido (sidebar) */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="text-lg font-bold mb-6">Resumo do Pedido</h3>

              {/* Preview */}
              <div className="bg-[#0a0a0a] rounded-lg p-4 mb-6 text-center">
                <div 
                  className="w-full aspect-square rounded-xl overflow-hidden mb-4 flex items-center justify-center"
                  style={{ backgroundColor: '#1a1a1a' }}
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview da moto"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FiUpload className="w-12 h-12 text-gray-500" />
                  )}
                </div>
                {formData.modelo_moto && (
                  <p className="font-medium">{formData.modelo_moto}</p>
                )}
              </div>

              {/* Detalhes do preço */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Miniatura base</span>
                  <span>{formatCurrency(PRICES.BASE)}</span>
                </div>
                
                {formData.placa_personalizada.trim() && validarPlaca(formData.placa_personalizada) && (
                  <div className="flex justify-between text-gray-400">
                    <span>Placa personalizada</span>
                    <span>+{formatCurrency(PRICES.PLACA_PERSONALIZADA)}</span>
                  </div>
                )}
                
                {formData.nome_gravado.trim() && (
                  <div className="flex justify-between text-gray-400">
                    <span>Nome gravado</span>
                    <span>+{formatCurrency(PRICES.NOME_GRAVADO)}</span>
                  </div>
                )}
                
                {formData.embalagem_premium && (
                  <div className="flex justify-between text-gray-400">
                    <span>Embalagem premium</span>
                    <span>+{formatCurrency(PRICES.EMBALAGEM_PREMIUM)}</span>
                  </div>
                )}

                {/* Frete */}
                <div className="flex justify-between text-gray-400">
                  <span>{freteSelecionado.nome}</span>
                  <span className={freteSelecionado.preco === 0 ? 'text-green-400' : ''}>
                    {freteSelecionado.preco === 0 ? 'GRÁTIS' : `+${formatCurrency(freteSelecionado.preco)}`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  Entrega em até {freteSelecionado.prazo} dias úteis
                </p>

                <div className="border-t border-[#2a2a2a] pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#ff1e1e]">{formatCurrency(calcularPreco())}</span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 mb-6">
                <div className={`flex items-center gap-2 text-sm ${formData.nome_cliente && formData.telefone && formData.email ? 'text-green-500' : 'text-gray-500'}`}>
                  <FiCheck className="w-4 h-4" />
                  <span>Dados pessoais</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${formData.modelo_moto ? 'text-green-500' : 'text-gray-500'}`}>
                  <FiCheck className="w-4 h-4" />
                  <span>Modelo da moto</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${imageFile ? 'text-green-500' : 'text-gray-500'}`}>
                  <FiCheck className="w-4 h-4" />
                  <span>Foto da moto</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${formData.cep && formData.logradouro && formData.numero ? 'text-green-500' : 'text-gray-500'}`}>
                  <FiCheck className="w-4 h-4" />
                  <span>Endereço de entrega</span>
                </div>
              </div>

              {/* Botão de submit */}
              <Button
                type="submit"
                fullWidth
                loading={loading}
                onClick={handleSubmit}
                className="hidden lg:flex items-center justify-center gap-2"
              >
                <FiShoppingCart className="w-5 h-5" />
                Finalizar Pedido
              </Button>

              {!user && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Cadastro rápido na finalização
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro Rápido */}
      <ModalCadastroRapido
        isOpen={showModalCadastro}
        onClose={() => setShowModalCadastro(false)}
        onConfirm={handleModalCadastro}
        dadosCliente={{
          nome: formData.nome_cliente,
          email: formData.email,
          telefone: formData.telefone,
          modelo_moto: formData.modelo_moto,
          placa: formData.placa_personalizada,
          nomeGravado: formData.nome_gravado,
          embalagemPremium: formData.embalagem_premium,
          fotoPreview: imagePreview,
          cep: formData.cep,
          endereco: formData.logradouro ? `${formData.logradouro}, ${formData.numero}${formData.complemento ? ` - ${formData.complemento}` : ''}, ${formData.bairro}, ${formData.cidade} - ${formData.estado}` : '',
          frete: freteSelecionado,
          valorTotal: calcularPreco()
        }}
        loading={cadastroLoading}
      />
    </div>
  )
}

export default Personalizar
