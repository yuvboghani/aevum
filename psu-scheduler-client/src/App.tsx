import { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Canvas from './Canvas';
import './Dock.css';
import { WorkType } from './types';

// Icons
const CalendarIcon = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const CanvasIcon = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
);

const SearchIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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



interface ViewProps {
    onRegenerate: () => void;
    isOptimizing: boolean;
    activeView: string;
    onViewChange: (view: string) => void;
}

// --- STATIC TOP BANNER ---
function AppHeader({ onRegenerate, isOptimizing, activeView, onViewChange }: ViewProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
            <div className="max-w-[1800px] mx-auto px-6 py-2 flex items-center justify-between h-[64px]">
                {/* Left: Logo & Search */}
                <div className="flex items-center gap-6 w-[300px]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">Aevum</span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="pl-10 pr-4 py-1.5 w-48 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                {/* Center: View Dock */}
                <div className="flex-1 flex justify-center">
                    <ViewDock activeView={activeView} onViewChange={onViewChange} />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3 w-[300px]">
                    <button
                        onClick={onRegenerate}
                        disabled={isOptimizing}
                        className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors shadow-sm"
                    >
                        <RefreshIcon /> {isOptimizing ? 'Optimizing...' : 'Regenerate'}
                    </button>

                    <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <BellIcon />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white shadow-md cursor-pointer" />
                </div>
            </div>
        </header>
    );
}

interface AssistantProps {
    onAddTask: (task: any) => Promise<void>;
    onOptimize: () => void;
    onMoveTask?: () => void;
}

// --- STATIC AI ASSISTANT ---
function AIAssistantBar({ onAddTask: _onAddTask, onOptimize: _onOptimize, onMoveTask: _onMoveTask }: AssistantProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hi! I'm your AI assistant. Ask me to help organize your tasks or suggest optimizations." }
    ]);

    // Strictly enforce relative path in PROD to use the proxy, ignoring any auto-set env vars
    const API_URL = import.meta.env.PROD ? "/aevum" : (import.meta.env.VITE_API_URL || "http://localhost:8000");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setInputValue('');

        // Show loading state
        setMessages(prev => [...prev, { role: 'assistant', text: "Thinking..." }]);

        try {
            // Call Backend Protocol Buffer
            const response = await axios.post(`${API_URL}/ai/assist`, {
                prompt: userText,
                current_schedule: [], // Backend will fetch DB tasks if this is empty
                context: {
                    frontend_view: "tactical_tablet"
                }
            });

            // Remove "Thinking..." and show real response
            setMessages(prev => {
                const newMsgs = prev.filter(m => m.text !== "Thinking...");
                return [...newMsgs, {
                    role: 'assistant',
                    text: response.data.summary || "I processed your request."
                }];
            });

            // If suggestions exist, we might want to auto-refresh or notify
            if (response.data.task_suggestions?.length > 0) {
                // For now, simpler integration: just notify user
                // Future: Prompt to apply changes
            }

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => {
                const newMsgs = prev.filter(m => m.text !== "Thinking...");
                return [...newMsgs, {
                    role: 'assistant',
                    text: "Sorry, I couldn't connect to the AI service at the moment."
                }];
            });
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-3 w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    >
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

            <motion.form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 bg-white rounded-full shadow-xl border border-gray-200 px-4 py-2"
                animate={{ width: isExpanded ? 500 : 400 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                layout
            >
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
}


interface DockProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

// View Dock Navigation Component
function ViewDock({ activeView, onViewChange }: DockProps) {
    return (
        <div className="view-dock">
            <button
                className={`view-dock-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onViewChange('dashboard')}
            >
                <CalendarIcon />
                <span>Dashboard</span>
            </button>
            <button
                className={`view-dock-item ${activeView === 'canvas' ? 'active' : ''}`}
                onClick={() => onViewChange('canvas')}
            >
                <CanvasIcon />
                <span>Canvas</span>
            </button>
        </div>
    );
}

// Main App Views with Slide Animation
function AppViews() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<string>(
        location.pathname === '/canvas' ? 'canvas' : 'dashboard'
    );
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Strictly enforce relative path in PROD to use the proxy, ignoring any auto-set env vars
    const API_URL = import.meta.env.PROD ? "/aevum" : (import.meta.env.VITE_API_URL || "http://localhost:8000");
    axios.defaults.withCredentials = true;

    // Sync URL with active view
    useEffect(() => {
        const path = activeView === 'canvas' ? '/canvas' : '/dashboard';
        if (location.pathname !== path) {
            navigate(path, { replace: true });
        }
    }, [activeView, navigate, location.pathname]);

    // Sync active view with URL changes (back/forward buttons)
    useEffect(() => {
        if (location.pathname === '/canvas') {
            setActiveView('canvas');
        } else if (location.pathname === '/dashboard') {
            setActiveView('dashboard');
        }
    }, [location.pathname]);

    const handleViewChange = (view: string) => {
        setActiveView(view);
    };

    const handleRegenerate = async () => {
        setIsOptimizing(true);
        try {
            await axios.post(`${API_URL}/optimize/from-db`);
            // Trigger refresh in child components
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error("Optimization failed:", err);
        } finally {
            setIsOptimizing(false);
        }
    };

    const addTask = async (taskData: any) => {
        const newTask = {
            title: taskData.title || "New Task",
            estimated_minutes: taskData.estimated_minutes || 30,
            priority: 5,
            deadline: new Date().toISOString(),
            work_type: WorkType.SHALLOW_WORK,
            ...taskData
        };

        try {
            await axios.post(`${API_URL}/tasks`, newTask);
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error("Failed to add task via agent:", err);
        }
    };

    return (
        <div className="h-screen overflow-hidden relative">
            {/* Static Top Banner */}
            <AppHeader
                onRegenerate={handleRegenerate}
                isOptimizing={isOptimizing}
                activeView={activeView}
                onViewChange={handleViewChange}
            />

            {/* Sliding Views Container */}
            <div className={`view-slider ${activeView}`}>
                <div className="view-panel">
                    <Dashboard key={`dash-${refreshKey}`} />
                </div>
                <div className="view-panel">
                    <Canvas key={`canvas-${refreshKey}`} />
                </div>
            </div>

            {/* Static AI Assistant */}
            <AIAssistantBar onAddTask={addTask} onOptimize={handleRegenerate} />
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/dashboard" element={<AppViews />} />
            <Route path="/canvas" element={<AppViews />} />
            {/* Handle auth callback */}
            <Route path="/callback" element={<Navigate to="/dashboard" replace />} />
            {/* Catch all - 404s go to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
