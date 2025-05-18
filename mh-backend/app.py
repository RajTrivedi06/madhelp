from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime
import uuid
from werkzeug.utils import secure_filename
import logging

import bcrypt
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy import func

from models import SessionLocal, User, UserFiles, Base, engine  # local models.py
from CVparser import ResumePDFParser  # CV parser

# ───────────────────────────────────────────────────────────────────────────────
#  Config & initialisation
# ───────────────────────────────────────────────────────────────────────────────

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS: set[str] = {"pdf"}

app = Flask(__name__)
app.config.update(
    UPLOAD_FOLDER=str(UPLOAD_FOLDER),
    JWT_SECRET_KEY=os.environ.get("JWT_SECRET_KEY", "dev-only-key-CHANGE-ME"),
)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    },
)

jwt = JWTManager(app)

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Log database file path
logger.info(f"Database URI: {engine.url}")

# Create database tables
try:
    Base.metadata.create_all(engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {str(e)}")

# Global error handler for 500 errors
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled exception: {str(e)}")
    response = jsonify(error="Internal server error")
    response.status_code = 500
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return response

# ───────────────────────────────────────────────────────────────────────────────
#  Helper functions
# ───────────────────────────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def dars_to_text(pdf_path: Path) -> str:
    """Extract embedded text from a DARS PDF using pdfplumber (no OCR, returns text directly)."""
    import pdfplumber
    out: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                out.append(text)
    return "\n".join(out).strip()

# ───────────────────────────────────────────────────────────────────────────────
#  Routes
# ───────────────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return "Flask server is running!", 200

# ----------  SIGN-UP  ----------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    session = SessionLocal()
    try:
        # Log database state
        user_count = session.query(User).count()
        users = session.query(User).all()
        logger.debug(f"Before signup: {user_count} users, existing users: {[u.username for u in users]}")

        # 1. Basic form fields
        username = request.form.get("username", "").strip().lower()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm_password", "")
        logger.debug(f"Signup attempt: username='{username}', email='{email}'")

        if not all([username, email, password, confirm]):
            logger.error("Missing required fields")
            return jsonify(error="Please fill in all required fields."), 400
        if password != confirm:
            logger.error("Passwords do not match")
            return jsonify(error="Passwords do not match."), 400

        # 2. Files
        cv = request.files.get("cv")
        dars_files = [request.files.get(f"dars{i}") for i in range(1, 5)]
        if not (cv and allowed_file(cv.filename)):
            logger.error("Invalid or missing CV")
            return jsonify(error="Please upload a valid CV (PDF)."), 400
        if not (dars_files[0] and allowed_file(dars_files[0].filename)):
            logger.error("Invalid or missing DARS1")
            return jsonify(error="Please upload at least one DARS PDF (DARS1)."), 400
        for i, dars in enumerate(dars_files[1:], 2):
            if dars and not allowed_file(dars.filename):
                logger.error(f"Invalid DARS{i}")
                return jsonify(error=f"Invalid file format for DARS{i} (must be PDF)."), 400

        num_dars = sum(1 for dars in dars_files if dars)
        logger.info(f"Processing signup for user '{username}' with {num_dars} DARS PDF(s)")

        # 3. Save files
        cv_filename = secure_filename(cv.filename)
        cv_unique_name = f"{uuid.uuid4().hex}_{cv_filename}"
        cv_path = UPLOAD_FOLDER / cv_unique_name
        cv.save(cv_path)

        dars_paths = []
        for i, dars in enumerate(dars_files, 1):
            if dars:
                dars_filename = secure_filename(dars.filename)
                dars_unique_name = f"{uuid.uuid4().hex}_{dars_filename}"
                dars_path = UPLOAD_FOLDER / dars_unique_name
                dars.save(dars_path)
                dars_paths.append(dars_path)
            else:
                dars_paths.append(None)

        # 4. Check for existing user (rely on DB's NOCASE for email)
        existing_user = session.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        if existing_user:
            logger.error(
                f"Duplicate detected: username='{existing_user.username}' or email='{existing_user.email}' "
                f"conflicts with new username='{username}' or email='{email}'"
            )
            return jsonify(
                error=f"Username '{username}' or email '{email}' already exists."
            ), 409

        # 5. Create user
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        new_user = User(
            username=username,
            email=email,
            password_hash=pw_hash,
            created_at=datetime.utcnow(),
        )
        session.add(new_user)
        session.flush()  # Generate new_user.id
        logger.debug(f"Created user with id={new_user.id}")

        # 6. Convert PDFs to text
        try:
            cv_parser = ResumePDFParser(cv_path)
            cv_text = cv_parser.text
            logger.debug(f"Extracted CV text: {len(cv_text)} characters")
        except Exception as e:
            logger.error(f"Failed to process CV: {str(e)}")
            session.rollback()
            return jsonify(error=f"Failed to process CV: {str(e)}"), 400

        dars_texts = [None] * 4
        for i, dars_path in enumerate(dars_paths):
            if dars_path:
                try:
                    dars_texts[i] = dars_to_text(dars_path)
                    logger.debug(f"Extracted DARS{i+1} text: {len(dars_texts[i])} characters")
                except Exception as e:
                    logger.error(f"Failed to process DARS{i+1}: {str(e)}")
                    session.rollback()
                    return jsonify(error=f"Failed to process DARS{i+1}: {str(e)}"), 400

        # 7. Store text in UserFiles
        user_files = UserFiles(
            id=new_user.id,
            cv_text=cv_text,
            dars1_text=dars_texts[0],
            dars2_text=dars_texts[1],
            dars3_text=dars_texts[2],
            dars4_text=dars_texts[3],
        )
        session.add(user_files)
        logger.debug(f"Added UserFiles for user_id={new_user.id}")

        # 8. Commit transaction
        session.commit()
        logger.info(f"Successfully signed up user '{username}'")

        # 9. Log final database state
        user_count = session.query(User).count()
        logger.debug(f"After signup: {user_count} users")

        # 10. Generate token and respond
        token = create_access_token(identity=new_user.id)
        logger.debug(f"Generated JWT for user_id={new_user.id}")
        return jsonify(username=username, token=token, message="Signup successful!"), 201

    except IntegrityError as e:
        session.rollback()
        logger.error(f"IntegrityError during signup: {str(e)}")
        user_count = session.query(User).count()
        logger.debug(f"After rollback: {user_count} users")
        return jsonify(
            error="Username or email already exists. Please choose a different one."
        ), 409
    except OperationalError as e:
        session.rollback()
        logger.error(f"Database operational error during signup: {str(e)}")
        return jsonify(error=f"Database error: {str(e)}"), 500
    except Exception as e:
        session.rollback()
        logger.error(f"Unexpected error during signup: {str(e)}")
        return jsonify(error=f"Server error: {str(e)}"), 500
    finally:
        session.close()

# ----------  LOGIN  -----------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    session = SessionLocal()
    try:
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        logger.debug(f"Login attempt: email='{email}'")

        if not email or not password:
            logger.error("Missing email or password")
            return jsonify(error="Please provide both email and password."), 400

        user = session.query(User).filter(User.email == email).first()
        if not user:
            logger.error(f"No user found with email='{email}'")
            return jsonify(error="Invalid email or password."), 401
        if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            logger.error(f"Password mismatch for email='{email}'")
            return jsonify(error="Invalid email or password."), 401

        token = create_access_token(identity=user.id)
        logger.info(f"Successful login for user '{user.username}'")
        return (
            jsonify(username=user.username, token=token, message="Login successful!"),
            200,
        )
    finally:
        session.close()

# ----------  PROTECTED EXAMPLE  ----------------------------------------------
@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    return jsonify(message="This is a protected route!"), 200

# ----------  Serve uploaded originals (dev only)  -----------------------------
@app.route("/uploads/<path:filename>")
def get_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ───────────────────────────────────────────────────────────────────────────────
#  Run dev server
# ───────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)