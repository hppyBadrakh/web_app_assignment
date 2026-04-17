import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FeatureCard from '../components/cards/FeatureCard'
import StatStripCard from '../components/cards/StatStripCard'
import TeamMemberCard from '../components/cards/TeamMemberCard'
import TestimonialCard from '../components/cards/TestimonialCard'
import features from '../data/features.json'
import stats from '../data/stats.json'
import team from '../data/team.json'

const SUBJECTS = ['Математик', 'Монгол хэл', 'Физик', 'Хими', 'Биологи', 'Түүх']
const POINTS = [30, 22, 18, 25, 15, 28, 20, 35, 12]
const COLORS = ['t-c1', 't-c2', 't-c3']
const BARS = [35, 55, 45, 70, 60, 80, 65, 90, 75]

function Home() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://dummyjson.com/quotes?limit=9')
      .then(r => r.json())
      .then(data =>
        setTestimonials(
          data.quotes.map((q, i) => ({
            id: q.id,
            name: q.author,
            quote: q.quote,
            subject: SUBJECTS[i % 6],
            points: POINTS[i % 9],
            avatarColor: COLORS[i % 3],
          }))
        )
      )
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      {/* Hero */}
      <section className="home-hero container">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1>Элсэлтийн шалгалтыг итгэлтэйгээр давъя 🎯</h1>
            <p>
              TestHub дээр 1,000+ шалгалт, бодит тэмцээн, ухаалаг аналитикаар
              өөрийн мэдлэгийг шалгаж, элсэлтийн шалгалтад зориулан хамгийн сайн бэлтгэ.
            </p>
            <div className="home-hero-buttons">
              <Link to="/tests" className="btn-hero-primary">Бэлтгэл эхлэх</Link>
              <Link to="/competitions" className="btn-hero-outline">Тэмцээнүүдийг үзэх</Link>
            </div>
            <div className="social-proof">
              <div className="avatar-stack">
                <span className="av-c1"></span>
                <span className="av-c2"></span>
                <span className="av-c3"></span>
                <span className="av-c1"></span>
              </div>
              <span className="social-text">10,600+ оюутан нэгдсэн</span>
              <span className="rating-pill">
                <span className="star-icon">★</span> 4.8 / 5
              </span>
            </div>
          </div>

          <div className="home-hero-mockup">
            <div className="mockup-panel brutal">
              <p className="mockup-label">📊 Таны ахиц дэвшил</p>
              <div className="mockup-progress-bar-wrap">
                <div className="mockup-progress-bar"></div>
              </div>
              <div className="mockup-grid">
                <div className="mockup-card">
                  <div className="mockup-line short"></div>
                  <div className="mockup-line medium"></div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-line medium"></div>
                  <div className="mockup-line short"></div>
                </div>
              </div>
              <div className="mockup-card-wide">
                <div className="mockup-line medium"></div>
                <div className="chart-css">
                  {BARS.map((h, i) => (
                    <div
                      key={i}
                      className="chart-bar"
                      style={{ height: `${h}%`, left: `${i * 11}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="grid-4">
            {features.map(f => <FeatureCard key={f.id} {...f} />)}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-strip container">
        <div className="grid-4">
          {stats.map(s => <StatStripCard key={s.id} number={s.number} label={s.label} />)}
        </div>
      </section>

      {/* About */}
      <section className="about-section">
        <div className="container">
          <h2>TestHub-ийн тухай</h2>
          <div className="about-box brutal">
            <p>
              TestHub нь Монголын оюутнуудад элсэлтийн шалгалтад бэлдэхэд туслах зорилготой
              платформ юм. Бид 2022 оноос хойш 10,000 гаруй оюутанд тусалж, тэдний шалгалтын
              оноог дундажаар 35%-иар нэмэгдүүлсэн байна. Манай систем нь AI-д суурилсан
              аналитик, бодит цагийн тэмцээн, мэргэжлийн багш нарын тайлбартай шалгалтуудыг
              нэгтгэн, оюутан бүрт тохирсон сурах орчин бүрдүүлдэг.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section container">
        <h2>Оюутнуудын сэтгэгдэл</h2>
        <p className="sub">Бидэнтэй хамт суралцагсдын туршлага</p>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Уншиж байна...</p>
        ) : (
          <div className="grid-3">
            {testimonials.map(t => <TestimonialCard key={t.id} testimonial={t} />)}
          </div>
        )}
      </section>

      {/* Team */}
      <section className="team-section container">
        <h2>Манай баг</h2>
        <p>TestHub-ийг бүтээсэн хүмүүс</p>
        <div className="grid-2">
          {team.map(m => (
            <TeamMemberCard key={m.id} imgSrc={m.imgSrc} name={m.name} role={m.role} />
          ))}
        </div>
      </section>

      {/* Ready CTA */}
      <section className="container">
        <div className="ready-cta">
          <h3>🚀 Бэлэн үү? Одоо эхэл!</h3>
          <p>Хамгийн сайн бэлтгэлтэйгээр шалгалтдаа орцгооё!</p>
          <Link to="/tests">Шалгалт эхлэх</Link>
        </div>
      </section>

      {/* User count CTA */}
      <section className="cta-section container" style={{ paddingBottom: '60px' }}>
        <div className="cta-box brutal">
          <div className="cta-icon">👥</div>
          <h2>10,000+</h2>
          <p>оюутан аль хэдийн нэгдсэн байна</p>
          <Link to="/tests" className="btn-brutal green-btn btn-inline">
            Одоо нэгд
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Home
