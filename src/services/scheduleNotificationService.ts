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
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Schedule Notification Types
 */
export interface ScheduleNotification {
    id: string;
    projectId: string;
    type: 'SLIPPAGE' | 'RESOURCE_CONFLICT' | 'DEADLINE_APPROACH' | 'CRITICAL_PATH_CHANGE' | 'DEPENDENCY_VIOLATION';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    taskId?: string;
    jobId?: string;
    userId?: string; // User to notify
    isRead: boolean;
    isResolved: boolean;
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    metadata?: {
        expectedDate?: Date;
        actualDate?: Date;
        resourceId?: string;
        conflictDetails?: string;
        daysOverdue?: number;
        [key: string]: any;
    };
}

export interface NotificationSettings {
    userId: string;
    projectId: string;
    enabledNotifications: {
        slippage: boolean;
        resourceConflicts: boolean;
        deadlineApproaches: boolean;
        criticalPathChanges: boolean;
        dependencyViolations: boolean;
    };
    thresholds: {
        deadlineWarningDays: number; // Days before deadline to warn
        slippageThresholdDays: number; // Days of slippage before alerting
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Schedule Notification Service
 */
export const scheduleNotificationService = {
    /**
     * Create a new schedule notification
     */
    async createNotification(notification: Omit<ScheduleNotification, 'id' | 'createdAt' | 'isRead' | 'isResolved'>): Promise<string> {
        const notificationRef = doc(collection(db, 'scheduleNotifications'));
        const notificationData = {
            ...notification,
            id: notificationRef.id,
            createdAt: serverTimestamp(),
            isRead: false,
            isResolved: false
        };

        await setDoc(notificationRef, notificationData);
        return notificationRef.id;
    },

    /**
     * Get notifications for a project
     */
    async getProjectNotifications(projectId: string, userId?: string): Promise<ScheduleNotification[]> {
        let q = query(
            collection(db, 'scheduleNotifications'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );

        if (userId) {
            q = query(
                collection(db, 'scheduleNotifications'),
                where('projectId', '==', projectId),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ScheduleNotification));
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        const notificationRef = doc(db, 'scheduleNotifications', notificationId);
        await updateDoc(notificationRef, {
            isRead: true
        });
    },

    /**
     * Mark notification as resolved
     */
    async markAsResolved(notificationId: string): Promise<void> {
        const notificationRef = doc(db, 'scheduleNotifications', notificationId);
        await updateDoc(notificationRef, {
            isResolved: true,
            resolvedAt: serverTimestamp()
        });
    },

    /**
     * Get notification settings for a user and project
     */
    async getNotificationSettings(userId: string, projectId: string): Promise<NotificationSettings | null> {
        const settingsRef = doc(db, 'notificationSettings', `${userId}_${projectId}`);
        const settingsDoc = await getDoc(settingsRef);

        if (!settingsDoc.exists()) return null;

        return settingsDoc.data() as NotificationSettings;
    },

    /**
     * Update notification settings
     */
    async updateNotificationSettings(userId: string, projectId: string, settings: Partial<NotificationSettings>): Promise<void> {
        const settingsRef = doc(db, 'notificationSettings', `${userId}_${projectId}`);
        await updateDoc(settingsRef, {
            ...settings,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Create default notification settings
     */
    async createDefaultNotificationSettings(userId: string, projectId: string): Promise<void> {
        const settingsRef = doc(db, 'notificationSettings', `${userId}_${projectId}`);
        const defaultSettings: Omit<NotificationSettings, 'id'> = {
            userId,
            projectId,
            enabledNotifications: {
                slippage: true,
                resourceConflicts: true,
                deadlineApproaches: true,
                criticalPathChanges: true,
                dependencyViolations: true
            },
            thresholds: {
                deadlineWarningDays: 3,
                slippageThresholdDays: 1
            },
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp
        };

        await setDoc(settingsRef, defaultSettings);
    },

    /**
     * Check for schedule issues and create notifications
     */
    async checkScheduleAndNotify(projectId: string, tasks: any[], dependencies: any[]): Promise<void> {
        // This would be called periodically or after schedule changes
        // For now, we'll implement basic checks

        const settings = await this.getNotificationSettings('current-user-id', projectId);
        if (!settings) return;

        // Check for deadline approaches
        if (settings.enabledNotifications.deadlineApproaches) {
            await this.checkDeadlineApproaches(projectId, tasks, settings);
        }

        // Check for slippage (this would compare with baseline)
        if (settings.enabledNotifications.slippage) {
            await this.checkScheduleSlippage(projectId, tasks, settings);
        }

        // Check for dependency violations
        if (settings.enabledNotifications.dependencyViolations) {
            await this.checkDependencyViolations(projectId, tasks, dependencies, settings);
        }
    },

    /**
     * Check for tasks approaching deadlines
     */
    async checkDeadlineApproaches(projectId: string, tasks: any[], settings: NotificationSettings): Promise<void> {
        const now = new Date();
        const warningThreshold = settings.thresholds.deadlineWarningDays;

        for (const task of tasks) {
            if (task.endDate && task.status !== 'COMPLETED') {
                const endDate = task.endDate.toDate();
                const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilDeadline <= warningThreshold && daysUntilDeadline > 0) {
                    await this.createNotification({
                        projectId,
                        type: 'DEADLINE_APPROACH',
                        severity: daysUntilDeadline <= 1 ? 'CRITICAL' : 'MEDIUM',
                        title: `Task deadline approaching: ${task.title}`,
                        message: `Task "${task.title}" is due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}.`,
                        taskId: task.id,
                        userId: task.assignedToId,
                        metadata: {
                            expectedDate: endDate,
                            daysOverdue: -daysUntilDeadline
                        }
                    });
                } else if (daysUntilDeadline < 0) {
                    // Overdue task
                    const daysOverdue = Math.abs(daysUntilDeadline);
                    await this.createNotification({
                        projectId,
                        type: 'SLIPPAGE',
                        severity: 'HIGH',
                        title: `Task overdue: ${task.title}`,
                        message: `Task "${task.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.`,
                        taskId: task.id,
                        userId: task.assignedToId,
                        metadata: {
                            expectedDate: endDate,
                            daysOverdue
                        }
                    });
                }
            }
        }
    },

    /**
     * Check for schedule slippage (would compare with baseline)
     */
    async checkScheduleSlippage(projectId: string, tasks: any[], settings: NotificationSettings): Promise<void> {
        // This would compare current schedule with baseline
        // For now, just check for tasks that are running late
        const now = new Date();

        for (const task of tasks) {
            if (task.endDate && task.status !== 'COMPLETED') {
                const endDate = task.endDate.toDate();
                if (endDate < now) {
                    const daysLate = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysLate >= settings.thresholds.slippageThresholdDays) {
                        await this.createNotification({
                            projectId,
                            type: 'SLIPPAGE',
                            severity: 'HIGH',
                            title: `Schedule slippage detected: ${task.title}`,
                            message: `Task "${task.title}" is ${daysLate} day${daysLate !== 1 ? 's' : ''} behind schedule.`,
                            taskId: task.id,
                            userId: task.assignedToId,
                            metadata: {
                                expectedDate: endDate,
                                actualDate: now,
                                daysOverdue: daysLate
                            }
                        });
                    }
                }
            }
        }
    },

    /**
     * Check for dependency violations
     */
    async checkDependencyViolations(projectId: string, tasks: any[], dependencies: any[], settings: NotificationSettings): Promise<void> {
        const taskMap = new Map(tasks.map(task => [task.id, task]));

        for (const dependency of dependencies) {
            const predecessor = taskMap.get(dependency.predecessorId);
            const successor = taskMap.get(dependency.successorId);

            if (!predecessor || !successor) continue;

            const predEnd = predecessor.endDate?.toDate();
            const succStart = successor.startDate?.toDate();

            if (predEnd && succStart && dependency.type === 'FS') {
                if (succStart < predEnd) {
                    await this.createNotification({
                        projectId,
                        type: 'DEPENDENCY_VIOLATION',
                        severity: 'HIGH',
                        title: 'Dependency violation detected',
                        message: `Task "${successor.title}" starts before "${predecessor.title}" finishes.`,
                        taskId: successor.id,
                        metadata: {
                            conflictDetails: `Predecessor ends: ${predEnd.toLocaleDateString()}, Successor starts: ${succStart.toLocaleDateString()}`
                        }
                    });
                }
            }
        }
    },

    /**
     * Subscribe to real-time notifications for a user
     */
    subscribeToNotifications(userId: string, callback: (notifications: ScheduleNotification[]) => void) {
        const q = query(
            collection(db, 'scheduleNotifications'),
            where('userId', '==', userId),
            where('isResolved', '==', false),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ScheduleNotification));
            callback(notifications);
        });
    }
};