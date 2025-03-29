import { render, screen, fireEvent } from '@testing-library/react'
import PostCard from '@/components/PostCard'

// Mock Supabase client
jest.mock('@/config/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } })
    }
  }
}));

describe('PostCard', () => {
  const mockPost = {
    id: 1,
    content: 'Test post content',
    author_name: 'Test User',
    author_id: '123',
    created_at: '2024-03-28T12:00:00Z'
  }

  const mockOnFollow = jest.fn()

  it('renders post content correctly', () => {
    render(<PostCard post={mockPost} onFollow={mockOnFollow} isFollowing={false} />)
    
    expect(screen.getByText('Test post content')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Follow')).toBeInTheDocument()
  })

  it('displays correct follow button state', () => {
    render(<PostCard post={mockPost} onFollow={mockOnFollow} isFollowing={true} />)
    expect(screen.getByText('Following')).toBeInTheDocument()
  })

  it('calls onFollow when follow button is clicked', () => {
    render(<PostCard post={mockPost} onFollow={mockOnFollow} isFollowing={false} />)
    
    const followButton = screen.getByText('Follow')
    fireEvent.click(followButton)
    
    expect(mockOnFollow).toHaveBeenCalledWith(mockPost.author_id)
  })

  it('formats timestamp correctly', () => {
    render(<PostCard post={mockPost} onFollow={mockOnFollow} isFollowing={false} />)
    
    // Check for the presence of "Created at" followed by the date
    expect(screen.getByText(/Created at/)).toBeInTheDocument()
  })
}) 