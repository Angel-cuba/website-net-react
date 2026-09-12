import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../lib/http-client'
import type { IUserProfile } from '../types/IUserProfile'
import { ProfilePanel } from './profile-panel'

const authMock = vi.hoisted(() => ({
  expireSession: vi.fn(),
  logout: vi.fn(),
  current: { user: { id: '9', email: 'angel@example.com' } },
}))

const profileMock = vi.hoisted(() => ({
  replaceProfile: vi.fn(),
  current: {
    isProfileLoading: false,
    profile: {
      firstName: 'Angel',
      lastName: 'Araoz',
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Developer',
    },
    profileError: '',
  } as {
    isProfileLoading: boolean
    profile: IUserProfile | null
    profileError: string
  },
}))

const userApiMock = vi.hoisted(() => ({
  deleteUserAccount: vi.fn(),
  updateUserProfile: vi.fn(),
}))

vi.mock('../../auth', () => ({
  useAuth: () => ({
    ...authMock.current,
    expireSession: authMock.expireSession,
    logout: authMock.logout,
  }),
}))

vi.mock('../index', () => ({
  deleteUserAccount: userApiMock.deleteUserAccount,
  updateUserProfile: userApiMock.updateUserProfile,
  useProfile: () => ({
    ...profileMock.current,
    replaceProfile: profileMock.replaceProfile,
  }),
}))

describe('ProfilePanel', () => {
  beforeEach(() => {
    authMock.current = { user: { id: '9', email: 'angel@example.com' } }
    profileMock.current = {
      isProfileLoading: false,
      profile: createProfile(),
      profileError: '',
    }
    vi.clearAllMocks()
  })

  it('shows the current profile card and enters edit mode', async () => {
    const user = userEvent.setup()
    render(<ProfilePanel />)

    expect(screen.getByRole('heading', { name: 'Angel Araoz' })).toBeVisible()
    expect(screen.getByText('angel@example.com')).toBeVisible()
    expect(screen.getByText('Developer')).toBeVisible()
    expect(screen.getByRole('img', { name: 'Angel Araoz profile avatar' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg',
    )

    await user.click(screen.getByRole('button', { name: 'Edit profile' }))

    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeVisible()
    expect(screen.getByLabelText('First name')).toHaveValue('Angel')
    expect(screen.getByLabelText('Last name')).toHaveValue('Araoz')
    expect(screen.getByLabelText('Biography')).toHaveValue('Developer')
  })

  it('saves an edited profile, updates shared profile state, and closes the form', async () => {
    const user = userEvent.setup()
    const updatedProfile = createProfile({ firstName: 'Updated', bio: 'New biography' })
    userApiMock.updateUserProfile.mockResolvedValue({
      success: true,
      message: 'Profile saved.',
      data: updatedProfile,
    })
    render(<ProfilePanel />)

    await user.click(screen.getByRole('button', { name: 'Edit profile' }))
    await user.clear(screen.getByLabelText('First name'))
    await user.type(screen.getByLabelText('First name'), 'Updated')
    await user.clear(screen.getByLabelText('Biography'))
    await user.type(screen.getByLabelText('Biography'), 'New biography')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(userApiMock.updateUserProfile).toHaveBeenCalledWith(updatedProfile)
    })
    expect(profileMock.replaceProfile).toHaveBeenCalledWith(updatedProfile)
    expect(screen.queryByRole('heading', { name: 'Edit profile' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Profile saved.')
  })

  it('restores the profile card without saving when editing is cancelled', async () => {
    const user = userEvent.setup()
    render(<ProfilePanel />)

    await user.click(screen.getByRole('button', { name: 'Edit profile' }))
    await user.clear(screen.getByLabelText('First name'))
    await user.type(screen.getByLabelText('First name'), 'Unsaved')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Angel Araoz' })).toBeVisible()
    expect(userApiMock.updateUserProfile).not.toHaveBeenCalled()
  })

  it('keeps the editor open when the update response has no profile data', async () => {
    const user = userEvent.setup()
    userApiMock.updateUserProfile.mockResolvedValue({
      success: true,
      message: '',
      data: null,
    })
    render(<ProfilePanel />)

    await user.click(screen.getByRole('button', { name: 'Edit profile' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      await screen.findByText('The API did not return the updated profile.'),
    ).toHaveAttribute('role', 'alert')
    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeVisible()
    expect(profileMock.replaceProfile).not.toHaveBeenCalled()
  })

  it('expires the session when updating the profile returns 401', async () => {
    const user = userEvent.setup()
    userApiMock.updateUserProfile.mockRejectedValue(new ApiError('Unauthorized', 401))
    render(<ProfilePanel />)

    await user.click(screen.getByRole('button', { name: 'Edit profile' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(authMock.expireSession).toHaveBeenCalledOnce())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeVisible()
  })

  it('requires confirmation and the current password before deleting the account', async () => {
    const user = userEvent.setup()
    userApiMock.deleteUserAccount.mockResolvedValue(undefined)
    render(<ProfilePanel />)

    expect(
      screen.getByText(
        'Permanently removes your profile, tasks, shared access, invitations, and notifications.',
      ),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    await user.type(screen.getByLabelText('Current password'), 'current-password')
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => {
      expect(userApiMock.deleteUserAccount).toHaveBeenCalledWith({
        password: 'current-password',
      })
    })
    expect(authMock.logout).toHaveBeenCalledOnce()
  })

  it('keeps the account active and displays a deletion failure', async () => {
    const user = userEvent.setup()
    userApiMock.deleteUserAccount.mockRejectedValue(
      new ApiError('Current password is incorrect.', 400),
    )
    render(<ProfilePanel />)

    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    await user.type(screen.getByLabelText('Current password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Current password is incorrect.',
    )
    expect(authMock.logout).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Current password')).toHaveValue('wrong-password')
  })

  it('shows provider loading and error states', () => {
    profileMock.current = {
      isProfileLoading: true,
      profile: null,
      profileError: 'Profile unavailable.',
    }

    const { rerender } = render(<ProfilePanel />)
    expect(screen.getByText('Loading profile...')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument()

    profileMock.current = {
      isProfileLoading: false,
      profile: null,
      profileError: 'Profile unavailable.',
    }
    rerender(<ProfilePanel />)

    expect(screen.getByRole('alert')).toHaveTextContent('Profile unavailable.')
    expect(screen.getByRole('heading', { name: 'Your profile' })).toBeVisible()
  })
})

function createProfile(overrides: Partial<IUserProfile> = {}): IUserProfile {
  return {
    firstName: 'Angel',
    lastName: 'Araoz',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Developer',
    ...overrides,
  }
}
