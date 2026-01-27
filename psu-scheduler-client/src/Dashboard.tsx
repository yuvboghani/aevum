import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { format, parseISO, addDays, startOfWeek, setHours, setMinutes, differenceInMinutes, isSameDay } from 'date-fns';
import { CriticalSidebar } from './components/CriticalSidebar';
import { Task, CalendarEvent } from './types';

// --- CONFIG ---
// Strictly enforce relative path in PROD to use the proxy
const API_URL = import.meta.env.PROD ? "/aevum/api" : (import.meta.env.VITE_API_URL || "http://localhost:8000");
axios.defaults.withCredentials = true;

// --- TIME SLOTS CONFIG ---
const START_HOUR = 8;
const END_HOUR = 17;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

// --- EVENT TYPES ---
const EVENT_TYPES = {
    LOCKED: 'locked',      // University classes - blue/gray
    AI_SUGGESTION: 'ai',   // AI scheduled - orange
    GAP_FILLER: 'gap',     // Gap filler - dashed
    DEEP_WORK: 'deep',     // High energy deep work - coral/red
} as const;

// --- ICONS ---
const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);


// --- WEEK HEADER ---
interface WeekHeaderProps {
    weekTitle: string;
    dateRange: string;
    viewMode: string;
    onViewModeChange: (mode: string) => void;
}

