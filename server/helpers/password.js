import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SECRET_KEY = process.env.PASSWORD_SECRET_KEY || 'default-secret-key-change-in-production'

export function validatePasswordStrength(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('Нууц үг дор хаяж 8 тэмдэгтээс бүрдэх ёстой')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Дор хаяж нэг том үсэг агуулсан ёстой')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Дор хаяж нэг жижиг үсэг агуулсан ёстой')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Дор хаяж нэг тоо агуулсан ёстой')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) агуулсан ёстой')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * HMAC + давс ашиглан нууц үгийг hash хийнэ
 */
export async function hashPassword(password) {
    const saltRounds = 12
    const pepperedPassword = password + SECRET_KEY;
    const hash = await bcrypt.hash(pepperedPassword, saltRounds)
    return hash
}

/**
 * Нууц үгийг шалгана
 */
export async function verifyPassword(password, hash) {
    const pepperedPassword = password + SECRET_KEY;
    return await bcrypt.compare(pepperedPassword, hash);
}

/**
 * Аюулгүй санамсаргүй токен үүсгэнэ
 */
export function generateToken(length) {
  return crypto.randomBytes(length).toString('hex')
}