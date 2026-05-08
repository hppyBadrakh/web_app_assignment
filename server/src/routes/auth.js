import { Router } from 'express'
import { queryOne, runSql } from '../db/database.js'
import { validatePasswordStrength, hashPassword, verifyPassword } from '../../helpers/password.js'
import { createSession, destroySession } from '../../helpers/session.js'
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

  const token = createSession(newUserId)
  res.status(201).json({ message: 'Бүртгэл амжилттай', token, user: { id: newUserId, username, email, role } })
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
  const token = createSession(user.id)
  res.json({ message: 'Амжилттай нэвтэрлээ', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
})

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  destroySession(req.headers['authorization'].slice(7))
  res.json({ message: 'Амжилттай гарлаа' })
})

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user })
})

export default router
