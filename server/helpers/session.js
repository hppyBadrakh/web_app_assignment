import { generateToken } from './password.js'
import { queryOne, runSql } from '../src/db/database.js'

const SESSION_EXPIRY_HOURS = 24

// SQLite огноог "YYYY-MM-DD HH:MM:SS" форматаар хадгалдаг.
// JavaScript-ийн toISOString() нь "YYYY-MM-DDTHH:MM:SS.mmmZ" өгдөг.
// SQL дахь огнооны харьцуулалт зөв ажиллахын тулд SQLite форматруу хөрвүүлнэ.
function toSqliteDate(date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

// ─────────────────────────────────────────────────────────────────────────────
// createSession(userId)
// Нэвтэрсний дараа хэрэглэгчид шинэ сессий үүсгэнэ.
// Сессийн токеныг буцаана — frontend нь хүсэлт бүрт энэ токеныг илгээнэ.
// ─────────────────────────────────────────────────────────────────────────────
export function createSession(userId) {
  // Санамсаргүй токен үүсгэнэ (64 hex тэмдэгт = таахад маш хэцүү)
  const token     = generateToken(32)
  const expiresAt = toSqliteDate(new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000))

  runSql(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )

  return token
}

// ─────────────────────────────────────────────────────────────────────────────
// verifySession(token)
// Токеныг мэдээллийн санд хайж, хүчинтэй бол хэрэглэгчийн мэдээллийг буцаана.
// Токен байхгүй эсвэл хугацаа дууссан бол null буцаана.
// ─────────────────────────────────────────────────────────────────────────────
export function verifySession(token) {
  // Нэг query-д хэрэглэгчийн мэдээллийг буцаахын тулд sessions ба users-г нэгдүүлнэ.
  // `datetime('now')` нь SQLite форматаар одоогийн UTC цагийг буцаана.
  // Сессий нь expires_at ирээдүйд байх үед л хүчинтэй байна.
  const session = queryOne(
    `SELECT s.user_id, u.username, u.email, u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > datetime('now')`,
    [token]
  )
  return session || null
}

// ─────────────────────────────────────────────────────────────────────────────
// destroySession(token)
// Хэрэглэгч гарах үед сессийг устгана.
// Үүний дараа токен ажиллахаа болино.
// ─────────────────────────────────────────────────────────────────────────────
export function destroySession(token) {
  runSql('DELETE FROM sessions WHERE token = ?', [token])
}

// ─────────────────────────────────────────────────────────────────────────────
// cleanExpiredSessions()
// Хугацаа дууссан хуучин сессиудыг мэдээллийн сангаас устгана.
// Sessions хүснэгт хэт том болохоос сэргийлж тогтмол дуудаарай.
// ─────────────────────────────────────────────────────────────────────────────
export function cleanExpiredSessions() {
  runSql("DELETE FROM sessions WHERE expires_at < datetime('now')")
}
