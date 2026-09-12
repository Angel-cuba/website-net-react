import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('returns the message from an Error', () => {
    expect(getErrorMessage(new Error('Request failed'))).toBe('Request failed')
  })

  it('uses a safe fallback for non-error values', () => {
    expect(getErrorMessage('Request failed')).toBe('Something went wrong.')
    expect(getErrorMessage(null)).toBe('Something went wrong.')
  })
})
