import { describe, expect, it } from 'vitest'
import type { TaskPayload } from '../types/task'
import { normalizeTaskPayload } from './task-payload'

describe('normalizeTaskPayload', () => {
  it('converts a due date to ISO without changing the source object', () => {
    const payload = createPayload({ dueDate: '2026-09-12T15:30' })

    const result = normalizeTaskPayload(payload)

    expect(result.dueDate).toBe(new Date('2026-09-12T15:30').toISOString())
    expect(payload.dueDate).toBe('2026-09-12T15:30')
    expect(result).not.toBe(payload)
  })

  it('preserves a missing due date', () => {
    const result = normalizeTaskPayload(createPayload({ dueDate: null }))

    expect(result.dueDate).toBeNull()
  })

  it('forces completed status when the task is completed', () => {
    const result = normalizeTaskPayload(
      createPayload({ isCompleted: true, status: 'in-progress' }),
    )

    expect(result.status).toBe('completed')
  })

  it('preserves status for an incomplete task', () => {
    const result = normalizeTaskPayload(
      createPayload({ isCompleted: false, status: 'in-progress' }),
    )

    expect(result.status).toBe('in-progress')
  })
})

function createPayload(overrides: Partial<TaskPayload> = {}): TaskPayload {
  return {
    title: 'Test task',
    category: 'Backend',
    description: 'Regression coverage',
    dueDate: null,
    isCompleted: false,
    priority: 'Medium',
    status: 'pending',
    ...overrides,
  }
}
