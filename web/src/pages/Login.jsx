import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  // Формын талбарын утгууд
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // UI-ийн төлөв
  const [error,   setError]   = useState('')   // хэрэглэгчид харуулах алдааны мессеж
  const [loading, setLoading] = useState(false) // серверийг хүлээж байхад true байна

  // ── handleSubmit ─────────────────────────────────────────────────────────────
  // Хэрэглэгч "Нэвтрэх" товчийг дарах үед ажиллана.
  // Хэрэглэгчийн нэр болон нууц үгийг серверт илгээж хариуг боловсруулна.
  async function handleSubmit(e) {
    e.preventDefault() // хөтчийг хуудсыг дахин ачаалахаас зогсооно
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Сервер алдаа буцаалаа (буруу нууц үг, хаалт гэх мэт)
        let msg = data.error || 'Нэвтрэхэд алдаа гарлаа'
        if (data.remainingAttempts !== undefined) {
          msg += ` (${data.remainingAttempts} оролдлого үлдлээ)`
        }
        setError(msg)
        return
      }

      // Нэвтрэлт амжилттай — токеныг хадгалаад нүүр хуудсруу шилжинэ
      login(data.user)
      navigate('/')
    } catch {
      setError('Сервертэй холбогдож чадсангүй')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="brutal" style={{ width: '100%', maxWidth: 420, padding: 40 }}>

        {/* Гарчиг */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔐</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 6 }}>Нэвтрэх</h1>
          <p style={{ color: '#666' }}>TestHub-д тавтай морил</p>
        </div>

        {/* Алдааны хайрцаг — зөвхөн алдаа гарахад харагдана */}
        {error && (
          <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontWeight: 700, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Хэрэглэгчийн нэрийн талбар */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 800, display: 'block', marginBottom: 6 }}>
              Хэрэглэгчийн нэр
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              required
              style={inputStyle}
            />
          </div>

          {/* Нууц үгийн талбар */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 800, display: 'block', marginBottom: 6 }}>
              Нууц үг
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {/* Илгээх товч */}
          <button
            type="submit"
            disabled={loading}
            className="btn-brutal green-btn"
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
          </button>
        </form>

        {/* Бүртгүүлэх холбоос */}
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
          Бүртгэл байхгүй юу?{' '}
          <Link to="/signup" style={{ color: 'var(--green)', fontWeight: 800 }}>
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #1a1a1a',
  borderRadius: 12,
  fontSize: '1rem',
  fontFamily: 'Arial, Helvetica, sans-serif',
  background: '#f9f9f9',
  outline: 'none',
  boxSizing: 'border-box',
}

export default Login
