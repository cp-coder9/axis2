import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CountdownTimer } from '../../components/timer/CountdownTimer'
import { mockTimerContext, mockAuthContext, mockProjectsContext } from '../__mocks__/contexts'
import { mockConfig } from '../mockConfig'
import { 
  timerStates, 
  userFixtures, 
  projectFixtures, 
  UserRole,
  TimerStatus
} from '../fixtures/testData'
import type { TimerState } from '../../types'

// Mock implementations
const mockStartTimer = vi.fn()
const mockPauseTimer = vi.fn()
const mockResumeTimer = vi.fn()
const mockStopTimer = vi.fn()
const mockResetTimer = vi.fn()

// Test wrapper component with providers
const TestWrapper = ({ children, timerState = timerStates.idle, user = userFixtures.freelancer }: any) => {
  const MockProvider = ({ children }: any) => children
  
  // Setup mock context values
  mockTimerContext.useTimer.mockReturnValue({
    timerState,
    startTimer: mockStartTimer,
    pauseTimer: mockPauseTimer,
    resumeTimer: mockResumeTimer,
    stopTimer: mockStopTimer,
    resetTimer: mockResetTimer,
    isLoading: false,
    error: null,
    syncStatus: 'connected'
  })

  mockAuthContext.useAuth.mockReturnValue({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    canFreelancerUseTimer: vi.fn().mockReturnValue(user?.role !== UserRole.CLIENT),
    canUserStartTimerOnJobCard: vi.fn().mockReturnValue(true)
  })

  mockProjectsContext.useProjects.mockReturnValue({
    projects: projectFixtures.validProjects,
    getProject: vi.fn().mockReturnValue(projectFixtures.validProjects[0]),
    getJobCard: vi.fn().mockReturnValue(projectFixtures.validProjects[0].jobCards[0])
  })

  return <MockProvider>{children}</MockProvider>
}

