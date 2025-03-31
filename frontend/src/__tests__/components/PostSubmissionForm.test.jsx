import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PostSubmissionForm from '@/components/PostSubmissionForm'
import { resetMocks } from '../helpers/supabaseTestClient'

describe('PostSubmissionForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    resetMocks()
    mockOnSubmit.mockClear()
  })

  it('renders form elements correctly', () => {
    render(<PostSubmissionForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
    expect(screen.getByText('0/500 characters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument()
  })

  it('updates character count as user types', () => {
    render(<PostSubmissionForm onSubmit={mockOnSubmit} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'Test post' } })
    
    expect(screen.getByText('9/500 characters')).toBeInTheDocument()
  })

  it('disables submit button when content is empty', () => {
    render(<PostSubmissionForm onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /post/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when content is not empty', () => {
    render(<PostSubmissionForm onSubmit={mockOnSubmit} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'Test post' } })
    
    const submitButton = screen.getByRole('button', { name: /post/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSubmit with content when form is submitted', async () => {
    render(<PostSubmissionForm onSubmit={mockOnSubmit} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'Test post' } })
    
    const submitButton = screen.getByRole('button', { name: /post/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Test post')
    })
  })

  it('shows loading state during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<PostSubmissionForm onSubmit={mockOnSubmit} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'Test post' } })
    
    const submitButton = screen.getByRole('button', { name: /post/i })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Posting...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument()
    })
  })

  it('clears form after successful submission', async () => {
    render(<PostSubmissionForm onSubmit={mockOnSubmit} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'Test post' } })
    
    const submitButton = screen.getByRole('button', { name: /post/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(textarea.value).toBe('')
      expect(screen.getByText('0/500 characters')).toBeInTheDocument()
    })
  })
}) 