import { useState, useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const EMPTY = { icon: '📝', icon_color: 'icon-blue', name: '', price: 'Үнэгүй', subject: '', year: '', questions: 0, duration: '60 мин', difficulty: 'Дунд' }

const inputStyle = { width: '100%', padding: '8px 12px', border: '2px solid #1a1a1a', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box', background: '#f9f9f9' }

export default function AdminExams() {
  const { adminFetch } = useAdminAuth()
  const [exams,   setExams]   = useState([])
  const [form,    setForm]    = useState(null)
  const [editId,  setEditId]  = useState(null)
  const [error,   setError]   = useState('')
  const [message, setMessage] = useState('')

  function load() {
    adminFetch('/api/exams')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setExams(data.exams || []))
      .catch(() => setError('Failed to load exams'))
  }

  useEffect(() => { load() }, [])

  function openCreate()    { setEditId(null);    setForm({ ...EMPTY }); setError(''); setMessage('') }
  function openEdit(exam)  { setEditId(exam.id); setForm({ ...exam }); setError(''); setMessage('') }
  function closeForm()     { setForm(null); setEditId(null) }

  function handleField(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'questions' ? Number(value) : value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    const url    = editId ? `/api/exams/${editId}` : '/api/exams'
    const method = editId ? 'PUT' : 'POST'
    const res = await adminFetch(url, { method, body: JSON.stringify(form) })
    if (res.ok) { setMessage(editId ? 'Exam updated' : 'Exam created'); closeForm(); load() }
    else { const d = await res.json(); setError(d.error || 'Save failed') }
  }

  async function handleDelete(exam) {
    if (!window.confirm(`Delete exam "${exam.name}"?`)) return
    const res = await adminFetch(`/api/exams/${exam.id}`, { method: 'DELETE' })
    if (res.ok) { setMessage('Exam deleted'); load() }
    else setError('Delete failed')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.8rem' }}>Exams</h1>
        <button onClick={openCreate}
          style={{ padding: '10px 20px', background: '#1a1a1a', color: '#fff', border: '2px solid #1a1a1a', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
          + Create Exam
        </button>
      </div>

      {error   && <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 700 }}>{error}</div>}
      {message && <div style={{ background: '#dcfce7', border: '2px solid #16a34a', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#16a34a', fontWeight: 700 }}>{message}</div>}

      {form && (
        <div style={{ background: '#fff', border: '2px solid #1a1a1a', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 900, marginBottom: 16 }}>{editId ? 'Edit Exam' : 'New Exam'}</h2>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Name',       name: 'name',       type: 'text'   },
                { label: 'Subject',    name: 'subject',    type: 'text'   },
                { label: 'Year',       name: 'year',       type: 'text'   },
                { label: 'Price',      name: 'price',      type: 'text'   },
                { label: 'Duration',   name: 'duration',   type: 'text'   },
                { label: 'Questions',  name: 'questions',  type: 'number' },
                { label: 'Difficulty', name: 'difficulty', type: 'text'   },
                { label: 'Icon',       name: 'icon',       type: 'text'   },
              ].map(({ label, name, type }) => (
                <div key={name}>
                  <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>{label}</label>
                  <input type={type} name={name} value={form[name] ?? ''} onChange={handleField}
                    required={['name', 'subject', 'year'].includes(name)} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" style={{ padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: '2px solid #1a1a1a', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                {editId ? 'Save Changes' : 'Create'}
              </button>
              <button type="button" onClick={closeForm} style={{ padding: '10px 24px', background: '#fff', border: '2px solid #1a1a1a', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '2px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            {['Icon', 'Name', 'Subject', 'Year', 'Difficulty', 'Price', 'Actions'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exams.length === 0 && (
            <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#666' }}>No exams yet</td></tr>
          )}
          {exams.map(exam => (
            <tr key={exam.id} style={{ borderTop: '1px solid #e5e5e5' }}>
              <td style={{ padding: '10px 16px', fontSize: '1.3rem' }}>{exam.icon}</td>
              <td style={{ padding: '10px 16px', fontWeight: 700 }}>{exam.name}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{exam.subject}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{exam.year}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{exam.difficulty}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{exam.price}</td>
              <td style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(exam)} style={{ padding: '5px 12px', borderRadius: 8, border: '2px solid #1a1a1a', background: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Edit</button>
                <button onClick={() => handleDelete(exam)} style={{ padding: '5px 12px', borderRadius: 8, border: '2px solid #ef4444', background: '#fee2e2', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
