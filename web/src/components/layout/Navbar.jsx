import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const close = () => setMenuOpen(false)

  return (
    <nav className="navbar" style={{ position: 'relative' }}>
      <div className="container flex-row">
        <Link to="/" className="logo-group" onClick={close}>
          <span className="logo-icon">T</span>
          <span className="logo-text">TestHub</span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Цэс нээх/хаах"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-menu ${menuOpen ? 'mobile-open' : ''}`}>
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'btn-active' : ''}
              onClick={close}
            >
              Нүүр
            </Link>
          </li>
          <li>
            <Link
              to="/tests"
              className={isActive('/tests') ? 'btn-active' : ''}
              onClick={close}
            >
              Шалгалтууд
            </Link>
          </li>
          <li className="has-drop">
            <span style={{ cursor: 'pointer', fontWeight: 700 }}>
              Тэмцээн ▾
            </span>
            <ul className="drop-menu">
              <li>
                <Link to="/competitions?status=upcoming" onClick={close}>
                  Удахгүй болох
                </Link>
              </li>
              <li>
                <Link to="/competitions?status=past" onClick={close}>
                  Өнгөрсөн
                </Link>
              </li>
              <li>
                <Link to="/competitions" onClick={close}>
                  Бүгд
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <Link
              to="/help"
              className={isActive('/help') ? 'btn-active' : ''}
              onClick={close}
            >
              Тусламж
            </Link>
          </li>
          <li className="user-profile">
            <Link to="/profile" onClick={close}>
              <div className="avatar">👤</div>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
