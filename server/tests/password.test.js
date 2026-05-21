import { hashPassword, verifyPassword } from '../helpers/password.js'

describe('hashPassword', () => {
  test('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('TestPass1!')
    expect(typeof hash).toBe('string')
    expect(hash.startsWith('$2b$12$')).toBe(true)
  })

  test('produces different hashes for the same input (salt randomness)', async () => {
    const hash1 = await hashPassword('TestPass1!')
    const hash2 = await hashPassword('TestPass1!')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  test('returns true for correct password', async () => {
    const hash = await hashPassword('TestPass1!')
    const result = await verifyPassword('TestPass1!', hash)
    expect(result).toBe(true)
  })

  test('returns false for wrong password', async () => {
    const hash = await hashPassword('TestPass1!')
    const result = await verifyPassword('WrongPass1!', hash)
    expect(result).toBe(false)
  })

  test('returns false for empty string', async () => {
    const hash = await hashPassword('TestPass1!')
    const result = await verifyPassword('', hash)
    expect(result).toBe(false)
  })
})
