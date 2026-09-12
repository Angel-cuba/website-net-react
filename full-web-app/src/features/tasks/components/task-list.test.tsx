import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SharedTaskItem } from '../../shared/types/shared-task'
import type { TaskItem } from '../types/task'
import { TaskList } from './task-list'

describe('TaskList', () => {
  it('shows a loading state while the initial lists are empty', () => {
    renderTaskList({ isLoading: true })

    expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeVisible()
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })

  it('shows the empty state after loading finishes', () => {
    renderTaskList()

    expect(screen.getByRole('heading', { name: 'No tasks yet' })).toBeVisible()
    expect(
      screen.getByText('Create your first task or accept a task invitation.'),
    ).toBeVisible()
  })

  it('renders owned and view-only shared tasks in the same list', () => {
    renderTaskList({
      tasks: [createOwnedTask()],
      sharedTasks: [createSharedTask()],
    })

    expect(screen.getByRole('heading', { name: 'Owned task' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Shared task' })).toBeVisible()
    expect(screen.getByText('Shared · View only')).toBeVisible()
    expect(screen.getByText('Task owner')).toBeVisible()

    expect(screen.getByRole('button', { name: 'Share Owned task' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Edit Owned task' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Delete Owned task' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Edit shared task Shared task' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Complete shared task Shared task' }),
    ).not.toBeInTheDocument()
  })

  it('allows an editable shared task to be changed and completed', async () => {
    const user = userEvent.setup()
    const sharedTask = createSharedTask({ canEdit: true })
    const onEditShared = vi.fn()
    const onToggleShared = vi.fn().mockResolvedValue(undefined)
    renderTaskList({ sharedTasks: [sharedTask], onEditShared, onToggleShared })

    expect(screen.getByText('Shared · Can edit')).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Edit shared task Shared task' }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: 'Complete shared task Shared task' }),
    )

    expect(onEditShared).toHaveBeenCalledWith(1001)
    expect(onToggleShared).toHaveBeenCalledWith(sharedTask)
  })

  it('disables actions while either list is refreshing', () => {
    renderTaskList({
      isLoading: true,
      tasks: [createOwnedTask()],
      sharedTasks: [createSharedTask({ canEdit: true })],
    })

    expect(screen.getByRole('button', { name: 'Share Owned task' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit Owned task' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Edit shared task Shared task' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('checkbox', { name: 'Complete shared task Shared task' }),
    ).toBeDisabled()
  })
})

type TaskListOverrides = Partial<React.ComponentProps<typeof TaskList>>

function renderTaskList(overrides: TaskListOverrides = {}) {
  const props: React.ComponentProps<typeof TaskList> = {
    isLoading: false,
    sharedTasks: [],
    tasks: [],
    onDelete: vi.fn().mockResolvedValue(true),
    onEdit: vi.fn(),
    onEditShared: vi.fn(),
    onShare: vi.fn(),
    onToggle: vi.fn().mockResolvedValue(undefined),
    onToggleShared: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  return render(<TaskList {...props} />)
}

function createOwnedTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 42,
    title: 'Owned task',
    category: 'Backend',
    description: 'Owned by the signed-in user',
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

function createSharedTask(overrides: Partial<SharedTaskItem> = {}): SharedTaskItem {
  return {
    id: 1001,
    title: 'Shared task',
    category: 'Frontend',
    description: 'Shared with the signed-in user',
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
