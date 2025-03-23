import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

// Mock the Supabase client
jest.mock('@/config/supabaseClient', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }))
}))

describe('Navbar', () => {
  it('renders without crashing', () => {
    render(<Navbar />)
    // Add your assertions here based on your Navbar implementation
    // For example:
    // expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  // Add more test cases as needed
}) 