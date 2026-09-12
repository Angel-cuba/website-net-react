import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from '../../features/profile/hooks/use-profile'
import type { IUserProfile } from '../../features/profile/types/IUserProfile'
import { ApiError } from '../../lib/http-client'
import { ProfileProvider } from './profile-provider'

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

const userApiMock = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
}))

vi.mock('../../features/auth', () => ({
  useAuth: () => ({
    ...authMock.current,
    expireSession: authMock.expireSession,
  }),
}))

vi.mock('../../features/profile/api/user-api', () => userApiMock)

describe('ProfileProvider', () => {
  beforeEach(() => {
    authMock.current = { isAuthenticated: false, user: null }
    vi.clearAllMocks()
  })

  it('does not request or expose a profile for a guest', async () => {
    const { result } = renderProfile()

    expect(result.current).toMatchObject({
      profile: null,
      isProfileLoading: false,
      profileError: '',
    })
    expect(userApiMock.getUserProfile).not.toHaveBeenCalled()
    await expect(result.current.refreshProfile()).resolves.toBeUndefined()
  })

  it('loads and normalizes the authenticated user profile', async () => {
    authenticate('9')
    userApiMock.getUserProfile.mockResolvedValue(
      apiResponse({
        firstName: 'Angel',
        lastName: null,
        avatarUrl: null,
        bio: 'Developer',
      } as unknown as IUserProfile),
    )

    const { result } = renderProfile()

    await waitFor(() => expect(result.current.isProfileLoading).toBe(false))
    expect(result.current.profile).toEqual({
      firstName: 'Angel',
      lastName: '',
      avatarUrl: '',
      bio: 'Developer',
    })
  })

  it('hides stale profile data while a different user is loading', async () => {
    authenticate('9')
    userApiMock.getUserProfile.mockResolvedValueOnce(apiResponse(createProfile()))
    const { result, rerender } = renderProfile()

    await waitFor(() => expect(result.current.profile?.firstName).toBe('Angel'))

    const nextRequest = createDeferred<ReturnType<typeof apiResponse>>()
    userApiMock.getUserProfile.mockReturnValueOnce(nextRequest.promise)
    authenticate('2018')
    rerender()

    expect(result.current.profile).toBeNull()
    expect(result.current.isProfileLoading).toBe(true)

    await act(async () => {
      nextRequest.resolve(apiResponse(createProfile({ firstName: 'Second user' })))
    })

    expect(result.current.profile?.firstName).toBe('Second user')
  })

  it('ignores a stale request that resolves after the user changes', async () => {
    authenticate('9')
    const firstRequest = createDeferred<ReturnType<typeof apiResponse>>()
    const secondRequest = createDeferred<ReturnType<typeof apiResponse>>()
    userApiMock.getUserProfile
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)
    const { result, rerender } = renderProfile()

    authenticate('2018')
    rerender()

    await act(async () => {
      firstRequest.resolve(apiResponse(createProfile({ firstName: 'Stale user' })))
    })
    expect(result.current.profile).toBeNull()

    await act(async () => {
      secondRequest.resolve(apiResponse(createProfile({ firstName: 'Current user' })))
    })
    expect(result.current.profile?.firstName).toBe('Current user')
  })

  it('refreshes and locally replaces the current profile', async () => {
    authenticate('9')
    userApiMock.getUserProfile.mockResolvedValueOnce(apiResponse(createProfile()))
    const { result } = renderProfile()

    await waitFor(() => expect(result.current.profile).not.toBeNull())

    const refreshRequest = createDeferred<ReturnType<typeof apiResponse>>()
    userApiMock.getUserProfile.mockReturnValueOnce(refreshRequest.promise)
    let refreshPromise!: Promise<void>
    act(() => {
      refreshPromise = result.current.refreshProfile()
    })
    expect(result.current.isProfileLoading).toBe(true)

    await act(async () => {
      refreshRequest.resolve(apiResponse(createProfile({ bio: 'Refreshed bio' })))
      await refreshPromise
    })
    expect(result.current.profile?.bio).toBe('Refreshed bio')

    act(() => {
      result.current.replaceProfile({
        firstName: 'Local',
        lastName: 'Update',
        avatarUrl: '',
        bio: 'Updated without another GET',
      })
    })
    expect(result.current.profile).toEqual({
      firstName: 'Local',
      lastName: 'Update',
      avatarUrl: '',
      bio: 'Updated without another GET',
    })
  })

  it('surfaces malformed profile responses', async () => {
    authenticate('9')
    userApiMock.getUserProfile.mockResolvedValue(apiResponse(null))

    const { result } = renderProfile()

    await waitFor(() => {
      expect(result.current.profileError).toBe('The API did not return profile data.')
    })
    expect(result.current.profile).toBeNull()
  })

  it('expires the session when loading the profile returns 401', async () => {
    authenticate('9')
    userApiMock.getUserProfile.mockRejectedValue(new ApiError('Unauthorized', 401))

    const { result } = renderProfile()

    await waitFor(() => expect(authMock.expireSession).toHaveBeenCalledOnce())
    expect(result.current.profileError).toBe('')
  })
})

function renderProfile() {
  return renderHook(() => useProfile(), { wrapper: ProfileWrapper })
}

function ProfileWrapper({ children }: PropsWithChildren) {
  return <ProfileProvider>{children}</ProfileProvider>
}

function authenticate(id: string) {
  authMock.current = { isAuthenticated: true, user: { id } }
}

function createProfile(overrides: Partial<IUserProfile> = {}): IUserProfile {
  return {
    firstName: 'Angel',
    lastName: 'Araoz',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Developer',
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
