import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import './db/seed.js'
import examRoutes from './routes/exams.js'
import competitionRoutes from './routes/competitions.js'
import authRoutes from './routes/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Auth routes — no login required to reach these
app.use('/api/auth', authRoutes)

app.use('/api/exams', examRoutes)
app.use('/api/competitions', competitionRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
