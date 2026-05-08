import { Router } from 'express'
import { queryOne, queryAll, runSql } from '../db/database.js'
import { authenticate, canModify } from '../middleware/authenticate.js'

const router = Router()

function toDto(row) {
  return {
    id: row.id,
    icon: row.icon,
    iconClass: row.icon_class,
    title: row.title,
    date: row.date,
    status: row.status,
    participants: row.participants,
    prize: row.prize,
    subject: row.subject,
    price: row.price,
    likes: row.likes,
    createdBy: row.created_by ?? null,
  }
}

// GET /api/competitions  — нийтийн
router.get('/', (req, res) => {
  const { search = '', subject, status, page = '1', limit = '6' } = req.query
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 6))
  const offset = (pageNum - 1) * limitNum

  const conditions = []
  const params = []

  if (search) { conditions.push('title LIKE ?');  params.push(`%${search}%`) }
  if (subject) { conditions.push('subject = ?');  params.push(subject) }
  if (status)  { conditions.push('status = ?');   params.push(status) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { count } = queryOne(`SELECT COUNT(*) AS count FROM competitions ${where}`, params)
  const rows = queryAll(`SELECT * FROM competitions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limitNum, offset])

  res.json({
    data: rows.map(toDto),
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum),
  })
})

// GET /api/competitions/:id  — нийтийн
router.get('/:id', (req, res) => {
  const row = queryOne('SELECT * FROM competitions WHERE id = ?', [Number(req.params.id)])
  if (!row) return res.status(404).json({ error: 'Competition not found' })
  res.json(toDto(row))
})

// POST /api/competitions  — нэвтэрсэн байх шаардлагатай
router.post('/', authenticate, (req, res) => {
  const { icon, iconClass, title, date, status, participants, prize, subject, price, likes } = req.body

  if (!title || !date || !subject) {
    return res.status(400).json({ error: 'title, date, subject are required' })
  }

  const newId = runSql(
    'INSERT INTO competitions (icon, icon_class, title, date, status, participants, prize, subject, price, likes, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [icon || '🏆', iconClass || 'icon-gold', title, date, status || 'upcoming', Number(participants) || 0, prize || '₮0', subject, Number(price) || 0, Number(likes) || 0, req.user.id],
  )

  const created = queryOne('SELECT * FROM competitions WHERE id = ?', [newId])
  res.status(201).json(toDto(created))
})

// PUT /api/competitions/:id  — нэвтэрсэн байх ба эзэмшигч (эсвэл admin) байх шаардлагатай
router.put('/:id', authenticate, (req, res) => {
  const id = Number(req.params.id)
  const existing = queryOne('SELECT * FROM competitions WHERE id = ?', [id])
  if (!existing) return res.status(404).json({ error: 'Competition not found' })

  if (!canModify(existing, req.user)) {
    return res.status(403).json({ error: 'Та энэ тэмцээнийг засах эрхгүй байна' }) // "You are not allowed to edit this competition"
  }

  const { icon, iconClass, title, date, status, participants, prize, subject, price, likes } = req.body

  runSql(
    'UPDATE competitions SET icon=?, icon_class=?, title=?, date=?, status=?, participants=?, prize=?, subject=?, price=?, likes=? WHERE id=?',
    [
      icon         ?? existing.icon,
      iconClass    ?? existing.icon_class,
      title        ?? existing.title,
      date         ?? existing.date,
      status       ?? existing.status,
      participants ?? existing.participants,
      prize        ?? existing.prize,
      subject      ?? existing.subject,
      price        ?? existing.price,
      likes        ?? existing.likes,
      id,
    ],
  )

  const updated = queryOne('SELECT * FROM competitions WHERE id = ?', [id])
  res.json(toDto(updated))
})

// DELETE /api/competitions/:id  — нэвтэрсэн байх ба эзэмшигч (эсвэл admin) байх шаардлагатай
router.delete('/:id', authenticate, (req, res) => {
  const id = Number(req.params.id)
  const existing = queryOne('SELECT * FROM competitions WHERE id = ?', [id])
  if (!existing) return res.status(404).json({ error: 'Competition not found' })

  if (!canModify(existing, req.user)) {
    return res.status(403).json({ error: 'Та энэ тэмцээнийг устгах эрхгүй байна' }) // "You are not allowed to delete this competition"
  }

  runSql('DELETE FROM competitions WHERE id = ?', [id])
  res.status(204).send()
})

export default router
