import os
import psycopg2
from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from werkzeug.utils import secure_filename
import subprocess

# imports for file uploading
from flask_cors import CORS
from dotenv import load_dotenv
import boto3

# Load .env variables that contain access and secret keys
load_dotenv()
from sqlalchemy import or_

from apscheduler.schedulers.background import BackgroundScheduler
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])  # Allow CORS

# Database Config
DB_CONFIG = {
    "dbname": "guptaCare",
    "user": "joshiMembers",
    "password": "joshiBoss",
    "host": "localhost",
    "port": 5432,
}

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret')
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy()
db.init_app(app)

# Boto3 S3 client setup for Storj
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv("STORJ_ENDPOINT"),
    aws_access_key_id=os.getenv("STORJ_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("STORJ_SECRET_KEY")
)
STORJ_BUCKET = os.getenv("STORJ_BUCKET_NAME")

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

    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_appointments')
    clinician = db.relationship('User', foreign_keys=[clinician_id], backref='clinician_appointments')

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('scheduled', 'cancelled', 'completed')",
            name='appointments_status_check'
        ),
    )

class Prescription(db.Model):
    __tablename__ = 'prescriptions'

    prescription_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'))
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'))
    medication_name = db.Column(db.Text, nullable=False)
    dosage = db.Column(db.Text)
    frequency = db.Column(db.Text)
    duration = db.Column(db.Text)
    issued_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    patient = db.relationship('User', foreign_keys=[patient_id])
    doctor  = db.relationship('User', foreign_keys=[doctor_id])

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

@app.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({'message': 'Logout successful'})
    response.set_cookie('jwt_token', '', expires=0, httponly=True)
    return response


@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')  # should be 'patient' or 'clinician'

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'Email already in use'}), 409

    if role not in ['patient', 'clinician']:
        return jsonify({'message': 'Invalid role'}), 400

    hashed_password = generate_password_hash(password)

    new_user = User(
        username=email.split('@')[0],  # default username
        email=email,
        password_hash=hashed_password,
        full_name="New User",  # or you can allow frontend to send full name
        role=role
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Signup successful'}), 201


@app.route('/api/me', methods=['GET'])
@token_required
def me(current_user):
    return jsonify({
        'user_id': current_user.user_id,
        'username': current_user.username,
        'full_name': current_user.full_name,
        'email': current_user.email,
        'role': current_user.role,
        'created_at': current_user.created_at,
    })

@app.route('/api/patient/<int:patient_id>/prescriptions', methods=['GET'])
@token_required
def get_patient_prescriptions(current_user, patient_id):
    if current_user.role != 'clinician':
        return jsonify({'message': 'Access denied'}), 403

    pres = Prescription.query.filter_by(patient_id=patient_id).order_by(Prescription.issued_at.desc()).all()
    return jsonify([{
        'prescription_id': p.prescription_id,
        'medication_name': p.medication_name,
        'dosage'         : p.dosage,
        'frequency'      : p.frequency,
        'duration'       : p.duration,
        'issued_at'      : p.issued_at
    } for p in pres]), 200

@app.route('/api/patient/<int:patient_id>/prescriptions', methods=['POST'])
@token_required
def add_prescription(current_user, patient_id):
    if current_user.role != 'clinician':
        return jsonify({'message': 'Access denied'}), 403

    data = request.get_json()
    new_p = Prescription(
        patient_id      = patient_id,
        doctor_id       = current_user.user_id,
        medication_name = data['medication_name'],
        dosage          = data.get('dosage'),
        frequency       = data.get('frequency'),
        duration        = data.get('duration')
    )
    db.session.add(new_p)
    db.session.commit()
    return jsonify({'message': 'Prescription added'}), 201
# FILE STORAGE STUFF BELOW

# create medical records table
class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'

    record_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=True)
    record_type = db.Column(db.String(50))
    description = db.Column(db.Text)
    document_link = db.Column(db.Text)
    uploaded_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

    # relationship to User
    patient = db.relationship('User', backref=db.backref('medical_records', lazy=True, cascade="all, delete"))

