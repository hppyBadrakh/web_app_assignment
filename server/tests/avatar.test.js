import request from 'supertest'
import app from '../src/app.js'
import { Buffer } from 'buffer'

const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKwAB/9k=',
  'base64'
)

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

describe('POST /api/profile/avatar', () => {
  let agent

  beforeAll(async () => {
    agent = request.agent(app)
    await agent
      .post('/api/auth/signup')
      .send({ username: 'avataruser', email: 'avatar@example.com', password: 'TestPass1!' })
  })

  test('401 — unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .attach('avatar', TINY_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(401)
  })

  test('200 — valid JPEG upload', async () => {
    const res = await agent
      .post('/api/profile/avatar')
      .attach('avatar', TINY_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(200)
    expect(res.body.avatarUrl).toMatch(/^\/uploads\//)
    expect(res.body.avatarUrl).toMatch(/\.jpg$/)
  })

  test('200 — valid PNG upload', async () => {
    const res = await agent
      .post('/api/profile/avatar')
      .attach('avatar', TINY_PNG, { filename: 'test.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    expect(res.body.avatarUrl).toMatch(/^\/uploads\//)
    expect(res.body.avatarUrl).toMatch(/\.png$/)
  })

  test('400 — non-image file rejected', async () => {
    const txtBuffer = Buffer.from('hello world')
    const res = await agent
      .post('/api/profile/avatar')
      .attach('avatar', txtBuffer, { filename: 'test.txt', contentType: 'text/plain' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })

  test('400 — oversized file rejected', async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB
    const res = await agent
      .post('/api/profile/avatar')
      .attach('avatar', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })
})