const WeekHeader: React.FC<WeekHeaderProps> = ({ weekTitle, dateRange, viewMode, onViewModeChange }) => (
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
interface EventCardProps {
    event: CalendarEvent;
    isDragging?: boolean;
    style?: React.CSSProperties;
}

const EventCard: React.FC<EventCardProps> = ({ event, isDragging, style }) => {
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
    // Default values for rendering safety
    const safeStyles = {
        bg: styles.bg || 'bg-gray-50',
        border: styles.border || 'border-gray-200',
        text: styles.text || 'text-gray-900',
        badge: styles.badge || ''
    };

    return (
        <div
            className={`
        absolute inset-0 p-2 cursor-grab select-none overflow-hidden
        ${safeStyles.bg} ${safeStyles.border} ${safeStyles.text}
        ${isRounded ? 'rounded-2xl' : 'rounded-lg'}
        ${isDragging ? 'opacity-50 shadow-lg z-50' : 'shadow-sm'}
        border transition-all hover:shadow-md hover:z-10
      `}
            style={style}
        >
            {/* Badge */}
            {event.badge && (
                <span className={`absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded ${safeStyles.badge}`}>
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

// --- MANUAL DRAGGABLE EVENT ---
interface DraggableEventProps {
    event: CalendarEvent;
    style?: React.CSSProperties;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onMove: (id: string, newStart: Date) => void;
    weekDays: Date[];
}

const DraggableEvent: React.FC<DraggableEventProps> = ({ event, style: positionStyle, containerRef, onMove, weekDays }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [originalRect, setOriginalRect] = useState<{ width: number; height: number } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        const cardRect = cardRef.current?.getBoundingClientRect();
        const gridRect = containerRef.current?.getBoundingClientRect();
        if (!cardRect || !gridRect) return;

        // Store original dimensions
        setOriginalRect({ width: cardRect.width, height: cardRect.height });

        // Calculate offset from click point to card top-left
        setDragOffset({
            x: e.clientX - cardRect.left,
            y: e.clientY - cardRect.top
        });

        // Set initial drag position (relative to grid container)
        setDragPosition({
            x: cardRect.left - gridRect.left - 60, // 60 is time column
            y: cardRect.top - gridRect.top
        });

        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const gridRect = containerRef.current?.getBoundingClientRect();
            if (!gridRect) return;

            const newX = e.clientX - gridRect.left - dragOffset.x - 60;
            const newY = e.clientY - gridRect.top - dragOffset.y;

            setDragPosition({ x: newX, y: newY });
        };

        const handleMouseUp = (e: MouseEvent) => {
            const gridRect = containerRef.current?.getBoundingClientRect();
            if (!gridRect) {
                setIsDragging(false);
                setDragPosition(null);
                return;
            }

            const relativeX = e.clientX - gridRect.left - dragOffset.x - 60;
            const relativeY = e.clientY - gridRect.top - dragOffset.y;

            // Calculate target day
            const dayWidth = (gridRect.width - 60) / weekDays.length;
            const dayIndex = Math.max(0, Math.min(weekDays.length - 1, Math.floor((relativeX + dayWidth / 2) / dayWidth)));
            const targetDay = weekDays[dayIndex];

            // Calculate target time (snap to 15 min)
            const minutesFromStart = Math.max(0, relativeY);
            const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
            const hours = Math.floor(snappedMinutes / 60) + START_HOUR;
            const mins = snappedMinutes % 60;

            const newStartDate = new Date(targetDay);
            newStartDate.setHours(hours, mins, 0, 0);

            setIsDragging(false);
            setDragPosition(null);
            onMove(event.id, newStartDate);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, containerRef, event.id, weekDays, onMove]);

    return (
        <>
            {/* Original card - stays in place, hidden during drag */}
            <div
                ref={cardRef}
                onMouseDown={handleMouseDown}
                className={`absolute cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
                style={positionStyle}
            >
                <EventCard event={event} isDragging={false} />
            </div>

            {/* Drag clone - follows cursor */}
            {isDragging && dragPosition && originalRect && (
                <div
                    className="fixed z-[9999] pointer-events-none opacity-90 shadow-2xl"
                    style={{
                        left: (containerRef.current?.getBoundingClientRect().left || 0) + 60 + dragPosition.x + 4,
                        top: (containerRef.current?.getBoundingClientRect().top || 0) + dragPosition.y,
                        width: (originalRect?.width || 100) - 8,
                        height: originalRect?.height,
                    }}
                >
                    <EventCard event={event} isDragging={true} />
                </div>
            )}
        </>
    );
};

// --- LEFT SIDEBAR (Tasks, Legend, Calendars) ---
interface LeftSidebarProps {
    calendars: any[];
    selectedCalendarIds: string[];
    onToggleCalendar: (id: string) => void;
    onLogin: () => void;
    tasks: Task[];
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ calendars, selectedCalendarIds, onToggleCalendar, onLogin, tasks }) => (
    <aside className="w-72 flex-shrink-0 space-y-4">
        {/* Pending Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Pending Tasks</h3>
            {tasks && tasks.length > 0 ? (
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {tasks.slice(0, 5).map((task, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('task', JSON.stringify(task));
                                e.dataTransfer.effectAllowed = 'copy';
                            }}
                        >
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
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [dbTasks, setDbTasks] = useState<Task[]>([]);
    const [currentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('week');
    const [calendars, setCalendars] = useState<any[]>([]);
    const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
    const gridRef = useRef<HTMLDivElement>(null);

    // Filter tasks that aren't on calendar yet (for sidebar)
    const pendingTasks = dbTasks.filter(t => !t.is_completed);

    // View days configuration
    const weekDays = useMemo(() => {
        let days = 7;
        if (viewMode === 'day') days = 1;
        if (viewMode === 'month') days = 30; // Show approx one month

        return Array.from({ length: days }, (_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart, viewMode]);

    // Fetch calendar events
    const fetchCalendarEvents = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/busy`);
            const formatted = res.data.map((item: any, index: number) => ({
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
        } catch (err: any) {
            console.error("Calendar API Error:", err);
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

        const demoEvents: CalendarEvent[] = [
            // Monday events
            {
                id: 'demo-1',
                title: 'Data Viz Lab',
                time: '9:00 - 10:30 AM',
                start: setHours(tuesday, 9).toISOString(),
                end: setHours(setMinutes(tuesday, 30), 10).toISOString(),
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
                end: setHours(setMinutes(monday, 30), 11).toISOString(),
                eventType: EVENT_TYPES.LOCKED,
                badge: 'LOCKED',
                durationMinutes: 90,
            },
            {
                id: 'demo-3',
                title: 'Adv. Calculus II',
                time: '10:00 - 11:30 AM',
                start: setHours(tuesday, 10).toISOString(),
                end: setHours(setMinutes(tuesday, 30), 11).toISOString(),
                eventType: EVENT_TYPES.LOCKED,
                badge: 'LOCKED',
                durationMinutes: 90,
            },
            // Gap Filler
            {
                id: 'demo-4',
                title: 'Read: Transformers',
                time: '12:00 PM',
                start: setHours(monday, 12).toISOString(),
                end: setHours(setMinutes(monday, 45), 12).toISOString(),
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
                end: setHours(monday, 16).toISOString(),
                eventType: EVENT_TYPES.DEEP_WORK,
                highEnergy: true,
                durationMinutes: 120,
                collaborators: [{}, {}],
            },
            // AI Suggestion
            {
                id: 'demo-6',
                title: 'Neural Nets Study',
                time: '2:00 - 4:00 PM',
                start: setHours(wednesday, 14).toISOString(),
                end: setHours(wednesday, 16).toISOString(),
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
                const primaryIds = res.data.filter((c: any) => c.primary).map((c: any) => c.id);
                setSelectedCalendarIds(primaryIds.length > 0 ? primaryIds : [res.data[0].id]);
            }
        } catch (err) {
            console.error("Failed to fetch calendars:", err);
        }
    }, [selectedCalendarIds.length]);

    // Toggle calendar selection
    const toggleCalendar = (calId: string) => {
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


    // Handle moving an event
    const handleMoveEvent = (eventId: string, newStart: Date) => {
        setCalendarEvents(prev => prev.map(e => {
            if (e.id === eventId) {
                const duration = e.durationMinutes || 60;
                const newEnd = new Date(newStart.getTime() + duration * 60000);
                return {
                    ...e,
                    start: newStart.toISOString(),
                    end: newEnd.toISOString(),
                    time: `${format(newStart, 'h:mm a')} - ${format(newEnd, 'h:mm a')}`,
                };
            }
            return e;
        }));
    };

    // Handle dropping a task from sidebar
    const handleDropTask = async (e: React.DragEvent) => {
        e.preventDefault();
        const taskData = e.dataTransfer.getData('task');
        if (!taskData || !gridRef.current) return;

        const task = JSON.parse(taskData);
        const gridRect = gridRef.current.getBoundingClientRect();

        const relativeX = e.clientX - gridRect.left - 60;
        const relativeY = e.clientY - gridRect.top;

        // Calculate Day
        const dayWidth = (gridRect.width - 60) / weekDays.length;
        const dayIndex = Math.max(0, Math.min(weekDays.length - 1, Math.floor(relativeX / dayWidth)));
        const targetDay = weekDays[dayIndex];

        // Calculate Time
        const snappedMinutes = Math.round(Math.max(0, relativeY) / 15) * 15;
        const hours = Math.floor(snappedMinutes / 60) + START_HOUR;
        const mins = snappedMinutes % 60;

        const newStartDate = new Date(targetDay);
        newStartDate.setHours(hours, mins, 0, 0);
        const newEndDate = new Date(newStartDate.getTime() + (task.estimated_minutes || 60) * 60000);

        const newEvent: CalendarEvent = {
            id: `task-event-${task.id}`,
            title: task.title,
            start: newStartDate.toISOString(),
            end: newEndDate.toISOString(),
            time: `${format(newStartDate, 'h:mm a')} - ${format(newEndDate, 'h:mm a')}`,
            eventType: EVENT_TYPES.AI_SUGGESTION,
            durationMinutes: task.estimated_minutes || 60,
            badge: 'NEW',
        };

        setCalendarEvents(prev => [...prev, newEvent]);

        // Optionally update backend
        try {
            await axios.put(`${API_URL}/tasks/${task.id}`, {
                deadline: newStartDate.toISOString()
            });
        } catch (err) {
            console.error("Failed to update task deadline:", err);
        }
    };


    // Login redirect
    const handleLogin = () => window.location.href = `${API_URL}/login`;

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

            {/* Main Content */}
            <div className="pt-20 px-4 lg:px-6 pb-8 relative z-10">
                <div className="w-full max-w-[1920px] mx-auto flex flex-col xl:flex-row gap-6">
                    {/* Left Sidebar */}
                    <LeftSidebar
                        calendars={calendars}
                        selectedCalendarIds={selectedCalendarIds}
                        onToggleCalendar={toggleCalendar}
                        onLogin={handleLogin}
                        tasks={pendingTasks}
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
                        <div
                            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto relative"
                            ref={gridRef}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDropTask}
                        >
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
                                        {weekDays.map((_, dayIndex) => (
                                            <div key={dayIndex} className="border-l border-gray-100 h-full" />
                                        ))}
                                    </div>
                                ))}

                                {/* Events Layer - positioned absolutely on top of the grid */}
                                <div
                                    className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
                                    style={{ marginLeft: '60px' }} // Offset for time column
                                >
                                    <div className="relative h-full pointer-events-none">
                                        {calendarEvents.map((event) => {
                                            const eventStart = parseISO(event.start);
                                            const startHour = eventStart.getHours();
                                            const startMinutes = eventStart.getMinutes();
                                            const duration = event.durationMinutes || 60;

                                            // Calculate Day Index
                                            const dayIndex = weekDays.findIndex(d => isSameDay(d, eventStart));
                                            if (dayIndex === -1) return null;

                                            const dayWidth = 100 / weekDays.length;
                                            const leftPercent = dayIndex * dayWidth;

                                            // Calculate position relative to START_HOUR
                                            const hoursFromStart = startHour - START_HOUR;
                                            const topOffset = (hoursFromStart * 60 + startMinutes);
                                            const height = duration;

                                            if (startHour < START_HOUR || startHour >= END_HOUR) return null;

                                            return (
                                                <DraggableEvent
                                                    key={event.id}
                                                    event={event}
                                                    containerRef={gridRef}
                                                    onMove={handleMoveEvent}
                                                    weekDays={weekDays}
                                                    style={{
                                                        left: `calc(${leftPercent}% + 4px)`,
                                                        width: `calc(${dayWidth}% - 8px)`,
                                                        top: `${topOffset}px`,
                                                        height: `${Math.max(height, 30)}px`,
                                                        pointerEvents: 'auto',
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
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
