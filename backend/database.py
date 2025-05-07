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

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])  # Allow CORS

# Database Config
DB_CONFIG = {
    "dbname": "gupta-care",
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


if __name__ == "__main__":
    app.run(debug=True)
