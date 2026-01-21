
import requests
import json
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def log(msg, success=True):
    icon = "✅" if success else "❌"
    print(f"{icon} {msg}")

def check_health():
    try:
        res = requests.get(f"{BASE_URL}/health")
        if res.status_code == 200:
            log("Backend is healthy")
            return True
        else:
            log(f"Backend unhealthy: {res.status_code}", False)
            return False
    except Exception as e:
        log(f"Backend connection failed: {e}", False)
        return False

def verify_crud():
    print("\n--- Testing CRUD Operations ---")
    
    # 1. CREATE
    new_task = {
        "title": "Verifying System Integrity",
        "estimated_minutes": 45,
        "priority": 10,
        "deadline": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "work_type": "Deep Work"
    }
    
    res = requests.post(f"{BASE_URL}/tasks", json=new_task)
    if res.status_code == 201:
        task = res.json()
        task_id = task['id']
        log(f"Created Task ID {task_id}: {task['title']}")
        
        # Verify fields
        if task['work_type'] == "Deep Work" and task['estimated_minutes'] == 45:
            log("Task fields saved correctly")
        else:
            log(f"Task fields mismatch: {task}", False)
            
    else:
        log(f"Failed to create task: {res.text}", False)
        return False

    # 2. READ
    res = requests.get(f"{BASE_URL}/tasks/{task_id}")
    if res.status_code == 200:
        log("Fetched created task successfully")
    else:
        log("Failed to fetch task", False)
        return False

    # 3. UPDATE
    update_payload = {
        "title": "Verified System Integrity",
        "is_completed": True
    }
    res = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_payload)
    if res.status_code == 200:
        updated = res.json()
        if updated['title'] == "Verified System Integrity" and updated['is_completed'] is True:
            log("Updated task successfully")
        else:
            log("Update mismatch", False)
    else:
        log("Update failed", False)

    # 4. FILTER (Work Type)
    res = requests.get(f"{BASE_URL}/tasks?include_completed=true&work_type=Deep Work")
    tasks = res.json()
    found = any(t['id'] == task_id for t in tasks)
    if found:
        log("Filtered search found the task")
    else:
        log("Filtered search failed to find task", False)

    # 5. OPTIMIZE
    # We call optimize from DB
    res = requests.post(f"{BASE_URL}/optimize/from-db")
    if res.status_code == 200:
        log("Optimization engine ran successfully")
        schedule = res.json()
        # Just check structure
        if "summary" in schedule and "schedule" in schedule:
            log(f"Optimizer returned schedule with {len(schedule['schedule'])} items")
    else:
        log(f"Optimizer failed: {res.text}", False)

    # 6. DELETE
    res = requests.delete(f"{BASE_URL}/tasks/{task_id}")
    if res.status_code == 204:
        log("Deleted task successfully")
    else:
        log("Delete failed", False)
        
    # Verify deletion
    res = requests.get(f"{BASE_URL}/tasks/{task_id}")
    if res.status_code == 404:
        log("Verified task is gone")
    else:
        log("Task still exists after delete!", False)

    return True

if __name__ == "__main__":
    print("Waiting for services to spin up...")
    attempts = 0
    while attempts < 10:
        if check_health():
            break
        time.sleep(2)
        attempts += 1
    
    if attempts >= 10:
        print("Could not connect to backend.")
        exit(1)
        
    verify_crud()
