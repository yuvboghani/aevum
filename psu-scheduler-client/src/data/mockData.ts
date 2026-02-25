import { Task, CalendarEvent, WorkType } from '../types';

// ─── SHOWCASE TASKS ─────────────────────────────────────────────
export const showcaseTasks: Task[] = [
    {
        id: 1,
        title: 'Train Neural Net',
        estimated_minutes: 120,
        priority: 1,
        deadline: '2026-03-01T23:59:00Z',
        work_type: WorkType.DEEP_WORK,
        is_completed: false,
        canvas_x: 120,
        canvas_y: 80,
        rotation: -2,
    },
    {
        id: 2,
        title: 'Submit Capstone',
        estimated_minutes: 90,
        priority: 1,
        deadline: '2026-02-28T17:00:00Z',
        work_type: WorkType.DEEP_WORK,
        is_completed: false,
        canvas_x: 420,
        canvas_y: 60,
        rotation: 3,
    },
    {
        id: 3,
        title: 'Review PRs',
        estimated_minutes: 30,
        priority: 2,
        deadline: '2026-02-25T12:00:00Z',
        work_type: WorkType.SHALLOW_WORK,
        is_completed: false,
        canvas_x: 320,
        canvas_y: 220,
        rotation: -1,
    },
    {
        id: 4,
        title: 'Deep Work Block',
        estimated_minutes: 180,
        priority: 1,
        deadline: '2026-02-26T09:00:00Z',
        work_type: WorkType.DEEP_WORK,
        is_completed: true,
        canvas_x: 80,
        canvas_y: 260,
        rotation: 1,
    },
    {
        id: 5,
        title: 'Batch Admin Emails',
        estimated_minutes: 25,
        priority: 3,
        deadline: '2026-02-27T18:00:00Z',
        work_type: WorkType.SHALLOW_WORK,
        is_completed: false,
        canvas_x: 520,
        canvas_y: 180,
        rotation: -3,
    },
    {
        id: 6,
        title: 'Debug Auth Flow',
        estimated_minutes: 60,
        priority: 2,
        deadline: '2026-02-25T15:00:00Z',
        work_type: WorkType.DEEP_WORK,
        is_completed: false,
        canvas_x: 200,
        canvas_y: 340,
        rotation: 2,
    },
    {
        id: 7,
        title: 'Write API Docs',
        estimated_minutes: 45,
        priority: 3,
        deadline: '2026-03-02T12:00:00Z',
        work_type: WorkType.SHALLOW_WORK,
        is_completed: false,
        canvas_x: 450,
        canvas_y: 320,
        rotation: -2,
    },
    {
        id: 8,
        title: 'Refactor Scheduler',
        estimated_minutes: 150,
        priority: 1,
        deadline: '2026-02-28T23:59:00Z',
        work_type: WorkType.DEEP_WORK,
        is_completed: false,
        canvas_x: 600,
        canvas_y: 100,
        rotation: 1,
    },
];

// ─── SHOWCASE CALENDAR EVENTS ───────────────────────────────────
export const showcaseEvents: CalendarEvent[] = [
    {
        id: 'evt-1',
        title: 'Deep Work: Capstone Logic',
        start: '2026-02-25T09:00:00Z',
        end: '2026-02-25T11:00:00Z',
        eventType: 'deep',
        badge: '🧠',
        focusBlock: true,
        highEnergy: true,
    },
    {
        id: 'evt-2',
        title: 'Team Sync',
        start: '2026-02-25T11:30:00Z',
        end: '2026-02-25T12:00:00Z',
        eventType: 'locked',
        badge: '📅',
    },
    {
        id: 'evt-3',
        title: 'Shallow Work: Emails & PRs',
        start: '2026-02-25T14:00:00Z',
        end: '2026-02-25T15:00:00Z',
        eventType: 'ai',
        badge: '📋',
    },
    {
        id: 'evt-4',
        title: 'CMPSC 461 — Compilers',
        start: '2026-02-25T13:00:00Z',
        end: '2026-02-25T13:50:00Z',
        eventType: 'locked',
        badge: '🏛️',
    },
    {
        id: 'evt-5',
        title: 'Gap Fill: Write API Docs',
        start: '2026-02-25T15:15:00Z',
        end: '2026-02-25T16:00:00Z',
        eventType: 'gap',
        badge: '⚡',
        gapFiller: true,
        gapMinutes: 45,
    },
    {
        id: 'evt-6',
        title: 'Train Neural Net (Batch 3)',
        start: '2026-02-25T16:30:00Z',
        end: '2026-02-25T18:30:00Z',
        eventType: 'deep',
        badge: '🧠',
        focusBlock: true,
        highEnergy: true,
    },
];

