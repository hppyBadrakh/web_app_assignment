import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
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

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navbar />
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/tests"          element={<Tests />} />
          <Route path="/competitions"   element={<Competitions />} />
          <Route path="/profile"        element={<Profile />} />
          <Route path="/test-history"   element={<TestHistory />} />
          <Route path="/payment-info"   element={<PaymentInfo />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/help"           element={<Help />} />
          <Route path="/test/:id"       element={<TakeTest />} />
          {/* Auth pages */}
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
        </Routes>
        <Footer />
      </HashRouter>
    </AuthProvider>
  )
}

export default App
