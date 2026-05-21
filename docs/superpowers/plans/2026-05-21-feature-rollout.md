# Feature Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate auth to express-session cookies, add avatar upload, responsive CSS, accessibility, SEO, and Jest tests across the TestHub app.

**Architecture:** Backend keeps the custom Bearer-token system for admin routes (AdminAuthContext unchanged); user routes switch fully to express-session + httpOnly cookies. Frontend drops localStorage tokens and uses `credentials: 'include'` on every fetch. A custom 30-line SQLite session store avoids npm ESM-compatibility issues.

**Tech Stack:** Express.js (ESM), better-sqlite3, express-session (custom store), multer, React 18, Vite, react-helmet-async, Jest + supertest (ESM via `--experimental-vm-modules`)

---

## File Map

**New files:**
- `server/src/routes/profile.js` — avatar upload endpoint
- `server/src/store/sqliteSessionStore.js` — custom express-session store
- `server/tests/setup.js` — Jest env setup
- `server/tests/password.test.js`
- `server/tests/avatar.test.js`
- `server/tests/register.test.js`
- `server/tests/logout.test.js`
- `server/tests/login.test.js`
- `server/jest.config.js`
- `server/.env.example`
- `web/public/robots.txt`
- `web/public/sitemap.xml`

**Modified files:**
- `server/.env` — add SESSION_SECRET, CLIENT_ORIGIN
- `server/src/app.js` — express-session, CORS with credentials, static /uploads
- `server/src/db/database.js` — rename sessions→token_sessions, add avatar_url, TEST_DB
- `server/src/routes/auth.js` — req.session instead of tokens
- `server/src/routes/admin.js` — use authenticateBearer
- `server/src/middleware/authenticate.js` — session-based + keep Bearer for admin
- `server/package.json` — new deps + test script
- `web/src/context/AuthContext.jsx` — drop token/localStorage, add updateUser
- `web/src/pages/Login.jsx` — credentials:include, updated login() call
- `web/src/pages/Signup.jsx` — credentials:include, updated login() call
- `web/src/pages/Profile.jsx` — real user data + avatar upload
- `web/src/components/layout/Navbar.jsx` — avatar img, keyboard a11y
- `web/src/index.css` — breakpoints, contrast fix, sr-only, focus styles
- `web/src/App.jsx` — LiveRegion component
- `web/src/main.jsx` — HelmetProvider
- `web/src/pages/Home.jsx`, `Tests.jsx`, `Competitions.jsx`, `Help.jsx`, `Login.jsx`, `Signup.jsx`, `Profile.jsx`, `TakeTest.jsx`, `TestHistory.jsx` — Helmet tags + lazy images + aria fixes

---

## Task 1: Environment & Package Setup

**Files:**
- Modify: `server/.env`
- Create: `server/.env.example`
- Modify: `server/package.json`
- Modify: `web/package.json`

- [ ] **Step 1: Add new env vars to server/.env**

Open `server/.env` and append:
```
SESSION_SECRET=change-this-to-a-long-random-string-in-production
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

- [ ] **Step 2: Create server/.env.example**

```
PASSWORD_SECRET_KEY=your-pepper-secret-here
SESSION_SECRET=your-session-secret-here
CLIENT_ORIGIN=http://localhost:5173
PORT=3001
ADMIN_SECRET_CODE=your-admin-code
NODE_ENV=development
# For tests only:
# TEST_DB=:memory:
```

- [ ] **Step 3: Install server backend packages**

```bash
cd server
npm install express-session multer
```

Expected: `package.json` updated, no errors.

- [ ] **Step 4: Install server test packages**

```bash
cd server
npm install --save-dev jest supertest
```

Expected: `package.json` devDependencies updated.

- [ ] **Step 5: Install frontend package**

```bash
cd web
npm install react-helmet-async
```

Expected: `package.json` updated.

- [ ] **Step 6: Commit**

```bash
git add server/.env.example server/package.json server/package-lock.json web/package.json web/package-lock.json
git commit -m "chore: install express-session, multer, jest, supertest, react-helmet-async"
```

---

## Task 2: Database & Session Store Setup

**Files:**
- Modify: `server/src/db/database.js`
- Create: `server/src/store/sqliteSessionStore.js`

- [ ] **Step 1: Update database.js**

Replace the full contents of `server/src/db/database.js` with:

```js
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.TEST_DB
  ? process.env.TEST_DB
  : join(__dirname, '../../testhub.db')

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    icon        TEXT    NOT NULL DEFAULT '📝',
    icon_color  TEXT    NOT NULL DEFAULT 'icon-blue',
    name        TEXT    NOT NULL,
    price       TEXT    NOT NULL DEFAULT 'Үнэгүй',
    subject     TEXT    NOT NULL,
    year        TEXT    NOT NULL,
    questions   INTEGER NOT NULL DEFAULT 0,
    duration    TEXT    NOT NULL DEFAULT '60 мин',
    difficulty  TEXT    NOT NULL DEFAULT 'Дунд'
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS competitions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    icon         TEXT    NOT NULL DEFAULT '🏆',
    icon_class   TEXT    NOT NULL DEFAULT 'icon-gold',
    title        TEXT    NOT NULL,
    date         TEXT    NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'upcoming',
    participants INTEGER NOT NULL DEFAULT 0,
    prize        TEXT    NOT NULL DEFAULT '₮0',
    subject      TEXT    NOT NULL,
    price        INTEGER NOT NULL DEFAULT 0,
    likes        INTEGER NOT NULL DEFAULT 0
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    avatar_url    TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

