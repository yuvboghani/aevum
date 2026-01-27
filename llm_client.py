"""
Z.ai LLM Client for Aevum Scheduler
Uses GLM models with automatic complexity-based model selection

Model Strategy:
- GLM-4-Flash: Default for simple tasks (free tier)
- GLM-4.5-Air: Complex task decomposition
- GLM-4.7: Final polish / code generation (flagship)
"""
import os
import json
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum
from openai import OpenAI


# --- CONFIGURATION ---
ZAI_API_KEY = os.getenv("ZAI_API_KEY", "cd596480363b4730bc4ba65c7585c3bd.iRCenjxenwDxiktj")
ZAI_BASE_URL = os.getenv("ZAI_BASE_URL", "https://api.z.ai/api/paas/v4/")

# Model tiers
# Model tiers
MODEL_FLASH = "glm-4.5-air"      # Free/Cheap tier (Flash unavailable, using Air)
MODEL_AIR = "glm-4.5-air"        # 66% cheaper, good reasoning
MODEL_FLAGSHIP = "glm-4.5"       # Standard high quality

DEFAULT_MODEL = os.getenv("ZAI_DEFAULT_MODEL", MODEL_FLASH)


# --- COMPLEXITY DETECTION ---
class TaskComplexity(str, Enum):
    SIMPLE = "simple"       # Basic scheduling, Q&A
    MODERATE = "moderate"   # Task decomposition
    COMPLEX = "complex"     # Code gen, complex reasoning


def detect_complexity(prompt: str, schedule_size: int = 0) -> TaskComplexity:
    """
    Automatically detect task complexity to select appropriate model.
    
    Rules:
    - SIMPLE: Short prompts, basic questions, < 5 tasks
    - MODERATE: Task breakdown requests, 5-15 tasks
    - COMPLEX: Code generation, "build", "create app", > 15 tasks
    """
    prompt_lower = prompt.lower()
    word_count = len(prompt.split())
    
    # Indicators of complex tasks
    complex_keywords = [
        "build", "create app", "develop", "implement", 
        "architecture", "design system", "code", "program",
        "database schema", "api design", "full stack"
    ]
    
    moderate_keywords = [
        "break down", "decompose", "plan", "steps",
        "organize", "restructure", "analyze", "optimize"
    ]
    
    # Check for complex indicators
    if any(kw in prompt_lower for kw in complex_keywords):
        return TaskComplexity.COMPLEX
    
    # Check for moderate indicators
    if any(kw in prompt_lower for kw in moderate_keywords):
        return TaskComplexity.MODERATE
    
    # Check based on schedule size
    if schedule_size > 15:
        return TaskComplexity.MODERATE
    
    # Check based on prompt length
    if word_count > 100:
        return TaskComplexity.MODERATE
    
    return TaskComplexity.SIMPLE


def get_model_for_complexity(complexity: TaskComplexity) -> str:
    """Select the appropriate model based on task complexity."""
    if complexity == TaskComplexity.COMPLEX:
        return MODEL_FLAGSHIP
    elif complexity == TaskComplexity.MODERATE:
        return MODEL_AIR
    return MODEL_FLASH


# --- PYDANTIC SCHEMAS FOR STRUCTURED OUTPUT ---

class TaskAction(str, Enum):
    """Actions the LLM can suggest for tasks"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    RESCHEDULE = "reschedule"
    PRIORITIZE = "prioritize"
    COMPLETE = "complete"


class TaskSuggestion(BaseModel):
    """A single task modification suggested by the LLM"""
    action: TaskAction
    task_id: Optional[int] = Field(None, description="ID of existing task to modify")
    title: Optional[str] = Field(None, description="Task title for create/update")
    estimated_minutes: Optional[int] = Field(None, ge=15, le=480)
    priority: Optional[int] = Field(None, ge=1, le=10)
    deadline: Optional[str] = Field(None, description="ISO datetime string")
    work_type: Optional[str] = Field(None, description="Deep Work or Shallow Work")
    reason: Optional[str] = Field(default="AI recommendation", description="Why this action is suggested")


class ScheduleInsight(BaseModel):
    """An insight about the current schedule"""
    category: str = Field(..., description="Type: optimization, warning, wellness, efficiency")
    title: str
    description: str


class LLMScheduleResponse(BaseModel):
    """Structured response from the LLM for schedule operations"""
    summary: str = Field(..., description="Brief summary of the AI's analysis")
    task_suggestions: List[TaskSuggestion] = Field(default_factory=list)
    insights: List[ScheduleInsight] = Field(default_factory=list)
    llm_model_used: Optional[str] = Field(None, description="Which model processed this request")
    complexity_detected: Optional[str] = Field(None, description="Detected task complexity")
    raw_response: Optional[str] = Field(None, description="Raw LLM text if parsing fails")
    
    model_config = {"protected_namespaces": ()}


class AIAssistantRequest(BaseModel):
    """Request from the Tactical Tablet UI"""
    prompt: str = Field(..., description="User's natural language request")
    current_schedule: List[dict] = Field(default_factory=list, description="Current tasks/events as JSON")
    context: Optional[dict] = Field(None, description="Additional context like current time, user prefs")
    force_model: Optional[str] = Field(None, description="Override automatic model selection")


# --- SYSTEM PROMPT (kept concise to save tokens) ---
SYSTEM_PROMPT = """You are Aevum, an AI scheduling assistant. Analyze schedules and suggest task modifications.

