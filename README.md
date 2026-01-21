
# Aevum Scheduler

Aevum is a smart task scheduler that integrates with Google Calendar to optimize your day using "Deep Work" and "Shallow Work" heuristics.

## 🚀 Quick Start (Docker)

The easiest way to run Aevum (Database + Backend + Frontend) is with Docker Compose.

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Database**: PostgreSQL (port 5432)

## 🛠️ Local Development

### 1. Database & Backend
Ensure you have a PostgreSQL database running or use the Docker container only for the DB:
```bash
docker-compose up -d db
```

Run the backend:
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload
```

### 2. Frontend
```bash
cd psu-scheduler-client
npm install
npm run dev
```

## 🔍 Inspecting the Database

To visualize the tasks securely stored in PostgreSQL, run the inspector script:

```bash
python inspect_db.py
```

This will print a table of all persisted tasks, their priorities, and deadlines.
