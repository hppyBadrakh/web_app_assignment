import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/cards/ProductCard'
import initialCompetitions from '../data/competitions.json' // JSON импортлох

// Тэмцээний Class зохиомж
class CompetitionItem {
  constructor(obj) {
    this.id = obj.id;
    this.icon = obj.icon;
    this.iconClass = obj.iconClass;
    this.title = obj.title;
    this.date = obj.date;
    this.status = obj.status; // 'upcoming' эсвэл 'past'
    this.participants = obj.participants;
    this.prize = obj.prize;
    this.subject = obj.subject;
    this.price = obj.price;
    this.likes = obj.likes || 0;
    this.reviews = obj.reviews || [];
  }
}

const SUBJECTS = ['Бүгд', 'Математик', 'Мэдээлэл зүй', 'Физик', 'Хими', 'Англи хэл']
const STATUSES = [
  { label: 'Бүгд', value: 'All' },
  { label: 'Удахгүй болох', value: 'upcoming' },
  { label: 'Өнгөрсөн', value: 'past' }
]

function Competitions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Component LifeCycle: Ачааллах үед датаг Class руу хөрвүүлж state-д хадгалах
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const formattedData = initialCompetitions.map(item => new CompetitionItem(item))
      setCompetitions(formattedData)
      setLoading(false)
    }
    loadData()
  }, [])

  // 2. URL-аас шүүлтүүрийн параметрүүд унших
  const searchQuery = searchParams.get('search') || ''
  const subjectQuery = searchParams.get('subject') || 'Бүгд'
  const statusQuery = searchParams.get('status') || 'All'

  // 3. Өгөгдөл шүүх (useMemo ашиглан шаардлагагүй render-ээс сэргийлэх)
  const filtered = useMemo(() => {
    return competitions.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchSubject = subjectQuery === 'Бүгд' || c.subject === subjectQuery
      const matchStatus = statusQuery === 'All' || c.status === statusQuery
      return matchSearch && matchSubject && matchStatus
    })
  }, [competitions, searchQuery, subjectQuery, statusQuery])

  // 4. URL шинэчлэх функц
  const updateParams = (key, value) => {
    setSearchParams(prev => {
      if (value && value !== 'Бүгд' && value !== 'All') {
        prev.set(key, value)
      } else {
        prev.delete(key)
      }
      return prev
    })
  }

  if (loading) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Уншиж байна...</div>

  return (
    <main>
      <div className="page-header container">
        <h1>🏆 Тэмцээн, Уралдаан</h1>
        <p>Мэдлэгээ сорьж, шилдэг нь гэдгээ батлаарай</p>
      </div>

      <div className="container exams-layout">
        <aside className="exams-sidebar brutal">
          <h3>🔧 Шүүлтүүр</h3>

          <div className="filter-group">
            <h4>Төлөв</h4>
            {STATUSES.map(st => (
              <button
                key={st.value}
                className={`filter-btn ${statusQuery === st.value ? 'active' : ''}`}
                onClick={() => updateParams('status', st.value)}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h4>Хичээл</h4>
            {SUBJECTS.map(s => (
              <button
                key={s}
                className={`filter-btn ${subjectQuery === s ? 'active' : ''}`}
                onClick={() => updateParams('subject', s)}
              >
                {s}
              </button>
            ))}
          </div>
        </aside>

        <div className="exams-content">
          <input
            type="text"
            className="exams-search"
            placeholder="🔍 Тэмцээн хайх..."
            value={searchQuery}
            onChange={e => updateParams('search', e.target.value)}
          />

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontWeight: 700 }}>Тэмцээн олдсонгүй</p>
            </div>
          ) : (
            <div className="exam-grid">
              {filtered.map(comp => <ProductCard key={comp.id} competition={comp} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default Competitions