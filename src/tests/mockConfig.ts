/**
 * Jest/Vitest Mock Configuration for Timer Components
 * Central configuration for all mocks used in timer component testing
 */

import { vi, beforeEach, afterEach } from 'vitest'

// Import all mock modules
import * as firebaseMocks from './__mocks__/firebase'
import * as contextMocks from './__mocks__/contexts'
import * as websocketMocks from './__mocks__/websocket'

// Global mock setup
export const setupMocks = () => {
  // Mock Firebase modules
  vi.mock('@/firebase', () => firebaseMocks.mockFirebase)
  vi.mock('firebase/auth', () => firebaseMocks.mockAuth)
  vi.mock('firebase/firestore', () => firebaseMocks.mockFirestore)
  vi.mock('firebase/storage', () => firebaseMocks.mockStorage)

  // Mock Context hooks
  vi.mock('@/contexts/modules/timer', () => ({
    useTimer: contextMocks.mockUseTimer,
  }))
  
  vi.mock('@/contexts/modules/auth', () => ({
    useAuth: contextMocks.mockUseAuth,
    canFreelancerUseTimer: vi.fn().mockReturnValue(true),
  }))
  
  vi.mock('@/contexts/modules/projects', () => ({
    useProjects: contextMocks.mockUseProjects,
    canUserStartTimerOnJobCard: vi.fn().mockReturnValue(true),
  }))

  // Mock AppContext
  vi.mock('@/contexts/AppContext', () => ({
    useAppContext: contextMocks.mockUseAppContext,
  }))

  // Mock real-time sync hooks
  vi.mock('@/hooks/useRealtimeTimerSync', () => ({
    useRealtimeTimerSync: websocketMocks.mockUseRealtimeTimerSync,
  }))

  // Mock shadcn/ui hooks
  vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn().mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
      toasts: [],
    }),
  }))

  // Mock utilities
  vi.mock('@/utils/offlineSync', () => ({
    queueOfflineOperation: vi.fn().mockResolvedValue('operation-id'),
    processOfflineQueue: vi.fn().mockResolvedValue(undefined),
    clearOfflineQueue: vi.fn().mockResolvedValue(undefined),
  }))

  vi.mock('@/utils/auditLogger', () => ({
    logTimerAction: vi.fn().mockResolvedValue(undefined),
    logUserAction: vi.fn().mockResolvedValue(undefined),
  }))

  vi.mock('@/utils/firebaseHelpers', () => ({
    sanitizeFirestoreData: vi.fn().mockImplementation((data) => data),
    generateIdempotencyKey: vi.fn().mockReturnValue('test-idempotency-key'),
  }))
}

// Mock cleanup
export const cleanupMocks = () => {
  // Reset all context mocks
  contextMocks.resetAllContextMocks()
  
  // Reset all WebSocket mocks
  websocketMocks.resetWebSocketMocks()
  
  // Clear all mock calls
  vi.clearAllMocks()
  
  // Clear all timers
  vi.clearAllTimers()
  
  // Reset localStorage and sessionStorage
  localStorage.clear()
  sessionStorage.clear()
}

// Vitest setup hooks
export const setupTestEnvironment = () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupMocks()
  })

  afterEach(() => {
    cleanupMocks()
    vi.useRealTimers()
  })
}

// Mock data factories
export const createTestData = {
  // Timer state factory
  timerState: contextMocks.createMockTimerHook,
  
  // User factory
  user: (role: string = 'FREELANCER') => contextMocks.createMockAuthHook({
    user: contextMocks.createMockUser(role as any),
  }),
  
  // Project factory
  project: (overrides = {}) => contextMocks.createMockProjectsHook({
    currentProject: { ...contextMocks.mockProject, ...overrides },
  }),
  
  // Timer scenarios
  scenarios: {
    idle: () => contextMocks.createMockTimerHook({
      currentTimerKey: null,
      activeTimers: new Map(),
    }),
    
    running: (timeRemaining = 240) => contextMocks.createMockTimerHook({
      currentTimerKey: 'PROJ-001:JOB-001',
      activeTimers: new Map([
        ['PROJ-001:JOB-001', {
          ...contextMocks.mockTimerState,
          status: 'running',
          timeRemaining,
        }]
      ]),
    }),
    
    paused: (pauseTimeUsed = 30) => contextMocks.createMockTimerHook({
      currentTimerKey: 'PROJ-001:JOB-001',
      activeTimers: new Map([
        ['PROJ-001:JOB-001', {
          ...contextMocks.mockTimerState,
          status: 'paused',
          pauseTimeUsed,
        }]
      ]),
    }),
    
    exceeded: (overtime = 60) => contextMocks.createMockTimerHook({
      currentTimerKey: 'PROJ-001:JOB-001',
      activeTimers: new Map([
        ['PROJ-001:JOB-001', {
          ...contextMocks.mockTimerState,
          status: 'running',
          timeRemaining: -overtime,
        }]
      ]),
    }),
  },
}

// Test assertion helpers
export const expectations = {
  // Timer operation expectations
  timerStarted: (mockContext: any, projectId: string, jobCardId: string) => {
    expect(mockContext.startGlobalTimer).toHaveBeenCalledWith(
      jobCardId,
      expect.any(String), // jobCardTitle
      projectId,
      expect.any(Number)  // allocatedHours
    )
  },
  
  timerPaused: (mockContext: any, projectId: string, jobCardId: string) => {
    expect(mockContext.pauseGlobalTimer).toHaveBeenCalledWith(projectId, jobCardId)
  },
  
  timerResumed: (mockContext: any, projectId: string, jobCardId: string) => {
    expect(mockContext.resumeGlobalTimer).toHaveBeenCalledWith(projectId, jobCardId)
  },
  
  timerStopped: (mockContext: any, projectId: string, jobCardId: string, logData?: any) => {
    if (logData) {
      expect(mockContext.stopGlobalTimerAndLog).toHaveBeenCalledWith(
        projectId,
        jobCardId,
        logData
      )
    } else {
      expect(mockContext.stopGlobalTimer).toHaveBeenCalledWith(projectId, jobCardId)
    }
  },
  
  // Toast expectations
  toastShown: (mockToast: any, message?: string) => {
    expect(mockToast.toast).toHaveBeenCalled()
    if (message) {
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining(message),
        })
      )
    }
  },
  
  // Role-based access expectations
  roleAccess: (mockAuth: any, role: string, shouldHaveAccess: boolean) => {
    if (shouldHaveAccess) {
      expect(mockAuth.canFreelancerUseTimer).toHaveBeenCalledWith(
        expect.objectContaining({ role })
      )
    } else {
      expect(mockAuth.canFreelancerUseTimer).toHaveReturnedWith(false)
    }
  },
  
  // Assignment validation expectations
  assignmentAccess: (mockProjects: any, projectId: string, jobCardId: string, userId: string) => {
    expect(mockProjects.canUserStartTimerOnJobCard).toHaveBeenCalledWith(
      expect.any(Object), // project
      jobCardId,
      expect.objectContaining({ uid: userId })
    )
  },
}

// Export commonly used mocks for direct access
export {
  firebaseMocks,
  contextMocks,
  websocketMocks,
}

// Export mock constructors for custom scenarios
export const createCustomMocks = {
  timer: contextMocks.createMockTimerHook,
  auth: contextMocks.createMockAuthHook,
  projects: contextMocks.createMockProjectsHook,
}

// Default export with all utilities
export default {
  setupMocks,
  cleanupMocks,
  setupTestEnvironment,
  createTestData,
  expectations,
  createCustomMocks,
  firebaseMocks,
  contextMocks,
  websocketMocks,
}