// Legacy token-based sessions — kept for admin Bearer-token auth
db.exec(`
  CREATE TABLE IF NOT EXISTS token_sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS login_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    NOT NULL,
    ip_address   TEXT,
    success      INTEGER NOT NULL DEFAULT 0,
    attempted_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

// Rename legacy sessions table if it still exists under the old name
try { db.exec('ALTER TABLE sessions RENAME TO token_sessions') } catch (_) {}

// Add new columns if upgrading an existing database
try { db.exec('ALTER TABLE exams        ADD COLUMN created_by INTEGER REFERENCES users(id)') } catch (_) {}
try { db.exec('ALTER TABLE competitions ADD COLUMN created_by INTEGER REFERENCES users(id)') } catch (_) {}
try { db.exec('ALTER TABLE users        ADD COLUMN avatar_url TEXT') } catch (_) {}

export function save() {}

export function queryOne(sql, params = []) {
  return db.prepare(sql).get(params)
}

export function queryAll(sql, params = []) {
  return db.prepare(sql).all(params)
}

export function runSql(sql, params = []) {
  const result = db.prepare(sql).run(params)
  return result.lastInsertRowid ?? null
}

export default db
```

- [ ] **Step 2: Update session.js helpers to use token_sessions table**

Open `server/helpers/session.js`. Change every occurrence of the table name `sessions` to `token_sessions`:

Line 16: `'INSERT INTO token_sessions (user_id, token, expires_at) VALUES (?, ?, ?)'`
Line 25: `` `SELECT s.user_id, u.username, u.email, u.role FROM token_sessions s JOIN users u ...` ``
Line 37: `'DELETE FROM token_sessions WHERE token = ?'`
Line 42: `"DELETE FROM token_sessions WHERE expires_at < datetime('now')"`

Full updated `server/helpers/session.js`:
```js
import { generateToken } from './password.js'
import { queryOne, runSql } from '../src/db/database.js'

const SESSION_EXPIRY_HOURS = 24

function toSqliteDate(date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

export function createSession(userId) {
  const token     = generateToken(32)
  const expiresAt = toSqliteDate(new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000))

  runSql(
    'INSERT INTO token_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )

  return token
}

export function verifySession(token) {
  const session = queryOne(
    `SELECT s.user_id, u.username, u.email, u.role, u.avatar_url
     FROM token_sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > datetime('now')`,
    [token]
  )
  return session || null
}

export function destroySession(token) {
  runSql('DELETE FROM token_sessions WHERE token = ?', [token])
}

export function cleanExpiredSessions() {
  runSql("DELETE FROM token_sessions WHERE expires_at < datetime('now')")
}
```

- [ ] **Step 3: Create custom SQLite session store**

Create `server/src/store/sqliteSessionStore.js`:
```js
import { Store } from 'express-session'

export class SqliteSessionStore extends Store {
  constructor(db, options = {}) {
    super()
    this.db    = db
    this.table = options.tableName || 'express_sessions'
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        sid     TEXT    PRIMARY KEY,
        sess    TEXT    NOT NULL,
        expired INTEGER NOT NULL
      )
    `)
    setInterval(
      () => this.db.prepare(`DELETE FROM ${this.table} WHERE expired < ?`).run(Date.now()),
      15 * 60 * 1000
    )
  }

  get(sid, callback) {
    try {
      const row = this.db.prepare(`SELECT sess, expired FROM ${this.table} WHERE sid = ?`).get(sid)
      if (!row || row.expired < Date.now()) return callback(null, null)
      callback(null, JSON.parse(row.sess))
    } catch (e) { callback(e) }
  }

  set(sid, session, callback) {
    try {
      const expired = session.cookie?.expires
        ? new Date(session.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000
      this.db.prepare(
        `INSERT OR REPLACE INTO ${this.table} (sid, sess, expired) VALUES (?, ?, ?)`
      ).run(sid, JSON.stringify(session), expired)
      callback(null)
    } catch (e) { callback(e) }
  }

  destroy(sid, callback) {
    try {
      this.db.prepare(`DELETE FROM ${this.table} WHERE sid = ?`).run(sid)
      callback(null)
    } catch (e) { callback(e) }
  }

  touch(sid, session, callback) {
    this.set(sid, session, callback)
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/db/database.js server/helpers/session.js server/src/store/sqliteSessionStore.js
git commit -m "feat: add avatar_url column, rename token_sessions, add custom SQLite session store"
```

---

## Task 3: Backend — express-session + CORS

**Files:**
- Modify: `server/src/app.js`

- [ ] **Step 1: Rewrite app.js**

```js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import db from './db/database.js'
import './db/seed.js'
import { SqliteSessionStore } from './store/sqliteSessionStore.js'
import examRoutes from './routes/exams.js'
import competitionRoutes from './routes/competitions.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import profileRoutes from './routes/profile.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new SqliteSessionStore(db, { tableName: 'express_sessions' }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}))

app.use('/uploads', express.static(join(__dirname, '../uploads'), { maxAge: '1y' }))

app.use('/api/auth',         authRoutes)
app.use('/api/admin',        adminRoutes)
app.use('/api/profile',      profileRoutes)
app.use('/api/exams',        examRoutes)
app.use('/api/competitions', competitionRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))

export default app
```

- [ ] **Step 2: Create uploads directory**

```bash
mkdir -p server/uploads
touch server/uploads/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add server/src/app.js server/uploads/.gitkeep
git commit -m "feat: add express-session middleware, CORS credentials, /uploads static serving"
```

---

## Task 4: Backend — Auth Middleware & Routes

**Files:**
- Modify: `server/src/middleware/authenticate.js`
- Modify: `server/src/routes/auth.js`
- Modify: `server/src/routes/admin.js`

- [ ] **Step 1: Rewrite authenticate.js**

```js
import { queryOne } from '../db/database.js'
import { verifySession } from '../../helpers/session.js'

