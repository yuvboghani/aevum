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
import { CriticalSidebar } from './components/CriticalSidebar';

// --- CONFIG ---
// Strictly enforce relative path in PROD to use the proxy
const API_URL = import.meta.env.PROD ? "/aevum" : (import.meta.env.VITE_API_URL || "http://localhost:8000");
axios.defaults.withCredentials = true;

// --- TIME SLOTS CONFIG ---
const START_HOUR = 8;
const END_HOUR = 17;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

// --- WORK TYPES ---
const WORK_TYPES = {
  DEEP_WORK: "Deep Work",
  SHALLOW_WORK: "Shallow Work"
};

// --- EVENT TYPES ---
const EVENT_TYPES = {
  LOCKED: 'locked',      // University classes - blue/gray
  AI_SUGGESTION: 'ai',   // AI scheduled - orange
  GAP_FILLER: 'gap',     // Gap filler - dashed
  DEEP_WORK: 'deep',     // High energy deep work - coral/red
};

// --- ICONS ---
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const DropletIcon = () => (
  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


// --- WEEK HEADER ---
const WeekHeader = ({ weekTitle, dateRange, viewMode, onViewModeChange }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">{weekTitle}</h1>
        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full uppercase">
          Current
        </span>
      </div>
      <p className="flex items-center gap-2 text-sm text-gray-500 mt-1">
        <CalendarIcon /> {dateRange}
      </p>
    </div>

    {/* View Mode Toggle */}
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {['Day', 'Week', 'Month'].map((mode) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode.toLowerCase())}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === mode.toLowerCase()
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          {mode}
        </button>
      ))}
    </div>
  </div>
);

// --- CALENDAR EVENT CARD ---
const EventCard = ({ event, isDragging, style }) => {
  // Event type styling
  const getEventStyles = () => {
    switch (event.eventType) {
      case EVENT_TYPES.LOCKED:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-700',
        };
      case EVENT_TYPES.AI_SUGGESTION:
        return {
          bg: 'bg-orange-100',
          border: 'border-orange-200',
          text: 'text-orange-900',
          badge: 'bg-orange-500 text-white',
          rounded: true,
        };
      case EVENT_TYPES.GAP_FILLER:
        return {
          bg: 'bg-white',
          border: 'border-dashed border-2 border-amber-300',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-700',
        };
      case EVENT_TYPES.DEEP_WORK:
        return {
          bg: 'bg-gradient-to-br from-red-400 to-red-500',
          border: 'border-red-400',
          text: 'text-white',
          badge: 'bg-red-600 text-white',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-700',
        };
    }
  };

  const styles = getEventStyles();
  const isRounded = event.eventType === EVENT_TYPES.AI_SUGGESTION;

  return (
    <div
      className={`
        absolute left-1 right-1 p-2 cursor-grab select-none overflow-hidden
        ${styles.bg} ${styles.border} ${styles.text}
        ${isRounded ? 'rounded-2xl' : 'rounded-lg'}
        ${isDragging ? 'opacity-50 shadow-lg z-50' : 'shadow-sm'}
        border transition-all hover:shadow-md hover:z-10
      `}
      style={style}
    >
      {/* Badge */}
      {event.badge && (
        <span className={`absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded ${styles.badge}`}>
          {event.badge}
        </span>
      )}

      {/* Lock Icon for locked events */}
      {event.eventType === EVENT_TYPES.LOCKED && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center">
          <LockIcon />
        </div>
      )}

      {/* Focus Block indicator */}
      {event.focusBlock && (
        <div className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 bg-orange-600 text-white text-[9px] font-semibold rounded-full">
          Focus
        </div>
      )}

      {/* High Energy badge */}
      {event.highEnergy && (
        <div className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 bg-red-600/80 text-white text-[9px] font-semibold rounded">
          ⚡
        </div>
      )}

      {/* Content */}
      <div className={event.badge || event.focusBlock || event.highEnergy ? 'mt-4' : ''}>
        <h4 className="font-semibold text-xs leading-tight truncate">{event.title}</h4>
        <p className="text-[10px] opacity-80 mt-0.5 truncate">{event.time}</p>
        {event.location && (
          <p className="text-[10px] opacity-60 truncate">{event.location}</p>
        )}
      </div>
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
      className={`h-full transition-colors ${isOver ? 'bg-orange-50' : ''}`}
    >
      {children}
    </div>
  );
};

