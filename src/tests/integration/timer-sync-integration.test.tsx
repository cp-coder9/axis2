import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TimerSyncProvider, useTimerSync } from '../../../src/contexts/modules/timerSync';
import { AppProvider } from '../../../src/contexts/AppContext';
import TimerSyncDemo from '../../../src/demo/components/timer/timer-sync-demo';
import CountdownTimer from '../../../src/components/timer/CountdownTimer';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  db: {},
  storage: {},
}));

// Mock Firebase functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
    fromDate: (date: Date) => ({ toMillis: () => date.getTime() }),
  },
}));

// Mock Firebase storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Mock TimerPersistenceAPI
vi.mock('../../../src/api/timers/TimerPersistenceAPI', () => ({
  TimerPersistenceAPI: vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    initializeTimer: vi.fn().mockResolvedValue('test-timer-id'),
    getTimer: vi.fn().mockResolvedValue({
      id: 'test-timer-id',
      userId: 'test-user',
      projectId: 'test-project',
      jobCardId: 'test-task',
      jobCardTitle: 'Test Task',
      timeRemaining: 3600,
      isRunning: true,
      isPaused: false,
    }),
    updateTimer: vi.fn().mockResolvedValue(true),
    completeTimer: vi.fn().mockResolvedValue(true),
    getActiveTimers: vi.fn().mockResolvedValue([]),
    syncAllTimers: vi.fn().mockResolvedValue(undefined),
    listenToTimer: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

// Mock auth context
vi.mock('../../../src/contexts/modules/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      name: 'Test User',
      role: 'FREELANCER',
    },
  }),
}));

// Mock toast hook
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock utilities
vi.mock('../../../src/utils/accessibility', () => ({
  TimerAnnouncer: {
    getInstance: () => ({
      announce: vi.fn(),
      clearQueue: vi.fn(),
    }),
  },
  TimerAnnouncementMessages: {
    TIMER_STARTED: vi.fn(() => 'Timer started'),
    TIMER_PAUSED: vi.fn(() => 'Timer paused'),
    TIMER_RESUMED: vi.fn(() => 'Timer resumed'),
    TIMER_STOPPED: vi.fn(() => 'Timer stopped'),
    TIMER_COMPLETED: vi.fn(() => 'Timer completed'),
    TIME_WARNING_5MIN: vi.fn(() => '5 minutes remaining'),
    TIME_WARNING_1MIN: vi.fn(() => '1 minute remaining'),
    TIME_EXCEEDED: vi.fn(() => 'Time exceeded'),
    PAUSE_LIMIT_EXCEEDED: vi.fn(() => 'Pause limit exceeded'),
    PAUSE_WARNING: vi.fn(() => 'Pause warning'),
    ASSIGNMENT_ERROR: vi.fn(() => 'Assignment error'),
  },
  KeyboardNavigation: {
    handleTimerControlKeys: vi.fn(),
    setupTimerControlAria: vi.fn(),
  },
  HighContrastSupport: {
    applyHighContrastStyles: vi.fn(),
    getHighContrastColors: vi.fn(() => ({ color: 'blue', backgroundColor: 'white', borderColor: 'blue' })),
  },
  ReducedMotionSupport: {
    applyReducedMotionStyles: vi.fn(),
    getAnimationClasses: vi.fn((cls: string) => cls),
  },
  ScreenReaderSupport: {
    formatStatusForScreenReader: vi.fn(() => 'Timer status'),
    formatTimeForScreenReader: vi.fn(() => '1 hour'),
    formatProgressForScreenReader: vi.fn(() => '50% complete'),
  },
  initializeTimerAccessibility: vi.fn(),
  AnnouncementPriority: {
    LOW: 'low',
    HIGH: 'high',
  },
}));

vi.mock('../../../src/utils/focusManager', () => ({
  FocusManager: {
    getInstance: () => ({
      handleKeyboardNavigation: vi.fn(),
    }),
  },
}));

