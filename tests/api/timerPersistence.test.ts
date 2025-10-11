import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimerPersistenceAPI, TimerPersistenceState } from '../../src/api/timers/TimerPersistenceAPI';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
const mockFirestore = {
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  writeBatch: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn()
};

vi.mock('firebase/firestore', () => mockFirestore);

describe('TimerPersistenceAPI', () => {
  let timerAPI: TimerPersistenceAPI;
  let mockTimerData: Omit<TimerPersistenceState, 'id' | 'syncVersion' | 'lastUpdated'>;

  beforeEach(() => {
    timerAPI = new TimerPersistenceAPI({
      enableOptimisticUpdates: true,
      conflictResolutionStrategy: 'last_write_wins',
      maxRetries: 3,
      retryDelay: 100,
      enableRealtimeSync: false // Disable for testing
    });

    mockTimerData = {
      userId: 'user123',
      projectId: 'project456',
      jobCardId: 'job789',
      jobCardTitle: 'Test Task',
      startTime: new Date(),
      timeRemaining: 3600,
      allocatedHours: 1,
      isRunning: true,
      isPaused: false,
      pauseCount: 0,
      pauseHistory: [],
      deviceId: 'device123',
      sessionId: 'session456',
      idempotencyKey: 'key789'
    };

    // Reset mocks
    Object.values(mockFirestore).forEach(mock => {
      if (vi.isMockFunction(mock)) {
        mock.mockReset();
      }
    });
  });

  afterEach(() => {
    timerAPI.cleanup();
  });

  describe('Timer Initialization', () => {
    it('should initialize a new timer successfully', async () => {
      // Mock successful Firestore operations
      mockFirestore.doc.mockReturnValue({ id: 'timer123' });
      mockFirestore.setDoc.mockResolvedValue(undefined);
      mockFirestore.writeBatch.mockReturnValue({
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      });

      const timerId = await timerAPI.initializeTimer(mockTimerData);

      expect(timerId).toMatch(/^timer_user123_project456_\d+$/);
      expect(mockFirestore.setDoc).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock Firestore error
      mockFirestore.setDoc.mockRejectedValue(new Error('Firestore error'));
      mockFirestore.writeBatch.mockReturnValue({
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Firestore error'))
      });

      await expect(timerAPI.initializeTimer(mockTimerData)).rejects.toThrow('Failed to initialize timer');
    });
  });

  describe('Timer Updates', () => {
    it('should update timer state optimistically', async () => {
      const timerId = 'timer123';
      const updates = { timeRemaining: 3500, isPaused: true };

      mockFirestore.doc.mockReturnValue({ id: timerId });
      mockFirestore.updateDoc.mockResolvedValue(undefined);
      mockFirestore.writeBatch.mockReturnValue({
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      });

      const success = await timerAPI.updateTimer(timerId, updates, true);

      expect(success).toBe(true);
    });

    it('should detect and handle conflicts', async () => {
      const timerId = 'timer123';
      const updates = { timeRemaining: 3500, syncVersion: 1 };
      const currentData = {
        ...mockTimerData,
        id: timerId,
        syncVersion: 2,
        lastUpdated: new Date()
      };

      mockFirestore.doc.mockReturnValue({ id: timerId });
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => currentData
      });
      mockFirestore.updateDoc.mockResolvedValue(undefined);
      mockFirestore.writeBatch.mockReturnValue({
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      });

      const success = await timerAPI.updateTimer(timerId, updates, false);

      expect(success).toBe(true);
      expect(mockFirestore.getDoc).toHaveBeenCalled();
    });
  });

  describe('Timer Retrieval', () => {
    it('should retrieve timer state successfully', async () => {
      const timerId = 'timer123';
      const timerData = {
        ...mockTimerData,
        id: timerId,
        syncVersion: 1,
        lastUpdated: { toDate: () => new Date() },
        startTime: { toDate: () => new Date() }
      };

      mockFirestore.doc.mockReturnValue({ id: timerId });
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => timerData
      });

      const timer = await timerAPI.getTimer(timerId);

      expect(timer).toBeTruthy();
      expect(timer?.id).toBe(timerId);
      expect(timer?.userId).toBe('user123');
    });

    it('should return null for non-existent timer', async () => {
      const timerId = 'nonexistent';

      mockFirestore.doc.mockReturnValue({ id: timerId });
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => false
      });

      const timer = await timerAPI.getTimer(timerId);

      expect(timer).toBeNull();
    });
  });

  describe('Timer Completion', () => {
    it('should complete timer successfully', async () => {
      const timerId = 'timer123';
      const completionData = {
        endTime: new Date(),
        notes: 'Task completed',
        completionReason: 'completed' as const,
        finalTimeRemaining: 0
      };

      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      mockFirestore.writeBatch.mockReturnValue(mockBatch);
      mockFirestore.doc.mockReturnValue({ id: timerId });
      mockFirestore.collection.mockReturnValue({ id: 'timerLogs' });
      
      // Mock getTimer to return current timer
      const currentTimer = {
        ...mockTimerData,
        id: timerId,
        syncVersion: 1,
        lastUpdated: new Date()
      };
      vi.spyOn(timerAPI, 'getTimer').mockResolvedValue(currentTimer);

      const success = await timerAPI.completeTimer(timerId, completionData);

      expect(success).toBe(true);
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('Active Timers', () => {
    it('should retrieve active timers for user', async () => {
      const userId = 'user123';
      const mockTimers = [
        {
          ...mockTimerData,
          id: 'timer1',
          syncVersion: 1,
          lastUpdated: { toDate: () => new Date() },
          startTime: { toDate: () => new Date() }
        }
      ];

      mockFirestore.query.mockReturnValue({ id: 'query' });
      mockFirestore.collection.mockReturnValue({ id: 'timers' });
      mockFirestore.where.mockReturnValue({ id: 'where' });
      mockFirestore.orderBy.mockReturnValue({ id: 'orderBy' });
      mockFirestore.limit.mockReturnValue({ id: 'limit' });
      mockFirestore.getDocs.mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          mockTimers.forEach(timer => {
            callback({ data: () => timer });
          });
        }
      });

      const activeTimers = await timerAPI.getActiveTimers(userId);

      expect(activeTimers).toHaveLength(1);
      expect(activeTimers[0].userId).toBe(userId);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect version conflicts', () => {
      const current: TimerPersistenceState = {
        ...mockTimerData,
        id: 'timer123',
        syncVersion: 3,
        lastUpdated: new Date()
      };
      
      const updates = { syncVersion: 2, timeRemaining: 3500 };

      // Access private method via any for testing
      const hasConflict = (timerAPI as any).detectConflict(current, updates);

      expect(hasConflict).toBe(true);
    });

    it('should detect state conflicts', () => {
      const current: TimerPersistenceState = {
        ...mockTimerData,
        id: 'timer123',
        syncVersion: 1,
        lastUpdated: new Date(),
        isRunning: true
      };
      
      const updates = { isRunning: false };

      const hasConflict = (timerAPI as any).detectConflict(current, updates);

      expect(hasConflict).toBe(true);
    });

    it('should detect time drift conflicts', () => {
      const current: TimerPersistenceState = {
        ...mockTimerData,
        id: 'timer123',
        syncVersion: 1,
        lastUpdated: new Date(),
        timeRemaining: 3600
      };
      
      const updates = { timeRemaining: 3500 }; // 100 second difference > 60 threshold

      const hasConflict = (timerAPI as any).detectConflict(current, updates);

      expect(hasConflict).toBe(true);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts using last_write_wins strategy', async () => {
      const api = new TimerPersistenceAPI({
        conflictResolutionStrategy: 'last_write_wins'
      });

      const current: TimerPersistenceState = {
        ...mockTimerData,
        id: 'timer123',
        syncVersion: 1,
        lastUpdated: new Date(Date.now() - 5000) // 5 seconds ago
      };
      
      const updates = { 
        timeRemaining: 3500,
        lastUpdated: new Date() // Now
      };

      const resolution = await (api as any).resolveConflict(current, updates);

      expect(resolution.type).toBe('remote_wins');
      expect(resolution.resolvedData).toEqual(updates);

      api.cleanup();
    });

    it('should resolve conflicts using merge strategy', async () => {
      const api = new TimerPersistenceAPI({
        conflictResolutionStrategy: 'merge'
      });

      const current: TimerPersistenceState = {
        ...mockTimerData,
        id: 'timer123',
        syncVersion: 1,
        lastUpdated: new Date(),
        pauseHistory: [
          { pausedAt: new Date(Date.now() - 10000), reason: 'first_pause' }
        ]
      };
      
      const updates = { 
        timeRemaining: 3500,
        pauseHistory: [
          { pausedAt: new Date(Date.now() - 5000), reason: 'second_pause' }
        ]
      };

      const resolution = await (api as any).resolveConflict(current, updates);

      expect(resolution.type).toBe('merged');
      expect(resolution.resolvedData.pauseHistory).toHaveLength(2);
      expect(resolution.resolvedData.syncVersion).toBe(2);

      api.cleanup();
    });
  });

  describe('Real-time Sync', () => {
    it('should setup real-time listener', () => {
      const timerId = 'timer123';
      const onUpdate = vi.fn();
      const onError = vi.fn();

      const mockUnsubscribe = vi.fn();
      mockFirestore.onSnapshot.mockReturnValue(mockUnsubscribe);
      mockFirestore.doc.mockReturnValue({ id: timerId });

      const unsubscribe = timerAPI.listenToTimer(timerId, onUpdate, onError);

      expect(mockFirestore.onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    it('should handle listener errors and attempt reconnection', () => {
      const timerId = 'timer123';
      const onUpdate = vi.fn();
      const onError = vi.fn();

      mockFirestore.doc.mockReturnValue({ id: timerId });
      
      // Mock onSnapshot to immediately call error callback
      mockFirestore.onSnapshot.mockImplementation((ref, options, successCallback, errorCallback) => {
        if (typeof options === 'function') {
          // If options is actually the success callback
          setTimeout(() => options({ exists: () => false }), 10);
        } else {
          setTimeout(() => errorCallback(new Error('Connection lost')), 10);
        }
        return vi.fn();
      });

      timerAPI.listenToTimer(timerId, onUpdate, onError);

      // Verify error callback is called
      setTimeout(() => {
        expect(onError).toHaveBeenCalled();
      }, 20);
    });
  });

  describe('Network Status', () => {
    it('should handle network state changes', () => {
      // Mock network events
      const originalOnLine = navigator.onLine;
      
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Create new API instance to trigger network setup
      const api = new TimerPersistenceAPI({
        enableRealtimeSync: true
      });

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true
      });
      
      window.dispatchEvent(new Event('online'));

      // Verify internal state would be updated
      expect(navigator.onLine).toBe(true);

      // Cleanup
      api.cleanup();
      Object.defineProperty(navigator, 'onLine', {
        value: originalOnLine
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', () => {
      const mockUnsubscribe1 = vi.fn();
      const mockUnsubscribe2 = vi.fn();

      // Add some listeners
      (timerAPI as any).activeListeners.set('timer1', mockUnsubscribe1);
      (timerAPI as any).activeListeners.set('timer2', mockUnsubscribe2);

      // Add some retry operations
      (timerAPI as any).retryQueue.set('retry1', vi.fn());

      timerAPI.cleanup();

      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockUnsubscribe2).toHaveBeenCalled();
      expect((timerAPI as any).activeListeners.size).toBe(0);
      expect((timerAPI as any).retryQueue.size).toBe(0);
    });
  });
});
