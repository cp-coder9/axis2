import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimerPersistenceAPI, type TimerPersistenceState } from '../../../src/api/timers/TimerPersistenceAPI';

// Mock Firebase
vi.mock('../../../src/lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  writeBatch: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn()
}));

describe('TimerPersistenceAPI', () => {
  let api: TimerPersistenceAPI;
  let mockTimerData: Omit<TimerPersistenceState, 'id' | 'syncVersion' | 'lastUpdated'>;

  beforeEach(() => {
    api = new TimerPersistenceAPI({
      enableOptimisticUpdates: true,
      conflictResolutionStrategy: 'last_write_wins',
      maxRetries: 3,
      retryDelay: 100
    });

    mockTimerData = {
      userId: 'user123',
      projectId: 'project456',
      jobCardId: 'job789',
      jobCardTitle: 'Test Job Card',
      startTime: new Date(),
      timeRemaining: 7200,
      allocatedHours: 2,
      isRunning: true,
      isPaused: false,
      pauseCount: 0,
      pauseHistory: [],
      deviceId: 'device123',
      sessionId: 'session456'
    };
  });

  afterEach(() => {
    api.cleanup();
    vi.clearAllMocks();
  });

  describe('Timer Initialization', () => {
    it('should initialize a new timer with correct data structure', async () => {
      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const timerId = await api.initializeTimer(mockTimerData);

      expect(timerId).toMatch(/^timer_user123_project456_\d+$/);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          projectId: 'project456',
          jobCardId: 'job789',
          isRunning: true,
          isPaused: false,
          pauseCount: 0
        })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(api.initializeTimer(mockTimerData)).rejects.toThrow('Failed to initialize timer');
    });
  });

  describe('Timer Updates', () => {
    it('should perform optimistic updates by default', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await api.updateTimer('timer123', {
        timeRemaining: 7100,
        pauseCount: 1
      });

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          timeRemaining: 7100,
          pauseCount: 1,
          syncVersion: 1
        })
      );
    });

    it('should handle update failures and queue retries', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockRejectedValue(new Error('Network error'));

      const result = await api.updateTimer('timer123', {
        timeRemaining: 7100
      });

      expect(result).toBe(false);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should detect and handle conflicts in non-optimistic mode', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      const mockCurrentData = {
        syncVersion: 5,
        timeRemaining: 7200,
        isRunning: true,
        lastUpdated: new Date()
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockCurrentData
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await api.updateTimer('timer123', {
        syncVersion: 3, // Lower version indicates conflict
        timeRemaining: 6900
      }, false);

      expect(result).toBe(true);
      expect(getDoc).toHaveBeenCalled();
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts using last_write_wins strategy', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      const olderTime = new Date(Date.now() - 10000);
      const newerTime = new Date();

      const mockCurrentData = {
        syncVersion: 5,
        timeRemaining: 7200,
        isRunning: true,
        lastUpdated: olderTime
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockCurrentData
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await api.updateTimer('timer123', {
        syncVersion: 3,
        timeRemaining: 6900,
        lastUpdated: newerTime
      }, false);

      expect(result).toBe(true);
      // Should accept the newer update despite lower sync version
    });
  });

  describe('Timer Completion', () => {
    it('should complete timer and create log entry', async () => {
      const { writeBatch, getDoc } = await import('firebase/firestore');
      
      const mockBatch = {
        update: vi.fn(),
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(getDoc).mockResolvedValue({
        data: () => ({ userId: 'user123', projectId: 'project456', jobCardId: 'job789' })
      } as any);

      const completionData = {
        endTime: new Date(),
        notes: 'Task completed successfully',
        completionReason: 'completed' as const,
        finalTimeRemaining: 0
      };

      const result = await api.completeTimer('timer123', completionData);

      expect(result).toBe(true);
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle completion errors gracefully', async () => {
      const { writeBatch } = await import('firebase/firestore');
      
      const mockBatch = {
        update: vi.fn(),
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Batch write failed'))
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      const completionData = {
        endTime: new Date(),
        completionReason: 'stopped' as const,
        finalTimeRemaining: 1800
      };

      const result = await api.completeTimer('timer123', completionData);

      expect(result).toBe(false);
    });
  });

  describe('Real-time Listeners', () => {
    it('should set up real-time listener with proper callbacks', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      
      const mockUnsubscribe = vi.fn();
      vi.mocked(onSnapshot).mockImplementation((_ref, onNext, _onError) => {
        // Simulate successful snapshot
        setTimeout(() => {
          if (typeof onNext === 'function') {
            onNext({
              exists: () => true,
              data: () => ({
                ...mockTimerData,
                id: 'timer123',
                syncVersion: 1,
                startTime: { toDate: () => mockTimerData.startTime },
                lastUpdated: { toDate: () => new Date() },
                pauseHistory: []
              })
            } as any);
          }
        }, 10);
        
        return mockUnsubscribe;
      });

      const onUpdate = vi.fn();
      const onError = vi.fn();

      const unsubscribe = api.listenToTimer('timer123', onUpdate, onError);

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(onSnapshot).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'timer123',
          userId: 'user123',
          projectId: 'project456'
        })
      );

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle listener errors', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      
      vi.mocked(onSnapshot).mockImplementation((_ref, _onNext, onError) => {
        setTimeout(() => {
          if (typeof onError === 'function') {
            onError(new Error('Listener error') as any);
          }
        }, 10);
        
        return vi.fn();
      });

      const onUpdate = vi.fn();
      const onError = vi.fn();

      api.listenToTimer('timer123', onUpdate, onError);

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('API Configuration', () => {
    it('should respect configuration options', () => {
      const customApi = new TimerPersistenceAPI({
        enableOptimisticUpdates: false,
        conflictResolutionStrategy: 'merge',
        maxRetries: 5,
        retryDelay: 2000
      });

      expect(customApi).toBeInstanceOf(TimerPersistenceAPI);
    });

    it('should use default configuration when none provided', () => {
      const defaultApi = new TimerPersistenceAPI();
      
      expect(defaultApi).toBeInstanceOf(TimerPersistenceAPI);
    });
  });

  describe('Cleanup', () => {
    it('should clean up all listeners and retry queues', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      
      const mockUnsubscribe = vi.fn();
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

      // Set up some listeners
      api.listenToTimer('timer1', vi.fn());
      api.listenToTimer('timer2', vi.fn());

      api.cleanup();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });
  });
});
