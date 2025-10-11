/**
 * Timer State Test Fixtures
 * Comprehensive timer state test data for all timer scenarios
 */

// Define TimerState interface locally to avoid circular imports
interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped';
  timeRemaining: number;
  totalTime: number;
  pauseCount: number;
  pauseTimeUsed: number;
  lastPauseTime?: number;
  jobCardId?: string;
  jobCardTitle?: string;
  projectId?: string;
}

// Base timer state template
const createTimerState = (overrides: Partial<TimerState> = {}): TimerState => ({
  status: 'idle',
  timeRemaining: 0,
  totalTime: 0,
  pauseCount: 0,
  pauseTimeUsed: 0,
  lastPauseTime: undefined,
  jobCardId: undefined,
  jobCardTitle: undefined,
  projectId: undefined,
  ...overrides
});

// Idle timer state (no active timer)
export const idleTimerState: TimerState = createTimerState({
  status: 'idle',
  timeRemaining: 0,
  totalTime: 0,
  pauseCount: 0,
  pauseTimeUsed: 0
});

// Running timer state (normal operation)
export const runningTimerState: TimerState = createTimerState({
  status: 'running',
  timeRemaining: 5400, // 1.5 hours (90 minutes)
  totalTime: 28800, // 8 hours total
  pauseCount: 0,
  pauseTimeUsed: 0,
  jobCardId: 'job-frontend',
  jobCardTitle: 'Frontend Development',
  projectId: 'project-active'
});

// Paused timer state (within limit)
export const pausedTimerState: TimerState = createTimerState({
  status: 'paused',
  timeRemaining: 3600, // 1 hour remaining
  totalTime: 28800, // 8 hours total
  pauseCount: 1,
  pauseTimeUsed: 60, // 1 minute used
  lastPauseTime: Date.now() - 60000, // Paused 1 minute ago
  jobCardId: 'job-frontend',
  jobCardTitle: 'Frontend Development',
  projectId: 'project-active'
});

// Paused timer approaching limit (2:50 used)
export const pausedNearLimitState: TimerState = createTimerState({
  status: 'paused',
  timeRemaining: 1800, // 30 minutes remaining
  totalTime: 28800, // 8 hours total
  pauseCount: 3,
  pauseTimeUsed: 170, // 2:50 (170 seconds) - warning threshold
  lastPauseTime: Date.now() - 170000, // Paused 2:50 ago
  jobCardId: 'job-backend',
  jobCardTitle: 'Backend API Development',
  projectId: 'project-active'
});

// Paused timer at limit (3:00 - should auto-stop)
export const pausedAtLimitState: TimerState = createTimerState({
  status: 'paused',
  timeRemaining: 900, // 15 minutes remaining
  totalTime: 28800, // 8 hours total
  pauseCount: 5,
  pauseTimeUsed: 180, // 3:00 (180 seconds) - auto-stop threshold
  lastPauseTime: Date.now() - 180000, // Paused 3:00 ago
  jobCardId: 'job-testing',
  jobCardTitle: 'Unit Testing',
  projectId: 'project-active'
});

// Time exceeded state (negative remaining time)
export const exceededTimerState: TimerState = createTimerState({
  status: 'running',
  timeRemaining: -18000, // -5 hours (exceeded by 5 hours) to match test expectation +05:00
  totalTime: 28800, // 8 hours total
  pauseCount: 2,
  pauseTimeUsed: 90, // 1:30 pause time used
  jobCardId: 'job-exceeded',
  jobCardTitle: 'Complex Feature Implementation',
  projectId: 'project-exceeded'
});

// Overtime timer state (significantly exceeded)
export const overtimeTimerState: TimerState = createTimerState({
  status: 'running',
  timeRemaining: -5400, // -1.5 hours (exceeded by 90 min)
  totalTime: 72000, // 20 hours total
  pauseCount: 4,
  pauseTimeUsed: 150, // 2:30 pause time used
  jobCardId: 'job-exceeded',
  jobCardTitle: 'Complex Feature Implementation',
  projectId: 'project-exceeded'
});

// Completed timer state
export const completedTimerState: TimerState = createTimerState({
  status: 'completed',
  timeRemaining: 900, // 15 minutes remaining when completed
  totalTime: 28800, // 8 hours total
  pauseCount: 1,
  pauseTimeUsed: 45, // 45 seconds pause time used
  jobCardId: 'job-documentation',
  jobCardTitle: 'Project Documentation',
  projectId: 'project-active'
});

