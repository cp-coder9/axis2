import { Timestamp } from 'firebase/firestore';

/**
 * Scheduling-related type definitions
 */

export interface BaselineComparison {
    baseline: any; // Will be defined when ProjectBaseline is available
    variances: {
        scheduleVariance: number; // Days difference in project duration
        costVariance: number; // Budget variance
        taskVariances: Array<{
            taskId: string;
            startVariance: number; // Days difference from baseline start
            durationVariance: number; // Days difference in duration
            costVariance: number; // Cost difference
        }>;
    };
}

export interface ResourceConflict {
    date: Date;
    totalAllocation: number;
    assignments: any[]; // Will be defined when ResourceAssignment is available
}

export interface ResourceLevelingResult {
    leveledAssignments: any[]; // Will be defined when ResourceAssignment is available
    adjustments: Array<{
        originalAssignment: any; // Will be defined when ResourceAssignment is available
        newAllocation: number;
        reason: string;
    }>;
}

export interface SchedulingCalculation {
    criticalPath: string[];
    scheduleEfficiency: number;
    totalFloat: number;
    projectDuration: number;
}

export interface CriticalPathResult {
    tasks: string[];
    duration: number;
    efficiency: number;
}

export interface ScheduleEfficiency {
    efficiency: number;
    totalTasks: number;
    criticalTasks: number;
    bottlenecks: string[];
}