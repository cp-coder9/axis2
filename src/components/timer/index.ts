/**
 * Timer Components Export Module
 * Enhanced shadcn/ui timer system with role-based access control and circular progress visualization
 * 
 * @module Timer Components
 * @description Complete timer system with role-based access, circular progress, and file upload capabilities
 * @version 1.0.0
 */

// Core Timer Components
import { CountdownTimer, type TimerState, type CountdownTimerProps } from './CountdownTimer'
import EnhancedTimerDisplay, { type EnhancedTimerDisplayProps } from './EnhancedTimerDisplay'
import { StopTimerModal, type StopTimerModalProps } from './StopTimerModal'
import { LegacyTimer } from './LegacyTimer'
import { TimerSyncStatus } from './TimerSyncStatus'

// Export all components
export { CountdownTimer, type CountdownTimerProps }
export { EnhancedTimerDisplay, type EnhancedTimerDisplayProps }
export { StopTimerModal, type StopTimerModalProps }
export { LegacyTimer }
export { TimerSyncStatus }
export type { TimerState }

// Backward Compatibility Aliases
export { CountdownTimer as Timer } from './CountdownTimer'
export { LegacyTimer as OriginalTimer } from './LegacyTimer'
export { EnhancedTimerDisplay as CompactTimer }

/**
 * Timer Component Collection
 * @description Object containing all timer components for dynamic imports
 */
export const TimerComponents = {
  CountdownTimer,
  EnhancedTimerDisplay,
  StopTimerModal,
  LegacyTimer,
  TimerSyncStatus,
} as const

/**
 * Timer Component Types
 * @description Union type of all available timer component names
 */
export type TimerComponentName = keyof typeof TimerComponents