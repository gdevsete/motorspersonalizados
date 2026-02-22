/**
 * AuthContext - Contexto de Autenticação
 * Gerencia estado de autenticação globalmente na aplicação
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Criação do contexto
const AuthContext = createContext({})

/**
 * Provider de Autenticação
 * Envolve a aplicação e fornece estado e métodos de autenticação
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Emails com permissão de admin
  const ADMIN_EMAILS = [
    'admin@motorspersonalizados.com', 
    'guilherme@admin.com',
    'gdevsete@outlook.com.br'
  ]

  // Verificar se usuário é admin (síncrono, usando email da sessão)
  const checkAdminStatus = (userEmail) => {
    const isAdminUser = ADMIN_EMAILS.includes(userEmail?.toLowerCase() || '')
    setIsAdmin(isAdminUser)
    console.debug('Admin status:', userEmail, isAdminUser)
    return isAdminUser
  }

  useEffect(() => {
    // Flag para evitar atualizações após desmontagem
    let mounted = true

    // Timeout de segurança - se demorar mais de 5s, para de carregar
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.debug('Autenticação: timeout atingido, continuando sem sessão')
        setLoading(false)
      }
    }, 5000)

    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          // Verificar admin usando email da sessão (síncrono)
          if (session?.user?.email) {
            checkAdminStatus(session.user.email)
          }
        }
      } catch (error) {
        console.debug('Erro ao obter sessão:', error.message)
      } finally {
        if (mounted) {
          setLoading(false)
          clearTimeout(timeout)
        }
      }
    }

    getInitialSession()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          // Verificar admin usando email da sessão
          if (session?.user?.email) {
            checkAdminStatus(session.user.email)
          } else {
            setIsAdmin(false)
          }
          setLoading(false)
        }
      }
    )

    // Cleanup do listener
    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  /**
   * Cadastrar novo usuário
   */
  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Login com email e senha
   */
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Logout
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
      setIsAdmin(false)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  /**
   * Recuperação de senha
   */
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Atualizar senha
   */
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Valor do contexto
  const value = {
    user,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook useAuth
 * Uso: const { user, signIn, signOut } = useAuth()
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export default AuthContext
