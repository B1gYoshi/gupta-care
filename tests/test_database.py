import pytest
import jwt
from datetime import datetime, timezone, timedelta
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

def test_logout(client):
    response = client.post('/api/logout')
    assert response.status_code == 200
    assert b'Logout successful' in response.data


def test_search_patients_unauthorized(client):
    with app.app_context():
        user = User(username='patient', email='patient@example.com', full_name='Patient User',
                    password_hash=generate_password_hash('test'), role='patient')
        db.session.add(user)
        db.session.commit()
        token = jwt.encode({'user_id': user.user_id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
                           app.config['SECRET_KEY'], algorithm="HS256")

    client.set_cookie('jwt_token', token)
    response = client.get('/api/patients?q=foo')

    assert response.status_code == 403  # Unauthorized for non-clinician

def test_create_appointment(client):
    with app.app_context():
        clinician = User(username='doc1', email='doc1@example.com', full_name='Dr. One',
                         password_hash=generate_password_hash('docpass'), role='clinician')
        patient = User(username='pat1', email='pat1@example.com', full_name='Patient One',
                       password_hash=generate_password_hash('patpass'), role='patient')
        db.session.add_all([clinician, patient])
        db.session.commit()
        token = jwt.encode({'user_id': clinician.user_id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
                           app.config['SECRET_KEY'], algorithm="HS256")

    client.set_cookie('jwt_token', token)
    response = client.post('/api/appointments', json={
        'email': 'pat1@example.com',
        'title': 'Checkup',
        'date': datetime.now().isoformat()
    })

    assert response.status_code == 200


def test_create_medical_record(client):
    with app.app_context():
        user = User(username='recuser', email='rec@example.com', full_name='Record User',
                    password_hash=generate_password_hash('pass'), role='patient')
        db.session.add(user)
        db.session.commit()
        token = jwt.encode({'user_id': user.user_id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
                           app.config['SECRET_KEY'], algorithm="HS256")

    client.set_cookie('jwt_token', token)
    response = client.post('/api/medical_records', json={
        'record_type': 'Prescription',
        'description': 'Sample description',
        'document_link': 'http://example.com/doc'
    })

    assert response.status_code == 201

        


