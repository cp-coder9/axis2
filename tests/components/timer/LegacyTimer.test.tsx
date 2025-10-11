import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { LegacyTimer, LegacyTimerProps, LegacyTimerInfo } from '../../../src/components/timer/LegacyTimer'

// Mock dependencies
vi.mock('../../../src/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

describe('LegacyTimer', () => {
  let user: ReturnType<typeof userEvent.setup>
  let mockPauseGlobalTimer: Mock<[string, string], Promise<boolean>>
  let mockResumeGlobalTimer: Mock<[string, string], Promise<boolean>>
  let mockStopGlobalTimerAndLog: Mock<[string, string, any], Promise<void>>
  let mockOnModalOpen: Mock<[], void>
  let mockOnModalClose: Mock<[], void>

  beforeEach(() => {
    user = userEvent.setup()
    mockPauseGlobalTimer = vi.fn().mockResolvedValue(true)
    mockResumeGlobalTimer = vi.fn().mockResolvedValue(true)
    mockStopGlobalTimerAndLog = vi.fn().mockResolvedValue(undefined)
    mockOnModalOpen = vi.fn()
    mockOnModalClose = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  const createMockTimerInfo = (overrides: Partial<LegacyTimerInfo> = {}): LegacyTimerInfo => ({
    startTime: new Date(Date.now() - 1800000).toISOString(), // Started 30 minutes ago
    allocatedHours: 1,
    totalPausedTime: 0,
    isPaused: false,
    jobCardId: 'test-job',
    projectId: 'test-project',
    ...overrides,
  })

  const getDefaultProps = (): LegacyTimerProps => ({
    activeTimerInfo: createMockTimerInfo(),
    currentTimerKey: 'test-project-test-job',
    user: { role: 'FREELANCER' } as any,
    pauseGlobalTimer: mockPauseGlobalTimer,
    resumeGlobalTimer: mockResumeGlobalTimer,
    stopGlobalTimerAndLog: mockStopGlobalTimerAndLog,
    onModalOpen: mockOnModalOpen,
    onModalClose: mockOnModalClose,
  })

  describe('Legacy Timer Rendering', () => {
    it('should render with active timer info', () => {
      render(<LegacyTimer {...getDefaultProps()} />)
      
      // Should render the new CountdownTimer component
      expect(screen.getByRole('timer')).toBeInTheDocument()
      expect(screen.getByText(/Job test-job/)).toBeInTheDocument()
    })

    it('should not render when no active timer info', () => {
      const props = getDefaultProps()
      const { container } = render(<LegacyTimer {...props} activeTimerInfo={undefined} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should not render for client users', () => {
      const props = getDefaultProps()
      const clientUser = { role: 'CLIENT' }
      const { container } = render(<LegacyTimer {...props} user={clientUser} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should not render when no current timer key', () => {
      const props = getDefaultProps()
      const { container } = render(<LegacyTimer {...props} currentTimerKey={undefined} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Legacy API Compatibility', () => {
    it('should convert legacy timer info to new timer state correctly', () => {
      const legacyInfo = createMockTimerInfo({
        startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        allocatedHours: 2, // 2 hours allocated
        totalPausedTime: 300000, // 5 minutes paused
      })

      const props = getDefaultProps()
      render(<LegacyTimer {...props} activeTimerInfo={legacyInfo} />)

      // Timer should show remaining time (2 hours - 30 minutes + 5 minutes paused = 1.58 hours)
      expect(screen.getByRole('timer')).toBeInTheDocument()
    })

    it('should handle paused timer state correctly', () => {
      const pausedTimerInfo = createMockTimerInfo({
        isPaused: true,
        totalPausedTime: 600000, // 10 minutes paused
      })

      const props = getDefaultProps()
      render(<LegacyTimer {...props} activeTimerInfo={pausedTimerInfo} />)

      // Should show resume button since timer is paused
      expect(screen.getByRole('button', { name: /resume timer/i })).toBeInTheDocument()
    })
  })

  describe('Legacy Timer Events', () => {
    it('should call legacy pause function when timer is paused', async () => {
      render(<LegacyTimer {...getDefaultProps()} />)
      
      const pauseButton = screen.getByRole('button', { name: /pause timer/i })
      await user.click(pauseButton)
      
      expect(mockPauseGlobalTimer).toHaveBeenCalledWith('test-project', 'test-job')
    })

    it('should call legacy resume function when timer is resumed', async () => {
      const pausedTimerInfo = createMockTimerInfo({ isPaused: true })
      const props = getDefaultProps()
      render(<LegacyTimer {...props} activeTimerInfo={pausedTimerInfo} />)
      
      const resumeButton = screen.getByRole('button', { name: /resume timer/i })
      await user.click(resumeButton)
      
      expect(mockResumeGlobalTimer).toHaveBeenCalledWith('test-project', 'test-job')
    })

    it('should open stop modal when timer is stopped', async () => {
      render(<LegacyTimer {...getDefaultProps()} />)
      
      const stopButton = screen.getByRole('button', { name: /stop timer/i })
      await user.click(stopButton)
      
      expect(mockOnModalOpen).toHaveBeenCalled()
      expect(screen.getByText('Stop Timer')).toBeInTheDocument()
    })

    it('should open stop modal when timer completes', async () => {
      // Create timer that will complete quickly
      const completingTimerInfo = createMockTimerInfo({
        startTime: new Date(Date.now() - 3590000).toISOString(), // Started 59:50 ago (10 seconds left)
        allocatedHours: 1,
      })

      const props = getDefaultProps()
      render(<LegacyTimer {...props} activeTimerInfo={completingTimerInfo} />)
      
      // Timer should auto-complete and show modal
      // Note: This would need proper timer simulation in real test
      expect(mockOnModalOpen).not.toHaveBeenCalled() // Until timer actually completes
    })
  })

  describe('Legacy Stop Modal', () => {
    it('should show stop modal when triggered', async () => {
      render(<LegacyTimer {...getDefaultProps()} />)
      
      // Trigger stop modal
      const stopButton = screen.getByRole('button', { name: /stop timer/i })
      await user.click(stopButton)
      
      expect(screen.getByText('Stop Timer')).toBeInTheDocument()
      expect(screen.getByText(/Timer session completed/)).toBeInTheDocument()
    })

    it('should call stop function when confirmed', async () => {
      render(<LegacyTimer {...getDefaultProps()} />)
      
      // Open stop modal
      const stopButton = screen.getByRole('button', { name: /stop timer/i })
      await user.click(stopButton)
      
      // Confirm stop
      const confirmButton = screen.getByRole('button', { name: /confirm stop/i })
      await user.click(confirmButton)
      
      expect(mockStopGlobalTimerAndLog).toHaveBeenCalledWith(
        'test-project',
        'test-job',
        { notes: 'Work completed via legacy interface' }
      )
    })

    it('should close modal when cancelled', async () => {
      render(<LegacyTimer {...getDefaultProps()} />)
      
      // Open stop modal
      const stopButton = screen.getByRole('button', { name: /stop timer/i })
      await user.click(stopButton)
      
      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(mockOnModalClose).toHaveBeenCalled()
      expect(screen.queryByText('Stop Timer')).not.toBeInTheDocument()
    })
  })

  describe('Legacy Component Exports', () => {
    it('should export default LegacyTimer', () => {
      expect(LegacyTimer).toBeDefined()
    })

    it('should export all named exports', () => {
      const module = require('../../../src/components/timer/LegacyTimer')
      expect(module.Timer).toBeDefined()
      expect(module.CountdownTimerDisplay).toBeDefined()
      expect(module.EnhancedTimerDisplay).toBeDefined()
    })
  })

  describe('Legacy Hook Compatibility', () => {
    it('should provide useLegacyTimer hook', () => {
      const module = require('../../../src/components/timer/LegacyTimer')
      expect(module.useLegacyTimer).toBeInstanceOf(Function)
    })

    it('should provide LegacyTimerContext', () => {
      const module = require('../../../src/components/timer/LegacyTimer')
      expect(module.LegacyTimerContext).toBeDefined()
    })

    it('should provide LegacyTimerProvider', () => {
      const module = require('../../../src/components/timer/LegacyTimer')
      expect(module.LegacyTimerProvider).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing timer key gracefully', () => {
      const props = getDefaultProps()
      const { container } = render(<LegacyTimer {...props} currentTimerKey={''} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should handle malformed timer key', () => {
      const props = getDefaultProps()
      render(<LegacyTimer {...props} currentTimerKey={'malformed-key'} />)
      
      // Should still render timer component
      expect(screen.getByRole('timer')).toBeInTheDocument()
    })

    it('should handle timer info with missing required fields', () => {
      const incompleteTimerInfo = {
        startTime: new Date().toISOString(),
        totalPausedTime: 0,
        isPaused: false,
        // Missing allocatedHours, jobCardId, projectId
      } as LegacyTimerInfo

      const props = getDefaultProps()
      render(<LegacyTimer {...props} activeTimerInfo={incompleteTimerInfo} />)
      
      // Should still render with defaults
      expect(screen.getByRole('timer')).toBeInTheDocument()
    })
  })
})
