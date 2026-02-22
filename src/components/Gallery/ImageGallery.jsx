/**
 * ImageGallery Component
 * Carrossel de imagens com lightbox
 * - Mobile: arrastar para passar imagens
 * - Desktop: setas de navegação
 * - Clique para ampliar com navegação
 */

import { useState, useRef, useEffect } from 'react'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

const ImageGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const carouselRef = useRef(null)

  // Navegação do carrossel
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Touch handlers para swipe no carrossel
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextSlide()
    }
    if (touchStart - touchEnd < -75) {
      prevSlide()
    }
  }

  // Lightbox handlers
  const openLightbox = (index) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = 'auto'
  }

  const nextLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length)
  }

  const prevLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Touch handlers para swipe no lightbox
  const [lightboxTouchStart, setLightboxTouchStart] = useState(0)
  const [lightboxTouchEnd, setLightboxTouchEnd] = useState(0)

  const handleLightboxTouchStart = (e) => {
    setLightboxTouchStart(e.targetTouches[0].clientX)
  }

  const handleLightboxTouchMove = (e) => {
    setLightboxTouchEnd(e.targetTouches[0].clientX)
  }

  const handleLightboxTouchEnd = () => {
    if (lightboxTouchStart - lightboxTouchEnd > 75) {
      nextLightbox()
    }
    if (lightboxTouchStart - lightboxTouchEnd < -75) {
      prevLightbox()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return
      if (e.key === 'ArrowRight') nextLightbox()
      if (e.key === 'ArrowLeft') prevLightbox()
      if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen])

  // Calcular quantas imagens mostrar por vez
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 4
    if (window.innerWidth < 640) return 2
    if (window.innerWidth < 1024) return 3
    return 4
  }

  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* Carrossel */}
      <div className="relative">
        {/* Container do carrossel */}
        <div
          ref={carouselRef}
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            }}
          >
            {images.map((item, index) => (
              <div
                key={item.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div
                  onClick={() => openLightbox(index)}
                  className="rounded-2xl overflow-hidden border border-[#2a2a2a] hover:border-[#ff1e1e]/50 
                           transition-all duration-300 group cursor-pointer"
                  style={{ height: '280px' }}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    className="group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setas de navegação - Desktop */}
        <button
          onClick={prevSlide}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4
                   w-12 h-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full
                   items-center justify-center text-white hover:bg-[#ff1e1e] 
                   hover:border-[#ff1e1e] transition-all duration-300 z-10"
          aria-label="Anterior"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4
                   w-12 h-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full
                   items-center justify-center text-white hover:bg-[#ff1e1e] 
                   hover:border-[#ff1e1e] transition-all duration-300 z-10"
          aria-label="Próximo"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>

        {/* Indicadores */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(images.length / visibleCount) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * visibleCount)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                Math.floor(currentIndex / visibleCount) === index
                  ? 'bg-[#ff1e1e] w-6'
                  : 'bg-[#2a2a2a] hover:bg-[#ff1e1e]/50'
              }`}
              aria-label={`Ir para página ${index + 1}`}
            />
          ))}
        </div>

        {/* Instrução de swipe no mobile */}
        <p className="text-center text-gray-500 text-xs mt-4 md:hidden">
          Arraste para os lados para ver mais
        </p>
      </div>

      {/* Lightbox / Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Botão fechar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 bg-[#1a1a1a] border border-[#2a2a2a] 
                     rounded-full flex items-center justify-center text-white 
                     hover:bg-[#ff1e1e] hover:border-[#ff1e1e] transition-all duration-300 z-10"
            aria-label="Fechar"
          >
            <FiX className="w-6 h-6" />
          </button>

          {/* Setas de navegação */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              prevLightbox()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2
                     w-12 h-12 bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-full
                     flex items-center justify-center text-white hover:bg-[#ff1e1e] 
                     hover:border-[#ff1e1e] transition-all duration-300 z-10"
            aria-label="Anterior"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextLightbox()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2
                     w-12 h-12 bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-full
                     flex items-center justify-center text-white hover:bg-[#ff1e1e] 
                     hover:border-[#ff1e1e] transition-all duration-300 z-10"
            aria-label="Próximo"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>

          {/* Imagem ampliada */}
          <div
            className="max-w-[90vw] max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <img
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>

          {/* Contador */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 
                        bg-[#1a1a1a]/80 px-4 py-2 rounded-full text-white text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}

export default ImageGallery
