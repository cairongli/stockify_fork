# Testing Guide for Stockify

This document outlines the testing strategy and guidelines for the Stockify project.

## Testing Frameworks

### Frontend Testing (Jest + React Testing Library)
- **Jest**: Main testing framework
- **React Testing Library**: DOM testing utilities
- **Coverage**: Jest built-in coverage reporting

### Backend Testing (Pytest)
- **Pytest**: Main testing framework
- **Pytest-cov**: Coverage reporting
- **Flask Test Client**: API testing

## Test Organization

```
stockify/
├── frontend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── components/
│   │   │   │   ├── Navbar.test.jsx
│   │   │   │   └── Hero.test.jsx
│   │   └── components/
├── backend/
│   ├── tests/
│   │   └── test_app.py
│   └── app.py
```

## Running Tests

### Frontend Tests
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Backend Tests
```bash
# Run tests
PYTHONPATH=. pytest -v

# Run tests with coverage
PYTHONPATH=. pytest --cov=app tests/
```

## Testing Guidelines

### Frontend Testing Best Practices
1. Test component rendering
2. Test user interactions
3. Test state changes
4. Mock external dependencies
5. Use meaningful test descriptions

Example:
```javascript
describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Backend Testing Best Practices
1. Test API endpoints
2. Test error handling
3. Test edge cases
4. Use fixtures for test data
5. Mock external services

Example:
```python
def test_endpoint(client):
    response = client.get('/')
    assert response.status_code == 200
```

## Helpful Resources

### Frontend Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing React Applications](https://reactjs.org/docs/testing.html)

### Backend Testing
- [Pytest Documentation](https://docs.pytest.org/)
- [Flask Testing](https://flask.palletsprojects.com/en/2.0.x/testing/)
- [Python Testing Best Practices](https://docs.python-guide.org/writing/tests/)

## Continuous Integration

Our CI pipeline runs on every pull request and push to main branch:
- Runs all tests
- Generates coverage reports
- Fails if coverage drops below threshold
- Sends notifications on failure

### Coverage Requirements
- Frontend: Minimum 80% coverage
- Backend: Minimum 85% coverage 