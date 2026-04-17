import { useState } from 'react'
import ToggleButton from '../common/ToggleButton'

function TestimonialCard({ testimonial }) {
  const { name, quote, avatarColor, points, subject } = testimonial

  const [likes, setLikes] = useState(() => Math.floor(Math.random() * 30) + 5)
  const [favorites, setFavorites] = useState(() => Math.floor(Math.random() * 20) + 3)
  const [saves, setSaves] = useState(() => Math.floor(Math.random() * 15) + 2)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggle = (active, setActive, count, setCount) => {
    setActive(!active)
    setCount(active ? count - 1 : count + 1)
  }

  return (
    <div className="testimonial-card brutal">
      <div className="testimonial-user">
        <div className={`testimonial-avatar ${avatarColor}`}>
          {name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="testimonial-name">{name}</p>
          <span className="points-badge">↑ +{points} оноо</span>
        </div>
        {subject && (
          <span className="badge blue-badge" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
            {subject}
          </span>
        )}
      </div>

      <p>"{quote}"</p>

      <div className="card-actions">
        <ToggleButton active={liked} count={likes} icon="🤍" activeIcon="❤️" className="like-btn" label="Таалагдлаа" onClick={() => toggle(liked, setLiked, likes, setLikes)} />
        <ToggleButton active={favorited} count={favorites} icon="☆" activeIcon="⭐" className="fav-btn" label="Дуртай" onClick={() => toggle(favorited, setFavorited, favorites, setFavorites)} />
        <ToggleButton active={saved} count={saves} icon="🔖" activeIcon="🔖" className="save-btn" label="Хадгалах" onClick={() => toggle(saved, setSaved, saves, setSaves)} />
      </div>
    </div>
  )
}

export default TestimonialCard
