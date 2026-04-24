import { useState } from 'react'
import ToggleButton from '../common/ToggleButton'
import Modal from '../common/Modal'

function ProductCard({ competition }) {
  const { icon, iconClass, title, date, status, participants, prize, subject, price, likes: initialLikes } = competition

  const [likes, setLikes] = useState(initialLikes || 0)
  const [liked, setLiked] = useState(false) // Liked = In Cart
  const [showModal, setShowModal] = useState(false)

  // Зүрх дарах үйлдэл
  const handleToggleLike = () => {
    const nextState = !liked
    setLiked(nextState)
    setLikes(nextState ? likes + 1 : likes - 1)
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
        <p className="meta">📅 {date} | 📚 {subject}</p>
        <p className="price" style={{ fontWeight: 'bold', margin: '10px 0', fontSize: '1.1rem' }}>
          {price === 0 ? 'Үнэгүй' : `₮${price.toLocaleString()}`}
        </p>

        <div className="card-actions">
          {/* Зүрх нь өөрөө сагс бөгөөд Label нь төлөвөө дагаж солигдоно */}
          <ToggleButton 
            active={liked} 
            count={likes} 
            icon="🤍" 
            activeIcon="❤️" 
            className="like-btn" 
            label={liked ? "Сагсанд байгаа" : "Сагсанд нэмэх"} 
            onClick={handleToggleLike} 
          />
        </div>

        <button className="btn-brutal green-btn" style={{ width: '100%' }} onClick={() => setShowModal(true)}>
          Дэлгэрэнгүй
        </button>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.4rem' }}>{title}</h2>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
            <div className="brutal-info-box" style={{ padding: '10px', background: 'white', border: '2px solid black', boxShadow: '2px 2px 0px black' }}>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Огноо</p>
              <p style={{ fontWeight: 'bold' }}>{date}</p>
            </div>
            <div className="brutal-info-box" style={{ padding: '10px', background: 'white', border: '2px solid black', boxShadow: '2px 2px 0px black' }}>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Оролцогчид</p>
              <p style={{ fontWeight: 'bold' }}>{participants.toLocaleString()}+</p>
            </div>
            <div className="brutal-info-box" style={{ padding: '10px', background: 'white', border: '2px solid black', boxShadow: '2px 2px 0px black', gridColumn: 'span 2' }}>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Шагнал</p>
              <p style={{ fontWeight: 'bold', color: 'var(--green)', fontSize: '1.2rem' }}>{prize}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
             <p style={{ fontSize: '1.2rem', fontWeight: 900 }}>Үнэ: {price === 0 ? 'Үнэгүй' : `₮${price.toLocaleString()}`}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Захиалах товч */}
            <button 
              className="btn-brutal green-btn" 
              style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}
              onClick={() => alert(`${title} захиалга хийгдэх хэсэг рүү шилжиж байна...`)}
            >
              💳 Одоо захиалах
            </button>
            
            <button 
              className="btn-brutal white-btn" 
              style={{ width: '100%', padding: '12px' }} 
              onClick={() => setShowModal(false)}
            >
              Буцах
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default ProductCard