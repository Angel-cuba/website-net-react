import { beforeEach, describe, expect, it } from 'vitest'
import { clearAuthToken, readAuthToken, storeAuthToken } from './token-storage'

describe('token storage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('returns an empty token when no session exists', () => {
    expect(readAuthToken()).toBe('')
  })

  it('stores and reads the current token', () => {
    storeAuthToken('signed-token')

    expect(readAuthToken()).toBe('signed-token')
    expect(sessionStorage.getItem('wapp2.auth.token')).toBe('signed-token')
    expect(localStorage.getItem('wapp2.auth.token')).toBeNull()
  })

  it('clears the current token', () => {
    storeAuthToken('signed-token')

    clearAuthToken()

    expect(readAuthToken()).toBe('')
  })

  it('discards tokens left in shared local storage by older versions', () => {
    localStorage.setItem('wapp2.auth.token', 'legacy-token')

    expect(readAuthToken()).toBe('')
    expect(localStorage.getItem('wapp2.auth.token')).toBeNull()
  })
})
