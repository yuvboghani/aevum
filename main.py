"""
Aevum Scheduler - FastAPI Backend
Features:
- Google Calendar OAuth integration with Batch Querying
- Multi-Calendar Filtering
- PostgreSQL database with SQLAlchemy
- CRUD operations for tasks
- Heuristic scheduling engine
"""
import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Request, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import BatchHttpRequest
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from enum import Enum

# Local imports
from database import get_db, create_tables, engine
from models import Task as TaskModel, WorkType as ModelWorkType, Base
from heuristic_engine import HeuristicScheduler, Task as EngineTask, WorkType as EngineWorkType

# LLM Integration (Z.ai via OpenAI-compatible SDK)
from openai import OpenAI

# --- CONFIGURATION ---
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow HTTP for local dev

CLIENT_SECRETS_FILE = "client_secrets.json"
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/callback")

# --- APP SETUP ---
app = FastAPI(
    title="Aevum Scheduler API",
    description="Smart schedule optimization with Google Calendar integration",
    version="2.1.0",
    root_path="/aevum"
)

# CORS: Allow frontend to connect
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://yuvboghani.com",
    "https://www.yuvboghani.com",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SESSION_SECRET", "super_secret_dev_key")
)


# --- PYDANTIC SCHEMAS ---
class WorkTypeEnum(str, Enum):
    DEEP_WORK = "Deep Work"
    SHALLOW_WORK = "Shallow Work"


class BusyBlock(BaseModel):
    start_time: str
    end_time: str
    title: str = "Busy"
    calendar_id: Optional[str] = None


class CalendarInfo(BaseModel):
    id: str
    summary: str
    primary: bool
    backgroundColor: Optional[str] = None


class TaskCreate(BaseModel):
    """Schema for creating a new task"""
    title: str = Field(..., min_length=1, max_length=255)
    estimated_minutes: int = Field(default=60, ge=15, le=480)
    priority: int = Field(default=5, ge=1, le=10)
    deadline: datetime.datetime
    work_type: WorkTypeEnum = WorkTypeEnum.DEEP_WORK


