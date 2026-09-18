import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/http-client'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('returns the message from an Error', () => {
    expect(getErrorMessage(new Error('Request failed'))).toBe('Request failed')
  })

  it.each([
    ['network', 'We could not reach the demo service. Check your connection and try again.'],
    ['timeout', 'The demo service is taking longer than expected. Please try again.'],
    ['unavailable', 'The demo service is still starting or temporarily unavailable. Please try again in a moment.'],
    ['server', 'We could not complete this request. Please try again.'],
  ] as const)('maps %s API failures to visitor-friendly copy', (kind, message) => {
    expect(getErrorMessage(new ApiError('raw response', 0, kind))).toBe(message)
  })

  it('uses a safe fallback for non-error values', () => {
    expect(getErrorMessage('Request failed')).toBe('Something went wrong.')
    expect(getErrorMessage(null)).toBe('Something went wrong.')
  })
})
