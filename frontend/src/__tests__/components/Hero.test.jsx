import { render, screen } from '@testing-library/react'
import Hero from '@/components/Hero'

describe('Hero', () => {
  it('renders without crashing', () => {
    render(<Hero />)
    // Add your assertions here based on your Hero implementation
    // For example:
    // expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  // Add more test cases as needed
}) 