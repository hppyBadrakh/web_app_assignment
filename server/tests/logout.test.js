import request from 'supertest'
import app from '../src/app.js'

describe('POST /api/auth/logout', () => {
  test('200 — logout with active session', async () => {
    const agent = request.agent(app)
    await agent
      .post('/api/auth/signup')
      .send({ username: 'logoutuser1', email: 'logout1@example.com', password: 'TestPass1!' })
    const res = await agent.post('/api/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body.message).toBeTruthy()
  })

  test('200 — logout idempotent (no session)', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
  })
})