// User routes — reads express-session cookie
export function authenticate(req, res, next) {
  if (!req.session?.userId)
    return res.status(401).json({ error: 'Unauthorized' })

  const user = queryOne(
    'SELECT id, username, email, role, avatar_url FROM users WHERE id = ?',
    [req.session.userId]
  )

  if (!user) {
    req.session.destroy(() => {})
    return res.status(401).json({ error: 'Unauthorized' })
  }

  req.user = {
    id:        user.id,
    username:  user.username,
    email:     user.email,
    role:      user.role,
    avatarUrl: user.avatar_url || null,
  }
  next()
}

// Admin routes — reads Authorization: Bearer <token> header (legacy token system)
export function authenticateBearer(req, res, next) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' })

  const session = verifySession(token)
  if (!session) return res.status(401).json({ error: 'Сессий дууссан эсвэл буруу токен' })

  req.user = {
    id:        session.user_id,
    username:  session.username,
    email:     session.email,
    role:      session.role,
    avatarUrl: session.avatar_url || null,
  }
  next()
}

export function requireAdmin(req, res, next) {
  authenticateBearer(req, res, () => {
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

- [ ] **Step 2: Rewrite auth.js**

```js
import { Router } from 'express'
import { queryOne, runSql } from '../db/database.js'
import { validatePasswordStrength, hashPassword, verifyPassword } from '../../helpers/password.js'
import { isLockedOut, recordLoginAttempt, getRemainingAttempts } from '../../helpers/limit.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' })

  const { isValid, errors } = validatePasswordStrength(password)
  if (!isValid)
    return res.status(400).json({ error: errors[0], errors })

  if (queryOne('SELECT id FROM users WHERE username = ?', [username]))
    return res.status(409).json({ error: 'Энэ хэрэглэгчийн нэр бүртгэлтэй байна' })

  if (queryOne('SELECT id FROM users WHERE email = ?', [email]))
    return res.status(409).json({ error: 'Энэ имэйл хаяг бүртгэлтэй байна' })

  const passwordHash = await hashPassword(password)
  const role = queryOne('SELECT COUNT(*) as count FROM users').count === 0 ? 'admin' : 'user'

  const newUserId = runSql(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, role]
  )

  req.session.userId = newUserId
  res.status(201).json({
    message: 'Бүртгэл амжилттай',
    user: { id: newUserId, username, email, role, avatarUrl: null },
  })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const ip = req.ip || req.socket?.remoteAddress || null

  if (!username || !password)
    return res.status(400).json({ error: 'Хэрэглэгчийн нэр болон нууц үгийг оруулна уу' })

  if (isLockedOut(username))
    return res.status(429).json({ error: 'Хэт олон буруу оролдлого. 15 минутын дараа дахин оролдоно уу' })

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username])

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    recordLoginAttempt(username, false, ip)
    return res.status(401).json({
      error: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна',
      remainingAttempts: getRemainingAttempts(username),
    })
  }

  recordLoginAttempt(username, true, ip)
  req.session.userId = user.id
  res.json({
    message: 'Амжилттай нэвтэрлээ',
    user: {
      id:        user.id,
      username:  user.username,
      email:     user.email,
      role:      user.role,
      avatarUrl: user.avatar_url || null,
    },
  })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Амжилттай гарлаа' }))
})

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user })
})

export default router
```

- [ ] **Step 3: Update admin.js to use authenticateBearer**

Change the import on line 4:
```js
import { authenticateBearer, requireAdmin } from '../middleware/authenticate.js'
```

And update the `/login` route — admin login still creates a Bearer token (unchanged). Update the `/me` route to use `requireAdmin` (which already calls `authenticateBearer`). No other changes needed.

Full updated `server/src/routes/admin.js` (only the import line changes):
```js
import { Router } from 'express'
import { queryOne, queryAll, runSql } from '../db/database.js'
import { createSession, destroySession } from '../../helpers/session.js'
import { authenticateBearer, requireAdmin } from '../middleware/authenticate.js'

const router = Router()

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { adminCode } = req.body
  if (!adminCode)
    return res.status(400).json({ error: 'Admin code is required' })

  if (adminCode !== process.env.ADMIN_SECRET_CODE)
    return res.status(403).json({ error: 'Invalid admin code' })

  const admin = queryOne("SELECT * FROM users WHERE role = 'admin' ORDER BY id LIMIT 1")
  if (!admin)
    return res.status(500).json({ error: 'No admin account found in database' })

  const token = createSession(admin.id)
  res.json({ token, user: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } })
})

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: req.user })
})

// GET /api/admin/stats
router.get('/stats', requireAdmin, (_req, res) => {
  const userCount           = queryOne('SELECT COUNT(*) as count FROM users').count
  const examCount           = queryOne('SELECT COUNT(*) as count FROM exams').count
  const competitionCount    = queryOne('SELECT COUNT(*) as count FROM competitions').count
  const recentLoginAttempts = queryAll(
    'SELECT username, ip_address, success, attempted_at FROM login_attempts ORDER BY attempted_at DESC LIMIT 5'
  )
  res.json({ userCount, examCount, competitionCount, recentLoginAttempts })
})
```

Read the rest of admin.js (users/exams/competitions CRUD) — **do not change those routes**, they already use `requireAdmin`.

- [ ] **Step 4: Commit**

```bash
git add server/src/middleware/authenticate.js server/src/routes/auth.js server/src/routes/admin.js
git commit -m "feat: migrate user auth to express-session, keep admin on Bearer tokens"
```

---

## Task 5: Backend — Profile Route (Avatar Upload)

**Files:**
- Create: `server/src/routes/profile.js`

- [ ] **Step 1: Create profile.js**

```js
import { Router } from 'express'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomBytes } from 'crypto'
import { runSql } from '../db/database.js'
import { authenticate } from '../middleware/authenticate.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg'
    cb(null, randomBytes(16).toString('hex') + ext)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(Object.assign(new Error('Only JPEG and PNG files are allowed'), { status: 400 }))
    }
  },
})

const router = Router()

// POST /api/profile/avatar
router.post('/avatar', authenticate, (req, res) => {
  upload.single('avatar')(req, res, err => {
    if (err) {
      const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 400)
      return res.status(status).json({ error: err.message })
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const avatarUrl = `/uploads/${req.file.filename}`
    runSql('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id])
    req.session.touch?.()
    res.json({ avatarUrl })
  })
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/profile.js
git commit -m "feat: add avatar upload endpoint POST /api/profile/avatar"
```

---

## Task 6: Frontend — AuthContext

**Files:**
- Modify: `web/src/context/AuthContext.jsx`

- [ ] **Step 1: Rewrite AuthContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUser(data.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function login(newUser) {
    setUser(newUser)
  }

  function updateUser(fields) {
    setUser(prev => prev ? { ...prev, ...fields } : prev)
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setUser(null)
  }

  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/context/AuthContext.jsx
git commit -m "feat: migrate AuthContext to cookie-based sessions, add updateUser"
```

---

## Task 7: Frontend — Login & Signup Pages

**Files:**
- Modify: `web/src/pages/Login.jsx`
- Modify: `web/src/pages/Signup.jsx`

- [ ] **Step 1: Update Login.jsx fetch call**

Find the fetch block in `handleSubmit` and replace it:

```js
const res = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
})
```

Change the success branch — `login` no longer takes a token:
```js
// Before: login(data.token, data.user)
// After:
login(data.user)
navigate('/')
```

- [ ] **Step 2: Update Signup.jsx fetch call**

Same pattern — add `credentials: 'include'` to the fetch, change success branch:
```js
const res = await fetch('/api/auth/signup', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password }),
})
```

Success branch:
```js
// Before: login(data.token, data.user)
// After:
login(data.user)
navigate('/')
```

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/Login.jsx web/src/pages/Signup.jsx
git commit -m "feat: update Login/Signup to use cookie-based session (no token storage)"
```

