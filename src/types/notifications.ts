import { Timestamp } from 'firebase/firestore';

// Notification types
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: NotificationData;
    read: boolean;
    readAt?: Timestamp;
    createdAt: Timestamp;
    expiresAt?: Timestamp;
    priority: NotificationPriority;
    category: NotificationCategory;
    actions?: NotificationAction[];
}

export interface NotificationData {
    projectId?: string;
    jobCardId?: string;
    messageId?: string;
    userId?: string;
    deadline?: Timestamp;
    amount?: number;
    [key: string]: any;
}

export interface NotificationAction {
    label: string;
    action: string;
    url?: string;
    primary?: boolean;
}

export enum NotificationType {
    PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
    PROJECT_UPDATED = 'PROJECT_UPDATED',
    PROJECT_COMPLETED = 'PROJECT_COMPLETED',
    JOB_CARD_ASSIGNED = 'JOB_CARD_ASSIGNED',
    JOB_CARD_UPDATED = 'JOB_CARD_UPDATED',
    JOB_CARD_COMPLETED = 'JOB_CARD_COMPLETED',
    MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
    DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
    DEADLINE_OVERDUE = 'DEADLINE_OVERDUE',
    TIMER_STARTED = 'TIMER_STARTED',
    TIMER_STOPPED = 'TIMER_STOPPED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export enum NotificationCategory {
    PROJECT = 'PROJECT',
    MESSAGING = 'MESSAGING',
    TIMER = 'TIMER',
    PAYMENT = 'PAYMENT',
    SYSTEM = 'SYSTEM'
}

// User notification preferences
export interface NotificationPreferences {
    userId: string;
    email: {
        enabled: boolean;
        types: NotificationType[];
        frequency: EmailFrequency;
    };
    browser: {
        enabled: boolean;
        types: NotificationType[];
        sound: boolean;
    };
    inApp: {
        enabled: boolean;
        types: NotificationType[];
        showBadge: boolean;
    };
    quietHours: {
        enabled: boolean;
        start: string; // HH:mm format
        end: string; // HH:mm format
        timezone: string;
    };
    updatedAt: Timestamp;
}

export enum EmailFrequency {
    IMMEDIATE = 'IMMEDIATE',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    NEVER = 'NEVER'
}

// Notification settings for different user roles
export interface RoleNotificationDefaults {
    [role: string]: {
        email: NotificationType[];
        browser: NotificationType[];
        inApp: NotificationType[];
    };
}

// Notification delivery methods
export enum DeliveryMethod {
    EMAIL = 'EMAIL',
    BROWSER = 'BROWSER',
    IN_APP = 'IN_APP',
    PUSH = 'PUSH'
}

// Notification queue for batching
export interface NotificationQueue {
    id: string;
    userId: string;
    notifications: Notification[];
    batchKey: string;
    createdAt: Timestamp;
    processedAt?: Timestamp;
    status: QueueStatus;
}

export enum QueueStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

// Notification templates
export interface NotificationTemplate {
    type: NotificationType;
    title: string;
    message: string;
    actions?: NotificationAction[];
    priority: NotificationPriority;
    category: NotificationCategory;
    ttl?: number; // Time to live in hours
}

// Notification statistics
export interface NotificationStats {
    userId: string;
    totalSent: number;
    totalRead: number;
    totalClicked: number;
    byType: Record<NotificationType, number>;
    byCategory: Record<NotificationCategory, number>;
    lastActivity: Timestamp;
}

// Firebase Cloud Messaging types
export interface FCMToken {
    id: string;
    userId: string;
    token: string;
    deviceId: string;
    platform: Platform;
    createdAt: Timestamp;
    lastUsed: Timestamp;
}

export enum Platform {
    WEB = 'WEB',
    IOS = 'IOS',
    ANDROID = 'ANDROID'
}

export interface FCMMessage {
    token: string;
    notification: {
        title: string;
        body: string;
    };
    data?: Record<string, string>;
    webpush?: {
        fcm_options: {
            link: string;
        };
    };
}

// Notification service types
export interface NotificationFilter {
    read?: boolean;
    type?: NotificationType[];
    category?: NotificationCategory[];
    priority?: NotificationPriority[];
    dateFrom?: Timestamp;
    dateTo?: Timestamp;
}

export interface NotificationQuery {
    userId: string;
    filter?: NotificationFilter;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'priority';
    orderDirection?: 'asc' | 'desc';
}

export interface PaginatedNotifications {
    notifications: Notification[];
    total: number;
    hasMore: boolean;
    nextOffset?: number;
}

// Event callback types
export type NotificationCallback = (notification: Notification) => void;
export type NotificationStatsCallback = (stats: NotificationStats) => void;