// Stopped timer state (manually stopped)
export const stoppedTimerState: TimerState = createTimerState({
  status: 'stopped',
  timeRemaining: 7200, // 2 hours remaining when stopped
  totalTime: 28800, // 8 hours total
  pauseCount: 3,
  pauseTimeUsed: 120, // 2:00 pause time used
  jobCardId: 'job-frontend',
  jobCardTitle: 'Frontend Development',
  projectId: 'project-active'
});

// Timer with no allocation (0 total time)
export const noAllocationTimerState: TimerState = createTimerState({
  status: 'running',
  timeRemaining: 0, // No allocation
  totalTime: 0, // No total time
  pauseCount: 0,
  pauseTimeUsed: 0,
  jobCardId: 'job-no-allocation',
  jobCardTitle: 'Exploratory Work',
  projectId: 'project-no-allocation'
});

// Timer state collections for different scenarios
export const allTimerStates = [
  idleTimerState,
  runningTimerState,
  pausedTimerState,
  pausedNearLimitState,
  pausedAtLimitState,
  exceededTimerState,
  overtimeTimerState,
  completedTimerState,
  stoppedTimerState,
  noAllocationTimerState
];

export const activeTimerStates = [
  runningTimerState,
  pausedTimerState,
  pausedNearLimitState,
  pausedAtLimitState,
  exceededTimerState,
  overtimeTimerState
];

export const pausedTimerStates = [
  pausedTimerState,
  pausedNearLimitState,
  pausedAtLimitState
];

export const exceededTimerStates = [
  exceededTimerState,
  overtimeTimerState
];

// Timer state scenarios for testing
export const timerStateScenarios = [
  {
    name: 'Fresh timer start',
    initialState: idleTimerState,
    action: 'start',
    expectedState: 'running',
    expectedTimeRemaining: 28800, // 8 hours
    description: 'Starting a timer from idle state'
  },
  {
    name: 'Normal timer pause',
    initialState: runningTimerState,
    action: 'pause',
    expectedState: 'paused',
    expectedPauseCount: 1,
    description: 'Pausing a running timer'
  },
  {
    name: 'Resume from pause',
    initialState: pausedTimerState,
    action: 'resume',
    expectedState: 'running',
    expectedPauseCount: 1,
    description: 'Resuming a paused timer'
  },
  {
    name: 'Manual timer stop',
    initialState: runningTimerState,
    action: 'stop',
    expectedState: 'stopped',
    requiresModal: true,
    description: 'Manually stopping a running timer'
  },
  {
    name: 'Auto-stop from pause limit',
    initialState: pausedAtLimitState,
    action: 'auto-stop',
    expectedState: 'stopped',
    requiresModal: true,
    description: 'Auto-stopping due to pause limit exceeded'
  },
  {
    name: 'Timer completion',
    initialState: { ...runningTimerState, timeRemaining: 1 },
    action: 'complete',
    expectedState: 'completed',
    requiresModal: true,
    description: 'Timer naturally completing when time runs out'
  }
];

// Pause limit scenarios
export const pauseLimitScenarios = [
  {
    name: 'First pause (no warning)',
    pauseTimeUsed: 30, // 30 seconds
    showWarning: false,
    allowPause: true,
    shouldAutoStop: false,
    description: 'First pause under warning threshold'
  },
  {
    name: 'Approaching limit (warning)',
    pauseTimeUsed: 170, // 2:50 - warning threshold
    showWarning: true,
    allowPause: true,
    shouldAutoStop: false,
    description: 'Pause time approaching 3-minute limit'
  },
  {
    name: 'At limit (auto-stop)',
    pauseTimeUsed: 180, // 3:00 - auto-stop threshold
    showWarning: true,
    allowPause: false,
    shouldAutoStop: true,
    description: 'Pause limit reached, auto-stop triggered'
  },
  {
    name: 'Over limit (should not happen)',
    pauseTimeUsed: 200, // 3:20 - should not be possible
    showWarning: true,
    allowPause: false,
    shouldAutoStop: true,
    description: 'Edge case: pause time over limit'
  }
];

// Time display scenarios
export const timeDisplayScenarios = [
  {
    name: 'Standard time remaining',
    timeRemaining: 3665, // 1:01:05
    expected: '01:01:05',
    expectedCompact: '61:05',
    isOvertime: false
  },
  {
    name: 'Less than hour',
    timeRemaining: 1845, // 30:45
    expected: '00:30:45',
    expectedCompact: '30:45',
    isOvertime: false
  },
  {
    name: 'Less than minute',
    timeRemaining: 45, // 0:45
    expected: '00:00:45',
    expectedCompact: '00:45',
    isOvertime: false
  },
  {
    name: 'Overtime display',
    timeRemaining: -1845, // -30:45
    expected: '+30:45',
    expectedCompact: '+30:45',
    isOvertime: true
  },
  {
    name: 'Large overtime',
    timeRemaining: -5465, // -1:31:05
    expected: '+01:31:05',
    expectedCompact: '+91:05',
    isOvertime: true
  },
  {
    name: 'Zero time',
    timeRemaining: 0,
    expected: '00:00:00',
    expectedCompact: '00:00',
    isOvertime: false
  }
];

