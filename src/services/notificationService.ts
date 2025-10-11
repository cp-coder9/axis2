import {
    doc,
    addDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
    onSnapshot,
    orderBy,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Notification, NotificationType } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create a new notification.
 */
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<string> => {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        const docRef = await addDoc(notificationsCollectionRef, {
            ...notificationData,
            isRead: false,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
    }
};

/**
 * Mark a notification as read.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notificationDocRef, {
            isRead: true,
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
        const q = query(notificationsCollectionRef, where('userId', '==', userId), where('isRead', '==', false));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error('Failed to mark all notifications as read');
    }
};

/**
 * Get all notifications for a user.
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        const q = query(notificationsCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
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
    callback: (notifications: Notification[]) => void
): (() => void) => {
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
    }, (error) => {
        console.error('Error in notifications subscription:', error);
        callback([]);
    });

    return unsubscribe;
};