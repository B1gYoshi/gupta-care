import psycopg2
from flask import Flask, render_template, request, redirect, url_for, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from functools import wraps

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

#@app.route("/users", methods=["GET"])
@app.route("/", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT user_id, full_name, email FROM users;")
    users = cur.fetchall()
    
    cur.close()
    conn.close()

    return jsonify([{"id": u[0], "name": u[1], "email": u[2]} for u in users])

@app.route('/login', methods=['POST'])
def login():

    email = request.form['email']
    password = request.form['password']
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'message': 'Invalid email, user does not exist'}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Invalid password'}), 401

    token = jwt.encode({'user_id': user.user_id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
                        app.config['SECRET_KEY'], algorithm="HS256")

    response = make_response(redirect(url_for('http://localhost:3000/patient' if user.role == "patient" else "http://localhost:3000/clinician")))
    response.set_cookie('jwt_token', token)

    return response

@app.route('/me', methods=['GET'])
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

if __name__ == "__main__":
    app.run(debug=True)