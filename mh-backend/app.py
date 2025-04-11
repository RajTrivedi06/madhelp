import os
from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from werkzeug.utils import secure_filename
from models import SessionLocal, User  # Assuming you have a models.py with SQLAlchemy setup
import bcrypt

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['JWT_SECRET_KEY'] = 'a387bcdddb8eb1f7d4ddb9286fea4f4508eb81c4d5b39ddd'  # Replace with a secure, random key
jwt = JWTManager(app)

# Ensure the 'uploads' folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def home():
    return "Flask server is running!"

@app.route('/api/signup', methods=['POST'])
def signup():
    session = SessionLocal()

    # Get form fields
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')

    # Basic validation
    if not all([username, email, password, confirm_password]):
        return jsonify({"error": "Missing required fields."}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    # Check if username or email already exists
    existing_user = session.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing_user:
        return jsonify({"error": "Username or email already exists."}), 409

    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Handle file uploads
    cv_file = request.files.get('cv')
    dars_file = request.files.get('dars')

    if not cv_file or not allowed_file(cv_file.filename):
        return jsonify({"error": "Invalid or missing CV file (must be PDF)."}), 400
    cv_filename = secure_filename(cv_file.filename)
    cv_file.save(os.path.join(app.config['UPLOAD_FOLDER'], cv_filename))

    if not dars_file or not allowed_file(dars_file.filename):
        return jsonify({"error": "Invalid or missing DARS file (must be PDF)."}), 400
    dars_filename = secure_filename(dars_file.filename)
    dars_file.save(os.path.join(app.config['UPLOAD_FOLDER'], dars_filename))

    # Create new user
    new_user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        cv_path=cv_filename,
        dars_path=dars_filename
    )
    session.add(new_user)
    session.commit()
    session.close()

    return jsonify({"username": username, "message": "Signup successful!"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    session = SessionLocal()

    email = request.form.get('email')
    password = request.form.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password."}), 400

    user = session.query(User).filter(User.email == email).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        session.close()
        return jsonify({"error": "Invalid email or password."}), 401

    # Generate JWT token
    access_token = create_access_token(identity=user.id)
    session.close()
    return jsonify({
        "username": user.username,
        "message": "Login successful!",
        "token": access_token
    }), 200

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    return jsonify({"message": "This is a protected route!"}), 200

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)