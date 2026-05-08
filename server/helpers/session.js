import { generateToken } from './password.js'
import { queryOne, queryAll, runSql } from '../db/database.js'

const SESSION_EXPIRY_HOURS = 24

/**
 * Create new session
 */
export function createSession(userId) {
  const token = generateToken(32)
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

  runSql(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )

  return token
}

/**
 * Verify session token
 */
export function verifySession(token) {
  const session = queryOne(
    `SELECT s.*, u.id, u.username, u.email, u.role 
     FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.token = ? AND s.expires_at > datetime('now')`,
    [token]
  )
  return session || null
}

/**
 * Destroy session
 */
export function destroySession(token) {
  runSql('DELETE FROM sessions WHERE token = ?', [token])
}

/**
 * Clean expired sessions
 */
export function cleanExpiredSessions() {
  runSql("DELETE FROM sessions WHERE expires_at < datetime('now')")
}