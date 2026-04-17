import { useState } from 'react'
import ToggleButton from '../common/ToggleButton'
import Modal from '../common/Modal'

function ExamCard({ exam }) {
  const { icon, iconColor, name, price, questions, duration, difficulty, subject, year } = exam

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

  return (
    <>
      <div className="exam-card brutal">
        <div className={`exam-card-icon ${iconColor}`}>{icon}</div>
        <p className="exam-card-name">{name}</p>
        <p className="exam-price">{price}</p>

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
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', flex: 1 }}>{name}</h2>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', marginLeft: '10px' }}>✕</button>
          </div>

          <div className="profile-stats" style={{ marginBottom: '20px' }}>
            <div className="profile-stat"><h3>{questions}</h3><p>Асуулт</p></div>
            <div className="profile-stat"><h3>{duration}</h3><p>Хугацаа</p></div>
            <div className="profile-stat"><h3>{difficulty}</h3><p>Хэцүүдэл</p></div>
            <div className="profile-stat"><h3>{year}</h3><p>Он</p></div>
          </div>

          <p style={{ color: '#555', lineHeight: 1.6, marginBottom: '24px' }}>
            {subject}-ийн {year} оны загвар тест. Нийт {questions} асуулт агуулсан бөгөөд {duration}-ийн дотор гүйцэтгэнэ.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-brutal green-btn btn-inline" style={{ flex: 1 }}>🚀 Шалгалт эхлэх</button>
            <button className="btn-brutal white-btn btn-inline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Буцах</button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default ExamCard