# get all medical records for the current user
@app.route('/api/medical_records', methods=['GET'])
@token_required
def get_medical_records(current_user):
    records = MedicalRecord.query.filter_by(patient_id=current_user.user_id).all()
    result = []
    for r in records:
        result.append({
            'record_id': r.record_id,
            'patient_id': r.patient_id,
            'record_type': r.record_type,
            'description': r.description,
            'document_link': r.document_link,
            'uploaded_at': r.uploaded_at,
        })
    return jsonify(result)

# post a new medical record for the current user
@app.route('/api/medical_records', methods=['POST'])
@token_required
def create_medical_record(current_user):
    data = request.get_json()
    new_record = MedicalRecord(
        patient_id=current_user.user_id,
        record_type=data.get('record_type'),
        description=data.get('description'),
        document_link=data.get('document_link')
    )
    db.session.add(new_record)
    db.session.commit()
    return jsonify({'message': 'Medical record created', 'record_id': new_record.record_id}), 201


# File Upload endpoint with permanent link generation and DB storage
@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    if 'file' not in request.files or 'record_type' not in request.form:
        return jsonify({'message': 'File and record type are required'}), 400

    file = request.files['file']
    record_type = request.form['record_type']

    if file.filename == '' or not record_type:
        return jsonify({'message': 'Missing file or record type'}), 400

    filename = secure_filename(file.filename)
    try:
        # Upload file to Storj bucket
        s3_client.upload_fileobj(file, STORJ_BUCKET, filename)

        # Generate a 7-day presigned URL
        permanent_link = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': STORJ_BUCKET, 'Key': filename},
            ExpiresIn=60 * 60 * 24 * 7
        )

        # Create medical record entry
        new_record = MedicalRecord(
            patient_id=current_user.user_id,
            record_type=record_type,
            description=f"Uploaded file: {filename}",
            document_link=permanent_link
        )
        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            'message': 'Upload successful and medical record created',
            'filename': filename,
            'record_id': new_record.record_id
        }), 200

    except Exception as e:
        return jsonify({'message': f'Upload failed: {str(e)}'}), 500


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
            if (appt.status != "canceled"):
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


def send_email_reminder(to_email, name, appt_datetime):
    body = f"""
    Hello {name},

    This is a reminder for your upcoming appointment on {appt_datetime.strftime('%A, %B %d at %I:%M %p')}.
    
    You can cancel or reschedule your appointment at this number:
    +1 (999)-999-999

    Thank you,
    Gupta Care Team
    """
    msg = MIMEText(body)
    msg['Subject'] = "📅 Upcoming Appointment Reminder"
    msg['From'] = "aaryan.m003@gmail.com"
    msg['To'] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("aaryan.m003@gmail.com", "amaa yghi fpzh jcys")  # use app password if using Gmail
            server.send_message(msg)
            print(f"Reminder sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def check_appointments_and_send_emails():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT a.appointment_datetime, u.full_name, u.email
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        WHERE a.status = 'scheduled'
        AND DATE(a.appointment_datetime) = CURRENT_DATE + INTERVAL '1 days'
    """)
    rows = cur.fetchall()
    print(f"[DEBUG] Found {len(rows)} upcoming appointment(s) for email reminders.")
    for r in rows:
        print(f"[DEBUG] Sending to: {r[2]} at {r[0]}")

    cur.close()
    conn.close()

    for appt_datetime, full_name, email in rows:
        # send_email_reminder(email, full_name, appt_datetime)
        pass

# Schedule the job
scheduler = BackgroundScheduler()
scheduler.add_job(check_appointments_and_send_emails, 'cron', hour=8)  # Daily at 8AM
scheduler.start()
check_appointments_and_send_emails()




if __name__ == "__main__":
    app.run(debug=True)
