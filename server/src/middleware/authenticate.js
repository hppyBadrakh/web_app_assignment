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
