import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/cards/ProductCard'

const SUBJECTS = ['Бүгд', 'Математик', 'Мэдээлэл зүй', 'Физик', 'Хими', 'Англи хэл', 'Монгол хэл']
const STATUSES = [
  { label: 'Бүгд',         value: 'All'      },
  { label: 'Удахгүй болох', value: 'upcoming' },
  { label: 'Өнгөрсөн',     value: 'past'     },
]
const PAGE_SIZE = 6

function Competitions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [competitions, setCompetitions] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const searchQuery = searchParams.get('search') || ''
  const subjectQuery = searchParams.get('subject') || 'Бүгд'
  const statusQuery = searchParams.get('status') || 'All'
  const page = parseInt(searchParams.get('page') || '1', 10)

  useEffect(() => {
    const controller = new AbortController()

    const fetchCompetitions = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ page, limit: PAGE_SIZE })
        if (searchQuery) params.set('search', searchQuery)
        if (subjectQuery !== 'Бүгд') params.set('subject', subjectQuery)
        if (statusQuery !== 'All') params.set('status', statusQuery)

        const res = await fetch(`/api/competitions?${params}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const json = await res.json()
        setCompetitions(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
    return () => controller.abort()
  }, [searchQuery, subjectQuery, statusQuery, page])

  const updateParams = (key, value) => {
    setSearchParams(prev => {
      if (value && value !== 'Бүгд' && value !== 'All') {
        prev.set(key, value)
      } else {
        prev.delete(key)
      }
      prev.delete('page')
      return prev
    })
  }

  const setPage = (p) => {
    setSearchParams(prev => {
      prev.set('page', String(p))
      return prev
    })
  }

  return (
    <main>
      <Helmet>
        <title>TestHub — Тэмцээнүүд</title>
        <meta name="description" content="Оролцоод шагналтай тэмцээнүүдэд хүчээ үзээрэй." />
        <meta property="og:title" content="TestHub — Тэмцээнүүд" />
        <meta property="og:description" content="Шагналтай онлайн тэмцээнүүд" />
      </Helmet>
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

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px' }}>Уншиж байна...</div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#c00' }}>
              <p>Алдаа гарлаа: {error}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Сервер ажиллаж байгаа эсэхийг шалгана уу.</p>
            </div>
          )}

          {!loading && !error && competitions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontWeight: 700 }}>Тэмцээн олдсонгүй</p>
            </div>
          )}

          {!loading && !error && competitions.length > 0 && (
            <>
              <p style={{ marginBottom: '12px', color: '#666', fontSize: '0.9rem' }}>
                Нийт {total} тэмцээн олдлоо
              </p>
              <div className="exam-grid">
                {competitions.map(comp => <ProductCard key={comp.id} competition={comp} />)}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-brutal white-btn"
                    style={{ padding: '6px 14px' }}
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Өмнөх
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`btn-brutal ${p === page ? 'green-btn' : 'white-btn'}`}
                      style={{ padding: '6px 14px', minWidth: '40px' }}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    className="btn-brutal white-btn"
                    style={{ padding: '6px 14px' }}
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Дараах →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default Competitions
