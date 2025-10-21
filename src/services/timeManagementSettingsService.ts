import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface TimeManagementSettings {
    // Allocation Policies
    defaultAllocationLimit: number; // hours per freelancer per week
    autoApprovalThreshold: number; // hours below which auto-approval happens
    largeAllocationThreshold: number; // hours above which multi-admin approval needed

    // Pricing
    baseHourlyRate: number;
    premiumRateMultiplier: number;
    bulkPurchaseDiscount: number; // percentage

    // Timer Restrictions
    maxSessionDuration: number; // hours
    dailyTimeLimit: number; // hours
    enforceTimeSlotBoundaries: boolean;
    allowAdminOverride: boolean;

    // Audit & Compliance
    auditLogRetention: number; // days
    logAllTimerEvents: boolean;
    logAllocationChanges: boolean;
    logTimeSlotPurchases: boolean;

    // Admin Override
    requireAdminOverrideForLargeAllocations: boolean;
}

const SETTINGS_COLLECTION = 'systemSettings';
const TIME_MANAGEMENT_SETTINGS_DOC = 'timeManagement';

const DEFAULT_SETTINGS: TimeManagementSettings = {
    defaultAllocationLimit: 40,
    autoApprovalThreshold: 20,
    largeAllocationThreshold: 50,
    baseHourlyRate: 75,
    premiumRateMultiplier: 1.5,
    bulkPurchaseDiscount: 10,
    maxSessionDuration: 8,
    dailyTimeLimit: 10,
    enforceTimeSlotBoundaries: true,
    allowAdminOverride: true,
    auditLogRetention: 365,
    logAllTimerEvents: true,
    logAllocationChanges: true,
    logTimeSlotPurchases: true,
    requireAdminOverrideForLargeAllocations: true
};

/**
 * Get time management settings
 */
export const getTimeManagementSettings = async (): Promise<TimeManagementSettings> => {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, TIME_MANAGEMENT_SETTINGS_DOC);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
            return { ...DEFAULT_SETTINGS, ...settingsDoc.data() } as TimeManagementSettings;
        }

        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error getting time management settings:', error);
        return DEFAULT_SETTINGS;
    }
};

/**
 * Update time management settings
 */
export const updateTimeManagementSettings = async (
    settings: Partial<TimeManagementSettings>
): Promise<void> => {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, TIME_MANAGEMENT_SETTINGS_DOC);

        await setDoc(settingsRef, {
            ...settings,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating time management settings:', error);
        throw new Error('Failed to update time management settings');
    }
};

/**
 * Reset settings to defaults
 */
export const resetTimeManagementSettingsToDefaults = async (): Promise<void> => {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, TIME_MANAGEMENT_SETTINGS_DOC);

        await setDoc(settingsRef, {
            ...DEFAULT_SETTINGS,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error resetting time management settings:', error);
        throw new Error('Failed to reset time management settings');
    }
};