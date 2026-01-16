"""
Advanced Heuristic Scheduler for Aevum
Features:
- Time-of-Day Multipliers (Morning bias for Deep Work, Afternoon for Shallow Work)
- Priority-based scoring
- Deadline urgency calculation
"""
import datetime
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum


# --- WORK TYPE ENUM ---
class WorkType(Enum):
    DEEP_WORK = "Deep Work"
    SHALLOW_WORK = "Shallow Work"


# --- DATA STRUCTURES ---
@dataclass
class Task:
    id: int
    title: str
    estimated_minutes: int
    priority: int  # 1 (Low) to 10 (Critical)
    deadline: datetime.datetime
    work_type: WorkType = WorkType.DEEP_WORK
    
    def heuristic_score(self, time_block_hour: Optional[int] = None) -> float:
        """
        Calculate heuristic score with Time-of-Day Multiplier
        
        Score = (Priority / Time_Remaining_in_Hours) * Time_of_Day_Multiplier
        
        Time-of-Day Multipliers:
        - Before 12:00 PM: Deep Work gets 1.5x boost
        - After 4:00 PM: Shallow Work gets 1.5x boost
        """
        # Ensure we compare timezone-aware datetimes
        now = datetime.datetime.now(datetime.timezone.utc)
        
        # If deadline is naive, assume UTC
        deadline = self.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=datetime.timezone.utc)
            
        time_remaining = deadline - now
        hours_remaining = time_remaining.total_seconds() / 3600
        
        # Clamp denominator to avoid division by zero
        safe_hours = max(0.1, hours_remaining)
        base_score = self.priority / safe_hours
        
        # Apply Time-of-Day Multiplier
        multiplier = 1.0
        if time_block_hour is not None:
            if time_block_hour < 12:
                # Morning: Boost Deep Work
                if self.work_type == WorkType.DEEP_WORK:
                    multiplier = 1.5
            elif time_block_hour >= 16:
                # After 4 PM: Boost Shallow Work
                if self.work_type == WorkType.SHALLOW_WORK:
                    multiplier = 1.5
        
        return base_score * multiplier


@dataclass
class TimeSlot:
    start: datetime.datetime
    end: datetime.datetime
    
    @property
    def duration_minutes(self) -> float:
        return (self.end - self.start).total_seconds() / 60
    
    @property
    def hour(self) -> int:
        """Get the starting hour of this time slot"""
        return self.start.hour


@dataclass
class ScheduledTask:
    task: Task
    start_time: datetime.datetime
    end_time: datetime.datetime
    score: float = 0.0


# --- THE ENGINE ---
class HeuristicScheduler:
    """
    Advanced Heuristic Scheduler with Time-of-Day optimization
    
    - Parses busy blocks from Google Calendar
    - Finds free gaps in the schedule
    - Optimizes task placement using priority, deadline urgency, and work type
    """
    
    def __init__(
        self, 
        busy_blocks: List[dict], 
        start_window: datetime.datetime, 
        end_window: datetime.datetime
    ):
        self.busy_blocks = self._parse_busy_blocks(busy_blocks)
        self.start_window = start_window
        self.end_window = end_window

    def _parse_busy_blocks(self, raw_blocks: List[dict]) -> List[TimeSlot]:
        """Parse busy blocks from various formats (dict or Pydantic model)"""
        parsed = []
        for b in raw_blocks:
            # Handle Pydantic models or Dicts
            start_str = b.start_time if hasattr(b, 'start_time') else b['start_time']
            end_str = b.end_time if hasattr(b, 'end_time') else b['end_time']
            
            parsed.append(TimeSlot(
                start=datetime.datetime.fromisoformat(start_str),
                end=datetime.datetime.fromisoformat(end_str)
            ))
        return sorted(parsed, key=lambda x: x.start)

    def find_free_gaps(self) -> List[TimeSlot]:
        """
        Find all free time gaps between busy blocks
        Filters out gaps smaller than 15 minutes
        """
        free_gaps = []
        current_pointer = self.start_window

        for block in self.busy_blocks:
            if block.start > current_pointer:
                gap_duration = (block.start - current_pointer).total_seconds() / 60
                if gap_duration >= 15:  # Filter out tiny gaps
                    free_gaps.append(TimeSlot(start=current_pointer, end=block.start))
            current_pointer = max(current_pointer, block.end)

        # Add remaining time after last busy block
        if self.end_window > current_pointer:
            free_gaps.append(TimeSlot(start=current_pointer, end=self.end_window))
            
        return free_gaps

    def optimize_schedule(self, tasks: List[Task]) -> List[ScheduledTask]:
        """
        Main optimization algorithm
        
        1. Find all free gaps
        2. For each gap, calculate scores for all pending tasks
        3. Assign highest-scoring task that fits
        4. Time-of-Day multipliers are applied based on gap's start hour
        """
        schedule = []
        free_gaps = self.find_free_gaps()
        
        # Make a copy to track unscheduled tasks
        pending_tasks = list(tasks)

        for gap in free_gaps:
            gap_pointer = gap.start
            gap_hour = gap.hour  # Use for time-of-day multiplier
            
            # Keep filling this gap while we have tasks
            while pending_tasks:
                remaining_gap_minutes = (gap.end - gap_pointer).total_seconds() / 60
                
                if remaining_gap_minutes < 15:
                    break  # Gap too small for any meaningful work
                
                # Calculate scores for all tasks that fit
                candidates = []
                for task in pending_tasks:
                    if task.estimated_minutes <= remaining_gap_minutes:
                        # Calculate score with time-of-day multiplier
                        score = task.heuristic_score(time_block_hour=gap_hour)
                        candidates.append((task, score))
                
                if not candidates:
                    break  # No tasks fit in remaining gap
                
                # Select the highest-scoring task
                candidates.sort(key=lambda x: x[1], reverse=True)
                best_task, best_score = candidates[0]
                
                # Schedule it
                start_time = gap_pointer
                end_time = start_time + datetime.timedelta(minutes=best_task.estimated_minutes)
                
                schedule.append(ScheduledTask(
                    task=best_task,
                    start_time=start_time,
                    end_time=end_time,
                    score=best_score
                ))
                
                # Update state
                gap_pointer = end_time
                gap_hour = gap_pointer.hour  # Update hour for next iteration
                pending_tasks.remove(best_task)
                
        return schedule
    
    def get_schedule_summary(self, schedule: List[ScheduledTask]) -> dict:
        """Generate a summary of the optimized schedule"""
        total_minutes = sum(
            (s.end_time - s.start_time).total_seconds() / 60 
            for s in schedule
        )
        deep_work_count = sum(
            1 for s in schedule 
            if s.task.work_type == WorkType.DEEP_WORK
        )
        shallow_work_count = len(schedule) - deep_work_count
        
        return {
            "total_tasks_scheduled": len(schedule),
            "total_minutes": total_minutes,
            "deep_work_tasks": deep_work_count,
            "shallow_work_tasks": shallow_work_count,
            "average_score": sum(s.score for s in schedule) / len(schedule) if schedule else 0
        }