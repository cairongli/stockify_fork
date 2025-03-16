# Testing Guide for Stockify

## Testing Frameworks Selected

### Frontend
- **Jest + React Testing Library**
  - Industry standard for React testing
  - Built-in coverage reporting
  - Easy-to-read test syntax

### Backend
- **Pytest**
  - Python's most popular testing framework
  - Simple test writing
  - Excellent coverage reporting

## Directory Structure
```
stockify/
├── frontend/
│   ├── src/
│   │   ├── __tests__/          # Frontend tests
│   │   │   └── components/     # Component tests
│   │   └── components/         # React components
├── backend/
│   ├── app.py                  # Flask application
│   └── tests/                  # Backend tests
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

### Backend Tests
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Run tests
pytest -v

# Run with coverage
pytest --cov=. tests/
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

### Backend API Test
```python
def test_hello_world(client):
    response = client.get('/')
    assert response.status_code == 200
    assert response.json['message'] == "Hello, world!"
```

## Continuous Integration

Tests run automatically on:
- Every push to main branch
- Every pull request
- Every push to test-engineering branch

### GitHub Actions Workflow
- Runs frontend and backend tests separately
- Reports test results
- Shows test coverage
- Fails if tests fail

## Coverage Requirements
- Frontend: 80% minimum
- Backend: 85% minimum

## Helpful Resources

### Frontend Testing
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Backend Testing
- [Pytest Docs](https://docs.pytest.org/)
- [Flask Testing](https://flask.palletsprojects.com/en/2.0.x/testing/) 