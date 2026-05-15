import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const inputStyle = {
  width: '100%', padding: '12px 16px', border: '2px solid #1a1a1a',
  borderRadius: 12, fontSize: '1rem', fontFamily: 'Arial, Helvetica, sans-serif',
  background: '#f9f9f9', outline: 'none', boxSizing: 'border-box',
}

export default function AdminLogin() {
  const navigate       = useNavigate()
  const { adminLogin } = useAdminAuth()

  const [adminCode, setAdminCode] = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      adminLogin(data.token, data.user)
      navigate('/admin')
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', padding: 20 }}>
      <div className="brutal" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🛡️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 6 }}>Admin Login</h1>
          <p style={{ color: '#666' }}>TestHub Administration</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontWeight: 700, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 800, display: 'block', marginBottom: 6 }}>Admin Code</label>
            <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)}
              placeholder="Enter admin code" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} className="btn-brutal"
            style={{ width: '100%', background: '#1a1a1a', color: '#fff', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
