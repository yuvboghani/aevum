"""
Database Configuration for Aevum Scheduler
Handles PostgreSQL connection and session management
"""
import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, init_db

# --- DATABASE URL ---
# Format: postgresql://user:password@host:port/database
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://aevum:aevum_password@localhost:5432/aevum_db"
)

# --- ENGINE & SESSION FACTORY ---
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=os.getenv("SQL_DEBUG", "false").lower() == "true"
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# --- DEPENDENCY FOR FASTAPI ---
def get_db():
    """
    Dependency that provides a database session.
    Use with FastAPI's Depends()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database sessions.
    Use in non-FastAPI contexts (scripts, tests, etc.)
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")


def drop_tables():
    """Drop all database tables (USE WITH CAUTION)"""
    Base.metadata.drop_all(bind=engine)
    print("✓ Database tables dropped")


if __name__ == "__main__":
    # Run this file directly to initialize the database
    print(f"Connecting to: {DATABASE_URL}")
    create_tables()
