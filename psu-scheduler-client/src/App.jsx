import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO, addDays, startOfWeek, setHours, setMinutes, differenceInMinutes, isSameDay } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

// --- CONFIG ---
// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
axios.defaults.withCredentials = true;

// --- TIME SLOTS CONFIG ---
const START_HOUR = 8;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

// --- WORK TYPES ---
const WORK_TYPES = {
  DEEP_WORK: "Deep Work",
  SHALLOW_WORK: "Shallow Work"
};

// --- EVENT COLORS BY WORK TYPE ---
const getEventColor = (workType, isOptimized = false) => {
  if (isOptimized) return 'green';
  return workType === WORK_TYPES.DEEP_WORK ? 'orange' : 'earthen';
};

// --- ICONS ---
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

// --- DRAGGABLE EVENT COMPONENT ---
const DraggableEvent = ({ event, colorClass }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
  } : undefined;

  const duration = differenceInMinutes(parseISO(event.end), parseISO(event.start));
  const heightMultiplier = Math.max(duration / 60, 0.5);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, minHeight: `${heightMultiplier * 3}rem` }}
      {...listeners}
      {...attributes}
      className={`event-card event-${colorClass} ${isDragging ? 'dragging' : ''} mb-1`}
    >
      <div className="flex items-center gap-1">
        {event.work_type === WORK_TYPES.DEEP_WORK ? (
          <BrainIcon />
        ) : (
          <ClipboardIcon />
        )}
        <span className="font-medium truncate">{event.title}</span>
      </div>
      {duration >= 30 && (
        <div className="text-xs opacity-70 mt-0.5">
          {format(parseISO(event.start), 'h:mm a')}
        </div>
      )}
    </div>
  );
};

// --- DROPPABLE TIME SLOT ---
const DroppableSlot = ({ id, children, hour, dayDate }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { hour, dayDate },
  });

  return (
    <div
      ref={setNodeRef}
      className={`drop-zone p-1 ${isOver ? 'over' : ''}`}
    >
      {children}
    </div>
  );
};

