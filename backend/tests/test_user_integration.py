import pytest
import json
from app import app
from extensions import db
from models.user import Account

@pytest.fixture
def test_client():
    """Create a test client with a clean database for testing"""
    # Configure app for testing
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    # Create a test client
    with app.test_client() as client:
        # Setup app context
        with app.app_context():
            # Create all tables in the test database
            db.create_all()
            yield client
            # Clean up after test
            db.session.remove()
            db.drop_all()

def test_user_signup_and_retrieve(test_client):
    """
    Simple integration test that:
    1. Creates a new user via the signup endpoint
    2. Verifies the user is returned in the users list
    """
    # Test user data
    test_user = {
        'username': 'integrationtestuser',
        'password': 'testpassword123'
    }
    
    # Step 1: Register a new user
    signup_response = test_client.post(
        '/signup',
        data=json.dumps(test_user),
        content_type='application/json'
    )
    
    # Verify signup was successful
    assert signup_response.status_code == 201
    assert signup_response.json['message'] == 'User successfully registered!'
    
    # Step 2: Retrieve the list of users
    users_response = test_client.get('/users')
    
    # Verify the user list contains our test user
    assert users_response.status_code == 200
    assert 'integrationtestuser' in users_response.json