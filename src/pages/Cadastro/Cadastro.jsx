/**
 * Cadastro Page
 * Página de registro de novo usuário
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/UI'
import { FiArrowLeft, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { trackCompleteRegistration, trackLead } from '../../utils/metaPixel'

const Cadastro = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validações
    if (!formData.nome || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)

    const { data, error } = await signUp(formData.email, formData.password, {
      nome: formData.nome,
    })

    if (error) {
      toast.error(error.message || 'Erro ao criar conta')
      setLoading(false)
      return
    }

    // Se o Supabase retornou uma sessão, significa que não precisa confirmar email
    if (data?.session) {
      // Meta Pixel - Rastrear registro completo
      trackCompleteRegistration({
        content_name: 'Cadastro de usuário',
        status: 'success'
      })
      toast.success('Conta criada com sucesso!')
      navigate('/minha-conta')
    } else {
      // Precisa confirmar email
      // Meta Pixel - Rastrear lead (aguardando confirmação)
      trackLead({
        content_name: 'Cadastro de usuário',
        content_category: 'Registro'
      })
      toast.success('Conta criada! Verifique seu email para confirmar.')
      navigate('/login')
    }
  }

  // Requisitos de senha
  const passwordRequirements = [
    { label: 'Mínimo 6 caracteres', valid: formData.password.length >= 6 },
  ]

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

        {/* Card de Cadastro */}
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Crie sua conta</h1>
            <p className="text-gray-400">Rápido e fácil para começar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nome completo *"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Seu nome"
              autoComplete="name"
            />

            <Input
              label="Email *"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              autoComplete="email"
            />

            <div>
              <Input
                label="Senha *"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-xs ${
                        req.valid ? 'text-green-500' : 'text-gray-500'
                      }`}
                    >
                      <FiCheck className="w-3 h-3" />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Confirmar senha *"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              error={
                formData.confirmPassword && 
                formData.password !== formData.confirmPassword 
                  ? 'As senhas não coincidem' 
                  : ''
              }
            />

            <div className="pt-2">
              <Button type="submit" fullWidth loading={loading}>
                Criar conta
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-[#ff1e1e] hover:underline font-medium">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cadastro
