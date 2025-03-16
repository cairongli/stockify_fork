# Testing Guide for Stockify

## Testing Frameworks Selected

### Frontend
- **Jest + React Testing Library**
  - Industry standard for React testing
  - Great component testing capabilities
  - Built-in coverage reporting

### Backend
- **Pytest**
  - Powerful Python testing framework
  - Simple syntax for writing tests
  - Excellent plugin ecosystem

## Test Organization

```
stockify/
├── frontend/
│   ├── src/
│   │   ├── __tests__/          # Frontend tests directory
│   │   │   ├── components/     # Component tests
│   │   │   │   ├── Navbar.test.jsx
│   │   │   │   └── Hero.test.jsx
├── backend/
│   ├── tests/                  # Backend tests directory
│   │   └── test_app.py
│   └── app.py
```

## Running Tests

### Frontend
```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Backend
```bash
# Run tests
pytest -v

# Run with coverage
pytest --cov=. tests/
```

## Example Tests

### Frontend Component Test
```javascript
describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Backend API Test
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

## Continuous Integration

Our GitHub Actions pipeline automatically:
- Runs all tests on pull requests and pushes to main
- Reports test failures
- Tracks code coverage
- Ensures tests pass before merging

### Coverage Requirements
- Frontend: 80% minimum
- Backend: 85% minimum 