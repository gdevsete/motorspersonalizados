/**
 * Header Component
 * Navegação principal da aplicação
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings } from 'react-icons/fi'
import toast from 'react-hot-toast'

// Email do administrador
const ADMIN_EMAIL = 'gordao@gmail.com'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Verificar se é admin
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  // Verificar se link está ativo
  const isActive = (path) => location.pathname === path

  // Logout
  const handleLogout = async () => {
    try {
      // Tentar logout pelo Supabase diretamente
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erro no logout:', error)
        toast.error('Erro ao sair. Tente novamente.')
        return
      }
      
      // Limpar storage local
      localStorage.removeItem('sb-' + window.location.hostname + '-auth-token')
      sessionStorage.clear()
      
      toast.success('Você saiu da conta')
      setIsMenuOpen(false)
      navigate('/')
      
      // Forçar reload para limpar estado
      window.location.reload()
    } catch (err) {
      console.error('Erro inesperado no logout:', err)
      toast.error('Erro ao sair')
    }
  }

  // Links de navegação
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/personalizar', label: 'Personalizar' },
    { path: '/rastreio', label: 'Rastrear Pedido' },
  ]

  return (
    <header className="fixed top-[28px] sm:top-[32px] left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Motors Personalizados" 
              className="h-8 sm:h-10 md:h-14 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors duration-300
                  ${isActive(link.path) 
                    ? 'text-[#ff1e1e]' 
                    : 'text-gray-300 hover:text-white'
                  }
                `}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#ff1e1e] rounded-full" />
                )}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/minha-conta"
                  className={`flex items-center gap-2 font-medium transition-colors duration-300
                    ${isActive('/minha-conta') 
                      ? 'text-[#ff1e1e]' 
                      : 'text-gray-300 hover:text-white'
                    }
                  `}
                >
                  <FiUser className="w-4 h-4" />
                  Minha Conta
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 font-medium transition-colors duration-300
                      ${isActive('/admin') 
                        ? 'text-[#ff1e1e]' 
                        : 'text-gray-300 hover:text-white'
                      }
                    `}
                  >
                    <FiSettings className="w-4 h-4" />
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="btn-glow text-sm py-2 px-4"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#2a2a2a] animate-fadeIn">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`py-2 font-medium transition-colors
                    ${isActive(link.path) 
                      ? 'text-[#ff1e1e]' 
                      : 'text-gray-300 hover:text-white'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    to="/minha-conta"
                    onClick={() => setIsMenuOpen(false)}
                    className="py-2 flex items-center gap-2 text-gray-300 hover:text-white"
                  >
                    <FiUser className="w-4 h-4" />
                    Minha Conta
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="py-2 flex items-center gap-2 text-gray-300 hover:text-white"
                    >
                      <FiSettings className="w-4 h-4" />
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="py-2 flex items-center gap-2 text-red-500"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Sair
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-center py-2 border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-white hover:border-[#ff1e1e] transition-all"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={() => setIsMenuOpen(false)}
                    className="btn-glow text-center"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
