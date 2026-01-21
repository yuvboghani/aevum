
import os
import sys
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import Task, WorkType

def print_separator(char='-', length=100):
    print(char * length)

def inspect_database():
    print("\n🔍 AEVUM DATABASE INSPECTOR")
    print_separator('=')

    # Test Connection
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"✅ Connected to: {version}")
    except Exception as e:
        print("❌ Could not connect to the database.")
        print(f"Error: {e}")
        print("\nFix: Ensure Docker is running and the database container is up.")
        print("Run: docker-compose up -d")
        return

    session = SessionLocal()
    try:
        # Fetch Tasks
        tasks = session.query(Task).order_by(Task.deadline).all()
        
        print(f"\n📋 FOUND {len(tasks)} TASKS")
        print_separator()
        
        # Header
        print(f"{'ID':<5} | {'TITLE':<30} | {'MINS':<6} | {'PRIORITY':<8} | {'WORK TYPE':<15} | {'DEADLINE':<20}")
        print_separator()

        if not tasks:
            print("   (No tasks found in database)")
        
        for t in tasks:
            # Truncate title if too long
            title = (t.title[:27] + '..') if len(t.title) > 27 else t.title
            
            # Format deadline
            deadline_str = t.deadline.strftime("%Y-%m-%d %H:%M") if t.deadline else "None"
            
            # Work Type color/indicator (simulated)
            wt_str = t.work_type.value
            
            print(f"{t.id:<5} | {title:<30} | {t.estimated_minutes:<6} | {t.priority:<8} | {wt_str:<15} | {deadline_str:<20}")

        print_separator()
        print("\n💡 NOTE: This data is persistent in your PostgreSQL volume.")

    except Exception as e:
        print(f"Error querying data: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    inspect_database()
