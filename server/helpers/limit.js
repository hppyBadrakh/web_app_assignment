import { queryAll, queryOne, runSql } from '../src/db/database.js'

const MAX_ATTEMPTS   = 5
const LOCKOUT_MINUTES = 15

// SQLite огноог "YYYY-MM-DD HH:MM:SS" форматаар хадгалдаг (T, Z, миллисекунд байхгүй).
// JavaScript-ийн toISOString() нь "YYYY-MM-DDTHH:MM:SS.mmmZ" өгдөг бөгөөд
// SQL query-д SQLite огноотой зөв харьцуулагддаггүй.
// Энэ тусламж функц JS Date-г SQLite форматруу хөрвүүлдэг тул харьцуулалт зөв ажиллана.
function toSqliteDate(date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

// ─────────────────────────────────────────────────────────────────────────────
// isLockedOut(username)
// Энэ хэрэглэгчийн нэр сүүлд хэт олон амжилтгүй нэвтрэх оролдлоготой байсан бол true буцаана.
// ─────────────────────────────────────────────────────────────────────────────
export function isLockedOut(username) {
  // Хаалтын цонхны эхлэлийг тооцно (15 минутын өмнө)
  const windowStart = toSqliteDate(new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000))

  // Тэр цагийн ДАРАА хэдэн амжилтгүй оролдлого болсныг тоолно
  const recentFailures = queryOne(
    `SELECT COUNT(*) as count FROM login_attempts
     WHERE username = ? AND success = 0 AND attempted_at > ?`,
    [username, windowStart]
  )

  // Тоо хязгаарт хүрвэл хэрэглэгчийг хаана
  return recentFailures.count >= MAX_ATTEMPTS
}

// ─────────────────────────────────────────────────────────────────────────────
// recordLoginAttempt(username, success, ipAddress)
// Нэг нэвтрэх оролдлогыг мэдээллийн санд хадгална (амжилттай эсвэл амжилтгүй).
// ─────────────────────────────────────────────────────────────────────────────
export function recordLoginAttempt(username, success, ipAddress = null) {
  runSql(
    'INSERT INTO login_attempts (username, ip_address, success) VALUES (?, ?, ?)',
    [username, ipAddress, success ? 1 : 0]
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// getRemainingAttempts(username)
// Хэрэглэгч хаагдахын өмнө хэдэн амжилтгүй оролдлого үлдсэнийг буцаана.
// ─────────────────────────────────────────────────────────────────────────────
export function getRemainingAttempts(username) {
  if (isLockedOut(username)) return 0

  const windowStart = toSqliteDate(new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000))

  const result = queryOne(
    `SELECT COUNT(*) as count FROM login_attempts
     WHERE username = ? AND success = 0 AND attempted_at > ?`,
    [username, windowStart]
  )

  return Math.max(0, MAX_ATTEMPTS - (result?.count || 0))
}
