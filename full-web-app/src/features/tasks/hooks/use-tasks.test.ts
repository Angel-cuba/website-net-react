import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../lib/http-client'
import type { TaskItem, TaskPayload } from '../types/task'
import { useTasks } from './use-tasks'

const authMock = vi.hoisted(() => ({
  expireSession: vi.fn(),
  current: { isAuthenticated: false },
}))

const realtimeMock = vi.hoisted(() => ({
  current: { taskSharingRevision: 0 },
}))

const tasksApiMock = vi.hoisted(() => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}))

vi.mock('../../auth', () => ({
  useAuth: () => ({
    ...authMock.current,
    expireSession: authMock.expireSession,
  }),
}))

vi.mock('../../../hooks/use-realtime', () => ({
  useRealtime: () => realtimeMock.current,
}))

vi.mock('../api/tasks-api', () => tasksApiMock)

describe('useTasks', () => {
  beforeEach(() => {
    authMock.current = { isAuthenticated: false }
    realtimeMock.current = { taskSharingRevision: 0 }
    vi.clearAllMocks()
  })

  it('does not load tasks and rejects mutations for a guest', async () => {
    const { result } = renderHook(() => useTasks())

    expect(result.current).toMatchObject({ tasks: [], isLoading: false })
    expect(tasksApiMock.getTasks).not.toHaveBeenCalled()

    let created = true
    await act(async () => {
      created = await result.current.createTask(createPayload())
    })

    expect(created).toBe(false)
    expect(result.current.error).toBe('Login is required before creating tasks.')
    expect(tasksApiMock.createTask).not.toHaveBeenCalled()
  })

  it('loads tasks and reloads them when task sharing changes', async () => {
    authMock.current = { isAuthenticated: true }
    tasksApiMock.getTasks
      .mockResolvedValueOnce([createTask()])
      .mockResolvedValueOnce([createTask({ title: 'Reloaded task' })])

    const { result, rerender } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.tasks[0].title).toBe('Existing task')

    realtimeMock.current = { taskSharingRevision: 1 }
    rerender()

    await waitFor(() => expect(result.current.tasks[0].title).toBe('Reloaded task'))
    expect(tasksApiMock.getTasks).toHaveBeenCalledTimes(2)
  })

  it('creates, saves, completes, and removes tasks in local state', async () => {
    authMock.current = { isAuthenticated: true }
    const existingTask = createTask()
    const createdTask = createTask({ id: 2, title: 'Created task' })
    const savedTask = createTask({ id: 2, title: 'Saved task' })
    const completedTask = createTask({
      id: 2,
      title: 'Saved task',
      isCompleted: true,
      status: 'completed',
    })
    tasksApiMock.getTasks.mockResolvedValue([existingTask])
    tasksApiMock.createTask.mockResolvedValue(createdTask)
    tasksApiMock.updateTask
      .mockResolvedValueOnce(savedTask)
      .mockResolvedValueOnce(completedTask)
    tasksApiMock.deleteTask.mockResolvedValue(undefined)
    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.tasks).toEqual([existingTask]))

    let succeeded = false
    await act(async () => {
      succeeded = await result.current.createTask(createPayload({ dueDate: null }))
    })
    expect(succeeded).toBe(true)
    expect(tasksApiMock.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: null, status: 'pending' }),
    )
    expect(result.current.tasks).toEqual([createdTask, existingTask])
    expect(result.current.message).toBe('Task “Created task” created.')

    await act(async () => {
      succeeded = await result.current.saveTask(2, createPayload({ title: 'Saved task' }))
    })
    expect(succeeded).toBe(true)
    expect(result.current.tasks).toEqual([savedTask, existingTask])
    expect(result.current.message).toBe('Task “Saved task” saved.')

    await act(async () => {
      await result.current.toggleTask(savedTask)
    })
    expect(tasksApiMock.updateTask).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ isCompleted: true, status: 'completed' }),
    )
    expect(result.current.tasks).toEqual([completedTask, existingTask])
    expect(result.current.message).toBe('Task “Saved task” completed.')

    await act(async () => {
      succeeded = await result.current.removeTask(2)
    })
    expect(succeeded).toBe(true)
    expect(tasksApiMock.deleteTask).toHaveBeenCalledWith(2)
    expect(result.current.tasks).toEqual([existingTask])
    expect(result.current.message).toBe('Task deleted.')
  })

  it('refreshes tasks and reports the loaded count', async () => {
    authMock.current = { isAuthenticated: true }
    tasksApiMock.getTasks
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createTask(), createTask({ id: 2 })])
    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.refreshTasks()
    })

    expect(result.current.tasks).toHaveLength(2)
    expect(result.current.message).toBe('Loaded 2 tasks.')
  })

  it('surfaces action failures and restores the loading state', async () => {
    authMock.current = { isAuthenticated: true }
    tasksApiMock.getTasks.mockResolvedValue([])
    tasksApiMock.createTask.mockRejectedValue(new Error('Task creation failed.'))
    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let succeeded = true
    await act(async () => {
      succeeded = await result.current.createTask(createPayload())
    })

    expect(succeeded).toBe(false)
    expect(result.current).toMatchObject({
      tasks: [],
      error: 'Task creation failed.',
      isLoading: false,
    })
  })

  it('expires the session when the task API returns 401', async () => {
    authMock.current = { isAuthenticated: true }
    tasksApiMock.getTasks.mockRejectedValue(new ApiError('Unauthorized', 401))

    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(authMock.expireSession).toHaveBeenCalledOnce())
    expect(result.current.error).toBe('')
    expect(result.current.isLoading).toBe(false)
  })
})

function createPayload(overrides: Partial<TaskPayload> = {}): TaskPayload {
  return {
    title: 'New task',
    category: 'Testing',
    description: 'Regression coverage',
    dueDate: null,
    isCompleted: false,
    priority: 'Medium',
    status: 'pending',
    ...overrides,
  }
}

function createTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    title: 'Existing task',
    category: 'Backend',
    description: 'Task description',
    ownerUserId: 9,
    dueDate: '2026-09-20T12:30:00Z',
    isCompleted: false,
    priority: 'High',
    status: 'pending',
    createdAt: '2026-09-12T08:00:00Z',
    updatedAt: null,
    ...overrides,
  }
}
