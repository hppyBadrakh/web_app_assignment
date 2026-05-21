import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Signup() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  // Формын талбарын утгууд
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // UI-ийн төлөв
  const [errors,  setErrors]  = useState([]) // серверийн баталгаажуулалтын алдааны жагсаалт
  const [loading, setLoading] = useState(false)

  // ── handleSubmit ─────────────────────────────────────────────────────────────
  // Хэрэглэгч "Бүртгүүлэх" товчийг дарах үед ажиллана.
  // Формын өгөгдлийг серверт илгээж хариуг боловсруулна.
  async function handleSubmit(e) {
    e.preventDefault()
    setErrors([])
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Сервер алдаа буцаалаа — нууц үгийн дүрэм зөрчил олон байж болно
        const list = data.errors?.length ? data.errors : [data.error || 'Бүртгэлд алдаа гарлаа']
        setErrors(list)
        return
      }

      // Бүртгэл амжилттай — хэрэглэгчийг шууд нэвтрүүлнэ
      login(data.user)
      navigate('/')
    } catch {
      setErrors(['Сервертэй холбогдож чадсангүй'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="brutal" style={{ width: '100%', maxWidth: 420, padding: 40 }}>

        {/* Гарчиг */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✏️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 6 }}>Бүртгүүлэх</h1>
          <p style={{ color: '#666' }}>Шинэ бүртгэл үүсгэх</p>
        </div>

        {/* Алдааны жагсаалт — баталгаажуулалтын алдаа байгаа үед харагдана */}
        {errors.length > 0 && (
          <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            {errors.map((err, i) => (
              <p key={i} style={{ fontWeight: 700, color: '#dc2626', marginBottom: i < errors.length - 1 ? 4 : 0 }}>
                • {err}
              </p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Хэрэглэгчийн нэрийн талбар */}
          <div style={{ marginBottom: 18 }}>
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

          {/* И-мэйл хаягийн талбар */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 800, display: 'block', marginBottom: 6 }}>
              И-мэйл хаяг
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              style={inputStyle}
            />
          </div>

          {/* Нууц үгийн талбар */}
          <div style={{ marginBottom: 10 }}>
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

          {/* Нууц үгийн шаардлагын санамж */}
          <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
            Нууц үг дор хаяж 8 тэмдэгт, том болон жижиг үсэг, тоо, тусгай тэмдэгт агуулсан байх ёстой.
          </p>

          {/* Илгээх товч */}
          <button
            type="submit"
            disabled={loading}
            className="btn-brutal green-btn"
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
          </button>
        </form>

        {/* Нэвтрэх холбоос */}
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
          Бүртгэлтэй юу?{' '}
          <Link to="/login" style={{ color: 'var(--green)', fontWeight: 800 }}>
            Нэвтрэх
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

export default Signup