class TaskUpdate(BaseModel):
    """Schema for updating a task"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    estimated_minutes: Optional[int] = Field(None, ge=15, le=480)
    priority: Optional[int] = Field(None, ge=1, le=10)
    deadline: Optional[datetime.datetime] = None
    work_type: Optional[WorkTypeEnum] = None
    is_completed: Optional[bool] = None


class TaskResponse(BaseModel):
    """Schema for task response"""
    id: int
    title: str
    estimated_minutes: int
    priority: int
    deadline: datetime.datetime
    work_type: str
    is_completed: bool
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class OptimizeRequest(BaseModel):
    """Schema for optimization request"""
    title: str
    estimated_minutes: int
    estimated_minutes: int
    priority: int
    deadline: datetime.datetime
    work_type: Optional[WorkTypeEnum] = WorkTypeEnum.DEEP_WORK


# --- STARTUP EVENT ---
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        if os.getenv("INIT_DB", "true").lower() == "true":
            Base.metadata.create_all(bind=engine)
            print("✓ Database tables initialized")
    except Exception as e:
        print(f"⚠ Database initialization warning: {e}")


# --- HELPER FUNCTIONS ---
def get_google_flow():
    """Initialize the OAuth flow from secrets file or environment variables"""
    redirect_uri = os.getenv("OAUTH_REDIRECT_URI", REDIRECT_URI)
    
    if os.path.exists(CLIENT_SECRETS_FILE):
        return Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
    
    # Fallback to Environment Variables (For Vercel/Production)
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if client_id and client_secret:
        client_config = {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }
        return Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        
    raise FileNotFoundError(f"Missing {CLIENT_SECRETS_FILE} and no GOOGLE_CLIENT_ID/SECRET env vars found.")


def convert_work_type(pydantic_type: WorkTypeEnum) -> ModelWorkType:
    """Convert Pydantic enum to SQLAlchemy enum"""
    if pydantic_type == WorkTypeEnum.DEEP_WORK:
        return ModelWorkType.DEEP_WORK
    return ModelWorkType.SHALLOW_WORK


def convert_to_engine_work_type(model_type: ModelWorkType) -> EngineWorkType:
    """Convert SQLAlchemy enum to Engine enum"""
    if model_type == ModelWorkType.DEEP_WORK:
        return EngineWorkType.DEEP_WORK
    return EngineWorkType.SHALLOW_WORK


def get_credentials(request: Request):
    """Helper to get credentials from session"""
    creds_data = request.session.get('credentials')
    if not creds_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return Credentials(**creds_data)


def merge_intervals(intervals):
    """
    Merge overlapping time intervals.
    intervals: List of tuples (start_datetime, end_datetime, data_dict)
    """
    if not intervals:
        return []

    # Sort by start time
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = []

    current_start, current_end, current_data = sorted_intervals[0]

    for next_start, next_end, next_data in sorted_intervals[1:]:
        if next_start < current_end:
            # Overlap exists, extend the current end if needed
            current_end = max(current_end, next_end)
            # We keep the title from the first event for simplicity, 
            # or could append them. For privacy/simplicity, "Busy" or first title.
        else:
            merged.append((current_start, current_end, current_data))
            current_start, current_end, current_data = next_start, next_end, next_data

    merged.append((current_start, current_end, current_data))
    return merged


# --- ROOT & AUTH ROUTES ---
@app.get("/")
def home():
    return {
        "status": "Online",
        "version": "2.1.0",
        "endpoints": {
            "auth": "/login",
            "calendars": "/calendars",
            "calendar_busy": "/busy",
            "tasks": "/tasks",
            "optimize": "/optimize"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.utcnow().isoformat()}


@app.get("/login")
def login(request: Request):
    """Step 1: Redirect user to Google OAuth"""
    flow = get_google_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    request.session['state'] = state
    return RedirectResponse(authorization_url)


@app.get("/callback")
def callback(request: Request, code: str, state: str):
    """Step 2: Handle OAuth callback"""
    if state != request.session.get('state'):
        raise HTTPException(status_code=400, detail="State mismatch")

    flow = get_google_flow()
    
    try:
        flow.fetch_token(code=code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {e}")

    credentials = flow.credentials
    request.session['credentials'] = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    # Redirect to frontend using HTML to bypass browser redirect caches
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    print(f"DEBUG: Login successful. Redirecting to: {frontend_url}")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
        <head>
            <title>Login Successful</title>
            <meta http-equiv="refresh" content="0;url={frontend_url}">
            <script>
                setTimeout(function() {{
                    window.location.href = "{frontend_url}";
                }}, 100);
            </script>
            <style>
                body {{ font-family: sans-serif; text-align: center; padding-top: 50px; background: #FFFBF7; color: #1a1a1a; }}
                .loader {{ border: 4px solid #f3f3f3; border-top: 4px solid #FF6B2C; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }}
                @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
            </style>
        </head>
        <body>
            <h1>Login Successful!</h1>
            <div class="loader"></div>
            <p>Redirecting you back to Aevum...</p>
            <p>If you are not redirected, <a href="{frontend_url}">click here</a>.</p>
        </body>
    </html>
    """
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html_content, status_code=200)


@app.get("/logout")
def logout(request: Request):
    """Clear session"""
    request.session.clear()
    return {"status": "logged out"}


# --- GOOGLE CALENDAR ROUTES ---

@app.get("/calendars", response_model=List[CalendarInfo])
def list_calendars(request: Request):
    """Fetch all calendars available to the user"""
    creds = get_credentials(request)
    service = build('calendar', 'v3', credentials=creds)

    try:
        calendar_list = service.calendarList().list().execute()
        calendars = []
        for cal in calendar_list.get('items', []):
            calendars.append(CalendarInfo(
                id=cal.get('id'),
                summary=cal.get('summary', 'Unknown'),
                primary=cal.get('primary', False),
                backgroundColor=cal.get('backgroundColor')
            ))
        return calendars
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google API Error: {e}")


