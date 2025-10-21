import React from 'react';
import { Task, Job } from '@/types';

interface TaskBarProps {
    task: Task;
    job?: Job;
    startDate: Date;
    dayWidth: number;
    isSelected: boolean;
    isCritical: boolean;
    progress?: number;
    isDependencySelected?: boolean;
    onClick: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onResizeStart: (e: React.MouseEvent, direction: 'left' | 'right') => void;
}

export const TaskBar: React.FC<TaskBarProps> = ({
    task,
    job,
    startDate,
    dayWidth,
    isSelected,
    isCritical,
    progress = 0,
    isDependencySelected = false,
    onClick,
    onMouseDown,
    onResizeStart
}) => {
    const taskStart = task.startDate?.toDate() || new Date();
    const taskEnd = task.endDate?.toDate() || new Date(taskStart.getTime() + (task.duration || 1) * 24 * 60 * 60 * 1000);

    const left = Math.max(0, (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) * dayWidth);
    const width = Math.max(dayWidth * 0.5, (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24) * dayWidth);

    const getStatusColor = () => {
        switch (task.status) {
            case 'COMPLETED': return 'bg-green-500';
            case 'IN_PROGRESS': return 'bg-blue-500';
            case 'REVIEW': return 'bg-yellow-500';
            case 'ON_HOLD': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    const isMilestone = task.isMilestone || width <= dayWidth;

    return (
        <div className="relative">
            <div
                className={`absolute top-1 h-6 rounded cursor-pointer select-none ${isSelected ? 'ring-2 ring-blue-500' : ''
                    } ${isCritical ? 'border-2 border-red-600 shadow-lg ring-1 ring-red-400' : 'border border-gray-300'} ${isDependencySelected ? 'ring-2 ring-purple-500 bg-purple-100' : ''}`}
                style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    zIndex: isSelected ? 20 : isDependencySelected ? 15 : 10
                }}
                onClick={onClick}
                onMouseDown={onMouseDown}
            >
                {isMilestone ? (
                    // Milestone diamond
                    <div className={`w-full h-full ${getStatusColor()} transform rotate-45 flex items-center justify-center ${isCritical ? 'ring-2 ring-red-500' : ''}`}>
                        <div className="transform -rotate-45 text-white text-xs font-bold">
                            ◆
                        </div>
                    </div>
                ) : (
                    // Regular task bar
                    <div className={`w-full h-full ${getStatusColor()} rounded flex items-center px-2 relative overflow-hidden ${isCritical ? 'ring-1 ring-red-300' : ''}`}>
                        {/* Progress overlay */}
                        {progress > 0 && (
                            <div
                                className="absolute left-0 top-0 h-full bg-green-600 opacity-75 rounded-l"
                                style={{ width: `${Math.min(100, progress)}%` }}
                            />
                        )}

                        {/* Task text */}
                        <span className="text-white text-xs font-medium truncate z-10 relative">
                            {task.title}
                        </span>

                        {/* Resize handles */}
                        <div
                            className="absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-white hover:bg-opacity-30"
                            onMouseDown={(e) => onResizeStart(e, 'left')}
                        />
                        <div
                            className="absolute right-0 top-0 w-1 h-full cursor-ew-resize hover:bg-white hover:bg-opacity-30"
                            onMouseDown={(e) => onResizeStart(e, 'right')}
                        />
                    </div>
                )}

                {/* Job color indicator */}
                {job && (
                    <div
                        className="absolute -top-1 left-0 w-2 h-2 rounded-full border border-white"
                        style={{ backgroundColor: '#666' }}
                    />
                )}
            </div>

            {/* Critical Path Label */}
            {isCritical && (
                <div
                    className="absolute top-8 left-0 bg-red-600 text-white text-xs px-1 py-0.5 rounded font-semibold shadow-sm"
                    style={{ left: `${left}px` }}
                >
                    CRITICAL
                </div>
            )}
        </div>
    );
};

export default TaskBar;