// ─── HEURISTIC ENGINE TERMINAL LINES ────────────────────────────
export const terminalLines: string[] = [
    '> aevum.engine.init()',
    '  Loading constraint graph... OK',
    '  Calendar entries: 14 locked, 3 flexible',
    '  Task pool: 8 unscheduled (3 deep, 5 shallow)',
    '',
    '> solver.resolve_conflicts()',
    '  [CONFLICT] "Team Sync" overlaps "Capstone Logic"',
    '  Resolving... shifted "Capstone Logic" → 09:00-11:00',
    '  [OK] No remaining conflicts.',
    '',
    '> solver.find_gaps()',
    '  found Gap(45m) at 15:15-16:00 on Tue',
    '  found Gap(30m) at 12:00-12:30 on Wed',
    '  Filling gaps with shallow tasks...',
    '  → slotted "Write API Docs" into Tue 15:15',
    '  → slotted "Batch Admin Emails" into Wed 12:00',
    '',
    '> solver.batch_admin_tasks()',
    '  Batching 3 admin tasks → single 25m block',
    '  Scheduled at low-energy slot: Thu 14:00',
    '',
    '> solver.summary()',
    '  ✓ 0 conflicts',
    '  ✓ 8/8 tasks scheduled',
    '  ✓ 6.5h deep work preserved',
    '  ✓ Utilization: 94.2%',
    '  [DONE] Schedule optimized.',
];

// ─── CHAOTIC TASK LIST (for "before" state) ─────────────────────
export const chaoticTasks = [
    { title: 'Train Neural Net', time: '2h', priority: 'URGENT', overlap: true },
    { title: 'Team Sync', time: '30m', priority: 'LOCKED', overlap: true },
    { title: 'Submit Capstone', time: '1.5h', priority: 'URGENT', overlap: false },
    { title: 'Batch Admin Emails', time: '25m', priority: 'LOW', overlap: false },
    { title: 'Review PRs', time: '30m', priority: 'MED', overlap: false },
    { title: 'Write API Docs', time: '45m', priority: 'LOW', overlap: false },
    { title: 'Debug Auth Flow', time: '1h', priority: 'HIGH', overlap: false },
    { title: 'Refactor Scheduler', time: '2.5h', priority: 'URGENT', overlap: false },
];

// ─── ORGANIZED GRID (for "after" state) ─────────────────────────
export const organizedSchedule = [
    { time: '09:00', title: 'Deep Work: Capstone Logic', type: 'deep' as const, duration: '2h' },
    { time: '11:30', title: 'Team Sync', type: 'locked' as const, duration: '30m' },
    { time: '13:00', title: 'CMPSC 461 — Compilers', type: 'locked' as const, duration: '50m' },
    { time: '14:00', title: 'Shallow: Emails & PRs', type: 'ai' as const, duration: '1h' },
    { time: '15:15', title: 'Gap Fill: API Docs', type: 'gap' as const, duration: '45m' },
    { time: '16:30', title: 'Deep Work: Train Neural Net', type: 'deep' as const, duration: '2h' },
];

// ─── TECH STACK CARDS ───────────────────────────────────────────
export interface TechCard {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    tags: string[];
}

export const techStackCards: TechCard[] = [
    {
        title: 'Backend',
        subtitle: 'FastAPI & Python',
        description: 'Heuristic constraint-satisfaction engine with hard-rule scheduling. No LLM hallucinations — deterministic output guaranteed.',
        icon: '⚙️',
        tags: ['FastAPI', 'Python 3.12', 'Pydantic'],
    },
    {
        title: 'AI Layer',
        subtitle: 'Local LLM / Ollama',
        description: 'Natural-language task ingestion via locally-hosted models. Privacy-first architecture — no data leaves the machine.',
        icon: '🧠',
        tags: ['Ollama', 'LLaMA 3', 'RAG Pipeline'],
    },
    {
        title: 'Frontend',
        subtitle: 'React, Vite, Framer Motion',
        description: 'Spatial "Heist Board" UI with drag-and-drop canvas, calendar sync, and scroll-driven animations.',
        icon: '🎨',
        tags: ['React 19', 'TypeScript', 'Tailwind CSS'],
    },
    {
        title: 'Infrastructure',
        subtitle: 'Vercel Edge & PostgreSQL',
        description: 'Edge-deployed API with Vercel serverless functions. Supabase PostgreSQL for persistent state.',
        icon: '☁️',
        tags: ['Vercel', 'Supabase', 'Edge Functions'],
    },
];
