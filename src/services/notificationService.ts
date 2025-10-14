import {
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    serverTimestamp,
    Timestamp,
    onSnapshot,
    orderBy,
    writeBatch,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    Notification,
    NotificationType,
    NotificationPriority,
    NotificationCategory,
    NotificationPreferences,
    NotificationFilter,
    NotificationQuery,
    PaginatedNotifications,
    NotificationStats,
    FCMToken
} from '../types/notifications';
import { initializeFCM, sendFCMNotification, getUserFCMTokens } from './fcmService';

const NOTIFICATIONS_COLLECTION = 'notifications';
const NOTIFICATION_PREFERENCES_COLLECTION = 'notificationPreferences';
const FCM_TOKENS_COLLECTION = 'fcmTokens';

/**
 * Create a new notification.
 */
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<string> => {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        const docRef = await addDoc(notificationsCollectionRef, {
            ...notificationData,
            read: false,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
    }
};

/**
 * Get a notification by ID.
 */
export const getNotification = async (notificationId: string): Promise<Notification | null> => {
    try {
        const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        const docSnap = await getDoc(notificationDocRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Notification;
        }
        return null;
    } catch (error) {
        console.error('Error getting notification:', error);
        throw new Error('Failed to get notification');
    }
};

/**
 * Update a notification.
 */
export const updateNotification = async (notificationId: string, updates: Partial<Notification>): Promise<void> => {
    try {
        const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notificationDocRef, updates);
    } catch (error) {
        console.error('Error updating notification:', error);
        throw new Error('Failed to update notification');
    }
};

/**
 * Delete a notification.
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
        const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await deleteDoc(notificationDocRef);
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw new Error('Failed to delete notification');
    }
};

/**
 * Mark a notification as read.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notificationDocRef, {
            read: true,
            readAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
    }
};

/**
 * Mark all notifications as read for a user.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        const q = query(notificationsCollectionRef, where('userId', '==', userId), where('read', '==', false));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.update(doc.ref, { read: true, readAt: serverTimestamp() });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error('Failed to mark all notifications as read');
    }
};

/**
 * Get notifications with filtering and pagination.
 */
export const getNotifications = async (queryParams: NotificationQuery): Promise<PaginatedNotifications> => {
    try {
        const { userId, filter = {}, limit: queryLimit = 50, offset = 0, orderBy: orderField = 'createdAt', orderDirection = 'desc' } = queryParams;

        let q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId)
        );

        // Apply filters
        if (filter.read !== undefined) {
            q = query(q, where('read', '==', filter.read));
        }

        if (filter.type && filter.type.length > 0) {
            q = query(q, where('type', 'in', filter.type.slice(0, 10))); // Firestore 'in' limit
        }

        if (filter.category && filter.category.length > 0) {
            q = query(q, where('category', 'in', filter.category.slice(0, 10)));
        }

        if (filter.priority) {
            q = query(q, where('priority', '==', filter.priority));
        }

        // Apply ordering
        const orderDirectionValue = orderDirection === 'asc' ? 'asc' : 'desc';
        q = query(q, orderBy(orderField, orderDirectionValue), limit(queryLimit + offset));

        const querySnapshot = await getDocs(q);
        const allDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));

        // Apply offset manually (since Firestore doesn't support offset directly)
        const notifications = allDocs.slice(offset);

        return {
            notifications,
            total: notifications.length, // This is approximate since we don't have total count
            hasMore: querySnapshot.docs.length === queryLimit + offset,
            nextOffset: offset + queryLimit
        };
    } catch (error) {
        console.error('Error getting notifications:', error);
        throw new Error('Failed to get notifications');
    }
};

/**
 * Subscribe to real-time updates for a user's notifications.
 */
export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void,
    filter?: NotificationFilter
): (() => void) => {
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    let q = query(notificationsCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    if (filter?.read !== undefined) {
        q = query(q, where('read', '==', filter.read));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
    }, (error) => {
        console.error('Error in notifications subscription:', error);
        callback([]);
    });

    return unsubscribe;
};

/**
 * Get notification preferences for a user.
 */
export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
    try {
        const preferencesDocRef = doc(db, NOTIFICATION_PREFERENCES_COLLECTION, userId);
        const docSnap = await getDoc(preferencesDocRef);

        if (docSnap.exists()) {
            return docSnap.data() as NotificationPreferences;
        }
        return null;
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        return null;
    }
};

/**
 * Update notification preferences for a user.
 */
