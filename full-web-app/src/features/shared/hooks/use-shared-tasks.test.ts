import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../lib/http-client'
import type { TaskItem, TaskPayload } from '../../tasks/types/task'
import type { OwnedSharedTaskItem, SharedTaskItem } from '../types/shared-task'
import { useSharedTasks } from './use-shared-tasks'

const authMock = vi.hoisted(() => ({
  expireSession: vi.fn(),
  current: {
    isAuthenticated: false,
    user: null,
  } as {
    isAuthenticated: boolean
    user: { id: string } | null
  },
}))

const realtimeMock = vi.hoisted(() => ({
  current: { sharedTasksRevision: 0, taskSharingRevision: 0 },
}))

const sharedTasksApiMock = vi.hoisted(() => ({
  getOwnedSharedTasks: vi.fn(),
  getSharedTasks: vi.fn(),
}))

const tasksApiMock = vi.hoisted(() => ({
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

vi.mock('../api/shared-tasks-api', () => sharedTasksApiMock)
vi.mock('../../tasks/api/tasks-api', () => tasksApiMock)

describe('useSharedTasks', () => {
  beforeEach(() => {
    authMock.current = { isAuthenticated: false, user: null }
    realtimeMock.current = { sharedTasksRevision: 0, taskSharingRevision: 0 }
    vi.clearAllMocks()
  })

  it('does not load or update shared tasks for a guest', async () => {
    const { result } = renderHook(() => useSharedTasks())

    expect(result.current).toMatchObject({
      sharedWithYou: [],
      sharedByYou: [],
      isLoading: false,
      error: '',
    })
    expect(sharedTasksApiMock.getSharedTasks).not.toHaveBeenCalled()

    await expect(result.current.refreshSharedTasks()).resolves.toBe(false)
    await expect(result.current.saveSharedTask(1001, createPayload())).resolves.toBe(false)
    expect(tasksApiMock.updateTask).not.toHaveBeenCalled()
  })

  it('loads both shared lists and reloads them after realtime changes', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    sharedTasksApiMock.getSharedTasks
      .mockResolvedValueOnce(apiResponse([createSharedTask()]))
      .mockResolvedValueOnce(
        apiResponse([createSharedTask({ title: 'Updated received task' })]),
      )
    sharedTasksApiMock.getOwnedSharedTasks
      .mockResolvedValueOnce(apiResponse([createOwnedSharedTask()]))
      .mockResolvedValueOnce(
        apiResponse([createOwnedSharedTask({ title: 'Updated owned task' })]),
      )

    const { result, rerender } = renderHook(() => useSharedTasks())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.sharedWithYou[0].title).toBe('Shared with you')
    expect(result.current.sharedByYou[0].title).toBe('Shared by you')

    realtimeMock.current = { sharedTasksRevision: 1, taskSharingRevision: 1 }
    rerender()

    await waitFor(() => {
      expect(result.current.sharedWithYou[0].title).toBe('Updated received task')
      expect(result.current.sharedByYou[0].title).toBe('Updated owned task')
    })
    expect(sharedTasksApiMock.getSharedTasks).toHaveBeenCalledTimes(2)
    expect(sharedTasksApiMock.getOwnedSharedTasks).toHaveBeenCalledTimes(2)
  })

  it('hides shared data while a different user is loading', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    sharedTasksApiMock.getSharedTasks.mockResolvedValueOnce(
      apiResponse([createSharedTask()]),
    )
    sharedTasksApiMock.getOwnedSharedTasks.mockResolvedValueOnce(
      apiResponse([createOwnedSharedTask()]),
    )
    const { result, rerender } = renderHook(() => useSharedTasks())

    await waitFor(() => expect(result.current.sharedWithYou).toHaveLength(1))

    const receivedRequest = createDeferred<ReturnType<typeof apiResponse>>()
    const ownedRequest = createDeferred<ReturnType<typeof apiResponse>>()
    sharedTasksApiMock.getSharedTasks.mockReturnValueOnce(receivedRequest.promise)
    sharedTasksApiMock.getOwnedSharedTasks.mockReturnValueOnce(ownedRequest.promise)
    authMock.current = { isAuthenticated: true, user: { id: '2018' } }
    rerender()

    expect(result.current.sharedWithYou).toEqual([])
    expect(result.current.sharedByYou).toEqual([])
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      receivedRequest.resolve(apiResponse([createSharedTask({ id: 2002 })]))
      ownedRequest.resolve(apiResponse([]))
    })

    expect(result.current.sharedWithYou[0].id).toBe(2002)
    expect(result.current.sharedByYou).toEqual([])
  })

  it('saves and completes an editable shared task without losing owner data', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    const sharedTask = createSharedTask({ canEdit: true })
    sharedTasksApiMock.getSharedTasks.mockResolvedValue(apiResponse([sharedTask]))
    sharedTasksApiMock.getOwnedSharedTasks.mockResolvedValue(apiResponse([]))
    tasksApiMock.updateTask
      .mockResolvedValueOnce(
        createUpdatedTask({ title: 'Saved shared task', updatedAt: '2026-09-12T10:00:00Z' }),
      )
      .mockResolvedValueOnce(
        createUpdatedTask({
          title: 'Saved shared task',
          isCompleted: true,
          status: 'completed',
          updatedAt: '2026-09-12T10:05:00Z',
        }),
      )
    const { result } = renderHook(() => useSharedTasks())

    await waitFor(() => expect(result.current.sharedWithYou).toHaveLength(1))

    let succeeded = false
    await act(async () => {
      succeeded = await result.current.saveSharedTask(
        1001,
        createPayload({ title: 'Saved shared task' }),
      )
    })

    expect(succeeded).toBe(true)
    expect(result.current.sharedWithYou[0]).toMatchObject({
      title: 'Saved shared task',
      ownerEmail: sharedTask.ownerEmail,
      ownerName: sharedTask.ownerName,
      canEdit: true,
    })
    expect(result.current.message).toBe('Shared task “Saved shared task” saved.')

    await act(async () => {
      await result.current.toggleSharedTask(result.current.sharedWithYou[0])
    })

    expect(tasksApiMock.updateTask).toHaveBeenLastCalledWith(
      1001,
      expect.objectContaining({ isCompleted: true, status: 'completed' }),
    )
    expect(result.current.sharedWithYou[0]).toMatchObject({
      isCompleted: true,
      status: 'completed',
      ownerEmail: sharedTask.ownerEmail,
    })
    expect(result.current.message).toBe('Shared task “Saved shared task” completed.')
  })

  it('surfaces malformed shared task responses', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    sharedTasksApiMock.getSharedTasks.mockResolvedValue(apiResponse(null))
    sharedTasksApiMock.getOwnedSharedTasks.mockResolvedValue(apiResponse([]))

    const { result } = renderHook(() => useSharedTasks())

    await waitFor(() => {
      expect(result.current.error).toBe('The API did not return shared task data.')
    })
    expect(result.current.sharedWithYou).toEqual([])
    expect(result.current.sharedByYou).toEqual([])
  })

  it('expires the session when either shared task request returns 401', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    sharedTasksApiMock.getSharedTasks.mockRejectedValue(new ApiError('Unauthorized', 401))
    sharedTasksApiMock.getOwnedSharedTasks.mockResolvedValue(apiResponse([]))

    const { result } = renderHook(() => useSharedTasks())

    await waitFor(() => expect(authMock.expireSession).toHaveBeenCalledOnce())
    expect(result.current.error).toBe('')
  })
})

