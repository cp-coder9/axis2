/**
 * Mock Implementations for Context Hooks and Providers
 * Provides comprehensive mocks for Timer, Auth, and Projects contexts
 */

import { vi } from 'vitest'
import { TimerState } from '@/components/timer/CountdownTimer'
import { UserRole } from '@/types'

// Mock Timer State
export const mockTimerState: TimerState = {
  status: 'idle',
  timeRemaining: 300,
  totalTime: 300,
  pauseCount: 0,
  pauseTimeUsed: 0,
  jobCardId: 'JOB-001',
  jobCardTitle: 'Test Job Card',
  projectId: 'PROJ-001',
}

// Mock Timer Context
export const mockTimerContext = {
  // Timer state
  activeTimers: new Map([['PROJ-001:JOB-001', mockTimerState]]),
  currentTimerKey: 'PROJ-001:JOB-001',
  
  // Timer operations
  startGlobalTimer: vi.fn().mockResolvedValue('PROJ-001:JOB-001'),
  pauseGlobalTimer: vi.fn().mockResolvedValue(true),
  resumeGlobalTimer: vi.fn().mockResolvedValue(true),
  stopGlobalTimer: vi.fn().mockResolvedValue(undefined),
  stopGlobalTimerAndLog: vi.fn().mockResolvedValue(undefined),
  
  // Timer queries
  getTimerState: vi.fn().mockReturnValue(mockTimerState),
  isTimerActive: vi.fn().mockReturnValue(false),
  getActiveTimerForProject: vi.fn().mockReturnValue(null),
  
  // Timer validation
  canStartTimer: vi.fn().mockReturnValue(true),
  validateTimerOperation: vi.fn().mockReturnValue({ valid: true }),
  
  // Cleanup
  cleanupExpiredTimers: vi.fn().mockResolvedValue(undefined),
}

// Mock User
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@architexaxis.com',
  displayName: 'Test User',
  role: UserRole.FREELANCER,
  profileImage: null,
  isActive: true,
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  settings: {
    theme: 'light' as const,
    notifications: true,
    timezone: 'UTC',
  },
}

// Mock Auth Context
export const mockAuthContext = {
  // User state
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  
  // Auth operations
  signIn: vi.fn().mockResolvedValue(mockUser),
  signOut: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn().mockResolvedValue(mockUser),
  resetPassword: vi.fn().mockResolvedValue(undefined),
  
  // Role-based access control
  canFreelancerUseTimer: vi.fn().mockReturnValue(true),
  hasRole: vi.fn().mockReturnValue(true),
  hasPermission: vi.fn().mockReturnValue(true),
  
  // User management
  updateProfile: vi.fn().mockResolvedValue(undefined),
  updateSettings: vi.fn().mockResolvedValue(undefined),
  refreshUser: vi.fn().mockResolvedValue(mockUser),
}

// Mock Project
export const mockProject = {
  id: 'PROJ-001',
  title: 'Test Project',
  description: 'Test project description',
  status: 'ACTIVE' as const,
  clientId: 'CLIENT-001',
  clientName: 'Test Client',
  assignedTo: ['test-user-123'],
  allocatedHours: 40,
  usedHours: 20,
  remainingHours: 20,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  jobCards: [
    {
      id: 'JOB-001',
      title: 'Test Job Card',
      description: 'Test job card description',
      status: 'IN_PROGRESS' as const,
      assignedTo: 'test-user-123',
      allocatedHours: 5,
      usedHours: 2,
      remainingHours: 3,
      priority: 'MEDIUM' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
}

// Mock Projects Context
export const mockProjectsContext = {
  // Projects state
  projects: [mockProject],
  currentProject: mockProject,
  isLoading: false,
  
  // Project operations
  createProject: vi.fn().mockResolvedValue(mockProject),
  updateProject: vi.fn().mockResolvedValue(mockProject),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  
  // Project queries
  getProject: vi.fn().mockReturnValue(mockProject),
  getUserProjects: vi.fn().mockReturnValue([mockProject]),
  getProjectById: vi.fn().mockReturnValue(mockProject),
  
  // Job card operations
  createJobCard: vi.fn().mockResolvedValue(mockProject.jobCards[0]),
  updateJobCard: vi.fn().mockResolvedValue(mockProject.jobCards[0]),
  deleteJobCard: vi.fn().mockResolvedValue(undefined),
  
  // Access control
  canUserStartTimerOnJobCard: vi.fn().mockReturnValue(true),
  canUserAccessProject: vi.fn().mockReturnValue(true),
  getUserProjectRole: vi.fn().mockReturnValue('ASSIGNED'),
  
  // Project validation
  validateProjectAccess: vi.fn().mockReturnValue({ valid: true }),
  validateJobCardAssignment: vi.fn().mockReturnValue({ valid: true }),
}

// Mock useTimer Hook
export const mockUseTimer = vi.fn().mockReturnValue(mockTimerContext)

// Mock useAuth Hook
export const mockUseAuth = vi.fn().mockReturnValue(mockAuthContext)

// Mock useProjects Hook
export const mockUseProjects = vi.fn().mockReturnValue(mockProjectsContext)

// Mock useAppContext Hook
export const mockUseAppContext = vi.fn().mockReturnValue({
  ...mockAuthContext,
  ...mockTimerContext,
  ...mockProjectsContext,
})

// Context Provider Mocks
export const MockTimerProvider = ({ children }: { children: React.ReactNode }) => children
export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => children
export const MockProjectsProvider = ({ children }: { children: React.ReactNode }) => children
export const MockAppProvider = ({ children }: { children: React.ReactNode }) => children

// Hook Implementations for Testing
export const createMockTimerHook = (overrides: Partial<typeof mockTimerContext> = {}) => {
  return vi.fn().mockReturnValue({ ...mockTimerContext, ...overrides })
}

export const createMockAuthHook = (overrides: Partial<typeof mockAuthContext> = {}) => {
  return vi.fn().mockReturnValue({ ...mockAuthContext, ...overrides })
}

export const createMockProjectsHook = (overrides: Partial<typeof mockProjectsContext> = {}) => {
  return vi.fn().mockReturnValue({ ...mockProjectsContext, ...overrides })
}

// Reset all mocks
export const resetAllContextMocks = () => {
  Object.values(mockTimerContext).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
  Object.values(mockAuthContext).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
  Object.values(mockProjectsContext).forEach(mock => {
    if (vi.isMockFunction(mock)) mock.mockClear()
  })
}

// Export all mocks
export default {
  mockTimerState,
  mockTimerContext,
  mockUser,
  mockAuthContext,
  mockProject,
  mockProjectsContext,
  mockUseTimer,
  mockUseAuth,
  mockUseProjects,
  mockUseAppContext,
  MockTimerProvider,
  MockAuthProvider,
  MockProjectsProvider,
  MockAppProvider,
  createMockTimerHook,
  createMockAuthHook,
  createMockProjectsHook,
  resetAllContextMocks,
}