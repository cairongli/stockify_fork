# Testing Guide for Stockify

## Testing Frameworks Selected

### Frontend
- **Jest + React Testing Library**
  - Industry standard for React testing
  - Built-in coverage reporting
  - Easy-to-read test syntax

### Backend (Supabase)
- **Supabase Testing**
  - Local development with Supabase CLI
  - Integration tests with Supabase client
  - Database migrations testing

## Directory Structure
```
stockify/
├── frontend/
│   ├── src/
│   │   ├── __tests__/          # Frontend tests
│   │   │   └── components/     # Component tests
│   │   └── components/         # React components
```

## Running Tests Locally

### Frontend Tests
```bash
# Navigate to frontend directory
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Supabase Tests
```bash
# Start local Supabase
supabase start

# Run database migrations
supabase db reset

# Test database functions
supabase functions test
```

## Example Tests

### Frontend Component Test
```javascript
import { render, screen } from '@testing-library/react';
import Navbar from '../components/Navbar';

describe('Navbar', () => {
  it('renders without crashing', () => {
    render(<Navbar />);
    // Add your assertions here
  });
});
```

### Supabase Integration Test
```javascript
import { createClient } from '@supabase/supabase-js'

describe('Supabase Integration', () => {
  it('connects to Supabase', async () => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    const { data, error } = await supabase.from('your_table').select('*')
    expect(error).toBeNull()
  })
})
```

## Continuous Integration

Tests run automatically on:
- Every push to main branch
- Every pull request
- Every push to test-engineering branch

### GitHub Actions Workflow
- Runs frontend tests
- Tests Supabase migrations
- Reports test results
- Shows test coverage
- Fails if tests fail

## Coverage Requirements
- Frontend: 80% minimum

## Helpful Resources

### Frontend Testing
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Supabase Testing
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Supabase CLI](https://supabase.com/docs/reference/cli) 