@app.get("/busy", response_model=List[BusyBlock])
def get_busy_blocks(
    request: Request, 
    calendar_ids: List[str] = Query(default=None)
):
    """
    Fetch busy info from specific calendars using Batching.
    If no calendar_ids provided, defaults to 'primary'.
    Merges overlapping events into single busy blocks.
    """
    creds = get_credentials(request)
    service = build('calendar', 'v3', credentials=creds)

    # Default to primary if nothing selected
    if not calendar_ids:
        calendar_ids = ['primary']

    now = datetime.datetime.utcnow()
    end_date = now + datetime.timedelta(days=7)
    time_min = now.isoformat() + 'Z'
    time_max = end_date.isoformat() + 'Z'

    raw_events = []

    def callback(request_id, response, exception):
        if exception:
            print(f"Error fetching calendar {request_id}: {exception}")
        else:
            items = response.get('items', [])
            for item in items:
                # Only care about events with definite start/end times
                start = item.get('start', {}).get('dateTime')
                end = item.get('end', {}).get('dateTime')
                
                # Skip all-day events for 'busy' logic usually, 
                # unless we want to block the whole day. 
                # For now, let's include them but normalize dates.
                if not start: 
                    # All-day event (YYYY-MM-DD string)
                    start_date = item.get('start', {}).get('date')
                    end_date = item.get('end', {}).get('date')
                    if start_date and end_date:
                        # Convert to generic datetime for sorting (naive or utc)
                        # This simplified logic treats them as string ISOs for now
                        start = f"{start_date}T00:00:00Z"
                        end = f"{end_date}T23:59:59Z"

                if start and end:
                    raw_events.append({
                        "start": start,
                        "end": end,
                        "title": item.get('summary', 'Busy'),
                        "cal_id": request_id
                    })

    # Create Batch Request
    batch = service.new_batch_http_request(callback=callback)

    for cal_id in calendar_ids:
        batch.add(service.events().list(
            calendarId=cal_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ), request_id=cal_id)

    try:
        batch.execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch Execution Error: {e}")

    # Process and Merge Intervals
    # Convert string ISOs to datetime objects for comparison
    intervals = []
    for ev in raw_events:
        try:
            # Handle Z or timezone offsets. Python 3.11 fromisoformat handles most.
            # Removing Z replacement to let proper ISO parsing happen if possible,
            # but google returns ISO with offset usually.
            s_dt = datetime.datetime.fromisoformat(ev['start'].replace('Z', '+00:00'))
            e_dt = datetime.datetime.fromisoformat(ev['end'].replace('Z', '+00:00'))
            intervals.append((s_dt, e_dt, ev))
        except ValueError:
            continue
    
    merged = merge_intervals(intervals)

    # Convert back to API response format
    result = []
    for start, end, data in merged:
        result.append(BusyBlock(
            start_time=start.isoformat(),
            end_time=end.isoformat(),
            title=data['title'], # Use the title from the first event in the block
            calendar_id="merged"
        ))

    return result


# --- TASK CRUD ROUTES ---
@app.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    db_task = TaskModel(
        title=task.title,
        estimated_minutes=task.estimated_minutes,
        priority=task.priority,
        deadline=task.deadline,
        work_type=convert_work_type(task.work_type),
        is_completed=False
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    return TaskResponse(
        id=db_task.id,
        title=db_task.title,
        estimated_minutes=db_task.estimated_minutes,
        priority=db_task.priority,
        deadline=db_task.deadline,
        work_type=db_task.work_type.value,
        is_completed=db_task.is_completed,
        created_at=db_task.created_at,
        updated_at=db_task.updated_at
    )


@app.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    include_completed: bool = False,
    work_type: Optional[WorkTypeEnum] = None,
    db: Session = Depends(get_db)
):
    """Get all tasks with optional filters"""
    query = db.query(TaskModel)
    
    if not include_completed:
        query = query.filter(TaskModel.is_completed == False)
    
    if work_type:
        query = query.filter(TaskModel.work_type == convert_work_type(work_type))
    
    tasks = query.order_by(TaskModel.deadline.asc()).all()
    
    return [
        TaskResponse(
            id=t.id,
            title=t.title,
            estimated_minutes=t.estimated_minutes,
            priority=t.priority,
            deadline=t.deadline,
            work_type=t.work_type.value,
            is_completed=t.is_completed,
            created_at=t.created_at,
            updated_at=t.updated_at
        )
        for t in tasks
    ]


