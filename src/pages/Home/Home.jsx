/**
 * Home Page
 * Página inicial com hero, como funciona, galeria, depoimentos e CTA
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiUpload, FiEdit3, FiPackage, FiStar, FiArrowRight, FiCheck } from 'react-icons/fi'
import { getTestimonials } from '../../services/testimonialService'
import { TestimonialSkeleton } from '../../components/UI/Skeleton'
import ImageGallery from '../../components/Gallery/ImageGallery'

const Home = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [heroImageIndex, setHeroImageIndex] = useState(0)

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
    'Entrega para todo Brasil',
    'Garantia de satisfação',
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

              {/* Prova social */}
              <div className="mt-4 md:mt-10 flex items-center gap-3 md:gap-6">
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

      {/* Depoimentos */}
      <section className="py-24 md:py-32 bg-[#0a0a0a]">
        <div className="container-custom">
          <div className="section-header">
            <span className="section-badge bg-[#1a1a1a] text-[#ff1e1e]">
              Avaliações
            </span>
            <h2 className="section-title">
              O que nossos clientes <span className="text-gradient">dizem</span>
            </h2>
            <p className="section-description">
              Depoimentos reais de quem já transformou sua moto em miniatura
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {loadingTestimonials ? (
              // Skeletons
              [1, 2, 3].map((i) => <TestimonialSkeleton key={i} />)
            ) : testimonials.length > 0 ? (
              // Depoimentos reais
              testimonials.map((testimonial) => (
                <div key={testimonial.id} className="card">
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
                  <p className="text-gray-300 mb-6 italic">
                    "{testimonial.comentario}"
                  </p>
                  
                  {/* Autor */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff1e1e]/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#ff1e1e]">
                        {testimonial.nome.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.nome}</p>
                      <p className="text-sm text-gray-500">{testimonial.cidade}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Depoimentos placeholder
              [
                { nome: 'Carlos M.', cidade: 'São Paulo, SP', comentario: 'Ficou incrível! A miniatura ficou igualzinha à minha moto. Recomendo demais!', nota: 5 },
                { nome: 'Ana Paula', cidade: 'Rio de Janeiro, RJ', comentario: 'Presente perfeito pro meu marido. Ele amou! Qualidade impecável.', nota: 5 },
                { nome: 'Ricardo S.', cidade: 'Curitiba, PR', comentario: 'Atendimento nota 10 e produto de altíssima qualidade. Já encomendei o segundo!', nota: 5 },
              ].map((testimonial, index) => (
                <div key={index} className="card">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">
                    "{testimonial.comentario}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff1e1e]/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#ff1e1e]">
                        {testimonial.nome.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.nome}</p>
                      <p className="text-sm text-gray-500">{testimonial.cidade}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
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
              A partir de R$ 79,00 • Entrega para todo Brasil
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
