from __future__ import annotations

import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timedelta

import bcrypt
import pdfplumber
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy import func
from werkzeug.utils import secure_filename

from models import SessionLocal, User, UserFiles, Base, engine
from CVparser import ResumePDFParser
from cache import user_cache
from ra_matcher import RAMatcher

# ───────────────────────────────────────────────────────────────────────────────
#  Init
# ───────────────────────────────────────────────────────────────────────────────
UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf"}

app = Flask(__name__)
app.config.update(
    UPLOAD_FOLDER=str(UPLOAD_FOLDER),
    JWT_SECRET_KEY=os.environ.get("JWT_SECRET_KEY", "dev-only-key"),
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1),
    JWT_REFRESH_TOKEN_EXPIRES=timedelta(days=30),
)

# Updated CORS: allow Authorization header and credentials
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173"]}},
    supports_credentials=True,
    allow_headers=["Authorization", "Content-Type"],
)

jwt = JWTManager(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("mh-backend")

Base.metadata.create_all(engine)

# Instantiate RA matcher once
matcher = RAMatcher(db_path="data.db", api_key="")

# ───────────────────────────────────────────────────────────────────────────────
#  Helpers
# ───────────────────────────────────────────────────────────────────────────────
def allowed_file(name: str) -> bool:
    return "." in name and name.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def dars_to_text(pdf_path: Path) -> str:
    out: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                out.append(txt)
    return "\n".join(out).strip()


# ───────────────────────────────────────────────────────────────────────────────
#  Routes
# ───────────────────────────────────────────────────────────────────────────────
@ app.route("/")
def home():
    return "Flask backend running!", 200


# ----------  SIGN-UP  ----------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    session = SessionLocal()
    try:
        username = request.form.get("username", "").strip().lower()
        email = request.form.get("email", "").strip().lower()
        pw = request.form.get("password", "")
        pw2 = request.form.get("confirm_password", "")

        if not all([username, email, pw, pw2]):
            return jsonify(error="All fields required"), 400
        if pw != pw2:
            return jsonify(error="Passwords do not match"), 400

        cv_file = request.files.get("cv")
        dars_files = request.files.getlist("dars")

        if not (cv_file and allowed_file(cv_file.filename)):
            return jsonify(error="CV (PDF) required"), 400
        if not dars_files or not any(allowed_file(f.filename) for f in dars_files):
            return jsonify(error="At least one DARS PDF required"), 400
        if len(dars_files) > 4:
            return jsonify(error="Max 4 DARS files"), 400

        if session.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first():
            return jsonify(error="Username or email exists"), 409

        cv_path = UPLOAD_FOLDER / f"{uuid.uuid4().hex}_{secure_filename(cv_file.filename)}"
        cv_file.save(cv_path)

        dars_paths: list[Path | None] = []
        for f in dars_files:
            p = UPLOAD_FOLDER / f"{uuid.uuid4().hex}_{secure_filename(f.filename)}"
            f.save(p)
            dars_paths.append(p)
        dars_paths.extend([None] * (4 - len(dars_paths)))

        user = User(
            username=username,
            email=email,
            password_hash=bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode(),
            created_at=datetime.utcnow(),
        )
        session.add(user)
        session.flush()

        cv_text = ResumePDFParser(cv_path).text
        dars_text = [dars_to_text(p) if p else None for p in dars_paths]

        session.add(
            UserFiles(
                id=user.id,
                cv_text=cv_text,
                dars1_text=dars_text[0],
                dars2_text=dars_text[1],
                dars3_text=dars_text[2],
                dars4_text=dars_text[3],
            )
        )
        session.commit()

        user_cache.set(user.id, {"cv": cv_text, "dars": dars_text})

        return jsonify(
            username=username,
            access_token=create_access_token(identity=str(user.id)),
            refresh_token=create_refresh_token(identity=str(user.id)),
            message="Signup successful!"
        ), 201

    except Exception as e:
        session.rollback()
        logger.exception("Signup failed")
        return jsonify(error=str(e)), 500
    finally:
        session.close()


# ----------  LOGIN  -----------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    session = SessionLocal()
    try:
        email = request.form.get("email", "").strip().lower()
        pw = request.form.get("password", "")

        user = session.query(User).filter(User.email == email).first()
        if not user or not bcrypt.checkpw(pw.encode(), user.password_hash.encode()):
            return jsonify(error="Invalid credentials"), 401

        if user_cache.get(user.id) is None:
            files = SessionLocal().get(UserFiles, user.id)
            if files:
                user_cache.set(
                    user.id,
                    {"cv": files.cv_text, "dars": [
                        files.dars1_text,
                        files.dars2_text,
                        files.dars3_text,
                        files.dars4_text,
                    ]},
                )

        return jsonify(
            username=user.username,
            access_token=create_access_token(identity=str(user.id)),
            refresh_token=create_refresh_token(identity=str(user.id)),
            message="Login successful!"
        )
    finally:
        session.close()


# ----------  FACULTY LIST  ----------------------------------------------------
@app.route("/api/faculty", methods=["GET"])
@jwt_required()
def faculty():
    rows = SessionLocal().execute(
        """
        SELECT Name, Email, Faculty,
               "Summary of Research",
               "Fields of Research",
               "Link to Page"
        FROM faculty
        """
    ).fetchall()
    return jsonify([dict(r._mapping) for r in rows]), 200


# ----------  USER DOCS (CV + DARS)  ------------------------------------------
@app.route("/api/user/documents", methods=["GET"])
@jwt_required()
def get_docs():
    uid = get_jwt_identity()
    docs = user_cache.get(uid)
    if docs is None:
        files = SessionLocal().get(UserFiles, uid)
        if not files:
            return jsonify(error="No documents"), 404
        docs = {"cv": files.cv_text, "dars": [
            files.dars1_text,
            files.dars2_text,
            files.dars3_text,
            files.dars4_text,
        ]}
        user_cache.set(uid, docs)
    return jsonify(docs), 200


# ----------  RA MATCH  --------------------------------------------------------
@app.route("/api/ra/match", methods=["POST"])
@jwt_required()
def ra_match():
    uid = get_jwt_identity()
    docs = user_cache.get(uid)
    if docs is None:
        return jsonify(error="No CV in cache"), 404
    top = matcher.match(docs["cv"], top_n=5)
    return jsonify(top), 200


# ----------  STATIC UPLOAD SERVE (DEV)  --------------------------------------
@app.route("/uploads/<path:filename>")
def get_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ----------  USER PROFILE  ----------------------------------------------------
@app.route("/api/user/profile", methods=["GET"])
@jwt_required()
def get_profile():
    uid = get_jwt_identity()
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.id == uid).first()
        if not user:
            return jsonify(error="User not found"), 404
            
        return jsonify({
            "profile": {
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat()
            }
        })
    finally:
        session.close()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
