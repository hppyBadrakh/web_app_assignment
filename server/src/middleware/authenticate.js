//ene maan request iig valid auth token esehiig shalgana
// herev valid bol auth hiisen user info-g req.user-d hiine
// valid bish bol 401 status code-g butsaana

import { verifySession } from '../../helpers/session.js' // verify session geh helper function-g import hiine

// Authorization: Bearer <token> header aas token unshij user iig shalgana
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

// admin esvel row iin exen bol true butsaana
export function canModify(row, user) {
  if (user.role === 'admin') return true
  return row.created_by === user.id
}
