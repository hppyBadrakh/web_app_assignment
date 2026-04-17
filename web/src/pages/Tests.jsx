import { useState, useMemo } from 'react'
import ExamCard from '../components/cards/ExamCard'
import exams from '../data/exams.json'

const SUBJECTS = ['Бүгд', 'Математик', 'Монгол хэл', 'Физик', 'Хими', 'Биологи', 'Англи хэл', 'Түүх']
const YEARS = ['Бүгд', '2024', '2023', '2022']

function Tests() {
  const [search, setSearch] = useState('')
  const [activeSubject, setActiveSubject] = useState('Бүгд')
  const [activeYear, setActiveYear] = useState('Бүгд')

  const filtered = useMemo(() => {
    return exams.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
      const matchSubject = activeSubject === 'Бүгд' || e.subject === activeSubject
      const matchYear = activeYear === 'Бүгд' || e.year === activeYear
      return matchSearch && matchSubject && matchYear
    })
  }, [search, activeSubject, activeYear])

  return (
    <main>
      <div className="page-header container">
        <h1>📝 Шалгалтууд</h1>
        <p>Өөрийн хичээлийн чиглэлд тохирсон шалгалтыг сонгоорой</p>
      </div>

      <div className="container exams-layout">
        <aside className="exams-sidebar brutal">
          <h3>🔧 Шүүлтүүр</h3>

          <div className="filter-group">
            <h4>Хичээл</h4>
            {SUBJECTS.map(s => (
              <button
                key={s}
                className={`filter-btn ${activeSubject === s ? 'active' : ''}`}
                onClick={() => setActiveSubject(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h4>Он</h4>
            {YEARS.map(y => (
              <button
                key={y}
                className={`filter-btn ${activeYear === y ? 'active' : ''}`}
                onClick={() => setActiveYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </aside>

        <div className="exams-content">
          <input
            type="text"
            className="exams-search"
            placeholder="🔍 Шалгалт хайх..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontWeight: 700 }}>Шалгалт олдсонгүй</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Өөр хайлтын үг эсвэл шүүлтүүр ашиглана уу</p>
            </div>
          ) : (
            <div className="exam-grid">
              {filtered.map(exam => <ExamCard key={exam.id} exam={exam} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default Tests
