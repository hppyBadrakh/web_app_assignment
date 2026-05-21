import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import ProfileSidebar from '../components/layout/ProfileSidebar'
import Modal from '../components/common/Modal'

const HISTORY = [
  { id: 1, subject: 'Математик', date: '2025-04-10', score: '85/100', grade: 'A', correct: 85, wrong: 15, time: '78 мин' },
  { id: 2, subject: 'Монгол хэл', date: '2025-04-08', score: '72/100', grade: 'B', correct: 72, wrong: 28, time: '55 мин' },
  { id: 3, subject: 'Физик', date: '2025-04-05', score: '90/100', grade: 'A+', correct: 90, wrong: 10, time: '70 мин' },
  { id: 4, subject: 'Хими', date: '2025-03-28', score: '65/100', grade: 'C', correct: 65, wrong: 35, time: '60 мин' },
  { id: 5, subject: 'Биологи', date: '2025-03-20', score: '88/100', grade: 'A', correct: 88, wrong: 12, time: '72 мин' },
  { id: 6, subject: 'Англи хэл', date: '2025-03-15', score: '76/100', grade: 'B+', correct: 76, wrong: 24, time: '80 мин' },
]

function TestHistory() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Helmet>
        <title>TestHub — Шалгалтын түүх</title>
        <meta name="description" content="Өнгөрсөн шалгалтуудын үр дүн болон түүхийг харах." />
      </Helmet>
      <div className="profile-layout">
        <ProfileSidebar />

        <main className="profile-main brutal" style={{ textAlign: 'left' }}>
          <h2 style={{ fontWeight: 900, marginBottom: '8px' }}>📋 Шалгалтын түүх</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Өнгөрсөн {HISTORY.length} шалгалт</p>

          <div className="history-list">
            {HISTORY.map(h => (
              <div key={h.id} className="history-row">
                <div>
                  <p className="subject-name">{h.subject}</p>
                  <p style={{ fontSize: '0.85rem', color: '#666' }}>📅 {h.date}</p>
                </div>
                <div className="subject-right">
                  <span className="subject-score">{h.score}</span>
                  <span className={`badge ${h.grade.includes('+') ? 'green-badge' : h.grade === 'A' ? 'green-badge' : h.grade === 'C' ? 'gray' : 'yellow'}`} style={{ marginBottom: 0 }}>
                    {h.grade}
                  </span>
                  <button className="btn-brutal white-btn view-btn" onClick={() => setSelected(h)}>
                    Дэлгэрэнгүй
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontWeight: 900 }}>📊 {selected.subject}</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          <div className="profile-stats" style={{ marginBottom: '20px' }}>
            <div className="profile-stat"><h3>{selected.score}</h3><p>Нийт оноо</p></div>
            <div className="profile-stat"><h3>{selected.grade}</h3><p>Үнэлгээ</p></div>
            <div className="profile-stat"><h3 style={{ color: 'var(--green)' }}>{selected.correct}</h3><p>Зөв хариулт</p></div>
            <div className="profile-stat"><h3 style={{ color: '#e74c3c' }}>{selected.wrong}</h3><p>Буруу хариулт</p></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '14px 20px', background: '#f5f5f5', borderRadius: '12px', border: '2px solid #ddd' }}>
            <span style={{ fontWeight: 700 }}>📅 Огноо:</span>
            <span>{selected.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', padding: '14px 20px', background: '#f5f5f5', borderRadius: '12px', border: '2px solid #ddd' }}>
            <span style={{ fontWeight: 700 }}>⏱️ Зарцуулсан хугацаа:</span>
            <span>{selected.time}</span>
          </div>

          <button className="btn-brutal white-btn" onClick={() => setSelected(null)}>Хаах</button>
        </Modal>
      )}
    </div>
  )
}

export default TestHistory
