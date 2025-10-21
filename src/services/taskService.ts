import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch,
    onSnapshot,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { Task, TaskStatus, TimeLog, User, UserRole } from '../types';
import { NotificationType, NotificationPriority, NotificationCategory } from '../types/notifications';
import { createNotification } from './notificationService';
import { MessagingService } from './messaging/MessagingService';
import { getJobById } from './jobService';
import { ChannelType } from '../types/messaging';

/**
 * Firebase Task Service
 * Handles all task-related Firestore operations within the hierarchical structure
 */

const TASKS_COLLECTION = 'tasks';
const TIME_LOGS_COLLECTION = 'timeLogs';

/**
 * Get task by ID
 */
export const getTaskById = async (taskId: string): Promise<Task | null> => {
    try {
        const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));

        if (taskDoc.exists()) {
            const taskData = taskDoc.data() as Omit<Task, 'id'>;
            if (taskData) {
                return {
                    id: taskDoc.id,
                    ...taskData,
                    createdAt: taskData.createdAt || serverTimestamp(),
                    updatedAt: taskData.updatedAt || serverTimestamp(),
                } as Task;
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching task:', error);
        throw new Error('Failed to fetch task data');
    }
};

/**
 * Get tasks by job ID
 */
export const getTasksByJob = async (jobId: string): Promise<Task[]> => {
    try {
        const q = query(
            collection(db, TASKS_COLLECTION),
            where('jobId', '==', jobId),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const tasks: Task[] = [];

        querySnapshot.forEach((doc) => {
            const taskData = doc.data() as Omit<Task, 'id'>;
            if (taskData) {
                tasks.push({
                    id: doc.id,
                    ...taskData,
                    createdAt: taskData.createdAt || serverTimestamp(),
                    updatedAt: taskData.updatedAt || serverTimestamp(),
                } as Task);
            }
        });

        return tasks;
    } catch (error) {
        console.error('Error fetching tasks by job:', error);
        throw new Error('Failed to fetch job tasks');
    }
};

/**
 * Get tasks by assignee
 */
export const getTasksByAssignee = async (assigneeId: string): Promise<Task[]> => {
    try {
        const q = query(
            collection(db, TASKS_COLLECTION),
            where('assignedToId', '==', assigneeId),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const tasks: Task[] = [];

        querySnapshot.forEach((doc) => {
            const taskData = doc.data() as Omit<Task, 'id'>;
            if (taskData) {
                tasks.push({
                    id: doc.id,
                    ...taskData,
                    createdAt: taskData.createdAt || serverTimestamp(),
                    updatedAt: taskData.updatedAt || serverTimestamp(),
                } as Task);
            }
        });

        return tasks;
    } catch (error) {
        console.error('Error fetching tasks by assignee:', error);
        throw new Error('Failed to fetch assigned tasks');
    }
};

/**
 * Create a new task
 */
export const createTask = async (
    jobId: string,
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'timeLogs' | 'jobId'>,
    _createdBy: User
): Promise<string> => {
    try {
        const now = serverTimestamp();

        const newTask: Omit<Task, 'id'> = {
            ...taskData,
            jobId,
            status: TaskStatus.TODO,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            timeLogs: [],
        };

        const docRef = doc(collection(db, TASKS_COLLECTION));
        await setDoc(docRef, newTask);

        // Notify assignee if assigned
        if (taskData.assignedToId) {
            await notifyTaskAssignment(docRef.id, taskData, taskData.assignedToId);
        }

        console.log('Task created successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task');
    }
};

/**
 * Update task
 */
export const updateTask = async (
    taskId: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, TASKS_COLLECTION, taskId), updateData);

        // Notify assignee of important updates
        if (updates.status || updates.assignedToId) {
            const task = await getTaskById(taskId);
            if (task) {
                await notifyTaskUpdate(taskId, task, updates);
            }
        }

        console.log('Task updated successfully:', taskId);
    } catch (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task');
    }
};

/**
 * Delete task
 */
export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // Delete the task document
        batch.delete(doc(db, TASKS_COLLECTION, taskId));

        // Delete associated time logs
        const timeLogsQuery = query(
            collection(db, TIME_LOGS_COLLECTION),
            where('taskId', '==', taskId)
        );
        const timeLogsSnapshot = await getDocs(timeLogsQuery);

        timeLogsSnapshot.forEach((timeLogDoc) => {
            batch.delete(timeLogDoc.ref);
        });

        await batch.commit();
        console.log('Task and associated time logs deleted successfully:', taskId);
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error('Failed to delete task');
    }
};

/**
 * Add time log to task
 */
export const addTimeLogToTask = async (
    taskId: string,
    timeLogData: Omit<TimeLog, 'id' | 'createdAt' | 'updatedAt' | 'taskId'>
): Promise<string> => {
    try {
        const now = serverTimestamp();

        const newTimeLog: Omit<TimeLog, 'id'> = {
            ...timeLogData,
            taskId,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
        };

        // Create time log document
        const timeLogRef = doc(collection(db, TIME_LOGS_COLLECTION));
        await setDoc(timeLogRef, newTimeLog);

        // Update task to include time log reference
        const task = await getTaskById(taskId);
        if (task) {
            const updatedTimeLogs = [...(task.timeLogs || []), {
                id: timeLogRef.id,
                ...newTimeLog,
            }];

            await updateTask(taskId, {
                timeLogs: updatedTimeLogs,
            });
        }

        console.log('Time log added successfully:', timeLogRef.id);
        return timeLogRef.id;
    } catch (error) {
        console.error('Error adding time log:', error);
        throw new Error('Failed to add time log');
    }
};

