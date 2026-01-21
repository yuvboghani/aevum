
import datetime
from database import SessionLocal
from models import Task, WorkType

def seed_database():
    session = SessionLocal()
    
    # Check if DB is already populated
    if session.query(Task).count() > 0:
        print("Database already has data. Skipping seed.")
        session.close()
        return

    print("🌱 Seeding database with sample tasks...")
    
    now = datetime.datetime.utcnow()
    
    tasks = [
        Task(
            title="Apply to Google DeepMind",
            estimated_minutes=45,
            priority=9,
            deadline=now + datetime.timedelta(days=1, hours=16), # Tomorrow afternoon
            work_type=WorkType.SHALLOW_WORK,
            is_completed=False
        ),
        Task(
            title="Lego4All: Build Robot Arm prototype",
            estimated_minutes=120,
            priority=10,
            deadline=now + datetime.timedelta(days=2, hours=9), # Morning deep work
            work_type=WorkType.DEEP_WORK,
            is_completed=False
        ),
        Task(
            title="Email Professor regarding thesis",
            estimated_minutes=15,
            priority=6,
            deadline=now + datetime.timedelta(days=1, hours=10),
            work_type=WorkType.SHALLOW_WORK,
            is_completed=False
        ),
        Task(
            title="Study for Algorithms Exam",
            estimated_minutes=180,
            priority=8,
            deadline=now + datetime.timedelta(hours=5),
            work_type=WorkType.DEEP_WORK,
            is_completed=False
        )
    ]
    
    for t in tasks:
        session.add(t)
    
    session.commit()
    print(f"✓ Added {len(tasks)} tasks to the database.")
    session.close()

if __name__ == "__main__":
    seed_database()
