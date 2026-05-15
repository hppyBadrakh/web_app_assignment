import { useState, useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const cardStyle = {
  flex: 1, minWidth: 160, padding: 24, border: '2px solid #1a1a1a',
  borderRadius: 16, background: '#fff', textAlign: 'center',
}

export default function AdminDashboard() {
  const { adminFetch } = useAdminAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
  }, [])

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!stats) return <p>Loading...</p>

  return (
    <div>
      <h1 style={{ fontWeight: 900, fontSize: '1.8rem', marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.userCount}</div>
          <div style={{ color: '#666', fontWeight: 700, marginTop: 6 }}>Users</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.examCount}</div>
          <div style={{ color: '#666', fontWeight: 700, marginTop: 6 }}>Exams</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.competitionCount}</div>
          <div style={{ color: '#666', fontWeight: 700, marginTop: 6 }}>Competitions</div>
        </div>
      </div>

      <h2 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: 12 }}>Recent Login Attempts</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '2px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            {['Username', 'IP', 'Result', 'Time'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.recentLoginAttempts.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 16, color: '#666', textAlign: 'center' }}>No attempts yet</td></tr>
          )}
          {stats.recentLoginAttempts.map((a, i) => (
            <tr key={i} style={{ borderTop: '1px solid #e5e5e5' }}>
              <td style={{ padding: '10px 16px', fontWeight: 700 }}>{a.username}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{a.ip_address || '—'}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{ fontWeight: 700, color: a.success ? '#16a34a' : '#dc2626' }}>
                  {a.success ? '✓ Success' : '✗ Failed'}
                </span>
              </td>
              <td style={{ padding: '10px 16px', color: '#666', fontSize: '0.9rem' }}>{a.attempted_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