@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task.id,
        title=task.title,
        estimated_minutes=task.estimated_minutes,
        priority=task.priority,
        deadline=task.deadline,
        work_type=task.work_type.value,
        is_completed=task.is_completed,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task (including marking as complete)"""
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update only provided fields
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.estimated_minutes is not None:
        task.estimated_minutes = task_update.estimated_minutes
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.deadline is not None:
        task.deadline = task_update.deadline
    if task_update.work_type is not None:
        task.work_type = convert_work_type(task_update.work_type)
    if task_update.is_completed is not None:
        task.is_completed = task_update.is_completed
    
    db.commit()
    db.refresh(task)
    
    return TaskResponse(
        id=task.id,
        title=task.title,
        estimated_minutes=task.estimated_minutes,
        priority=task.priority,
        deadline=task.deadline,
        work_type=task.work_type.value,
        is_completed=task.is_completed,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task"""
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return None


# --- OPTIMIZATION ROUTES ---
@app.post("/optimize")
def optimize_schedule(request: Request, tasks: List[OptimizeRequest]):
    """
    Run the heuristic engine to optimize task scheduling
    Uses Google Calendar busy blocks + submitted tasks
    """
    # Get busy blocks if authenticated
    # Note: Optimize endpoint currently just uses primary calendar if we call logic here
    # For better design, we should allow passing calendar_ids or reusing session state
    # But heurisitic engine needs explicit busy blocks passed in.
    
    # Simple fix: fetch primary busy blocks inside here if not passed
    # In a real app, you might want to reuse the same filter from GET /busy
    
    busy_blocks = []
    try:
        # Default to primary for quick optimization calls
        busy_blocks_response = get_busy_blocks(request, calendar_ids=['primary'])
        if isinstance(busy_blocks_response, list):
            busy_blocks = busy_blocks_response
    except HTTPException:
        pass  # No calendar data, optimize with empty busy blocks

    # Convert to engine tasks
    engine_tasks = []
    for i, t in enumerate(tasks):
        work_type = EngineWorkType.DEEP_WORK
        if t.work_type == WorkTypeEnum.SHALLOW_WORK:
            work_type = EngineWorkType.SHALLOW_WORK
            
        engine_tasks.append(EngineTask(
            id=i,
            title=t.title,
            estimated_minutes=t.estimated_minutes,
            priority=t.priority,
            deadline=t.deadline,
            work_type=work_type
        ))

    # Setup scheduling window
    now = datetime.datetime.now(datetime.timezone.utc)
    end_window = now + datetime.timedelta(days=7)
    
    scheduler = HeuristicScheduler(busy_blocks, now, end_window)
    optimized_schedule = scheduler.optimize_schedule(engine_tasks)

    return [
        {
            "task": s.task.title,
            "start": s.start_time.isoformat(),
            "end": s.end_time.isoformat(),
            "score": s.score,
            "work_type": s.task.work_type.value
        }
        for s in optimized_schedule
    ]


