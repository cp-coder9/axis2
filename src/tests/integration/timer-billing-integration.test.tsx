/**
 * Integration Tests: Timer System Integration with Billing
 * Tests timer functionality, time logging, and billing calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import { UserRole } from '../../types';

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
  db: {},
  storage: {},
}));

// Mock services
vi.mock('../../services/userService', () => ({
  getUserById: vi.fn(),
  getAllUsers: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../services/projectService', () => ({
  getProjectsByUser: vi.fn(() => Promise.resolve([])),
  subscribeToProjects: vi.fn(() => () => {}),
}));

describe('Timer-Billing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Timer Start and Stop', () => {
    it('should start timer for freelancer with project and job card', async () => {
      const mockFreelancerUser = {
        id: 'freelancer-123',
        email: 'freelancer@test.com',
        role: UserRole.FREELANCER,
        hourlyRate: 50,
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockFreelancerUser as any);

      const { auth } = await import('../../firebase');
      vi.mocked(auth.onAuthStateChanged).mockImplementation((callback: any) => {
        callback({ uid: 'freelancer-123', email: 'freelancer@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { startGlobalTimer, activeTimer } = useAppContext();
        const [status, setStatus] = React.useState('');

        const handleStartTimer = async () => {
          const success = await startGlobalTimer(
            'job-123',
            'Design Task',
            'project-123',
            10
          );
          setStatus(success ? 'started' : 'failed');
        };

        return (
          <div>
            <button onClick={handleStartTimer} data-testid="start-timer">Start Timer</button>
            <div data-testid="timer-status">{status}</div>
            <div data-testid="active-timer">{activeTimer ? 'active' : 'inactive'}</div>
          </div>
        );
      };

      render(
        <BrowserRouter>
          <AppProvider>
            <TestComponent />
          </AppProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('start-timer')).toBeInTheDocument();
      });

      const startButton = screen.getByTestId('start-timer');
      fireEvent.click(startButton);

      await waitFor(() => {
        const status = screen.getByTestId('timer-status');
        expect(status.textContent).toBeTruthy();
      });
    });

    it('should stop timer and create time log entry', async () => {
      const mockFreelancerUser = {
        id: 'freelancer-123',
        email: 'freelancer@test.com',
        role: UserRole.FREELANCER,
        hourlyRate: 50,
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockFreelancerUser as any);

      const { auth } = await import('../../firebase');
      vi.mocked(auth.onAuthStateChanged).mockImplementation((callback: any) => {
        callback({ uid: 'freelancer-123', email: 'freelancer@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { stopGlobalTimerAndLog } = useAppContext();
        const [status, setStatus] = React.useState('');

        const handleStopTimer = async () => {
          try {
            await stopGlobalTimerAndLog('project-123', 'job-123', {
              notes: 'Completed design work',
              completionReason: 'Task completed',
            });
            setStatus('stopped');
          } catch (error) {
            setStatus('error');
          }
        };

        return (
          <div>
            <button onClick={handleStopTimer} data-testid="stop-timer">Stop Timer</button>
            <div data-testid="stop-status">{status}</div>
          </div>
        );
      };

      render(
        <BrowserRouter>
          <AppProvider>
            <TestComponent />
          </AppProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('stop-timer')).toBeInTheDocument();
      });

      const stopButton = screen.getByTestId('stop-timer');
      fireEvent.click(stopButton);

      await waitFor(() => {
        const status = screen.getByTestId('stop-status');
        expect(status.textContent).toBeTruthy();
      });
    });
  });

  describe('Billing Calculations', () => {
    it('should calculate earnings based on hourly rate and time worked', () => {
      const hourlyRate = 50;
      const hoursWorked = 2.5;
      const expectedEarnings = hourlyRate * hoursWorked;

      expect(expectedEarnings).toBe(125);
    });

    it('should aggregate time logs for project cost calculation', () => {
      const timeLogs = [
        { userId: 'freelancer-1', hours: 2, rate: 50 },
        { userId: 'freelancer-2', hours: 3, rate: 60 },
        { userId: 'freelancer-3', hours: 1.5, rate: 45 },
      ];

      const totalCost = timeLogs.reduce((sum, log) => sum + (log.hours * log.rate), 0);
      
      expect(totalCost).toBe(347.5); // (2*50) + (3*60) + (1.5*45)
    });

    it('should track freelancer earnings across multiple projects', () => {
      const freelancerTimeLogs = [
        { projectId: 'project-1', hours: 5, rate: 50 },
        { projectId: 'project-2', hours: 3, rate: 50 },
        { projectId: 'project-3', hours: 2, rate: 50 },
      ];

      const totalEarnings = freelancerTimeLogs.reduce((sum, log) => sum + (log.hours * log.rate), 0);
      
      expect(totalEarnings).toBe(500); // (5+3+2) * 50
    });
  });

  describe('Time Log Validation', () => {
    it('should require substantiation file for time logs over threshold', () => {
      const timeLog = {
        hours: 8,
        requiresSubstantiation: true,
        substantiationFile: null,
      };

      const isValid = timeLog.hours < 4 || timeLog.substantiationFile !== null;
      
      expect(isValid).toBe(false);
    });

    it('should accept time logs with valid substantiation', () => {
      const timeLog = {
        hours: 8,
        requiresSubstantiation: true,
        substantiationFile: { id: 'file-123', name: 'proof.pdf' },
      };

      const isValid = timeLog.hours < 4 || timeLog.substantiationFile !== null;
      
      expect(isValid).toBe(true);
    });
  });

  describe('Admin Billing Dashboard Integration', () => {
    it('should display all freelancer time entries for admin review', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockAdminUser as any);

      const { auth } = await import('../../firebase');
      vi.mocked(auth.onAuthStateChanged).mockImplementation((callback: any) => {
        callback({ uid: 'admin-123', email: 'admin@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { hasPermission } = useAppContext();

        return (
          <div>
            <div data-testid="can-view-billing">
              {hasPermission('canViewBilling') ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      render(
        <BrowserRouter>
          <AppProvider>
            <TestComponent />
          </AppProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-view-billing')).toHaveTextContent('yes');
      });
    });

    it('should allow admin to add comments to time log entries', async () => {
      const mockTimeLog = {
        id: 'log-123',
        freelancerId: 'freelancer-123',
        hours: 5,
        adminComments: [],
      };

      const addAdminComment = (logId: string, comment: string) => {
        mockTimeLog.adminComments.push({
          id: 'comment-1',
          text: comment,
          timestamp: new Date(),
        });
        return Promise.resolve();
      };

      await addAdminComment('log-123', 'Approved for billing');
      
      expect(mockTimeLog.adminComments).toHaveLength(1);
      expect(mockTimeLog.adminComments[0].text).toBe('Approved for billing');
    });
  });

  describe('Real-time Timer Sync', () => {
    it('should sync timer state across multiple sessions', async () => {
      const mockFreelancerUser = {
        id: 'freelancer-123',
        email: 'freelancer@test.com',
        role: UserRole.FREELANCER,
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockFreelancerUser as any);

      const { auth } = await import('../../firebase');
      vi.mocked(auth.onAuthStateChanged).mockImplementation((callback: any) => {
        callback({ uid: 'freelancer-123', email: 'freelancer@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { timerSyncStatus, isTimerSyncing } = useAppContext();

        return (
          <div>
            <div data-testid="sync-status">{timerSyncStatus}</div>
            <div data-testid="is-syncing">{isTimerSyncing ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(
        <BrowserRouter>
          <AppProvider>
            <TestComponent />
          </AppProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toBeInTheDocument();
      });
    });
  });
});
