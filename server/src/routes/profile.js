import { Router } from 'express'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomBytes } from 'crypto'
import { runSql } from '../db/database.js'
import { authenticate } from '../middleware/authenticate.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg'
    cb(null, randomBytes(16).toString('hex') + ext)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(Object.assign(new Error('Only JPEG and PNG files are allowed'), { status: 400 }))
    }
  },
})

const router = Router()

// POST /api/profile/avatar
router.post('/avatar', authenticate, (req, res) => {
  upload.single('avatar')(req, res, err => {
    if (err) {
      const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 400)
      return res.status(status).json({ error: err.message })
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const avatarUrl = `/uploads/${req.file.filename}`
    runSql('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id])
    req.session.touch?.()
    res.json({ avatarUrl })
  })
})

export default router
