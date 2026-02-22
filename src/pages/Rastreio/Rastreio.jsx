import { useState } from 'react'
import { FiSearch, FiPackage, FiTruck, FiCheckCircle, FiMapPin, FiClock, FiAlertCircle } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'

const Rastreio = () => {
  const [codigoRastreio, setCodigoRastreio] = useState('')
  const [rastreioData, setRastreioData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Buscar rastreio
  const buscarRastreio = async (e) => {
    e.preventDefault()
    
    if (!codigoRastreio.trim()) {
      setError('Digite o código de rastreio')
      return
    }

    setLoading(true)
    setError('')
    setRastreioData(null)

    try {
      // Buscar pedido pelo código de rastreio
      const { data: pedido, error: pedidoError } = await supabase
        .from('orders')
        .select('*')
        .eq('codigo_rastreio', codigoRastreio.trim().toUpperCase())
        .single()

      if (pedidoError || !pedido) {
        // Tentar buscar pelo ID do pedido
        const { data: pedidoById, error: pedidoByIdError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', codigoRastreio.trim())
          .single()

        if (pedidoByIdError || !pedidoById) {
          setError('Código de rastreio não encontrado. Verifique e tente novamente.')
          setLoading(false)
          return
        }

        setRastreioData(pedidoById)
      } else {
        setRastreioData(pedido)
      }
    } catch (err) {
      console.error('Erro ao buscar rastreio:', err)
      setError('Erro ao buscar informações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Gerar histórico baseado no status
  const gerarHistorico = (pedido) => {
    const historico = []
    const dataBase = new Date(pedido.created_at)
    
    // Status possíveis: pendente, confirmado, em_producao, enviado, entregue
    const statusMap = {
      'pendente': 0,
      'confirmado': 1,
      'em_producao': 2,
      'enviado': 3,
      'entregue': 4
    }

    const statusAtual = statusMap[pedido.status] || 0

    // Pedido Recebido
    historico.push({
      status: 'Pedido Recebido',
      descricao: 'Seu pedido foi recebido e está aguardando confirmação de pagamento',
      data: dataBase,
      local: 'Sapiranga/RS',
      concluido: statusAtual >= 0,
      atual: statusAtual === 0
    })

    // Pagamento Confirmado
    if (statusAtual >= 1) {
      const data1 = new Date(dataBase)
      data1.setHours(data1.getHours() + 2)
      historico.push({
        status: 'Pagamento Confirmado',
        descricao: 'Pagamento aprovado. Seu pedido será encaminhado para produção',
        data: data1,
        local: 'Sapiranga/RS',
        concluido: statusAtual >= 1,
        atual: statusAtual === 1
      })
    }

    // Em Produção
    if (statusAtual >= 2) {
      const data2 = new Date(dataBase)
      data2.setDate(data2.getDate() + 1)
      historico.push({
        status: 'Em Produção',
        descricao: 'Sua miniatura personalizada está sendo confeccionada com carinho',
        data: data2,
        local: 'Sapiranga/RS - Ateliê Motors Personalizados',
        concluido: statusAtual >= 2,
        atual: statusAtual === 2
      })
    }

    // Objeto Postado
    if (statusAtual >= 3) {
      const data3 = new Date(dataBase)
      data3.setDate(data3.getDate() + 3)
      historico.push({
        status: 'Objeto Postado',
        descricao: pedido.transportadora === 'jadlog' 
          ? 'Objeto postado na agência Jadlog' 
          : 'Objeto postado nos Correios',
        data: data3,
        local: 'Sapiranga/RS',
        concluido: statusAtual >= 3,
        atual: statusAtual === 3
      })

      // Em Trânsito
      const data4 = new Date(dataBase)
      data4.setDate(data4.getDate() + 4)
      historico.push({
        status: 'Objeto em Trânsito',
        descricao: 'Objeto em trânsito - por favor aguarde',
        data: data4,
        local: 'Centro de Distribuição',
        concluido: statusAtual >= 3,
        atual: statusAtual === 3
      })
    }

    // Entregue
    if (statusAtual >= 4) {
      const data5 = new Date(dataBase)
      data5.setDate(data5.getDate() + 7)
      historico.push({
        status: 'Objeto Entregue',
        descricao: 'Objeto entregue ao destinatário',
        data: data5,
        local: pedido.cidade || 'Destino',
        concluido: true,
        atual: true
      })
    }

    return historico.reverse() // Mais recente primeiro
  }

  // Formatar data
  const formatarData = (data) => {
    const d = new Date(data)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Ícone do status
  const getStatusIcon = (status) => {
    if (status.includes('Recebido')) return <FiPackage className="w-5 h-5" />
    if (status.includes('Confirmado')) return <FiCheckCircle className="w-5 h-5" />
    if (status.includes('Produção')) return <FiClock className="w-5 h-5" />
    if (status.includes('Postado') || status.includes('Trânsito')) return <FiTruck className="w-5 h-5" />
    if (status.includes('Entregue')) return <FiMapPin className="w-5 h-5" />
    return <FiPackage className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Rastreie seu Pedido
          </h1>
          <p className="text-gray-400">
            Acompanhe o status da sua miniatura personalizada
          </p>
        </div>

        {/* Logos das transportadoras */}
        <div className="flex justify-center items-center gap-12 mb-8">
          <img 
            src="/logo-correios.png" 
            alt="Correios" 
            style={{ height: '80px', maxWidth: '150px' }}
            className="object-contain"
          />
          <img 
            src="/logo-jadlog.png" 
            alt="Jadlog" 
            style={{ height: '80px', maxWidth: '150px' }}
            className="object-contain"
          />
        </div>

        {/* Formulário de busca */}
        <form onSubmit={buscarRastreio} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value.toUpperCase())}
                placeholder="Digite o código de rastreio ou nº do pedido"
                className="w-full px-4 py-3 bg-[#1e1e1e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff1e1e] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#ff1e1e] text-white rounded-xl font-semibold hover:bg-[#cc1818] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSearch className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Erro */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Resultado do rastreio */}
        {rastreioData && (
          <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 overflow-hidden">
            {/* Header do resultado */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Código de Rastreio</p>
                  <p className="text-xl font-bold text-white">
                    {rastreioData.codigo_rastreio || `PED-${rastreioData.id?.slice(0, 8).toUpperCase()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {rastreioData.transportadora === 'jadlog' ? (
                    <img src="/logo-jadlog.png" alt="Jadlog" className="h-8" />
                  ) : (
                    <img src="/logo-correios.png" alt="Correios" className="h-8" />
                  )}
                </div>
              </div>

              {/* Info do pedido */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Produto</p>
                  <p className="text-white">{rastreioData.modelo || 'Miniatura Personalizada'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Data do Pedido</p>
                  <p className="text-white">
                    {new Date(rastreioData.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Destino</p>
                  <p className="text-white">{rastreioData.cidade || '-'}/{rastreioData.estado || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className={`font-semibold ${
                    rastreioData.status === 'entregue' ? 'text-green-400' :
                    rastreioData.status === 'enviado' ? 'text-blue-400' :
                    rastreioData.status === 'em_producao' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}>
                    {rastreioData.status === 'pendente' && 'Aguardando Pagamento'}
                    {rastreioData.status === 'confirmado' && 'Pagamento Confirmado'}
                    {rastreioData.status === 'em_producao' && 'Em Produção'}
                    {rastreioData.status === 'enviado' && 'Enviado'}
                    {rastreioData.status === 'entregue' && 'Entregue'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline de rastreio */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Histórico de Movimentação</h3>
              
              <div className="space-y-0">
                {gerarHistorico(rastreioData).map((evento, index) => (
                  <div key={index} className="relative flex gap-4">
                    {/* Linha conectora */}
                    {index < gerarHistorico(rastreioData).length - 1 && (
                      <div className="absolute left-[18px] top-10 w-0.5 h-full bg-gray-700" />
                    )}
                    
                    {/* Ícone */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      evento.atual 
                        ? 'bg-[#ff1e1e] text-white' 
                        : evento.concluido 
                          ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50' 
                          : 'bg-gray-700 text-gray-400'
                    }`}>
                      {getStatusIcon(evento.status)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 pb-8">
                      <div className={`p-4 rounded-xl ${
                        evento.atual ? 'bg-[#ff1e1e]/10 border border-[#ff1e1e]/30' : 'bg-[#252525]'
                      }`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                          <h4 className={`font-semibold ${
                            evento.atual ? 'text-[#ff1e1e]' : 'text-white'
                          }`}>
                            {evento.status}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatarData(evento.data)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">{evento.descricao}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          {evento.local}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso */}
            <div className="px-6 pb-6">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  <strong>Atenção:</strong> O prazo de entrega pode variar de acordo com a região. 
                  Após o envio, você receberá o código de rastreio oficial da transportadora por e-mail.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dicas */}
        {!rastreioData && !error && (
          <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Como rastrear seu pedido?
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#ff1e1e]/20 text-[#ff1e1e] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span>Digite o código de rastreio enviado para seu e-mail ou o número do pedido</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#ff1e1e]/20 text-[#ff1e1e] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span>Clique em &quot;Buscar&quot; para ver o status atualizado</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#ff1e1e]/20 text-[#ff1e1e] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span>Acompanhe cada etapa do seu pedido até a entrega</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-[#252525] rounded-xl">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Prazos estimados:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-500">
                <li>• Produção: 3 a 5 dias úteis</li>
                <li>• Envio Correios: 5 a 15 dias úteis</li>
                <li>• Envio Jadlog: 3 a 8 dias úteis</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Rastreio
