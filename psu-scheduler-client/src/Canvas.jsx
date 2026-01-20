import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, differenceInDays, isPast } from 'date-fns';

// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
axios.defaults.withCredentials = true;

// --- WORK TYPES ---
const WORK_TYPES = {
    DEEP_WORK: "Deep Work",
    SHALLOW_WORK: "Shallow Work"
};

// --- SVG ICONS ---
const PushpinIcon = ({ className = "" }) => (
    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-20 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-md border border-amber-600/30" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-gray-400" />
    </div>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
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

const BellIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const XIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- TASK CARD COMPONENT (on canvas) ---
const TaskCard = ({
    task,
    onDelete,
    onToggleComplete,
    onPositionChange,
    onRemove,
    canvasRef,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target.closest('button')) return; // Don't drag when clicking buttons

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

        const handleMouseMove = (e) => {
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
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded ${task.work_type === WORK_TYPES.DEEP_WORK
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {task.work_type === WORK_TYPES.DEEP_WORK ? '🧠 Focus' : '📋 Quick'}
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

// --- WATERMARK TEXT ---
const WatermarkText = ({ text, x, y }) => (
    <div className="absolute pointer-events-none select-none" style={{ left: x, top: y }}>
        <span className="text-[80px] text-gray-200/50 font-light tracking-wide">
            {text}
        </span>
    </div>
);


// --- HEADER COMPONENT ---
const CanvasHeader = ({ onRegenerate, isOptimizing }) => (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                A
            </div>
            <span className="font-semibold text-gray-900 text-lg tracking-tight">Aevum</span>
        </div>

        <div className="flex items-center gap-4">
            <button
                onClick={onRegenerate}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isOptimizing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Optimizing...
                    </>
                ) : (
                    <>
                        <RefreshIcon /> Regenerate
                    </>
                )}
            </button>

            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300" />
        </div>
    </header>
);


// --- LEFT SIDEBAR ---
const LeftSidebar = ({ nextTask, criticalTasks, calendars, selectedCalendarIds, onToggleCalendar }) => (
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
const RightSidebar = ({ backlogTasks, onAddToCanvas }) => {
    const [hoveredId, setHoveredId] = useState(null);

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
                                        <span className={task.work_type === WORK_TYPES.DEEP_WORK ? 'text-orange-600' : 'text-gray-500'}>
                                            {task.work_type === WORK_TYPES.DEEP_WORK ? 'Focus' : 'Quick'}
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


// --- AI ASSISTANT COMMAND BAR ---
const AIAssistantBar = ({ onAddTask, onOptimize, onMoveTask }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hi! I'm your AI assistant. Ask me to help organize your tasks or suggest optimizations." }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { role: 'user', text: inputValue }]);

        const lowerInput = inputValue.toLowerCase();

        // Basic Agent Parsing Simulation
        if (lowerInput.includes('optimize') || lowerInput.includes('schedule')) {
            if (onOptimize) onOptimize();
            setTimeout(() => setMessages(prev => [...prev, { role: 'assistant', text: "I'm optimizing your schedule now..." }]), 500);
        }
        else if (lowerInput.startsWith('add ')) {
            const title = inputValue.substring(4);
            if (onAddTask) onAddTask({ title });
            setTimeout(() => setMessages(prev => [...prev, { role: 'assistant', text: `I've added "${title}" to your tasks.` }]), 500);
        }
        else if (lowerInput.includes('move')) {
            setTimeout(() => setMessages(prev => [...prev, { role: 'assistant', text: "I can help with that! You can also drag and drop tasks on the canvas." }]), 500);
        }
        else {
            // Simulate AI response
            setTimeout(() => setMessages(prev => [...prev, {
                role: 'assistant',
                text: `I'll help you with "${inputValue}". Let me analyze your schedule...`
            }]), 1000);
        }

        setInputValue('');
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-3 w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    >
                        {/* Chat Messages - scrollable from bottom */}
                        <div className="h-[300px] overflow-y-auto flex flex-col-reverse p-4">
                            <div className="space-y-3">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-orange-500 text-white rounded-br-sm'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Command Bar Input */}
            <motion.form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 bg-white rounded-full shadow-xl border border-gray-200 px-4 py-2"
                style={{ width: isExpanded ? '500px' : '400px' }}
                layout
            >
                {/* AI Icon */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>

                <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    placeholder="Ask AI to help organize your day..."
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                />

                <button
                    type="submit"
                    className="p-2 text-orange-500 hover:text-orange-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </motion.form>
        </div>
    );
};

// --- MAIN CANVAS COMPONENT ---
function Canvas() {
    const canvasRef = useRef(null);
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendarIds, setSelectedCalendarIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

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

    // Fetch all tasks from API
    const fetchTasks = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/tasks`, {
                params: { include_completed: true }
            });

            setAllTasks(res.data);

            // Filter to today's tasks or upcoming tasks for canvas display
            const todayTasks = res.data.filter(task => {
                if (!task.deadline) return false; // Backlog tasks go to right sidebar
                const deadline = parseISO(task.deadline);
                return isToday(deadline) || isTomorrow(deadline);
            });

            const tasksWithPositions = todayTasks.map((task, index) => ({
                ...task,
                x: task.canvas_x || 100 + (index % 4) * 220,
                y: task.canvas_y || 100 + Math.floor(index / 4) * 180,
                rotation: (Math.random() * 4 - 2),
            }));

            setTasks(tasksWithPositions);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
            setupDemoTasks();
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Demo tasks - simple everyday tasks
    const setupDemoTasks = () => {
        const today = new Date().toISOString();
        const tomorrow = new Date(Date.now() + 86400000).toISOString();
        const twoDays = new Date(Date.now() + 2 * 86400000).toISOString();

        // Canvas tasks (with deadlines)
        const canvasTasks = [
            { id: 'demo-1', title: 'Check inbox', estimated_minutes: 15, work_type: WORK_TYPES.SHALLOW_WORK, deadline: today, x: 100, y: 120, rotation: -1, is_completed: false },
            { id: 'demo-2', title: 'Do laundry', estimated_minutes: 45, work_type: WORK_TYPES.SHALLOW_WORK, deadline: today, x: 340, y: 100, rotation: 2, is_completed: false },
            { id: 'demo-3', title: 'Review project notes', estimated_minutes: 30, work_type: WORK_TYPES.DEEP_WORK, deadline: today, x: 150, y: 300, rotation: 1, is_completed: false },
            { id: 'demo-4', title: 'Call mom', estimated_minutes: 20, work_type: WORK_TYPES.SHALLOW_WORK, deadline: today, x: 380, y: 280, rotation: -1, is_completed: false },
            { id: 'demo-5', title: 'Study for exam', estimated_minutes: 90, work_type: WORK_TYPES.DEEP_WORK, deadline: tomorrow, x: 200, y: 460, rotation: -2, is_completed: false },
        ];

        // Backlog tasks (no deadline)
        const backlogTasks = [
            { id: 'backlog-1', title: 'Organize bookshelf', estimated_minutes: 60, work_type: WORK_TYPES.SHALLOW_WORK, deadline: null, is_completed: false },
            { id: 'backlog-2', title: 'Learn new recipe', estimated_minutes: 45, work_type: WORK_TYPES.SHALLOW_WORK, deadline: null, is_completed: false },
            { id: 'backlog-3', title: 'Clean garage', estimated_minutes: 120, work_type: WORK_TYPES.SHALLOW_WORK, deadline: null, is_completed: false },
            { id: 'backlog-4', title: 'Read that book', estimated_minutes: 60, work_type: WORK_TYPES.DEEP_WORK, deadline: null, is_completed: false },
        ];

        // Critical tasks (with approaching deadlines)
        const criticalDemoTasks = [
            { id: 'critical-1', title: 'Pay electric bill', estimated_minutes: 10, work_type: WORK_TYPES.SHALLOW_WORK, deadline: today, is_completed: false },
            { id: 'critical-2', title: 'Submit report', estimated_minutes: 30, work_type: WORK_TYPES.DEEP_WORK, deadline: tomorrow, is_completed: false },
        ];

        setTasks(canvasTasks);
        setAllTasks([...canvasTasks, ...backlogTasks, ...criticalDemoTasks]);
    };

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
    }).sort((a, b) => parseISO(a.deadline) - parseISO(b.deadline));

    // Get next task (earliest deadline that's not completed)
    const nextTask = allTasks
        .filter(t => t.deadline && !t.is_completed)
        .sort((a, b) => parseISO(a.deadline) - parseISO(b.deadline))[0];

    // Handle position change
    const handlePositionChange = (id, x, y) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
    };

    // Handle delete
    const handleDelete = async (taskId) => {
        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`);
        } catch (err) {
            console.log("API delete failed, removing from UI");
        }
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setAllTasks(prev => prev.filter(t => t.id !== taskId));
    };

    // Handle toggle complete
    const handleToggleComplete = async (taskId, isCompleted) => {
        try {
            await axios.put(`${API_URL}/tasks/${taskId}`, { is_completed: isCompleted });
        } catch (err) {
            console.log("API update failed, updating UI only");
        }
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: isCompleted } : t));
        setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: isCompleted } : t));
    };

    // Handle remove from canvas (move to backlog)
    const handleRemoveFromCanvas = async (taskId) => {
        try {
            // Optimistic update
            const updatedTask = allTasks.find(t => t.id === taskId);
            // Only update API if it's a real task (not demo/local)
            if (updatedTask && !updatedTask.id.toString().startsWith('demo') && !updatedTask.id.toString().startsWith('local')) {
                await axios.put(`${API_URL}/tasks/${taskId}`, { deadline: null });
            }
        } catch (err) {
            console.log("API update failed");
        }

        // Remove from canvas tasks
        setTasks(prev => prev.filter(t => t.id !== taskId));

        // Update in allTasks (remove deadline)
        setAllTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, deadline: null } : t
        ));
    };

    // Toggle calendar
    const toggleCalendar = (calId) => {
        setSelectedCalendarIds(prev =>
            prev.includes(calId) ? prev.filter(id => id !== calId) : [...prev, calId]
        );
    };

    // Add task from backlog to canvas
    const handleAddToCanvas = (task) => {
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

    // Optimize
    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            await axios.post(`${API_URL}/optimize/from-db`);
            await fetchTasks();
        } catch (err) {
            console.error("Optimization failed:", err);
        } finally {
            setIsOptimizing(false);
        }
    };

    // Programmatic add task (Agentic)
    const addTask = async (taskData) => {
        const newTask = {
            title: taskData.title || "New Task",
            estimated_minutes: taskData.estimated_minutes || 30,
            priority: 5,
            deadline: new Date().toISOString(),
            work_type: WORK_TYPES.SHALLOW_WORK,
            ...taskData
        };

        try {
            const res = await axios.post(`${API_URL}/tasks`, newTask);
            const taskWithPosition = {
                ...res.data,
                x: 100 + Math.random() * 400,
                y: 100 + Math.random() * 300,
                rotation: Math.random() * 4 - 2,
            };
            setTasks(prev => [...prev, taskWithPosition]);
            setAllTasks(prev => [...prev, res.data]);
        } catch (err) {
            // Add locally if API fails
            const localTask = {
                id: `local-${Date.now()}`,
                ...newTask,
                x: 100 + Math.random() * 400,
                y: 100 + Math.random() * 300,
                rotation: Math.random() * 4 - 2,
                is_completed: false,
            };
            setTasks(prev => [...prev, localTask]);
            setAllTasks(prev => [...prev, localTask]);
        }
    };

    // Handle canvas drop
    const handleCanvasDrop = (e) => {
        e.preventDefault();
        const taskData = e.dataTransfer.getData('task');
        if (taskData) {
            const task = JSON.parse(taskData);
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (canvasRect) {
                const x = e.clientX - canvasRect.left;
                const y = e.clientY - canvasRect.top;
                handleAddToCanvas({ ...task, x, y });
            }
        }
    };

    // Add new task
    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;

        const newTask = {
            title: newTaskTitle,
            estimated_minutes: 30,
            priority: 5,
            deadline: new Date().toISOString(),
            work_type: WORK_TYPES.SHALLOW_WORK,
        };

        try {
            const res = await axios.post(`${API_URL}/tasks`, newTask);
            const taskWithPosition = {
                ...res.data,
                x: 100 + Math.random() * 400,
                y: 100 + Math.random() * 300,
                rotation: Math.random() * 4 - 2,
            };
            setTasks(prev => [...prev, taskWithPosition]);
            setAllTasks(prev => [...prev, res.data]);
        } catch (err) {
            // Add locally if API fails
            const localTask = {
                id: `local-${Date.now()}`,
                ...newTask,
                x: 100 + Math.random() * 400,
                y: 100 + Math.random() * 300,
                rotation: Math.random() * 4 - 2,
                is_completed: false,
            };
            setTasks(prev => [...prev, localTask]);
            setAllTasks(prev => [...prev, localTask]);
        }

        setNewTaskTitle('');
        setShowAddModal(false);
    };


    return (
        <div className="relative min-h-screen bg-[#FAFAF8]">
            {/* Dot Grid Background */}
            <div
                className="fixed inset-0 pointer-events-none z-[-1]"
                style={{
                    backgroundImage: `radial-gradient(circle, #e5e5e5 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                }}
            />


            {/* Main Layout */}
            <div className="pt-20 px-6 pb-8">
                <div className="max-w-[1600px] mx-auto flex gap-6">
                    {/* Left Sidebar */}
                    <LeftSidebar
                        nextTask={nextTask}
                        criticalTasks={criticalTasks}
                        calendars={calendars}
                        selectedCalendarIds={selectedCalendarIds}
                        onToggleCalendar={toggleCalendar}
                    />

                    {/* Canvas Area */}
                    <main className="flex-grow">
                        {/* Title */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Today's Canvas</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {format(new Date(), 'EEEE, MMMM d, yyyy')} • Drag tasks to organize
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" /> Add Task
                            </button>
                        </div>

                        {/* Canvas Board */}
                        <div
                            ref={canvasRef}
                            className="relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                            style={{ minHeight: '550px' }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleCanvasDrop}
                        >
                            {/* Watermarks */}
                            <WatermarkText text="Today" x={40} y={20} />
                            <WatermarkText text="Focus" x={500} y={350} />

                            {/* Task Cards */}
                            {tasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onDelete={handleDelete}
                                    onToggleComplete={handleToggleComplete}
                                    onPositionChange={handlePositionChange}
                                    onRemove={handleRemoveFromCanvas}
                                    canvasRef={canvasRef}
                                />
                            ))}

                            {/* Empty State */}
                            {tasks.length === 0 && !isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-gray-500 mb-4">No tasks for today</p>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                                        >
                                            Add your first task
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Drop zone indicator */}
                            <div className="absolute bottom-4 left-4 right-4 text-center text-sm text-gray-400 pointer-events-none">
                                Drag tasks from backlog to add them here
                            </div>
                        </div>
                    </main>

                    {/* Right Sidebar (Backlog) */}
                    <RightSidebar
                        backlogTasks={backlogTasks}
                        onAddToCanvas={handleAddToCanvas}
                    />
                </div>
            </div>




            {/* Add Task Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-lg font-semibold mb-4">Add Task</h2>
                            <input
                                type="text"
                                placeholder="What needs to be done?"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                                autoFocus
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddTask}
                                    className="flex-1 px-4 py-2 text-white bg-orange-500 rounded-lg text-sm font-medium hover:bg-orange-600"
                                >
                                    Add Task
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading State */}
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

export default Canvas;