// Progress calculation scenarios
export const progressScenarios = [
  {
    name: 'Normal progress',
    totalTime: 28800, // 8 hours
    timeRemaining: 14400, // 4 hours
    expectedProgress: 50, // 50%
    isComplete: false
  },
  {
    name: 'Near completion',
    totalTime: 28800, // 8 hours
    timeRemaining: 900, // 15 minutes
    expectedProgress: 96.875, // 96.875%
    isComplete: false
  },
  {
    name: 'Overtime progress',
    totalTime: 28800, // 8 hours
    timeRemaining: -1800, // -30 minutes
    expectedProgress: 106.25, // 106.25%
    isComplete: true
  },
  {
    name: 'No allocation',
    totalTime: 0,
    timeRemaining: 0,
    expectedProgress: 0,
    isComplete: false
  },
  {
    name: 'Large overtime',
    totalTime: 28800, // 8 hours
    timeRemaining: -14400, // -4 hours (12 hours used)
    expectedProgress: 150, // 150%
    isComplete: true
  }
];

// Timer factory for dynamic test creation
export const createTestTimerState = (overrides: Partial<TimerState> = {}): TimerState => {
  return createTimerState({
    timeRemaining: 3600, // Default 1 hour
    totalTime: 28800, // Default 8 hours
    jobCardId: `test-job-${Date.now()}`,
    jobCardTitle: `Test Task ${Date.now()}`,
    projectId: `test-project-${Date.now()}`,
    ...overrides
  });
};

// Edge case timer states for negative testing
export const edgeTimerStates = {
  nullTimerState: null,
  undefinedTimerState: undefined,
  emptyTimerState: {} as TimerState,
  timerWithNegativeTotal: createTimerState({
    status: 'running',
    timeRemaining: 1800,
    totalTime: -3600, // Negative total time
    pauseCount: 0,
    pauseTimeUsed: 0
  }),
  timerWithInvalidStatus: createTimerState({
    status: 'invalid' as any,
    timeRemaining: 1800,
    totalTime: 3600,
    pauseCount: 0,
    pauseTimeUsed: 0
  }),
  timerWithNaNValues: createTimerState({
    status: 'running',
    timeRemaining: NaN,
    totalTime: NaN,
    pauseCount: NaN,
    pauseTimeUsed: NaN
  }),
  timerWithMissingFields: {
    status: 'running',
    timeRemaining: 1800
    // Missing required fields
  } as TimerState
};

// Timer operation test data
export const timerOperations = {
  start: {
    action: 'start',
    fromStates: ['idle'],
    toState: 'running',
    requiresJobCard: true,
    requiresProject: true
  },
  pause: {
    action: 'pause',
    fromStates: ['running'],
    toState: 'paused',
    checksPauseLimit: true,
    incrementsPauseCount: true
  },
  resume: {
    action: 'resume',
    fromStates: ['paused'],
    toState: 'running',
    validatesPauseLimit: true,
    resetsPauseTime: false
  },
  stop: {
    action: 'stop',
    fromStates: ['running', 'paused'],
    toState: 'stopped',
    requiresModal: true,
    requiresTimeLog: true
  },
  complete: {
    action: 'complete',
    fromStates: ['running'],
    toState: 'completed',
    requiresModal: true,
    requiresTimeLog: true,
    triggeredByTimeout: true
  }
};

export default {
  idleTimerState,
  runningTimerState,
  pausedTimerState,
  pausedNearLimitState,
  pausedAtLimitState,
  exceededTimerState,
  overtimeTimerState,
  completedTimerState,
  stoppedTimerState,
  noAllocationTimerState,
  // Aliases for test convenience
  idle: idleTimerState,
  running: runningTimerState,
  paused: pausedTimerState,
  exceeded: exceededTimerState,
  overtime: overtimeTimerState,
  completed: completedTimerState,
  stopped: stoppedTimerState,
  // Collections
  allTimerStates,
  activeTimerStates,
  pausedTimerStates,
  exceededTimerStates,
  timerStateScenarios,
  pauseLimitScenarios,
  timeDisplayScenarios,
  progressScenarios,
  createTestTimerState,
  edgeTimerStates,
  timerOperations
};