/**
 * Recuperar Senha Page
 * Página de recuperação de senha
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/UI'
import { FiArrowLeft, FiMail, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

const RecuperarSenha = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error('Informe seu email')
      return
    }

    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      toast.error(error.message || 'Erro ao enviar email')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full 
                          flex items-center justify-center">
              <FiCheck className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Email enviado!</h1>
            <p className="text-gray-400 mb-6">
              Enviamos um link de recuperação para <strong>{email}</strong>. 
              Verifique sua caixa de entrada.
            </p>
            <Link to="/login" className="btn-outline inline-block">
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Voltar */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Voltar para login
        </Link>

        {/* Card */}
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#ff1e1e]/20 rounded-full 
                          flex items-center justify-center">
              <FiMail className="w-8 h-8 text-[#ff1e1e]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Recuperar senha</h1>
            <p className="text-gray-400">
              Informe seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />

            <Button type="submit" fullWidth loading={loading}>
              Enviar link de recuperação
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RecuperarSenha
