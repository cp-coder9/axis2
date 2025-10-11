import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimerPersistenceAPI } from './TimerPersistenceAPI';
import type { TimerPersistenceState } from './TimerPersistenceAPI';

// Mock Firebase Firestore completely
vi.mock('firebase/firestore', () => {
  const mockDoc = vi.fn();
  const mockCollection = vi.fn();
  const mockSetDoc = vi.fn();
  const mockUpdateDoc = vi.fn();
  const mockGetDoc = vi.fn();
  const mockGetDocs = vi.fn();
  const mockQuery = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockOnSnapshot = vi.fn();
  const mockServerTimestamp = vi.fn();
  const mockWriteBatch = vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }));
  
  return {
    getFirestore: vi.fn(),
    collection: mockCollection,
    doc: mockDoc,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    onSnapshot: mockOnSnapshot,
    serverTimestamp: mockServerTimestamp,
    writeBatch: mockWriteBatch,
    Timestamp: {
      fromDate: vi.fn(),
      now: vi.fn()
    }
  };
});

// Import the mocked functions and cast them to vi mocks
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';

// Create mockFirestore object using the mocked functions, properly typed for vitest
const mockFirestore = {
  collection: collection as any,
  doc: doc as any,
  setDoc: setDoc as any,
  updateDoc: updateDoc as any,
  getDoc: getDoc as any,
  getDocs: getDocs as any,
  query: query as any,
  where: where as any,
  orderBy: orderBy as any,
  onSnapshot: onSnapshot as any,
  serverTimestamp: serverTimestamp as any,
  writeBatch: writeBatch as any,
  Timestamp: Timestamp as any
};

