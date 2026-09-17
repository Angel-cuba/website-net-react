import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getMinimumDueDateInputValue, toDateTimeInputValue } from '../../../utils/date'
import type { TaskItem, TaskPayload } from '../types/task'
import { TaskForm } from './task-form'

describe('TaskForm', () => {
  it('creates a task with the values selected by the user and resets after success', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn<(payload: TaskPayload) => Promise<boolean>>()
    onCreate.mockResolvedValue(true)
    renderTaskForm({ onCreate })

    await user.type(screen.getByLabelText('Title'), 'Regression coverage')
    await user.type(screen.getByLabelText('Description'), 'Protect the task flow')
    await chooseOption(user, 'Category', 'Testing')
    await chooseOption(user, 'Priority', 'High')
    await chooseOption(user, 'Status', 'In progress')
    fireEvent.change(screen.getByLabelText(/^Due date/), {
      target: { value: '2026-09-20T14:30' },
    })

    await user.click(screen.getByRole('button', { name: 'Create task' }))

    expect(onCreate).toHaveBeenCalledWith({
      title: 'Regression coverage',
      category: 'Testing',
      description: 'Protect the task flow',
      dueDate: '2026-09-20T14:30',
      isCompleted: false,
      priority: 'High',
      status: 'in-progress',
    })
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue(''))
    expect(screen.getByLabelText('Category')).toHaveTextContent('Backend')
    expect(screen.getByLabelText('Priority')).toHaveTextContent('Medium')
    expect(screen.getByLabelText('Status')).toHaveTextContent('Pending')
  })

  it('keeps the entered values when creation fails', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn<(payload: TaskPayload) => Promise<boolean>>()
    onCreate.mockResolvedValue(false)
    renderTaskForm({ onCreate })

    await user.type(screen.getByLabelText('Title'), 'Keep this draft')
    await user.click(screen.getByRole('button', { name: 'Create task' }))

    expect(onCreate).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Title')).toHaveValue('Keep this draft')
  })

  it('shows existing values and submits updates for a shared task', async () => {
    const user = userEvent.setup()
    const editingTask = createTask()
    const onUpdate = vi.fn<(payload: TaskPayload) => Promise<boolean>>()
    const onCancelEdit = vi.fn()
    onUpdate.mockResolvedValue(true)
    renderTaskForm({
      editingTask,
      isEditingSharedTask: true,
      onCancelEdit,
      onUpdate,
    })

    expect(screen.getByRole('heading', { name: 'Edit shared task' })).toBeVisible()
    expect(screen.getByText('Task #42')).toBeVisible()
    expect(screen.getByLabelText('Title')).toHaveValue(editingTask.title)
    expect(screen.getByLabelText(/^Due date/)).toHaveValue(
      toDateTimeInputValue(editingTask.dueDate),
    )

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Updated shared task')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated shared task',
        category: 'Frontend',
        status: 'pending',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancelEdit).toHaveBeenCalledOnce()
  })

  it('keeps the completed checkbox and status selector in sync', async () => {
    const user = userEvent.setup()
    renderTaskForm()
    const status = screen.getByLabelText('Status')
    const completed = screen.getByRole('checkbox', { name: 'Completed' })

    await chooseOption(user, 'Status', 'Completed')
    expect(completed).toBeChecked()

    await user.click(completed)
    expect(completed).not.toBeChecked()
    expect(status).toHaveTextContent('Pending')

    await user.click(completed)
    expect(completed).toBeChecked()
    expect(status).toHaveTextContent('Completed')
  })

  it('signals character thresholds and keeps only accepted text', () => {
    renderTaskForm()
    const title = screen.getByLabelText('Title')
    const description = screen.getByLabelText('Description')
    const titleField = title.closest('.character-field')
    const descriptionField = description.closest('.character-field')

    expect(screen.getByText('0 / 150')).toBeVisible()
    expect(screen.getByText('0 / 1000')).toBeVisible()
    expect(titleField).toHaveAttribute('data-limit-state', 'calm')

    fireEvent.change(title, { target: { value: 'a'.repeat(90) } })
    expect(titleField).toHaveAttribute('data-limit-state', 'attention')

    fireEvent.change(title, { target: { value: 'a'.repeat(120) } })
    expect(titleField).toHaveAttribute('data-limit-state', 'warning')

    fireEvent.change(title, { target: { value: 'a'.repeat(151) } })
    expect(title).toHaveValue('a'.repeat(150))
    expect(titleField).toHaveAttribute('data-limit-state', 'limit')
    expect(screen.getByText('Limit reached')).toBeVisible()
    expect(screen.getByText('150 / 150')).toBeVisible()

    fireEvent.change(description, { target: { value: 'b'.repeat(1001) } })
    expect(description).toHaveValue('b'.repeat(1000))
    expect(descriptionField).toHaveAttribute('data-limit-state', 'limit')
    expect(screen.getByText('1000 / 1000')).toBeVisible()
  })

  it('exposes the five-hour minimum and saving state through the form controls', () => {
    renderTaskForm({ disabled: true })

    expect(screen.getByLabelText(/^Due date/)).toHaveAttribute(
      'min',
      getMinimumDueDateInputValue(),
    )
    expect(screen.getByText('At least 5 hours from now.')).toBeVisible()
    expect(screen.getByLabelText('Title').closest('form')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled()
  })
})

type TaskFormOverrides = Partial<React.ComponentProps<typeof TaskForm>>

function renderTaskForm(overrides: TaskFormOverrides = {}) {
  const props: React.ComponentProps<typeof TaskForm> = {
    disabled: false,
    editingTask: null,
    isEditingSharedTask: false,
    onCancelEdit: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(true),
    onUpdate: vi.fn().mockResolvedValue(true),
    ...overrides,
  }

  return render(<TaskForm {...props} />)
}

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

function createTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 42,
    title: 'Existing task',
    category: 'Frontend',
    description: 'Existing description',
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
