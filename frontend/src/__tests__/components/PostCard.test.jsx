import { render, screen, fireEvent } from '@testing-library/react'
import PostCard from '@/components/PostCard'
import { setupMockUser, resetMocks, mockUser } from '../helpers/supabaseTestClient'

// Mock the router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

// Mock the UserContext
jest.mock('@/config/UserContext', () => ({
  useGlobalUser: jest.fn()
}))

describe('PostCard', () => {
  const mockPost = {
    id: 1,
    content: 'Test post content',
    author_name: 'Test User',
    author_id: '123',
    created_at: '2024-03-28T04:00:00Z'
  }

  const mockOnFollow = jest.fn()

  beforeEach(() => {
    resetMocks()
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  it('renders post content and author name', () => {
    render(<PostCard post={mockPost} onFollow={mockOnFollow} />)
    expect(screen.getByText('Test post content')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('renders follow button and handles click when logged in', () => {
    const mockCurrentUser = { id: 'test-user' }
    require('@/config/UserContext').useGlobalUser.mockReturnValue(mockCurrentUser)
    
    render(<PostCard post={mockPost} onFollow={mockOnFollow} />)
    const followButton = screen.getByRole('button', { name: /follow/i })
    fireEvent.click(followButton)
    expect(mockOnFollow).toHaveBeenCalledWith(mockPost.author_id)
  })

  it('shows "Your Post" when post is from current user', () => {
    const mockCurrentUser = { id: '123' }  // Same ID as post.author_id
    require('@/config/UserContext').useGlobalUser.mockReturnValue(mockCurrentUser)
    
    render(<PostCard post={mockPost} onFollow={mockOnFollow} />)
    expect(screen.getByText('Your Post')).toBeInTheDocument()
  })

  it('redirects to login when clicking follow while not logged in', () => {
    require('@/config/UserContext').useGlobalUser.mockReturnValue(null)
    
    render(<PostCard post={mockPost} onFollow={mockOnFollow} />)
    const followButton = screen.getByRole('button', { name: /follow/i })
    fireEvent.click(followButton)
    
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=/posts')
    expect(mockOnFollow).not.toHaveBeenCalled()
  })
}) 