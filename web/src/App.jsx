import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AdminLayout from './components/layout/AdminLayout'
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
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminExams from './pages/admin/AdminExams'
import AdminCompetitions from './pages/admin/AdminCompetitions'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminProtectedRoute({ children }) {
  const { adminUser, loading } = useAdminAuth()
  if (loading) return null
  if (!adminUser) return <Navigate to="/admin/login" replace />
  return children
}

function AppShell() {
  const location = useLocation()
  const isAdmin  = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Navbar />}
      <div role="status" aria-live="polite" className="sr-only" id="live-region" />
      <Routes>
        {/* Public routes */}
        <Route path="/"             element={<Home />} />
        <Route path="/tests"        element={<Tests />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/help"         element={<Help />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/signup"       element={<Signup />} />

        {/* User protected routes */}
        <Route path="/test/:id"        element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/test-history"    element={<ProtectedRoute><TestHistory /></ProtectedRoute>} />
        <Route path="/payment-info"    element={<ProtectedRoute><PaymentInfo /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

        {/* Admin login — public */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin protected routes — wrapped in AdminLayout */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="exams"        element={<AdminExams />} />
          <Route path="competitions" element={<AdminCompetitions />} />
        </Route>
      </Routes>
      {!isAdmin && <Footer />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