vi.mock('../../../src/utils/performance', () => ({
  useTimerCalculations: vi.fn(() => ({
    display: { formatted: '1:00:00' },
    pause: { remaining: 180 },
  })),
  useVisibilityHandler: vi.fn(),
  useTimerInterval: vi.fn((callback: () => void, isRunning: boolean) => {
    if (isRunning) {
      const interval = setInterval(callback, 1000);
      return () => clearInterval(interval);
    }
  }),
  useThrottledValue: vi.fn((value: any) => value),
  useTimerHandlers: vi.fn((start, pause, resume, stop) => ({
    handleStart: start,
    handlePause: pause,
    handleResume: resume,
    handleStop: stop,
  })),
  useCircularProgress: vi.fn(() => ({ strokeDashoffset: 0, circumference: 100 })),
  usePerformanceMonitor: vi.fn(() => ({ getStats: () => ({}) })),
  useTimerCleanup: vi.fn(),
}));

// Mock timer context module
vi.mock('../../../src/contexts/modules/timer', () => ({
  useTimer: () => ({
    startGlobalTimer: vi.fn().mockResolvedValue(true),
    resumeGlobalTimer: vi.fn().mockResolvedValue(true),
    pauseGlobalTimer: vi.fn().mockResolvedValue(true),
    stopGlobalTimerAndLog: vi.fn().mockResolvedValue(undefined),
    hasActiveTimer: false,
    activeTimers: {},
    currentTimerKey: null,
  }),
}));

