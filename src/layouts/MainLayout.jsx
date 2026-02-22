/**
 * MainLayout Component
 * Layout principal com Header, Footer e WhatsApp button
 */

import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { WhatsAppButton } from '../components/UI'

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header />
      
      {/* Conteúdo principal com espaço para header fixo */}
      <main className="flex-1 pt-16 md:pt-20">
        <Outlet />
      </main>
      
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default MainLayout
