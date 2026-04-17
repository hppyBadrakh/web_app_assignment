import { useState } from 'react'
import ToggleButton from '../common/ToggleButton'
import Modal from '../common/Modal'

function ProductCard({ competition }) {
  const { icon, iconClass, title, date, status, participants, prize, subject } = competition

  const [likes, setLikes] = useState(() => Math.floor(Math.random() * 50) + 10)
  const [favorites, setFavorites] = useState(() => Math.floor(Math.random() * 30) + 5)
  const [saves, setSaves] = useState(() => Math.floor(Math.random() * 20) + 3)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const toggle = (active, setActive, count, setCount) => {
    setActive(!active)
    setCount(active ? count - 1 : count + 1)
  }

  const badgeClass = status === 'upcoming' ? 'yellow' : 'gray'
  const badgeText = status === 'upcoming' ? '🟡 Удахгүй' : '⬜ Дууссан'

  return (
    <>
      <div className="item-card brutal">
        <div className="card-top">
          <div className={`exam-card-icon ${iconClass}`}>{icon}</div>
          <span className={`badge ${badgeClass}`}>{badgeText}</span>
        </div>

        <h3>{title}</h3>
        <p className="meta">📅 {date}</p>
        <p className="meta">👥 {participants.toLocaleString()} оролцогч</p>
        <p className="meta">🎯 {subject}</p>
        <p className="prize">🏆 Шагнал: {prize}</p>

        <div className="card-actions">
          <ToggleButton active={liked} count={likes} icon="🤍" activeIcon="❤️" className="like-btn" label="Таалагдлаа" onClick={() => toggle(liked, setLiked, likes, setLikes)} />
          <ToggleButton active={favorited} count={favorites} icon="☆" activeIcon="⭐" className="fav-btn" label="Дуртай" onClick={() => toggle(favorited, setFavorited, favorites, setFavorites)} />
          <ToggleButton active={saved} count={saves} icon="🔖" activeIcon="🔖" className="save-btn" label="Хадгалах" onClick={() => toggle(saved, setSaved, saves, setSaves)} />
        </div>

        <button className="btn-brutal green-btn" onClick={() => setShowModal(true)}>
          Дэлгэрэнгүй
        </button>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', flex: 1 }}>{title}</h2>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Хичээл:</span>
              <span>{subject}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Огноо:</span>
              <span>{date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Оролцогч:</span>
              <span>{participants.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Шагнал:</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>{prize}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Статус:</span>
              <span className={`badge ${badgeClass}`} style={{ marginBottom: 0 }}>{badgeText}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {status === 'upcoming'
              ? <button className="btn-brutal green-btn btn-inline" style={{ flex: 1 }}>✅ Бүртгүүлэх</button>
              : <button className="btn-brutal gold-btn btn-inline" style={{ flex: 1 }}>📊 Үр дүн харах</button>
            }
            <button className="btn-brutal white-btn btn-inline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Буцах</button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default ProductCard
