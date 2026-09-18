import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskSharingDialog } from './task-sharing-dialog'

const sharingHookMock = vi.hoisted(() => ({
  current: {
    sharing: {
      taskId: 1001,
      taskTitle: 'Shared task',
      pendingInvitations: [],
      recentResponses: [
        {
          invitationId: 42,
          invitedEmail: 'grace@example.com',
          invitedName: 'Grace Hopper',
          invitedAvatarUrl: null,
          status: 'rejected' as const,
          rejectionReason: 'I am at capacity this week.',
          createdAt: '2026-09-17T20:00:00Z',
          respondedAt: '2026-09-17T21:00:00Z',
        },
      ],
      members: [],
    },
    isLoading: false,
    isSubmitting: false,
    message: '',
    error: '',
    inviteUser: vi.fn(),
    cancelPendingInvitation: vi.fn(),
    revokeAccess: vi.fn(),
    updateAccessPermission: vi.fn(),
  },
}))

vi.mock('../hooks/use-task-sharing', () => ({
  useTaskSharing: () => sharingHookMock.current,
}))

describe('TaskSharingDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value() {
        this.setAttribute('open', '')
      },
    })
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value() {
        this.removeAttribute('open')
      },
    })
  })

  it('shows a recent declined invitation and its reason to the owner', () => {
    render(
      <TaskSharingDialog
        onClose={vi.fn()}
        task={{ id: 1001, title: 'Shared task' }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Declined invitations' }),
    ).toBeVisible()
    expect(screen.getByText('Grace Hopper')).toBeVisible()
    expect(screen.getByText('grace@example.com')).toBeVisible()
    expect(screen.getByText(/I am at capacity this week\./)).toBeVisible()
    expect(screen.getByText('Declined')).toBeVisible()
  })
})
