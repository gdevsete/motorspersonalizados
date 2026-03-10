/**
 * Home Page
 * Página inicial com hero, como funciona, galeria, depoimentos e CTA
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FiUpload, FiEdit3, FiPackage, FiStar, FiArrowRight, FiCheck, FiChevronLeft, FiChevronRight, FiShield, FiHelpCircle, FiChevronDown } from 'react-icons/fi'
import { getTestimonials } from '../../services/testimonialService'
import { TestimonialSkeleton } from '../../components/UI/Skeleton'
import ImageGallery from '../../components/Gallery/ImageGallery'

const Home = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [heroImageIndex, setHeroImageIndex] = useState(0)
  const [testimonialPage, setTestimonialPage] = useState(0)
  const testimonialRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Depoimentos fictícios com fotos
  const fakeTestimonials = [
    { nome: 'Carlos Mendes', cidade: 'São Paulo, SP', comentario: 'Ficou incrível! A miniatura ficou igualzinha à minha Honda CB 300. Recomendo demais!', nota: 5, foto: '/images/banners/avatar1.jpg' },
    { nome: 'Ana Paula Silva', cidade: 'Rio de Janeiro, RJ', comentario: 'Presente perfeito pro meu marido. Ele amou a miniatura da Hornet dele! Qualidade impecável.', nota: 5, foto: '/images/banners/avatar2.jpg' },
    { nome: 'Ricardo Santos', cidade: 'Curitiba, PR', comentario: 'Atendimento nota 10 e produto de altíssima qualidade. Já encomendei o segundo chaveiro!', nota: 5, foto: '/images/banners/avatar3.jpg' },
    { nome: 'Fernanda Costa', cidade: 'Belo Horizonte, MG', comentario: 'Meu namorado chorou quando viu a miniatura da XJ6 dele. Ficou perfeita nos mínimos detalhes!', nota: 5, foto: '/images/banners/avatar4.jpg' },
    { nome: 'João Pedro Alves', cidade: 'Porto Alegre, RS', comentario: 'Comprei para mim e já encomendei mais 3 para os amigos do grupo de motociclistas. Sensacional!', nota: 5, foto: '/images/banners/avatar5.jpg' },
    { nome: 'Mariana Oliveira', cidade: 'Salvador, BA', comentario: 'A pintura ficou idêntica à minha moto. Parece uma foto em miniatura! Amei cada detalhe.', nota: 5, foto: '/images/banners/avatar6.jpg' },
    { nome: 'Thiago Ribeiro', cidade: 'Brasília, DF', comentario: 'Entrega super rápida e embalagem caprichada. A miniatura da minha Fazer 250 ficou show!', nota: 5, foto: '/images/banners/avatar7.jpg' },
    { nome: 'Juliana Martins', cidade: 'Recife, PE', comentario: 'Dei de aniversário pro meu pai e ele adorou! A CG 160 dele em miniatura ficou linda.', nota: 5, foto: '/images/banners/avatar8.jpg' },
    { nome: 'Lucas Ferreira', cidade: 'Goiânia, GO', comentario: 'Qualidade premium! Os detalhes da corrente e dos pneus são impressionantes. Vale cada centavo!', nota: 5, foto: '/images/banners/avatar9.jpg' },
    { nome: 'Camila Souza', cidade: 'Florianópolis, SC', comentario: 'Terceira vez que compro. Dessa vez foi a PCX da minha mãe. Ela amou o presente!', nota: 5, foto: '/images/banners/avatar10.jpg' },
    { nome: 'Bruno Nascimento', cidade: 'Manaus, AM', comentario: 'Nunca vi um chaveiro tão bem feito. A Africa Twin ficou IDÊNTICA. Parabéns pelo trabalho!', nota: 5, foto: '/images/banners/avatar11.jpg' },
    { nome: 'Patricia Lima', cidade: 'Fortaleza, CE', comentario: 'Encomendei receosa, mas superou todas as expectativas. Produto de qualidade excepcional!', nota: 5, foto: '/images/banners/avatar12.jpg' },
  ]

  // Total de páginas (3 depoimentos por página)
  const totalPages = Math.ceil(fakeTestimonials.length / 3)
  const currentTestimonials = fakeTestimonials.slice(testimonialPage * 3, testimonialPage * 3 + 3)

  // Imagens do carrossel hero
  const heroImages = [
    '/images/galeria/cb300.png',
    '/images/galeria/hornet.png',
    '/images/galeria/xj6.png',
    '/images/galeria/africatwin.png',
    '/images/galeria/tenere.png',
    '/images/galeria/r15.png',
    '/images/galeria/cg160.png',
    '/images/galeria/fz25-2026.png',
    '/images/galeria/lander.png',
    '/images/galeria/pcx.png',
    '/images/galeria/sahara.png',
    '/images/galeria/hondabiz.png',
    '/images/galeria/160top.png',
  ]

  // Carregar depoimentos
  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await getTestimonials()
      if (data) {
        setTestimonials(data.slice(0, 3)) // Limitar a 3 depoimentos
      }
      setLoadingTestimonials(false)
    }
    fetchTestimonials()
  }, [])

  // Rotação aleatória das imagens do hero a cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex(prev => {
        let newIndex
        do {
          newIndex = Math.floor(Math.random() * heroImages.length)
        } while (newIndex === prev && heroImages.length > 1)
        return newIndex
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  // Auto-rotate dos depoimentos a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialPage(prev => (prev + 1) % totalPages)
    }, 5000)
    return () => clearInterval(interval)
  }, [totalPages])

  // Handlers de swipe para depoimentos
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50 // Mínimo de pixels para considerar swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe para esquerda - próxima página
        setTestimonialPage(prev => (prev + 1) % totalPages)
      } else {
        // Swipe para direita - página anterior
        setTestimonialPage(prev => (prev - 1 + totalPages) % totalPages)
      }
    }
  }, [totalPages])

  // Passos "Como funciona"
  const steps = [
    {
      icon: FiUpload,
      title: 'Envie sua foto',
      description: 'Faça upload da foto da sua moto. Pode ser qualquer ângulo que preferir.',
    },
    {
      icon: FiEdit3,
      title: 'Personalize',
      description: 'Escolha as cores, adicione seu nome, placa e detalhes exclusivos.',
    },
    {
      icon: FiPackage,
      title: 'Receba em casa',
      description: 'Sua miniatura exclusiva será produzida e enviada com carinho.',
    },
  ]

  // Galeria de exemplos - 13 imagens
  const gallery = [
    { id: 1, src: '/images/galeria/cb300.png', alt: 'Miniatura Honda CB 300' },
    { id: 2, src: '/images/galeria/hornet.png', alt: 'Miniatura Honda Hornet' },
    { id: 3, src: '/images/galeria/xj6.png', alt: 'Miniatura Yamaha XJ6' },
    { id: 4, src: '/images/galeria/africatwin.png', alt: 'Miniatura Honda Africa Twin' },
    { id: 5, src: '/images/galeria/tenere.png', alt: 'Miniatura Yamaha Ténéré' },
    { id: 6, src: '/images/galeria/r15.png', alt: 'Miniatura Yamaha R15' },
    { id: 7, src: '/images/galeria/cg160.png', alt: 'Miniatura Honda CG 160' },
    { id: 8, src: '/images/galeria/fz25-2026.png', alt: 'Miniatura Yamaha FZ25' },
    { id: 9, src: '/images/galeria/lander.png', alt: 'Miniatura Yamaha Lander' },
    { id: 10, src: '/images/galeria/pcx.png', alt: 'Miniatura Honda PCX' },
    { id: 11, src: '/images/galeria/sahara.png', alt: 'Miniatura Honda Sahara' },
    { id: 12, src: '/images/galeria/hondabiz.png', alt: 'Miniatura Honda Biz' },
    { id: 13, src: '/images/galeria/160top.png', alt: 'Miniatura Honda 160 Top' },
  ]

  // Benefícios
  const benefits = [
    'Peça única e exclusiva',
    'Alta qualidade de acabamento',
    'Frete grátis para todo Brasil',
    'Garantia de 7 dias',
  ]

  // FAQ - Perguntas frequentes
  const [openFaq, setOpenFaq] = useState(null)
  const faqs = [
    { q: 'Quanto tempo demora para receber?', a: 'O prazo de produção é de 3-5 dias úteis. Após a postagem, o prazo de entrega varia de acordo com a modalidade de frete escolhida (2 a 8 dias úteis).' },
    { q: 'Posso personalizar qualquer modelo de moto?', a: 'Sim! Trabalhamos com todos os modelos de motos. Basta enviar uma foto da sua moto que criamos a miniatura personalizada.' },
    { q: 'E se eu não gostar do resultado?', a: 'Oferecemos garantia de 7 dias. Se você não ficar satisfeito, devolvemos seu dinheiro ou refazemos a miniatura.' },
    { q: 'Como funciona o pagamento?', a: 'Aceitamos PIX com confirmação instantânea. Após o pagamento, sua miniatura entra imediatamente em produção.' },
    { q: 'O chaveiro é resistente?', a: 'Sim! Utilizamos metal die-cast (zamac), ABS de engenharia e aço niquelado. É feito para uso diário.' },
  ]

  return (
    <div className="min-h-screen">
      {/* Espaçador para header fixo */}
      <div className="h-20 md:h-24" aria-hidden="true"></div>
      
      {/* Hero Section */}
      <section className="relative gradient-bg pb-8 md:min-h-[calc(100vh-6rem)] md:pb-0 md:flex md:items-center">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-[#ff1e1e]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-[#ff1e1e]/5 rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Conteúdo */}
            <div className="animate-fadeIn text-center flex flex-col items-center lg:items-start lg:text-left">
              <h1 className="text-[1.35rem] leading-snug md:text-5xl lg:text-6xl font-bold md:leading-tight mb-2 md:mb-6">
                Transforme sua moto em uma{' '}
                <span className="text-gradient">miniatura única</span>
              </h1>
              
              <p className="text-[0.8rem] leading-relaxed md:text-lg text-gray-400 mb-3 md:mb-8 max-w-lg">
                Crie um chaveiro personalizado com a réplica da sua moto. 
                Design premium, detalhes exclusivos e o carinho que sua paixão merece.
              </p>

              {/* Benefícios rápidos */}
              <ul className="mb-3 md:mb-8 space-y-0 text-left">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 md:gap-3 text-gray-300 text-[0.75rem] md:text-base leading-tight">
                    <FiCheck className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#ff1e1e] flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full sm:w-auto">
                <Link to="/personalizar" className="btn-glow inline-flex items-center justify-center gap-2 text-sm md:text-base py-2.5 md:py-3">
                  Criar minha miniatura
                  <FiArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </Link>
                <a href="#como-funciona" className="btn-outline text-center text-sm md:text-base py-2.5 md:py-3">
                  Como funciona
                </a>
              </div>

              {/* Badge de Garantia */}
              <div className="mt-4 md:mt-6 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 md:px-4 md:py-2.5 w-fit">
                <FiShield className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                <span className="text-green-400 text-xs md:text-sm font-medium">Garantia de 7 dias ou seu dinheiro de volta</span>
              </div>

              {/* Prova social */}
              <div className="mt-4 md:mt-6 flex items-center gap-3 md:gap-6">
                <div className="flex -space-x-2 md:-space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-[#2a2a2a] border-2 border-[#0a0a0a] 
                               flex items-center justify-center text-[0.6rem] md:text-xs text-gray-400"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 md:gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FiStar key={i} className="w-2.5 h-2.5 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-[0.65rem] md:text-sm text-gray-400">+500 clientes satisfeitos</p>
                </div>
              </div>
            </div>

            {/* Imagem/Card visual */}
            <div className="hidden lg:block relative">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Card principal */}
                <div className="absolute inset-4 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] 
                              rounded-3xl border border-[#2a2a2a] shadow-2xl 
                              animate-pulse-glow overflow-hidden">
                  <img 
                    src={heroImages[heroImageIndex]} 
                    alt="Miniatura personalizada"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    className="transition-opacity duration-500"
                    key={heroImageIndex}
                  />
                </div>
                
                {/* Elementos decorativos */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ff1e1e]/20 rounded-xl rotate-12" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-[#ff1e1e]/10 rounded-xl -rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 md:py-28 pb-28 md:pb-36 bg-[#0a0a0a]">
        <div className="container-custom">
          <div className="section-header">
            <span className="section-badge bg-[#1a1a1a] text-[#ff1e1e]">
              Simples e Rápido
            </span>
            <h2 className="section-title">
              Como <span className="text-gradient">funciona</span>
            </h2>
            <p className="section-description">
              Em apenas 3 passos simples, você terá sua miniatura exclusiva em mãos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {steps.map((step, index) => (
              <div
                key={index}
                className="card text-center group hover:border-[#ff1e1e] transition-all duration-300"
              >
                {/* Número do passo */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#ff1e1e] 
                              rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                {/* Ícone */}
                <div className="w-16 h-16 mx-auto mb-6 bg-[#ff1e1e]/10 rounded-2xl 
                              flex items-center justify-center group-hover:bg-[#ff1e1e]/20 
                              transition-colors duration-300">
                  <step.icon className="w-8 h-8 text-[#ff1e1e]" />
                </div>
                
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section className="py-20 md:py-28 pb-28 md:pb-36 bg-[#1a1a1a]">
        <div className="container-custom">
          <div className="section-header">
            <span className="section-badge bg-[#0a0a0a] text-[#ff1e1e]">
              Inspiração
            </span>
            <h2 className="section-title">
              Nossa <span className="text-gradient">Galeria</span>
            </h2>
            <p className="section-description">
              Confira alguns exemplos de miniaturas que já criamos
            </p>
          </div>

          <ImageGallery images={gallery} />
        </div>
      </section>

      {/* Materiais e Qualidade */}
      <section className="py-20 md:py-28 bg-[#0a0a0a] relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-[#ff1e1e]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-[#ff1e1e]/3 rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <div className="section-header">
            <span className="section-badge bg-[#1a1a1a] text-[#ff1e1e]">
              Qualidade Premium
            </span>
            <h2 className="section-title">
              Materiais de <span className="text-gradient">Alto Padrão</span>
            </h2>
            <p className="section-description">
              Nossas miniaturas são produzidas com materiais selecionados para garantir resistência, realismo e acabamento premium.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Metal Die-Cast */}
            <div className="card group hover:border-[#ff1e1e] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff1e1e]/10 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 mb-5 bg-gradient-to-br from-[#ff1e1e]/20 to-[#ff1e1e]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🧱</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Estrutura em Metal Die-Cast</h3>
              <p className="text-gray-400 text-sm mb-4">
                Utilizamos liga metálica de alta resistência (zamac), proporcionando:
              </p>
              <ul className="space-y-2">
                {['Maior durabilidade', 'Peso realista', 'Detalhes mais precisos', 'Sensação premium ao toque'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <FiCheck className="w-4 h-4 text-[#ff1e1e] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ABS de Alta Qualidade */}
            <div className="card group hover:border-[#ff1e1e] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff1e1e]/10 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 mb-5 bg-gradient-to-br from-[#ff1e1e]/20 to-[#ff1e1e]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🧩</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Componentes em ABS Premium</h3>
              <p className="text-gray-400 text-sm mb-4">
                Partes como carenagens, guidão e detalhes estruturais são produzidas em plástico ABS de engenharia:
              </p>
              <ul className="space-y-2">
                {['Precisão nos acabamentos', 'Alta resistência', 'Excelente qualidade de pintura'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <FiCheck className="w-4 h-4 text-[#ff1e1e] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pneus em Borracha */}
            <div className="card group hover:border-[#ff1e1e] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff1e1e]/10 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 mb-5 bg-gradient-to-br from-[#ff1e1e]/20 to-[#ff1e1e]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🛞</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Pneus em Borracha Sintética</h3>
              <p className="text-gray-400 text-sm mb-4">
                Os pneus são fabricados em material flexível de alta qualidade, com textura realista e acabamento semelhante ao original.
              </p>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-2 text-[#ff1e1e] text-sm font-medium">
                  <FiCheck className="w-4 h-4" />
                  Textura realista
                </span>
              </div>
            </div>

            {/* Pintura Profissional */}
            <div className="card group hover:border-[#ff1e1e] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff1e1e]/10 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 mb-5 bg-gradient-to-br from-[#ff1e1e]/20 to-[#ff1e1e]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Pintura com Verniz Protetor</h3>
              <p className="text-gray-400 text-sm mb-4">
                Aplicamos pintura em camadas com acabamento refinado e verniz de proteção:
              </p>
              <ul className="space-y-2">
                {['Cores fiéis à moto original', 'Brilho intenso', 'Maior resistência ao desgaste'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <FiCheck className="w-4 h-4 text-[#ff1e1e] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Corrente e Acessórios */}
            <div className="card group hover:border-[#ff1e1e] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff1e1e]/10 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 mb-5 bg-gradient-to-br from-[#ff1e1e]/20 to-[#ff1e1e]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Acessórios em Aço Niquelado</h3>
              <p className="text-gray-400 text-sm mb-4">
                Corrente e acessórios produzidos em aço niquelado para garantir resistência e durabilidade no uso diário como chaveiro.
              </p>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-2 text-[#ff1e1e] text-sm font-medium">
                  <FiCheck className="w-4 h-4" />
                  Uso diário garantido
                </span>
              </div>
            </div>

            {/* Card destaque */}
            <div className="card group bg-gradient-to-br from-[#ff1e1e]/20 to-[#ff1e1e]/5 border-[#ff1e1e]/30 hover:border-[#ff1e1e] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff1e1e]/20 to-transparent rounded-bl-full"></div>
              <div className="w-14 h-14 mb-5 bg-gradient-to-br from-[#ff1e1e] to-[#cc0000] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#ff1e1e]/30">
                <span className="text-3xl">🔩</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Qualidade Garantida</h3>
              <p className="text-gray-300 text-sm mb-4">
                Cada miniatura passa por rigoroso controle de qualidade antes do envio, garantindo que você receba um produto perfeito.
              </p>
              <Link 
                to="/personalizar"
                className="inline-flex items-center gap-2 text-[#ff1e1e] font-semibold text-sm hover:gap-3 transition-all"
              >
                Criar minha miniatura
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos - Carrossel */}
      <section className="py-24 md:py-32 bg-[#0a0a0a] overflow-hidden">
        <div className="container-custom">
          <div className="section-header">
            <span className="section-badge bg-[#1a1a1a] text-[#ff1e1e]">
              Avaliações
            </span>
            <h2 className="section-title">
              O que nossos clientes <span className="text-gradient">dizem</span>
            </h2>
            <p className="section-description">
              Mais de 500 clientes satisfeitos com suas miniaturas exclusivas
            </p>
          </div>

          {/* Carrossel */}
          <div 
            ref={testimonialRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
          >
            {/* Botões de navegação - Desktop */}
            <button
              onClick={() => setTestimonialPage(prev => (prev - 1 + totalPages) % totalPages)}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-[#1a1a1a] hover:bg-[#ff1e1e] border border-[#2a2a2a] hover:border-[#ff1e1e] rounded-full items-center justify-center transition-all duration-300 shadow-lg"
              aria-label="Anterior"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setTestimonialPage(prev => (prev + 1) % totalPages)}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-[#1a1a1a] hover:bg-[#ff1e1e] border border-[#2a2a2a] hover:border-[#ff1e1e] rounded-full items-center justify-center transition-all duration-300 shadow-lg"
              aria-label="Próximo"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>

            {/* Cards de depoimentos */}
            <div className="grid md:grid-cols-3 gap-6 transition-all duration-500 ease-in-out">
              {currentTestimonials.map((testimonial, index) => (
                <div 
                  key={`${testimonialPage}-${index}`} 
                  className="card animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.nota
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Comentário */}
                  <p className="text-gray-300 mb-6 italic leading-relaxed">
                    "{testimonial.comentario}"
                  </p>
                  
                  {/* Autor com foto */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full overflow-hidden border-2 border-[#ff1e1e]/30 shrink-0">
                      <img 
                        src={testimonial.foto} 
                        alt={testimonial.nome}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.nome}</p>
                      <p className="text-sm text-gray-500">{testimonial.cidade}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Indicadores de página */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialPage(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === testimonialPage 
                      ? 'w-8 h-3 bg-[#ff1e1e]' 
                      : 'w-3 h-3 bg-[#2a2a2a] hover:bg-[#ff1e1e]/50'
                  }`}
                  aria-label={`Ir para página ${i + 1}`}
                />
              ))}
            </div>

            {/* Dica de swipe - Mobile */}
            <p className="text-center text-gray-500 text-xs mt-4 md:hidden">
              ← Deslize para ver mais →
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-28 md:py-36 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-[600px] h-[600px] bg-[#ff1e1e]/5 rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10 flex justify-center">
          <div className="max-w-3xl w-full text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para criar sua{' '}
              <span className="text-gradient">miniatura exclusiva</span>?
            </h2>
            <p className="text-lg text-gray-400 mb-10 mx-auto">
              Transforme sua paixão em arte. Comece agora mesmo a personalizar 
              seu chaveiro com a miniatura da sua moto.
            </p>
            <div className="flex justify-center">
              <Link
                to="/personalizar"
                className="btn-glow inline-flex items-center justify-center gap-2 text-lg py-4 px-8"
              >
                Começar personalização
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="mt-6 text-gray-500 text-sm">
              <span className="line-through text-gray-600">De R$ 99,00</span>{' '}
              <span className="text-[#ff1e1e] font-bold">por R$ 79,00</span> • Frete Grátis
            </p>
          </div>
        </div>
      </section>

      {/* FAQ - Perguntas Frequentes */}
      <section className="py-20 md:py-28 bg-[#0a0a0a]">
        <div className="container-custom">
          <div className="section-header">
            <span className="section-badge bg-[#1a1a1a] text-[#ff1e1e]">
              Dúvidas
            </span>
            <h2 className="section-title">
              Perguntas <span className="text-gradient">Frequentes</span>
            </h2>
            <p className="section-description">
              Tire suas dúvidas antes de fazer seu pedido
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="card cursor-pointer hover:border-[#ff1e1e]/50 transition-all duration-300"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FiHelpCircle className="w-5 h-5 text-[#ff1e1e] flex-shrink-0" />
                    <h3 className="font-semibold text-white">{faq.q}</h3>
                  </div>
                  <FiChevronDown 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
                {openFaq === index && (
                  <p className="mt-4 text-gray-400 text-sm leading-relaxed animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home