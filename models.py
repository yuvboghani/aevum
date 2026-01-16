"""
Database Models for Aevum Scheduler
Using SQLAlchemy 2.0 style with async support
"""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Enum, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from typing import Optional


# --- ENUMS ---
class WorkType(enum.Enum):
    DEEP_WORK = "Deep Work"
    SHALLOW_WORK = "Shallow Work"


# --- BASE CLASS ---
class Base(DeclarativeBase):
    pass


# --- TASK MODEL ---
class Task(Base):
    __tablename__ = "tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=5)  # 1-10
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    work_type: Mapped[WorkType] = mapped_column(
        Enum(WorkType), 
        nullable=False, 
        default=WorkType.DEEP_WORK
    )
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        onupdate=datetime.utcnow, 
        nullable=True
    )
    
    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', priority={self.priority}, work_type={self.work_type.value})>"
    
    def to_dict(self) -> dict:
        """Convert model to dictionary for API responses"""
        return {
            "id": self.id,
            "title": self.title,
            "estimated_minutes": self.estimated_minutes,
            "priority": self.priority,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "work_type": self.work_type.value,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# --- DATABASE ENGINE & SESSION ---
def get_engine(database_url: str):
    """Create SQLAlchemy engine with connection pooling"""
    return create_engine(
        database_url,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,
        max_overflow=10,
        echo=False  # Set to True for SQL debugging
    )


def get_session_factory(engine):
    """Create session factory for database operations"""
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db(engine):
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
