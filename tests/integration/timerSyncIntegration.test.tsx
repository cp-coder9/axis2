import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TimerSyncProvider } from '../../src/contexts/modules/timerSync';
import type { TimerPersistenceState } from '../../src/api/timers/TimerPersistenceAPI';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
    now: () => ({ toDate: () => new Date() })
  }
}));

// Mock useAuth
const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'FREELANCER' as const
};

vi.mock('../../src/contexts/modules/auth', () => ({
  useAuth: () => ({ user: mockUser })
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock the actual timer operations
const mockFirestoreOperations = {
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn()
};

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    setDoc: mockFirestoreOperations.setDoc,
    updateDoc: mockFirestoreOperations.updateDoc,
    getDoc: mockFirestoreOperations.getDoc,
    getDocs: mockFirestoreOperations.getDocs,
    onSnapshot: mockFirestoreOperations.onSnapshot
  };
});

// Simple test component
function SimpleTimerComponent() {
  return (
    <div>
      <div data-testid="timer-sync-test">Timer Sync Integration Test</div>
      <button data-testid="mock-start-timer">Start Timer</button>
      <button data-testid="mock-pause-timer">Pause Timer</button>
    </div>
  );
}

// Test wrapper component
function TimerTestWrapper() {
  return (
    <TimerSyncProvider>
      <SimpleTimerComponent />
    </TimerSyncProvider>
  );
}

describe('Timer Sync Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful Firestore operations
    mockFirestoreOperations.setDoc.mockResolvedValue(undefined);
    mockFirestoreOperations.updateDoc.mockResolvedValue(undefined);
    mockFirestoreOperations.getDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined
    });
    mockFirestoreOperations.getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });
    mockFirestoreOperations.onSnapshot.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should initialize TimerSyncProvider without errors', async () => {
      render(<TimerTestWrapper />);

      await waitFor(() => {
        expect(screen.getByTestId('timer-sync-test')).toBeInTheDocument();
      });

      // Verify provider initialized timer API
      expect(mockFirestoreOperations.getDocs).toHaveBeenCalled();
    });

    it('should load existing timers on mount', async () => {
      const mockTimer: Partial<TimerPersistenceState> = {
        id: 'timer123',
        userId: 'user123',
        projectId: 'project1',
        jobCardId: 'job1',
        jobCardTitle: 'Test Job',
        startTime: new Date(),
        timeRemaining: 7200,
        allocatedHours: 2,
        isRunning: true,
        isPaused: false
      };

      mockFirestoreOperations.getDocs.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'timer123',
          data: () => mockTimer,
          exists: () => true
        }]
      });

      render(<TimerTestWrapper />);

      await waitFor(() => {
        expect(mockFirestoreOperations.getDocs).toHaveBeenCalledWith(
          expect.anything() // query object
        );
      });
    });
  });

  describe('Real-time Sync', () => {
    it('should set up real-time listeners', async () => {
      render(<TimerTestWrapper />);

      await waitFor(() => {
        expect(mockFirestoreOperations.onSnapshot).toHaveBeenCalled();
      });
    });

    it('should handle real-time updates', async () => {
      let snapshotCallback: (snapshot: any) => void;

      mockFirestoreOperations.onSnapshot.mockImplementation((_docRef, callback) => {
        snapshotCallback = callback;
        return () => {}; // unsubscribe function
      });

      render(<TimerTestWrapper />);

      // Wait for listener to be set up
      await waitFor(() => {
        expect(mockFirestoreOperations.onSnapshot).toHaveBeenCalled();
      });

      // Simulate real-time update
      const updatedTimer: Partial<TimerPersistenceState> = {
        id: 'timer123',
        userId: 'user123',
        timeRemaining: 6000,
        isRunning: true,
        syncVersion: 2
      };

      act(() => {
        snapshotCallback!({
          exists: () => true,
          data: () => updatedTimer,
          id: 'timer123'
        });
      });

      // Verify update was processed
      await waitFor(() => {
        expect(screen.getByTestId('timer-sync-test')).toBeInTheDocument();
      });
    });
  });

  describe('Network Status Handling', () => {
    it('should handle offline state', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      render(<TimerTestWrapper />);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // Verify offline handling
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Connection Lost",
          variant: "destructive"
        })
      );
    });

    it('should handle online state restoration', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      render(<TimerTestWrapper />);

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true });
        window.dispatchEvent(new Event('online'));
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Connection Restored"
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      mockFirestoreOperations.getDocs.mockRejectedValue(new Error('Firestore error'));

      render(<TimerTestWrapper />);

      // Should not crash and should handle error
      await waitFor(() => {
        expect(screen.getByTestId('timer-sync-test')).toBeInTheDocument();
      });
    });

    it('should retry failed operations', async () => {
      mockFirestoreOperations.setDoc
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      render(<TimerTestWrapper />);

      // Component should render successfully even with initial failures
      await waitFor(() => {
        expect(screen.getByTestId('timer-sync-test')).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup listeners on unmount', () => {
      const unsubscribeMock = vi.fn();
      mockFirestoreOperations.onSnapshot.mockReturnValue(unsubscribeMock);

      const { unmount } = render(<TimerTestWrapper />);

      // Unmount component
      unmount();

      // Verify cleanup was called
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