---

## Task 8: Frontend — Profile Page

**Files:**
- Modify: `web/src/pages/Profile.jsx`

- [ ] **Step 1: Rewrite Profile.jsx**

```jsx
import { useState, useRef } from 'react'
import ProfileSidebar from '../components/layout/ProfileSidebar'
import Modal from '../components/common/Modal'
import { useAuth } from '../context/AuthContext'

function Profile() {
  const { user, updateUser, authFetch } = useAuth()
  const [editing,   setEditing]   = useState(false)
  const [form,      setForm]      = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileInputRef = useRef(null)

  if (!user) return null

  const save = async (e) => {
    e.preventDefault()
    setEditing(false)
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadErr('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) { setUploadErr(data.error || 'Upload failed'); return }
      updateUser({ avatarUrl: data.avatarUrl })
    } catch {
      setUploadErr('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="profile-layout">
        <ProfileSidebar />

        <main className="profile-main brutal">
          <div className="profile-center">
            <div
              className="profile-avatar-wrap"
              onClick={handleAvatarClick}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAvatarClick() } }}
              role="button"
              tabIndex={0}
              aria-label="Change profile avatar"
              style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile avatar"
                  className="profile-avatar"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a1a1a' }}
                />
              ) : (
                <div className="profile-avatar" style={{ fontSize: '3rem' }}>👤</div>
              )}
              <span style={{ position: 'absolute', bottom: 0, right: 0, background: '#fff', border: '2px solid #1a1a1a', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✏️</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Upload avatar"
            />

            {uploading && <p style={{ color: '#666', fontSize: '0.85rem' }}>Uploading...</p>}
            {uploadErr && (
              <p role="alert" style={{ color: '#dc2626', fontSize: '0.85rem' }}>{uploadErr}</p>
            )}

            <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginTop: 12 }}>{user.username}</h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>{user.email}</p>

            <button
              className="btn-brutal green-btn btn-inline edit-btn"
              onClick={() => { setForm({ username: user.username, email: user.email }); setEditing(true) }}
            >
              ✏️ Профайл засах
            </button>

            <div className="profile-stats">
              <div className="profile-stat"><h3>42</h3><p>Хийсэн шалгалт</p></div>
              <div className="profile-stat"><h3>78%</h3><p>Дундаж оноо</p></div>
              <div className="profile-stat"><h3>#156</h3><p>Эрэмбэ</p></div>
              <div className="profile-stat"><h3>3</h3><p>Гэрчилгээ</p></div>
            </div>
          </div>
        </main>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontWeight: 900 }}>✏️ Профайл засах</h2>
            <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} aria-label="Close modal">✕</button>
          </div>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="edit-username" style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Нэр</label>
              <input id="edit-username" className="search-input" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div>
              <label htmlFor="edit-email" style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Имэйл</label>
              <input id="edit-email" className="search-input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-brutal green-btn btn-inline" style={{ flex: 1 }}>💾 Хадгалах</button>
              <button type="button" className="btn-brutal white-btn btn-inline" style={{ flex: 1 }} onClick={() => setEditing(false)}>Буцах</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Profile
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/Profile.jsx
git commit -m "feat: wire Profile page to real user data and add avatar upload"
```

---

## Task 9: Frontend — Navbar Avatar + Keyboard A11y

**Files:**
- Modify: `web/src/components/layout/Navbar.jsx`

- [ ] **Step 1: Update the avatar display and hamburger button**

In the logged-in dropdown trigger, replace the `👤` emoji span with:
```jsx
{user.avatarUrl ? (
  <img
    src={user.avatarUrl}
    alt="Profile avatar"
    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a1a1a' }}
  />
) : (
  <span>👤</span>
)}
```

