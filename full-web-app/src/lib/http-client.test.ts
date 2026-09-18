import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './http-client'

describe('apiRequest', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds the API URL and includes the bearer token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { id: 10 } }))

    await apiRequest(
      '/api/tasks/10',
      {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated task' }),
        headers: { 'X-Request-Id': 'request-1' },
      },
      'signed-token',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/tasks/10',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated task' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer signed-token',
          'X-Request-Id': 'request-1',
        },
      }),
    )
  })

  it('allows the caller to override the default content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }))

    await apiRequest('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'plain text',
    })

    const request = fetchMock.mock.calls[0][1]
    expect(request?.headers).toEqual({ 'Content-Type': 'text/plain' })
  })

  it('returns parsed JSON for a successful response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: ['task'] }))

    const result = await apiRequest<{ success: boolean; data: string[] }>(
      '/api/tasks/all',
    )

    expect(result).toEqual({ success: true, data: ['task'] })
  })

  it('returns undefined for a no-content response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    const result = await apiRequest<void>('/api/user/account', { method: 'DELETE' })

    expect(result).toBeUndefined()
  })

  it('throws ApiError with the API message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, message: 'Invitation already exists.' }, 409),
    )

    await expect(apiRequest('/api/invitations')).rejects.toEqual(
      new ApiError('Invitation already exists.', 409),
    )
  })

  it('uses a plain-text error response as the message', async () => {
    fetchMock.mockResolvedValue(new Response('Service unavailable', { status: 503 }))

    await expect(apiRequest('/api/tasks/all')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message: 'Service unavailable',
      kind: 'unavailable',
      retryable: true,
    })
  })

  it('falls back to the HTTP status when the error body is empty', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 502 }))

    await expect(apiRequest('/api/tasks/all')).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    })
  })

  it('classifies unexpected server errors without marking them retryable', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))

    await expect(apiRequest('/api/tasks/all')).rejects.toMatchObject({
      status: 500,
      kind: 'server',
      retryable: false,
    })
  })

  it('classifies network failures as retryable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiRequest('/api/tasks/all')).rejects.toMatchObject({
      status: 0,
      kind: 'network',
      retryable: true,
      message: 'The service could not be reached.',
    })
  })

  it('aborts and classifies requests that exceed their timeout', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      }),
    )

    const request = apiRequest('/health/ready', { timeoutMs: 1_000 })
    const expectation = expect(request).rejects.toMatchObject({
      status: 0,
      kind: 'timeout',
      retryable: true,
    })

    await vi.advanceTimersByTimeAsync(1_000)
    await expectation
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
