# Stockify Backend

This is the backend service for the Stockify application, built with Flask.

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Development

The application uses environment variables for configuration. These are stored in `.flaskenv`:

- `FLASK_APP=app.py`: Specifies the Flask application
- `FLASK_ENV=development`: Enables development mode
- `FLASK_DEBUG=1`: Enables debug mode

To run the application in development mode:

```bash
flask run
```

The server will start at `http://127.0.0.1:5000/`

## Testing

To run tests:

```bash
PYTHONPATH=. pytest -v
```

To run tests with coverage:

```bash
PYTHONPATH=. pytest --cov=app tests/
```

## API Endpoints

- `GET /`: Returns a hello world message 