RULES:
1. Return ONLY valid JSON matching the schema
2. "Deep Work" = morning tasks (before 12 PM), "Shallow Work" = afternoon (after 4 PM)
3. Prioritize by deadline urgency
4. Always provide a reason for each suggestion

JSON SCHEMA:
{
  "summary": "Brief analysis",
  "task_suggestions": [
    {"action": "create|update|delete|reschedule|prioritize|complete", "task_id": null, "title": "...", "estimated_minutes": 60, "priority": 5, "deadline": "ISO-datetime", "work_type": "Deep Work|Shallow Work", "reason": "..."}
  ],
  "insights": [
    {"category": "optimization|warning|wellness|efficiency", "title": "...", "description": "..."}
  ]
}"""


class ZaiClient:
    """Client for Z.ai API with automatic model selection"""
    
    def __init__(
        self, 
        api_key: str = ZAI_API_KEY, 
        base_url: str = ZAI_BASE_URL,
        default_model: str = DEFAULT_MODEL
    ):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.default_model = default_model
        self.available = True
    
    async def check_health(self) -> bool:
        """Check if Z.ai API is configured and available"""
        if not self.client.api_key:
            self.available = False
            return False
            
        # Instead of calling models.list() which can fail on certain Z.ai endpoints,
        # we assume availability if key is present. The first actual request will verify.
        self.available = True
        return True
    
    def generate_structured_sync(
        self,
        request: AIAssistantRequest,
        model_override: Optional[str] = None
    ) -> LLMScheduleResponse:
        """
        Synchronous version for non-async contexts.
        Generate a structured response using Z.ai with automatic model selection.
        """
        # Detect complexity and select model
        complexity = detect_complexity(
            request.prompt, 
            len(request.current_schedule)
        )
        
        if model_override:
            model = model_override
        elif request.force_model:
            model = request.force_model
        else:
            model = get_model_for_complexity(complexity)
        
        # Build the prompt
        schedule_json = json.dumps(request.current_schedule, indent=2, default=str)
        
        user_prompt = f"""Current Schedule:
```json
{schedule_json}
```

User Request: {request.prompt}

Respond with structured JSON only."""

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=1024
            )
            
            raw_text = response.choices[0].message.content
            
            # Handle empty response
            if not raw_text or raw_text.strip() == "":
                return LLMScheduleResponse(
                    summary="AI returned an empty response",
                    task_suggestions=[],
                    insights=[],
                    llm_model_used=model,
                    complexity_detected=complexity.value
                )
            
            # Parse the JSON response
            try:
                parsed = json.loads(raw_text)
                
                return LLMScheduleResponse(
                    summary=parsed.get("summary", "No summary provided"),
                    task_suggestions=[
                        TaskSuggestion(**ts) for ts in parsed.get("task_suggestions", [])
                    ],
                    insights=[
                        ScheduleInsight(**ins) for ins in parsed.get("insights", [])
                    ],
                    llm_model_used=model,
                    complexity_detected=complexity.value
                )
            except (json.JSONDecodeError, Exception) as e:
                return LLMScheduleResponse(
                    summary=f"AI responded but output wasn't structured: {str(e)}",
                    task_suggestions=[],
                    insights=[],
                    llm_model_used=model,
                    complexity_detected=complexity.value,
                    raw_response=raw_text
                )
                
        except Exception as e:
            return LLMScheduleResponse(
                summary=f"Error communicating with AI: {str(e)}",
                task_suggestions=[],
                insights=[],
                llm_model_used=model,
                complexity_detected=complexity.value
            )
    
    async def generate_structured(
        self,
        request: AIAssistantRequest,
        model_override: Optional[str] = None
    ) -> LLMScheduleResponse:
        """
        Generate a structured response using Z.ai with automatic model selection.
        This is the main "Protocol Buffer" function.
        """
        # Use sync version wrapped (OpenAI SDK handles this)
        return self.generate_structured_sync(request, model_override)

    async def chat(
        self,
        messages: List[dict],
        model_override: Optional[str] = None
    ) -> Any:
        """
        Generic chat completion with automatic model selection.
        """
        # Extract last message to detect complexity
        last_msg = messages[-1]["content"] if messages else ""
        complexity = detect_complexity(last_msg)
        model = model_override or get_model_for_complexity(complexity)
        
        return self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7
        )


# Singleton client instance
_zai_client: Optional[ZaiClient] = None

def get_ollama_client() -> ZaiClient:
    """
    Get the LLM client instance.
    Named 'ollama' for backward compatibility with existing code.
    """
    global _zai_client
    if _zai_client is None:
        _zai_client = ZaiClient()
    return _zai_client


# Aliases for backward compatibility
OllamaClient = ZaiClient
get_zai_client = get_ollama_client

