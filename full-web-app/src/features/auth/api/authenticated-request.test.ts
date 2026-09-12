import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storeAuthToken } from '../token-storage'
import { authenticatedRequest } from './authenticated-request'

describe('authenticatedRequest', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('reads the current token for every request', async () => {
    storeAuthToken('first-token')
    fetchMock.mockResolvedValueOnce(successResponse())

    await authenticatedRequest('/api/user/profile')

    storeAuthToken('second-token')
    fetchMock.mockResolvedValueOnce(successResponse())

    await authenticatedRequest('/api/user/profile')

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer first-token',
    })
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer second-token',
    })
  })

  it('omits the authorization header when logged out', async () => {
    fetchMock.mockResolvedValue(successResponse())

    await authenticatedRequest('/api/user/profile')

    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      'Content-Type': 'application/json',
    })
  })
})

function successResponse(): Response {
  return new Response(JSON.stringify({ success: true, data: null }))
}
