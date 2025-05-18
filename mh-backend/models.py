from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from sqlalchemy import UniqueConstraint

SQLALCHEMY_DATABASE_URI = "sqlite:///data.db"
engine = create_engine(SQLALCHEMY_DATABASE_URI, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# models.py  (only the User model shown)

class User(Base):
    __tablename__ = "user"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    username      = Column(String(150), nullable=False, unique=True)
    # ↓ delete sqlite_collation and rely on lowercase-only inserts
    email         = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(200), nullable=False)
    created_at    = Column(DateTime, nullable=False, server_default=func.now())

class UserFiles(Base):
    __tablename__ = "user_files"
    id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), primary_key=True)
    cv_text = Column(Text, nullable=False)
    dars1_text = Column(Text, nullable=False)
    dars2_text = Column(Text)
    dars3_text = Column(Text)
    dars4_text = Column(Text)