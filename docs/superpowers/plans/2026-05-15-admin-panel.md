# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully functional admin panel at `/admin/*` routes with a distinct 3-field login (username + password + admin secret code), user management, and full exam/competition CRUD.

**Architecture:** New Express route file `/api/admin` handles admin login, stats, and user management. The existing `/api/exams` and `/api/competitions` routes already grant admins full access via `canModify`, so they are reused unchanged. The React app gets a separate `AdminAuthContext`, `AdminLayout`, and five admin pages wired into the existing `HashRouter`.

**Tech Stack:** Express.js (ES modules), better-sqlite3, React 18, React Router v6 HashRouter, plain fetch

---

## File Map

**Create:**
- `server/src/routes/admin.js` — all admin API endpoints
- `web/src/context/AdminAuthContext.jsx` — admin auth state (mirrors AuthContext)
- `web/src/components/layout/AdminLayout.jsx` — sidebar nav for admin pages
- `web/src/pages/admin/AdminLogin.jsx` — 3-field admin login form
- `web/src/pages/admin/AdminDashboard.jsx` — stats overview
- `web/src/pages/admin/AdminUsers.jsx` — user management table
- `web/src/pages/admin/AdminExams.jsx` — exam management table + create/edit
- `web/src/pages/admin/AdminCompetitions.jsx` — competition management table + create/edit

**Modify:**
- `server/.env` — add `ADMIN_SECRET_CODE`
- `server/src/middleware/authenticate.js` — add `requireAdmin` export
- `server/src/app.js` — mount admin routes
- `web/src/App.jsx` — add `AdminAuthProvider`, `AdminProtectedRoute`, admin routes, hide Navbar/Footer on admin pages

---

## Task 1: Backend — Add `ADMIN_SECRET_CODE` and `requireAdmin` middleware

**Files:**
- Modify: `server/.env`
- Modify: `server/src/middleware/authenticate.js`

- [ ] **Step 1: Add secret to .env**

Open `server/.env` and append this line:
```
ADMIN_SECRET_CODE=changeme123!
```
(Change to a strong passphrase before deploying.)

- [ ] **Step 2: Add `requireAdmin` to authenticate.js**

Open `server/src/middleware/authenticate.js`. The full file after edit:

```js
import { verifySession } from '../../helpers/session.js'

export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' })

  const session = verifySession(token)
  if (!session) return res.status(401).json({ error: 'Сессий дууссан эсвэл буруу токен' })

  req.user = {
    id:       session.user_id,
    username: session.username,
    email:    session.email,
    role:     session.role,
  }
  next()
}

export function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' })
    next()
  })
}

export function canModify(row, user) {
  if (user.role === 'admin') return true
  return row.created_by === user.id
}
```

- [ ] **Step 3: Verify server still starts**

```bash
cd server && npm run dev
```
Expected: `Server running on http://localhost:3001` with no errors.

- [ ] **Step 4: Commit**

```bash
git add server/.env server/src/middleware/authenticate.js
git commit -m "feat: add requireAdmin middleware and ADMIN_SECRET_CODE env var"
```

---

## Task 2: Backend — Admin routes file

**Files:**
- Create: `server/src/routes/admin.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create `server/src/routes/admin.js`**

```js
import { Router } from 'express'
import { queryOne, queryAll, runSql } from '../db/database.js'
import { verifyPassword } from '../../helpers/password.js'
import { createSession, destroySession } from '../../helpers/session.js'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'

const router = Router()

// POST /api/admin/login — username + password + adminCode
router.post('/login', async (req, res) => {
  const { username, password, adminCode } = req.body
  if (!username || !password || !adminCode)
    return res.status(400).json({ error: 'All fields are required' })

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username])
  if (!user || !(await verifyPassword(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' })

  if (user.role !== 'admin')
    return res.status(403).json({ error: 'Not an admin account' })

  if (adminCode !== process.env.ADMIN_SECRET_CODE)
    return res.status(403).json({ error: 'Invalid admin code' })

  const token = createSession(user.id)
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
})

// GET /api/admin/me — validate token and return user
router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: req.user })
})

// GET /api/admin/stats
router.get('/stats', requireAdmin, (_req, res) => {
  const userCount        = queryOne('SELECT COUNT(*) as count FROM users').count
  const examCount        = queryOne('SELECT COUNT(*) as count FROM exams').count
  const competitionCount = queryOne('SELECT COUNT(*) as count FROM competitions').count
  const recentLoginAttempts = queryAll(
    'SELECT username, ip_address, success, attempted_at FROM login_attempts ORDER BY attempted_at DESC LIMIT 5'
  )
  res.json({ userCount, examCount, competitionCount, recentLoginAttempts })
})

