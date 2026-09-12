import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../lib/http-client'
import type { TaskSharing } from '../types/task-sharing'
import { useTaskSharing } from './use-task-sharing'

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
  current: { taskSharingRevision: 0 },
}))

const invitationsApiMock = vi.hoisted(() => ({
  cancelInvitation: vi.fn(),
  createInvitation: vi.fn(),
}))

const taskSharingApiMock = vi.hoisted(() => ({
  getTaskSharing: vi.fn(),
  revokeTaskAccess: vi.fn(),
  updateTaskAccessPermission: vi.fn(),
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

vi.mock('../../invitations/api/invitations-api', () => invitationsApiMock)
vi.mock('../api/task-sharing-api', () => taskSharingApiMock)

describe('useTaskSharing', () => {
  beforeEach(() => {
    authMock.current = { isAuthenticated: false, user: null }
    realtimeMock.current = { taskSharingRevision: 0 }
    vi.clearAllMocks()
  })

  it('does not load or mutate sharing without an authenticated task', async () => {
    const { result } = renderSharing(null)

    expect(result.current).toMatchObject({
      sharing: null,
      isLoading: false,
      isSubmitting: false,
      error: '',
    })
    expect(taskSharingApiMock.getTaskSharing).not.toHaveBeenCalled()

    await expect(result.current.refreshTaskSharing()).resolves.toBe(false)
    await expect(result.current.inviteUser('member@example.com')).resolves.toBe(false)
    expect(invitationsApiMock.createInvitation).not.toHaveBeenCalled()
  })

  it('loads sharing and reloads it after a realtime revision', async () => {
    authenticate()
    taskSharingApiMock.getTaskSharing
      .mockResolvedValueOnce(apiResponse(createSharing()))
      .mockResolvedValueOnce(
        apiResponse(createSharing({ taskTitle: 'Updated task title' })),
      )

    const { result, rerender } = renderSharing(1001)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.sharing?.taskTitle).toBe('Shared task')

    realtimeMock.current = { taskSharingRevision: 1 }
    rerender({ taskId: 1001 })

    await waitFor(() => {
      expect(result.current.sharing?.taskTitle).toBe('Updated task title')
    })
    expect(taskSharingApiMock.getTaskSharing).toHaveBeenCalledTimes(2)
  })

  it('hides stale sharing while another task is loading', async () => {
    authenticate()
    taskSharingApiMock.getTaskSharing.mockResolvedValueOnce(
      apiResponse(createSharing()),
    )
    const { result, rerender } = renderSharing(1001)

    await waitFor(() => expect(result.current.sharing?.taskId).toBe(1001))

    const nextRequest = createDeferred<ReturnType<typeof apiResponse>>()
    taskSharingApiMock.getTaskSharing.mockReturnValueOnce(nextRequest.promise)
    rerender({ taskId: 2002 })

    expect(result.current.sharing).toBeNull()
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      nextRequest.resolve(
        apiResponse(createSharing({ taskId: 2002, taskTitle: 'Another task' })),
      )
    })

    expect(result.current.sharing).toMatchObject({
      taskId: 2002,
      taskTitle: 'Another task',
    })
  })

  it('updates invitation and access state after owner actions', async () => {
    authenticate()
    const initialSharing = createSharing()
    const sharingAfterInvite = createSharing({
      pendingInvitations: [
        ...initialSharing.pendingInvitations,
        {
          invitationId: 11,
          invitedEmail: 'new@example.com',
          invitedName: 'New member',
          invitedAvatarUrl: null,
          createdAt: '2026-09-12T10:00:00Z',
        },
      ],
    })
    taskSharingApiMock.getTaskSharing
      .mockResolvedValueOnce(apiResponse(initialSharing))
      .mockResolvedValueOnce(apiResponse(sharingAfterInvite))
    invitationsApiMock.createInvitation.mockResolvedValue(apiResponse({ id: 11 }))
    invitationsApiMock.cancelInvitation.mockResolvedValue(undefined)
    taskSharingApiMock.updateTaskAccessPermission.mockResolvedValue(undefined)
    taskSharingApiMock.revokeTaskAccess.mockResolvedValue(undefined)
    const { result } = renderSharing(1001)

    await waitFor(() => expect(result.current.sharing).not.toBeNull())

    let succeeded = false
    await act(async () => {
      succeeded = await result.current.inviteUser('new@example.com')
    })
    expect(succeeded).toBe(true)
    expect(invitationsApiMock.createInvitation).toHaveBeenCalledWith(1001, {
      invitedEmail: 'new@example.com',
    })
    expect(result.current.sharing?.pendingInvitations).toHaveLength(2)
    expect(result.current.message).toBe('Invitation sent.')

    await act(async () => {
      succeeded = await result.current.cancelPendingInvitation(10)
    })
    expect(succeeded).toBe(true)
    expect(invitationsApiMock.cancelInvitation).toHaveBeenCalledWith(10)
    expect(result.current.sharing?.pendingInvitations).toEqual([
      expect.objectContaining({ invitationId: 11 }),
    ])
    expect(result.current.message).toBe('Invitation cancelled.')

    await act(async () => {
      succeeded = await result.current.updateAccessPermission(20, true)
    })
    expect(succeeded).toBe(true)
    expect(taskSharingApiMock.updateTaskAccessPermission).toHaveBeenCalledWith(
      1001,
      20,
      true,
    )
    expect(result.current.sharing?.members[0].canEdit).toBe(true)
    expect(result.current.message).toBe('Edit access granted.')

    await act(async () => {
      succeeded = await result.current.revokeAccess(20)
    })
    expect(succeeded).toBe(true)
    expect(taskSharingApiMock.revokeTaskAccess).toHaveBeenCalledWith(1001, 20)
    expect(result.current.sharing?.members).toEqual([])
    expect(result.current.message).toBe('Access revoked.')
  })

  it('keeps sharing data and exposes an owner action failure', async () => {
    authenticate()
    const sharing = createSharing()
    taskSharingApiMock.getTaskSharing.mockResolvedValue(apiResponse(sharing))
    taskSharingApiMock.updateTaskAccessPermission.mockRejectedValue(
      new ApiError('Only the task owner can change permissions.', 403),
    )
    const { result } = renderSharing(1001)

    await waitFor(() => expect(result.current.sharing).not.toBeNull())

    let succeeded = true
    await act(async () => {
      succeeded = await result.current.updateAccessPermission(20, true)
    })

    expect(succeeded).toBe(false)
    expect(result.current.error).toBe('Only the task owner can change permissions.')
    expect(result.current.sharing).toEqual(sharing)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('surfaces malformed sharing responses', async () => {
    authenticate()
    taskSharingApiMock.getTaskSharing.mockResolvedValue(apiResponse(null))

    const { result } = renderSharing(1001)

    await waitFor(() => {
      expect(result.current.error).toBe('The API did not return task sharing data.')
    })
    expect(result.current.sharing).toBeNull()
  })

  it('expires the session when sharing returns 401', async () => {
    authenticate()
    taskSharingApiMock.getTaskSharing.mockRejectedValue(
      new ApiError('Unauthorized', 401),
    )

    const { result } = renderSharing(1001)

    await waitFor(() => expect(authMock.expireSession).toHaveBeenCalledOnce())
    expect(result.current.error).toBe('')
  })
})

function renderSharing(taskId: number | null) {
  return renderHook(
    ({ taskId: currentTaskId }) => useTaskSharing(currentTaskId),
    { initialProps: { taskId } },
  )
}

function authenticate() {
  authMock.current = { isAuthenticated: true, user: { id: '9' } }
}

function createSharing(overrides: Partial<TaskSharing> = {}): TaskSharing {
  return {
    taskId: 1001,
    taskTitle: 'Shared task',
    pendingInvitations: [
      {
        invitationId: 10,
        invitedEmail: 'pending@example.com',
        invitedName: 'Pending member',
        invitedAvatarUrl: null,
        createdAt: '2026-09-12T09:00:00Z',
      },
    ],
    members: [
      {
        accessId: 20,
        email: 'member@example.com',
        name: 'Active member',
        avatarUrl: null,
        canEdit: false,
        sharedAt: '2026-09-12T09:30:00Z',
      },
    ],
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
