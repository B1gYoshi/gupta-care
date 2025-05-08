import psycopg2
from flask import Flask, render_template, request, redirect, url_for, jsonify, make_response, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from functools import wraps
from sqlalchemy import or_

app = Flask(__name__)

DB_CONFIG = {
    "dbname": "guptaCare",
    "user": "joshiMembers",
    "password": "joshiBoss",
    "host": "localhost",
    "port": 5432,
}

# TODO: change this to environment variable
app.config['SECRET_KEY'] = 'your_secret_key'

app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy()
db.init_app(app)

class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

class Appointments(db.Model):
    __tablename__ = 'appointments'

    appointment_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE', onupdate='NO ACTION'))
    clinician_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE', onupdate='NO ACTION'))
    appointment_datetime = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.Text)
    reason = db.Column(db.Text)
    status = db.Column(
        db.String(20),
        nullable=False,
        default='scheduled'
    )
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())

    # Optional: relationships to access user details from appointment
    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_appointments')
    clinician = db.relationship('User', foreign_keys=[clinician_id], backref='clinician_appointments')

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('scheduled', 'cancelled', 'completed')",
            name='appointments_status_check'
        ),
    )


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('jwt_token')

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(user_id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

@app.route("/", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT user_id, full_name, email FROM users;")
    users = cur.fetchall()
    
    cur.close()
    conn.close()

    return jsonify([{"id": u[0], "name": u[1], "email": u[2]} for u in users])

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():

    data = request.get_json()
    email = data['email']
    password = data['password']
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'message': 'Invalid email, user does not exist'}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Invalid password'}), 401

    token = jwt.encode({'user_id': user.user_id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
                        app.config['SECRET_KEY'], algorithm="HS256")

    response = jsonify({'message': 'Login successful', 'role': user.role})
    response.set_cookie('jwt_token', token, httponly=True) 

    return response

    # return jsonify({'message': 'Login successful'})

@app.route('/api/me', methods=['GET'])
@token_required
def me(current_user):
    user_info = {
        'user_id': current_user.user_id,
        'username': current_user.username,
        'full_name': current_user.full_name,
        'email': current_user.email,
        'role': current_user.role,
        'created_at': current_user.created_at,
    }

    return jsonify(user_info)

@app.route('/api/patients', methods=['GET'])
@token_required
def search_patients(current_user):
    # only clinicians can search
    if current_user.role != 'clinician':
        return jsonify({'message': 'Access denied'}), 403

    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    matches = User.query.filter_by(role='patient') \
        .filter(or_(
            User.full_name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%")
        )).all()

    results = [{
        'user_id': p.user_id,
        'full_name': p.full_name,
        'email': p.email
    } for p in matches]

    return jsonify(results)

@app.route('/api/prescriptions', methods=['GET'])
@token_required
def get_prescriptions(current_user):
    if current_user.role != 'patient':
        return jsonify({'message': 'Access denied'}), 403

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT medication_name, dosage, frequency, duration, issued_at
        FROM prescriptions
        WHERE patient_id = %s
        ORDER BY issued_at DESC
    """, (current_user.user_id,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()

    prescriptions = [
        {
            "medication_name": r[0],
            "dosage": r[1],
            "frequency": r[2],
            "duration": r[3],
            "issued_at": r[4]
        }
        for r in rows
    ]

    return jsonify(prescriptions)

@app.route('/api/appointments', methods=['GET'])
@token_required
def appointments(current_user):
    try:
        user_appointments = None
        if current_user.role == 'patient':
            user_appointments = Appointments.query.filter_by(patient_id=current_user.user_id).all()
        elif current_user.role == 'clinician':
            user_appointments = Appointments.query.filter_by(clinician_id=current_user.user_id).all()

        result = []
        for appt in user_appointments:
            result.append({
                'appointment_id': appt.appointment_id,
                'patient_id': appt.patient_id,
                'clinician_id': appt.clinician_id,
                'appointment_datetime': appt.appointment_datetime.isoformat(),
                'location': appt.location,
                'reason': appt.reason,
                'status': appt.status,
                'created_at': appt.created_at.isoformat() if appt.created_at else None
            })

        return jsonify(result), 200

    except Exception as e:
        print(f"Error fetching appointments: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route('/api/appointments', methods=['POST'])
@token_required
def createAppointment(current_user):
    if current_user.role != 'clinician':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    patient = User.query.filter_by(email=data['email']).first()

    if patient == None:
        return jsonify({"message": "Patient not found"}), 404

    try :
        appointment_start = datetime.fromisoformat(data['date'])
    except Exception as e:
        return jsonify({"message": "Error with the date"}), 414

    new_appointment = Appointments(
        patient_id=patient.user_id,
        clinician_id=current_user.user_id,
        appointment_datetime=appointment_start,
        reason=data['title'],
        status='scheduled'
    )

    db.session.add(new_appointment)
    db.session.commit()

    return jsonify({"message": "Appointment created successfully"}), 200





if __name__ == "__main__":
    app.run(debug=True)