@app.post("/optimize/from-db")
def optimize_from_database(
    request: Request, 
    calendar_ids: List[str] = Query(None), # Allow filtering calendars during optimize
    db: Session = Depends(get_db)
):
    """
    Optimize schedule using tasks from the database
    """
    # Get incomplete tasks from database
    db_tasks = db.query(TaskModel).filter(TaskModel.is_completed == False).all()
    
    if not db_tasks:
        return {"message": "No pending tasks to optimize", "schedule": []}
    
    # Get busy blocks - pass the calendar_ids filter!
    busy_blocks = []
    try:
        if not calendar_ids:
            calendar_ids = ['primary']
            
        busy_blocks_response = get_busy_blocks(request, calendar_ids=calendar_ids)
        if isinstance(busy_blocks_response, list):
            busy_blocks = busy_blocks_response
    except HTTPException as e:
        print(f"Calendar fetch failed: {e}")
        pass

    # Convert to engine tasks
    engine_tasks = [
        EngineTask(
            id=t.id,
            title=t.title,
            estimated_minutes=t.estimated_minutes,
            priority=t.priority,
            deadline=t.deadline,
            work_type=convert_to_engine_work_type(t.work_type)
        )
        for t in db_tasks
    ]

    # Run optimization
    now = datetime.datetime.now(datetime.timezone.utc)
    end_window = now + datetime.timedelta(days=7)
    
    scheduler = HeuristicScheduler(busy_blocks, now, end_window)
    optimized_schedule = scheduler.optimize_schedule(engine_tasks)
    summary = scheduler.get_schedule_summary(optimized_schedule)

    return {
        "summary": summary,
        "schedule": [
            {
                "task_id": s.task.id,
                "task": s.task.title,
                "start": s.start_time.isoformat(),
                "end": s.end_time.isoformat(),
                "score": s.score,
                "work_type": s.task.work_type.value
            }
            for s in optimized_schedule
        ]
    }


# --- AI ASSISTANT ROUTES ---
from llm_client import (
    OllamaClient, 
    get_ollama_client, 
    AIAssistantRequest, 
    LLMScheduleResponse,
    TaskSuggestion,
    TaskAction
)


class AIHealthResponse(BaseModel):
    """Response for AI health check"""
    status: str
    ai_available: bool
    model: str


@app.get("/ai/health", response_model=AIHealthResponse)
async def ai_health_check():
    """Check if AI Service is available"""
    client = get_ollama_client()
    is_healthy = await client.check_health()
    
    return AIHealthResponse(
        status="healthy" if is_healthy else "ai_unavailable",
        ai_available=is_healthy,
        model=client.default_model if hasattr(client, 'default_model') else "unknown"
    )


@app.post("/ai/assist", response_model=LLMScheduleResponse)
async def ai_assist(
    request: AIAssistantRequest,
    db: Session = Depends(get_db)
):
    """
    AI Assistant endpoint - "Protocol Buffer" pattern.
    
    Receives:
    - User prompt from Tactical Tablet UI
    - Current schedule as JSON
    
    Returns:
    - Structured JSON response with task suggestions and insights
    - Guaranteed to match LLMScheduleResponse schema for Heuristic Engine
    """
    client = get_ollama_client()
    
    # Check if AI is available
    if not await client.check_health():
        return LLMScheduleResponse(
            summary="AI assistant is currently unavailable. Z.ai service may be offline.",
            task_suggestions=[],
            insights=[]
        )
    
    # If no schedule provided, fetch from database
    if not request.current_schedule:
        db_tasks = db.query(TaskModel).filter(TaskModel.is_completed == False).all()
        request.current_schedule = [t.to_dict() for t in db_tasks]
    
    # Get structured response from LLM
    response = await client.generate_structured(request)
    
    return response


