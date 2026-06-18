import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Hero from './pages/Hero'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Library from './pages/Library'
import Chat from './pages/Chat'
import PricingPage from './pages/PricingPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import UpgradePage from './pages/UpgradePage'

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/chat/:bookId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