// GET /api/admin/users
router.get('/users', requireAdmin, (_req, res) => {
  const users = queryAll(
    'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
  )
  res.json({ users })
})

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', requireAdmin, (req, res) => {
  const id   = Number(req.params.id)
  const { role } = req.body
  if (!['admin', 'user'].includes(role))
    return res.status(400).json({ error: 'Role must be admin or user' })
  if (!queryOne('SELECT id FROM users WHERE id = ?', [id]))
    return res.status(404).json({ error: 'User not found' })
  runSql('UPDATE users SET role = ? WHERE id = ?', [role, id])
  res.json({ message: 'Role updated' })
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id)
    return res.status(400).json({ error: 'Cannot delete your own account' })
  if (!queryOne('SELECT id FROM users WHERE id = ?', [id]))
    return res.status(404).json({ error: 'User not found' })
  runSql('DELETE FROM users WHERE id = ?', [id])
  res.json({ message: 'User deleted' })
})

// POST /api/admin/logout
router.post('/logout', authenticate, (req, res) => {
  destroySession(req.headers['authorization'].slice(7))
  res.json({ message: 'Logged out' })
})

export default router
```

- [ ] **Step 2: Mount admin routes in `server/src/app.js`**

Full file after edit:

```js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import './db/seed.js'
import examRoutes from './routes/exams.js'
import competitionRoutes from './routes/competitions.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/competitions', competitionRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

- [ ] **Step 3: Manually test admin login endpoint**

Start server (`npm run dev` in `server/`), then run in a separate terminal:

```bash
curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<your-admin-username>","password":"<your-admin-password>","adminCode":"changeme123!"}' | jq .
```
Expected: `{ "token": "...", "user": { "role": "admin", ... } }`

