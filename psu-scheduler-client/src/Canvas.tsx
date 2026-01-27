import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, differenceInDays, isPast } from 'date-fns';
import { Task, WorkType } from './types';

// --- CONFIG ---
const API_URL = import.meta.env.PROD ? "/aevum" : (import.meta.env.VITE_API_URL || "http://localhost:8000");
axios.defaults.withCredentials = true;

// --- SVG ICONS ---
const PushpinIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-20 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-md border border-amber-600/30" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-gray-400" />
    </div>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AlertIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const InboxIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
);



const XIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- TASK CARD COMPONENT (on canvas) ---
interface TaskCardProps {
    task: Task;
    onDelete: (id: number) => void;
    onToggleComplete: (id: number, isCompleted: boolean) => void;
    onPositionChange: (id: number, x: number, y: number) => void;
    onRemove: (id: number) => void;
    canvasRef: React.RefObject<HTMLDivElement | null>;
}

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onDelete,
    onToggleComplete,
    onPositionChange,
    onRemove,
    canvasRef,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return; // Don't drag when clicking buttons

        e.preventDefault();
        setIsDragging(true);

        const cardRect = cardRef.current?.getBoundingClientRect();
        if (cardRect) {
            setDragOffset({
                x: e.clientX - cardRect.left,
                y: e.clientY - cardRect.top
            });
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const canvasRect = canvasRef?.current?.getBoundingClientRect();
            if (!canvasRect) return;

            let newX = e.clientX - canvasRect.left - dragOffset.x;
            let newY = e.clientY - canvasRect.top - dragOffset.y;

            // Clamp to canvas bounds
            const cardWidth = cardRef.current?.offsetWidth || 208;
            const cardHeight = cardRef.current?.offsetHeight || 150;
            newX = Math.max(0, Math.min(newX, canvasRect.width - cardWidth));
            newY = Math.max(0, Math.min(newY, canvasRect.height - cardHeight));

            onPositionChange(task.id, newX, newY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, canvasRef, onPositionChange, task.id]);

    const isCompleted = task.is_completed;

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
                opacity: isCompleted ? 0.6 : 1,
                scale: isDragging ? 1.05 : 1,
            }}
            transition={{ duration: 0.15 }}
            onMouseDown={handleMouseDown}
            className={`absolute w-52 select-none ${isDragging ? 'z-[1000] cursor-grabbing' : 'z-10 cursor-grab'}`}
            style={{
                left: task.x,
                top: task.y,
                transform: `rotate(${task.rotation || 0}deg)`,
            }}
        >
            <div
                className={`relative bg-white rounded-sm shadow-lg group ${isCompleted ? 'opacity-60' : ''}`}
                style={{ boxShadow: isDragging ? '0 8px 30px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)' }}
            >
                {/* Remove Button (top right) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(task.id); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors z-20 opacity-0 group-hover:opacity-100"
                    title="Remove from Canvas"
                >
                    <XIcon className="w-3 h-3" />
                </button>
                <PushpinIcon />

                <div className="p-4 pt-5">
                    {/* Checkbox + Title */}
                    <div className="flex items-start gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id, !isCompleted); }}
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-orange-400'
                                }`}
                        >
                            {isCompleted && <CheckIcon />}
                        </button>
                        <h3 className={`font-medium text-gray-900 text-sm leading-tight ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                        </h3>
                    </div>

                    {/* Time/Duration */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>{task.estimated_minutes || 30} min</span>
                        {task.deadline && (
                            <>
                                <span>•</span>
                                <span className={isToday(parseISO(task.deadline)) ? 'text-orange-600 font-medium' : ''}>
                                    {isToday(parseISO(task.deadline)) ? 'Today' :
                                        isTomorrow(parseISO(task.deadline)) ? 'Tomorrow' :
                                            format(parseISO(task.deadline), 'MMM d')}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Work Type Badge */}
                    <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded ${task.work_type === WorkType.DEEP_WORK
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {task.work_type === WorkType.DEEP_WORK ? '🧠 Focus' : '📋 Quick'}
                        </span>
                    </div>
                </div>

                {/* Delete Button (hover) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className="absolute bottom-2 right-2 p-1.5 opacity-0 hover:opacity-100 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded transition-all"
                >
                    <TrashIcon />
                </button>
            </div>
        </motion.div>
    );
};

// --- LEFT SIDEBAR ---
interface LeftSidebarProps {
    nextTask?: Task;
    criticalTasks: Task[];
    calendars: any[];
    selectedCalendarIds: string[];
    onToggleCalendar: (id: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ nextTask, criticalTasks, calendars, selectedCalendarIds, onToggleCalendar }) => (
    <aside className="w-72 flex-shrink-0 space-y-4">
        {/* Up Next */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <ClockIcon /> Up Next
            </h3>
            {nextTask ? (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <h4 className="font-medium text-gray-900 text-sm">{nextTask.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{nextTask.estimated_minutes || 30} min</span>
                        {nextTask.deadline && (
                            <>
                                <span>•</span>
                                <span className="text-orange-600 font-medium">
                                    {isToday(parseISO(nextTask.deadline)) ? 'Today' : format(parseISO(nextTask.deadline), 'MMM d')}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-2">No tasks scheduled</p>
            )}
        </div>

        {/* Critical Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <AlertIcon /> <span className="text-red-600">Critical</span>
            </h3>
            {criticalTasks && criticalTasks.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {criticalTasks.map((task, i) => {
                        const daysUntil = task.deadline ? differenceInDays(parseISO(task.deadline), new Date()) : null;
                        const isOverdue = task.deadline && isPast(parseISO(task.deadline)) && !isToday(parseISO(task.deadline));
                        return (
                            <div key={i} className={`p-2 rounded-lg text-sm ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-100'}`}>
                                <div className="font-medium text-gray-900 truncate">{task.title}</div>
                                <div className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-semibold' : 'text-amber-600'}`}>
                                    {isOverdue ? 'OVERDUE' :
                                        daysUntil === 0 ? 'Due today' :
                                            daysUntil === 1 ? 'Due tomorrow' :
                                                `Due in ${daysUntil} days`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-2">No critical tasks</p>
            )}
        </div>

        {/* Calendar Sources */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <CalendarIcon /> Calendars
            </h3>
            {calendars.length > 0 ? (
                <div className="space-y-2 max-h-[120px] overflow-y-auto">
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
                    <p className="text-sm text-gray-500 mb-2">No calendars</p>
                    <a
                        href={`${API_URL}/login`}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                    >
                        Connect Google
                    </a>
                </div>
            )}
        </div>
    </aside>
);

// --- RIGHT SIDEBAR (Backlog) ---
interface RightSidebarProps {
    backlogTasks: Task[];
    onAddToCanvas: (task: Task) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ backlogTasks, onAddToCanvas }) => {
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    return (
        <aside className="w-72 flex-shrink-0">
            <div className="sticky top-24">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 text-sm">
                        <InboxIcon /> Backlog
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">Tasks without deadlines</p>

                    {backlogTasks && backlogTasks.length > 0 ? (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {backlogTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="relative p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all cursor-pointer group"
                                    onMouseEnter={() => setHoveredId(task.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => onAddToCanvas(task)}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('task', JSON.stringify(task));
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                >
                                    <h4 className="font-medium text-gray-900 text-sm pr-6">{task.title}</h4>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>{task.estimated_minutes || 30} min</span>
                                        <span>•</span>
                                        <span className={task.work_type === WorkType.DEEP_WORK ? 'text-orange-600' : 'text-gray-500'}>
                                            {task.work_type === WorkType.DEEP_WORK ? 'Focus' : 'Quick'}
                                        </span>
                                    </div>

                                    {/* Add button on hover */}
                                    <button
                                        className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white transition-all ${hoveredId === task.id ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToCanvas(task);
                                        }}
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <InboxIcon />
                            <p className="text-sm mt-2">No backlog tasks</p>
                            <p className="text-xs text-gray-400 mt-1">Tasks without deadlines appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

// --- MAIN CANVAS COMPONENT ---
function Canvas() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [calendars, setCalendars] = useState<any[]>([]);
    const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    // Setup demo tasks
    const setupDemoTasks = () => {
        const today = new Date().toISOString();
        const tomorrow = new Date(Date.now() + 86400000).toISOString();

        // Canvas tasks (with deadlines)
        const canvasTasks: Task[] = [
            { id: 9001, title: 'Check inbox', estimated_minutes: 15, priority: 1, work_type: WorkType.SHALLOW_WORK, deadline: today, x: 100, y: 120, rotation: -1, is_completed: false },
            { id: 9002, title: 'Do laundry', estimated_minutes: 45, priority: 1, work_type: WorkType.SHALLOW_WORK, deadline: today, x: 340, y: 100, rotation: 2, is_completed: false },
            { id: 9003, title: 'Review project notes', estimated_minutes: 30, priority: 1, work_type: WorkType.DEEP_WORK, deadline: today, x: 150, y: 300, rotation: 1, is_completed: false },
            { id: 9004, title: 'Call mom', estimated_minutes: 20, priority: 1, work_type: WorkType.SHALLOW_WORK, deadline: today, x: 380, y: 280, rotation: -1, is_completed: false },
            { id: 9005, title: 'Study for exam', estimated_minutes: 90, priority: 1, work_type: WorkType.DEEP_WORK, deadline: tomorrow, x: 200, y: 460, rotation: -2, is_completed: false },
        ];

        // Backlog tasks (no deadline)
        const backlogTasksData: Task[] = [
            { id: 9101, title: 'Organize bookshelf', estimated_minutes: 60, priority: 1, work_type: WorkType.SHALLOW_WORK, deadline: "", is_completed: false },
            { id: 9102, title: 'Learn new recipe', estimated_minutes: 45, priority: 1, work_type: WorkType.SHALLOW_WORK, deadline: "", is_completed: false },
            { id: 9103, title: 'Clean garage', estimated_minutes: 120, priority: 1, work_type: WorkType.SHALLOW_WORK, deadline: "", is_completed: false },
            { id: 9104, title: 'Read that book', estimated_minutes: 60, priority: 1, work_type: WorkType.DEEP_WORK, deadline: "", is_completed: false },
        ];

        // Critical tasks
        const criticalDemoTasks: Task[] = [
            { id: 9201, title: 'Pay electric bill', estimated_minutes: 10, priority: 1, work_type: WorkType.SHALLOW_WORK, deadline: today, is_completed: false },
            { id: 9202, title: 'Submit report', estimated_minutes: 30, priority: 1, work_type: WorkType.DEEP_WORK, deadline: tomorrow, is_completed: false },
        ];

        setTasks(canvasTasks);
        setAllTasks([...canvasTasks, ...backlogTasksData, ...criticalDemoTasks]);
    };

    // Fetch all tasks from API
    const fetchTasks = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/tasks`, {
                params: { include_completed: true }
            });

            setAllTasks(res.data);

            // Filter to today's tasks or upcoming tasks for canvas display
            const todayTasks = res.data.filter((task: Task) => {
                if (!task.deadline) return false; // Backlog tasks go to right sidebar
                const deadline = parseISO(task.deadline);
                return isToday(deadline) || isTomorrow(deadline);
            });

            const tasksWithPositions = todayTasks.map((task: Task, index: number) => ({
                ...task,
                x: task.canvas_x || 100 + (index % 4) * 220,
                y: task.canvas_y || 100 + Math.floor(index / 4) * 180,
                rotation: (Math.random() * 4 - 2),
            }));

            setTasks(tasksWithPositions);
        } catch (err) {
            console.error("Failed to fetch tasks, using demo data");
            setupDemoTasks(); // Use demo tasks with valid fields
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
        fetchCalendars();
    }, [fetchTasks, fetchCalendars]);

    // Get backlog tasks (no deadline)
    const backlogTasks = allTasks.filter(t => !t.deadline && !t.is_completed);

    // Get critical tasks (approaching deadlines, within 3 days)
    const criticalTasks = allTasks.filter(t => {
        if (!t.deadline || t.is_completed) return false;
        const deadline = parseISO(t.deadline);
        const daysUntil = differenceInDays(deadline, new Date());
        return daysUntil <= 3;
    }).sort((a, b) => {
        const da = a.deadline ? parseISO(a.deadline).getTime() : 0;
        const db = b.deadline ? parseISO(b.deadline).getTime() : 0;
        return da - db;
    });

    // Get next task
    const nextTask = allTasks
        .filter(t => t.deadline && !t.is_completed)
        .sort((a, b) => {
            const da = a.deadline ? parseISO(a.deadline).getTime() : 0;
            const db = b.deadline ? parseISO(b.deadline).getTime() : 0;
            return da - db;
        })[0];

    // Handle position change
    const handlePositionChange = (id: number, x: number, y: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
    };

    // Handle delete
    const handleDelete = async (taskId: number) => {
        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`);
        } catch (err) {
            console.log("API delete failed, removing from UI");
        }
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setAllTasks(prev => prev.filter(t => t.id !== taskId));
    };

    // Handle toggle complete
    const handleToggleComplete = async (taskId: number, isCompleted: boolean) => {
        try {
            await axios.put(`${API_URL}/tasks/${taskId}`, { is_completed: isCompleted });
        } catch (err) {
            console.log("API update failed, updating UI only");
        }
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: isCompleted } : t));
        setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: isCompleted } : t));
    };

    // Handle remove from canvas (move to backlog)
    const handleRemoveFromCanvas = async (taskId: number) => {
        try {
            // Only update API if it's a real task (not demo/local)
            if (taskId < 9000) { // Assuming demo tasks > 9000
                await axios.put(`${API_URL}/tasks/${taskId}`, { deadline: null });
            }
        } catch (err) {
            console.log("API update failed");
        }

        // Remove from canvas tasks
        setTasks(prev => prev.filter(t => t.id !== taskId));

        // Update in allTasks (remove deadline)
        setAllTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, deadline: "" } : t
        ));
    };

    // Toggle calendar
    const toggleCalendar = (calId: string) => {
        setSelectedCalendarIds(prev =>
            prev.includes(calId) ? prev.filter(id => id !== calId) : [...prev, calId]
        );
    };

    // Add task from backlog to canvas
    const handleAddToCanvas = (task: Task) => {
        // Add to canvas with position
        const newCanvasTask = {
            ...task,
            deadline: new Date().toISOString(), // Set deadline to today
            x: task.x !== undefined ? task.x : 100 + Math.random() * 400,
            y: task.y !== undefined ? task.y : 100 + Math.random() * 300,
            rotation: Math.random() * 4 - 2,
        };

        setTasks(prev => [...prev, newCanvasTask]);

        // Update allTasks to reflect the deadline change
        setAllTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, deadline: new Date().toISOString() } : t
        ));
    };

    // Handle canvas drop
    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const taskData = e.dataTransfer.getData('task');
        if (taskData) {
            const task = JSON.parse(taskData);
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (!canvasRect) return;

            const droppedX = e.clientX - canvasRect.left;
            const droppedY = e.clientY - canvasRect.top;

            const newCanvasTask = {
                ...task,
                deadline: new Date().toISOString(),
                x: droppedX - 100, // Approximate center
                y: droppedY - 50,
                rotation: Math.random() * 4 - 2,
            };

            setTasks(prev => {
                if (prev.find(t => t.id === task.id)) return prev;
                return [...prev, newCanvasTask];
            });

            // Update allTasks to reflect the deadline change
            setAllTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, deadline: new Date().toISOString() } : t
            ));
        }
    };


    return (
        <div className="min-h-screen relative flex flex-col bg-[#FFFBF7] overflow-hidden">
            {/* Dot Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none z-0 opacity-40"
                style={{
                    backgroundImage: `radial-gradient(circle, #d4d4d4 1.5px, transparent 1.5px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Note: Header is handled in App.tsx layout now, or we can keep minimal UI controls here */}

            {/* Main Content Area */}
            <div className="flex-1 flex pt-20 px-6 pb-6 z-10 overflow-hidden">
                <LeftSidebar
                    nextTask={nextTask}
                    criticalTasks={criticalTasks}
                    calendars={calendars}
                    selectedCalendarIds={selectedCalendarIds}
                    onToggleCalendar={toggleCalendar}
                />

                {/* Canvas Area */}
                <main className="flex-1 mx-6 relative rounded-3xl border border-gray-200 shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden"
                    ref={canvasRef}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleCanvasDrop}
                >
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[120px] font-serif text-gray-100/60 select-none">
                            Focus
                        </span>
                    </div>

                    {/* Tasks */}
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            canvasRef={canvasRef}
                            onDelete={handleDelete}
                            onToggleComplete={handleToggleComplete}
                            onPositionChange={handlePositionChange}
                            onRemove={handleRemoveFromCanvas}
                        />
                    ))}

                    {tasks.length === 0 && !isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <PlusIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Drag tasks here from the backlog</p>
                            </div>
                        </div>
                    )}
                </main>

                <RightSidebar backlogTasks={backlogTasks} onAddToCanvas={handleAddToCanvas} />
            </div>
        </div>
    );
}

export default Canvas;
