/**
 * MainLayout Component
 * Layout principal com Header, Footer e Chat de suporte
 */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import { updatePresence } from '../services/visitorService'

const MainLayout = () => {
  const location = useLocation()

  // Rastrear visitante (com tratamento de erro silencioso)
  useEffect(() => {
    // Atualizar presença quando página mudar (silenciosamente)
    const trackVisitor = async () => {
      try {
        await updatePresence(location.pathname)
      } catch (err) {
        // Silenciar erros de rastreamento - não é crítico
        console.debug('Rastreamento de visitante falhou:', err)
      }
    }
    
    trackVisitor()

    // Atualizar presença a cada 60 segundos (menos frequente)
    const interval = setInterval(trackVisitor, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header />
      
      {/* Conteúdo principal com espaço para header fixo */}
      <main className="flex-1" style={{ paddingTop: '120px' }}>
        <Outlet />
      </main>
      
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default MainLayout
