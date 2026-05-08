import { queryAll, queryOne, runSql } from '../db/database.js'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

/**
 * Check if user is locked out
 */
export function isLockedOut(username) {
  const lockoutTime = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString()
  
  const recentFailures = queryOne(
    `SELECT COUNT(*) as count FROM login_attempts 
     WHERE username = ? AND success = 0 AND attempted_at > ?`,
    [username, lockoutTime]
  )

  return recentFailures.count >= MAX_ATTEMPTS
}

/**
 * Record login attempt
 */
export function recordLoginAttempt(username, success, ipAddress = null) {
  runSql(
    'INSERT INTO login_attempts (username, ip_address, success) VALUES (?, ?, ?)',
    [username, ipAddress, success ? 1 : 0]
  )
}

/**
 * Get remaining attempts
 */
export function getRemainingAttempts(username) {
  if (isLockedOut(username)) return 0

  const lockoutTime = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString()
  
  const attempts = queryAll(
    `SELECT COUNT(*) as count FROM login_attempts 
     WHERE username = ? AND success = 0 AND attempted_at > ?`,
    [username, lockoutTime]
  )

  return Math.max(0, MAX_ATTEMPTS - (attempts[0]?.count || 0))
}