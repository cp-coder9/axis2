import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimerSyncProvider, useTimerSync } from '../../src/contexts/modules/timerSync';
import { TimerPersistenceAPI } from '../../src/api/timers/TimerPersistenceAPI';

// Mock the TimerPersistenceAPI
vi.mock('../../src/api/timers/TimerPersistenceAPI');

// Mock useAuth hook
const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'FREELANCER' as const
};

vi.mock('../../src/contexts/modules/auth', () => ({
  useAuth: () => ({ user: mockUser })
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Test component that uses the timer sync context
function TestComponent() {
  const {
    activeTimer,
    isLoading,
    isOnline,
    syncStatus,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    syncAllTimers,
    hasConflict
  } = useTimerSync();

  return (
    <div>
      <div data-testid="active-timer">{activeTimer?.id || 'none'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="online">{isOnline.toString()}</div>
      <div data-testid="sync-status">{syncStatus}</div>
      <div data-testid="has-conflict">{hasConflict.toString()}</div>
      <button 
        data-testid="start-timer" 
        onClick={() => startTimer('project1', 'job1', 'Test Job', 2)}
      >
        Start Timer
      </button>
      <button data-testid="pause-timer" onClick={pauseTimer}>
        Pause Timer
      </button>
      <button data-testid="resume-timer" onClick={resumeTimer}>
        Resume Timer
      </button>
      <button data-testid="stop-timer" onClick={() => stopTimer('Test notes')}>
        Stop Timer
      </button>
      <button data-testid="sync-timers" onClick={syncAllTimers}>
        Sync Timers
      </button>
    </div>
  );
}

describe('TimerSyncProvider', () => {
  let mockTimerAPI: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock TimerPersistenceAPI instance
    mockTimerAPI = {
      initializeTimer: vi.fn(),
      updateTimer: vi.fn(),
      getTimer: vi.fn(),
      getActiveTimers: vi.fn(),
      completeTimer: vi.fn(),
      syncAllTimers: vi.fn(),
      listenToTimer: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      cleanup: vi.fn()
    };

    (TimerPersistenceAPI as any).mockImplementation(() => mockTimerAPI);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderWithProvider() {
    return render(
      <TimerSyncProvider>
        <TestComponent />
      </TimerSyncProvider>
    );
  }

  describe('Initial State', () => {
    it('should render with correct initial state', () => {
      renderWithProvider();

      expect(screen.getByTestId('active-timer')).toHaveTextContent('none');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('online')).toHaveTextContent('true');
      expect(screen.getByTestId('sync-status')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('has-conflict')).toHaveTextContent('false');
    });

    it('should load active timers on mount', async () => {
      const mockActiveTimer = {
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

      mockTimerAPI.getActiveTimers.mockResolvedValue([mockActiveTimer]);
      mockTimerAPI.listenToTimer.mockReturnValue(() => {});

      renderWithProvider();

      await waitFor(() => {
        expect(mockTimerAPI.getActiveTimers).toHaveBeenCalledWith('user123');
      });
    });
  });

  describe('Timer Operations', () => {
    it('should start a new timer', async () => {
      const user = userEvent.setup();
      const mockTimerId = 'timer123';

      mockTimerAPI.getActiveTimers.mockResolvedValue([]);
      mockTimerAPI.initializeTimer.mockResolvedValue(mockTimerId);
      mockTimerAPI.getTimer.mockResolvedValue({
        id: mockTimerId,
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
      });
      mockTimerAPI.listenToTimer.mockReturnValue(() => {});

      renderWithProvider();

      await user.click(screen.getByTestId('start-timer'));

      await waitFor(() => {
        expect(mockTimerAPI.initializeTimer).toHaveBeenCalledWith({
          userId: 'user123',
          projectId: 'project1',
          jobCardId: 'job1',
          jobCardTitle: 'Test Job',
          startTime: expect.any(Date),
          timeRemaining: 7200,
          allocatedHours: 2,
          isRunning: true,
          isPaused: false,
          pauseCount: 0,
          pauseHistory: [],
          deviceId: expect.any(String),
          sessionId: expect.any(String),
          idempotencyKey: expect.any(String)
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Timer Started",
        description: "Timer started for Test Job",
      });
    });

    it('should pause an active timer', async () => {
      const user = userEvent.setup();
      
      // Set up active timer
      const mockActiveTimer = {
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

      mockTimerAPI.getActiveTimers.mockResolvedValue([mockActiveTimer]);
      mockTimerAPI.updateTimer.mockResolvedValue(true);
      mockTimerAPI.listenToTimer.mockReturnValue(() => {});

      renderWithProvider();

      // Wait for timer to load
      await waitFor(() => {
        expect(screen.getByTestId('active-timer')).toHaveTextContent('timer123');
      });

      await user.click(screen.getByTestId('pause-timer'));

      await waitFor(() => {
        expect(mockTimerAPI.updateTimer).toHaveBeenCalledWith('timer123', {
          isPaused: true,
          isRunning: false,
          pauseCount: 1,
          pauseHistory: [
            {
              pausedAt: expect.any(Date),
              reason: 'manual_pause'
            }
          ]
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Timer Paused",
        description: "Timer has been paused",
      });
    });

    it('should resume a paused timer', async () => {
      const user = userEvent.setup();
      
      // Set up paused timer
      const mockActiveTimer = {
        id: 'timer123',
        userId: 'user123',
        projectId: 'project1',
        jobCardId: 'job1',
        jobCardTitle: 'Test Job',
        startTime: new Date(),
        timeRemaining: 7200,
        allocatedHours: 2,
        isRunning: false,
        isPaused: true,
        pauseCount: 1,
        pauseHistory: [
          { pausedAt: new Date(), reason: 'manual_pause' }
        ],
        deviceId: 'device1',
        sessionId: 'session1',
        syncVersion: 1,
        lastUpdated: new Date(),
        idempotencyKey: 'key1'
      };

      mockTimerAPI.getActiveTimers.mockResolvedValue([mockActiveTimer]);
      mockTimerAPI.updateTimer.mockResolvedValue(true);
      mockTimerAPI.listenToTimer.mockReturnValue(() => {});

      renderWithProvider();

      // Wait for timer to load
      await waitFor(() => {
        expect(screen.getByTestId('active-timer')).toHaveTextContent('timer123');
      });

      await user.click(screen.getByTestId('resume-timer'));

      await waitFor(() => {
        expect(mockTimerAPI.updateTimer).toHaveBeenCalledWith('timer123', {
          isPaused: false,
          isRunning: true,
          pauseHistory: [
            {
              pausedAt: expect.any(Date),
              reason: 'manual_pause',
              resumedAt: expect.any(Date)
            }
          ]
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Timer Resumed",
        description: "Timer has been resumed",
      });
    });

    it('should stop an active timer', async () => {
      const user = userEvent.setup();
      
      // Set up active timer
      const mockActiveTimer = {
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

      mockTimerAPI.getActiveTimers.mockResolvedValue([mockActiveTimer]);
      mockTimerAPI.completeTimer.mockResolvedValue(true);
      mockTimerAPI.listenToTimer.mockReturnValue(() => {});

      renderWithProvider();

      // Wait for timer to load
      await waitFor(() => {
        expect(screen.getByTestId('active-timer')).toHaveTextContent('timer123');
      });

      await user.click(screen.getByTestId('stop-timer'));

      await waitFor(() => {
        expect(mockTimerAPI.completeTimer).toHaveBeenCalledWith('timer123', {
          endTime: expect.any(Date),
          notes: 'Test notes',
          completionReason: 'stopped',
          finalTimeRemaining: 7200
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Timer Stopped",
        description: "Timer has been stopped and logged",
      });
    });

    it('should sync all timers', async () => {
      const user = userEvent.setup();

      mockTimerAPI.getActiveTimers.mockResolvedValue([]);
      mockTimerAPI.syncAllTimers.mockResolvedValue(undefined);

      renderWithProvider();

      await user.click(screen.getByTestId('sync-timers'));

      await waitFor(() => {
        expect(mockTimerAPI.syncAllTimers).toHaveBeenCalledWith('user123');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Timers Synced",
        description: "All timers have been synchronized",
      });
    });
  });

  describe('Network Status', () => {
    it('should handle going offline', () => {
      renderWithProvider();

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        window.dispatchEvent(new Event('offline'));
      });

      expect(screen.getByTestId('online')).toHaveTextContent('false');
      expect(screen.getByTestId('sync-status')).toHaveTextContent('disconnected');

      expect(mockToast).toHaveBeenCalledWith({
        title: "Connection Lost",
        description: "Timer will continue offline. Changes will sync when connection is restored.",
        variant: "destructive"
      });
    });

    it('should handle going online', () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      renderWithProvider();

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true });
        window.dispatchEvent(new Event('online'));
      });

      expect(screen.getByTestId('online')).toHaveTextContent('true');
      expect(screen.getByTestId('sync-status')).toHaveTextContent('connected');

      expect(mockToast).toHaveBeenCalledWith({
        title: "Connection Restored",
        description: "Timer sync is now online.",
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle timer start errors', async () => {
      const user = userEvent.setup();

      mockTimerAPI.getActiveTimers.mockResolvedValue([]);
      mockTimerAPI.initializeTimer.mockRejectedValue(new Error('Firestore error'));

      renderWithProvider();

      await user.click(screen.getByTestId('start-timer'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Failed to Start Timer",
          description: "Could not start the timer. Please try again.",
          variant: "destructive"
        });
      });
    });

    it('should handle sync errors', async () => {
      const user = userEvent.setup();

      mockTimerAPI.getActiveTimers.mockResolvedValue([]);
      mockTimerAPI.syncAllTimers.mockRejectedValue(new Error('Sync error'));

      renderWithProvider();

      await user.click(screen.getByTestId('sync-timers'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Sync Failed",
          description: "Could not sync timers. Please try again.",
          variant: "destructive"
        });
      });
    });
  });

  describe('Conflict Handling', () => {
    it('should handle sync conflicts', () => {
      mockTimerAPI.getActiveTimers.mockResolvedValue([]);

      renderWithProvider();

      // Simulate conflict event
      const mockConflictEvent = {
        type: 'conflict',
        timerId: 'timer123',
        data: {
          current: { syncVersion: 2 },
          updates: { syncVersion: 1 },
          resolution: { type: 'conflict' }
        }
      };

      // Find the conflict event handler and call it
      const conflictHandler = mockTimerAPI.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'conflict')?.[1];
      
      if (conflictHandler) {
        act(() => {
          conflictHandler(mockConflictEvent);
        });

        expect(screen.getByTestId('has-conflict')).toHaveTextContent('true');
        expect(mockToast).toHaveBeenCalledWith({
          title: "Timer Conflict Detected",
          description: "Multiple devices are updating the same timer. Please resolve the conflict.",
          variant: "destructive"
        });
      }
    });
  });
});
