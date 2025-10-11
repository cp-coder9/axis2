/**
 * Time Utilities for Architex Axis Timer System
 * 
 * Provides comprehensive time formatting, calculation, and manipulation functions
 * for the timer system and general application use.
 */

export interface TimeSegments {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

export interface TimerDuration {
  start: Date
  end?: Date
  pausedDuration?: number
  totalSeconds: number
}

/**
 * Format seconds into HH:MM:SS format
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) return '00:00:00'
  
  // Floor the input to handle decimal values properly
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = Math.floor(totalSeconds % 60)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format seconds into compact format (e.g., "2h 30m", "45m", "30s")
 */
export function formatTimeCompact(seconds: number): string {
  if (seconds < 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  
  if (minutes > 0) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  return `${remainingSeconds}s`
}

/**
 * Parse time string (HH:MM:SS or MM:SS) into seconds
 */
export function parseTimeToSeconds(timeString: string): number {
  const parts = timeString.split(':').map(part => parseInt(part, 10))
  
  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts
    return (minutes * 60) + seconds
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts
    return (hours * 3600) + (minutes * 60) + seconds
  }
  
  throw new Error(`Invalid time format: ${timeString}`)
}

/**
 * Get time segments from seconds
 */
export function getTimeSegments(seconds: number): TimeSegments {
  const totalSeconds = Math.max(0, seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60
  
  return {
    hours,
    minutes,
    seconds: remainingSeconds,
    totalSeconds
  }
}

/**
 * Calculate elapsed time between two dates
 */
export function calculateElapsed(startTime: Date, endTime?: Date): number {
  const end = endTime || new Date()
  return Math.floor((end.getTime() - startTime.getTime()) / 1000)
}

/**
 * Calculate remaining time for a countdown
 */
export function calculateRemaining(startTime: Date, durationSeconds: number): number {
  const elapsed = calculateElapsed(startTime)
  return Math.max(0, durationSeconds - elapsed)
}

/**
 * Add time to a date
 */
export function addTime(date: Date, seconds: number): Date {
  return new Date(date.getTime() + (seconds * 1000))
}

/**
 * Check if a time is in business hours (9 AM - 6 PM)
 */
export function isBusinessHours(date: Date = new Date()): boolean {
  const hour = date.getHours()
  const day = date.getDay()
  
  // Monday (1) to Friday (5), 9 AM to 6 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18
}

/**
 * Get next business day
 */
export function getNextBusinessDay(date: Date = new Date()): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  
  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1)
  }
  
  return next
}

/**
 * Format relative time (e.g., "2 hours ago", "in 30 minutes")
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.abs(Math.floor(diffMs / 1000))
  const isPast = diffMs > 0
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffSeconds / interval.seconds)
    if (count >= 1) {
      const unit = count === 1 ? interval.label : `${interval.label}s`
      return isPast ? `${count} ${unit} ago` : `in ${count} ${unit}`
    }
  }
  
  return 'just now'
}

/**
 * Format duration with appropriate units
 */
export function formatDuration(seconds: number): string {
  const segments = getTimeSegments(seconds)
  
  if (segments.hours > 0) {
    return `${segments.hours}h ${segments.minutes}m ${segments.seconds}s`
  } else if (segments.minutes > 0) {
    return `${segments.minutes}m ${segments.seconds}s`
  } else {
    return `${segments.seconds}s`
  }
}

/**
 * Calculate business hours between two dates
 */
export function calculateBusinessHours(startDate: Date, endDate: Date): number {
  let totalHours = 0
  const current = new Date(startDate)
  
  while (current < endDate) {
    if (isBusinessHours(current)) {
      totalHours += 1
    }
    current.setHours(current.getHours() + 1)
  }
  
  return totalHours
}

/**
 * Get time zone offset in hours
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60
}

/**
 * Convert local time to UTC
 */
export function toUTC(date: Date): Date {
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000))
}

/**
 * Convert UTC time to local
 */
export function fromUTC(date: Date): Date {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
}

/**
 * Timer validation utilities
 */
export const TimerValidation = {
  /**
   * Check if a timer duration is valid
   */
  isValidDuration(seconds: number): boolean {
    return seconds > 0 && seconds <= 86400 // Max 24 hours
  },
  
  /**
   * Check if a time range is valid
   */
  isValidTimeRange(start: Date, end: Date): boolean {
    return start < end && (end.getTime() - start.getTime()) <= 86400000 // Max 24 hours
  },
  
  /**
   * Validate timer state consistency
   */
  isValidTimerState(startTime: Date, pausedDuration: number = 0): boolean {
    const elapsed = calculateElapsed(startTime)
    return elapsed >= pausedDuration && elapsed <= 86400 // 24 hour max
  }
}

/**
 * Timer calculation utilities
 */
export const TimerCalculations = {
  /**
   * Calculate effective work time (excluding pauses)
   */
  calculateWorkTime(startTime: Date, pausedDuration: number = 0, endTime?: Date): number {
    const totalElapsed = calculateElapsed(startTime, endTime)
    return Math.max(0, totalElapsed - pausedDuration)
  },
  
  /**
   * Calculate pause percentage
   */
  calculatePausePercentage(startTime: Date, pausedDuration: number): number {
    const totalElapsed = calculateElapsed(startTime)
    return totalElapsed > 0 ? (pausedDuration / totalElapsed) * 100 : 0
  },
  
  /**
   * Calculate productivity score based on pause time
   */
  calculateProductivityScore(startTime: Date, pausedDuration: number): number {
    const pausePercentage = TimerCalculations.calculatePausePercentage(startTime, pausedDuration)
    return Math.max(0, 100 - pausePercentage)
  }
}

export default {
  formatTime,
  formatTimeCompact,
  parseTimeToSeconds,
  getTimeSegments,
  calculateElapsed,
  calculateRemaining,
  addTime,
  isBusinessHours,
  getNextBusinessDay,
  formatRelativeTime,
  formatDuration,
  calculateBusinessHours,
  getTimezoneOffset,
  toUTC,
  fromUTC,
  TimerValidation,
  TimerCalculations
}