Wrong code:
```bash
curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<admin>","password":"<pass>","adminCode":"wrong"}' | jq .
```
Expected: `{ "error": "Invalid admin code" }` with status 403.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/admin.js server/src/app.js
git commit -m "feat: add admin API routes (login, stats, users, logout)"
```

---

## Task 3: Frontend — AdminAuthContext

**Files:**
- Create: `web/src/context/AdminAuthContext.jsx`

- [ ] **Step 1: Create `web/src/context/AdminAuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [adminUser,  setAdminUser]  = useState(null)
  const [adminToken, setAdminToken] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('admin_token')
    if (!saved) { setLoading(false); return }

    fetch('/api/admin/me', { headers: { Authorization: `Bearer ${saved}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) { setAdminToken(saved); setAdminUser(data.user) }
        else localStorage.removeItem('admin_token')
      })
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false))
  }, [])

  function adminLogin(token, user) {
    localStorage.setItem('admin_token', token)
    setAdminToken(token)
    setAdminUser(user)
  }

  async function adminLogout() {
    if (adminToken) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {})
    }
    localStorage.removeItem('admin_token')
    setAdminToken(null)
    setAdminUser(null)
  }

  function adminFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: adminToken ? `Bearer ${adminToken}` : '',
      },
    })
  }

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminToken, loading, adminLogin, adminLogout, adminFetch }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/context/AdminAuthContext.jsx
git commit -m "feat: add AdminAuthContext for admin session management"
```

---

## Task 4: Frontend — AdminLogin page

**Files:**
- Create: `web/src/pages/admin/AdminLogin.jsx`

- [ ] **Step 1: Create `web/src/pages/admin/AdminLogin.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const inputStyle = {
  width: '100%', padding: '12px 16px', border: '2px solid #1a1a1a',
  borderRadius: 12, fontSize: '1rem', fontFamily: 'Arial, Helvetica, sans-serif',
  background: '#f9f9f9', outline: 'none', boxSizing: 'border-box',
}

export default function AdminLogin() {
  const navigate    = useNavigate()
  const { adminLogin } = useAdminAuth()

  const [username,  setUsername]  = useState('')
  const [password,  setPassword]  = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, adminCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      adminLogin(data.token, data.user)
      navigate('/admin')
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', padding: 20 }}>
      <div className="brutal" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🛡️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 6 }}>Admin Login</h1>
          <p style={{ color: '#666' }}>TestHub Administration</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontWeight: 700, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 800, display: 'block', marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin username" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 800, display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 800, display: 'block', marginBottom: 6 }}>Admin Code</label>
            <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)}
              placeholder="Secret admin code" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} className="btn-brutal"
            style={{ width: '100%', background: '#1a1a1a', color: '#fff', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/admin/AdminLogin.jsx
git commit -m "feat: add AdminLogin page with 3-field form"
```

---

## Task 5: Frontend — AdminLayout sidebar

**Files:**
- Create: `web/src/components/layout/AdminLayout.jsx`

- [ ] **Step 1: Create `web/src/components/layout/AdminLayout.jsx`**

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const navItems = [
  { to: '/admin',              label: '📊 Dashboard', end: true },
  { to: '/admin/users',        label: '👥 Users' },
  { to: '/admin/exams',        label: '📝 Exams' },
  { to: '/admin/competitions', label: '🏆 Competitions' },
]

const linkStyle = (isActive) => ({
  display: 'block', padding: '10px 16px', borderRadius: 10, fontWeight: 700,
  textDecoration: 'none', marginBottom: 4,
  background: isActive ? '#1a1a1a' : 'transparent',
  color: isActive ? '#fff' : '#1a1a1a',
})

export default function AdminLayout() {
  const { adminUser, adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await adminLogout()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#f5f5f5', borderRight: '2px solid #1a1a1a', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>🛡️ Admin</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>{adminUser?.username}</div>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => linkStyle(isActive)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout}
          style={{ marginTop: 'auto', padding: '10px 16px', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/layout/AdminLayout.jsx
git commit -m "feat: add AdminLayout sidebar component"
```

---

## Task 6: Frontend — AdminDashboard page

**Files:**
- Create: `web/src/pages/admin/AdminDashboard.jsx`

- [ ] **Step 1: Create `web/src/pages/admin/AdminDashboard.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const cardStyle = {
  flex: 1, minWidth: 160, padding: 24, border: '2px solid #1a1a1a',
  borderRadius: 16, background: '#fff', textAlign: 'center',
}

export default function AdminDashboard() {
  const { adminFetch } = useAdminAuth()
  const [stats,   setStats]   = useState(null)
  const [error,   setError]   = useState('')

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

      {/* Stat cards */}
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

      {/* Recent login attempts */}
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
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/admin/AdminDashboard.jsx
git commit -m "feat: add AdminDashboard with stats and login attempts"
```

---

## Task 7: Frontend — AdminUsers page

**Files:**
- Create: `web/src/pages/admin/AdminUsers.jsx`

- [ ] **Step 1: Create `web/src/pages/admin/AdminUsers.jsx`**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/admin/AdminUsers.jsx
git commit -m "feat: add AdminUsers page with role toggle and delete"
```

---

## Task 8: Frontend — AdminExams page

**Files:**
- Create: `web/src/pages/admin/AdminExams.jsx`

- [ ] **Step 1: Create `web/src/pages/admin/AdminExams.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const EMPTY = { icon: '📝', icon_color: 'icon-blue', name: '', price: 'Үнэгүй', subject: '', year: '', questions: 0, duration: '60 мин', difficulty: 'Дунд' }

const inputStyle = { width: '100%', padding: '8px 12px', border: '2px solid #1a1a1a', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box', background: '#f9f9f9' }

export default function AdminExams() {
  const { adminFetch } = useAdminAuth()
  const [exams,    setExams]    = useState([])
  const [form,     setForm]     = useState(null)  // null = closed, {} = create/edit
  const [editId,   setEditId]   = useState(null)
  const [error,    setError]    = useState('')
  const [message,  setMessage]  = useState('')

  function load() {
    adminFetch('/api/exams')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setExams(data.exams || []))
      .catch(() => setError('Failed to load exams'))
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditId(null); setForm({ ...EMPTY }); setError(''); setMessage('') }
  function openEdit(exam) { setEditId(exam.id); setForm({ ...exam }); setError(''); setMessage('') }
  function closeForm() { setForm(null); setEditId(null) }

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
        <button onClick={openCreate} className="btn-brutal"
          style={{ padding: '10px 20px', background: '#1a1a1a', color: '#fff', border: '2px solid #1a1a1a', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
          + Create Exam
        </button>
      </div>

      {error   && <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 700 }}>{error}</div>}
      {message && <div style={{ background: '#dcfce7', border: '2px solid #16a34a', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#16a34a', fontWeight: 700 }}>{message}</div>}

      {/* Create / Edit form */}
      {form && (
        <div style={{ background: '#fff', border: '2px solid #1a1a1a', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 900, marginBottom: 16 }}>{editId ? 'Edit Exam' : 'New Exam'}</h2>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Name',       name: 'name',       type: 'text' },
                { label: 'Subject',    name: 'subject',    type: 'text' },
                { label: 'Year',       name: 'year',       type: 'text' },
                { label: 'Price',      name: 'price',      type: 'text' },
                { label: 'Duration',   name: 'duration',   type: 'text' },
                { label: 'Questions',  name: 'questions',  type: 'number' },
                { label: 'Difficulty', name: 'difficulty', type: 'text' },
                { label: 'Icon',       name: 'icon',       type: 'text' },
              ].map(({ label, name, type }) => (
                <div key={name}>
                  <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>{label}</label>
                  <input type={type} name={name} value={form[name] ?? ''} onChange={handleField} required={['name','subject','year'].includes(name)} style={inputStyle} />
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

      {/* Exams table */}
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
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/admin/AdminExams.jsx
git commit -m "feat: add AdminExams page with create/edit/delete"
```

---

## Task 9: Frontend — AdminCompetitions page

**Files:**
- Create: `web/src/pages/admin/AdminCompetitions.jsx`

- [ ] **Step 1: Create `web/src/pages/admin/AdminCompetitions.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const EMPTY = { icon: '🏆', icon_class: 'icon-gold', title: '', date: '', status: 'upcoming', participants: 0, prize: '₮0', subject: '', price: 0, likes: 0 }

const inputStyle = { width: '100%', padding: '8px 12px', border: '2px solid #1a1a1a', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box', background: '#f9f9f9' }

export default function AdminCompetitions() {
  const { adminFetch } = useAdminAuth()
  const [competitions, setCompetitions] = useState([])
  const [form,         setForm]         = useState(null)
  const [editId,       setEditId]       = useState(null)
  const [error,        setError]        = useState('')
  const [message,      setMessage]      = useState('')

  function load() {
    adminFetch('/api/competitions')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setCompetitions(data.competitions || []))
      .catch(() => setError('Failed to load competitions'))
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditId(null); setForm({ ...EMPTY }); setError(''); setMessage('') }
  function openEdit(c)  { setEditId(c.id); setForm({ ...c });     setError(''); setMessage('') }
  function closeForm()  { setForm(null); setEditId(null) }

  function handleField(e) {
    const { name, value } = e.target
    const numFields = ['participants', 'price', 'likes']
    setForm(prev => ({ ...prev, [name]: numFields.includes(name) ? Number(value) : value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    const url    = editId ? `/api/competitions/${editId}` : '/api/competitions'
    const method = editId ? 'PUT' : 'POST'
    const res = await adminFetch(url, { method, body: JSON.stringify(form) })
    if (res.ok) { setMessage(editId ? 'Competition updated' : 'Competition created'); closeForm(); load() }
    else { const d = await res.json(); setError(d.error || 'Save failed') }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete competition "${c.title}"?`)) return
    const res = await adminFetch(`/api/competitions/${c.id}`, { method: 'DELETE' })
    if (res.ok) { setMessage('Competition deleted'); load() }
    else setError('Delete failed')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.8rem' }}>Competitions</h1>
        <button onClick={openCreate}
          style={{ padding: '10px 20px', background: '#1a1a1a', color: '#fff', border: '2px solid #1a1a1a', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
          + Create Competition
        </button>
      </div>

      {error   && <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 700 }}>{error}</div>}
      {message && <div style={{ background: '#dcfce7', border: '2px solid #16a34a', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#16a34a', fontWeight: 700 }}>{message}</div>}

      {/* Create / Edit form */}
      {form && (
        <div style={{ background: '#fff', border: '2px solid #1a1a1a', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 900, marginBottom: 16 }}>{editId ? 'Edit Competition' : 'New Competition'}</h2>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Title',        name: 'title',        type: 'text'   },
                { label: 'Subject',      name: 'subject',      type: 'text'   },
                { label: 'Date',         name: 'date',         type: 'text'   },
                { label: 'Status',       name: 'status',       type: 'text'   },
                { label: 'Prize',        name: 'prize',        type: 'text'   },
                { label: 'Price',        name: 'price',        type: 'number' },
                { label: 'Participants', name: 'participants', type: 'number' },
                { label: 'Icon',         name: 'icon',         type: 'text'   },
              ].map(({ label, name, type }) => (
                <div key={name}>
                  <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>{label}</label>
                  <input type={type} name={name} value={form[name] ?? ''} onChange={handleField} required={['title','subject','date'].includes(name)} style={inputStyle} />
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

      {/* Competitions table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '2px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            {['Icon', 'Title', 'Subject', 'Date', 'Status', 'Prize', 'Actions'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {competitions.length === 0 && (
            <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#666' }}>No competitions yet</td></tr>
          )}
          {competitions.map(c => (
            <tr key={c.id} style={{ borderTop: '1px solid #e5e5e5' }}>
              <td style={{ padding: '10px 16px', fontSize: '1.3rem' }}>{c.icon}</td>
              <td style={{ padding: '10px 16px', fontWeight: 700 }}>{c.title}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{c.subject}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{c.date}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{c.status}</td>
              <td style={{ padding: '10px 16px', color: '#666' }}>{c.prize}</td>
              <td style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(c)} style={{ padding: '5px 12px', borderRadius: 8, border: '2px solid #1a1a1a', background: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Edit</button>
                <button onClick={() => handleDelete(c)} style={{ padding: '5px 12px', borderRadius: 8, border: '2px solid #ef4444', background: '#fee2e2', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/admin/AdminCompetitions.jsx
git commit -m "feat: add AdminCompetitions page with create/edit/delete"
```

---

## Task 10: Frontend — Wire admin routes into App.jsx

**Files:**
- Modify: `web/src/App.jsx`

- [ ] **Step 1: Replace `web/src/App.jsx` with the full updated version**

```jsx
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AdminLayout from './components/layout/AdminLayout'
import Home from './pages/Home'
import Tests from './pages/Tests'
import Competitions from './pages/Competitions'
import Profile from './pages/Profile'
import TestHistory from './pages/TestHistory'
import PaymentInfo from './pages/PaymentInfo'
import ChangePassword from './pages/ChangePassword'
import Help from './pages/Help'
import TakeTest from './pages/TakeTest'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminExams from './pages/admin/AdminExams'
import AdminCompetitions from './pages/admin/AdminCompetitions'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminProtectedRoute({ children }) {
  const { adminUser, loading } = useAdminAuth()
  if (loading) return null
  if (!adminUser) return <Navigate to="/admin/login" replace />
  return children
}

function AppShell() {
  const location = useLocation()
  const isAdmin  = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/"             element={<Home />} />
        <Route path="/tests"        element={<Tests />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/help"         element={<Help />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/signup"       element={<Signup />} />

        {/* User protected routes */}
        <Route path="/test/:id"        element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/test-history"    element={<ProtectedRoute><TestHistory /></ProtectedRoute>} />
        <Route path="/payment-info"    element={<ProtectedRoute><PaymentInfo /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

        {/* Admin login — public */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin protected routes — wrapped in AdminLayout */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="exams"        element={<AdminExams />} />
          <Route path="competitions" element={<AdminCompetitions />} />
        </Route>
      </Routes>
      {!isAdmin && <Footer />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 2: Start the dev server and verify**

In `web/`:
```bash
npm run dev
```

Open browser and visit each route:
1. `http://localhost:5173/#/admin/login` — should show the 3-field admin login form (no Navbar/Footer)
2. `http://localhost:5173/#/admin` — without logging in, should redirect to `/admin/login`
3. Log in with your admin account + `changeme123!` — should redirect to the dashboard
4. Dashboard should show user/exam/competition counts
5. Sidebar links to Users, Exams, Competitions should all work
6. Logout button should clear session and redirect to `/admin/login`
7. Regular routes (`/`, `/tests`, `/login`) should still show Navbar and Footer normally

- [ ] **Step 3: Commit**

```bash
git add web/src/App.jsx
git commit -m "feat: wire admin routes into App with AdminProtectedRoute and AdminLayout"
```

---

## Final Verification Checklist

- [ ] Admin login rejects wrong password → 401 "Invalid credentials"
- [ ] Admin login rejects wrong admin code → 403 "Invalid admin code"
- [ ] Admin login rejects non-admin account → 403 "Not an admin account"
- [ ] Navigating to `/admin` without a token redirects to `/admin/login`
- [ ] After login, dashboard shows counts
- [ ] User role toggle works (promote/demote)
- [ ] Delete user is blocked for own account (button hidden in UI, 400 on server)
- [ ] Exam create/edit/delete all work
- [ ] Competition create/edit/delete all work
- [ ] Admin logout clears `admin_token` from localStorage
- [ ] Regular user session (`auth_token`) is completely unaffected by admin login/logout
- [ ] Navbar and Footer are hidden on all `/admin/*` pages
