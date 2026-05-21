import { useState } from 'react'
import ProfileSidebar from '../components/layout/ProfileSidebar'

function ChangePassword() {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess(false)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.current || !form.newPass || !form.confirm) {
      setError('Бүх талбарыг бөглөнө үү')
      return
    }
    if (form.newPass.length < 8) {
      setError('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой')
      return
    }
    if (form.newPass !== form.confirm) {
      setError('Шинэ нууц үг таарахгүй байна')
      return
    }
    setSuccess(true)
    setForm({ current: '', newPass: '', confirm: '' })
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="profile-layout">
        <ProfileSidebar />

        <main className="profile-main brutal" style={{ textAlign: 'left' }}>
          <h2 style={{ fontWeight: 900, marginBottom: '8px' }}>🔑 Нууц үг солих</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>Аюулгүй байдлаа хамгаалахын тулд нууц үгээ тогтмол солиорой</p>

          {success && (
            <div style={{ background: '#e8f5e9', border: '2px solid #5eb562', borderRadius: '12px', padding: '15px 20px', marginBottom: '20px', fontWeight: 700, color: '#5eb562' }}>
              ✅ Нууц үг амжилттай солигдлоо!
            </div>
          )}

          {error && (
            <div style={{ background: '#ffeaea', border: '2px solid #c0392b', borderRadius: '12px', padding: '15px 20px', marginBottom: '20px', fontWeight: 700, color: '#c0392b' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { name: 'current', label: 'Одоогийн нууц үг', placeholder: 'Одоогийн нууц үг' },
              { name: 'newPass', label: 'Шинэ нууц үг', placeholder: 'Шинэ нууц үг (8+ тэмдэгт)' },
              { name: 'confirm', label: 'Нууц үг давтах', placeholder: 'Шинэ нууц үгийг давтах' },
            ].map(field => (
              <div key={field.name}>
                <label htmlFor={`cp-${field.name}`} style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>{field.label}</label>
                <input
                  id={`cp-${field.name}`}
                  type="password"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="search-input"
                  placeholder={field.placeholder}
                  style={{ width: '100%' }}
                  autoComplete="off"
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-brutal green-btn btn-inline" style={{ flex: 1 }}>
                🔐 Нууц үг солих
              </button>
              <button type="button" className="btn-brutal white-btn btn-inline" style={{ flex: 1 }} onClick={() => { setForm({ current: '', newPass: '', confirm: '' }); setError(''); setSuccess(false) }}>
                Цэвэрлэх
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

export default ChangePassword