Update the hamburger button to add keyboard support and aria attributes:
```jsx
<button
  className="menu-toggle"
  onClick={() => setMenuOpen(o => !o)}
  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMenuOpen(o => !o) } }}
  aria-label="Цэс нээх/хаах"
  aria-expanded={menuOpen}
  aria-controls="nav-menu"
>
  <span></span>
  <span></span>
  <span></span>
</button>
```

Add `id="nav-menu"` to the `<ul className="nav-menu ...">`.

Add Escape key handler to close dropdown — add to the nav element:
```jsx
<nav
  className="navbar"
  style={{ position: 'relative' }}
  onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false) }}
>
```

- [ ] **Step 2: Add role="menu" and role="menuitem" to dropdowns**

On every `<ul className="drop-menu">`, add `role="menu"`.
On every `<li>` inside a drop-menu, add `role="menuitem"`.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/layout/Navbar.jsx
git commit -m "feat: navbar avatar image, keyboard accessibility, aria-expanded"
```

---

## Task 10: CSS — Responsive Breakpoints + Contrast + Focus

**Files:**
- Modify: `web/src/index.css`

- [ ] **Step 1: Fix green color contrast (WCAG AA)**

At the top of index.css, change:
```css
--green: #3d8c41;
```
(was `#5eb562`; new value gives ~4.6:1 on white background)

- [ ] **Step 2: Add sr-only utility and focus styles**

Append to `index.css`:
```css
/* ── ACCESSIBILITY ── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

:focus-visible {
  outline: 3px solid #3d8c41;
  outline-offset: 2px;
}

/* ── IMAGES ── */
img {
  max-width: 100%;
  height: auto;
}

body {
  overflow-x: hidden;
}
```

- [ ] **Step 3: Add responsive breakpoints**

Append after the sr-only block:
```css
/* ── RESPONSIVE ── */

/* Tablet: 481px – 768px */
@media (max-width: 768px) {
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .home-hero-inner { flex-direction: column; }
  .home-hero-mockup { max-width: 100%; }
  .banner h1 { font-size: 2rem; }
  .container { padding: 0 16px; }
}

/* Mobile: ≤ 480px */
@media (max-width: 480px) {
  .grid-2,
  .grid-3,
  .grid-4 { grid-template-columns: 1fr; }

  .nav-menu {
    display: none;
    flex-direction: column;
    position: absolute;
    top: var(--navbar-h);
    left: 0;
    right: 0;
    background: var(--surf);
    border-bottom: var(--border-val);
    padding: 20px;
    gap: 16px;
    z-index: 99;
  }
  .nav-menu.mobile-open { display: flex; }
  .menu-toggle { display: flex; }

  .banner h1 { font-size: 1.6rem; }
  .banner { padding: 40px 16px; }
  .home-hero-text h1 { font-size: 2rem; }
  .profile-layout { flex-direction: column; }
  .ranking-cta { padding: 40px 20px; }
}

/* Desktop: > 768px — hide hamburger */
@media (min-width: 769px) {
  .menu-toggle { display: none; }
  .nav-menu { display: flex !important; position: static; border: none; padding: 0; flex-direction: row; }
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/index.css
git commit -m "feat: responsive breakpoints, WCAG AA green contrast fix, sr-only, focus styles"
```

---

## Task 11: Accessibility — Live Region + aria attrs

**Files:**
- Modify: `web/src/App.jsx`
- Modify: `web/src/pages/Login.jsx`
- Modify: `web/src/pages/Signup.jsx`
- Modify: `web/src/pages/ChangePassword.jsx`

- [ ] **Step 1: Add LiveRegion to App.jsx**

In `AppShell`, add a global live region just before the closing `<>`:

```jsx
{/* Global live region for screen reader announcements */}
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
  id="live-region"
/>
```

- [ ] **Step 2: Add id/htmlFor to Login.jsx inputs**

Each input needs an `id` that matches its label's `htmlFor`. In Login.jsx:
```jsx
<label htmlFor="login-username" ...>Хэрэглэгчийн нэр</label>
<input id="login-username" type="text" .../>

<label htmlFor="login-password" ...>Нууц үг</label>
<input id="login-password" type="password" .../>
```

Also wrap the error div in an `aria-live` region:
```jsx
{error && (
  <div role="alert" aria-live="assertive" style={{ ... }}>
    {error}
  </div>
)}
```

- [ ] **Step 3: Add id/htmlFor to Signup.jsx inputs**

```jsx
<label htmlFor="signup-username" ...>Хэрэглэгчийн нэр</label>
<input id="signup-username" type="text" .../>

<label htmlFor="signup-email" ...>И-мэйл хаяг</label>
<input id="signup-email" type="email" .../>

<label htmlFor="signup-password" ...>Нууц үг</label>
<input id="signup-password" type="password" .../>
```

Errors div:
```jsx
{errors.length > 0 && (
  <div role="alert" aria-live="assertive" style={{ ... }}>
    ...
  </div>
)}
```

- [ ] **Step 4: Add htmlFor to ChangePassword.jsx**

The form uses a `.map()` over field configs. Each rendered `<label>` needs `htmlFor` matching the input's `id`. Update the map to include `id`:
```jsx
{[
  { name: 'current', label: 'Одоогийн нууц үг',  placeholder: '...', id: 'cp-current' },
  { name: 'newPass', label: 'Шинэ нууц үг',       placeholder: '...', id: 'cp-new'     },
  { name: 'confirm', label: 'Нууц үг давтах',      placeholder: '...', id: 'cp-confirm' },
].map(field => (
  <div key={field.name}>
    <label htmlFor={field.id} style={{ ... }}>{field.label}</label>
    <input
      id={field.id}
      type="password"
      name={field.name}
      ...
    />
  </div>
))}
```

