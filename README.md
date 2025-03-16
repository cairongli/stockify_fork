# Stockify

backendSetUp
# Running Flask Backend
## Install dependencies from 'requirements.txt' file (it's better to have a virtual environment first) 
`pip install -r requirements.txt`

## Initialize the Database
`flask db upgrade`

## Run the flask app
`flask run`
=======
## Testing Setup

This project uses:
- Frontend: Jest + React Testing Library
- Backend: Pytest
- Continuous Integration via GitHub Actions

### Quick Start

```bash
# Frontend Tests
cd frontend
npm test

# Backend Tests
cd backend
source venv/bin/activate  # Activate virtual environment
pytest -v                 # Run tests
```

For detailed testing information, see [TESTING.md](TESTING.md)

# Install the new dependencies
npm install

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch


