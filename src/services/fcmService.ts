import {
    getToken,
    onMessage,
    Messaging,
    MessagePayload
} from 'firebase/messaging';
import { messaging } from '../firebase';
import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { FCMToken, Platform } from '../types/notifications';

const FCM_TOKENS_COLLECTION = 'fcmTokens';
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

/**
 * Request permission for push notifications and get FCM token.
 */
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
    try {
        if (!messaging) {
            console.warn('Firebase Cloud Messaging is not available');
            return null;
        }

        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission denied');
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY
        });

        if (token) {
            // Store the token in Firestore
            await storeFCMToken(userId, token);
            return token;
        }

        return null;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return null;
    }
};

/**
 * Store FCM token in Firestore.
 */
export const storeFCMToken = async (userId: string, token: string, platform: Platform = Platform.WEB): Promise<void> => {
    try {
        const deviceId = getDeviceId();
        const tokenData: Omit<FCMToken, 'id'> = {
            userId,
            token,
            deviceId,
            platform,
            createdAt: new Date(),
            lastUsed: new Date()
        };

        const tokenDocRef = doc(collection(db, FCM_TOKENS_COLLECTION), `${userId}_${deviceId}`);
        await setDoc(tokenDocRef, tokenData);
    } catch (error) {
        console.error('Error storing FCM token:', error);
        throw new Error('Failed to store FCM token');
    }
};

/**
 * Remove FCM token from Firestore.
 */
export const removeFCMToken = async (userId: string): Promise<void> => {
    try {
        const deviceId = getDeviceId();
        const tokenDocRef = doc(db, FCM_TOKENS_COLLECTION, `${userId}_${deviceId}`);
        await deleteDoc(tokenDocRef);
    } catch (error) {
        console.error('Error removing FCM token:', error);
        throw new Error('Failed to remove FCM token');
    }
};

/**
 * Get all FCM tokens for a user.
 */
export const getUserFCMTokens = async (userId: string): Promise<FCMToken[]> => {
    try {
        const tokensCollectionRef = collection(db, FCM_TOKENS_COLLECTION);
        const q = query(tokensCollectionRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FCMToken));
    } catch (error) {
        console.error('Error getting FCM tokens:', error);
        return [];
    }
};

/**
 * Listen for incoming FCM messages.
 */
export const onFCMMessage = (callback: (payload: MessagePayload) => void): (() => void) | null => {
    if (!messaging) {
        console.warn('Firebase Cloud Messaging is not available');
        return null;
    }

    try {
        return onMessage(messaging, callback);
    } catch (error) {
        console.error('Error setting up FCM message listener:', error);
        return null;
    }
};

/**
 * Send push notification via FCM (server-side function).
 * This would typically be called from a Cloud Function.
 */
export const sendFCMNotification = async (
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> => {
    try {
        // This is a client-side implementation for testing.
        // In production, this should be done server-side via Cloud Functions.
        const message = {
            to: token,
            notification: {
                title,
                body
            },
            data: data || {}
        };

        // For client-side testing, we'll just log the message
        // In production, you'd call your server endpoint
        console.log('FCM Notification:', message);

        return true;
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        return false;
    }
};

/**
 * Check if notifications are supported and enabled.
 */
export const isNotificationSupported = (): boolean => {
    return 'Notification' in window && messaging !== null;
};

/**
 * Get current notification permission status.
 */
export const getNotificationPermission = (): NotificationPermission => {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
};

/**
 * Generate a unique device ID.
 */
const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('fcm_device_id');
    if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('fcm_device_id', deviceId);
    }
    return deviceId;
};

/**
 * Initialize FCM for the current user.
 */
export const initializeFCM = async (userId: string): Promise<void> => {
    try {
        if (!isNotificationSupported()) {
            console.warn('FCM not supported in this environment');
            return;
        }

        // Request permission and get token
        const token = await requestNotificationPermission(userId);
        if (token) {
            console.log('FCM initialized successfully');

            // Set up message listener
            onFCMMessage((payload) => {
                console.log('Received FCM message:', payload);

                // Handle the message (could trigger local notification, update UI, etc.)
                if (payload.notification) {
                    showLocalNotification(payload.notification.title || '', payload.notification.body || '');
                }
            });
        }
    } catch (error) {
        console.error('Error initializing FCM:', error);
    }
};

/**
 * Show a local browser notification.
 */
const showLocalNotification = (title: string, body: string): void => {
    if (getNotificationPermission() === 'granted') {
        new Notification(title, {
            body,
            icon: '/favicon.ico'
        });
    }
};