import { render, screen, waitFor } from '@testing-library/react'
import PostList from '@/components/PostList'
import { setupMockSupabase, mockPosts, resetMocks } from '../helpers/supabaseTestClient'

// Mock fetch globally
global.fetch = jest.fn()

describe('PostList', () => {
  const mockOnFollow = jest.fn()

  beforeEach(() => {
    resetMocks()
    setupMockSupabase()
  })

  it('shows loading state initially', () => {
    // Mock fetch to return a promise that never resolves to keep the loading state
    global.fetch.mockImplementationOnce(() => new Promise(() => {}))
    render(<PostList onFollow={mockOnFollow} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays posts when loaded', async () => {
    // Mock successful fetch
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPosts)
      })
    )

    render(<PostList onFollow={mockOnFollow} />)

    // First check for loading state
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Then wait for the posts to appear
    await waitFor(() => {
      expect(screen.getByText('First post')).toBeInTheDocument()
      expect(screen.getByText('Second post')).toBeInTheDocument()
      expect(screen.getByText('User 1')).toBeInTheDocument()
      expect(screen.getByText('User 2')).toBeInTheDocument()
    })
  })

  it('displays error message when fetch fails', async () => {
    // Mock failed fetch
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    )

    render(<PostList onFollow={mockOnFollow} />)

    // First check for loading state
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Then wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/Error loading posts/)).toBeInTheDocument()
    })
  })

  it('displays empty state when no posts', async () => {
    // Mock successful fetch with empty array
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    )

    render(<PostList onFollow={mockOnFollow} />)

    // First check for loading state
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Then wait for the empty state message
    await waitFor(() => {
      expect(screen.getByText('No posts yet. Be the first to post!')).toBeInTheDocument()
    })
  })

  it('passes onFollow handler to PostCard components', async () => {
    // Mock successful fetch
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPosts)
      })
    )

    render(<PostList onFollow={mockOnFollow} />)

    await waitFor(() => {
      const followButtons = screen.getAllByRole('button', { name: /follow/i })
      expect(followButtons).toHaveLength(mockPosts.length)
    })
  })
}) 