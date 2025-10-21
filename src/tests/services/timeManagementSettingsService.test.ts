import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firestore functions before importing the service
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}));

// Mock Firebase
vi.mock('@/firebase', () => ({
  db: {}
}));

import { db } from '@/firebase';
import {
  getTimeManagementSettings,
  updateTimeManagementSettings,
  resetTimeManagementSettingsToDefaults
} from '@/services/timeManagementSettingsService';

// Get references to mocked functions
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

describe('TimeManagementSettingsService', () => {
  const mockSettings = {
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

  const defaultSettings = {
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

  beforeEach(() => {
    vi.clearAllMocks();
    (serverTimestamp as any).mockReturnValue({ seconds: 1234567890, nanoseconds: 0 });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getTimeManagementSettings', () => {
    it('should return existing settings from Firestore', async () => {
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => mockSettings
      };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);

      const result = await getTimeManagementSettings();

      expect(doc).toHaveBeenCalledWith(db, 'systemSettings', 'timeManagement');
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toEqual(mockSettings);
    });

    it('should return default settings when document does not exist', async () => {
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => false
      };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);

      const result = await getTimeManagementSettings();

      expect(doc).toHaveBeenCalledWith(db, 'systemSettings', 'timeManagement');
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toEqual(defaultSettings);
    });

    it('should return default settings when Firestore operation fails', async () => {
      const mockDocRef = {};
      const error = new Error('Firestore error');

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockRejectedValue(error);

      const result = await getTimeManagementSettings();

      expect(result).toEqual(defaultSettings);
    });
  });

  describe('updateTimeManagementSettings', () => {
    it('should update settings in Firestore', async () => {
      const mockDocRef = {};

      (doc as any).mockReturnValue(mockDocRef);
      (setDoc as any).mockResolvedValue(undefined);

      await updateTimeManagementSettings(mockSettings);

      expect(doc).toHaveBeenCalledWith(db, 'systemSettings', 'timeManagement');
      expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
        ...mockSettings,
        updatedAt: { seconds: 1234567890, nanoseconds: 0 }
      }, { merge: true });
    });

    it('should throw error when Firestore operation fails', async () => {
      const mockDocRef = {};
      const error = new Error('Firestore error');

      (doc as any).mockReturnValue(mockDocRef);
      (setDoc as any).mockRejectedValue(error);

      await expect(updateTimeManagementSettings(mockSettings)).rejects.toThrow('Failed to update time management settings');
    });
  });

  describe('resetTimeManagementSettingsToDefaults', () => {
    it('should reset settings to defaults in Firestore', async () => {
      const mockDocRef = {};

      (doc as any).mockReturnValue(mockDocRef);
      (setDoc as any).mockResolvedValue(undefined);

      await resetTimeManagementSettingsToDefaults();

      expect(doc).toHaveBeenCalledWith(db, 'systemSettings', 'timeManagement');
      expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
        ...defaultSettings,
        updatedAt: { seconds: 1234567890, nanoseconds: 0 }
      });
    });

    it('should throw error when Firestore operation fails', async () => {
      const mockDocRef = {};
      const error = new Error('Firestore error');

      (doc as any).mockReturnValue(mockDocRef);
      (setDoc as any).mockRejectedValue(error);

      await expect(resetTimeManagementSettingsToDefaults()).rejects.toThrow('Failed to reset time management settings');
    });
  });
});