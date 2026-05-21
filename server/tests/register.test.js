import request from 'supertest'
import app from '../src/app.js'

const agent = request.agent(app)

describe('POST /api/auth/signup', () => {
  test('201 — creates user with valid data', async () => {
    const res = await agent
      .post('/api/auth/signup')
      .send({ username: 'testuser1', email: 'test1@example.com', password: 'TestPass1!' })
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ username: 'testuser1', email: 'test1@example.com' })
  })

  test('409 — duplicate username', async () => {
    await agent
      .post('/api/auth/signup')
      .send({ username: 'dupuser', email: 'dup1@example.com', password: 'TestPass1!' })
    const res = await agent
      .post('/api/auth/signup')
      .send({ username: 'dupuser', email: 'dup2@example.com', password: 'TestPass1!' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBeTruthy()
  })

  test('409 — duplicate email', async () => {
    await agent
      .post('/api/auth/signup')
      .send({ username: 'emailuser1', email: 'shared@example.com', password: 'TestPass1!' })
    const res = await agent
      .post('/api/auth/signup')
      .send({ username: 'emailuser2', email: 'shared@example.com', password: 'TestPass1!' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBeTruthy()
  })

  test('400 — missing fields', async () => {
    const res = await agent
      .post('/api/auth/signup')
      .send({ username: 'nopass' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })

  test('400 — weak password', async () => {
    const res = await agent
      .post('/api/auth/signup')
      .send({ username: 'weakpassuser', email: 'weak@example.com', password: 'password' })
    expect(res.status).toBe(400)
  })
})
