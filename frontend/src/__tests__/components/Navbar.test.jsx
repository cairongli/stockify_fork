import { render, screen, fireEvent } from '@testing-library/react'
import Navbar from '@/components/Navbar'
import { useGlobalUser } from '@/config/UserContext'

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>
}))

// Mock the Supabase client
jest.mock('@/config/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    }
  }
}))

// Mock the UserContext
jest.mock('@/config/UserContext', () => ({
  useGlobalUser: jest.fn()
}))

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login/signup buttons when user is not logged in', () => {
    useGlobalUser.mockReturnValue(null)
    render(<Navbar />)
    
    expect(screen.getByText('Log In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
    expect(screen.queryByText('Log Out')).not.toBeInTheDocument()
  })

  it('renders logout button when user is logged in', () => {
    useGlobalUser.mockReturnValue({ id: 'test-user' })
    render(<Navbar />)
    
    expect(screen.getByText('Log Out')).toBeInTheDocument()
    expect(screen.queryByText('Log In')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
  })

  it('handles logout correctly', async () => {
    useGlobalUser.mockReturnValue({ id: 'test-user' })
    render(<Navbar />)
    
    const logoutButton = screen.getByText('Log Out')
    await fireEvent.click(logoutButton)
    
    expect(require('@/config/supabaseClient').supabase.auth.signOut).toHaveBeenCalled()
  })
}) 