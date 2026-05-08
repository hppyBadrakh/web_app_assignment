import { queryOne, runSql } from '../src/db/database.js'

const MAX_ATTEMPTS    = 5
const LOCKOUT_MINUTES = 15

// SQLite огноог зөв форматруу хөрвүүлнэ
function toSqliteDate(date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
}

function windowStart() {
  return toSqliteDate(new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000))
}

function recentFailures(username) {
  return queryOne(
    'SELECT COUNT(*) as count FROM login_attempts WHERE username = ? AND success = 0 AND attempted_at > ?',
    [username, windowStart()]
  ).count
}

// 15 минутын дотор 5+ амжилтгүй оролдлого байвал true буцаана
export function isLockedOut(username) {
  return recentFailures(username) >= MAX_ATTEMPTS
}

// нэвтрэх оролдлогыг бүртгэнэ
export function recordLoginAttempt(username, success, ipAddress = null) {
  runSql(
    'INSERT INTO login_attempts (username, ip_address, success) VALUES (?, ?, ?)',
    [username, ipAddress, success ? 1 : 0]
  )
}

// хаагдахын өмнө үлдсэн оролдлогын тоог буцаана
export function getRemainingAttempts(username) {
  if (isLockedOut(username)) return 0
  return Math.max(0, MAX_ATTEMPTS - recentFailures(username))
}
