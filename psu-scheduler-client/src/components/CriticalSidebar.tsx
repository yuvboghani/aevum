import React from 'react';
import { differenceInDays, isPast, isToday, parseISO } from 'date-fns';
import { Task } from '../types';

const AlertIcon = () => (
    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

interface SidebarProps {
    tasks: Task[];
}

export const CriticalSidebar: React.FC<SidebarProps> = ({ tasks }) => {
    // Filter critical tasks (due within 3 days or overdue)
    const criticalTasks = tasks ? tasks.filter(t => {
        if (!t.deadline || t.is_completed) return false;
        const deadline = parseISO(t.deadline);
        const daysUntil = differenceInDays(deadline, new Date());
        // Simple check: overdue or within 7 days
        return daysUntil <= 7;
    }).sort((a: Task, b: Task) => {
        // Safe sort with fallback
        const dateA = a.deadline ? parseISO(a.deadline).getTime() : 0;
        const dateB = b.deadline ? parseISO(b.deadline).getTime() : 0;
        return dateA - dateB;
    }) : [];

    return (
        <aside className="w-72 flex-shrink-0 hidden xl:block">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <AlertIcon /> <span className="text-red-600">Critical & Upcoming</span>
                </h3>
                {criticalTasks.length > 0 ? (
                    <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                        {criticalTasks.map((task, i) => {
                            const deadline = parseISO(task.deadline);
                            const daysUntil = differenceInDays(deadline, new Date());
                            const isOverdue = isPast(deadline) && !isToday(deadline);

                            return (
                                <div key={i} className={`p-3 rounded-lg text-sm border transition-all hover:shadow-sm ${isOverdue ? 'bg-red-50 border-red-200' :
                                    daysUntil <= 1 ? 'bg-orange-50 border-orange-200' :
                                        'bg-white border-gray-200'
                                    }`}>
                                    <div className="font-medium text-gray-900 leading-tight mb-1">{task.title}</div>
                                    <div className={`text-xs flex items-center justify-between ${isOverdue ? 'text-red-600 font-semibold' :
                                        daysUntil <= 1 ? 'text-orange-600' :
                                            'text-gray-500'
                                        }`}>
                                        <span>
                                            {isOverdue ? 'Overdue' :
                                                daysUntil === 0 ? 'Due today' :
                                                    daysUntil === 1 ? 'Due tomorrow' :
                                                        `Due in ${daysUntil} days`}
                                        </span>
                                        {task.estimated_minutes && (
                                            <span className="opacity-75">{task.estimated_minutes}m</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500">No critical tasks</p>
                        <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>
        </aside>
    );
};
