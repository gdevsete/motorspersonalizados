/**
 * Termos de Uso - Página completa com políticas
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FiFileText, FiShield, FiRefreshCw, FiTruck, FiPackage } from 'react-icons/fi'

const TermosDeUso = () => {
  const location = useLocation()

  useEffect(() => {
    // Se tiver hash na URL, rola até a seção
    if (location.hash) {
      const id = location.hash.replace('#', '')
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  const sections = [
    { id: 'termos', icon: FiFileText, title: 'Termos de Uso' },
    { id: 'privacidade', icon: FiShield, title: 'Política de Privacidade' },
    { id: 'trocas', icon: FiRefreshCw, title: 'Troca e Devolução' },
    { id: 'entrega', icon: FiTruck, title: 'Política de Entrega' },
    { id: 'personalizados', icon: FiPackage, title: 'Produtos Personalizados' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 md:py-20" style={{ paddingTop: '120px' }}>
      <div className="container-custom flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-[#1a1a1a] text-[#ff1e1e] text-sm font-medium rounded-full mb-4">
            Documentos Legais
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Termos e <span className="text-gradient">Políticas</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Transparência e segurança para você. Leia atentamente nossos termos e políticas.
          </p>
        </div>

        {/* Navegação rápida */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {sections.map(({ id, icon: Icon, title }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg text-sm text-gray-300 hover:text-white transition-all"
            >
              <Icon className="w-4 h-4 text-[#ff1e1e]" />
              {title}
            </a>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Termos de Uso */}
          <section id="termos" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#ff1e1e]/10 rounded-xl flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-[#ff1e1e]" />
              </div>
              <h2 className="text-2xl font-bold">Termos de Uso</h2>
            </div>
            <div className="card space-y-6 text-gray-300 leading-relaxed">
              <p className="text-sm text-gray-500">Última atualização: 22 de Fevereiro de 2026</p>
              
              <p>
                Bem-vindo ao site <strong className="text-white">Motors Personalizados</strong>, 
                inscrita no CNPJ <strong className="text-white">61.392.615/0001-03</strong>, 
                com sede em Sapiranga – RS, Brasil.
              </p>
              <p>Ao acessar este site e utilizar nossos serviços, você concorda com os presentes Termos de Uso.</p>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Objeto</h3>
                <p>A Motors Personalizados atua na produção e comercialização de miniaturas personalizadas sob medida, baseadas nas informações fornecidas pelo cliente.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Cadastro</h3>
                <p>O cliente se compromete a fornecer informações verdadeiras e atualizadas para a realização do pedido.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Produtos Personalizados</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Os produtos comercializados são personalizados conforme as especificações enviadas pelo cliente.</li>
                  <li>Pequenas variações de tonalidade, acabamento ou detalhes podem ocorrer devido ao processo de fabricação.</li>
                  <li>Conforme o Art. 49 do Código de Defesa do Consumidor, o direito de arrependimento pode não se aplicar a produtos personalizados, especialmente após o início da produção.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4. Pagamento</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Os pagamentos são processados por intermediadores financeiros seguros.</li>
                  <li>O pedido será confirmado somente após a aprovação do pagamento.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5. Propriedade Intelectual</h3>
                <p>Todo o conteúdo do site é de propriedade da Motors Personalizados, sendo proibida sua reprodução sem autorização.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">6. Foro</h3>
                <p>Fica eleito o foro da comarca de Sapiranga – RS para dirimir quaisquer controvérsias.</p>
              </div>
            </div>
          </section>

          {/* Política de Privacidade */}
          <section id="privacidade" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#ff1e1e]/10 rounded-xl flex items-center justify-center">
                <FiShield className="w-6 h-6 text-[#ff1e1e]" />
              </div>
              <h2 className="text-2xl font-bold">Política de Privacidade (LGPD)</h2>
            </div>
            <div className="card space-y-6 text-gray-300 leading-relaxed">
              <p>
                A Motors Personalizados respeita a privacidade e protege os dados pessoais conforme a 
                <strong className="text-white"> Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD)</strong>.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Dados Coletados</h3>
                <p className="mb-2">Podemos coletar:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Nome completo</li>
                  <li>CPF (quando necessário)</li>
                  <li>Endereço</li>
                  <li>Telefone</li>
                  <li>E-mail</li>
                  <li>Dados de pagamento (processados por plataforma terceirizada)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Finalidade do Uso</h3>
                <p className="mb-2">Os dados são utilizados para:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Processamento de pedidos</li>
                  <li>Emissão de nota fiscal</li>
                  <li>Comunicação com o cliente</li>
                  <li>Envio do produto</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Compartilhamento</h3>
                <p className="mb-2">Os dados poderão ser compartilhados apenas com:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Plataformas de pagamento</li>
                  <li>Serviços de transporte</li>
                  <li>Contador (quando necessário para emissão fiscal)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4. Segurança</h3>
                <p>Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5. Direitos do Titular</h3>
                <p className="mb-2">O cliente pode solicitar:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Acesso aos dados</li>
                  <li>Correção</li>
                  <li>Exclusão (quando aplicável)</li>
                </ul>
                <p className="mt-2">Solicitações devem ser feitas pelo e-mail: <strong className="text-[#ff1e1e]">contato@motorspersonalizados.com</strong></p>
              </div>
            </div>
          </section>

          {/* Política de Troca e Devolução */}
          <section id="trocas" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#ff1e1e]/10 rounded-xl flex items-center justify-center">
                <FiRefreshCw className="w-6 h-6 text-[#ff1e1e]" />
              </div>
              <h2 className="text-2xl font-bold">Política de Troca e Devolução</h2>
            </div>
            <div className="card space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Produtos Personalizados</h3>
                <p>Por se tratar de produto personalizado sob encomenda, não realizamos troca por arrependimento após o início da produção.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Defeito de Fabricação</h3>
                <p className="mb-2">Caso o produto apresente defeito de fabricação, o cliente deverá entrar em contato em até 7 dias após o recebimento.</p>
                <p className="mb-2">Após análise, poderá ser oferecido:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Reparo</li>
                  <li>Substituição</li>
                  <li>Reembolso (quando aplicável)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Mau Uso</h3>
                <p className="mb-2">Não nos responsabilizamos por danos causados por:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Queda</li>
                  <li>Uso inadequado</li>
                  <li>Exposição excessiva à água ou calor</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Política de Entrega */}
          <section id="entrega" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#ff1e1e]/10 rounded-xl flex items-center justify-center">
                <FiTruck className="w-6 h-6 text-[#ff1e1e]" />
              </div>
              <h2 className="text-2xl font-bold">Política de Entrega</h2>
            </div>
            <div className="card space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Prazo de Produção</h3>
                <p>O prazo de produção será informado no momento da compra.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Prazo de Envio</h3>
                <p>O prazo de entrega depende da modalidade escolhida e da região do cliente.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Responsabilidade</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Após o envio, a responsabilidade pelo transporte é da empresa logística contratada.</li>
                  <li>O cliente deverá informar endereço correto e completo. Não nos responsabilizamos por erros no preenchimento.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Termo Específico para Produtos Personalizados */}
          <section id="personalizados" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#ff1e1e]/10 rounded-xl flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-[#ff1e1e]" />
              </div>
              <h2 className="text-2xl font-bold">Termo para Produtos Personalizados</h2>
            </div>
            <div className="card space-y-6 text-gray-300 leading-relaxed">
              <p>Ao enviar fotos e informações da moto, o cliente declara que:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Possui autorização para uso das imagens enviadas</li>
                <li>Está ciente de que o produto será produzido com base nas referências fornecidas</li>
                <li>Entende que pequenas variações podem ocorrer</li>
              </ul>

              <div className="bg-[#ff1e1e]/10 border border-[#ff1e1e]/30 rounded-xl p-4">
                <p className="text-white font-medium mb-2">⚠️ Importante:</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>A produção é iniciada após confirmação de pagamento e envio completo das informações necessárias.</li>
                  <li><strong className="text-white">Após início da fabricação, não será possível cancelamento.</strong></li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

export default TermosDeUso
