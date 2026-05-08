import bcrypt from 'bcrypt'
import crypto from 'crypto'

const SECRET_KEY = process.env.PASSWORD_SECRET_KEY || 'default-secret-key-change-in-production'

export function validatePasswordStrength(password) {
  const errors = []
  if (password.length < 8) errors.push('Нууц үг дор хаяж 8 тэмдэгтээс бүрдэх ёстой')
  if (!/[A-Z]/.test(password)) errors.push('Дор хаяж нэг том үсэг агуулсан ёстой')
  if (!/[a-z]/.test(password)) errors.push('Дор хаяж нэг жижиг үсэг агуулсан ёстой')
  if (!/[0-9]/.test(password)) errors.push('Дор хаяж нэг тоо агуулсан ёстой')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Дор хаяж нэг тусгай тэмдэгт агуулсан ёстой')
  return { isValid: errors.length === 0, errors }
}

export async function hashPassword(password) {
  return bcrypt.hash(password + SECRET_KEY, 12)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password + SECRET_KEY, hash)
}

export function generateToken(length) {
  return crypto.randomBytes(length).toString('hex')
}
