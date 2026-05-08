import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Tests from './pages/Tests'
import Competitions from './pages/Competitions'
import Profile from './pages/Profile'
import TestHistory from './pages/TestHistory'
import PaymentInfo from './pages/PaymentInfo'
import ChangePassword from './pages/ChangePassword'
import Help from './pages/Help'
import TakeTest from './pages/TakeTest'
import Login from './pages/Login'
import Signup from './pages/Signup'

// нэвтрээгүй бол /login руу шилжүүлнэ
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navbar />
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/tests"        element={<Tests />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/help"         element={<Help />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/signup"       element={<Signup />} />

          <Route path="/test/:id"        element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
          <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/test-history"    element={<ProtectedRoute><TestHistory /></ProtectedRoute>} />
          <Route path="/payment-info"    element={<ProtectedRoute><PaymentInfo /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </HashRouter>
    </AuthProvider>
  )
}

export default App
