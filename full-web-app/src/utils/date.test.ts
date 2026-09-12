import { describe, expect, it } from 'vitest'
import {
  formatDate,
  getMinimumDueDateInputValue,
  toDateTimeInputValue,
} from './date'

describe('date utilities', () => {
  it('labels missing and invalid due dates', () => {
    expect(formatDate(null)).toBe('No due date')
    expect(formatDate('not-a-date')).toBe('Invalid due date')
  })

  it('formats a valid due date for display', () => {
    const result = formatDate('2026-09-12T10:30:00.000Z')

    expect(result).not.toBe('Invalid due date')
    expect(result).not.toBe('No due date')
  })

  it('converts an instant to the local datetime input format', () => {
    const localDate = new Date(2026, 8, 12, 10, 15, 0, 0)

    expect(toDateTimeInputValue(localDate.toISOString())).toBe('2026-09-12T10:15')
  })

  it('returns an empty input value for missing or invalid dates', () => {
    expect(toDateTimeInputValue(null)).toBe('')
    expect(toDateTimeInputValue('not-a-date')).toBe('')
  })

  it('sets the minimum due date to the next minute after five hours', () => {
    const reference = new Date(2026, 8, 12, 10, 34, 45, 123)

    expect(getMinimumDueDateInputValue(reference)).toBe('2026-09-12T15:35')
  })
})
