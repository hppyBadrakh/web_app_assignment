import { HashRouter, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/test-history" element={<TestHistory />} />
        <Route path="/payment-info" element={<PaymentInfo />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/help" element={<Help />} />
      </Routes>
      <Footer />
    </HashRouter>
  )
}

export default App
