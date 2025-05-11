import pytest
from sqlalchemy import text
from backend.database import app, db, User
from werkzeug.security import generate_password_hash


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://joshiMembers:joshiBoss@localhost:5432/guptaCare'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with app.test_client() as client:
        with app.app_context():
            # Drop and recreate all tables using SQLAlchemy
            db.reflect()  
            db.drop_all() 
            db.create_all()

            yield client

            db.session.remove()

def test_signup(client):
    response = client.post('/api/signup', json={
        'email': 'test@example.com',
        'password': 'secret123',
        'role': 'patient'
    })
    assert response.status_code == 201
    assert b'Signup successful' in response.data

def test_duplicate_signup(client):
    client.post('/api/signup', json={
        'email': 'duplicate@example.com',
        'password': 'secret123',
        'role': 'patient'
    })
    response = client.post('/api/signup', json={
        'email': 'duplicate@example.com',
        'password': 'secret123',
        'role': 'patient'
    })
    assert response.status_code == 409
    assert b'Email already in use' in response.data

def test_login_success(client):
    with app.app_context():
        hashed = generate_password_hash('testpass')
        user = User(username='tester123', email='login@example.com', full_name='Login User', password_hash=hashed, role='patient')
        db.session.add(user)
        db.session.commit()

    response = client.post('/api/login', json={
        'email': 'login@example.com',
        'password': 'testpass'
    })
    assert response.status_code == 200
    assert b'Login successful' in response.data
    assert 'Set-Cookie' in response.headers

def test_login_invalid_password(client):
    with app.app_context():
        hashed = generate_password_hash('correctpass')
        user = User(username='loginuser', email='login@example.com', full_name='Test Login', password_hash=hashed, role='patient')
        db.session.add(user)
        db.session.commit()

    response = client.post('/api/login', json={
        'email': 'login@example.com',
        'password': 'wrongpass'
    })
    assert response.status_code == 401
    assert b'Invalid password' in response.data

def test_get_users(client):
    with app.app_context():
        user = User(username='testuser123', email='user@test.com', full_name='Test User', password_hash='x', role='patient')
        db.session.add(user)
        db.session.commit()

    response = client.get('/')
    assert response.status_code == 200
    data = response.get_json()
    assert any(u['email'] == 'user@test.com' for u in data)