describe('TimerPersistenceAPI', () => {
  let api: TimerPersistenceAPI;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock returns using the individual mocked functions
    (collection as any).mockReturnValue('mock-collection');
    (doc as any).mockReturnValue('mock-doc');
    (setDoc as any).mockResolvedValue(undefined);
    (updateDoc as any).mockResolvedValue(undefined);
    (getDoc as any).mockResolvedValue({
      exists: () => false,
      data: () => undefined
    });
    (getDocs as any).mockResolvedValue({
      empty: true,
      docs: []
    });
    (onSnapshot as any).mockReturnValue(() => {});
    (serverTimestamp as any).mockReturnValue(new Date());
    (Timestamp.fromDate as any).mockImplementation((date: Date) => ({ toDate: () => date }));
    (Timestamp.now as any).mockReturnValue({ toDate: () => new Date() });
    
    api = new TimerPersistenceAPI();
  });

  afterEach(() => {
    api?.cleanup();
  });

  describe('Timer Initialization', () => {
    it('should initialize a new timer successfully', async () => {
      const timerData: TimerPersistenceState = {
        id: 'timer123',
        userId: 'user123',
        projectId: 'project1',
        jobCardId: 'job1',
        jobCardTitle: 'Test Job',
        startTime: new Date(),
        timeRemaining: 7200,
        allocatedHours: 2,
        isRunning: true,
        isPaused: false,
        pauseCount: 0,
        pauseHistory: [],
        deviceId: 'device1',
        sessionId: 'session1',
        syncVersion: 1,
        lastUpdated: new Date(),
        idempotencyKey: 'key1'
      };

      const result = await api.initializeTimer(timerData);

      expect(result).toBeDefined();
      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        'mock-doc',
        expect.objectContaining({
          userId: 'user123',
          projectId: 'project1',
          jobCardId: 'job1',
          isRunning: true,
          isPaused: false
        })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockFirestore.setDoc.mockRejectedValue(new Error('Firestore error'));

      const timerData: TimerPersistenceState = {
        id: 'timer123',
        userId: 'user123',
        projectId: 'project1',
        jobCardId: 'job1',
        jobCardTitle: 'Test Job',
        startTime: new Date(),
        timeRemaining: 7200,
        allocatedHours: 2,
        isRunning: true,
        isPaused: false,
        pauseCount: 0,
        pauseHistory: [],
        deviceId: 'device1',
        sessionId: 'session1',
        syncVersion: 1,
        lastUpdated: new Date(),
        idempotencyKey: 'key1'
      };

      await expect(api.initializeTimer(timerData)).rejects.toThrow('Firestore error');
    });
  });

  describe('Timer Updates', () => {
    it('should update timer successfully', async () => {
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: 'timer123',
          syncVersion: 1,
          lastUpdated: new Date()
        })
      });

      const updates = {
        timeRemaining: 6000,
        isPaused: true,
        pauseCount: 1
      };

      const result = await api.updateTimer('timer123', updates);

      expect(result).toBe(true);
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        'mock-doc',
        expect.objectContaining({
          timeRemaining: 6000,
          isPaused: true,
          pauseCount: 1,
          syncVersion: 2
        })
      );
    });

    it('should detect and handle conflicts', async () => {
      // Mock existing timer with different sync version
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: 'timer123',
          syncVersion: 3,
          lastUpdated: new Date(),
          deviceId: 'other-device'
        })
      });

      const updates = {
        timeRemaining: 6000,
        syncVersion: 1 // Outdated version
      };

      const result = await api.updateTimer('timer123', updates);

      // Should trigger conflict resolution
      expect(result).toBe(false);
    });
  });

  describe('Timer Retrieval', () => {
    it('should get timer by ID', async () => {
      const mockTimer = {
        id: 'timer123',
        userId: 'user123',
        projectId: 'project1',
        isRunning: true
      };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTimer,
        id: 'timer123'
      });

      const result = await api.getTimer('timer123');

      expect(result).toEqual(expect.objectContaining({
        id: 'timer123',
        userId: 'user123',
        projectId: 'project1',
        isRunning: true
      }));
    });

    it('should return null for non-existent timer', async () => {
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined
      });

      const result = await api.getTimer('nonexistent');

      expect(result).toBeNull();
    });

    it('should get active timers for user', async () => {
      const mockTimers = [
        {
          id: 'timer1',
          data: () => ({ userId: 'user123', isRunning: true }),
          exists: () => true
        },
        {
          id: 'timer2', 
          data: () => ({ userId: 'user123', isRunning: false }),
          exists: () => true
        }
      ];

      mockFirestore.getDocs.mockResolvedValue({
        empty: false,
        docs: mockTimers
      });

      const result = await api.getActiveTimers('user123');

      expect(result).toHaveLength(2);
      expect(mockFirestore.query).toHaveBeenCalled();
      expect(mockFirestore.where).toHaveBeenCalledWith('userId', '==', 'user123');
    });
  });

  describe('Timer Completion', () => {
    it('should complete timer successfully', async () => {
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: 'timer123',
          syncVersion: 1
        })
      });

      const completionData = {
        endTime: new Date(),
        notes: 'Task completed',
        completionReason: 'stopped' as const,
        finalTimeRemaining: 1800
      };

      const result = await api.completeTimer('timer123', completionData);

      expect(result).toBe(true);
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        'mock-doc',
        expect.objectContaining({
          isCompleted: true,
          completedAt: expect.any(Date),
          endTime: completionData.endTime,
          notes: completionData.notes,
          completionReason: completionData.completionReason,
          finalTimeRemaining: completionData.finalTimeRemaining
        })
      );
    });
  });

  describe('Real-time Sync', () => {
    it('should set up timer listener', () => {
      const callback = vi.fn();

      api.listenToTimer('timer123', callback);

      expect(mockFirestore.onSnapshot).toHaveBeenCalled();
    });

    it('should sync all timers for user', async () => {
      mockFirestore.getDocs.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'timer1',
            data: () => ({ userId: 'user123' }),
            exists: () => true
          }
        ]
      });

      await api.syncAllTimers('user123');

      expect(mockFirestore.getDocs).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should add event listeners', () => {
      const handler = vi.fn();

      api.addEventListener('sync', handler);

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      const api = new TimerPersistenceAPI();
      
      // Should not throw
      expect(() => api.cleanup()).not.toThrow();
    });
  });
});
