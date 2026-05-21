import request from 'supertest'
import app from '../src/app.js'

const agent = request.agent(app)

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    // Create a user to login with
    await agent
      .post('/api/auth/signup')
      .send({ username: 'loginuser', email: 'loginuser@example.com', password: 'TestPass1!' })
  })

  test('200 — correct credentials', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: 'TestPass1!' })
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ username: 'loginuser' })
  })

  test('401 — wrong password', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: 'WrongPass1!' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBeTruthy()
  })

  test('401 — unknown user', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ username: 'nobody_xyz', password: 'TestPass1!' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBeTruthy()
  })

  test('400 — missing fields', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ username: 'loginuser' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })
})
