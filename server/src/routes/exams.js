import { Router } from 'express'
import { queryOne, queryAll, runSql } from '../db/database.js'

const router = Router()

function toDto(row) {
  return {
    id: row.id,
    icon: row.icon,
    iconColor: row.icon_color,
    name: row.name,
    price: row.price,
    subject: row.subject,
    year: row.year,
    questions: row.questions,
    duration: row.duration,
    difficulty: row.difficulty,
  }
}

// GET /api/exams?search=&subject=&year=&page=1&limit=6
router.get('/', (req, res) => {
  const { search = '', subject, year, page = '1', limit = '6' } = req.query
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 6))
  const offset = (pageNum - 1) * limitNum

  const conditions = []
  const params = []

  if (search) { conditions.push('name LIKE ?'); params.push(`%${search}%`) }
  if (subject) { conditions.push('subject = ?'); params.push(subject) }
  if (year)    { conditions.push('year = ?');    params.push(year) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { count } = queryOne(`SELECT COUNT(*) AS count FROM exams ${where}`, params)
  const rows = queryAll(`SELECT * FROM exams ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limitNum, offset])

  res.json({
    data: rows.map(toDto),
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum),
  })
})

// GET /api/exams/:id
router.get('/:id', (req, res) => {
  const row = queryOne('SELECT * FROM exams WHERE id = ?', [Number(req.params.id)])
  if (!row) return res.status(404).json({ error: 'Exam not found' })
  res.json(toDto(row))
})

// POST /api/exams
router.post('/', (req, res) => {
  const { icon, iconColor, name, price, subject, year, questions, duration, difficulty } = req.body

  if (!name || !subject || !year) {
    return res.status(400).json({ error: 'name, subject, year are required' })
  }

  const newId = runSql(
    'INSERT INTO exams (icon, icon_color, name, price, subject, year, questions, duration, difficulty) VALUES (?,?,?,?,?,?,?,?,?)',
    [icon || '📝', iconColor || 'icon-blue', name, price || 'Үнэгүй', subject, String(year), Number(questions) || 0, duration || '60 мин', difficulty || 'Дунд'],
  )

  const created = queryOne('SELECT * FROM exams WHERE id = ?', [newId])
  res.status(201).json(toDto(created))
})

// PUT /api/exams/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = queryOne('SELECT * FROM exams WHERE id = ?', [id])
  if (!existing) return res.status(404).json({ error: 'Exam not found' })

  const { icon, iconColor, name, price, subject, year, questions, duration, difficulty } = req.body

  runSql(
    'UPDATE exams SET icon=?, icon_color=?, name=?, price=?, subject=?, year=?, questions=?, duration=?, difficulty=? WHERE id=?',
    [
      icon       ?? existing.icon,
      iconColor  ?? existing.icon_color,
      name       ?? existing.name,
      price      ?? existing.price,
      subject    ?? existing.subject,
      year       ?? existing.year,
      questions  ?? existing.questions,
      duration   ?? existing.duration,
      difficulty ?? existing.difficulty,
      id,
    ],
  )

  const updated = queryOne('SELECT * FROM exams WHERE id = ?', [id])
  res.json(toDto(updated))
})

// DELETE /api/exams/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = queryOne('SELECT * FROM exams WHERE id = ?', [id])
  if (!existing) return res.status(404).json({ error: 'Exam not found' })

  runSql('DELETE FROM exams WHERE id = ?', [id])
  res.status(204).send()
})

export default router