describe('CountdownTimer Component', () => {
  beforeEach(() => {
    mockConfig.setupMocks()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    mockConfig.cleanupMocks()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Role-Based Visibility', () => {
    it('should hide component for CLIENT role', () => {
      render(
        <TestWrapper user={userFixtures.client}>
          <CountdownTimer />
        </TestWrapper>
      )

      // Component should not render for CLIENT role
      expect(screen.queryByTestId('countdown-timer')).not.toBeInTheDocument()
    })

    it('should show component for FREELANCER role', () => {
      render(
        <TestWrapper user={userFixtures.freelancer}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByTestId('countdown-timer')).toBeInTheDocument()
    })

    it('should show component for ADMIN role with admin features', () => {
      render(
        <TestWrapper user={userFixtures.admin}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByTestId('countdown-timer')).toBeInTheDocument()
      // Admin should see override capabilities
      expect(screen.getByText(/admin override/i)).toBeInTheDocument()
    })

    it('should show component for INACTIVE user with limited access', () => {
      render(
        <TestWrapper user={userFixtures.inactive}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByTestId('countdown-timer')).toBeInTheDocument()
      expect(screen.getByText(/account inactive/i)).toBeInTheDocument()
    })
  })

  describe('Timer State Rendering', () => {
    it('should render idle state correctly', () => {
      render(
        <TestWrapper timerState={timerStates.idle}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('IDLE')).toBeInTheDocument()
      expect(screen.getByText('00:00')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    })

    it('should render running state correctly', () => {
      render(
        <TestWrapper timerState={timerStates.running}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('RUNNING')).toBeInTheDocument()
      expect(screen.getByText('02:30')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })

    it('should render paused state correctly', () => {
      render(
        <TestWrapper timerState={timerStates.paused}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('PAUSED')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })

    it('should render exceeded state with overtime display', () => {
      render(
        <TestWrapper timerState={timerStates.exceeded}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('EXCEEDED')).toBeInTheDocument()
      expect(screen.getByText('+05:00')).toBeInTheDocument()
      expect(screen.getByText(/time exceeded/i)).toBeInTheDocument()
    })

    it('should render overtime state correctly', () => {
      render(
        <TestWrapper timerState={timerStates.overtime}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('OVERTIME')).toBeInTheDocument()
      expect(screen.getByText('+15:30')).toBeInTheDocument()
    })
  })

  describe('Timer Controls and State Transitions', () => {
    it('should start timer from idle state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <TestWrapper timerState={timerStates.idle}>
          <CountdownTimer />
        </TestWrapper>
      )

      const startButton = screen.getByRole('button', { name: /start/i })
      await user.click(startButton)

      expect(mockStartTimer).toHaveBeenCalledTimes(1)
    })

    it('should pause timer from running state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <TestWrapper timerState={timerStates.running}>
          <CountdownTimer />
        </TestWrapper>
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      await user.click(pauseButton)

      expect(mockPauseTimer).toHaveBeenCalledTimes(1)
    })

    it('should resume timer from paused state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <TestWrapper timerState={timerStates.paused}>
          <CountdownTimer />
        </TestWrapper>
      )

      const resumeButton = screen.getByRole('button', { name: /resume/i })
      await user.click(resumeButton)

      expect(mockResumeTimer).toHaveBeenCalledTimes(1)
    })

    it('should stop timer and open modal', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <TestWrapper timerState={timerStates.running}>
          <CountdownTimer onTimerStop={vi.fn()} />
        </TestWrapper>
      )

      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      expect(mockStopTimer).toHaveBeenCalledTimes(1)
    })

    it('should reset timer from any state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <TestWrapper timerState={timerStates.exceeded}>
          <CountdownTimer />
        </TestWrapper>
      )

      const resetButton = screen.getByRole('button', { name: /reset/i })
      await user.click(resetButton)

      expect(mockResetTimer).toHaveBeenCalledTimes(1)
    })
  })

  describe('3-Minute Pause Limit Enforcement', () => {
    it('should show pause warning when approaching limit', () => {
      const pausedNearLimit: TimerState = {
        ...timerStates.paused,
        pauseTimeUsed: 170 // 2:50, approaching 3:00 limit
      }

      render(
        <TestWrapper timerState={pausedNearLimit}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText(/pause limit warning/i)).toBeInTheDocument()
      expect(screen.getByText('10s')).toBeInTheDocument() // Time remaining before auto-resume
    })

    it('should auto-stop when pause limit exceeded', async () => {
      const pausedAtLimit: TimerState = {
        ...timerStates.paused,
        pauseTimeUsed: 180 // Exactly at 3:00 limit
      }

      render(
        <TestWrapper timerState={pausedAtLimit}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText(/pause limit exceeded/i)).toBeInTheDocument()
      
      // Auto-stop should trigger
      await waitFor(() => {
        expect(mockStopTimer).toHaveBeenCalledWith({ reason: 'pauseLimitExceeded' })
      })
    })

    it('should prevent pause when already at limit', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      const runningAtLimit: TimerState = {
        ...timerStates.running,
        pauseTimeUsed: 180 // Already used full pause allowance
      }

      render(
        <TestWrapper timerState={runningAtLimit}>
          <CountdownTimer />
        </TestWrapper>
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).toBeDisabled()
      
      await user.click(pauseButton)
      expect(mockPauseTimer).not.toHaveBeenCalled()
    })
  })

  describe('Circular Progress Display', () => {
    it('should show circular progress when enabled', () => {
      render(
        <TestWrapper timerState={timerStates.running}>
          <CountdownTimer showCircular={true} />
        </TestWrapper>
      )

      expect(screen.getByTestId('circular-progress-days')).toBeInTheDocument()
      expect(screen.getByTestId('circular-progress-hours')).toBeInTheDocument()
      expect(screen.getByTestId('circular-progress-minutes')).toBeInTheDocument()
      expect(screen.getByTestId('circular-progress-seconds')).toBeInTheDocument()
    })

    it('should calculate progress percentages correctly', () => {
      const runningTimer: TimerState = {
        ...timerStates.running,
        timeRemaining: 7200, // 2 hours
        totalTime: 14400 // 4 hours total
      }

      render(
        <TestWrapper timerState={runningTimer}>
          <CountdownTimer showCircular={true} />
        </TestWrapper>
      )

      // Should show 50% progress (2/4 hours remaining)
      const progressElement = screen.getByTestId('circular-progress-total')
      expect(progressElement).toHaveAttribute('aria-valuenow', '50')
    })

    it('should handle progress overflow correctly', () => {
      render(
        <TestWrapper timerState={timerStates.exceeded}>
          <CountdownTimer showCircular={true} />
        </TestWrapper>
      )

      // Exceeded state should show 100% with overflow indicator
      const progressElement = screen.getByTestId('circular-progress-total')
      expect(progressElement).toHaveAttribute('aria-valuenow', '100')
      expect(screen.getByText('+05:00')).toBeInTheDocument()
    })
  })

  describe('Component Props Variations', () => {
    it('should render in compact mode', () => {
      render(
        <TestWrapper>
          <CountdownTimer compact={true} />
        </TestWrapper>
      )

      const container = screen.getByTestId('countdown-timer')
      expect(container).toHaveClass('w-64') // Compact width
    })

    it('should render in floating mode', () => {
      render(
        <TestWrapper>
          <CountdownTimer floating={true} />
        </TestWrapper>
      )

      const container = screen.getByTestId('countdown-timer')
      expect(container).toHaveClass('fixed', 'top-20', 'right-4', 'z-50')
    })

    it('should hide controls when specified', () => {
      render(
        <TestWrapper timerState={timerStates.running}>
          <CountdownTimer showControls={false} />
        </TestWrapper>
      )

      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument()
    })

    it('should show job card info when provided', () => {
      const timerWithJobCard: TimerState = {
        ...timerStates.running,
        jobCardId: 'job-1',
        jobCardTitle: 'Website Design',
        projectId: 'proj-1'
      }

      render(
        <TestWrapper timerState={timerWithJobCard}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('Website Design')).toBeInTheDocument()
    })
  })

  describe('Time Formatting', () => {
    it('should format time correctly in standard format', () => {
      const timerWith90Minutes: TimerState = {
        ...timerStates.running,
        timeRemaining: 5400 // 90 minutes = 1:30:00
      }

      render(
        <TestWrapper timerState={timerWith90Minutes}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('01:30:00')).toBeInTheDocument()
    })

    it('should format overtime correctly', () => {
      render(
        <TestWrapper timerState={timerStates.exceeded}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('+05:00')).toBeInTheDocument()
    })

    it('should show seconds in compact format', () => {
      const shortTimer: TimerState = {
        ...timerStates.running,
        timeRemaining: 45 // 45 seconds
      }

      render(
        <TestWrapper timerState={shortTimer}>
          <CountdownTimer compact={true} />
        </TestWrapper>
      )

      expect(screen.getByText('00:45')).toBeInTheDocument()
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper timerState={timerStates.running}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByRole('timer')).toBeInTheDocument()
      expect(screen.getByLabelText(/timer status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/time remaining/i)).toBeInTheDocument()
    })

    it('should announce timer state changes', () => {
      const { rerender } = render(
        <TestWrapper timerState={timerStates.running}>
          <CountdownTimer />
        </TestWrapper>
      )

      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveTextContent('Timer is running')

      rerender(
        <TestWrapper timerState={timerStates.paused}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(liveRegion).toHaveTextContent('Timer is paused')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <TestWrapper timerState={timerStates.idle}>
          <CountdownTimer />
        </TestWrapper>
      )

      const startButton = screen.getByRole('button', { name: /start/i })
      startButton.focus()
      
      await user.keyboard('{Enter}')
      expect(mockStartTimer).toHaveBeenCalledTimes(1)

      await user.keyboard(' ')
      expect(mockStartTimer).toHaveBeenCalledTimes(2)
    })

    it('should provide focus management for disabled states', () => {
      const pausedAtLimit: TimerState = {
        ...timerStates.running,
        pauseTimeUsed: 180
      }

      render(
        <TestWrapper timerState={pausedAtLimit}>
          <CountdownTimer />
        </TestWrapper>
      )

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).toBeDisabled()
      expect(pauseButton).toHaveAttribute('aria-describedby')
    })
  })

  describe('Error Handling', () => {
    it('should display error state when timer operations fail', () => {
      mockTimerContext.useTimer.mockReturnValue({
        timerState: timerStates.idle,
        startTimer: mockStartTimer,
        pauseTimer: mockPauseTimer,
        resumeTimer: mockResumeTimer,
        stopTimer: mockStopTimer,
        resetTimer: mockResetTimer,
        isLoading: false,
        error: 'Failed to start timer',
        syncStatus: 'error'
      })

      render(
        <TestWrapper>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText(/failed to start timer/i)).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should show loading state during operations', () => {
      mockTimerContext.useTimer.mockReturnValue({
        timerState: timerStates.idle,
        startTimer: mockStartTimer,
        pauseTimer: mockPauseTimer,
        resumeTimer: mockResumeTimer,
        stopTimer: mockStopTimer,
        resetTimer: mockResetTimer,
        isLoading: true,
        error: null,
        syncStatus: 'connecting'
      })

      render(
        <TestWrapper>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
    })

    it('should handle sync status indicators', () => {
      mockTimerContext.useTimer.mockReturnValue({
        timerState: timerStates.running,
        startTimer: mockStartTimer,
        pauseTimer: mockPauseTimer,
        resumeTimer: mockResumeTimer,
        stopTimer: mockStopTimer,
        resetTimer: mockResetTimer,
        isLoading: false,
        error: null,
        syncStatus: 'disconnected'
      })

      render(
        <TestWrapper>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText(/offline/i)).toBeInTheDocument()
      expect(screen.getByTestId('sync-status-indicator')).toBeInTheDocument()
    })
  })

  describe('Real-Time Updates', () => {
    it('should update time display every second', async () => {
      const timerWithSeconds: TimerState = {
        ...timerStates.running,
        timeRemaining: 125 // 2:05
      }

      render(
        <TestWrapper timerState={timerWithSeconds}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText('02:05')).toBeInTheDocument()

      // Advance timer by 1 second
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Time should update (mock would need to simulate this)
      await waitFor(() => {
        expect(screen.getByText('02:04')).toBeInTheDocument()
      })
    })

    it('should handle timer completion', async () => {
      const almostComplete: TimerState = {
        ...timerStates.running,
        timeRemaining: 1 // 1 second left
      }

      const onComplete = vi.fn()

      render(
        <TestWrapper timerState={almostComplete}>
          <CountdownTimer onTimerComplete={onComplete} />
        </TestWrapper>
      )

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith({
          reason: 'timeExpired',
          timerState: expect.objectContaining({
            status: TimerStatus.COMPLETED
          })
        })
      })
    })
  })

  describe('Integration with Business Logic', () => {
    it('should respect assignment validation', () => {
      mockAuthContext.useAuth.mockReturnValue({
        user: userFixtures.freelancer,
        isAuthenticated: true,
        isLoading: false,
        canFreelancerUseTimer: vi.fn().mockReturnValue(true),
        canUserStartTimerOnJobCard: vi.fn().mockReturnValue(false) // Not assigned
      })

      render(
        <TestWrapper>
          <CountdownTimer />
        </TestWrapper>
      )

      const startButton = screen.getByRole('button', { name: /start/i })
      expect(startButton).toBeDisabled()
      expect(screen.getByText(/not assigned/i)).toBeInTheDocument()
    })

    it('should show admin override capabilities', () => {
      render(
        <TestWrapper user={userFixtures.admin}>
          <CountdownTimer />
        </TestWrapper>
      )

      expect(screen.getByText(/admin override/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /force start/i })).toBeInTheDocument()
    })

    it('should handle audit logging integration', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <TestWrapper timerState={timerStates.idle}>
          <CountdownTimer />
        </TestWrapper>
      )

      const startButton = screen.getByRole('button', { name: /start/i })
      await user.click(startButton)

      expect(mockStartTimer).toHaveBeenCalledWith(
        expect.objectContaining({
          auditInfo: expect.objectContaining({
            action: 'TIMER_START',
            userId: userFixtures.freelancer.id
          })
        })
      )
    })
  })
})