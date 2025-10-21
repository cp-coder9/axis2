import { Timestamp } from 'firebase/firestore';
import { Task, TaskDependency } from '../../types';
import { calculateForwardPass, calculateBackwardPass, TaskNode } from './schedulingEngine';

/**
 * Critical Path Method (CPM) utilities
 * Provides algorithms for identifying critical tasks and calculating project duration
 */

export interface CriticalPathResult {
    criticalTasks: Task[];
    projectDuration: number;
    totalFloat: number;
    criticalPathLength: number;
}

/**
 * Calculate the critical path for a project
 */
export const findCriticalPath = (
    tasks: Task[],
    dependencies: TaskDependency[],
    projectEndDate?: Date
): CriticalPathResult => {
    // Perform forward and backward passes
    const forwardPass = calculateForwardPass(tasks, dependencies);
    const completeTasks = calculateBackwardPass(forwardPass, projectEndDate ? Timestamp.fromDate(projectEndDate) : undefined);

    // Identify critical tasks (float = 0)
    const criticalTasks = completeTasks
        .filter(node => node.isCritical)
        .sort((a, b) => {
            const aStart = a.earliestStart ? a.earliestStart.toMillis() : 0;
            const bStart = b.earliestStart ? b.earliestStart.toMillis() : 0;
            return aStart - bStart;
        })
        .map(node => ({
            ...node.task,
            float: node.float,
            isCritical: node.isCritical
        }));

    // Calculate project duration
    const projectStart = Math.min(
        ...completeTasks
            .map(node => node.earliestStart ? node.earliestStart.toMillis() : Date.now())
    );

    const projectEnd = Math.max(
        ...completeTasks
            .map(node => node.earliestFinish ? node.earliestFinish.toMillis() : Date.now())
    );

    const projectDuration = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24)); // days

    // Calculate total float (sum of all task floats)
    const totalFloat = completeTasks.reduce((sum, node) => sum + node.float, 0);

    return {
        criticalTasks,
        projectDuration,
        totalFloat,
        criticalPathLength: criticalTasks.length
    };
};

/**
 * Get tasks with their scheduling information
 */
export const getTasksWithScheduling = (
    tasks: Task[],
    dependencies: TaskDependency[]
): Array<Task & { float: number; isCritical: boolean; earliestStart?: Date; latestStart?: Date }> => {
    const forwardPass = calculateForwardPass(tasks, dependencies);
    const completeTasks = calculateBackwardPass(forwardPass);

    return completeTasks.map(node => ({
        ...node.task,
        float: node.float,
        isCritical: node.isCritical,
        earliestStart: node.earliestStart?.toDate(),
        latestStart: node.latestStart?.toDate()
    }));
};

/**
 * Identify bottleneck tasks (tasks with least float)
 */
export const findBottleneckTasks = (
    tasks: Task[],
    dependencies: TaskDependency[],
    threshold: number = 2
): Task[] => {
    const tasksWithScheduling = getTasksWithScheduling(tasks, dependencies);

    return tasksWithScheduling
        .filter(task => task.float <= threshold && task.float > 0)
        .sort((a, b) => a.float - b.float);
};

/**
 * Calculate project buffer (total float available)
 */
export const calculateProjectBuffer = (
    tasks: Task[],
    dependencies: TaskDependency[]
): number => {
    const tasksWithScheduling = getTasksWithScheduling(tasks, dependencies);
    return tasksWithScheduling.reduce((total, task) => total + task.float, 0);
};

/**
 * Get schedule efficiency metrics
 */
export interface ScheduleEfficiency {
    criticalTaskRatio: number;
    averageFloat: number;
    bottleneckTasks: number;
    scheduleRisk: 'low' | 'medium' | 'high';
}

export const calculateScheduleEfficiency = (
    tasks: Task[],
    dependencies: TaskDependency[]
): ScheduleEfficiency => {
    const tasksWithScheduling = getTasksWithScheduling(tasks, dependencies);

    const criticalTasks = tasksWithScheduling.filter(task => task.isCritical);
    const criticalTaskRatio = criticalTasks.length / tasksWithScheduling.length;

    const totalFloat = tasksWithScheduling.reduce((sum, task) => sum + task.float, 0);
    const averageFloat = totalFloat / tasksWithScheduling.length;

    const bottleneckTasks = tasksWithScheduling.filter(task => task.float > 0 && task.float <= 2).length;

    let scheduleRisk: 'low' | 'medium' | 'high';
    if (criticalTaskRatio > 0.7 || bottleneckTasks > tasksWithScheduling.length * 0.3) {
        scheduleRisk = 'high';
    } else if (criticalTaskRatio > 0.5 || bottleneckTasks > tasksWithScheduling.length * 0.2) {
        scheduleRisk = 'medium';
    } else {
        scheduleRisk = 'low';
    }

    return {
        criticalTaskRatio,
        averageFloat,
        bottleneckTasks,
        scheduleRisk
    };
};