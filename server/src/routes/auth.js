import { Router } from 'express'
import { queryOne, runSql } from '../db/database.js'
import { validatePasswordStrength, hashPassword, verifyPassword } from '../../helpers/password.js'
import { createSession, destroySession } from '../../helpers/session.js'
import { isLockedOut, recordLoginAttempt, getRemainingAttempts } from '../../helpers/limit.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup  —  шинэ бүртгэл үүсгэнэ
// ─────────────────────────────────────────────────────────────────────────────
//
// Frontend илгээнэ:  { username, email, password }
// Нууц үгийн хүч чадлыг шалгаж, хэрэглэгчийн нэр/и-мэйл аль хэдийн бүртгэлтэй
// эсэхийг шалгаад, нууц үгийг hash хийж, хэрэглэгчийг хадгалаад
// сессий үүсгэж токен буцааж нэвтрүүлнэ.
//
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body

  // ── Алхам 1: бүх шаардлагатай талбарыг бөглөсөн эсэхийг шалгана ──────────
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Бүх талбарыг бөглөнө үү' })
  }

  // ── Алхам 2: нууц үг хүч чадлын шаардлагыг хангаж байгааг шалгана ────────
  const { isValid, errors } = validatePasswordStrength(password)
  if (!isValid) {
    return res.status(400).json({ error: errors[0], errors })
  }

  // ── Алхам 3: хэрэглэгчийн нэр болон и-мэйл бүртгэлгүй эсэхийг шалгана ───
  const existingUsername = queryOne('SELECT id FROM users WHERE username = ?', [username])
  if (existingUsername) {
    return res.status(409).json({ error: 'Энэ хэрэглэгчийн нэр бүртгэлтэй байна' })
  }

  const existingEmail = queryOne('SELECT id FROM users WHERE email = ?', [email])
  if (existingEmail) {
    return res.status(409).json({ error: 'Энэ имэйл хаяг бүртгэлтэй байна' })
  }

  // ── Алхам 4: хадгалахын өмнө нууц үгийг hash хийнэ ───────────────────────
  // Бид нууц үгийг тодоор хадгалдаггүй — зөвхөн bcrypt hash-г хадгална.
  const passwordHash = await hashPassword(password)

  // ── Алхам 5: шинэ хэрэглэгчийн мөрийг нэмнэ ──────────────────────────────
  // Хамгийн эхний хэрэглэгч "admin" дүр авна, бусад нь "user" авна.
  const userCount = queryOne('SELECT COUNT(*) as count FROM users')
  const role = userCount.count === 0 ? 'admin' : 'user'

  const newUserId = runSql(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, role]
  )

  // ── Алхам 6: сессий үүсгэж токен буцаана ─────────────────────────────────
  // Хэрэглэгч бүртгүүлсний дараа автоматаар нэвтэрнэ.
  const token = createSession(newUserId)

  res.status(201).json({
    message: 'Бүртгэл амжилттай',
    token,
    user: { id: newUserId, username, email, role },
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login  —  хэрэглэгчийн нэр болон нууц үгээр нэвтрэнэ
// ─────────────────────────────────────────────────────────────────────────────
//
// Frontend илгээнэ:  { username, password }
// Brute-force хаалтыг шалгаж, нууц үгийг хадгалсан hash-тэй харьцуулаад
// сессий үүсгэж токен буцаана.
//
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const ip = req.ip || req.socket?.remoteAddress || null

  if (!username || !password) {
    return res.status(400).json({ error: 'Хэрэглэгчийн нэр болон нууц үгийг оруулна уу' })
  }

  // ── Алхам 1: brute-force шалгалт ─────────────────────────────────────────
  // Энэ хэрэглэгчийн нэр саяхан хэт олон амжилтгүй оролдлоготой байсан бол нэвтрэхийг хаана.
  if (isLockedOut(username)) {
    return res.status(429).json({
      error: 'Хэт олон буруу оролдлого. 15 минутын дараа дахин оролдоно уу',
    })
  }

  // ── Алхам 2: мэдээллийн санд хэрэглэгчийг хайна ─────────────────────────
  const user = queryOne('SELECT * FROM users WHERE username = ?', [username])

  if (!user) {
    // Хэрэглэгч байхгүй ч гэсэн амжилтгүй оролдлогыг бүртгэнэ
    // (аль нь буруу байсныг хэлдэггүй — энэ нь аюулгүй байдлын шилдэг дадал)
    recordLoginAttempt(username, false, ip)
    const remaining = getRemainingAttempts(username)
    return res.status(401).json({
      error: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна',
      remainingAttempts: remaining,
    })
  }

  // ── Алхам 3: оруулсан нууц үгийг хадгалсан hash-тэй харьцуулна ──────────
  const passwordMatches = await verifyPassword(password, user.password_hash)

  if (!passwordMatches) {
    recordLoginAttempt(username, false, ip)
    const remaining = getRemainingAttempts(username)
    return res.status(401).json({
      error: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна',
      remainingAttempts: remaining,
    })
  }

  // ── Алхам 4: нууц үг зөв — амжилтыг бүртгэж сессий үүсгэнэ ─────────────
  recordLoginAttempt(username, true, ip)
  const token = createSession(user.id)

  res.json({
    message: 'Амжилттай нэвтэрлээ',
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  —  одоогийн сессийг устгана
// ─────────────────────────────────────────────────────────────────────────────
//
// Frontend нь токеныг Authorization header-д илгээнэ.
// Мэдээллийн сангаас сессийн мөрийг устгана тул токен ажиллахаа болино.
// Хэрэглэгч шинэ токен авахын тулд дахин нэвтрэх шаардлагатай.
//
router.post('/logout', authenticate, (req, res) => {
  // authenticate.js-тэй ижил аргаар Authorization header-аас токеныг уншина
  const token = req.headers['authorization'].slice(7)
  destroySession(token)
  res.json({ message: 'Амжилттай гарлаа' })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  —  одоо нэвтэрсэн хэрэглэгчийн мэдээллийг буцаана
// ─────────────────────────────────────────────────────────────────────────────
//
// Frontend нь хуудас ачаалах үед хадгалсан токен хүчинтэй эсэхийг шалгахын тулд дуудна
// мөн хөтөч дахин ачаалагдсаны дараа хэрэглэгчийн сессийг сэргээхийн тулд.
//
router.get('/me', authenticate, (req, res) => {
  // req.user нь authenticate middleware-ээр тохируулагдсан
  res.json({ user: req.user })
})

export default router