/**
 * Get time logs by task
 */
export const getTimeLogsByTask = async (taskId: string): Promise<TimeLog[]> => {
    try {
        const q = query(
            collection(db, TIME_LOGS_COLLECTION),
            where('taskId', '==', taskId),
            orderBy('startTime', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const timeLogs: TimeLog[] = [];

        querySnapshot.forEach((doc) => {
            const timeLogData = doc.data() as Omit<TimeLog, 'id'>;
            if (timeLogData) {
                timeLogs.push({
                    id: doc.id,
                    ...timeLogData,
                    createdAt: timeLogData.createdAt || serverTimestamp(),
                    updatedAt: timeLogData.updatedAt || serverTimestamp(),
                } as TimeLog);
            }
        });

        return timeLogs;
    } catch (error) {
        console.error('Error fetching time logs by task:', error);
        throw new Error('Failed to fetch task time logs');
    }
};

/**
 * Notify task assignee about assignment
 */
const notifyTaskAssignment = async (
    taskId: string,
    taskData: any,
    assigneeId: string
): Promise<void> => {
    try {
        // Get project ID from job
        const job = await getJobById(taskData.jobId);
        if (!job) {
            console.error('Job not found for task assignment notification');
            return;
        }

        // Create notification
        await createNotification({
            userId: assigneeId,
            type: NotificationType.PROJECT_UPDATED, // Could add TASK_ASSIGNED type
            title: `New task assigned: ${taskData.title}`,
            message: `You have been assigned to task "${taskData.title}". Please review the task details and requirements.`,
            priority: NotificationPriority.HIGH,
            category: NotificationCategory.PROJECT,
            data: {
                taskId,
                taskTitle: taskData.title,
                jobId: taskData.jobId
            }
        });

        // Send project message
        const messagingService = new MessagingService();
        await messagingService.sendMessage(
            job.projectId,
            `Task "${taskData.title}" has been assigned to you. Please review the task details and requirements.`,
            'system', // System message
            'System',
            UserRole.ADMIN,
            ChannelType.PROJECT_GENERAL
        );
    } catch (error) {
        console.error('Error notifying task assignment:', error);
        // Don't throw - notification failure shouldn't break task creation
    }
};

/**
 * Notify relevant users about task updates
 */
const notifyTaskUpdate = async (
    taskId: string,
    task: Task,
    updates: any
): Promise<void> => {
    try {
        const notifications: any[] = [];

        // Get project ID from job
        const job = await getJobById(task.jobId);
        if (!job) {
            console.error('Job not found for task update notification');
            return;
        }

        // Notify about status changes
        if (updates.status && updates.status !== task.status) {
            const statusMessage = getTaskStatusChangeMessage(updates.status);
            if (task.assignedToId) {
                notifications.push({
                    userId: task.assignedToId,
                    type: NotificationType.PROJECT_UPDATED,
                    title: `Task status changed: ${task.title}`,
                    message: statusMessage,
                    priority: NotificationPriority.MEDIUM,
                    category: NotificationCategory.PROJECT,
                    data: {
                        taskId,
                        taskTitle: task.title,
                        oldStatus: task.status,
                        newStatus: updates.status
                    }
                });
            }

            // Send project message for status changes
            const messagingService = new MessagingService();
            await messagingService.sendMessage(
                job.projectId,
                `Task "${task.title}" status changed to ${updates.status}.`,
                'system',
                'System',
                UserRole.ADMIN,
                ChannelType.PROJECT_GENERAL
            );
        }

        // Notify about new assignments
        if (updates.assignedToId && updates.assignedToId !== task.assignedToId) {
            notifications.push({
                userId: updates.assignedToId,
                type: NotificationType.PROJECT_UPDATED,
                title: `Task assigned: ${task.title}`,
                message: `You have been assigned to task "${task.title}".`,
                priority: NotificationPriority.HIGH,
                category: NotificationCategory.PROJECT,
                data: {
                    taskId,
                    taskTitle: task.title,
                    jobId: task.jobId
                }
            });

            // Send project message for new assignments
            const messagingService = new MessagingService();
            await messagingService.sendMessage(
                job.projectId,
                `Task "${task.title}" has been assigned to a new team member.`,
                'system',
                'System',
                UserRole.ADMIN,
                ChannelType.PROJECT_GENERAL
            );
        }

        // Send all notifications
        if (notifications.length > 0) {
            const notificationPromises = notifications.map(notification =>
                createNotification(notification)
            );
            await Promise.all(notificationPromises);
        }
    } catch (error) {
        console.error('Error notifying task update:', error);
        // Don't throw - notification failure shouldn't break task updates
    }
};

/**
 * Get task status change message
 */
const getTaskStatusChangeMessage = (newStatus: TaskStatus): string => {
    switch (newStatus) {
        case TaskStatus.IN_PROGRESS:
            return 'The task is now in progress.';
        case TaskStatus.REVIEW:
            return 'The task is ready for review.';
        case TaskStatus.COMPLETED:
            return 'The task has been completed successfully.';
        case TaskStatus.ON_HOLD:
            return 'The task has been put on hold.';
        default:
            return `Task status changed to ${newStatus}.`;
    }
};

// Re-export dependency management functions
export {
    createTaskDependency,
    getTaskDependencies,
    getProjectDependencies,
    updateTaskDependency,
    deleteTaskDependency,
    createBulkDependencies,
    getCriticalDependencies,
    recalculateTaskDates
} from './taskDependencyService';