// --- TASK CARD COMPONENT ---
const TaskCard = ({ task, onDelete, onToggleComplete }) => (
  <div className={`flex items-start justify-between p-3 rounded-lg text-sm transition-all ${task.is_completed ? 'bg-gray-100 opacity-60' : 'bg-[#FFF4ED]'
    }`}>
    <div className="flex items-start gap-2 flex-1">
      <button
        onClick={() => onToggleComplete(task.id, !task.is_completed)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.is_completed
          ? 'bg-green-500 border-green-500 text-white'
          : 'border-[#C4703D] hover:bg-[#FEE8DB]'
          }`}
      >
        {task.is_completed && <CheckIcon />}
      </button>
      <div className="flex-1">
        <div className={`font-medium ${task.is_completed ? 'line-through' : ''}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${task.work_type === WORK_TYPES.DEEP_WORK
            ? 'bg-[#FF6B2C] text-white'
            : 'bg-[#C4703D] text-white'
            }`}>
            {task.work_type === WORK_TYPES.DEEP_WORK ? '🧠 Deep' : '📋 Shallow'}
          </span>
          <span>{task.estimated_minutes}min</span>
          <span>P{task.priority}</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          Due: {format(parseISO(task.deadline), 'MMM d, h:mm a')}
        </div>
      </div>
    </div>
    <button
      onClick={() => onDelete(task.id)}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
    >
      <TrashIcon />
    </button>
  </div>
);

// --- MAIN APP ---
function App() {
  // State
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [dbTasks, setDbTasks] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notification, setNotification] = useState(null);

  // Calendar Filtering State
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState([]);

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    estimated_minutes: 60,
    priority: 5,
    deadline: format(addDays(new Date(), 1), "yyyy-MM-dd'T'23:59"),
    work_type: WORK_TYPES.DEEP_WORK
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Week days (all 7 days)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch available calendars (only if logged in)
  const fetchCalendars = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/calendars`);
      setAvailableCalendars(res.data);
      // Default to selecting all primary or previously selected
      if (selectedCalendarIds.length === 0) {
        const primaryIds = res.data.filter(c => c.primary).map(c => c.id);
        // If no primary found (weird), select first one
        setSelectedCalendarIds(primaryIds.length > 0 ? primaryIds : [res.data[0].id]);
      }
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
    }
  }, [selectedCalendarIds]);

  // Fetch calendar events (Busy Blocks)
  const fetchCalendarEvents = useCallback(async (calIds = null) => {
    try {
      // Use provided IDs or current state
      const idsToFetch = calIds || selectedCalendarIds;

      // If we still have no IDs (and we tried to fetch calendars), don't call yet
      // But initially we might want to try with default (server handles it)
      const params = new URLSearchParams();
      if (idsToFetch && idsToFetch.length > 0) {
        idsToFetch.forEach(id => params.append('calendar_ids', id));
      }

      const res = await axios.get(`${API_URL}/busy`, { params });

      const formatted = res.data.map((item, index) => ({
        id: `cal-${index}`,
        title: item.title,
        start: item.start_time,
        end: item.end_time,
        type: 'calendar',
        work_type: WORK_TYPES.DEEP_WORK,
        color: 'blue',
      }));
      setCalendarEvents(formatted);
      setIsLoggedIn(true);

      // If we just logged in, now grab the calendar list
      if (availableCalendars.length === 0) {
        fetchCalendars();
      }

    } catch (err) {
      console.error("Calendar API Error:", err);
      if (err.response?.status === 401) {
        setIsLoggedIn(false);
      }
    }
  }, [selectedCalendarIds, availableCalendars.length, fetchCalendars]);

  // Fetch tasks from database
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`, {
        params: { include_completed: showCompleted }
      });
      setDbTasks(res.data);
    } catch (err) {
      console.error("Tasks API Error:", err);
    }
  }, [showCompleted]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCalendarEvents(selectedCalendarIds), fetchTasks()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchTasks]); // Removed fetchCalendarEvents to avoid loop, it's called manually or on specific deps

  // Handle Calendar Toggle
  const toggleCalendar = (calId) => {
    const newSelection = selectedCalendarIds.includes(calId)
      ? selectedCalendarIds.filter(id => id !== calId)
      : [...selectedCalendarIds, calId];

    setSelectedCalendarIds(newSelection);
    fetchCalendarEvents(newSelection); // Refresh events immediately
  };

  // Combine all events for calendar display
  const allEvents = useMemo(() => {
    return [...calendarEvents, ...scheduledTasks];
  }, [calendarEvents, scheduledTasks]);

  // Get events for a specific hour and day
  const getEventsForSlot = useCallback((hour, dayDate) => {
    return allEvents.filter(event => {
      const eventStart = parseISO(event.start);
      const eventHour = eventStart.getHours();
      return isSameDay(eventStart, dayDate) && eventHour === hour;
    });
  }, [allEvents]);

  // Handle drag start
  const handleDragStart = (event) => {
    const draggedEvent = allEvents.find(e => e.id === event.active.id);
    setActiveEvent(draggedEvent);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const draggedEventId = active.id;
    const dropData = over.data.current;

    if (dropData && dropData.hour !== undefined && dropData.dayDate) {
      // Update scheduled tasks (not calendar events)
      if (draggedEventId.toString().startsWith('opt-')) {
        setScheduledTasks(prev => prev.map(evt => {
          if (evt.id === draggedEventId) {
            const originalStart = parseISO(evt.start);
            const originalEnd = parseISO(evt.end);
            const duration = differenceInMinutes(originalEnd, originalStart);

            const newStart = setMinutes(setHours(dropData.dayDate, dropData.hour), 0);
            const newEnd = new Date(newStart.getTime() + duration * 60000);

            return {
              ...evt,
              start: newStart.toISOString(),
              end: newEnd.toISOString(),
            };
          }
          return evt;
        }));
      }
    }
  };

  // Create task in database
  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await axios.post(`${API_URL}/tasks`, {
        ...newTask,
        deadline: new Date(newTask.deadline).toISOString()
      });
      showNotification('Task created successfully!');
      setNewTask({ ...newTask, title: "" });
      setShowAddTask(false);
      fetchTasks();
    } catch (err) {
      console.error("Create task error:", err);
      showNotification('Failed to create task', 'error');
    }
  };

  // Delete task from database
  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      showNotification('Task deleted');
      fetchTasks();
    } catch (err) {
      console.error("Delete task error:", err);
      showNotification('Failed to delete task', 'error');
    }
  };

  // Toggle task completion
  const toggleTaskComplete = async (taskId, isCompleted) => {
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, { is_completed: isCompleted });
      showNotification(isCompleted ? 'Task completed! 🎉' : 'Task reopened');
      fetchTasks();
    } catch (err) {
      console.error("Update task error:", err);
      showNotification('Failed to update task', 'error');
    }
  };

  // Run optimization from database
  const optimizeFromDatabase = async () => {
    setIsOptimizing(true);
    try {
      // Pass selected calendars to optimization engine!
      const params = new URLSearchParams();
      if (selectedCalendarIds && selectedCalendarIds.length > 0) {
        selectedCalendarIds.forEach(id => params.append('calendar_ids', id));
      }

      const res = await axios.post(`${API_URL}/optimize/from-db?${params.toString()}`);

      if (res.data.schedule && res.data.schedule.length > 0) {
        const optimized = res.data.schedule.map((item, index) => ({
          id: `opt-${Date.now()}-${index}`,
          title: item.task,
          start: item.start,
          end: item.end,
          type: 'optimized',
          work_type: item.work_type,
          score: item.score,
          color: 'green',
        }));
        setScheduledTasks(optimized);
        showNotification(`Scheduled ${res.data.summary.total_tasks_scheduled} tasks!`);
      } else {
        showNotification('No tasks to schedule', 'warning');
      }
    } catch (err) {
      console.error("Optimization failed:", err);
      showNotification('Optimization failed', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Navigate weeks
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Login redirect
  const handleLogin = () => window.location.href = `${API_URL}/login`;

  // Stats
  const pendingTasks = dbTasks.filter(t => !t.is_completed);
  const deepWorkCount = pendingTasks.filter(t => t.work_type === WORK_TYPES.DEEP_WORK).length;
  const shallowWorkCount = pendingTasks.filter(t => t.work_type === WORK_TYPES.SHALLOW_WORK).length;

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fade-in ${notification.type === 'error' ? 'bg-red-500 text-white' :
          notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-green-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B2C] to-[#C4703D] flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <span className="text-xl font-semibold">Aevum</span>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-2" />

            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <button onClick={prevWeek} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft />
              </button>
              <button onClick={nextWeek} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight />
              </button>
              <span className="text-lg font-semibold ml-2">
                {format(currentWeekStart, 'MMMM yyyy')}
              </span>
              <button onClick={goToToday} className="ml-2 px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors">
                Today
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-3 mr-4">
              <div className="stat-badge stat-badge-orange">
                <BrainIcon /> {deepWorkCount} Deep
              </div>
              <div className="stat-badge" style={{ background: '#FEE8DB', border: '1px solid #C4703D' }}>
                <ClipboardIcon /> {shallowWorkCount} Shallow
              </div>
            </div>

            {!isLoggedIn && (
              <button onClick={handleLogin} className="btn-secondary">
                Connect Google
              </button>
            )}

            <button onClick={fetchTasks} className="btn-secondary">
              <RefreshIcon /> Refresh
            </button>

            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="btn-primary"
            >
              <PlusIcon /> Add Task
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-6 flex gap-6">
        {/* Sidebar - Task Queue */}
        <aside className="w-80 flex-shrink-0 space-y-4">

          {/* Calendar Sources Filtering */}
          {isLoggedIn && availableCalendars.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CalendarIcon /> Calendar Sources
              </h3>
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                {availableCalendars.map(cal => (
                  <label key={cal.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedCalendarIds.includes(cal.id)}
                      onChange={() => toggleCalendar(cal.id)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cal.backgroundColor || '#ccc' }} />
                    <span className="truncate flex-1">{cal.summary}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Database Tasks */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DatabaseIcon /> Tasks
                {pendingTasks.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#FFF4ED', color: '#C4703D' }}>
                    {pendingTasks.length}
                  </span>
                )}
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show completed
              </label>
            </div>

            {dbTasks.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No tasks yet. Add tasks to get started.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {dbTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={deleteTask}
                    onToggleComplete={toggleTaskComplete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Optimize Button */}
          <button
            onClick={optimizeFromDatabase}
            disabled={pendingTasks.length === 0 || isOptimizing}
            className="btn-success w-full py-3"
          >
            {isOptimizing ? (
              <>
                <RefreshIcon /> Optimizing...
              </>
            ) : (
              <>
                <BoltIcon /> Optimize Schedule
              </>
            )}
          </button>

          {/* Legend */}
          <div className="card p-4">
            <h4 className="text-sm font-semibold mb-3">Work Type Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#FF6B2C]" />
                <span>🧠 Deep Work (Morning boost)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#C4703D]" />
                <span>📋 Shallow Work (Afternoon boost)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#22c55e]" />
                <span>✅ Optimized/Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#4A90D9]" />
                <span>📅 Calendar Event</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Calendar Grid */}
        <main className="flex-grow">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="calendar-grid">
              {/* Header Row */}
              <div className="calendar-header grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  EST
                </div>
                {weekDays.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={i} className={`p-3 text-center day-column ${isToday ? 'today-column' : ''}`}>
                      <div className="text-xs font-medium text-gray-500 uppercase">
                        {format(day, 'EEE')}
                      </div>
                      <div className={`text-lg font-semibold mt-0.5 ${isToday ? 'today-date' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="time-slot grid"
                  style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
                >
                  {/* Time Label */}
                  <div className="p-2 text-xs font-medium text-gray-400 text-right pr-3 pt-1">
                    {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIndex) => {
                    const slotId = `${format(day, 'yyyy-MM-dd')}-${hour}`;
                    const slotEvents = getEventsForSlot(hour, day);

                    return (
                      <div key={dayIndex} className="day-column">
                        <DroppableSlot id={slotId} hour={hour} dayDate={day}>
                          {slotEvents.map((event) => (
                            <DraggableEvent
                              key={event.id}
                              event={event}
                              colorClass={event.type === 'optimized' ? 'green' : event.type === 'calendar' ? 'blue' : getEventColor(event.work_type)}
                            />
                          ))}
                        </DroppableSlot>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeEvent ? (
                <div className={`event-card event-${activeEvent.color || 'orange'} opacity-90 shadow-xl`}>
                  <div className="font-medium">{activeEvent.title}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddTask(false)}>
          <div className="card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add New Task</h2>

            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Capstone Research"
                  className="input-field"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Work Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Work Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTask({ ...newTask, work_type: WORK_TYPES.DEEP_WORK })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${newTask.work_type === WORK_TYPES.DEEP_WORK
                      ? 'border-[#FF6B2C] bg-[#FFF4ED]'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <BrainIcon /> Deep Work
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTask({ ...newTask, work_type: WORK_TYPES.SHALLOW_WORK })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${newTask.work_type === WORK_TYPES.SHALLOW_WORK
                      ? 'border-[#C4703D] bg-[#FEE8DB]'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <ClipboardIcon /> Shallow Work
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {newTask.work_type === WORK_TYPES.DEEP_WORK
                    ? '🧠 Best for coding, studying, research (boosted in mornings)'
                    : '📋 Best for emails, admin, applications (boosted in afternoons)'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    className="input-field"
                    value={newTask.estimated_minutes}
                    onChange={e => setNewTask({ ...newTask, estimated_minutes: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Priority (1-10)</label>
                  <input
                    type="number"
                    max="10"
                    min="1"
                    className="input-field"
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Deadline</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={newTask.deadline}
                  onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
