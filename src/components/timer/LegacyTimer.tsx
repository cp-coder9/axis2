import React, { useState, useCallback } from 'react'
import { CountdownTimer, TimerState } from './CountdownTimer'
import { cn } from '@/lib/utils'

/**
 * LegacyTimer - Compatibility shim for existing timer components
 * 
 * This component maintains the exact API of the original CountdownTimer/EnhancedTimerDisplay
 * components while delegating the actual timer functionality to the new CountdownTimer.
 * 
 * This allows existing code to continue working without changes during the migration.
 */

// Legacy interface compatibility
export interface LegacyTimerInfo {
  startTime: string
  allocatedHours?: number
  totalPausedTime: number
  isPaused: boolean
  jobCardId?: string
  projectId?: string
  pauseWarningShown?: boolean
  autoResumeTimeout?: any
  warningTimer?: any
}

export interface LegacyTimerProps {
  // Legacy props from original components
  activeTimerInfo?: LegacyTimerInfo
  currentTimerKey?: string
  user?: any
  projects?: any[]
  
  // Timer control callbacks (legacy API)
  pauseGlobalTimer?: (projectId: string, jobCardId: string) => Promise<boolean>
  resumeGlobalTimer?: (projectId: string, jobCardId: string) => Promise<boolean>
  stopGlobalTimerAndLog?: (projectId: string, jobCardId: string, details: any) => Promise<void>
  
  // Display props
  className?: string
  showControls?: boolean
  showPauseWarning?: boolean
  timeExceeded?: boolean
  
  // Event handlers
  onModalOpen?: () => void
  onModalClose?: () => void
}

/**
 * Legacy Timer Shim Component
 * Exposes the original timer API but uses the new CountdownTimer internally
 */
