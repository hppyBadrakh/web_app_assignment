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
  const id       = Number(req.params.id)
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
