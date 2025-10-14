import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    Notification,
    NotificationPreferences,
    NotificationType,
    EmailFrequency,
    DeliveryMethod
} from '@/types/notifications';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    subscribeToNotifications,
    updateNotificationPreferences,
    getNotificationPreferences
} from '@/services/notificationService';
import { useAppContext } from './AppContext';

interface NotificationContextType {
    // State
    notifications: Notification[];
    unreadCount: number;
    preferences: NotificationPreferences | null;
    loading: boolean;
    error: string | null;

    // Actions
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
    sendTestNotification: (type: NotificationType, title: string, message: string) => Promise<void>;

    // Real-time subscription
    isSubscribed: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { user } = useAppContext();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Load user preferences
    const loadPreferences = useCallback(async () => {
        if (!user?.id) return;

        try {
            const userPrefs = await getNotificationPreferences(user.id);
            setPreferences(userPrefs);
        } catch (err) {
            console.error('Error loading notification preferences:', err);
            // Set default preferences if none exist
            const defaultPrefs: NotificationPreferences = {
                userId: user.id,
                email: {
                    enabled: true,
                    types: [NotificationType.PROJECT_UPDATED, NotificationType.DEADLINE_APPROACHING, NotificationType.PAYMENT_RECEIVED],
                    frequency: EmailFrequency.IMMEDIATE
                },
                browser: {
                    enabled: true,
                    types: [NotificationType.PROJECT_UPDATED, NotificationType.MESSAGE_RECEIVED, NotificationType.DEADLINE_APPROACHING],
                    sound: true
                },
                inApp: {
                    enabled: true,
                    types: [NotificationType.PROJECT_UPDATED, NotificationType.MESSAGE_RECEIVED, NotificationType.SYSTEM_ANNOUNCEMENT, NotificationType.TIMER_STARTED],
                    showBadge: true
                },
                quietHours: {
                    enabled: false,
                    start: '22:00',
                    end: '08:00',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                updatedAt: null as any // Will be set by the service
            };
            setPreferences(defaultPrefs);
        }
    }, [user?.id]);

    // Refresh notifications
    const refreshNotifications = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);
            const result = await getNotifications({ userId: user.id, limit: 100 });
            setNotifications(result.notifications);
        } catch (err) {
            console.error('Error refreshing notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError('Failed to mark notification as read');
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return;

        try {
            await markAllNotificationsAsRead(user.id);
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError('Failed to mark all notifications as read');
        }
    }, [user?.id]);

    // Update notification preferences
    const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
        if (!user?.id || !preferences) return;

        try {
            const updatedPrefs = { ...preferences, ...newPreferences };
            await updateNotificationPreferences(user.id, updatedPrefs);
            setPreferences(updatedPrefs);
        } catch (err) {
            console.error('Error updating notification preferences:', err);
            setError('Failed to update preferences');
        }
    }, [user?.id, preferences]);

    // Send test notification (for development/testing)
    const sendTestNotification = useCallback(async (
        type: NotificationType,
        title: string,
        message: string
    ) => {
        if (!user?.id) return;

        try {
            // This would typically call a service method to create a test notification
            console.log('Sending test notification:', { type, title, message });
            // For now, just refresh to show any new notifications
            await refreshNotifications();
        } catch (err) {
            console.error('Error sending test notification:', err);
            setError('Failed to send test notification');
        }
    }, [user?.id, refreshNotifications]);

    // Set up real-time subscription
    useEffect(() => {
        if (!user?.id) {
            setNotifications([]);
            setPreferences(null);
            setIsSubscribed(false);
            return;
        }

        // Load preferences
        loadPreferences();

        // Set up real-time subscription
        const unsubscribe = subscribeToNotifications(
            user.id,
            (updatedNotifications) => {
                setNotifications(updatedNotifications);
                setIsSubscribed(true);
            }
        );

        // Initial load
        refreshNotifications();

        return () => {
            unsubscribe();
            setIsSubscribed(false);
        };
    }, [user?.id, loadPreferences, refreshNotifications]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        preferences,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        updatePreferences,
        sendTestNotification,
        isSubscribed
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};

// Helper hook for accessing notification state in components
export const useNotifications = () => {
    const { notifications, unreadCount, loading } = useNotificationContext();
    return { notifications, unreadCount, loading };
};

// Helper hook for notification actions
export const useNotificationActions = () => {
    const { markAsRead, markAllAsRead, refreshNotifications } = useNotificationContext();
    return { markAsRead, markAllAsRead, refreshNotifications };
};

// Helper hook for notification preferences
export const useNotificationPreferences = () => {
    const { preferences, updatePreferences } = useNotificationContext();
    return { preferences, updatePreferences };
};