Success/error messages:
```jsx
{success && <div role="status" aria-live="polite" ...>✅ ...</div>}
{error   && <div role="alert"  aria-live="assertive" ...>⚠️ {error}</div>}
```

- [ ] **Step 5: Add alt to team member images in TeamMemberCard**

Open `web/src/components/cards/TeamMemberCard.jsx`. Find any `<img>` tags and add descriptive `alt`:
```jsx
<img src={member.image} alt={`${member.name} — ${member.role}`} loading="lazy" />
```

- [ ] **Step 6: Commit**

```bash
git add web/src/App.jsx web/src/pages/Login.jsx web/src/pages/Signup.jsx web/src/pages/ChangePassword.jsx web/src/components/cards/TeamMemberCard.jsx
git commit -m "feat: WCAG accessibility — live regions, label/input associations, alt tags"
```

---

## Task 12: SEO — Helmet, robots.txt, sitemap.xml

**Files:**
- Modify: `web/src/main.jsx`
- Modify: `web/src/pages/Home.jsx`, `Tests.jsx`, `Competitions.jsx`, `Help.jsx`, `Login.jsx`, `Signup.jsx`, `Profile.jsx`, `TakeTest.jsx`, `TestHistory.jsx`
- Create: `web/public/robots.txt`
- Create: `web/public/sitemap.xml`

- [ ] **Step 1: Wrap app with HelmetProvider in main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: Add Helmet to Home.jsx**

At the top of the `Home` function body, before the return:
```jsx
import { Helmet } from 'react-helmet-async'

// inside Home():
return (
  <>
    <Helmet>
      <title>TestHub — Нүүр хуудас</title>
      <meta name="description" content="TestHub дээр ЭЕШ-ийн шалгалт болон тэмцээнд бэлтгэ. Олон мянган дасгал бодлого, дэлгэрэнгүй тайлбартай." />
      <meta property="og:title" content="TestHub — Монголын шилдэг тест платформ" />
      <meta property="og:description" content="ЭЕШ-ийн шалгалт болон тэмцээнд бэлтгэх хамгийн шилдэг платформ." />
      <meta property="og:image" content="/pictures/IMG_0894.svg" />
    </Helmet>
    {/* existing JSX */}
  </>
)
```

- [ ] **Step 3: Add Helmet to remaining pages**

Add the following to each page. Replace the outer fragment wrapper with `<>...</>` if not present.

**Tests.jsx:**
```jsx
<Helmet>
  <title>TestHub — Шалгалтууд</title>
  <meta name="description" content="ЭЕШ-ийн загвар шалгалтуудын жагсаалт. Математик, Физик, Хими болон бусад хичээлүүд." />
  <meta property="og:title" content="TestHub — Шалгалтууд" />
  <meta property="og:description" content="ЭЕШ-ийн загвар шалгалтуудыг үзнэ үү." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

**Competitions.jsx:**
```jsx
<Helmet>
  <title>TestHub — Тэмцээнүүд</title>
  <meta name="description" content="Удахгүй болох болон өнгөрсөн олимпиад, уралдааны мэдээлэл." />
  <meta property="og:title" content="TestHub — Тэмцээнүүд" />
  <meta property="og:description" content="Олимпиад болон уралдааны мэдээлэл авах." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

**Help.jsx:**
```jsx
<Helmet>
  <title>TestHub — Тусламж</title>
  <meta name="description" content="TestHub платформыг хэрхэн ашиглах тухай заавар, түгээмэл асуулт хариулт." />
  <meta property="og:title" content="TestHub — Тусламж" />
  <meta property="og:description" content="Платформын ашиглах заавар." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

**Login.jsx:**
```jsx
<Helmet>
  <title>TestHub — Нэвтрэх</title>
  <meta name="description" content="TestHub бүртгэлдээ нэвтэрнэ үү." />
  <meta property="og:title" content="TestHub — Нэвтрэх" />
  <meta property="og:description" content="TestHub бүртгэлдээ нэвтэрнэ үү." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

**Signup.jsx:**
```jsx
<Helmet>
  <title>TestHub — Бүртгүүлэх</title>
  <meta name="description" content="TestHub-д шинэ бүртгэл үүсгэж шалгалтандаа бэлтгэж эхэл." />
  <meta property="og:title" content="TestHub — Бүртгүүлэх" />
  <meta property="og:description" content="Үнэгүй бүртгүүлж шалгалтандаа бэлтгэ." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

**Profile.jsx:**
```jsx
<Helmet>
  <title>TestHub — Профайл</title>
  <meta name="description" content="Хэрэглэгчийн профайл болон шалгалтын статистик." />
  <meta property="og:title" content="TestHub — Профайл" />
  <meta property="og:description" content="Таны шалгалтын үр дүн болон статистик." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

**TakeTest.jsx** (add at the top of the component):
```jsx
<Helmet>
  <title>TestHub — Шалгалт өгөх</title>
  <meta name="description" content="TestHub дээр шалгалт өгч байна." />
  <meta property="og:title" content="TestHub — Шалгалт" />
  <meta property="og:description" content="TestHub дээр шалгалт өгч байна." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

**TestHistory.jsx:**
```jsx
<Helmet>
  <title>TestHub — Шалгалтын түүх</title>
  <meta name="description" content="Таны өмнө өгсөн шалгалтуудын дэлгэрэнгүй түүх." />
  <meta property="og:title" content="TestHub — Шалгалтын түүх" />
  <meta property="og:description" content="Шалгалтын дэлгэрэнгүй түүх." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

- [ ] **Step 4: Create robots.txt**

Create `web/public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://yourdomain.com/sitemap.xml
```

- [ ] **Step 5: Create sitemap.xml**

