import psycopg2
from flask import Flask, jsonify

app = Flask(__name__)

DB_CONFIG = {
    "dbname": "guptaCare",
    "user": "joshiMembers",
    "password": "joshiBoss",
    "host": "localhost",
    "port": 5432,
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

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

if __name__ == "__main__":
    app.run(debug=True)