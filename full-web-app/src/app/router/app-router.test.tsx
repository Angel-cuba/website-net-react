import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InvitationItem } from '../../features/invitations/types/invitation'
import { AppRouter } from './app-router'

const authMock = vi.hoisted(() => ({
  logout: vi.fn(),
  current: {
    isAuthenticated: false,
    user: null,
  } as {
    isAuthenticated: boolean
    user: { id: string; email: string } | null
  },
}))

const profileMock = vi.hoisted(() => ({
  current: {
    profile: null,
  } as {
    profile: {
      firstName: string
      lastName: string
      avatarUrl: string
      bio: string
    } | null
  },
}))

const invitationsMock = vi.hoisted(() => ({
  current: { invitations: [] as InvitationItem[] },
}))

vi.mock('../../features/auth', () => ({
  AuthPanel: () => <p>Authentication panel</p>,
  useAuth: () => ({
    ...authMock.current,
    logout: authMock.logout,
  }),
}))

vi.mock('../../features/profile', () => ({
  useProfile: () => profileMock.current,
}))

vi.mock('../../features/invitations/hooks/use-invitations', () => ({
  useInvitations: () => invitationsMock.current,
}))

vi.mock('../../features/tasks', () => ({
  TaskPanel: () => <h1>Tasks view</h1>,
}))

vi.mock('../../features/invitations/components/invitations-panel', () => ({
  InvitationsPanel: () => <h1>Invitations view</h1>,
}))

vi.mock('../../features/shared/components/shared-tasks-panel', () => ({
  SharedTasksPanel: () => <h1>Shared tasks view</h1>,
}))

vi.mock('../../features/profile/components/profile-panel', () => ({
  ProfilePanel: () => <h1>Profile view</h1>,
}))

describe('AppRouter and AppShell', () => {
  beforeEach(() => {
    authMock.current = { isAuthenticated: false, user: null }
    profileMock.current = { profile: null }
    invitationsMock.current = { invitations: [] }
    window.history.replaceState(null, '', '/tasks')
    vi.clearAllMocks()
  })

  it('protects the workspace and normalizes an unknown route for a guest', async () => {
    window.history.replaceState(null, '', '/unknown')

    render(<AppRouter />)

    expect(
      screen.getByRole('heading', { name: 'Your workspace is protected' }),
    ).toBeVisible()
    expect(screen.getByText('Authentication panel')).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument()
    await waitFor(() => expect(window.location.pathname).toBe('/tasks'))
  })

  it('renders the authenticated route, identity, avatar, and pending badge', () => {
    authenticate()
    window.history.replaceState(null, '', '/invitations')
    profileMock.current = {
      profile: {
        firstName: 'Angel',
        lastName: 'Araoz',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Developer',
      },
    }
    invitationsMock.current = {
      invitations: [
        ...Array.from({ length: 101 }, (_, index) =>
          createInvitation({ id: index + 1 }),
        ),
        createInvitation({ id: 200, status: 'accepted' }),
      ],
    }

    render(<AppRouter />)

    expect(screen.getByRole('heading', { name: 'Invitations view' })).toBeVisible()
    expect(screen.getByRole('link', { name: /Invitations/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByLabelText('101 pending invitations')).toHaveTextContent('99+')
    expect(screen.getByText('angel@example.com')).toBeVisible()
    expect(screen.getByText('User 9')).toBeVisible()
    expect(screen.getByRole('img', { name: 'Angel Araoz profile avatar' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg',
    )
  })

  it('navigates between pages without a document reload', async () => {
    const user = userEvent.setup()
    authenticate()
    render(<AppRouter />)

    await user.click(screen.getByRole('link', { name: 'Shared tasks' }))
    expect(window.location.pathname).toBe('/shared')
    expect(screen.getByRole('heading', { name: 'Shared tasks view' })).toBeVisible()

    await user.click(screen.getByRole('link', { name: 'Profile' }))
    expect(window.location.pathname).toBe('/profile')
    expect(screen.getByRole('heading', { name: 'Profile view' })).toBeVisible()
  })

  it('synchronizes the active view with browser history navigation', () => {
    authenticate()
    render(<AppRouter />)

    act(() => {
      window.history.pushState(null, '', '/profile')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(screen.getByRole('heading', { name: 'Profile view' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens and closes the mobile navigation with Escape', async () => {
    const user = userEvent.setup()
    authenticate()
    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    const menuButton = screen
      .getAllByRole('button', { name: 'Close navigation' })
      .find((button) => button.getAttribute('aria-controls') === 'app-sidebar')
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('logs out from the authenticated sidebar', async () => {
    const user = userEvent.setup()
    authenticate()
    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(authMock.logout).toHaveBeenCalledOnce()
  })
})

function authenticate() {
  authMock.current = {
    isAuthenticated: true,
    user: { id: '9', email: 'angel@example.com' },
  }
}

function createInvitation(overrides: Partial<InvitationItem> = {}): InvitationItem {
  return {
    id: 1,
    taskId: 1001,
    taskTitle: 'Shared task',
    invitedEmail: 'angel@example.com',
    invitedByEmail: 'owner@example.com',
    invitedByName: 'Task owner',
    status: 'pending',
    hasActiveAccess: false,
    createdAt: '2026-09-12T08:00:00Z',
    respondedAt: null,
    ...overrides,
  }
}
