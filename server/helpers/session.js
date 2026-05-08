import { generateToken } from './password.js'
import { queryOne, runSql } from '../src/db/database.js'

const SESSION_EXPIRY_HOURS = 24

// SQLite огноог зөв форматруу хөрвүүлнэ
function toSqliteDate(date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

// шинэ сессий үүсгэж токен буцаана
export function createSession(userId) {
  const token     = generateToken(32)
  const expiresAt = toSqliteDate(new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000))

  runSql(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )

  return token
}

// токен хүчинтэй бол хэрэглэгчийн мэдээллийг буцаана, үгүй бол null
export function verifySession(token) {
  const session = queryOne(
    `SELECT s.user_id, u.username, u.email, u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > datetime('now')`,
    [token]
  )
  return session || null
}

// сессийг устгана
export function destroySession(token) {
  runSql('DELETE FROM sessions WHERE token = ?', [token])
}

// хугацаа дууссан сессиудыг цэвэрлэнэ
export function cleanExpiredSessions() {
  runSql("DELETE FROM sessions WHERE expires_at < datetime('now')")
}