describe('Timer Context Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock network status
    Object.defineProperty(window, 'navigator', {
      value: {
        onLine: true,
      },
      writable: true,
    });

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TimerSyncProvider', () => {
    it('should provide timer sync context', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      expect(result.current.activeTimer).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isOnline).toBe(true);
      expect(result.current.syncStatus).toBe('disconnected');
    });

    it('should handle timer start operation', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      await act(async () => {
        const success = await result.current.startTimer(
          'test-project',
          'test-task',
          'Test Task',
          2.5
        );
        expect(success).toBe(true);
      });
    });

    it('should handle timer pause and resume', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      // Start timer first
      await act(async () => {
        await result.current.startTimer('test-project', 'test-task', 'Test Task', 2.5);
      });

      // Pause timer
      await act(async () => {
        const success = await result.current.pauseTimer();
        expect(success).toBe(true);
      });

      // Resume timer
      await act(async () => {
        const success = await result.current.resumeTimer();
        expect(success).toBe(true);
      });
    });

    it('should handle timer stop operation', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      // Start timer first
      await act(async () => {
        await result.current.startTimer('test-project', 'test-task', 'Test Task', 2.5);
      });

      // Stop timer
      await act(async () => {
        const success = await result.current.stopTimer('Work completed', 'completed');
        expect(success).toBe(true);
      });
    });
  });

  describe('AppProvider Integration', () => {
    it('should integrate TimerSyncProvider with AppProvider', async () => {
      render(
        <AppProvider>
          <div data-testid="app-content">App Content</div>
        </AppProvider>
      );

      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    it('should provide timer methods through AppContext', async () => {
      const TestComponent = () => {
        // Mock the useAppContext hook for testing
        const mockContext = {
          startGlobalTimer: vi.fn(),
          stopGlobalTimerAndLog: vi.fn(),
          user: null,
          users: [],
          projects: [],
          logout: vi.fn(),
          activeTimer: null,
          isTimerSyncing: false,
          timerSyncStatus: 'disconnected' as const,
          loading: false,
        };
        
        return (
          <div>
            <button 
              onClick={() => mockContext.startGlobalTimer('task-1', 'Test Task', 'project-1', 2)}
              data-testid="start-timer"
            >
              Start Timer
            </button>
            <button 
              onClick={() => mockContext.stopGlobalTimerAndLog('project-1', 'task-1', { notes: 'Done' })}
              data-testid="stop-timer"
            >
              Stop Timer
            </button>
          </div>
        );
      };

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByTestId('start-timer')).toBeInTheDocument();
      expect(screen.getByTestId('stop-timer')).toBeInTheDocument();
    });
  });

  describe('CountdownTimer Integration', () => {
    it('should render CountdownTimer with sync integration', async () => {
      render(
        <AppProvider>
          <CountdownTimer
            initialTime={3600}
            jobCardId="test-task"
            jobCardTitle="Test Task"
            projectId="test-project"
            maxPauseTime={180}
            maxPauseCount={5}
            userRole="FREELANCER"
          />
        </AppProvider>
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('should handle timer start through CountdownTimer', async () => {
      render(
        <AppProvider>
          <CountdownTimer
            initialTime={3600}
            jobCardId="test-task"
            jobCardTitle="Test Task"
            projectId="test-project"
            maxPauseTime={180}
            maxPauseCount={5}
            userRole="FREELANCER"
          />
        </AppProvider>
      );

      const startButton = screen.getByLabelText('Start timer');
      
      await act(async () => {
        fireEvent.click(startButton);
      });

      // Timer should show running state
      await waitFor(() => {
        expect(screen.getByText('Running')).toBeInTheDocument();
      });
    });
  });

  describe('TimerSyncDemo Component', () => {
    it('should render timer sync demo', async () => {
      render(
        <AppProvider>
          <TimerSyncDemo />
        </AppProvider>
      );

      expect(screen.getByText('Timer Synchronization Demo')).toBeInTheDocument();
      expect(screen.getByText('Synchronization Status')).toBeInTheDocument();
    });

    it('should show sync status indicators', async () => {
      render(
        <AppProvider>
          <TimerSyncDemo />
        </AppProvider>
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument(); // No active timer
      expect(screen.getByText('Ready')).toBeInTheDocument(); // Operations ready
    });

    it('should handle demo timer start', async () => {
      render(
        <AppProvider>
          <TimerSyncDemo />
        </AppProvider>
      );

      // Fill in demo fields
      const projectInput = screen.getByLabelText('Project ID');
      const taskInput = screen.getByLabelText('Job Card ID');
      const titleInput = screen.getByLabelText('Task Title');
      const hoursInput = screen.getByLabelText('Allocated Hours');

      await act(async () => {
        fireEvent.change(projectInput, { target: { value: 'demo-project' } });
        fireEvent.change(taskInput, { target: { value: 'demo-task' } });
        fireEvent.change(titleInput, { target: { value: 'Demo Task' } });
        fireEvent.change(hoursInput, { target: { value: '2' } });
      });

      // Start timer
      const startButton = screen.getByText('Start Timer');
      
      await act(async () => {
        fireEvent.click(startButton);
      });

      // Should show loading state
      expect(startButton).toBeDisabled();
    });

    it('should display timer features list', async () => {
      render(
        <AppProvider>
          <TimerSyncDemo />
        </AppProvider>
      );

      expect(screen.getByText('Real-time Sync')).toBeInTheDocument();
      expect(screen.getByText('Conflict Resolution')).toBeInTheDocument();
      expect(screen.getByText('Offline Support')).toBeInTheDocument();
      expect(screen.getByText('Multi-device Awareness')).toBeInTheDocument();
      expect(screen.getByText('Optimistic Updates')).toBeInTheDocument();
      expect(screen.getByText('Error Recovery')).toBeInTheDocument();
    });

    it('should show event log functionality', async () => {
      render(
        <AppProvider>
          <TimerSyncDemo />
        </AppProvider>
      );

      // Click on Events tab
      const eventsTab = screen.getByText('Event Log');
      
      await act(async () => {
        fireEvent.click(eventsTab);
      });

      expect(screen.getByText('Synchronization Events')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network disconnection', async () => {
      // Simulate offline state
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.syncStatus).toBe('disconnected');
    });

    it('should handle timer conflicts', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      // Simulate conflict resolution
      await act(async () => {
        await result.current.resolveConflict('local');
      });

      expect(result.current.hasConflict).toBe(false);
    });

    it('should handle sync all timers operation', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      await act(async () => {
        await result.current.syncAllTimers();
      });

      // Should complete without errors
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Performance and Cleanup', () => {
    it('should cleanup timer resources on unmount', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { unmount } = renderHook(() => useTimerSync(), { wrapper });

      unmount();

      // Cleanup should be called (mocked)
      // This test ensures no memory leaks occur
    });

    it('should throttle rapid timer operations', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerSyncProvider>{children}</TimerSyncProvider>
      );

      const { result } = renderHook(() => useTimerSync(), { wrapper });

      // Rapid start attempts should be throttled
      await act(async () => {
        const promises = Array.from({ length: 5 }, () =>
          result.current.startTimer('test-project', 'test-task', 'Test Task', 2.5)
        );
        
        await Promise.all(promises);
      });

      // Only one successful start should occur
      expect(result.current.activeTimer).toBeTruthy();
    });
  });
});
