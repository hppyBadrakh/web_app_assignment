import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer-gradient">
      <div className="container">
        <div className="footer-content">
          <div className="footer-col footer-brand">
            <div className="footer-logo-group">
              <div className="footer-logo-icon">T</div>
              <span className="footer-logo-text">TestHub</span>
            </div>
            <p className="footer-tagline">
              Элсэлтийн шалгалтыг итгэлтэйгээр давъя.<br />
              Мэдлэгтэй, бэлтгэлтэй!
            </p>
          </div>

          <div className="footer-col">
            <h4>Хуудсууд</h4>
            <ul>
              <li><Link to="/">Нүүр</Link></li>
              <li><Link to="/tests">Шалгалтууд</Link></li>
              <li><Link to="/competitions">Тэмцээн</Link></li>
              <li><Link to="/help">Тусламж</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Профайл</h4>
            <ul>
              <li><Link to="/profile">Миний профайл</Link></li>
              <li><Link to="/test-history">Шалгалтын түүх</Link></li>
              <li><Link to="/payment-info">Төлбөрийн мэдээлэл</Link></li>
              <li><Link to="/change-password">Нууц үг солих</Link></li>
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h4>Холбоо барих</h4>
            <p>📧 <a href="mailto:info@testhub.mn">info@testhub.mn</a></p>
            <p>📞 +976 9900-0000</p>
            <p>📍 Улаанбаатар, Монгол</p>
          </div>
        </div>

        <div className="footer-divider"></div>
        <div className="footer-bottom">
          © 2025 TestHub. Бүх эрх хуулиар хамгаалагдсан.
        </div>
      </div>
    </footer>
  )
}

export default Footer