export const updateNotificationPreferences = async (
    userId: string,
    preferences: Partial<NotificationPreferences>
): Promise<void> => {
    try {
        const preferencesDocRef = doc(db, NOTIFICATION_PREFERENCES_COLLECTION, userId);
        await setDoc(preferencesDocRef, {
            ...preferences,
            userId,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        throw new Error('Failed to update notification preferences');
    }
};

/**
 * Clean up expired notifications.
 */
export const cleanupExpiredNotifications = async (): Promise<number> => {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        const q = query(notificationsCollectionRef, where('expiresAt', '<', Timestamp.now()));
        const querySnapshot = await getDocs(q);

        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return querySnapshot.docs.length;
    } catch (error) {
        console.error('Error cleaning up expired notifications:', error);
        throw new Error('Failed to cleanup expired notifications');
    }
};

// FCM Integration Functions

/**
 * Initialize Firebase Cloud Messaging for a user.
 */
export const initializeUserFCM = async (userId: string): Promise<void> => {
    await initializeFCM(userId);
};

/**
 * Send a push notification to a user via FCM.
 */
export const sendPushNotification = async (
    userId: string,
    title: string,
    message: string,
    data?: Record<string, string>
): Promise<boolean> => {
    try {
        const tokens = await getUserFCMTokens(userId);
        let successCount = 0;

        for (const token of tokens) {
            const success = await sendFCMNotification(token.token, title, message, data);
            if (success) successCount++;
        }

        return successCount > 0;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};

/**
 * Send a notification with both in-app and push notification.
 */
export const sendNotificationWithPush = async (
    notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>,
    sendPush: boolean = true
): Promise<string> => {
    try {
        // Create the in-app notification
        const notificationId = await createNotification(notificationData);

        // Send push notification if requested and user has FCM enabled
        if (sendPush && notificationData.userId) {
            const preferences = await getNotificationPreferences(notificationData.userId);
            if (preferences?.browser.enabled && preferences.browser.types.includes(notificationData.type)) {
                await sendPushNotification(
                    notificationData.userId,
                    notificationData.title,
                    notificationData.message,
                    { notificationId, type: notificationData.type }
                );
            }
        }

        return notificationId;
    } catch (error) {
        console.error('Error sending notification with push:', error);
        throw new Error('Failed to send notification');
    }
};

// Project Event Triggers

/**
 * Trigger notification when a user is assigned to a project.
 */
export const notifyProjectAssignment = async (
    projectId: string,
    projectTitle: string,
    assigneeId: string,
    assigneeName: string,
    assignerName: string
): Promise<void> => {
    await sendNotificationWithPush({
        userId: assigneeId,
        type: NotificationType.PROJECT_ASSIGNED,
        title: 'Project Assigned',
        message: `${assignerName} assigned you to project "${projectTitle}"`,
        data: { projectId },
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.PROJECT
    });
};

/**
 * Trigger notification when a project status changes.
 */
export const notifyProjectStatusChange = async (
    projectId: string,
    projectTitle: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    teamMemberIds: string[]
): Promise<void> => {
    const notifications = teamMemberIds.map(memberId =>
        sendNotificationWithPush({
            userId: memberId,
            type: NotificationType.PROJECT_UPDATED,
            title: 'Project Status Updated',
            message: `Project "${projectTitle}" status changed from ${oldStatus} to ${newStatus}`,
            data: { projectId, oldStatus, newStatus },
            priority: NotificationPriority.MEDIUM,
            category: NotificationCategory.PROJECT
        })
    );

    await Promise.all(notifications);
};

/**
 * Trigger notification when a job card is assigned.
 */
export const notifyJobCardAssignment = async (
    projectId: string,
    projectTitle: string,
    jobCardId: string,
    jobCardTitle: string,
    assigneeId: string,
    assigneeName: string,
    assignerName: string
): Promise<void> => {
    await sendNotificationWithPush({
        userId: assigneeId,
        type: NotificationType.JOB_CARD_ASSIGNED,
        title: 'Task Assigned',
        message: `${assignerName} assigned you to "${jobCardTitle}" in project "${projectTitle}"`,
        data: { projectId, jobCardId },
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.PROJECT
    });
};

/**
 * Trigger notification when a job card status changes.
 */
export const notifyJobCardStatusChange = async (
    projectId: string,
    projectTitle: string,
    jobCardId: string,
    jobCardTitle: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    assigneeId: string
): Promise<void> => {
    await sendNotificationWithPush({
        userId: assigneeId,
        type: NotificationType.JOB_CARD_UPDATED,
        title: 'Task Status Updated',
        message: `Task "${jobCardTitle}" in project "${projectTitle}" changed from ${oldStatus} to ${newStatus}`,
        data: { projectId, jobCardId, oldStatus, newStatus },
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.PROJECT
    });
};

/**
 * Trigger notification for deadline reminders.
 */
export const notifyDeadlineReminder = async (
    projectId: string,
    projectTitle: string,
    deadline: Timestamp,
    daysUntilDeadline: number,
    teamMemberIds: string[]
): Promise<void> => {
    const priority = daysUntilDeadline <= 1 ? NotificationPriority.URGENT : daysUntilDeadline <= 3 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;
    const type = daysUntilDeadline <= 0 ? NotificationType.DEADLINE_OVERDUE : NotificationType.DEADLINE_APPROACHING;

    const title = daysUntilDeadline <= 0 ? 'Project Deadline Overdue' :
        daysUntilDeadline === 1 ? 'Project Deadline Tomorrow' :
            `Project Deadline in ${daysUntilDeadline} days`;

    const message = daysUntilDeadline <= 0 ?
        `Project "${projectTitle}" deadline has passed` :
        `Project "${projectTitle}" is due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`;

    const notifications = teamMemberIds.map(memberId =>
        sendNotificationWithPush({
            userId: memberId,
            type,
            title,
            message,
            data: { projectId, deadline: deadline, daysUntilDeadline },
            priority,
            category: NotificationCategory.PROJECT,
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // Expire in 24 hours
        })
    );

    await Promise.all(notifications);
};