@app.post("/ai/apply-suggestions")
async def apply_ai_suggestions(
    suggestions: List[TaskSuggestion],
    db: Session = Depends(get_db)
):
    """
    Apply AI-suggested task modifications to the database.
    
    This endpoint allows the user to "accept" AI suggestions,
    which are then executed against the real database.
    """
    results = []
    
    for suggestion in suggestions:
        try:
            if suggestion.action == TaskAction.CREATE:
                # Create new task
                new_task = TaskModel(
                    title=suggestion.title or "Untitled Task",
                    estimated_minutes=suggestion.estimated_minutes or 60,
                    priority=suggestion.priority or 5,
                    deadline=datetime.datetime.fromisoformat(suggestion.deadline) if suggestion.deadline else datetime.datetime.now() + datetime.timedelta(days=1),
                    work_type=ModelWorkType.DEEP_WORK if suggestion.work_type == "Deep Work" else ModelWorkType.SHALLOW_WORK,
                    is_completed=False
                )
                db.add(new_task)
                db.commit()
                db.refresh(new_task)
                results.append({"action": "create", "task_id": new_task.id, "status": "success"})
                
            elif suggestion.action == TaskAction.UPDATE and suggestion.task_id:
                task = db.query(TaskModel).filter(TaskModel.id == suggestion.task_id).first()
                if task:
                    if suggestion.title:
                        task.title = suggestion.title
                    if suggestion.estimated_minutes:
                        task.estimated_minutes = suggestion.estimated_minutes
                    if suggestion.priority:
                        task.priority = suggestion.priority
                    if suggestion.deadline:
                        task.deadline = datetime.datetime.fromisoformat(suggestion.deadline)
                    if suggestion.work_type:
                        task.work_type = ModelWorkType.DEEP_WORK if suggestion.work_type == "Deep Work" else ModelWorkType.SHALLOW_WORK
                    db.commit()
                    results.append({"action": "update", "task_id": suggestion.task_id, "status": "success"})
                else:
                    results.append({"action": "update", "task_id": suggestion.task_id, "status": "not_found"})
                    
            elif suggestion.action == TaskAction.DELETE and suggestion.task_id:
                task = db.query(TaskModel).filter(TaskModel.id == suggestion.task_id).first()
                if task:
                    db.delete(task)
                    db.commit()
                    results.append({"action": "delete", "task_id": suggestion.task_id, "status": "success"})
                else:
                    results.append({"action": "delete", "task_id": suggestion.task_id, "status": "not_found"})
                    
            elif suggestion.action == TaskAction.COMPLETE and suggestion.task_id:
                task = db.query(TaskModel).filter(TaskModel.id == suggestion.task_id).first()
                if task:
                    task.is_completed = True
                    db.commit()
                    results.append({"action": "complete", "task_id": suggestion.task_id, "status": "success"})
                else:
                    results.append({"action": "complete", "task_id": suggestion.task_id, "status": "not_found"})
                    
            elif suggestion.action in [TaskAction.RESCHEDULE, TaskAction.PRIORITIZE] and suggestion.task_id:
                # These are treated as updates
                task = db.query(TaskModel).filter(TaskModel.id == suggestion.task_id).first()
                if task:
                    if suggestion.deadline:
                        task.deadline = datetime.datetime.fromisoformat(suggestion.deadline)
                    if suggestion.priority:
                        task.priority = suggestion.priority
                    db.commit()
                    results.append({"action": suggestion.action.value, "task_id": suggestion.task_id, "status": "success"})
                else:
                    results.append({"action": suggestion.action.value, "task_id": suggestion.task_id, "status": "not_found"})
                    
        except Exception as e:
            results.append({
                "action": suggestion.action.value,
                "task_id": suggestion.task_id,
                "status": "error",
                "message": str(e)
            })
    
    return {
        "applied": len([r for r in results if r.get("status") == "success"]),
        "failed": len([r for r in results if r.get("status") != "success"]),
        "results": results
    }


# =============================================================================
# AEVUM PROJECT ARCHITECT - LLM INTEGRATION
# =============================================================================

# --- Z.ai LLM Configuration ---
ZAI_API_KEY = os.getenv("ZAI_API_KEY", "")
ZAI_BASE_URL = os.getenv("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4/")
ZAI_MODEL = os.getenv("ZAI_DEFAULT_MODEL", "glm-4.5-air")

# Initialize OpenAI-compatible client for Z.ai
llm_client = None
if ZAI_API_KEY:
    llm_client = OpenAI(
        api_key=ZAI_API_KEY,
        base_url=ZAI_BASE_URL
    )

# --- Aevum Project Architect System Prompt ---
ARCHITECT_SYSTEM_PROMPT = """You are the "Aevum Project Architect." Your goal is to analyze high-level objectives and decompose them into actionable, scheduled plans.

## Task Decomposition Rules:
- **Breaking Down Large Goals**: If a user provides a broad goal (e.g., "Build a Piano Learning App"), identify logical sub-phases: Research, Planning, Frontend Development, and Backend Implementation.
- **Time Estimation**: Assign realistic time blocks (in minutes) to each sub-task based on common software engineering practices.

## Operational Guardrails:
- **Academic Priority**: Never suggest work during the user's Penn State class schedule or university commitments.
- **Cognitive Load**: Identify tasks as "Deep Work" or "Shallow Work." Do not schedule more than 4 hours of Deep Work in a single day.
- **Clarity**: If a goal is too vague, ask a specific follow-up question instead of making assumptions.

## Response Format:
When decomposing tasks, respond with a structured JSON format:
```json
{
  "project_name": "Project Title",
  "phases": [
    {
      "phase": "I. Planning",
      "tasks": [
        {"title": "Task Name", "duration_minutes": 120, "work_type": "Deep Work", "depends_on": null}
      ]
    }
  ],
  "summary": "Brief explanation of the plan"
}
```

For conversational responses, just reply naturally. Only use the JSON format when actively planning tasks."""


