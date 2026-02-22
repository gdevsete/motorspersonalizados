/**
 * Footer Component
 * Rodapé completo da aplicação
 */

import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiInstagram, FiFacebook, FiMail, FiMapPin } from 'react-icons/fi'
import { SOCIAL_LINKS } from '../../utils/constants'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const navigate = useNavigate()
  const location = useLocation()

  // Função para navegar e rolar até âncora
  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      // Já está na Home, apenas rola
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // Navega para Home e depois rola
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a] mt-16">
      <div className="container-custom py-20 md:py-24">
        {/* Grid de Links e Contato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Sobre */}
          <div className="text-center">
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Transforme sua moto em uma miniatura exclusiva! 
              Criamos chaveiros personalizados com design premium e detalhes únicos.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center 
                         text-gray-400 hover:text-[#ff1e1e] hover:bg-[#2a2a2a] transition-all"
                aria-label="Instagram"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center 
                         text-gray-400 hover:text-[#ff1e1e] hover:bg-[#2a2a2a] transition-all"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="text-center">
              <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/personalizar" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Personalizar
                  </Link>
                </li>
                <li>
                  <Link to="/minha-conta" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Minha Conta
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/rastreio" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Rastrear Pedido
                  </Link>
                </li>
              </ul>
            </div>

            {/* Informações */}
            <div className="text-center">
              <h3 className="text-white font-semibold mb-4">Informações</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => scrollToSection('como-funciona')} 
                    className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm"
                  >
                    Como Funciona
                  </button>
                </li>
                <li>
                  <Link to="/termos-de-uso#trocas" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Trocas e Devoluções
                  </Link>
                </li>
                <li>
                  <Link to="/termos-de-uso#privacidade" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link to="/termos-de-uso" className="text-gray-400 hover:text-[#ff1e1e] transition-colors text-sm">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div className="text-center">
              <h3 className="text-white font-semibold mb-4">Contato</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-400 text-sm justify-center">
                  <FiMail className="w-4 h-4 text-[#ff1e1e]" />
                  <span>contato@motorspersonalizados.com</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400 text-sm justify-center">
                  <FiMapPin className="w-4 h-4 text-[#ff1e1e] mt-0.5" />
                  <span>Sapiranga, RS - Brasil</span>
                </li>
              </ul>
            </div>
        </div>

        {/* Formas de Envio */}
        <div className="mt-12 pt-8 border-t border-[#2a2a2a]">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500 text-sm mb-4">Formas de Envio</p>
            <div className="flex items-center justify-center gap-12 py-4">
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
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500 text-sm text-center">
              © {currentYear} Motors Personalizados. Todos os direitos reservados.
            </p>
            <p className="text-gray-500 text-xs text-center">
              CNPJ: 61.392.615/0001-03 • Sapiranga, RS - Brasil
            </p>
            <p className="text-gray-600 text-xs">
              Feito com ❤️ para apaixonados por motos
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
