import { useState, useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminUsers() {
  const { adminFetch, adminUser } = useAdminAuth()
  const [users,   setUsers]   = useState([])
  const [error,   setError]   = useState('')
  const [message, setMessage] = useState('')

  function load() {
    adminFetch('/api/admin/users')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUsers(data.users))
      .catch(() => setError('Failed to load users'))
  }

  useEffect(() => { load() }, [])

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const res = await adminFetch(`/api/admin/users/${user.id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) { setMessage(`${user.username} is now ${newRole}`); load() }
    else setError('Failed to update role')
  }

  async function deleteUser(user) {
    if (!window.confirm(`Delete "${user.username}"? This cannot be undone.`)) return
    const res = await adminFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) { setMessage(`${user.username} deleted`); load() }
    else { const d = await res.json(); setError(d.error || 'Failed to delete') }
  }

  return (
    <div>
      <h1 style={{ fontWeight: 900, fontSize: '1.8rem', marginBottom: 24 }}>Users</h1>

      {error   && <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 700 }}>{error}</div>}
      {message && <div style={{ background: '#dcfce7', border: '2px solid #16a34a', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#16a34a', fontWeight: 700 }}>{message}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '2px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            {['Username', 'Email', 'Role', 'Created', 'Actions'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderTop: '1px solid #e5e5e5' }}>
              <td style={{ padding: '10px 16px', fontWeight: 700 }}>{u.username}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{u.email}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800,
                  background: u.role === 'admin' ? '#1a1a1a' : '#e5e5e5',
                  color: u.role === 'admin' ? '#fff' : '#1a1a1a' }}>
                  {u.role}
                </span>
              </td>
              <td style={{ padding: '10px 16px', color: '#666', fontSize: '0.9rem' }}>{u.created_at?.slice(0, 10)}</td>
              <td style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
                <button onClick={() => toggleRole(u)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: '2px solid #1a1a1a', background: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                  {u.role === 'admin' ? 'Demote' : 'Promote'}
                </button>
                {u.id !== adminUser?.id && (
                  <button onClick={() => deleteUser(u)}
                    style={{ padding: '5px 12px', borderRadius: 8, border: '2px solid #ef4444', background: '#fee2e2', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' }}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
