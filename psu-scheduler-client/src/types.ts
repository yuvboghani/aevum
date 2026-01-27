export enum WorkType {
    DEEP_WORK = "Deep Work",
    SHALLOW_WORK = "Shallow Work"
}

export interface Task {
    id: number;
    title: string;
    estimated_minutes: number;
    priority: number;
    deadline: string; // ISO String
    work_type: WorkType | string;
    is_completed: boolean;
    created_at?: string;
    updated_at?: string;

    // Canvas UI Props
    canvas_x?: number;
    canvas_y?: number;
    x?: number; // Runtime canvas x
    y?: number; // Runtime canvas y
    rotation?: number;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: string; // ISO String
    end: string;   // ISO String
    eventType: 'locked' | 'ai' | 'gap' | 'deep';

    // UI Properties
    time?: string;
    badge?: string;
    backgroundColor?: string;
    durationMinutes?: number;
    location?: string;

    // Advanced UI Flags
    focusBlock?: boolean;
    highEnergy?: boolean;
    gapFiller?: boolean;
    gapMinutes?: number;
    collaborators?: any[];
}

export interface AIPromptRequest {
    prompt: string;
    current_schedule: any[]; // Can refine if needed
    context?: {
        frontend_view?: string;
        [key: string]: any;
    };
}

export interface AIResponse {
    summary: string;
    task_suggestions?: any[];
    insights?: any[];
}
