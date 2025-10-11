import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { CountdownTimer, TimerState } from '../../../src/components/timer/CountdownTimer'

// Mock hooks and external dependencies
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }),
}))

vi.mock('../../../src/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

describe('CountdownTimer', () => {
  let user: ReturnType<typeof userEvent.setup>
  let mockOnStart: MockedFunction<() => void>
  let mockOnPause: MockedFunction<() => void>
  let mockOnResume: MockedFunction<() => void>
  let mockOnStop: MockedFunction<() => void>
  let mockOnComplete: MockedFunction<() => void>
  let mockOnTick: MockedFunction<(timeLeft: number) => void>
  let defaultProps: any

  beforeEach(() => {
    user = userEvent.setup()
    mockOnStart = vi.fn()
    mockOnPause = vi.fn()
    mockOnResume = vi.fn()
    mockOnStop = vi.fn()
    mockOnComplete = vi.fn()
    mockOnTick = vi.fn()
    vi.useFakeTimers()
    
    defaultProps = {
      initialTime: 3600, // 1 hour
      maxPauseTime: 180, // 3 minutes
      maxPauseCount: 5,
      jobCardId: 'test-job',
      jobCardTitle: 'Test Job Card',
      projectId: 'test-project',
      onStart: mockOnStart,
      onPause: mockOnPause,
      onResume: mockOnResume,
      onStop: mockOnStop,
      onComplete: mockOnComplete,
      onTick: mockOnTick,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('Timer Initialization', () => {
    it('should render with initial time display', () => {
      render(<CountdownTimer {...defaultProps} />)
      
      expect(screen.getByText('01:00:00')).toBeInTheDocument()
      expect(screen.getByText('Test Job Card')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
    })

    it('should display progress bar with correct initial value', () => {
      render(<CountdownTimer {...defaultProps} />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    })

    it('should have proper accessibility attributes', () => {
      render(<CountdownTimer {...defaultProps} />)
      
      const timerDisplay = screen.getByRole('timer')
      expect(timerDisplay).toHaveAttribute('aria-live', 'polite')
      expect(timerDisplay).toHaveAttribute('aria-label', 'Timer: 01:00:00 remaining')
    })
  })

  describe('Timer Controls', () => {
    it('should start timer when start button is clicked', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      const startButton = screen.getByRole('button', { name: /start timer/i })
      await user.click(startButton)
      
      expect(mockOnStart).toHaveBeenCalledWith(expect.objectContaining({
        status: 'running',
        timeRemaining: 3600,
        totalTime: 3600,
      }))
      
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument()
    })

    it('should pause timer when pause button is clicked', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start timer first
      const startButton = screen.getByRole('button', { name: /start timer/i })
      await user.click(startButton)
      
      // Then pause it
      const pauseButton = screen.getByRole('button', { name: /pause timer/i })
      await user.click(pauseButton)
      
      expect(mockOnPause).toHaveBeenCalledWith(expect.objectContaining({
        status: 'paused',
        pauseCount: 1,
      }))
      
      expect(screen.getByRole('button', { name: /resume timer/i })).toBeInTheDocument()
    })

    it('should resume timer when resume button is clicked', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start and pause timer first
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      await user.click(screen.getByRole('button', { name: /pause timer/i }))
      
      // Then resume it
      const resumeButton = screen.getByRole('button', { name: /resume timer/i })
      await user.click(resumeButton)
      
      expect(mockOnResume).toHaveBeenCalledWith(expect.objectContaining({
        status: 'running',
        pauseCount: 1,
      }))
      
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument()
    })

    it('should stop timer when stop button is clicked', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start timer first
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      
      // Then stop it
      const stopButton = screen.getByRole('button', { name: /stop timer/i })
      await user.click(stopButton)
      
      expect(mockOnStop).toHaveBeenCalledWith(expect.objectContaining({
        status: 'stopped',
      }))
    })
  })

  describe('Timer Countdown', () => {
    it('should countdown properly and call onTick', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start timer
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      
      // Advance time by 1 second
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(mockOnTick).toHaveBeenCalledWith(3599)
      })
      
      expect(screen.getByText('59:59')).toBeInTheDocument()
    })

    it('should complete timer when time reaches zero', async () => {
      const shortTimer = { ...defaultProps, initialTime: 2 }
      render(<CountdownTimer {...shortTimer} />)
      
      // Start timer
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      
      // Advance time by 2 seconds to complete timer
      vi.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
          status: 'completed',
          timeRemaining: 0,
        }))
      })
      
      expect(screen.getByText('Time Exceeded')).toBeInTheDocument()
    })

    it('should update progress bar as time counts down', async () => {
      const shortTimer = { ...defaultProps, initialTime: 10 }
      render(<CountdownTimer {...shortTimer} />)
      
      // Start timer
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      
      // Advance time by 5 seconds (50% completion)
      vi.advanceTimersByTime(5000)
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toHaveAttribute('aria-valuenow', '50')
      })
    })
  })

  describe('Pause Limit Enforcement', () => {
    it('should enforce 3-minute pause limit', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start and pause timer
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      await user.click(screen.getByRole('button', { name: /pause timer/i }))
      
      // Advance pause time by 3 minutes (180 seconds)
      vi.advanceTimersByTime(180000)
      
      await waitFor(() => {
        expect(mockOnResume).toHaveBeenCalledWith(expect.objectContaining({
          status: 'running',
        }))
      })
      
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument()
    })

    it('should disable pause button after max pause count reached', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start timer
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      
      // Pause and resume 5 times to reach limit
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole('button', { name: /pause timer/i }))
        await user.click(screen.getByRole('button', { name: /resume timer/i }))
      }
      
      // Pause button should now be disabled
      const pauseButton = screen.getByRole('button', { name: /pause timer/i })
      expect(pauseButton).toBeDisabled()
    })

    it('should show pause warning when approaching limit', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start timer
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      
      // Pause and resume 4 times (approaching limit)
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /pause timer/i }))
        await user.click(screen.getByRole('button', { name: /resume timer/i }))
      }
      
      // Pause once more to trigger warning
      await user.click(screen.getByRole('button', { name: /pause timer/i }))
      
      expect(screen.getByText(/final pause/i)).toBeInTheDocument()
    })
  })

  describe('Event Logging', () => {
    it('should log timer start event', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/timer started/i)).toBeInTheDocument()
      })
    })

    it('should log pause and resume events', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start, pause, and resume
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      await user.click(screen.getByRole('button', { name: /pause timer/i }))
      await user.click(screen.getByRole('button', { name: /resume timer/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/timer paused/i)).toBeInTheDocument()
        expect(screen.getByText(/timer resumed/i)).toBeInTheDocument()
      })
    })

    it('should clear event logs when timer is reset', async () => {
      render(<CountdownTimer {...defaultProps} />)
      
      // Start timer and create some events
      await user.click(screen.getByRole('button', { name: /start timer/i }))
      await user.click(screen.getByRole('button', { name: /pause timer/i }))
      
      // Stop timer (which resets it)
      await user.click(screen.getByRole('button', { name: /stop timer/i }))
      
      // Event logs should be cleared
      expect(screen.queryByText(/timer started/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/timer paused/i)).not.toBeInTheDocument()
    })
  })

  describe('Auto-start Functionality', () => {
    it('should auto-start timer when autoStart is true', () => {
      render(<CountdownTimer {...defaultProps} autoStart={true} />)
      
      expect(mockOnStart).toHaveBeenCalledWith(expect.objectContaining({
        status: 'running',
      }))
      
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument()
    })

    it('should not auto-start when autoStart is false', () => {
      render(<CountdownTimer {...defaultProps} autoStart={false} />)
      
      expect(mockOnStart).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable all controls when disabled prop is true', () => {
      render(<CountdownTimer {...defaultProps} disabled={true} />)
      
      const startButton = screen.getByRole('button', { name: /start timer/i })
      expect(startButton).toBeDisabled()
    })

    it('should show disabled state visually', () => {
      render(<CountdownTimer {...defaultProps} disabled={true} />)
      
      const timerContainer = screen.getByRole('timer').parentElement
      expect(timerContainer).toHaveClass('opacity-50')
    })
  })
})
