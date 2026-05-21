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
