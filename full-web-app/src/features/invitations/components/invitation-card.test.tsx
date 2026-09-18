import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { InvitationItem } from '../types/invitation'
import { InvitationCard } from './invitation-card'

describe('InvitationCard', () => {
  it('accepts immediately and confirms a decline with a required reason', async () => {
    const user = userEvent.setup()
    const onRespond = vi.fn().mockResolvedValue(true)
    renderInvitation({ onRespond })

    expect(screen.getByRole('heading', { name: 'Shared task' })).toBeVisible()
    expect(screen.getByText('Task owner')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Accept' }))
    await user.click(screen.getByRole('button', { name: 'Decline' }))
    await user.type(
      screen.getByRole('textbox', { name: /Reason for declining/i }),
      'I am at capacity this week.',
    )
    await user.click(screen.getByRole('button', { name: 'Confirm decline' }))

    expect(onRespond).toHaveBeenNthCalledWith(1, 12, 'accepted')
    expect(onRespond).toHaveBeenNthCalledWith(
      2,
      12,
      'rejected',
      'I am at capacity this week.',
    )
  })

  it('does not submit a decline with an empty or whitespace-only reason', async () => {
    const user = userEvent.setup()
    const onRespond = vi.fn().mockResolvedValue(true)
    renderInvitation({ onRespond })

    await user.click(screen.getByRole('button', { name: 'Decline' }))

    const reason = screen.getByRole('textbox', { name: /Reason for declining/i })
    const confirm = screen.getByRole('button', { name: 'Confirm decline' })

    expect(confirm).toBeDisabled()
    await user.type(reason, '   ')
    expect(confirm).toBeDisabled()
    expect(onRespond).not.toHaveBeenCalled()
  })

  it('cancels a decline without responding and clears the draft', async () => {
    const user = userEvent.setup()
    const onRespond = vi.fn().mockResolvedValue(true)
    renderInvitation({ onRespond })

    await user.click(screen.getByRole('button', { name: 'Decline' }))
    const reason = screen.getByRole('textbox', { name: /Reason for declining/i })
    await user.type(reason, 'Not this week')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onRespond).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Decline' }))
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('disables pending actions while another operation is active', () => {
    renderInvitation({ disabled: true, isResponding: true })

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled()
  })

  it('shows an accepted invitation without response actions', () => {
    renderInvitation({
      invitation: createInvitation({ status: 'accepted', hasActiveAccess: true }),
    })

    expect(screen.getByText('Accepted')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument()
  })

  it('distinguishes revoked access from an active accepted invitation', () => {
    renderInvitation({
      invitation: createInvitation({ status: 'accepted', hasActiveAccess: false }),
    })

    expect(screen.getByText('Access revoked')).toBeVisible()
    expect(screen.queryByText('Accepted')).not.toBeInTheDocument()
  })

  it('shows declined status and falls back to the inviter email', () => {
    renderInvitation({
      invitation: createInvitation({
        invitedByName: '',
        status: 'rejected',
        rejectionReason: 'The timing does not work for me.',
        createdAt: 'not-a-date',
      }),
    })

    expect(screen.getByText('Declined')).toBeVisible()
    expect(screen.getByText('owner@example.com')).toBeVisible()
    expect(screen.getByText('Sent on an unknown date')).toBeVisible()
    expect(screen.getByText('The timing does not work for me.')).toBeVisible()
  })
})

type InvitationCardOverrides = Partial<React.ComponentProps<typeof InvitationCard>>

function renderInvitation(overrides: InvitationCardOverrides = {}) {
  const props: React.ComponentProps<typeof InvitationCard> = {
    disabled: false,
    invitation: createInvitation(),
    isResponding: false,
    onRespond: vi.fn().mockResolvedValue(true),
    ...overrides,
  }

  return render(<InvitationCard {...props} />)
}

function createInvitation(overrides: Partial<InvitationItem> = {}): InvitationItem {
  return {
    id: 12,
    taskId: 1001,
    taskTitle: 'Shared task',
    invitedEmail: 'member@example.com',
    invitedByEmail: 'owner@example.com',
    invitedByName: 'Task owner',
    status: 'pending',
    hasActiveAccess: false,
    createdAt: '2026-09-12T08:00:00Z',
    respondedAt: null,
    rejectionReason: null,
    ...overrides,
  }
}
