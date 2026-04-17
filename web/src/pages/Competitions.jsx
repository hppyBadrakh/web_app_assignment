import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import ProductCard from '../components/cards/ProductCard'

const SUBJECTS = ['Математик', 'Монгол хэл', 'Физик', 'Хими', 'Биологи', 'Түүх']
const TAG_MAP = {
  history: 'Түүх', crime: 'Нийгэм', american: 'Нийгэм',
  fiction: 'Утга зохиол', love: 'Монгол хэл', classic: 'Утга зохиол',
  english: 'Англи хэл', math: 'Математик', science: 'Шинжлэх ухаан',
  mystery: 'Шинжлэх ухаан', technology: 'Шинжлэх ухаан',
}

function deriveSubject(tags, i) {
  for (const tag of (tags ?? [])) {
    const s = TAG_MAP[tag.toLowerCase()]
    if (s) return s
  }
  return SUBJECTS[i % 6]
}

function computeDate(i, status) {
  const d = new Date()
  d.setDate(d.getDate() + (status === 'upcoming' ? (i + 1) * 7 : -(i + 1) * 10))
  return d.toLocaleDateString('mn-MN')
}

function Competitions() {
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const location = useLocation()

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const statusFilter = params.get('status') || ''

  useEffect(() => {
    fetch('https://dummyjson.com/posts?limit=12&select=id,title,tags,reactions')
      .then(r => r.json())
      .then(data => {
        const total = data.posts.length
        setCompetitions(
          data.posts.map((post, i) => {
            const status = i < Math.ceil(total / 2) ? 'upcoming' : 'past'
            const subject = deriveSubject(post.tags, i)
            return {
              id: post.id,
              subject,
              title: `${subject} олимпиад — №${post.id}`,
              status,
              date: computeDate(i, status),
              participants: (post.reactions?.likes ?? 0) * 50 + 100 + i * 37,
              prize: `$${((i + 1) * 250 + 500).toLocaleString()}`,
              icon: '🏆',
              iconClass: i % 2 === 0 ? 'icon-gold' : 'icon-green',
            }
          })
        )
      })
      .catch(() => setCompetitions([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return competitions.filter(c => {
      const matchSearch = !search || c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
      const matchStatus = !statusFilter || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [competitions, search, statusFilter])

  const upcoming = filtered.filter(c => c.status === 'upcoming')
  const past = filtered.filter(c => c.status === 'past')

  return (
    <main>
      <section className="hero-area container">
        <div className="banner brutal">
          <div className="banner-icon">🏆</div>
          <h1>Тэмцээнүүд</h1>
          <p>Бодит тэмцээнд оролцож, мэдлэгээ шалгаарай!</p>
        </div>

        <div className="stats-row grid-3">
          <div className="stat-card brutal">
            <div className="s-icon">📋</div>
            <div className="s-num">300+</div>
            <div className="s-label">Нийт тэмцээн</div>
          </div>
          <div className="stat-card brutal">
            <div className="s-icon">👥</div>
            <div className="s-num">10,000+</div>
            <div className="s-label">Нийт оролцогч</div>
          </div>
          <div className="stat-card brutal">
            <div className="s-icon">🥇</div>
            <div className="s-num">₮5M+</div>
            <div className="s-label">Нийт шагнал</div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="search-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Тэмцээн хайх..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Уншиж байна...</p>
        ) : (
          <>
            {(!statusFilter || statusFilter === 'upcoming') && (
              <section className="section">
                <div className="section-head flex-row">
                  <h2>Удахгүй болох тэмцээнүүд</h2>
                  <span className="badge yellow">{upcoming.length} тэмцээн</span>
                </div>
                {upcoming.length === 0
                  ? <p style={{ color: '#666', padding: '20px 0' }}>Тэмцээн олдсонгүй</p>
                  : <div className="grid-3">{upcoming.map(c => <ProductCard key={c.id} competition={c} />)}</div>
                }
              </section>
            )}

            {(!statusFilter || statusFilter === 'past') && (
              <section className="section">
                <div className="section-head flex-row">
                  <h2>Өнгөрсөн тэмцээнүүд</h2>
                  <span className="badge gray">{past.length} тэмцээн</span>
                </div>
                {past.length === 0
                  ? <p style={{ color: '#666', padding: '20px 0' }}>Тэмцээн олдсонгүй</p>
                  : <div className="grid-3">{past.map(c => <ProductCard key={c.id} competition={c} />)}</div>
                }
              </section>
            )}
          </>
        )}

        <div className="ranking-cta brutal">
          <div className="rank-icon">🏅</div>
          <h2>Бүх цагийн тэргүүний жагсаалт</h2>
          <p>Тэмцээнд оролцож, шилдэг оролцогчдын жагсаалтад нэр оруулаарай!</p>
          <button className="btn-brutal leaderboard-btn btn-inline">🔥 Жагсаалт харах</button>
        </div>
      </div>
    </main>
  )
}

export default Competitions