Create `web/public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/#/tests</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/#/competitions</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/#/help</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/#/login</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/#/signup</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
```

- [ ] **Step 6: Add lazy loading to below-fold images in Home.jsx**

In Home.jsx, find the `<TeamMemberCard>` and testimonial sections and ensure images have `loading="lazy"`. In `TeamMemberCard.jsx` the img already has `loading="lazy"` from Task 11 Step 5.

- [ ] **Step 7: Commit**

```bash
git add web/src/main.jsx web/src/pages/Home.jsx web/src/pages/Tests.jsx web/src/pages/Competitions.jsx web/src/pages/Help.jsx web/src/pages/Login.jsx web/src/pages/Signup.jsx web/src/pages/Profile.jsx web/src/pages/TakeTest.jsx web/src/pages/TestHistory.jsx web/public/robots.txt web/public/sitemap.xml
git commit -m "feat: SEO — react-helmet-async meta tags, Open Graph, robots.txt, sitemap.xml"
```

---

## Task 13: Test Infrastructure

**Files:**
- Create: `server/jest.config.js`
- Create: `server/tests/setup.js`
- Modify: `server/package.json`

- [ ] **Step 1: Create jest.config.js**

```js
export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
}
```

- [ ] **Step 2: Create tests/setup.js**

```js
process.env.TEST_DB = ':memory:'
process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production'
process.env.PASSWORD_SECRET_KEY = 'test-pepper'
process.env.ADMIN_SECRET_CODE = 'test-admin-code'
process.env.NODE_ENV = 'test'
```

- [ ] **Step 3: Add test script to server/package.json**

In the `"scripts"` section, add:
```json
"test": "NODE_OPTIONS=--experimental-vm-modules jest"
```

- [ ] **Step 4: Verify Jest can find tests**

```bash
cd server
npm test -- --listTests
```

Expected output: lists (empty for now — no test files yet, but no crash).

- [ ] **Step 5: Commit**

```bash
git add server/jest.config.js server/tests/setup.js server/package.json
git commit -m "chore: add Jest config with ESM support and test env setup"
```

---

## Task 14: Test — Password Hashing

**Files:**
- Create: `server/tests/password.test.js`

- [ ] **Step 1: Write test file**

```js
import { describe, it, expect } from '@jest/globals'
import { hashPassword, verifyPassword } from '../helpers/password.js'

describe('hashPassword', () => {
  it('returns a non-empty string that differs from the input', async () => {
    const hash = await hashPassword('MyPassword1!')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
    expect(hash).not.toBe('MyPassword1!')
  })

  it('same input produces a hash that verifies correctly', async () => {
    const hash = await hashPassword('MyPassword1!')
    const valid = await verifyPassword('MyPassword1!', hash)
    expect(valid).toBe(true)
  })
})

describe('verifyPassword', () => {
  it('returns false when wrong password is given', async () => {
    const hash = await hashPassword('MyPassword1!')
    const valid = await verifyPassword('WrongPassword1!', hash)
    expect(valid).toBe(false)
  })

  it('returns false when empty string is given', async () => {
    const hash = await hashPassword('MyPassword1!')
    const valid = await verifyPassword('', hash)
    expect(valid).toBe(false)
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd server
npm test -- --testPathPattern=password
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add server/tests/password.test.js
git commit -m "test: password hash/verify success and failure cases"
```

---

## Task 15: Test — Registration Endpoint

**Files:**
- Create: `server/tests/register.test.js`

- [ ] **Step 1: Write test file**

```js
import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import db from '../src/db/database.js'

beforeEach(() => {
  db.exec('DELETE FROM users')
  db.exec('DELETE FROM login_attempts')
})

describe('POST /api/auth/signup', () => {
  const validUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'SecurePass1!',
  }

  it('creates user and returns 201 with user object (no password in response)', async () => {
    const res = await request(app).post('/api/auth/signup').send(validUser)
    expect(res.status).toBe(201)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.username).toBe('testuser')
    expect(res.body.user.email).toBe('test@example.com')
    expect(JSON.stringify(res.body)).not.toContain('SecurePass1!')
    expect(JSON.stringify(res.body)).not.toContain('password_hash')
  })

  it('stores password as bcrypt hash (not plaintext) in database', async () => {
    await request(app).post('/api/auth/signup').send(validUser)
    const row = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('testuser')
    expect(row.password_hash).toMatch(/^\$2b\$/)
    expect(row.password_hash).not.toBe('SecurePass1!')
  })

  it('returns 409 when email is already registered', async () => {
    await request(app).post('/api/auth/signup').send(validUser)
    const res = await request(app).post('/api/auth/signup').send({
      ...validUser,
      username: 'otheruser',
    })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/имэйл/)
  })

  it('returns 409 when username is already taken', async () => {
    await request(app).post('/api/auth/signup').send(validUser)
    const res = await request(app).post('/api/auth/signup').send({
      ...validUser,
      email: 'other@example.com',
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/signup').send({ username: 'only' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too weak', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'weak',
    })
    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd server
npm test -- --testPathPattern=register
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add server/tests/register.test.js
git commit -m "test: user registration success and failure cases"
```

---

## Task 16: Test — Login Endpoint

**Files:**
- Create: `server/tests/login.test.js`

- [ ] **Step 1: Write test file**

```js
import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import db from '../src/db/database.js'
import { hashPassword } from '../helpers/password.js'

beforeEach(async () => {
  db.exec('DELETE FROM users')
  db.exec('DELETE FROM login_attempts')
  const hash = await hashPassword('ValidPass1!')
  db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('loginuser', 'login@example.com', hash, 'user')
})

describe('POST /api/auth/login', () => {
  it('returns 200 and sets session cookie on correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: 'ValidPass1!' })
    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.username).toBe('loginuser')
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: 'WrongPass1!' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBeDefined()
  })

  it('returns 401 on unknown username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'ValidPass1!' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'loginuser' })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd server
npm test -- --testPathPattern=login
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add server/tests/login.test.js
git commit -m "test: login endpoint success and failure cases"
```

