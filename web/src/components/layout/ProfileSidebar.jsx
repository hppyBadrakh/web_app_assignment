import { Link, useLocation } from 'react-router-dom'

const MENU = [
  { path: '/profile', label: '👤 Профайл' },
  { path: '/test-history', label: '📋 Шалгалтын түүх' },
  { path: '/payment-info', label: '💳 Төлбөрийн мэдээлэл' },
  { path: '/change-password', label: '🔑 Нууц үг солих' },
]

function ProfileSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="profile-sidebar brutal">
      {MENU.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`profile-menu-btn ${pathname === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
      <button className="profile-menu-btn logout">🚪 Гарах</button>
    </aside>
  )
}

export default ProfileSidebar
