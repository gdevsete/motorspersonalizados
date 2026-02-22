/**
 * App Component
 * Configuração de rotas da aplicação
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layouts
import { MainLayout } from './layouts'

// Pages
import { 
  Home, 
  Personalizar, 
  Login, 
  Cadastro, 
  RecuperarSenha, 
  MinhaConta,
  Admin,
  TermosDeUso
} from './pages'

// Components
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #2a2a2a',
          },
          success: {
            iconTheme: {
              primary: '#ff1e1e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff1e1e',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Rotas com layout principal */}
        <Route element={<MainLayout />}>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/personalizar" element={<Personalizar />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />

          {/* Protegidas - Usuário */}
          <Route
            path="/minha-conta"
            element={
              <ProtectedRoute>
                <MinhaConta />
              </ProtectedRoute>
            }
          />

          {/* Admin - verificação interna */}
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
