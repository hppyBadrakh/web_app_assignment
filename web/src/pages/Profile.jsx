import { useState } from 'react'
import ProfileSidebar from '../components/layout/ProfileSidebar'
import Modal from '../components/common/Modal'

const INITIAL = { name: 'Баатар Дорж', email: 'baatar@mail.mn', phone: '+976 9900-1234' }

function Profile() {
  const [user, setUser] = useState(INITIAL)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(INITIAL)

  const save = (e) => {
    e.preventDefault()
    setUser(form)
    setEditing(false)
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="profile-layout">
        <ProfileSidebar />

        <main className="profile-main brutal">
          <div className="profile-center">
            <div className="profile-avatar">👤</div>
            <h2 style={{ fontWeight: 900, fontSize: '1.5rem' }}>{user.name}</h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>{user.email}</p>
            {user.phone && <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.9rem' }}>{user.phone}</p>}

            <button className="btn-brutal green-btn btn-inline edit-btn" onClick={() => { setForm(user); setEditing(true) }}>
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
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Нэр</label>
              <input className="search-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Имэйл</label>
              <input className="search-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Утасны дугаар</label>
              <input className="search-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%' }} />
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
