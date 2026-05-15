import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const navItems = [
  { to: '/admin',              label: '📊 Dashboard', end: true },
  { to: '/admin/users',        label: '👥 Users' },
  { to: '/admin/exams',        label: '📝 Exams' },
  { to: '/admin/competitions', label: '🏆 Competitions' },
]

const linkStyle = (isActive) => ({
  display: 'block', padding: '10px 16px', borderRadius: 10, fontWeight: 700,
  textDecoration: 'none', marginBottom: 4,
  background: isActive ? '#1a1a1a' : 'transparent',
  color: isActive ? '#fff' : '#1a1a1a',
})

export default function AdminLayout() {
  const { adminUser, adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await adminLogout()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <aside style={{ width: 220, background: '#f5f5f5', borderRight: '2px solid #1a1a1a', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>🛡️ Admin</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>{adminUser?.username}</div>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => linkStyle(isActive)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout}
          style={{ marginTop: 'auto', padding: '10px 16px', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>
          Logout
        </button>
      </aside>

      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
