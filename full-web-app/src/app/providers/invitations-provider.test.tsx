import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInvitations } from '../../features/invitations/hooks/use-invitations'
import type { InvitationItem } from '../../features/invitations/types/invitation'
import { ApiError } from '../../lib/http-client'
import { InvitationsProvider } from './invitations-provider'

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
  current: { invitationsRevision: 0 },
}))

const invitationsApiMock = vi.hoisted(() => ({
  getReceivedInvitations: vi.fn(),
  respondToInvitation: vi.fn(),
}))

vi.mock('../../features/auth', () => ({
  useAuth: () => ({
    ...authMock.current,
    expireSession: authMock.expireSession,
  }),
}))

vi.mock('../../hooks/use-realtime', () => ({
  useRealtime: () => realtimeMock.current,
}))

vi.mock('../../features/invitations/api/invitations-api', () => invitationsApiMock)

describe('InvitationsProvider', () => {
  beforeEach(() => {
    authMock.current = { isAuthenticated: false, user: null }
    realtimeMock.current = { invitationsRevision: 0 }
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not request or expose invitations for a guest', async () => {
    const { result } = renderInvitations()

    expect(result.current).toMatchObject({
      invitations: [],
      isLoading: false,
      respondingInvitationId: null,
      message: '',
      error: '',
    })
    expect(invitationsApiMock.getReceivedInvitations).not.toHaveBeenCalled()

    await expect(result.current.refreshInvitations()).resolves.toBe(false)
    await expect(result.current.respond(1, 'accepted')).resolves.toBe(false)
    expect(invitationsApiMock.respondToInvitation).not.toHaveBeenCalled()
  })

  it('loads invitations and reloads them after a realtime revision', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    invitationsApiMock.getReceivedInvitations
      .mockResolvedValueOnce(apiResponse([createInvitation()]))
      .mockResolvedValueOnce(
        apiResponse([createInvitation({ taskTitle: 'Updated task title' })]),
      )

    const { result, rerender } = renderInvitations()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.invitations[0].taskTitle).toBe('Shared task')

    realtimeMock.current = { invitationsRevision: 1 }
    rerender()

    await waitFor(() => {
      expect(result.current.invitations[0].taskTitle).toBe('Updated task title')
    })
    expect(invitationsApiMock.getReceivedInvitations).toHaveBeenCalledTimes(2)
  })

  it('does not expose invitations loaded for the previous user', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    invitationsApiMock.getReceivedInvitations.mockResolvedValueOnce(
      apiResponse([createInvitation()]),
    )
    const { result, rerender } = renderInvitations()

    await waitFor(() => expect(result.current.invitations).toHaveLength(1))

    const nextRequest = createDeferred<ReturnType<typeof apiResponse>>()
    invitationsApiMock.getReceivedInvitations.mockReturnValueOnce(nextRequest.promise)
    authMock.current = { isAuthenticated: true, user: { id: '2018' } }
    rerender()

    expect(result.current.invitations).toEqual([])
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      nextRequest.resolve(apiResponse([createInvitation({ id: 2, invitedEmail: 'next@example.com' })]))
    })

    expect(result.current.invitations).toEqual([
      expect.objectContaining({ id: 2, invitedEmail: 'next@example.com' }),
    ])
  })

  it('updates an answered invitation and clears its message after three seconds', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    invitationsApiMock.getReceivedInvitations.mockResolvedValue(
      apiResponse([createInvitation()]),
    )
    invitationsApiMock.respondToInvitation.mockResolvedValue(
      apiResponse(createInvitation({ status: 'accepted', hasActiveAccess: true })),
    )
    const { result } = renderInvitations()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    vi.useFakeTimers()

    let succeeded = false
    await act(async () => {
      succeeded = await result.current.respond(1, 'accepted')
    })

    expect(succeeded).toBe(true)
    expect(invitationsApiMock.respondToInvitation).toHaveBeenCalledWith(1, {
      decision: 'accepted',
    })
    expect(result.current).toMatchObject({
      respondingInvitationId: null,
      message: 'Invitation accepted.',
    })
    expect(result.current.invitations[0]).toMatchObject({
      status: 'accepted',
      hasActiveAccess: true,
    })

    act(() => vi.advanceTimersByTime(2_999))
    expect(result.current.message).toBe('Invitation accepted.')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.message).toBe('')
  })

  it('expires the session when loading invitations returns 401', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    invitationsApiMock.getReceivedInvitations.mockRejectedValue(
      new ApiError('Unauthorized', 401),
    )

    const { result } = renderInvitations()

    await waitFor(() => expect(authMock.expireSession).toHaveBeenCalledOnce())
    expect(result.current).toMatchObject({ invitations: [], error: '' })
  })

  it('surfaces malformed successful responses as provider errors', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    invitationsApiMock.getReceivedInvitations.mockResolvedValue(
      apiResponse<InvitationItem[] | null>(null),
    )

    const { result } = renderInvitations()

    await waitFor(() => {
      expect(result.current.error).toBe('The API did not return invitation data.')
    })
    expect(result.current.invitations).toEqual([])
  })
})

function renderInvitations() {
  return renderHook(() => useInvitations(), { wrapper: InvitationsWrapper })
}

function InvitationsWrapper({ children }: PropsWithChildren) {
  return <InvitationsProvider>{children}</InvitationsProvider>
}

function createInvitation(overrides: Partial<InvitationItem> = {}): InvitationItem {
  return {
    id: 1,
    taskId: 1001,
    taskTitle: 'Shared task',
    invitedEmail: 'member@example.com',
    invitedByEmail: 'owner@example.com',
    invitedByName: 'Task owner',
    status: 'pending',
    hasActiveAccess: false,
    createdAt: '2026-09-12T08:00:00Z',
    respondedAt: null,
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