// --- DRAGGABLE EVENT ---
const DraggableEvent = ({ event, style: positionStyle }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });

  // Merge position style with drag transform
  const combinedStyle = {
    ...positionStyle,
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 1000,
    } : {}),
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <EventCard event={event} isDragging={isDragging} style={combinedStyle} />
    </div>
  );
};

// --- LEFT SIDEBAR (Tasks, Legend, Calendars) ---
const LeftSidebar = ({ calendars, selectedCalendarIds, onToggleCalendar, onLogin, tasks }) => (
  <aside className="w-72 flex-shrink-0 space-y-4">
    {/* Pending Tasks */}
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">Pending Tasks</h3>
      {tasks && tasks.length > 0 ? (
        <div className="space-y-2 max-h-[180px] overflow-y-auto">
          {tasks.slice(0, 5).map((task, i) => (
            <div key={i} className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded">
              <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="truncate text-gray-700">{task.title}</span>
            </div>
          ))}
          {tasks.length > 5 && (
            <p className="text-xs text-gray-400 pl-4">+{tasks.length - 5} more tasks</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No pending tasks</p>
      )}
    </div>

    {/* Legend */}
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">Legend</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          <span>University (Locked)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />
          <span>AI Suggestion</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-white border-2 border-dashed border-amber-300" />
          <span>Gap Filler</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-red-400 to-red-500" />
          <span>Deep Work</span>
        </div>
      </div>
    </div>

    {/* Calendar Sources */}
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
        <CalendarIcon /> Calendar Sources
      </h3>
      {calendars.length > 0 ? (
        <div className="space-y-2 max-h-[150px] overflow-y-auto">
          {calendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
              <input
                type="checkbox"
                checked={selectedCalendarIds.includes(cal.id)}
                onChange={() => onToggleCalendar(cal.id)}
                className="rounded text-orange-500 focus:ring-orange-500"
              />
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cal.backgroundColor || '#ccc' }}
              />
              <span className="truncate flex-1 text-gray-700">{cal.summary}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500 mb-2">No calendars connected</p>
          <button
            onClick={onLogin}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
          >
            Connect Google Calendar
          </button>
        </div>
      )}
    </div>
  </aside>
);

// --- MAIN DASHBOARD COMPONENT ---
function Dashboard() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [dbTasks, setDbTasks] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notification, setNotification] = useState(null);
  const [viewMode, setViewMode] = useState('week');
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState([]);

  // --- DRAG AND DROP CONFIG ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // View days configuration
  const weekDays = useMemo(() => {
    let days = 7;
    if (viewMode === 'day') days = 1;
    if (viewMode === 'month') days = 30; // Show approx one month

    return Array.from({ length: days }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart, viewMode]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch calendar events
  const fetchCalendarEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/busy`);
      const formatted = res.data.map((item, index) => ({
        id: `cal-${index}`,
        title: item.title,
        start: item.start_time,
        end: item.end_time,
        time: `${format(parseISO(item.start_time), 'h:mm a')} - ${format(parseISO(item.end_time), 'h:mm a')}`,
        eventType: EVENT_TYPES.LOCKED,
        badge: 'LOCKED',
        durationMinutes: differenceInMinutes(parseISO(item.end_time), parseISO(item.start_time)),
      }));
      setCalendarEvents(formatted);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Calendar API Error:", err);
      if (err.response?.status === 401) {
        setIsLoggedIn(false);
      }
      // Set demo data if API fails
      setupDemoEvents();
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`, {
        params: { include_completed: false }
      });
      setDbTasks(res.data);
    } catch (err) {
      console.error("Tasks API Error:", err);
    }
  }, []);

  // Setup demo events for visual testing
  const setupDemoEvents = () => {
    const monday = currentWeekStart;
    const tuesday = addDays(monday, 1);
    const wednesday = addDays(monday, 2);
    const sunday = addDays(monday, 6);

    const demoEvents = [
      // Monday events
      {
        id: 'demo-1',
        title: 'Data Viz Lab',
        time: '9:00 - 10:30 AM',
        start: setHours(tuesday, 9).toISOString(),
        eventType: EVENT_TYPES.LOCKED,
        badge: 'LOCKED',
        durationMinutes: 90,
      },
      {
        id: 'demo-2',
        title: 'Adv. Calculus II',
        time: '10:00 - 11:30 AM',
        location: 'RM 304',
        start: setHours(monday, 10).toISOString(),
        eventType: EVENT_TYPES.LOCKED,
        badge: 'LOCKED',
        durationMinutes: 90,
      },
      {
        id: 'demo-3',
        title: 'Adv. Calculus II',
        time: '10:00 - 11:30 AM',
        start: setHours(tuesday, 10).toISOString(),
        eventType: EVENT_TYPES.LOCKED,
        badge: 'LOCKED',
        durationMinutes: 90,
      },
      // Gap Filler - scheduled after Calculus ends at 11:30
      {
        id: 'demo-4',
        title: 'Read: Transformers',
        time: '12:00 PM',
        start: setHours(monday, 12).toISOString(),
        eventType: EVENT_TYPES.GAP_FILLER,
        gapFiller: true,
        gapMinutes: 45,
        durationMinutes: 45,
      },
      // Deep Work
      {
        id: 'demo-5',
        title: 'Deep Learning Project',
        time: '1:00 - 3:00 PM',
        start: setHours(monday, 14).toISOString(),
        eventType: EVENT_TYPES.DEEP_WORK,
        highEnergy: true,
        durationMinutes: 120,
        collaborators: [{}, {}],
      },
      // AI Suggestion (rounded orange)
      {
        id: 'demo-6',
        title: 'Neural Nets Study',
        time: '2:00 - 4:00 PM',
        start: setHours(wednesday, 14).toISOString(),
        eventType: EVENT_TYPES.AI_SUGGESTION,
        focusBlock: true,
        durationMinutes: 120,
      },
    ];

    setCalendarEvents(demoEvents);
  };

  // Fetch calendars
  const fetchCalendars = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/calendars`);
      setCalendars(res.data);
      if (selectedCalendarIds.length === 0 && res.data.length > 0) {
        const primaryIds = res.data.filter(c => c.primary).map(c => c.id);
        setSelectedCalendarIds(primaryIds.length > 0 ? primaryIds : [res.data[0].id]);
      }
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
    }
  }, [selectedCalendarIds.length]);

  // Toggle calendar selection
  const toggleCalendar = (calId) => {
    setSelectedCalendarIds(prev =>
      prev.includes(calId) ? prev.filter(id => id !== calId) : [...prev, calId]
    );
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCalendarEvents(), fetchTasks(), fetchCalendars()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchCalendarEvents, fetchTasks, fetchCalendars]);

  // Get events for a specific hour and day
  const getEventsForSlot = useCallback((hour, dayDate) => {
    return calendarEvents.filter(event => {
      const eventStart = parseISO(event.start);
      const eventHour = eventStart.getHours();
      return isSameDay(eventStart, dayDate) && eventHour === hour;
    });
  }, [calendarEvents]);

  // Handle drag start/end
  const handleDragStart = (event) => {
    const draggedEvent = calendarEvents.find(e => e.id === event.active.id);
    setActiveEvent(draggedEvent);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveEvent(null);
    if (!over) return;
    // Drag and drop logic here
  };


  // Login redirect - use detailed path if needed
  const handleLogin = () => window.location.href = `${API_URL}/login`;

  // Architect's Notes insights
  const insights = [
    {
      title: 'Morning Focus',
      description: 'Scheduled Neural Nets Study at 2 PM. Historical data suggests your focus peaks +15% after your lunch break on Wednesdays.',
      icon: <ChevronUpIcon />,
      tag: 'OPTIMIZATION',
      tagColor: 'bg-gray-100 text-gray-700',
    },
    {
      title: 'Gap Filler',
      description: 'Identified a 45-min gap between Data Viz and Lunch. Inserted a short reading task to utilize the fragmented time.',
      icon: <CheckCircleIcon />,
      tag: 'EFFICIENCY',
      tagColor: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Conflict Resolved',
      description: 'Moved "Python Scripting" to Thursday to avoid burnout. You have 2 heavy "Locked" classes on Monday.',
      icon: <WarningIcon />,
      tag: 'WELLNESS',
      tagColor: 'bg-amber-100 text-amber-700',
    },
  ];

  // Week title
  const weekNumber = Math.ceil((currentWeekStart.getTime() - new Date(currentWeekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const weekTitle = `Week ${weekNumber}: Neural Networks`;
  const dateRange = `${format(currentWeekStart, 'MMM d')} - ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`;

  return (
    <div className="min-h-screen relative">
      {/* Dot Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: '#FAFAF8',
          backgroundImage: `radial-gradient(circle, #e5e5e5 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fade-in ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}


      {/* Main Content */}
      <div className="pt-20 px-4 lg:px-6 pb-8 relative z-10">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col xl:flex-row gap-6">
          {/* Left Sidebar */}
          <LeftSidebar
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
            onToggleCalendar={toggleCalendar}
            onLogin={handleLogin}
            tasks={dbTasks}
          />

          {/* Calendar Section */}
          <main className="flex-grow min-w-0">
            {/* Week Header */}
            <WeekHeader
              weekTitle={weekTitle}
              dateRange={dateRange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Calendar Grid */}
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                {/* Day Headers */}
                <div
                  className="grid border-b border-gray-100 min-w-max"
                  style={{ gridTemplateColumns: `60px repeat(${weekDays.length}, minmax(140px, 1fr))` }}
                >
                  <div className="p-3" />
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div key={i} className={`p-3 text-center border-l border-gray-100 ${isToday ? 'bg-orange-50' : ''}`}>
                        <div className="text-xs font-semibold text-gray-400 uppercase">
                          {format(day, 'EEE')}
                        </div>
                        <div className={`text-lg font-semibold mt-0.5 ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time Grid Container */}
                <div className="relative">
                  {/* Time rows - static height */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="grid border-b border-gray-100 min-w-max"
                      style={{
                        gridTemplateColumns: `60px repeat(${weekDays.length}, minmax(140px, 1fr))`,
                        height: '60px' // Fixed height per hour
                      }}
                    >
                      {/* Time Label */}
                      <div className="text-xs font-medium text-gray-400 text-right pr-3 pt-1">
                        {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
                      </div>

                      {/* Empty day cells - just for the grid lines */}
                      {weekDays.map((day, dayIndex) => (
                        <DroppableSlot
                          key={dayIndex}
                          id={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                          hour={hour}
                          dayDate={day}
                        >
                          <div className="border-l border-gray-100 h-full" />
                        </DroppableSlot>
                      ))}
                    </div>
                  ))}

                  {/* Events Layer - positioned absolutely on top of the grid */}
                  <div
                    className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
                    style={{ marginLeft: '60px' }} // Offset for time column
                  >
                    <div
                      className="grid h-full"
                      style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(140px, 1fr))` }}
                    >
                      {weekDays.map((day, dayIndex) => {
                        // Get all events for this day
                        const dayEvents = calendarEvents.filter(event => {
                          const eventStart = parseISO(event.start);
                          return isSameDay(eventStart, day);
                        });

                        return (
                          <div key={dayIndex} className="relative pointer-events-auto">
                            {dayEvents.map((event) => {
                              const eventStart = parseISO(event.start);
                              const startHour = eventStart.getHours();
                              const startMinutes = eventStart.getMinutes();
                              const duration = event.durationMinutes || 60;

                              // Calculate position relative to START_HOUR
                              const hoursFromStart = startHour - START_HOUR;
                              const topOffset = (hoursFromStart * 60 + startMinutes); // in pixels (1px per minute)
                              const height = duration; // height in pixels (1px per minute)

                              // Skip if event is outside visible hours
                              if (startHour < START_HOUR || startHour >= END_HOUR) return null;

                              return (
                                <DraggableEvent
                                  key={event.id}
                                  event={event}
                                  style={{
                                    top: `${topOffset}px`,
                                    height: `${Math.max(height, 30)}px`, // Min 30px height
                                  }}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeEvent ? (
                  <EventCard event={activeEvent} isDragging={true} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </main>

          {/* Right Sidebar (Critical Tasks) */}
          <CriticalSidebar tasks={dbTasks} />
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-lg font-light text-gray-600 animate-pulse">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
