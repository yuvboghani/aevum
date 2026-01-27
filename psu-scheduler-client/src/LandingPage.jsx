import React from 'react';

// --- CONFIG ---
// Strictly enforce relative path in PROD to use the proxy
const API_URL = import.meta.env.PROD ? "/aevum" : (import.meta.env.VITE_API_URL || "http://localhost:8000");

const CalendarIcon = () => (
    <svg className="w-12 h-12 text-[#FF6B2C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const BrainIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

function LandingPage() {
    const handleLogin = () => {
        window.location.href = `${API_URL}/login`;
    };

    return (
        <div className="min-h-screen bg-[#FFFBF7] flex flex-col">
            {/* Navigation */}
            <nav className="p-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B2C] to-[#C4703D] flex items-center justify-center text-white font-bold text-sm">
                            A
                        </div>
                        <span className="text-xl font-semibold">Aevum</span>
                    </div>
                    <button
                        onClick={handleLogin}
                        className="px-5 py-2.5 text-sm font-medium border border-[#C4703D] text-[#1a1a1a] rounded-lg hover:bg-[#FEE8DB] transition-colors"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex items-center justify-center px-6">
                <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">

                    <div className="space-y-8 animate-fade-in text-center md:text-left">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF4ED] text-[#FF6B2C] text-xs font-bold border border-[#FEE8DB]">
                                <BrainIcon /> Smart Heuristics
                            </div>
                            <h1 className="text-5xl md:text-6xl font-serif font-medium leading-tight text-[#1a1a1a]">
                                Orchestrate your <span className="text-[#FF6B2C]">time.</span>
                            </h1>
                            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto md:mx-0">
                                Aevum intelligently schedules your tasks around your calendar, prioritizing Deep Work when you are most productive.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <button
                                onClick={handleLogin}
                                className="flex items-center justify-center btn-primary px-8 py-3.5 text-base shadow-xl shadow-orange-200"
                            >
                                <GoogleIcon />
                                Continue with Google
                            </button>
                        </div>

                        <p className="text-xs text-center md:text-left text-gray-400">
                            By continuing, you agree to our Terms of Service.
                        </p>
                    </div>

                    <div className="relative hidden md:block animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="absolute -inset-4 bg-gradient-to-br from-[#FF6B2C] to-[#C4703D] opacity-10 blur-2xl rounded-full"></div>
                        <div className="relative bg-white p-8 rounded-2xl border border-[#e8e0d8] shadow-2xl skew-y-3 transform hover:skew-y-0 transition-transform duration-500">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="text-xs font-mono text-gray-400">Weekly View</div>
                            </div>
                            <div className="space-y-4">
                                {/* Mock Events */}
                                <div className="flex gap-4">
                                    <div className="w-12 text-xs text-gray-400 pt-1 text-right">9 AM</div>
                                    <div className="flex-1 bg-[#FFF4ED] border-l-4 border-[#FF6B2C] p-3 rounded text-sm font-medium">
                                        🧠 Deep Work: Capstone Logic
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 text-xs text-gray-400 pt-1 text-right">11 AM</div>
                                    <div className="flex-1 bg-[#F0F7FF] border-l-4 border-[#4A90D9] p-3 rounded text-sm font-medium">
                                        📅 Team Sync
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 text-xs text-gray-400 pt-1 text-right">2 PM</div>
                                    <div className="flex-1 bg-[#FEE8DB] border-l-4 border-[#C4703D] p-3 rounded text-sm font-medium">
                                        📋 Shallow Work: Emails
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <footer className="py-6 text-center text-xs text-gray-400">
                &copy; 2026 Aevum Intelligence. Built with Vercel & FastAPI.
            </footer>
        </div>
    );
}

export default LandingPage;
