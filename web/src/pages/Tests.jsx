import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ExamCard from '../components/cards/ExamCard'
import initialExams from '../data/exams.json'

// Бараа/Тестийн Class зохиомж
class ExamItem {
  constructor(obj) {
    this.id = obj.id;
    this.icon = obj.icon;
    this.iconColor = obj.iconColor;
    this.name = obj.name;
    this.price = obj.price;
    this.subject = obj.subject;
    this.year = obj.year;
    this.questions = obj.questions;
    this.duration = obj.duration;
    this.difficulty = obj.difficulty;
  }
}

const SUBJECTS = ['Бүгд', 'Математик', 'Монгол хэл', 'Физик', 'Хими', 'Биологи', 'Англи хэл', 'Түүх']
const YEARS = ['Бүгд', '2024', '2023', '2022']

function Tests() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Датаг Class хэлбэрт оруулан "татаж" авах (Mock fetch)
  useEffect(() => {
    // Сүлжээнээс татаж байгаа мэтээр дуурайлгах
    const fetchData = async () => {
      setLoading(true)
      // Бодит fetch хийх бол: const res = await fetch('/data/exams.json'); const initialExams = await res.json();
      const formattedData = initialExams.map(item => new ExamItem(item))
      setExams(formattedData)
      setLoading(false)
    }
    fetchData()
  }, [])

  // 2. URL-аас шүүлтүүрийн утгуудыг унших
  const searchQuery = searchParams.get('search') || ''
  const subjectQuery = searchParams.get('subject') || 'Бүгд'
  const yearQuery = searchParams.get('year') || 'Бүгд'

  // 3. URL-ийн дагуу шүүлт хийх
  const filtered = useMemo(() => {
    return exams.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchSubject = subjectQuery === 'Бүгд' || e.subject === subjectQuery
      const matchYear = yearQuery === 'Бүгд' || e.year === yearQuery
      return matchSearch && matchSubject && matchYear
    })
  }, [exams, searchQuery, subjectQuery, yearQuery])

  // 4. URL-ийг шинэчлэх функц
  const updateParams = (key, value) => {
    setSearchParams(prev => {
      if (value && value !== 'Бүгд') {
        prev.set(key, value)
      } else {
        prev.delete(key)
      }
      return prev
    })
  }

  if (loading) return <div className="container" style={{padding: '100px', textAlign: 'center'}}>Уншиж байна...</div>

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
                className={`filter-btn ${subjectQuery === s ? 'active' : ''}`}
                onClick={() => updateParams('subject', s)}
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
                className={`filter-btn ${yearQuery === y ? 'active' : ''}`}
                onClick={() => updateParams('year', y)}
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
            value={searchQuery}
            onChange={e => updateParams('search', e.target.value)}
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