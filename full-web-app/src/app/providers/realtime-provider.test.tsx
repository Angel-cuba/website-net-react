import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { storeAuthToken } from '../../features/auth/token-storage'
import { useRealtime } from '../../hooks/use-realtime'
import { RealtimeProvider } from './realtime-provider'

const authMock = vi.hoisted(() => ({
  current: {
    isAuthenticated: false,
    user: null,
  } as {
    isAuthenticated: boolean
    user: { id: string } | null
  },
}))

const signalRMock = vi.hoisted(() => {
  const handlers = new Map<string, () => void>()
  const connection = {
    on: vi.fn((eventName: string, callback: () => void) => {
      handlers.set(eventName, callback)
    }),
    onreconnected: vi.fn((callback: () => void) => {
      handlers.set('reconnected', callback)
    }),
    onclose: vi.fn((callback: () => void) => {
      handlers.set('closed', callback)
    }),
    start: vi.fn<() => Promise<void>>(),
    stop: vi.fn<() => Promise<void>>(),
  }
  const builder = {
    withUrl: vi.fn(),
    withAutomaticReconnect: vi.fn(),
    configureLogging: vi.fn(),
    build: vi.fn(),
  }
  const HubConnectionBuilder = vi.fn(function HubConnectionBuilderMock() {
    return builder
  })

  return { builder, connection, handlers, HubConnectionBuilder }
})

vi.mock('../../features/auth', () => ({
  useAuth: () => authMock.current,
}))

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: signalRMock.HubConnectionBuilder,
  LogLevel: { Warning: 'warning' },
}))

describe('RealtimeProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    authMock.current = { isAuthenticated: false, user: null }
    signalRMock.handlers.clear()
    vi.clearAllMocks()

    signalRMock.builder.withUrl.mockReturnValue(signalRMock.builder)
    signalRMock.builder.withAutomaticReconnect.mockReturnValue(signalRMock.builder)
    signalRMock.builder.configureLogging.mockReturnValue(signalRMock.builder)
    signalRMock.builder.build.mockReturnValue(signalRMock.connection)
    signalRMock.connection.start.mockResolvedValue(undefined)
    signalRMock.connection.stop.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not create a SignalR connection for a guest', () => {
    const { result } = renderRealtime()

    expect(result.current).toEqual({
      invitationsRevision: 0,
      sharedTasksRevision: 0,
      taskSharingRevision: 0,
    })
    expect(signalRMock.HubConnectionBuilder).not.toHaveBeenCalled()
  })

  it('connects with the current token and reacts to resource events', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    storeAuthToken('signed-token')

    const { result } = renderRealtime()

    expect(signalRMock.builder.withUrl).toHaveBeenCalledWith(
      'http://api.test/hubs/notifications',
      expect.objectContaining({
        accessTokenFactory: expect.any(Function),
        withCredentials: false,
      }),
    )
    const connectionOptions = signalRMock.builder.withUrl.mock.calls[0][1]
    expect(connectionOptions.accessTokenFactory()).toBe('signed-token')
    expect(signalRMock.builder.withAutomaticReconnect).toHaveBeenCalledOnce()
    expect(signalRMock.builder.configureLogging).toHaveBeenCalledWith('warning')

    await advanceTimers(0)

    expect(signalRMock.connection.start).toHaveBeenCalledOnce()
    expect(result.current).toEqual({
      invitationsRevision: 1,
      sharedTasksRevision: 1,
      taskSharingRevision: 1,
    })

    act(() => signalRMock.handlers.get('InvitationsChanged')?.())
    expect(result.current).toEqual({
      invitationsRevision: 2,
      sharedTasksRevision: 1,
      taskSharingRevision: 1,
    })

    act(() => signalRMock.handlers.get('SharedTasksChanged')?.())
    expect(result.current.sharedTasksRevision).toBe(2)

    act(() => signalRMock.handlers.get('TaskSharingChanged')?.())
    expect(result.current.taskSharingRevision).toBe(2)

    act(() => signalRMock.handlers.get('reconnected')?.())
    expect(result.current).toEqual({
      invitationsRevision: 3,
      sharedTasksRevision: 3,
      taskSharingRevision: 3,
    })
  })

  it('retries a failed initial connection after five seconds', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    signalRMock.connection.start
      .mockRejectedValueOnce(new Error('Connection unavailable'))
      .mockResolvedValueOnce(undefined)

    const { result } = renderRealtime()

    await advanceTimers(0)
    expect(signalRMock.connection.start).toHaveBeenCalledOnce()
    expect(result.current.invitationsRevision).toBe(0)

    await advanceTimers(4_999)
    expect(signalRMock.connection.start).toHaveBeenCalledOnce()

    await advanceTimers(1)
    expect(signalRMock.connection.start).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({
      invitationsRevision: 1,
      sharedTasksRevision: 1,
      taskSharingRevision: 1,
    })
  })

  it('stops the connection and cancels a pending start on unmount', async () => {
    authMock.current = { isAuthenticated: true, user: { id: '9' } }
    const { unmount } = renderRealtime()

    unmount()
    await advanceTimers(5_000)

    expect(signalRMock.connection.start).not.toHaveBeenCalled()
    expect(signalRMock.connection.stop).toHaveBeenCalledOnce()
  })
})

function renderRealtime() {
  return renderHook(() => useRealtime(), { wrapper: RealtimeWrapper })
}

function RealtimeWrapper({ children }: PropsWithChildren) {
  return <RealtimeProvider>{children}</RealtimeProvider>
}

async function advanceTimers(milliseconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}
