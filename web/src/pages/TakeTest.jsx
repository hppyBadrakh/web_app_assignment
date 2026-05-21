import { Helmet } from 'react-helmet-async'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import examData from '../data/exam_english_2025.json'

const EXAMS = { 10: examData }

function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function Results({ questions, answers, timeTaken, onRetry, onExit }) {
  const [showReview, setShowReview] = useState(false)

  const earned = questions.reduce((sum, q) => {
    return answers[q.id] === q.correct ? sum + q.points : sum
  }, 0)
  const total = questions.reduce((sum, q) => sum + q.points, 0)
  const pct = Math.round((earned / total) * 100)
  const passed = pct >= 60

  const sections = [...new Set(questions.map(q => q.section))]
  const bySection = sections.map(sec => {
    const qs = questions.filter(q => q.section === sec)
    const pts = qs.reduce((s, q) => s + q.points, 0)
    const got = qs.reduce((s, q) => answers[q.id] === q.correct ? s + q.points : s, 0)
    return { sec, pts, got, count: qs.length, correct: qs.filter(q => answers[q.id] === q.correct).length }
  })

  const minutes = Math.floor(timeTaken / 60)
  const secs = timeTaken % 60

  return (
    <div className="taketest-wrap">
      <div className="container" style={{ maxWidth: 800, padding: '40px 20px' }}>

        <div className="brutal" style={{ padding: 40, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>{passed ? '🎉' : '📚'}</div>
          <h1 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: 8 }}>
            {passed ? 'Амжилттай!' : 'Дахин оролдоорой'}
          </h1>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, color: passed ? 'var(--green)' : '#e74c3c', margin: '16px 0' }}>
            {earned} / {total}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#555', marginBottom: 20 }}>
            {pct}% — {pct >= 80 ? 'Маш сайн' : pct >= 60 ? 'Сайн' : pct >= 40 ? 'Дунд' : 'Хангалтгүй'}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>
            Хугацаа: {minutes} мин {secs} сек зарцуулсан
          </div>
        </div>

        <div className="brutal" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 900, marginBottom: 16, fontSize: '1.1rem' }}>Хэсгийн үр дүн</h2>
          {bySection.map(({ sec, pts, got, count, correct }) => (
            <div key={sec} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sec}</span>
                <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>
                  {got}/{pts} оноо ({correct}/{count} зөв)
                </span>
              </div>
              <div style={{ background: '#e0e0e0', borderRadius: 6, height: 10, border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                <div style={{
                  height: 10, borderRadius: 6,
                  background: got / pts >= 0.6 ? 'var(--green)' : '#e74c3c',
                  width: `${(got / pts) * 100}%`
                }} />
              </div>
            </div>
          ))}
        </div>

        <div className="brutal" style={{ padding: 28, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showReview ? 20 : 0 }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>Дэлгэрэнгүй хариулт</h2>
            <button
              className="btn-brutal white-btn btn-inline"
              style={{ padding: '8px 20px', fontSize: '0.85rem', marginTop: 0 }}
              onClick={() => setShowReview(r => !r)}
            >
              {showReview ? 'Хаах ▲' : 'Харах ▼'}
            </button>
          </div>
          {showReview && questions.map(q => {
            const chosen = answers[q.id]
            const isCorrect = chosen === q.correct
            return (
              <div key={q.id} style={{
                borderRadius: 12, border: '2px solid',
                borderColor: isCorrect ? 'var(--green)' : '#e74c3c',
                padding: '12px 16px', marginBottom: 10,
                background: isCorrect ? '#f0fff0' : '#fff5f5'
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.9rem', minWidth: 24 }}>{q.id}.</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>{q.text.length > 90 ? q.text.slice(0, 90) + '…' : q.text}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', flexWrap: 'wrap' }}>
                      <span>
                        Таны хариулт: <strong style={{ color: isCorrect ? 'var(--green)' : '#e74c3c' }}>
                          {chosen ? `${chosen}. ${q.options.find(o => o.letter === chosen)?.text}` : 'Хариуласаагүй'}
                        </strong>
                      </span>
                      {!isCorrect && (
                        <span>
                          Зөв хариулт: <strong style={{ color: 'var(--green)' }}>
                            {q.correct}. {q.options.find(o => o.letter === q.correct)?.text}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '1.1rem' }}>{isCorrect ? '✅' : '❌'}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <button className="btn-brutal green-btn btn-inline" style={{ flex: 1 }} onClick={onRetry}>
            🔄 Дахин өгөх
          </button>
          <button className="btn-brutal white-btn btn-inline" style={{ flex: 1 }} onClick={onExit}>
            ← Буцах
          </button>
        </div>
      </div>
    </div>
  )
}

function TakeTest() {
  const { id } = useParams()
  const navigate = useNavigate()
  const exam = EXAMS[Number(id)]

  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(exam ? exam.duration * 53.4 : 0)
  const [submitted, setSubmitted] = useState(false)
  const [timeTaken, setTimeTaken] = useState(0)
  const [key, setKey] = useState(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (!exam || submitted) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); handleSubmit(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [exam, submitted, key])

  function handleSubmit(auto = false) {
    if (!auto) {
      const unanswered = exam.questions.length - Object.keys(answers).length
      if (unanswered > 0) {
        if (!window.confirm(`${unanswered} асуултад хариулаагүй байна. Илгээхийг хүсч байна уу?`)) return
      }
    }
    setTimeTaken(Math.round((Date.now() - startTime.current) / 1000))
    setSubmitted(true)
  }

  function handleRetry() {
    setAnswers({})
    setCurrent(0)
    setTimeLeft(exam.duration * 60)
    setSubmitted(false)
    startTime.current = Date.now()
    setKey(k => k + 1)
  }

  if (!exam) {
    return (
      <main>
        <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontWeight: 900 }}>Шалгалт олдсонгүй</h2>
          <p style={{ color: '#666', margin: '12px 0 28px' }}>Энэ шалгалт одоохондоо боломжгүй байна.</p>
          <button className="btn-brutal green-btn btn-inline" onClick={() => navigate('/tests')}>
            ← Шалгалтын жагсаалт руу буцах
          </button>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main>
        <Results
          questions={exam.questions}
          answers={answers}
          timeTaken={timeTaken}
          onRetry={handleRetry}
          onExit={() => navigate('/tests')}
        />
      </main>
    )
  }

  const questions = exam.questions
  const q = questions[current]
  const answered = Object.keys(answers).length
  const isLow = timeLeft < 300
  const prevSection = current > 0 ? questions[current - 1].section : null
  const showSectionHeader = current === 0 || prevSection !== q.section
  const showPassage = q.passage && (current === 0 || !questions[current - 1].passage || questions[current - 1].passage !== q.passage)

  return (
    <main>
      <Helmet>
        <title>TestHub — Шалгалт өгч байна</title>
        <meta name="description" content="TestHub дээр шалгалт өгч байна." />
      </Helmet>
      <div className="taketest-wrap">
        <div className="taketest-topbar">
          <div className="container topbar-inner">
            <div className="topbar-info">
              <div className="topbar-title">{exam.title}</div>
              <div className="topbar-sub">{answered}/{questions.length} хариуласан · {exam.totalPoints} оноо</div>
            </div>
            <div className={`topbar-timer${isLow ? ' low' : ''}`}>
              ⏱ {fmt(timeLeft)}
            </div>
          </div>
        </div>

        <div className="container taketest-body">
          <div className="taketest-main brutal">

            {showSectionHeader && (
              <div style={{ background: 'var(--green)', color: 'white', borderRadius: 12, padding: '10px 18px', marginBottom: 16, fontWeight: 900, fontSize: '0.95rem' }}>
                {q.section}
              </div>
            )}

            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888', marginBottom: 4 }}>
              {q.task} · {q.points} оноо
            </div>

            {q.passage && showPassage && (
              <div style={{
                background: '#f8f4ec', border: '2px solid #ccc', borderRadius: 12,
                padding: '16px 20px', marginBottom: 18, fontSize: '0.88rem',
                lineHeight: 1.7, color: '#333', whiteSpace: 'pre-line'
              }}>
                {q.passage}
              </div>
            )}

            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 20, lineHeight: 1.55, whiteSpace: 'pre-line' }}>
              {current + 1}. {q.text}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map(opt => {
                const chosen = answers[q.id] === opt.letter
                return (
                  <button
                    key={opt.letter}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.letter }))}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                      borderRadius: 12, border: '2px solid',
                      borderColor: chosen ? 'var(--green)' : '#1a1a1a',
                      background: chosen ? '#e8f8e8' : 'var(--surf)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'Arial, sans-serif',
                      fontWeight: chosen ? 800 : 600, fontSize: '0.92rem',
                      boxShadow: chosen ? '3px 3px 0 var(--green)' : '2px 2px 0 #1a1a1a',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      minWidth: 26, height: 26, borderRadius: '50%', border: '2px solid',
                      borderColor: chosen ? 'var(--green)' : '#999',
                      background: chosen ? 'var(--green)' : 'transparent',
                      color: chosen ? 'white' : '#555',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: '0.8rem', flexShrink: 0
                    }}>{opt.letter}</span>
                    <span style={{ paddingTop: 2 }}>{opt.text}</span>
                  </button>
                )
              })}
            </div>

            <div className="question-nav">
              <button
                className="btn-brutal white-btn"
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                style={{ opacity: current === 0 ? 0.4 : 1 }}
              >
                ← Өмнөх
              </button>
              {current < questions.length - 1 ? (
                <button className="btn-brutal green-btn" onClick={() => setCurrent(c => c + 1)}>
                  Дараах →
                </button>
              ) : (
                <button className="btn-brutal gold-btn" onClick={() => handleSubmit(false)}>
                  Илгээх ✓
                </button>
              )}
            </div>
          </div>

          <div className="taketest-sidebar">
            <div className="brutal" style={{ padding: 18, marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 12 }}>Асуултууд</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
                {questions.map((qq, i) => (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    title={`Q${qq.id}: ${answers[qq.id] ? 'Хариуласан' : 'Хариуласаагүй'}`}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: '2px solid',
                      borderColor: i === current ? '#1a1a1a' : answers[qq.id] ? 'var(--green)' : '#ccc',
                      background: i === current ? '#1a1a1a' : answers[qq.id] ? 'var(--green)' : 'var(--bg)',
                      color: i === current || answers[qq.id] ? 'white' : '#555',
                      fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="brutal" style={{ padding: 18, marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 10 }}>Явц</div>
              <div style={{ background: '#e0e0e0', borderRadius: 6, height: 10, border: '1px solid #ccc', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: 10, background: 'var(--green)', borderRadius: 6, width: `${(answered / questions.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#666', fontWeight: 700 }}>
                {answered} / {questions.length} хариуласан
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn-brutal gold-btn"
                onClick={() => handleSubmit(false)}
                style={{ fontSize: '0.9rem', padding: '12px' }}
              >
                Илгээх ✓
              </button>
              <button
                className="btn-brutal white-btn"
                onClick={() => navigate('/tests')}
                style={{ fontSize: '0.9rem', padding: '10px' }}
              >
                ← Буцах
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default TakeTest
