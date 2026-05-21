import { Helmet } from 'react-helmet-async'
import { useState, useRef } from 'react'
import ProfileSidebar from '../components/layout/ProfileSidebar'
import Modal from '../components/common/Modal'
import { useAuth } from '../context/AuthContext'

function Profile() {
  const { user, updateUser, authFetch } = useAuth()
  const [editing,   setEditing]   = useState(false)
  const [form,      setForm]      = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileInputRef = useRef(null)

  if (!user) return null

  const save = async (e) => {
    e.preventDefault()
    setEditing(false)
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadErr('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) { setUploadErr(data.error || 'Upload failed'); return }
      updateUser({ avatarUrl: data.avatarUrl })
    } catch {
      setUploadErr('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Helmet>
        <title>TestHub — Профайл</title>
        <meta name="description" content="Хувийн мэдээлэл болон статистикаа харах." />
      </Helmet>
      <div className="profile-layout">
        <ProfileSidebar />

        <main className="profile-main brutal">
          <div className="profile-center">
            <div
              className="profile-avatar-wrap"
              onClick={handleAvatarClick}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAvatarClick() } }}
              role="button"
              tabIndex={0}
              aria-label="Change profile avatar"
              style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile avatar"
                  className="profile-avatar"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a1a1a' }}
                />
              ) : (
                <div className="profile-avatar" style={{ fontSize: '3rem' }}>👤</div>
              )}
              <span style={{ position: 'absolute', bottom: 0, right: 0, background: '#fff', border: '2px solid #1a1a1a', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✏️</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Upload avatar"
            />

            {uploading && <p style={{ color: '#666', fontSize: '0.85rem' }}>Uploading...</p>}
            {uploadErr && (
              <p role="alert" style={{ color: '#dc2626', fontSize: '0.85rem' }}>{uploadErr}</p>
            )}

            <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginTop: 12 }}>{user.username}</h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>{user.email}</p>

            <button
              className="btn-brutal green-btn btn-inline edit-btn"
              onClick={() => { setForm({ username: user.username, email: user.email }); setEditing(true) }}
            >
              ✏️ Профайл засах
            </button>

            <div className="profile-stats">
              <div className="profile-stat"><h3>42</h3><p>Хийсэн шалгалт</p></div>
              <div className="profile-stat"><h3>78%</h3><p>Дундаж оноо</p></div>
              <div className="profile-stat"><h3>#156</h3><p>Эрэмбэ</p></div>
              <div className="profile-stat"><h3>3</h3><p>Гэрчилгээ</p></div>
            </div>
          </div>
        </main>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontWeight: 900 }}>✏️ Профайл засах</h2>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} aria-label="Close modal">✕</button>
          </div>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="edit-username" style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Нэр</label>
              <input id="edit-username" className="search-input" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div>
              <label htmlFor="edit-email" style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Имэйл</label>
              <input id="edit-email" className="search-input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-brutal green-btn btn-inline" style={{ flex: 1 }}>💾 Хадгалах</button>
              <button type="button" className="btn-brutal white-btn btn-inline" style={{ flex: 1 }} onClick={() => setEditing(false)}>Буцах</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Profile
