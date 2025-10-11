/**
 * Timer Utilities Test Suite
 * Tests utility functions, time calculations, and helper methods for timer system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  formatTime, 
  calculateProgress, 
  validateTimerState, 
  formatTimeRemaining,
  calculateOvertime,
  sanitizeTimerData,
  validateJobCardAccess,
  checkPauseLimit,
  calculateTotalPauseTime,
  getTimerStatusColor,
  formatTimeForDisplay,
  parseTimeInput,
  isValidTimeValue,
  getRolePermissions,
  sanitizeFirestoreData,
  createIdempotencyKey,
  validateTimerTransition,
  calculateTimePercentage,
  formatDuration,
  getNextTimerState,
  validateUserAccess
} from '../../utils/timerUtils';
import { 
  canFreelancerUseTimer
} from '../../contexts/modules/auth';
import { 
  canUserStartTimerOnJobCard 
} from '../../contexts/modules/projects';
import { UserRole } from '../../types';
import { testData } from '../fixtures/testData';

// Mock the auth module
vi.mock('../../contexts/modules/auth', () => ({
  canFreelancerUseTimer: vi.fn(),
}));

vi.mock('../../contexts/modules/projects', () => ({
  canUserStartTimerOnJobCard: vi.fn(),
}));

describe('Timer Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe('Time Formatting Functions', () => {
    describe('formatTime', () => {
      it('should format seconds to HH:MM:SS', () => {
        expect(formatTime(3661)).toBe('01:01:01'); // 1 hour, 1 minute, 1 second
        expect(formatTime(3600)).toBe('01:00:00'); // 1 hour
        expect(formatTime(60)).toBe('00:01:00'); // 1 minute
        expect(formatTime(30)).toBe('00:00:30'); // 30 seconds
        expect(formatTime(0)).toBe('00:00:00'); // 0 seconds
      });

      it('should handle negative values gracefully', () => {
        expect(formatTime(-30)).toBe('00:00:00');
        expect(formatTime(-3600)).toBe('00:00:00');
      });

      it('should handle large values', () => {
        expect(formatTime(86400)).toBe('24:00:00'); // 24 hours
        expect(formatTime(359999)).toBe('99:59:59'); // Max reasonable display
      });

      it('should handle decimal inputs', () => {
        expect(formatTime(90.5)).toBe('00:01:30'); // Floor to 90 seconds
        expect(formatTime(3661.9)).toBe('01:01:01'); // Floor to 3661 seconds
      });
    });

    describe('formatTimeRemaining', () => {
      it('should format remaining time with proper sign', () => {
        expect(formatTimeRemaining(1800)).toBe('30:00'); // 30 minutes remaining
        expect(formatTimeRemaining(90)).toBe('01:30'); // 1.5 minutes remaining
        expect(formatTimeRemaining(-300)).toBe('+05:00'); // 5 minutes overtime
        expect(formatTimeRemaining(0)).toBe('00:00'); // Exactly on time
      });

      it('should handle edge cases', () => {
        expect(formatTimeRemaining(-1)).toBe('+00:01'); // 1 second overtime
        expect(formatTimeRemaining(86400)).toBe('1440:00'); // 24 hours in minutes
      });
    });

    describe('formatTimeForDisplay', () => {
      it('should format time with role-specific display', () => {
        const state = testData.timerStates.running;
        expect(formatTimeForDisplay(state, UserRole.FREELANCER)).toBe('01:30:00');
        expect(formatTimeForDisplay(state, UserRole.ADMIN)).toBe('01:30:00 (Admin View)');
        expect(formatTimeForDisplay(state, UserRole.CLIENT)).toBe('Timer Active');
      });

      it('should show overtime with proper formatting', () => {
        const exceededState = testData.timerStates.exceeded;
        expect(formatTimeForDisplay(exceededState, UserRole.FREELANCER)).toBe('+05:00');
        expect(formatTimeForDisplay(exceededState, UserRole.ADMIN)).toBe('+05:00 (Monitoring)');
      });
    });

    describe('formatDuration', () => {
      it('should format duration in human readable format', () => {
        expect(formatDuration(3661)).toBe('1 hour 1 minute');
        expect(formatDuration(7200)).toBe('2 hours');
        expect(formatDuration(300)).toBe('5 minutes');
        expect(formatDuration(45)).toBe('45 seconds');
        expect(formatDuration(3725)).toBe('1 hour 2 minutes');
      });

      it('should handle zero and negative values', () => {
        expect(formatDuration(0)).toBe('0 seconds');
        expect(formatDuration(-300)).toBe('0 seconds');
      });
    });
  });

  describe('Progress Calculation Functions', () => {
    describe('calculateProgress', () => {
      it('should calculate correct progress percentage', () => {
        expect(calculateProgress(1800, 3600)).toBe(50); // 30 min used of 60 min = 50%
        expect(calculateProgress(900, 3600)).toBe(25); // 15 min used of 60 min = 25%
        expect(calculateProgress(3600, 3600)).toBe(100); // Exactly on time
        expect(calculateProgress(0, 3600)).toBe(0); // No time used
      });

      it('should handle overtime correctly', () => {
        expect(calculateProgress(4500, 3600)).toBe(125); // 25% overtime
        expect(calculateProgress(7200, 3600)).toBe(200); // 100% overtime
      });

      it('should handle zero allocation', () => {
        expect(calculateProgress(1800, 0)).toBe(0);
        expect(calculateProgress(0, 0)).toBe(0);
      });

      it('should handle edge cases', () => {
        expect(calculateProgress(-300, 3600)).toBe(0); // Negative used time
        expect(calculateProgress(1800, -3600)).toBe(0); // Negative allocation
      });
    });

    describe('calculateTimePercentage', () => {
      it('should calculate time percentage with precision', () => {
        expect(calculateTimePercentage(1500, 3600)).toBe(41.67); // 25 min of 60 min
        expect(calculateTimePercentage(2700, 3600)).toBe(75.0); // 45 min of 60 min
        expect(calculateTimePercentage(1800, 3600)).toBe(50.0); // 30 min of 60 min
      });

      it('should cap at 100% for normal progress', () => {
        expect(calculateTimePercentage(3600, 3600)).toBe(100.0);
        expect(calculateTimePercentage(4500, 3600)).toBe(100.0); // Overtime capped
      });
    });

    describe('calculateOvertime', () => {
      it('should calculate overtime correctly', () => {
        expect(calculateOvertime(4500, 3600)).toBe(900); // 15 minutes overtime
        expect(calculateOvertime(7200, 3600)).toBe(3600); // 60 minutes overtime
        expect(calculateOvertime(3600, 3600)).toBe(0); // No overtime
        expect(calculateOvertime(1800, 3600)).toBe(0); // Under time
      });

      it('should handle zero allocation', () => {
        expect(calculateOvertime(1800, 0)).toBe(0);
        expect(calculateOvertime(0, 0)).toBe(0);
      });
    });
  });

  describe('Timer State Validation Functions', () => {
    describe('validateTimerState', () => {
      it('should validate correct timer states', () => {
        const validState = testData.timerStates.running;
        expect(validateTimerState(validState)).toBe(true);

        const idleState = testData.timerStates.idle;
        expect(validateTimerState(idleState)).toBe(true);
      });

      it('should reject invalid timer states', () => {
        const invalidState = {
          status: 'invalid' as any,
          timeRemaining: -100,
          totalTime: 3600,
          pauseCount: 0,
          pauseTimeUsed: 0
        };
        expect(validateTimerState(invalidState)).toBe(false);

        const negativeTimeState = {
          ...testData.timerStates.running,
          timeRemaining: -300
        };
        expect(validateTimerState(negativeTimeState)).toBe(false);
      });

      it('should validate pause time limits', () => {
        const validPausedState = {
          ...testData.timerStates.paused,
          pauseTimeUsed: 120 // 2 minutes used
        };
        expect(validateTimerState(validPausedState)).toBe(true);

        const exceededPauseState = {
          ...testData.timerStates.paused,
          pauseTimeUsed: 200 // Over 3 minute limit
        };
        expect(validateTimerState(exceededPauseState)).toBe(false);
      });
    });

    describe('validateTimerTransition', () => {
      it('should validate allowed state transitions', () => {
        expect(validateTimerTransition('idle', 'running')).toBe(true);
        expect(validateTimerTransition('running', 'paused')).toBe(true);
        expect(validateTimerTransition('paused', 'running')).toBe(true);
        expect(validateTimerTransition('running', 'stopped')).toBe(true);
        expect(validateTimerTransition('paused', 'stopped')).toBe(true);
      });

      it('should reject invalid state transitions', () => {
        expect(validateTimerTransition('idle', 'paused')).toBe(false);
        expect(validateTimerTransition('stopped', 'running')).toBe(false);
        expect(validateTimerTransition('completed', 'paused')).toBe(false);
      });
    });

    describe('getNextTimerState', () => {
      it('should determine correct next state', () => {
        expect(getNextTimerState('idle', 'start')).toBe('running');
        expect(getNextTimerState('running', 'pause')).toBe('paused');
        expect(getNextTimerState('paused', 'resume')).toBe('running');
        expect(getNextTimerState('running', 'stop')).toBe('stopped');
        expect(getNextTimerState('paused', 'stop')).toBe('stopped');
      });

      it('should return current state for invalid actions', () => {
        expect(getNextTimerState('idle', 'pause')).toBe('idle');
        expect(getNextTimerState('stopped', 'resume')).toBe('stopped');
      });
    });

    describe('isValidTimeValue', () => {
      it('should validate time values correctly', () => {
        expect(isValidTimeValue(3600)).toBe(true); // 1 hour
        expect(isValidTimeValue(0)).toBe(true); // Zero time
        expect(isValidTimeValue(86400)).toBe(true); // 24 hours
        expect(isValidTimeValue(-300)).toBe(false); // Negative time
        expect(isValidTimeValue(NaN)).toBe(false); // NaN
        expect(isValidTimeValue(Infinity)).toBe(false); // Infinity
      });
    });
  });

  describe('Pause Limit Functions', () => {
    describe('checkPauseLimit', () => {
      it('should check pause limit correctly', () => {
        expect(checkPauseLimit(120)).toEqual({ 
          exceeded: false, 
          remaining: 60, 
          warning: false 
        }); // 2 minutes used

        expect(checkPauseLimit(170)).toEqual({ 
          exceeded: false, 
          remaining: 10, 
          warning: true 
        }); // 2:50 used, warning

        expect(checkPauseLimit(180)).toEqual({ 
          exceeded: true, 
          remaining: 0, 
          warning: true 
        }); // 3 minutes used, exceeded

        expect(checkPauseLimit(200)).toEqual({ 
          exceeded: true, 
          remaining: 0, 
          warning: true 
        }); // Over limit
      });

      it('should handle edge cases', () => {
        expect(checkPauseLimit(0)).toEqual({ 
          exceeded: false, 
          remaining: 180, 
          warning: false 
        }); // No time used

        expect(checkPauseLimit(-30)).toEqual({ 
          exceeded: false, 
          remaining: 180, 
          warning: false 
        }); // Negative time
      });
    });

    describe('calculateTotalPauseTime', () => {
      it('should calculate total pause time correctly', () => {
        const state = {
          ...testData.timerStates.paused,
          pauseTimeUsed: 120,
          lastPauseTime: Date.now() - 30000 // 30 seconds ago
        };
        
        expect(calculateTotalPauseTime(state)).toBe(150); // 120 + 30 seconds
      });

      it('should handle running state', () => {
        const runningState = testData.timerStates.running;
        expect(calculateTotalPauseTime(runningState)).toBe(0);
      });

      it('should handle missing lastPauseTime', () => {
        const state = {
          ...testData.timerStates.paused,
          pauseTimeUsed: 120,
          lastPauseTime: undefined
        };
        
        expect(calculateTotalPauseTime(state)).toBe(120);
      });
    });
  });

  describe('Role-Based Access Functions', () => {
    describe('getRolePermissions', () => {
      it('should return correct permissions for each role', () => {
        const adminPerms = getRolePermissions(UserRole.ADMIN);
        expect(adminPerms).toEqual({
          canUseTimer: true,
          canOverride: true,
          canViewAllTimers: true,
          canAccessAssignedOnly: false
        });

        const freelancerPerms = getRolePermissions(UserRole.FREELANCER);
        expect(freelancerPerms).toEqual({
          canUseTimer: true,
          canOverride: false,
          canViewAllTimers: false,
          canAccessAssignedOnly: true
        });

        const clientPerms = getRolePermissions(UserRole.CLIENT);
        expect(clientPerms).toEqual({
          canUseTimer: false,
          canOverride: false,
          canViewAllTimers: false,
          canAccessAssignedOnly: false
        });
      });
    });

    describe('validateUserAccess', () => {
      it('should validate user access correctly', () => {
        const admin = testData.users.admin;
        const freelancer = testData.users.freelancer;
        const client = testData.users.client;
        const project = testData.projects.activeProject;
        const jobCard = testData.jobCards.assignedToFreelancer;

        vi.mocked(canFreelancerUseTimer).mockReturnValue(true);
        vi.mocked(canUserStartTimerOnJobCard).mockReturnValue(true);

        expect(validateUserAccess(admin, project, jobCard)).toBe(true);
        expect(validateUserAccess(freelancer, project, jobCard)).toBe(true);
        expect(validateUserAccess(client, project, jobCard)).toBe(false);
      });

      it('should handle missing assignment', () => {
        const freelancer = testData.users.freelancer;
        const project = testData.projects.activeProject;
        const jobCard = testData.jobCards.unassigned;

        vi.mocked(canFreelancerUseTimer).mockReturnValue(true);
        vi.mocked(canUserStartTimerOnJobCard).mockReturnValue(false);

        expect(validateUserAccess(freelancer, project, jobCard)).toBe(false);
      });
    });

    describe('validateJobCardAccess', () => {
      it('should validate job card access', () => {
        const user = testData.users.freelancer;
        const project = testData.projects.activeProject;
        const jobCard = testData.jobCards.assignedToFreelancer;

        vi.mocked(canUserStartTimerOnJobCard).mockReturnValue(true);

        const result = validateJobCardAccess(user, project, jobCard);
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('access_granted');
      });

      it('should handle access denial with reason', () => {
        const user = testData.users.freelancer;
        const project = testData.projects.activeProject;
        const jobCard = testData.jobCards.unassigned;

        vi.mocked(canUserStartTimerOnJobCard).mockReturnValue(false);

        const result = validateJobCardAccess(user, project, jobCard);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('not_assigned');
      });
    });
  });

  describe('Status and Color Functions', () => {
    describe('getTimerStatusColor', () => {
      it('should return correct colors for timer status', () => {
        expect(getTimerStatusColor('running')).toBe('bg-green-600');
        expect(getTimerStatusColor('paused')).toBe('bg-yellow-600');
        expect(getTimerStatusColor('exceeded')).toBe('bg-red-600');
        expect(getTimerStatusColor('stopped')).toBe('bg-gray-600');
        expect(getTimerStatusColor('idle')).toBe('bg-gray-400');
        expect(getTimerStatusColor('completed')).toBe('bg-blue-600');
      });

      it('should handle unknown status', () => {
        expect(getTimerStatusColor('unknown' as any)).toBe('bg-gray-400');
      });
    });
  });

  describe('Data Sanitization Functions', () => {
    describe('sanitizeTimerData', () => {
      it('should sanitize timer data for Firebase', () => {
        const dirtyData = {
          status: 'running',
          timeRemaining: 1800,
          totalTime: 3600,
          pauseCount: 2,
          pauseTimeUsed: 120,
          jobCardId: 'job-123',
          jobCardTitle: 'Test Task',
          projectId: 'project-456',
          undefinedField: undefined,
          nullField: null,
          invalidNumber: NaN
        };

        const sanitized = sanitizeTimerData(dirtyData);
        
        expect(sanitized).toEqual({
          status: 'running',
          timeRemaining: 1800,
          totalTime: 3600,
          pauseCount: 2,
          pauseTimeUsed: 120,
          jobCardId: 'job-123',
          jobCardTitle: 'Test Task',
          projectId: 'project-456',
          invalidNumber: 0 // NaN converted to 0
        });

        expect(sanitized).not.toHaveProperty('undefinedField');
        expect(sanitized).not.toHaveProperty('nullField');
      });
    });

    describe('sanitizeFirestoreData', () => {
      it('should remove undefined and null values', () => {
        const data = {
          validString: 'test',
          validNumber: 42,
          validBoolean: true,
          undefinedValue: undefined,
          nullValue: null,
          validArray: [1, 2, 3],
          emptyString: '',
          zeroNumber: 0
        };

        const sanitized = sanitizeFirestoreData(data);
        
        expect(sanitized).toEqual({
          validString: 'test',
          validNumber: 42,
          validBoolean: true,
          validArray: [1, 2, 3],
          emptyString: '',
          zeroNumber: 0
        });
      });

      it('should handle nested objects', () => {
        const data = {
          nested: {
            valid: 'value',
            invalid: undefined,
            deeper: {
              valid: 123,
              invalid: null
            }
          },
          valid: 'top-level'
        };

        const sanitized = sanitizeFirestoreData(data);
        
        expect(sanitized).toEqual({
          nested: {
            valid: 'value',
            deeper: {
              valid: 123
            }
          },
          valid: 'top-level'
        });
      });
    });
  });

  describe('Utility Helper Functions', () => {
    describe('createIdempotencyKey', () => {
      it('should create unique idempotency keys', () => {
        const key1 = createIdempotencyKey('user-123', 'start_timer');
        const key2 = createIdempotencyKey('user-123', 'start_timer');
        const key3 = createIdempotencyKey('user-456', 'start_timer');
        
        expect(key1).toMatch(/^user-123-start_timer-\d+$/);
        expect(key2).toMatch(/^user-123-start_timer-\d+$/);
        expect(key3).toMatch(/^user-456-start_timer-\d+$/);
        expect(key1).not.toBe(key2); // Should be unique
      });

      it('should handle special characters in input', () => {
        const key = createIdempotencyKey('user@test.com', 'pause_timer');
        expect(key).toMatch(/^user@test\.com-pause_timer-\d+$/);
      });
    });

    describe('parseTimeInput', () => {
      it('should parse various time input formats', () => {
        expect(parseTimeInput('01:30:00')).toBe(5400); // 1.5 hours in seconds
        expect(parseTimeInput('30:00')).toBe(1800); // 30 minutes
        expect(parseTimeInput('45')).toBe(45); // 45 seconds
        expect(parseTimeInput('2.5')).toBe(9000); // 2.5 hours in seconds
      });

      it('should handle invalid input gracefully', () => {
        expect(parseTimeInput('invalid')).toBe(0);
        expect(parseTimeInput('')).toBe(0);
        expect(parseTimeInput('99:99:99')).toBe(0);
      });

      it('should handle edge cases', () => {
        expect(parseTimeInput('0')).toBe(0);
        expect(parseTimeInput('00:00:00')).toBe(0);
        expect(parseTimeInput('24:00:00')).toBe(86400); // 24 hours
      });
    });
  });
});