import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../features/auth'
import { readAuthToken, storeAuthToken } from '../../features/auth/token-storage'
import { AuthProvider } from './auth-provider'

const nameIdentifierClaim =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const emailClaim =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts as a guest when no stored token exists', () => {
    const { result } = renderAuth()

    expect(result.current).toMatchObject({
      user: null,
      status: 'guest',
      error: '',
      isAuthenticated: false,
    })
  })

  it('restores an authenticated session from standard JWT claims', () => {
    const token = createToken({
      sub: '9',
      email: 'angel@example.com',
      exp: futureExpiration(),
    })
    storeAuthToken(token)

    const { result } = renderAuth()

    expect(result.current).toMatchObject({
      user: { id: '9', email: 'angel@example.com' },
      status: 'authenticated',
      error: '',
      isAuthenticated: true,
    })
  })

  it('reads the ASP.NET identity claim names', () => {
    const token = createToken({
      [nameIdentifierClaim]: '2018',
      [emailClaim]: 'member@example.com',
      exp: futureExpiration(),
    })

    const { result } = renderAuth()

    act(() => result.current.authenticate(token))

    expect(result.current.user).toEqual({ id: '2018', email: 'member@example.com' })
    expect(readAuthToken()).toBe(token)
  })

  it('clears an invalid stored token and marks the session as expired', () => {
    storeAuthToken('not-a-jwt')

    const { result } = renderAuth()

    expect(result.current.status).toBe('expired')
    expect(result.current.isAuthenticated).toBe(false)
    expect(readAuthToken()).toBe('')
  })

  it('rejects an expired token returned by the API', () => {
    const expiredToken = createToken({
      sub: '9',
      email: 'angel@example.com',
      exp: Math.floor(Date.now() / 1000) - 1,
    })
    const { result } = renderAuth()

    act(() => result.current.authenticate(expiredToken))

    expect(result.current).toMatchObject({
      user: null,
      status: 'error',
      error: 'The API returned an invalid or expired session.',
      isAuthenticated: false,
    })
    expect(readAuthToken()).toBe('')
  })

  it('moves through authentication feedback and logout states', () => {
    const token = createToken({ sub: '9', exp: futureExpiration() })
    const { result } = renderAuth()

    act(() => result.current.beginAuthentication())
    expect(result.current.status).toBe('authenticating')

    act(() => result.current.failAuthentication('Invalid credentials.'))
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Invalid credentials.',
    })

    act(() => result.current.clearAuthFeedback())
    expect(result.current).toMatchObject({ status: 'guest', error: '' })

    act(() => result.current.authenticate(token))
    expect(result.current.status).toBe('authenticated')

    act(() => result.current.logout())
    expect(result.current).toMatchObject({
      user: null,
      status: 'guest',
      isAuthenticated: false,
    })
    expect(readAuthToken()).toBe('')
  })

  it('expires an authenticated session when the JWT lifetime ends', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-12T08:00:00Z'))
    storeAuthToken(
      createToken({
        sub: '9',
        email: 'angel@example.com',
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
    )

    const { result } = renderAuth()
    expect(result.current.status).toBe('authenticated')

    act(() => vi.advanceTimersByTime(60_000))

    expect(result.current).toMatchObject({
      user: null,
      status: 'expired',
      isAuthenticated: false,
    })
    expect(readAuthToken()).toBe('')
  })
})

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthWrapper })
}

function AuthWrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}

function futureExpiration(): number {
  return Math.floor(Date.now() / 1000) + 3_600
}

function createToken(payload: Record<string, unknown>): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `header.${encodedPayload}.signature`
}
