/**
 * Login Page
 * Página de autenticação do usuário
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/UI'
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirecionar para página anterior ou home
  const from = location.state?.from || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Preencha todos os campos')
      return
    }

    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast.error(error.message || 'Email ou senha incorretos')
      setLoading(false)
      return
    }

    toast.success('Login realizado com sucesso!')
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Voltar */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Voltar para home
        </Link>

        {/* Card de Login */}
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Bem-vindo de volta!</h1>
            <p className="text-gray-400">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-[#ff1e1e]" 
                />
                <span className="text-sm text-gray-400">Lembrar-me</span>
              </label>
              <Link 
                to="/recuperar-senha" 
                className="text-sm text-[#ff1e1e] hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Entrar
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Não tem uma conta?{' '}
              <Link to="/cadastro" className="text-[#ff1e1e] hover:underline font-medium">
                Cadastre-se grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
