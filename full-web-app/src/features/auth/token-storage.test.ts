import { beforeEach, describe, expect, it } from 'vitest'
import { clearAuthToken, readAuthToken, storeAuthToken } from './token-storage'

describe('token storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty token when no session exists', () => {
    expect(readAuthToken()).toBe('')
  })

  it('stores and reads the current token', () => {
    storeAuthToken('signed-token')

    expect(readAuthToken()).toBe('signed-token')
  })

  it('clears the current token', () => {
    storeAuthToken('signed-token')

    clearAuthToken()

    expect(readAuthToken()).toBe('')
  })
})