class ArchitectMessage(BaseModel):
    """Schema for chat messages to the Architect"""
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ArchitectRequest(BaseModel):
    """Schema for Architect chat request"""
    messages: List[ArchitectMessage]
    include_context: bool = True  # Include task history in context


class ArchitectResponse(BaseModel):
    """Schema for Architect response"""
    message: str
    tasks_suggested: Optional[List[dict]] = None
    model_used: str


@app.post("/architect/chat", response_model=ArchitectResponse, tags=["AI Architect"])
async def architect_chat(
    request: ArchitectRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with the Aevum Project Architect AI.
    
    The AI can:
    - Decompose large projects into actionable tasks
    - Suggest optimal scheduling based on work type
    - Reference your existing task history for context
    """
    if not llm_client:
        raise HTTPException(
            status_code=503,
            detail="LLM service not configured. Please set ZAI_API_KEY environment variable."
        )
    
    # Build context from existing tasks if requested
    context = ""
    if request.include_context:
        pending_tasks = db.query(TaskModel).filter(TaskModel.is_completed == False).all()
        if pending_tasks:
            context = "\n\n## Your Current Pending Tasks:\n"
            for task in pending_tasks:
                context += f"- {task.title} ({task.estimated_minutes}min, {task.work_type.value}, Priority: {task.priority})\n"
    
    # Build messages for the API
    messages = [
        {"role": "system", "content": ARCHITECT_SYSTEM_PROMPT + context}
    ]
    
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})
    
    try:
        # Call Z.ai LLM
        completion = llm_client.chat.completions.create(
            model=ZAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        response_content = completion.choices[0].message.content
        
        # Try to extract tasks if response contains JSON
        tasks_suggested = None
        if "```json" in response_content:
            import json
            try:
                json_start = response_content.find("```json") + 7
                json_end = response_content.find("```", json_start)
                json_str = response_content[json_start:json_end].strip()
                parsed = json.loads(json_str)
                if "phases" in parsed:
                    tasks_suggested = []
                    for phase in parsed["phases"]:
                        for task in phase.get("tasks", []):
                            tasks_suggested.append({
                                "phase": phase["phase"],
                                **task
                            })
            except:
                pass  # If JSON parsing fails, just return the message
        
        return ArchitectResponse(
            message=response_content,
            tasks_suggested=tasks_suggested,
            model_used=ZAI_MODEL
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM request failed: {str(e)}"
        )


@app.get("/architect/test", tags=["AI Architect"])
async def test_architect_connection():
    """
    Test the connection to the Z.ai LLM service.
    Returns the model info and a simple test response.
    """
    if not llm_client:
        return {
            "status": "not_configured",
            "message": "ZAI_API_KEY not set",
            "base_url": ZAI_BASE_URL,
            "model": ZAI_MODEL
        }
    
    try:
        # Simple test message
        completion = llm_client.chat.completions.create(
            model=ZAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Respond briefly."},
                {"role": "user", "content": "Say 'Aevum Architect ready!' and nothing else."}
            ],
            max_tokens=50
        )
        
        return {
            "status": "connected",
            "model": ZAI_MODEL,
            "base_url": ZAI_BASE_URL,
            "test_response": completion.choices[0].message.content,
            "usage": {
                "prompt_tokens": completion.usage.prompt_tokens,
                "completion_tokens": completion.usage.completion_tokens
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "model": ZAI_MODEL,
            "base_url": ZAI_BASE_URL,
            "error": str(e)
        }


# --- MAIN ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)