function createPayload(overrides: Partial<TaskPayload> = {}): TaskPayload {
  return {
    title: 'Shared with you',
    category: 'Frontend',
    description: 'Shared task description',
    dueDate: null,
    isCompleted: false,
    priority: 'Medium',
    status: 'pending',
    ...overrides,
  }
}

function createSharedTask(overrides: Partial<SharedTaskItem> = {}): SharedTaskItem {
  return {
    id: 1001,
    title: 'Shared with you',
    category: 'Frontend',
    description: 'Shared task description',
    dueDate: '2026-09-20T12:30:00Z',
    isCompleted: false,
    priority: 'Medium',
    status: 'pending',
    createdAt: '2026-09-12T08:00:00Z',
    updatedAt: null,
    ownerEmail: 'owner@example.com',
    ownerName: 'Task owner',
    ownerAvatarUrl: null,
    canEdit: false,
    sharedAt: '2026-09-12T09:00:00Z',
    ...overrides,
  }
}

function createOwnedSharedTask(
  overrides: Partial<OwnedSharedTaskItem> = {},
): OwnedSharedTaskItem {
  return {
    id: 42,
    title: 'Shared by you',
    category: 'Backend',
    description: 'Owned shared task description',
    dueDate: null,
    isCompleted: false,
    priority: 'High',
    status: 'pending',
    createdAt: '2026-09-12T08:00:00Z',
    updatedAt: null,
    activeAccessCount: 1,
    pendingInvitationCount: 0,
    ...overrides,
  }
}

function createUpdatedTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1001,
    title: 'Shared with you',
    category: 'Frontend',
    description: 'Shared task description',
    ownerUserId: 7,
    dueDate: '2026-09-20T12:30:00Z',
    isCompleted: false,
    priority: 'Medium',
    status: 'pending',
    createdAt: '2026-09-12T08:00:00Z',
    updatedAt: null,
    ...overrides,
  }
}

function apiResponse<T>(data: T) {
  return { success: true, message: '', data }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}
