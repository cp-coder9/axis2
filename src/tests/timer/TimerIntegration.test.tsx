/**
 * @fileoverview Timer Business Logic Integration Test Suite
 * Tests context integration, Firebase operations, and cross-component interactions
 * for the timer system in Architex Axis shadcn/ui migration.
 * 
 * Coverage Areas:
 * - Timer context hook operations (start/pause/resume/stop)
 * - Firebase persistence with Firestore mocking
 * - Role-based access control functions
 * - Audit logging for timer actions
 * - Offline sync with IndexedDB mocking
 * - Component communication patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// import { TimerProvider } from '../../contexts/modules/timer';
// import { AuthProvider } from '../../contexts/modules/auth';
// import { ProjectsProvider } from '../../contexts/modules/projects';
import { CountdownTimer } from '../../components/timer/CountdownTimer';
import EnhancedTimerDisplay from '../../components/timer/EnhancedTimerDisplay';
import { TestWrapper } from '../helpers/TestWrapper';
import { StopTimerModal } from '../../components/timer/StopTimerModal';

// Integration test component that uses multiple timer components together
const TimerSystemIntegration = () => {
  return (
    <div>
      <CountdownTimer 
        timerKey="test-timer-1"
        jobCardId="job-1"
        jobCardTitle="Test Job Card"
        projectId="project-1"
        allocatedHours={2}
      />
      <EnhancedTimerDisplay
        timerKey="test-timer-1"
        jobCardId="job-1"
        projectId="project-1"
        compact={false}
        showControls={true}
      />
      <StopTimerModal
        isOpen={false}
        onClose={() => {}}
        onSubmit={() => {}}
        jobCardTitle="Test Job Card"
        projectName="Test Project"
        allocatedHours={2}
        actualHours={1.5}
      />
    </div>
  );
};

describe('Timer Business Logic Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.useFakeTimers();
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockTimer.reset();
    mockAuth.reset();
    mockProjects.reset();
    mockFirebase.reset();
    mockWebSocket.reset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Timer Context Hook Operations', () => {
    it('should start timer with proper Firebase persistence', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.idle);
      
      const startTimerSpy = vi.spyOn(mockTimer.hooks, 'startGlobalTimer');
      const firestoreSpy = vi.spyOn(mockFirebase.firestore.doc(), 'set');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action
      const startButton = screen.getByRole('button', { name: /start timer/i });
      await user.click(startButton);

      // Assertions
      expect(startTimerSpy).toHaveBeenCalledWith(
        'job-1',
        'Test Job Card',
        'project-1',
        2,
        expect.any(String) // idempotency key
      );

      await waitFor(() => {
        expect(firestoreSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'running',
            jobCardId: 'job-1',
            projectId: 'project-1',
            totalTime: 7200, // 2 hours in seconds
            startTime: expect.any(Number),
            userId: users.freelancer.uid
          }),
          { merge: true }
        );
      });
    });

    it('should pause timer with 3-minute limit enforcement', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      const runningTimer = { 
        ...timerStates.running, 
        pauseTimeUsed: 60, // 1 minute already used
        pauseCount: 1
      };
      mockTimer.setActiveTimer('test-timer-1', runningTimer);
      
      const pauseTimerSpy = vi.spyOn(mockTimer.hooks, 'pauseGlobalTimer');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action
      const pauseButton = screen.getByRole('button', { name: /pause timer/i });
      await user.click(pauseButton);

      // Assertions
      expect(pauseTimerSpy).toHaveBeenCalledWith('test-timer-1');
      
      // Verify pause limit tracking
      await waitFor(() => {
        const updatedTimer = mockTimer.getActiveTimer('test-timer-1');
        expect(updatedTimer.status).toBe('paused');
        expect(updatedTimer.pauseCount).toBe(2);
        expect(updatedTimer.lastPauseTime).toBeDefined();
      });
    });

    it('should auto-stop timer when pause limit exceeded', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      const pausedTimer = { 
        ...timerStates.paused, 
        pauseTimeUsed: 170, // 2:50, near limit
        lastPauseTime: Date.now() - 170000
      };
      mockTimer.setActiveTimer('test-timer-1', pausedTimer);
      
      const stopTimerSpy = vi.spyOn(mockTimer.hooks, 'stopGlobalTimerAndLog');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Simulate 11 more seconds to exceed 3-minute limit
      act(() => {
        vi.advanceTimersByTime(11000);
      });

      // Assertions
      await waitFor(() => {
        expect(stopTimerSpy).toHaveBeenCalledWith(
          'project-1', 
          'job-1',
          expect.objectContaining({
            notes: expect.stringContaining('Auto-stopped due to pause limit'),
            isAutoStop: true
          })
        );
      });
    });

    it('should resume timer and reset pause tracking', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      const pausedTimer = { 
        ...timerStates.paused, 
        pauseTimeUsed: 90,
        lastPauseTime: Date.now() - 90000
      };
      mockTimer.setActiveTimer('test-timer-1', pausedTimer);
      
      const resumeTimerSpy = vi.spyOn(mockTimer.hooks, 'resumeGlobalTimer');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action
      const resumeButton = screen.getByRole('button', { name: /resume timer/i });
      await user.click(resumeButton);

      // Assertions
      expect(resumeTimerSpy).toHaveBeenCalledWith('test-timer-1');
      
      await waitFor(() => {
        const updatedTimer = mockTimer.getActiveTimer('test-timer-1');
        expect(updatedTimer.status).toBe('running');
        expect(updatedTimer.lastPauseTime).toBeUndefined();
        expect(updatedTimer.pauseTimeUsed).toBe(90); // Preserved total pause time
      });
    });

    it('should stop timer and trigger time logging modal', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);
      
      const stopTimerSpy = vi.spyOn(mockTimer.hooks, 'stopGlobalTimerAndLog');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action
      const stopButton = screen.getByRole('button', { name: /stop timer/i });
      await user.click(stopButton);

      // Assertions - Should trigger modal opening logic
      expect(stopTimerSpy).toHaveBeenCalledWith(
        'project-1',
        'job-1',
        expect.objectContaining({
          actualHours: expect.any(Number),
          notes: expect.any(String)
        })
      );
    });
  });

  describe('Firebase Persistence & Real-time Sync', () => {
    it('should persist timer state changes to Firestore', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.idle);
      
      const firestoreSetSpy = vi.spyOn(mockFirebase.firestore.doc(), 'set');
      const firestoreOnSnapshotSpy = vi.spyOn(mockFirebase.firestore.doc(), 'onSnapshot');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action - Start timer
      const startButton = screen.getByRole('button', { name: /start timer/i });
      await user.click(startButton);

      // Assertions
      await waitFor(() => {
        expect(firestoreSetSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'running',
            startTime: expect.any(Number),
            lastHeartbeat: expect.any(Number),
            userId: users.freelancer.uid
          }),
          { merge: true }
        );
      });

      // Verify real-time listener setup
      expect(firestoreOnSnapshotSpy).toHaveBeenCalled();
    });

    it('should handle Firestore sync conflicts', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);
      
      const conflictResolver = vi.spyOn(mockWebSocket.syncQueue, 'resolveConflict');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Simulate conflict scenario
      const conflictData = {
        localTimer: timerStates.running,
        remoteTimer: { ...timerStates.running, timeRemaining: 6000 },
        lastKnownSync: Date.now() - 30000
      };

      act(() => {
        mockWebSocket.syncQueue.reportConflict('test-timer-1', conflictData);
      });

      // Assertions
      await waitFor(() => {
        expect(conflictResolver).toHaveBeenCalledWith('test-timer-1', conflictData);
      });

      // Verify UI shows conflict resolution
      expect(screen.getByText(/sync conflict detected/i)).toBeInTheDocument();
    });

    it('should handle offline sync with IndexedDB', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);
      
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const offlineSyncSpy = vi.spyOn(mockTimer.offlineSync, 'queueOperation');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action - Pause timer while offline
      const pauseButton = screen.getByRole('button', { name: /pause timer/i });
      await user.click(pauseButton);

      // Assertions
      expect(offlineSyncSpy).toHaveBeenCalledWith({
        type: 'timerOperation',
        action: 'pause',
        timerKey: 'test-timer-1',
        timestamp: expect.any(Number),
        data: expect.objectContaining({
          status: 'paused'
        })
      });

      // Verify offline indicator
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    it('should sync offline operations when back online', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      
      // Queue offline operations
      const offlineOps = [
        {
          type: 'timerOperation',
          action: 'start',
          timerKey: 'test-timer-1',
          timestamp: Date.now() - 60000
        },
        {
          type: 'timerOperation', 
          action: 'pause',
          timerKey: 'test-timer-1',
          timestamp: Date.now() - 30000
        }
      ];

      mockTimer.offlineSync.setQueuedOperations(offlineOps);
      
      const syncSpy = vi.spyOn(mockTimer.offlineSync, 'syncQueuedOperations');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Simulate coming back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true
        });
        window.dispatchEvent(new Event('online'));
      });

      // Assertions
      await waitFor(() => {
        expect(syncSpy).toHaveBeenCalledWith(offlineOps);
      });

      // Verify operations processed
      expect(mockTimer.offlineSync.getQueuedOperations()).toHaveLength(0);
    });
  });

  describe('Role-Based Access Control Functions', () => {
    it('should enforce CLIENT role restrictions', async () => {
      // Setup
      mockAuth.setCurrentUser(users.client);
      mockTimer.setActiveTimer('test-timer-1', timerStates.idle);

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Assertions - CLIENT should not see timer components
      expect(screen.queryByRole('button', { name: /start timer/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/countdown timer/i)).not.toBeInTheDocument();
    });

    it('should validate freelancer timer permissions', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockAuth.setTimerPermission('test-timer-1', false); // No permission
      
      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Assertions - Controls should be disabled
      const startButton = screen.getByRole('button', { name: /start timer/i });
      expect(startButton).toBeDisabled();
      
      // Should show permission warning
      expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
    });

    it('should allow admin override capabilities', async () => {
      // Setup
      mockAuth.setCurrentUser(users.admin);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);
      
      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Assertions - Admin should see override controls
      expect(screen.getByText(/admin override/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /admin stop/i })).toBeInTheDocument();
      
      // Admin controls should not be disabled by assignment restrictions
      const adminStopButton = screen.getByRole('button', { name: /admin stop/i });
      expect(adminStopButton).not.toBeDisabled();
    });

    it('should validate job card assignment access', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockProjects.setJobCardAccess('job-1', false); // No assignment
      
      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Assertions
      const startButton = screen.getByRole('button', { name: /start timer/i });
      expect(startButton).toBeDisabled();
      
      // Should show assignment warning
      expect(screen.getByText(/not assigned/i)).toBeInTheDocument();
    });
  });

  describe('Audit Logging for Timer Actions', () => {
    it('should log timer start action with metadata', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.idle);
      
      const auditLogSpy = vi.spyOn(mockTimer.auditLogger, 'logTimerAction');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action
      const startButton = screen.getByRole('button', { name: /start timer/i });
      await user.click(startButton);

      // Assertions
      await waitFor(() => {
        expect(auditLogSpy).toHaveBeenCalledWith({
          action: 'TIMER_START',
          userId: users.freelancer.uid,
          timerKey: 'test-timer-1',
          metadata: {
            jobCardId: 'job-1',
            projectId: 'project-1',
            allocatedHours: 2,
            idempotencyKey: expect.any(String)
          },
          timestamp: expect.any(Number)
        });
      });
    });

    it('should log pause limit violations', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      const pausedTimer = { 
        ...timerStates.paused, 
        pauseTimeUsed: 175, // Close to limit
        lastPauseTime: Date.now() - 175000
      };
      mockTimer.setActiveTimer('test-timer-1', pausedTimer);
      
      const auditLogSpy = vi.spyN(mockTimer.auditLogger, 'logTimerAction');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Simulate exceeding pause limit
      act(() => {
        vi.advanceTimersByTime(6000); // 6 more seconds = 181 total
      });

      // Assertions
      await waitFor(() => {
        expect(auditLogSpy).toHaveBeenCalledWith({
          action: 'TIMER_PAUSE_LIMIT_EXCEEDED',
          userId: users.freelancer.uid,
          timerKey: 'test-timer-1',
          metadata: {
            pauseTimeUsed: 181,
            pauseLimit: 180,
            autoStopped: true
          },
          timestamp: expect.any(Number)
        });
      });
    });

    it('should log admin override actions', async () => {
      // Setup
      mockAuth.setCurrentUser(users.admin);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);
      
      const auditLogSpy = vi.spyOn(mockTimer.auditLogger, 'logTimerAction');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action
      const adminStopButton = screen.getByRole('button', { name: /admin stop/i });
      await user.click(adminStopButton);

      // Assertions
      await waitFor(() => {
        expect(auditLogSpy).toHaveBeenCalledWith({
          action: 'TIMER_ADMIN_OVERRIDE_STOP',
          userId: users.admin.uid,
          timerKey: 'test-timer-1',
          metadata: {
            originalUserId: expect.any(String),
            overrideReason: 'Admin intervention',
            isOverride: true
          },
          timestamp: expect.any(Number)
        });
      });
    });

    it('should create audit trail for timer session lifecycle', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.idle);
      
      const auditLogSpy = vi.spyOn(mockTimer.auditLogger, 'logTimerAction');

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Complete timer lifecycle
      const startButton = screen.getByRole('button', { name: /start timer/i });
      await user.click(startButton);

      const pauseButton = screen.getByRole('button', { name: /pause timer/i });
      await user.click(pauseButton);

      const resumeButton = screen.getByRole('button', { name: /resume timer/i });
      await user.click(resumeButton);

      const stopButton = screen.getByRole('button', { name: /stop timer/i });
      await user.click(stopButton);

      // Assertions - Complete audit trail
      await waitFor(() => {
        expect(auditLogSpy).toHaveBeenCalledTimes(4);
        
        const calls = auditLogSpy.mock.calls;
        expect(calls[0][0].action).toBe('TIMER_START');
        expect(calls[1][0].action).toBe('TIMER_PAUSE');
        expect(calls[2][0].action).toBe('TIMER_RESUME');
        expect(calls[3][0].action).toBe('TIMER_STOP');
      });
    });
  });

  describe('Cross-Component Communication', () => {
    it('should synchronize state between CountdownTimer and EnhancedTimerDisplay', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.idle);

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action - Start timer from CountdownTimer
      const startButton = screen.getByRole('button', { name: /start timer/i });
      await user.click(startButton);

      // Assertions - Both components should show running state
      await waitFor(() => {
        // CountdownTimer shows running
        expect(screen.getByText(/running/i)).toBeInTheDocument();
        
        // EnhancedTimerDisplay shows time
        expect(screen.getByText(/01:59/)).toBeInTheDocument();
        
        // Both show consistent status
        const runningBadges = screen.getAllByText(/running/i);
        expect(runningBadges.length).toBeGreaterThan(1);
      });
    });

    it('should trigger StopTimerModal from timer components', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);
      
      const modalTriggerSpy = vi.fn();
      mockTimer.hooks.stopGlobalTimerAndLog.mockImplementation(modalTriggerSpy);

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action - Stop from CountdownTimer
      const stopButton = screen.getByRole('button', { name: /stop timer/i });
      await user.click(stopButton);

      // Assertions
      expect(modalTriggerSpy).toHaveBeenCalledWith(
        'project-1',
        'job-1',
        expect.objectContaining({
          actualHours: expect.any(Number)
        })
      );
    });

    it('should handle timer state conflicts between components', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Simulate external timer state change
      act(() => {
        mockTimer.setActiveTimer('test-timer-1', timerStates.paused);
        mockTimer.triggerSync('test-timer-1');
      });

      // Assertions - All components should update
      await waitFor(() => {
        expect(screen.getByText(/paused/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resume timer/i })).toBeInTheDocument();
      });
    });

    it('should maintain consistent timer display across component variations', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      const exceededTimer = { 
        ...timerStates.exceeded, 
        timeRemaining: -300 // 5 minutes exceeded
      };
      mockTimer.setActiveTimer('test-timer-1', exceededTimer);

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Assertions - Consistent exceeded time display
      await waitFor(() => {
        const exceededDisplays = screen.getAllByText(/\+05:00/);
        expect(exceededDisplays.length).toBeGreaterThan(1);
        
        const exceededBadges = screen.getAllByText(/exceeded/i);
        expect(exceededBadges.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Performance & Error Resilience', () => {
    it('should handle rapid timer state changes', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.idle);

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Rapid state changes
      const startButton = screen.getByRole('button', { name: /start timer/i });
      
      // Multiple rapid clicks
      await user.click(startButton);
      await user.click(startButton);
      await user.click(startButton);

      // Should only register one start action
      await waitFor(() => {
        expect(mockTimer.hooks.startGlobalTimer).toHaveBeenCalledTimes(1);
      });
    });

    it('should recover from Firebase connection errors', async () => {
      // Setup
      mockAuth.setCurrentUser(users.freelancer);
      mockTimer.setActiveTimer('test-timer-1', timerStates.running);
      
      // Simulate Firebase error
      mockFirebase.simulateError(new Error('Network error'));

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Action
      const pauseButton = screen.getByRole('button', { name: /pause timer/i });
      await user.click(pauseButton);

      // Should show error state but continue working
      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
        // Timer should still be functional locally
        expect(screen.getByRole('button', { name: /resume timer/i })).toBeInTheDocument();
      });
    });

    it('should handle context provider failures gracefully', async () => {
      // Setup with broken context
      mockTimer.simulateError(new Error('Context error'));

      render(
        <TestWrapper>
          <TimerSystemIntegration />
        </TestWrapper>
      );

      // Should show error boundary
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });
});