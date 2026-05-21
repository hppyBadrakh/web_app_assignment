import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuth() // одоогийн хэрэглэгч болон гарах функцийг авна

  const isActive = (path) => location.pathname === path
  const close    = () => setMenuOpen(false)

  // ── handleLogout ────────────────────────────────────────────────────────────
  // AuthContext-ийн logout()-г дуудна (сервер дээр сессийг устгаж
  // localStorage-г цэвэрлэдэг), дараа нь хэрэглэгчийг нүүр хуудсруу явуулна.
  async function handleLogout() {
    close()
    await logout()
    navigate('/')
  }

  return (
    <nav
      className="navbar"
      style={{ position: 'relative' }}
      onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false) }}
    >
      <div className="container flex-row">
        <Link to="/" className="logo-group" onClick={close}>
          <span className="logo-icon">T</span>
          <span className="logo-text">TestHub</span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(o => !o)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMenuOpen(o => !o) } }}
          aria-label="Цэс нээх/хаах"
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul id="nav-menu" className={`nav-menu ${menuOpen ? 'mobile-open' : ''}`}>
          <li>
            <Link to="/" className={isActive('/') ? 'btn-active' : ''} onClick={close}>
              Нүүр
            </Link>
          </li>
          <li>
            <Link to="/tests" className={isActive('/tests') ? 'btn-active' : ''} onClick={close}>
              Шалгалтууд
            </Link>
          </li>
          <li className="has-drop">
            <span style={{ cursor: 'pointer', fontWeight: 700 }}>Тэмцээн ▾</span>
            <ul className="drop-menu" role="menu">
              <li role="menuitem"><Link to="/competitions?status=upcoming" onClick={close}>Удахгүй болох</Link></li>
              <li role="menuitem"><Link to="/competitions?status=past"     onClick={close}>Өнгөрсөн</Link></li>
              <li role="menuitem"><Link to="/competitions"                 onClick={close}>Бүгд</Link></li>
            </ul>
          </li>
          <li>
            <Link to="/help" className={isActive('/help') ? 'btn-active' : ''} onClick={close}>
              Тусламж
            </Link>
          </li>

          {/* ── Auth хэсэг ──────────────────────────────────────────────────── */}
          {user ? (
            // Нэвтэрсэн — хэрэглэгчийн нэр болон гарах товчтой dropdown харуулна
            <li className="has-drop user-profile">
              <div className="avatar" style={{ cursor: 'pointer', gap: 6, display: 'flex', alignItems: 'center', padding: '0 8px', borderRadius: 20, minWidth: 42 }}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile avatar"
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a1a1a' }}
                  />
                ) : (
                  <span>👤</span>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 800, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </span>
              </div>
              <ul className="drop-menu" role="menu" style={{ right: 0, left: 'auto' }}>
                <li role="menuitem">
                  <Link to="/profile" onClick={close}>
                    Профайл
                  </Link>
                </li>
                <li role="menuitem">
                  <Link to="/change-password" onClick={close}>
                    Нууц үг солих
                  </Link>
                </li>
                {/* Админуудад дүрийн тэмдэглэгээ харуулна */}
                {user.role === 'admin' && (
                  <li role="menuitem" style={{ padding: '8px 20px' }}>
                    <span className="badge green-badge" style={{ fontSize: '0.75rem' }}>Admin</span>
                  </li>
                )}
                <li role="menuitem">
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#dc2626' }}
                  >
                    Гарах
                  </button>
                </li>
              </ul>
            </li>
          ) : (
            // Нэвтрээгүй — Нэвтрэх ба Бүртгүүлэх холбоосыг харуулна
            <>
              <li>
                <Link to="/login" onClick={close} style={{ fontWeight: 700 }}>
                  Нэвтрэх
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  onClick={close}
                  className="btn-active"
                  style={{ padding: '8px 20px', borderRadius: 20, background: 'var(--green)', color: 'white', border: '2px solid #1a1a1a' }}
                >
                  Бүртгүүлэх
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