---

## Task 17: Test — Logout Endpoint

**Files:**
- Create: `server/tests/logout.test.js`

- [ ] **Step 1: Write test file**

```js
import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import app from '../src/app.js'
import db from '../src/db/database.js'
import { hashPassword } from '../helpers/password.js'

let sessionCookie

beforeEach(async () => {
  db.exec('DELETE FROM users')
  db.exec('DELETE FROM login_attempts')
  const hash = await hashPassword('ValidPass1!')
  db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('logoutuser', 'logout@example.com', hash, 'user')

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'logoutuser', password: 'ValidPass1!' })
  sessionCookie = loginRes.headers['set-cookie']
})

describe('POST /api/auth/logout', () => {
  it('returns 200 and destroys session', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie)
    expect(res.status).toBe(200)

    // Session should no longer be valid
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie)
    expect(meRes.status).toBe(401)
  })

  it('returns 200 even when already logged out (idempotent)', async () => {
    await request(app).post('/api/auth/logout').set('Cookie', sessionCookie)
    const res = await request(app).post('/api/auth/logout').set('Cookie', sessionCookie)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd server
npm test -- --testPathPattern=logout
```

Expected: both tests pass.

- [ ] **Step 3: Commit**

```bash
git add server/tests/logout.test.js
git commit -m "test: logout endpoint valid session and idempotent cases"
```

---

## Task 18: Test — Avatar Upload Endpoint

**Files:**
- Create: `server/tests/avatar.test.js`

- [ ] **Step 1: Write test file**

```js
import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import { Buffer } from 'buffer'
import app from '../src/app.js'
import db from '../src/db/database.js'
import { hashPassword } from '../helpers/password.js'

let sessionCookie

// Minimal valid 1x1 JPEG (47 bytes)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
  'AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oA' +
  'DAMBAAIRAxEAPwCwABmX/9k=',
  'base64'
)

// Minimal valid 1x1 PNG (67 bytes)
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

beforeEach(async () => {
  db.exec('DELETE FROM users')
  const hash = await hashPassword('ValidPass1!')
  db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('avataruser', 'avatar@example.com', hash, 'user')

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'avataruser', password: 'ValidPass1!' })
  sessionCookie = loginRes.headers['set-cookie']
})

describe('POST /api/profile/avatar', () => {
  it('returns 200 and a new avatarUrl for a valid JPEG', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', sessionCookie)
      .attach('avatar', TINY_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(200)
    expect(res.body.avatarUrl).toMatch(/^\/uploads\//)
  })

  it('returns 200 and a new avatarUrl for a valid PNG', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', sessionCookie)
      .attach('avatar', TINY_PNG, { filename: 'test.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    expect(res.body.avatarUrl).toMatch(/^\/uploads\//)
  })

  it('returns 400 for a non-image file type', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', sessionCookie)
      .attach('avatar', Buffer.from('hello'), { filename: 'test.txt', contentType: 'text/plain' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 for a file exceeding 5 MB', async () => {
    const bigFile = Buffer.alloc(6 * 1024 * 1024) // 6 MB
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', sessionCookie)
      .attach('avatar', bigFile, { filename: 'big.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(400)
  })

  it('returns 401 without a session', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .attach('avatar', TINY_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd server
npm test -- --testPathPattern=avatar
```

Expected: all 5 tests pass.

- [ ] **Step 3: Run full test suite**

```bash
cd server
npm test
```

Expected: all tests across all 5 test files pass, exit 0.

- [ ] **Step 4: Commit**

```bash
git add server/tests/avatar.test.js
git commit -m "test: avatar upload endpoint — valid image, oversized, non-image, unauthenticated"
```

---

## Task 19: Verify Build

- [ ] **Step 1: Run frontend production build**

```bash
cd web
npm run build
```

Expected: `dist/` directory created, zero errors. Output lists hashed JS/CSS files.

- [ ] **Step 2: Run server**

```bash
cd server
npm start
```

Expected: `Server running on http://localhost:3001` — no crash.

- [ ] **Step 3: Smoke test critical flows**

```bash
# Health check
curl http://localhost:3001/api/health
# Expected: {"status":"ok"}

# Signup (creates a session cookie)
curl -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"smoketest","email":"smoke@test.com","password":"Smoke123!"}' -v
# Expected: 201, Set-Cookie header present

# Me endpoint (uses session cookie)
curl -b /tmp/cookies.txt http://localhost:3001/api/auth/me
# Expected: {"user":{"id":...,"username":"smoketest",...}}

# Logout
curl -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/logout
# Expected: {"message":"Амжилттай гарлаа"}

# Me after logout — should fail
curl -b /tmp/cookies.txt http://localhost:3001/api/auth/me
# Expected: {"error":"Unauthorized"}
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete feature rollout — session migration, profile, responsive, a11y, SEO, tests"
```

---

## Summary of New Dependencies

| Package | Location | Purpose |
|---|---|---|
| `express-session` | server | Cookie-based session middleware |
| `multer` | server | multipart/form-data file upload |
| `jest` | server devDep | Test runner |
| `supertest` | server devDep | HTTP assertion for Express |
| `react-helmet-async` | web | Per-page `<head>` meta tags |

## New Environment Variables

| Variable | Required | Default |
|---|---|---|
| `SESSION_SECRET` | Yes (prod) | `dev-secret-change-in-production` |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` |
| `TEST_DB` | Test only | unset (uses `testhub.db`) |
