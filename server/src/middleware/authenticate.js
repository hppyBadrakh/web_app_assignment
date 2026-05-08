import { verifySession } from '../../helpers/session.js'

// Authorization: Bearer <token> header-аас токен уншиж хэрэглэгчийг шалгана
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

// admin эсвэл мөрийн эзэмшигч бол true буцаана
export function canModify(row, user) {
  if (user.role === 'admin') return true
  return row.created_by === user.id
}
