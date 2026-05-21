import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import db from './db/database.js'
import './db/seed.js'
import { SqliteSessionStore } from './store/sqliteSessionStore.js'
import examRoutes from './routes/exams.js'
import competitionRoutes from './routes/competitions.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import profileRoutes from './routes/profile.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new SqliteSessionStore(db, { tableName: 'express_sessions' }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}))

app.use('/uploads', express.static(join(__dirname, '../uploads'), { maxAge: '1y' }))

app.use('/api/auth',         authRoutes)
app.use('/api/admin',        adminRoutes)
app.use('/api/profile',      profileRoutes)
app.use('/api/exams',        examRoutes)
app.use('/api/competitions', competitionRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

export default app