export const LegacyTimer: React.FC<LegacyTimerProps> = ({
  activeTimerInfo,
  currentTimerKey,
  user,
  pauseGlobalTimer,
  resumeGlobalTimer,
  stopGlobalTimerAndLog,
  className,
  showControls = true,
  onModalOpen,
  onModalClose,
}) => {
  const [showStopModal, setShowStopModal] = useState(false)

  // Convert legacy timer info to new timer state
  const convertLegacyToNewState = useCallback((legacyInfo: LegacyTimerInfo): TimerState => {
    const startTime = new Date(legacyInfo.startTime)
    const now = new Date()
    const elapsedMs = now.getTime() - startTime.getTime() - legacyInfo.totalPausedTime
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    
    const allocatedSeconds = (legacyInfo.allocatedHours || 1) * 3600
    const timeRemaining = Math.max(0, allocatedSeconds - elapsedSeconds)
    
    return {
      status: legacyInfo.isPaused ? 'paused' : 'running',
      timeRemaining,
      totalTime: allocatedSeconds,
      pauseCount: 0, // Legacy doesn't track this
      pauseTimeUsed: Math.floor(legacyInfo.totalPausedTime / 1000),
      jobCardId: legacyInfo.jobCardId,
      projectId: legacyInfo.projectId,
    }
  }, [])

  // Get current timer info in new format
  const newTimerState = activeTimerInfo ? convertLegacyToNewState(activeTimerInfo) : null

  // Handle timer events from new component
  const handleTimerStart = useCallback((state: TimerState) => {
    // Legacy components Don't need start callback
    console.log('Timer started:', state)
  }, [])

  const handleTimerPause = useCallback(async (state: TimerState) => {
    console.log('Timer paused:', state)
    if (pauseGlobalTimer && currentTimerKey) {
      const [projectId, jobCardId] = currentTimerKey.split('-')
      await pauseGlobalTimer(projectId, jobCardId)
    }
  }, [pauseGlobalTimer, currentTimerKey])

  const handleTimerResume = useCallback(async (state: TimerState) => {
    console.log('Timer resumed:', state)
    if (resumeGlobalTimer && currentTimerKey) {
      const [projectId, jobCardId] = currentTimerKey.split('-')
      await resumeGlobalTimer(projectId, jobCardId)
    }
  }, [resumeGlobalTimer, currentTimerKey])

  const handleTimerStop = useCallback((state: TimerState) => {
    console.log('Timer stopped:', state)
    setShowStopModal(true)
    onModalOpen?.()
  }, [onModalOpen])

  const handleTimerComplete = useCallback(async (state: TimerState) => {
    console.log('Timer completed:', state)
    // Legacy behavior - auto-open stop modal on completion
    setShowStopModal(true)
    onModalOpen?.()
  }, [onModalOpen])

  const handleStopModalClose = useCallback(() => {
    setShowStopModal(false)
    onModalClose?.()
  }, [onModalClose])

  const handleStopWithDetails = useCallback(async (details: { notes: string; file?: File }) => {
    if (stopGlobalTimerAndLog && currentTimerKey) {
      const [projectId, jobCardId] = currentTimerKey.split('-')
      await stopGlobalTimerAndLog(projectId, jobCardId, details)
    }
    handleStopModalClose()
  }, [stopGlobalTimerAndLog, currentTimerKey, handleStopModalClose])

  // Don't render if no active timer (legacy behavior)
  if (!activeTimerInfo || !currentTimerKey) {
    return null
  }

  // Don't show timer for client users (legacy behavior)
  if (user?.role === 'CLIENT') {
    return null
  }

  return (
    <div className={cn('legacy-timer-wrapper', className)}>
      {newTimerState && (
        <CountdownTimer
          initialTime={newTimerState.totalTime}
          maxPauseTime={180} // 3 minutes - legacy default
          maxPauseCount={5}
          jobCardId={newTimerState.jobCardId}
          jobCardTitle={`Job ${newTimerState.jobCardId}`}
          projectId={newTimerState.projectId}
          onStart={handleTimerStart}
          onPause={handleTimerPause}
          onResume={handleTimerResume}
          onStop={handleTimerStop}
          onComplete={handleTimerComplete}
          disabled={!showControls}
          autoStart={false}
        />
      )}

      {/* Legacy Stop Modal - would need to implement if required */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Stop Timer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Timer session completed. Please provide work details and substantiation.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleStopWithDetails({ notes: 'Work completed via legacy interface' })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm Stop
              </button>
              <button
                onClick={handleStopModalClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Default export for backward compatibility
export default LegacyTimer

// Named exports for specific legacy components
export const CountdownTimerDisplay = LegacyTimer
export const EnhancedTimerDisplay = LegacyTimer

/**
 * Legacy hook compatibility
 * This allows existing useTimer hooks to continue working
 */
export const useLegacyTimer = () => {
  return {
    // Placeholder for legacy timer hook functionality
    // This would need to be implemented based on the actual legacy hook API
    activeTimers: {},
    currentTimerKey: null,
    startGlobalTimer: async () => false,
    pauseGlobalTimer: async () => false,
    resumeGlobalTimer: async () => false,
    stopGlobalTimerAndLog: async () => {},
  }
}

/**
 * Legacy Timer Context compatibility
 * This provides the same interface as the original timer context
 */
export const LegacyTimerContext = React.createContext({
  activeTimers: {},
  currentTimerKey: null,
  startGlobalTimer: async () => false,
  pauseGlobalTimer: async () => false,
  resumeGlobalTimer: async () => false,
  stopGlobalTimerAndLog: async () => {},
})

export const LegacyTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const legacyTimerValue = useLegacyTimer()
  
  return (
    <LegacyTimerContext.Provider value={legacyTimerValue}>
      {children}
    </LegacyTimerContext.Provider>
  )
}

// Export types for TypeScript compatibility
export type { TimerState } from './CountdownTimer'

/**
 * Legacy component exports for backward compatibility
 * These allow existing imports to continue working unchanged
 */
export { LegacyTimer as Timer }
export { LegacyTimer as ArchitexTimer }
export { LegacyTimer as ProjectTimer }
