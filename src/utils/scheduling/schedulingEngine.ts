import { Timestamp } from 'firebase/firestore';
import { Task, TaskDependency } from '../../types';

/**
 * Scheduling utilities for project management
 * Implements Critical Path Method (CPM) algorithms
 */

export interface TaskNode {
    task: Task;
    earliestStart: Timestamp | null;
    earliestFinish: Timestamp | null;
    latestStart: Timestamp | null;
    latestFinish: Timestamp | null;
    float: number;
    isCritical: boolean;
    predecessors: TaskNode[];
    successors: TaskNode[];
}

/**
 * Convert Firebase Timestamp to days since epoch for calculations
 */
export const timestampToDays = (timestamp: Timestamp | null): number => {
    if (!timestamp) return 0;
    return Math.floor(timestamp.toMillis() / (1000 * 60 * 60 * 24));
};

/**
 * Convert days since epoch back to Firebase Timestamp
 */
export const daysToTimestamp = (days: number): Timestamp => {
    return Timestamp.fromMillis(days * 24 * 60 * 60 * 1000);
};

/**
 * Forward Pass: Calculate earliest start and finish dates
 */
export const calculateForwardPass = (tasks: Task[], dependencies: TaskDependency[]): TaskNode[] => {
    const taskMap = new Map<string, TaskNode>();
    const taskIdMap = new Map<string, Task>();

    // Initialize task nodes
    tasks.forEach(task => {
        taskIdMap.set(task.id, task);
        taskMap.set(task.id, {
            task,
            earliestStart: task.startDate || null,
            earliestFinish: null,
            latestStart: null,
            latestFinish: null,
            float: 0,
            isCritical: false,
            predecessors: [],
            successors: []
        });
    });

    // Build dependency graph
    dependencies.forEach(dep => {
        const predecessor = taskMap.get(dep.predecessorId);
        const successor = taskMap.get(dep.successorId);

        if (predecessor && successor) {
            predecessor.successors.push(successor);
            successor.predecessors.push(predecessor);
        }
    });

    // Topological sort and forward pass
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (taskId: string): void => {
        if (temp.has(taskId)) {
            throw new Error('Circular dependency detected');
        }
        if (visited.has(taskId)) return;

        temp.add(taskId);
        const node = taskMap.get(taskId)!;

        // Process predecessors first
        node.predecessors.forEach(pred => visit(pred.task.id));

        // Calculate earliest start
        if (node.predecessors.length === 0) {
            // No predecessors, use planned start date or current date
            node.earliestStart = node.task.startDate || Timestamp.now();
        } else {
            // Earliest start is the maximum of predecessor finish dates
            const maxPredFinish = Math.max(
                ...node.predecessors.map(pred => {
                    const predFinish = pred.earliestFinish;
                    return predFinish ? timestampToDays(predFinish) : 0;
                })
            );
            node.earliestStart = daysToTimestamp(maxPredFinish);
        }

        // Calculate earliest finish
        const duration = node.task.duration || 1; // Default 1 day
        const startDays = timestampToDays(node.earliestStart);
        node.earliestFinish = daysToTimestamp(startDays + duration);

        temp.delete(taskId);
        visited.add(taskId);
    };

    // Process all tasks
    tasks.forEach(task => {
        if (!visited.has(task.id)) {
            visit(task.id);
        }
    });

    return Array.from(taskMap.values());
};

/**
 * Backward Pass: Calculate latest start and finish dates, and float
 */
export const calculateBackwardPass = (
    taskNodes: TaskNode[],
    projectEndDate?: Timestamp
): TaskNode[] => {
    const taskMap = new Map<string, TaskNode>();
    taskNodes.forEach(node => taskMap.set(node.task.id, node));

    // Find tasks with no successors (end tasks)
    const endTasks = taskNodes.filter(node => node.successors.length === 0);

    // Set latest finish for end tasks
    endTasks.forEach(node => {
        if (projectEndDate) {
            node.latestFinish = projectEndDate;
        } else {
            node.latestFinish = node.earliestFinish;
        }
    });

    // Backward pass
    const processed = new Set<string>();

    const processBackward = (taskId: string): void => {
        if (processed.has(taskId)) return;

        const node = taskMap.get(taskId)!;

        // Process successors first
        node.successors.forEach(succ => processBackward(succ.task.id));

        // Calculate latest finish
        if (node.successors.length === 0) {
            // Already set for end tasks
        } else {
            // Latest finish is the minimum of successor start dates
            const minSuccStart = Math.min(
                ...node.successors.map(succ => {
                    const succStart = succ.latestStart;
                    return succStart ? timestampToDays(succStart) : Infinity;
                })
            );
            node.latestFinish = daysToTimestamp(minSuccStart);
        }

        // Calculate latest start
        const duration = node.task.duration || 1;
        const finishDays = timestampToDays(node.latestFinish);
        node.latestStart = daysToTimestamp(finishDays - duration);

        // Calculate float (slack)
        const earliestStart = timestampToDays(node.earliestStart);
        const latestStart = timestampToDays(node.latestStart);
        node.float = Math.max(0, latestStart - earliestStart);

        // Determine if critical
        node.isCritical = node.float === 0;

        processed.add(taskId);
    };

    // Start from end tasks
    endTasks.forEach(node => processBackward(node.task.id));

    return taskNodes;
};

/**
 * Calculate critical path for a project
 */
export const calculateCriticalPath = (tasks: Task[], dependencies: TaskDependency[]): Task[] => {
    const forwardPass = calculateForwardPass(tasks, dependencies);
    const completeTasks = calculateBackwardPass(forwardPass);

    return completeTasks
        .filter(node => node.isCritical)
        .map(node => ({
            ...node.task,
            float: node.float,
            isCritical: node.isCritical
        }));
};

/**
 * Validate task dependencies for circular references
 */
export const validateDependencies = (tasks: Task[], dependencies: TaskDependency[]): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];
    const taskIds = new Set(tasks.map(t => t.id));

    // Check for invalid task references
    dependencies.forEach(dep => {
        if (!taskIds.has(dep.predecessorId)) {
            errors.push(`Invalid predecessor task ID: ${dep.predecessorId}`);
        }
        if (!taskIds.has(dep.successorId)) {
            errors.push(`Invalid successor task ID: ${dep.successorId}`);
        }
    });

    // Check for circular dependencies using topological sort
    try {
        calculateForwardPass(tasks, dependencies);
    } catch (error) {
        errors.push('Circular dependency detected in task relationships');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};