import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';
import {
    showcaseTasks,
    terminalLines,
    chaoticTasks,
    organizedSchedule,
    techStackCards,
} from '../data/mockData';

// ═══════════════════════════════════════════════════════════════
//  STICKY NAV
// ═══════════════════════════════════════════════════════════════

function StickyNav() {
    const { scrollYProgress } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        setScrolled(v > 0.02);
    });

    return (
        <motion.nav
            initial={{ y: -60 }}
            animate={{ y: scrolled ? 0 : -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            <div className="bg-charcoal/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
                    <span className="font-sans font-black text-paper text-sm tracking-tight">
                        AEVUM<span className="text-safety-orange">:</span>
                    </span>
                    <span className="font-mono text-[10px] text-paper/30 tracking-widest uppercase hidden sm:block">
                        Deterministic Time Architecture
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono text-[10px] text-paper/40">DEMO</span>
                    </div>
                </div>
            </div>
            {/* Scroll progress bar */}
            <motion.div
                className="h-[2px] bg-safety-orange origin-left"
                style={{ scaleX: scrollYProgress }}
            />
        </motion.nav>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 1 — HERO
// ═══════════════════════════════════════════════════════════════

function HeroSection() {
    const [terminalText, setTerminalText] = useState('');
    const fullText = '> System: ONLINE // Mode: DEMO';

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setTerminalText(fullText.slice(0, i + 1));
            i++;
            if (i >= fullText.length) clearInterval(interval);
        }, 60);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-charcoal">
            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-safety-orange/5 rounded-full blur-[120px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center">
                {/* Left — Copy */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="space-y-8"
                >
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-safety-orange/30 bg-safety-orange/5"
                        >
                            <span className="w-2 h-2 rounded-full bg-safety-orange animate-pulse" />
                            <span className="font-mono text-xs text-safety-orange tracking-wider uppercase">
                                Case Study
                            </span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-paper leading-[0.95]">
                            AEVUM<span className="text-safety-orange">:</span>
                            <br />
                            <span className="text-3xl md:text-4xl font-light text-paper/60">
                                Deterministic Time Architecture
                            </span>
                        </h1>

                        <p className="text-lg text-paper/50 font-sans max-w-lg leading-relaxed">
                            A constraint-satisfaction engine for high-performance student scheduling.
                            Hard rules. No hallucinations. Deterministic output.
                        </p>
                    </div>

                    {/* Terminal line */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="font-mono text-sm text-safety-orange/80 bg-charcoal border border-safety-orange/20 rounded-lg px-4 py-3 inline-block"
                    >
                        <span>{terminalText}</span>
                        <span className="animate-pulse ml-0.5">▊</span>
                    </motion.div>
                </motion.div>

                {/* Right — Floating Board Composition */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotateX: 15, rotateY: -8 }}
                    animate={{ opacity: 1, y: 0, rotateX: 8, rotateY: -5 }}
                    transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                    className="relative"
                    style={{ perspective: '1200px' }}
                >
                    <div
                        className="relative bg-[#2a2a2a] rounded-xl border border-white/10 p-4 sm:p-6 shadow-2xl"
                        style={{ transform: 'rotateX(4deg) rotateY(-3deg)' }}
                    >
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            <span className="ml-3 font-mono text-xs text-white/30">
                                aevum — tactician's board
                            </span>
                        </div>

                        {/* Mini task cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {showcaseTasks.slice(0, 6).map((task, i) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 + i * 0.12 }}
                                    className={`rounded-lg p-3 text-xs border ${task.work_type === 'Deep Work'
                                        ? 'bg-safety-orange/10 border-safety-orange/30 text-safety-orange'
                                        : 'bg-white/5 border-white/10 text-white/60'
                                        }`}
                                    style={{ transform: `rotate(${task.rotation || 0}deg)` }}
                                >
                                    <div className="font-mono font-semibold text-[11px] mb-1 truncate">
                                        {task.title}
                                    </div>
                                    <div className="font-mono text-[10px] opacity-60">
                                        {task.estimated_minutes}m · P{task.priority}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Red strings */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 50 }}>
                            <line x1="25%" y1="35%" x2="60%" y2="55%" stroke="#ff4d00" strokeWidth="1" opacity="0.2" strokeDasharray="4 4" />
                            <line x1="70%" y1="30%" x2="40%" y2="65%" stroke="#ff4d00" strokeWidth="1" opacity="0.15" strokeDasharray="4 4" />
                        </svg>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="font-mono text-[10px] text-paper/30 tracking-widest uppercase">Scroll</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-5 h-8 rounded-full border border-paper/20 flex items-start justify-center pt-1.5"
                >
                    <div className="w-1 h-1.5 rounded-full bg-safety-orange/60" />
                </motion.div>
            </motion.div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 2 — THE TACTICIAN'S BOARD
// ═══════════════════════════════════════════════════════════════

function TacticianBoard() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const [pinned, setPinned] = useState(false);

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => setPinned(true), 800);
            return () => clearTimeout(timer);
        }
    }, [isInView]);

    const boardTasks = showcaseTasks.slice(0, 5);
    const flyingTask = showcaseTasks[2]; // "Review PRs"

    return (
        <section ref={ref} className="relative py-32 bg-charcoal overflow-hidden">
            {/* Section label */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto px-6 mb-16"
            >
                <span className="font-mono text-xs text-safety-orange tracking-[0.3em] uppercase">
                    01 / Feature
                </span>
                <h2 className="text-4xl md:text-5xl font-sans font-bold text-paper mt-4 mb-4">
                    The Tactician's Board
                </h2>
                <p className="text-paper/50 font-sans max-w-xl text-lg">
                    Spatial planning: drag-and-drop interface for managing high-cognitive-load tasks.
                </p>
            </motion.div>

            {/* Board container */}
            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative bg-[#2a2220] rounded-2xl border border-white/5 overflow-hidden"
                    style={{ minHeight: 420 }}
                >
                    {/* Corkboard texture */}
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.7' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }} />

                    {/* Pinned task cards */}
                    <div className="relative p-4 sm:p-8 min-h-[280px] lg:min-h-[380px]">
                        {/* Grid layout on mobile, absolute on lg */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:contents">
                            {boardTasks.map((task, i) => {
                                const positions = [
                                    { left: '10%', top: '15%' },
                                    { left: '28%', top: '40%' },
                                    { left: '46%', top: '15%' },
                                    { left: '64%', top: '40%' },
                                    { left: '80%', top: '20%' },
                                ];
                                const pos = positions[i] || positions[0];
                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, scale: 0.8, rotate: task.rotation || 0 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                                        className="relative lg:absolute"
                                        style={{
                                            ...(typeof window !== 'undefined' && window.innerWidth >= 1024
                                                ? { left: pos.left, top: pos.top, transform: `rotate(${task.rotation || 0}deg)` }
                                                : {}),
                                        }}
                                    >
                                        <div className={`w-full lg:w-44 rounded-lg p-3 sm:p-4 shadow-lg border ${task.work_type === 'Deep Work'
                                            ? 'bg-gradient-to-br from-safety-orange/15 to-safety-orange/5 border-safety-orange/20'
                                            : 'bg-white/5 border-white/10'
                                            }`}
                                        >
                                            {/* Pushpin */}
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border-2 border-red-800" />
                                            <div className="font-mono text-xs font-semibold text-paper mb-1 truncate">
                                                {task.title}
                                            </div>
                                            <div className="font-mono text-[10px] text-paper/40">
                                                {task.estimated_minutes}m · {task.work_type}
                                            </div>
                                            {task.is_completed && (
                                                <div className="mt-2 font-mono text-[10px] text-green-400 uppercase tracking-wider">
                                                    ✓ Done
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Flying card animation */}
                        <AnimatePresence>
                            {isInView && !pinned && (
                                <motion.div
                                    initial={{ x: -80, y: 350, opacity: 0, rotate: -15, scale: 0.7 }}
                                    animate={{ x: 280, y: 120, opacity: 1, rotate: -1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                                    className="absolute z-20"
                                >
                                    <div className="w-48 rounded-lg p-4 bg-safety-orange/20 border border-safety-orange/40 shadow-2xl">
                                        <div className="font-mono text-xs font-bold text-safety-orange mb-1">
                                            {flyingTask.title}
                                        </div>
                                        <div className="font-mono text-[10px] text-paper/50">
                                            {flyingTask.estimated_minutes}m · Inbox → Board
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Inbox pile (bottom-left) */}
                        <div className="absolute bottom-4 left-4 space-y-1 opacity-40">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-32 h-8 bg-white/5 border border-white/10 rounded"
                                    style={{ transform: `rotate(${-3 + i * 2}deg) translateX(${i * 4}px)` }}
                                />
                            ))}
                            <div className="font-mono text-[9px] text-paper/30 mt-2 tracking-wider uppercase">
                                Inbox
                            </div>
                        </div>
                    </div>

                    {/* Red strings overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line x1="20%" y1="25%" x2="55%" y2="45%" stroke="#8B2323" strokeWidth="1.5" opacity="0.3" strokeDasharray="6 4" />
                        <line x1="60%" y1="20%" x2="35%" y2="60%" stroke="#8B2323" strokeWidth="1" opacity="0.2" strokeDasharray="4 6" />
                        <line x1="75%" y1="35%" x2="50%" y2="75%" stroke="#8B2323" strokeWidth="1" opacity="0.25" strokeDasharray="5 5" />
                    </svg>
                </motion.div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 3 — THE HEURISTIC ENGINE
// ═══════════════════════════════════════════════════════════════

function TerminalWindow() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    const [visibleLines, setVisibleLines] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setVisibleLines((prev) => {
                if (prev >= terminalLines.length) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 120);
        return () => clearInterval(interval);
    }, [isInView]);

    return (
        <div ref={ref} className="bg-[#0d0d0d] rounded-xl border border-white/5 overflow-hidden font-mono text-xs">
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-white/25 text-[10px]">aevum_engine.py — heuristic solver</span>
            </div>

            {/* Terminal body */}
            <div className="p-4 h-80 overflow-y-auto space-y-0.5">
                {terminalLines.slice(0, visibleLines).map((line, i) => (
                    <div key={i} className={`leading-relaxed ${line.startsWith('>') ? 'text-safety-orange' :
                        line.includes('[CONFLICT]') ? 'text-red-400' :
                            line.includes('[OK]') || line.includes('✓') ? 'text-green-400' :
                                line.includes('[DONE]') ? 'text-safety-orange font-bold' :
                                    line.includes('→') ? 'text-blue-400' :
                                        'text-white/50'
                        }`}>
                        {line || '\u00A0'}
                    </div>
                ))}
                {visibleLines < terminalLines.length && (
                    <span className="text-safety-orange animate-pulse">▊</span>
                )}
            </div>
        </div>
    );
}

function HeuristicEngine() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const [resolved, setResolved] = useState(false);

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => setResolved(true), 3200);
            return () => clearTimeout(timer);
        }
    }, [isInView]);

    return (
        <section ref={ref} className="relative py-32 bg-[#111] overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto px-6 mb-16"
            >
                <span className="font-mono text-xs text-safety-orange tracking-[0.3em] uppercase">
                    02 / Feature
                </span>
                <h2 className="text-4xl md:text-5xl font-sans font-bold text-paper mt-4 mb-4">
                    The Heuristic Engine
                </h2>
                <p className="text-paper/50 font-sans max-w-xl text-lg">
                    Logic over LLMs: hard-constraint solvers ensure no double-booking, ever.
                </p>
            </motion.div>

            {/* Split-screen layout */}
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8">
                {/* Left — Chaotic → Organized */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="font-mono text-[10px] text-paper/30 uppercase tracking-widest mb-4">
                        {resolved ? '✓ Resolved Schedule' : '⚠ Unresolved Conflicts'}
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-5 min-h-[320px]">
                        <AnimatePresence mode="wait">
                            {!resolved ? (
                                <motion.div
                                    key="chaotic"
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-2"
                                >
                                    {chaoticTasks.map((task, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{
                                                opacity: 1,
                                                x: task.overlap ? [0, 3, -2, 1, 0] : 0,
                                            }}
                                            transition={{
                                                delay: i * 0.08,
                                                x: task.overlap ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 } : {},
                                            }}
                                            className={`flex items-center justify-between rounded-lg px-4 py-2.5 border ${task.overlap
                                                ? 'border-red-500/40 bg-red-500/5'
                                                : 'border-white/5 bg-white/[0.02]'
                                                }`}
                                            style={{ marginLeft: task.overlap ? `${i * 6}px` : 0 }}
                                        >
                                            <div className="flex items-center gap-3">
                                                {task.overlap && (
                                                    <span className="text-red-400 text-[10px]">⚠</span>
                                                )}
                                                <span className="font-mono text-xs text-paper/80">
                                                    {task.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-[10px] text-paper/30">
                                                    {task.time}
                                                </span>
                                                <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full ${task.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                                                    task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                                                        task.priority === 'LOCKED' ? 'bg-blue-500/20 text-blue-400' :
                                                            task.priority === 'MED' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                'bg-white/5 text-paper/30'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="organized"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="space-y-1.5"
                                >
                                    {organizedSchedule.map((slot, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-center gap-4 rounded-lg px-4 py-3 border border-white/5 bg-white/[0.02]"
                                        >
                                            <span className="font-mono text-[11px] text-paper/30 w-12 shrink-0">
                                                {slot.time}
                                            </span>
                                            <div className={`w-1 h-8 rounded-full shrink-0 ${slot.type === 'deep' ? 'bg-safety-orange' :
                                                slot.type === 'locked' ? 'bg-blue-500' :
                                                    slot.type === 'ai' ? 'bg-orange-400' :
                                                        'bg-white/20'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-mono text-xs text-paper/80 truncate">
                                                    {slot.title}
                                                </div>
                                                <div className="font-mono text-[10px] text-paper/30">
                                                    {slot.duration}
                                                </div>
                                            </div>
                                            <span className="text-green-500 text-[10px]">✓</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Right — Terminal */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="font-mono text-[10px] text-paper/30 uppercase tracking-widest mb-4">
                        Engine Output
                    </div>
                    <TerminalWindow />
                </motion.div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 4 — TECH STACK
// ═══════════════════════════════════════════════════════════════

function TechStack() {
    return (
        <section className="relative py-32 bg-charcoal overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto px-6 mb-16"
            >
                <span className="font-mono text-xs text-safety-orange tracking-[0.3em] uppercase">
                    03 / Architecture
                </span>
                <h2 className="text-4xl md:text-5xl font-sans font-bold text-paper mt-4 mb-4">
                    The Stack
                </h2>
                <p className="text-paper/50 font-sans max-w-xl text-lg">
                    Full-stack engineering, from constraint solvers to edge deployment.
                </p>
            </motion.div>

            <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {techStackCards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.12, duration: 0.5 }}
                        className="group relative bg-[#1e1e1e] rounded-xl border border-white/5 p-6 hover:border-safety-orange/30 transition-all duration-300"
                    >
                        {/* Hover glow */}
                        <div className="absolute inset-0 rounded-xl bg-safety-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative z-10">
                            <div className="text-3xl mb-4">{card.icon}</div>
                            <div className="font-mono text-[10px] text-safety-orange tracking-wider uppercase mb-1">
                                {card.title}
                            </div>
                            <h3 className="font-sans text-lg font-semibold text-paper mb-3">
                                {card.subtitle}
                            </h3>
                            <p className="font-sans text-sm text-paper/40 leading-relaxed mb-4">
                                {card.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {card.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="font-mono text-[9px] px-2 py-1 rounded bg-white/5 text-paper/40 border border-white/5"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 5 — FOOTER / CTA
// ═══════════════════════════════════════════════════════════════

function Footer() {
    return (
        <footer className="relative py-24 bg-[#111] border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    {/* Divider line */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="w-12 h-px bg-safety-orange/30" />
                        <span className="font-mono text-[10px] text-safety-orange tracking-[0.3em] uppercase">
                            End Transmission
                        </span>
                        <div className="w-12 h-px bg-safety-orange/30" />
                    </div>

                    <div className="space-y-3">
                        <p className="font-sans text-2xl font-bold text-paper">
                            Designed & Engineered by{' '}
                            <span className="text-safety-orange">Yuv Boghani</span>
                        </p>
                        <p className="font-mono text-sm text-paper/30">
                            Penn State '26 · Computer Science
                        </p>
                    </div>

                    <a
                        href="https://yuvboghani.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-safety-orange text-charcoal font-sans font-semibold text-sm hover:bg-safety-orange/90 transition-colors group"
                    >
                        Return to Portfolio
                        <svg
                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>

                    <div className="pt-12 flex items-center justify-center gap-6">
                        <a
                            href="https://github.com/yuvboghani"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-paper/20 hover:text-safety-orange transition-colors"
                        >
                            GitHub
                        </a>
                        <span className="text-paper/10">·</span>
                        <a
                            href="https://linkedin.com/in/yuvboghani"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-paper/20 hover:text-safety-orange transition-colors"
                        >
                            LinkedIn
                        </a>
                        <span className="text-paper/10">·</span>
                        <span className="font-mono text-xs text-paper/20">
                            © 2026 Aevum
                        </span>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export default function Showcase() {
    return (
        <main className="bg-charcoal min-h-screen overflow-x-hidden">
            <StickyNav />
            <HeroSection />
            <TacticianBoard />
            <HeuristicEngine />
            <TechStack />
            <Footer />
        </main>
    );
}
