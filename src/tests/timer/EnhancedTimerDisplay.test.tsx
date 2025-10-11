import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedTimerDisplay } from '../../components/timer';
import { TestWrapper } from '../mockConfig';
import { 
  createMockTimerContext, 
  createMockAuthContext, 
  createMockProjectsContext 
} from '../__mocks__/contexts';
import { 
  mockTimerStates, 
  mockUsers 
} from '../fixtures/testData';

// Setup user event
const user = userEvent.setup();

describe('EnhancedTimerDisplay', () => {
  let mockTimerContext: ReturnType<typeof createMockTimerContext>;
  let mockAuthContext: ReturnType<typeof createMockAuthContext>;
  let mockProjectsContext: ReturnType<typeof createMockProjectsContext>;

  beforeEach(() => {
    mockTimerContext = createMockTimerContext();
    mockAuthContext = createMockAuthContext();
    mockProjectsContext = createMockProjectsContext();
    vi.clearAllMocks();
  });

  const renderWithContext = (props = {}) => {
    return render(
      <TestWrapper
        timerContext={mockTimerContext}
        authContext={mockAuthContext}
        projectsContext={mockProjectsContext}
      >
        <EnhancedTimerDisplay {...props} />
      </TestWrapper>
    );
  };

  describe('Role-Based Access Control', () => {
    it('should not render for CLIENT role', () => {
      mockAuthContext.user = mockUsers.client;
      
      const { container } = renderWithContext();
      
      expect(container.firstChild).toBeNull();
    });

    it('should render standard interface for FREELANCER role', () => {
      mockAuthContext.user = mockUsers.freelancer;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByRole('button', { name: /timer active/i })).toBeInTheDocument();
      expect(screen.getByText('Time Remaining')).toBeInTheDocument();
    });

    it('should render admin interface for ADMIN role', () => {
      mockAuthContext.user = mockUsers.admin;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByText('Admin View: Timer Active')).toBeInTheDocument();
      expect(screen.getByText('Override Controls Available')).toBeInTheDocument();
    });

    it('should handle inactive user with warnings', () => {
      mockAuthContext.user = mockUsers.inactive;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByText(/account status/i)).toBeInTheDocument();
    });
  });

  describe('Component Rendering Variations', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
    });

    it('should render in compact mode', () => {
      renderWithContext({ compact: true });
      
      const widget = screen.getByRole('button');
      expect(widget).toHaveClass('h-8', 'px-3', 'py-1');
      expect(screen.getByText('01:30:00')).toBeInTheDocument();
    });

    it('should render in full mode', () => {
      renderWithContext({ compact: false });
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('p-4');
      expect(screen.getByText('Time Remaining')).toBeInTheDocument();
      expect(screen.getByText('Job: Test Job Card')).toBeInTheDocument();
    });

    it('should render with floating position', () => {
      renderWithContext({ floating: true });
      
      const container = screen.getByRole('article').parentElement;
      expect(container).toHaveClass('fixed', 'top-20', 'right-4', 'z-50');
    });

    it('should render without floating position', () => {
      renderWithContext({ floating: false });
      
      const container = screen.getByRole('article').parentElement;
      expect(container).not.toHaveClass('fixed');
    });

    it('should show controls when enabled', () => {
      renderWithContext({ showControls: true });
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    it('should hide controls when disabled', () => {
      renderWithContext({ showControls: false });
      
      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
    });
  });

  describe('Timer States Display', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
    });

    it('should display running timer correctly', () => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByText('01:30:00')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('bg-green-600');
    });

    it('should display paused timer correctly', () => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.paused, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByText('Timer Paused')).toBeInTheDocument();
      expect(screen.getByText('Paused')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('bg-yellow-600');
    });

    it('should display exceeded timer correctly', () => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.exceeded, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByText('Time Exceeded')).toBeInTheDocument();
      expect(screen.getByText('Exceeded')).toBeInTheDocument();
      expect(screen.getByText('+05:00')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('bg-red-700');
    });

    it('should display overtime timer correctly', () => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.overtime, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByText('+15:30')).toBeInTheDocument();
      expect(screen.getByText('Overtime')).toBeInTheDocument();
    });

    it('should display idle state when no active timer', () => {
      mockTimerContext.activeTimers = {};
      mockTimerContext.currentTimerKey = null;
      
      renderWithContext();
      
      expect(screen.getByText('No Active Timer')).toBeInTheDocument();
      expect(screen.getByText('Idle')).toBeInTheDocument();
    });
  });

  describe('Assignment Validation', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
    });

    it('should enable controls when user can access timer', () => {
      mockAuthContext.canFreelancerUseTimer = vi.fn().mockReturnValue(true);
      mockProjectsContext.canUserStartTimerOnJobCard = vi.fn().mockReturnValue(true);
      
      renderWithContext({ showControls: true });
      
      expect(screen.getByRole('button', { name: /pause/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /stop/i })).not.toBeDisabled();
    });

    it('should disable controls when user cannot use timer', () => {
      mockAuthContext.canFreelancerUseTimer = vi.fn().mockReturnValue(false);
      
      renderWithContext({ showControls: true });
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /stop/i })).toBeDisabled();
    });

    it('should disable controls when user cannot access job card', () => {
      mockAuthContext.canFreelancerUseTimer = vi.fn().mockReturnValue(true);
      mockProjectsContext.canUserStartTimerOnJobCard = vi.fn().mockReturnValue(false);
      
      renderWithContext({ showControls: true });
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /stop/i })).toBeDisabled();
    });

    it('should show assignment warning tooltip', async () => {
      mockAuthContext.canFreelancerUseTimer = vi.fn().mockReturnValue(true);
      mockProjectsContext.canUserStartTimerOnJobCard = vi.fn().mockReturnValue(false);
      
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.hover(pauseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/not assigned to this task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Timer Control Interactions', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
      mockAuthContext.canFreelancerUseTimer = vi.fn().mockReturnValue(true);
      mockProjectsContext.canUserStartTimerOnJobCard = vi.fn().mockReturnValue(true);
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
    });

    it('should handle pause button click', async () => {
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);
      
      expect(mockTimerContext.pauseGlobalTimer).toHaveBeenCalledTimes(1);
    });

    it('should handle stop button click', async () => {
      renderWithContext({ showControls: true });
      
      const stopButton = screen.getByRole('button', { name: /stop/i });
      await user.click(stopButton);
      
      expect(mockTimerContext.stopGlobalTimer).toHaveBeenCalledTimes(1);
    });

    it('should handle main widget click to expand', async () => {
      renderWithContext({ compact: true });
      
      const widget = screen.getByRole('button');
      await user.click(widget);
      
      // Should trigger expand/navigation action
      expect(widget).toHaveBeenLastCalledWith();
    });

    it('should handle keyboard navigation', async () => {
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      pauseButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockTimerContext.pauseGlobalTimer).toHaveBeenCalledTimes(1);
      
      const stopButton = screen.getByRole('button', { name: /stop/i });
      stopButton.focus();
      
      await user.keyboard(' ');
      expect(mockTimerContext.stopGlobalTimer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tooltip Content', () => {
    beforeEach(() => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
    });

    it('should show freelancer tooltip content', async () => {
      mockAuthContext.user = mockUsers.freelancer;
      
      renderWithContext();
      
      const widget = screen.getByRole('button');
      await user.hover(widget);
      
      await waitFor(() => {
        expect(screen.getByText(/click to expand timer controls/i)).toBeInTheDocument();
      });
    });

    it('should show admin tooltip content', async () => {
      mockAuthContext.user = mockUsers.admin;
      
      renderWithContext();
      
      const widget = screen.getByRole('button');
      await user.hover(widget);
      
      await waitFor(() => {
        expect(screen.getByText(/admin view - override controls available/i)).toBeInTheDocument();
      });
    });

    it('should show paused timer tooltip', async () => {
      mockAuthContext.user = mockUsers.freelancer;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.paused, jobCardId: 'job1' }
      };
      
      renderWithContext();
      
      const widget = screen.getByRole('button');
      await user.hover(widget);
      
      await waitFor(() => {
        expect(screen.getByText(/timer is paused/i)).toBeInTheDocument();
      });
    });

    it('should show exceeded timer tooltip', async () => {
      mockAuthContext.user = mockUsers.freelancer;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.exceeded, jobCardId: 'job1' }
      };
      
      renderWithContext();
      
      const widget = screen.getByRole('button');
      await user.hover(widget);
      
      await waitFor(() => {
        expect(screen.getByText(/time allocation exceeded/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsive Behavior', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
    });

    it('should apply mobile-specific classes in compact mode', () => {
      renderWithContext({ compact: true });
      
      const widget = screen.getByRole('button');
      expect(widget).toHaveClass('text-xs', 'sm:text-sm');
    });

    it('should apply responsive padding in full mode', () => {
      renderWithContext({ compact: false });
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('p-4', 'sm:p-6');
    });

    it('should hide secondary text on mobile in compact mode', () => {
      renderWithContext({ compact: true });
      
      const jobText = screen.getByText('Test Job Card');
      expect(jobText).toHaveClass('hidden', 'sm:inline');
    });

    it('should adjust button sizes for touch interfaces', () => {
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      expect(pauseButton).toHaveClass('h-8', 'min-w-[2rem]');
    });

    it('should handle floating position on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithContext({ floating: true });
      
      const container = screen.getByRole('article').parentElement;
      expect(container).toHaveClass('right-2', 'sm:right-4');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
    });

    it('should handle missing timer data gracefully', () => {
      mockTimerContext.activeTimers = {};
      mockTimerContext.currentTimerKey = 'nonexistent';
      
      renderWithContext();
      
      expect(screen.getByText('No Active Timer')).toBeInTheDocument();
    });

    it('should handle timer operation errors', async () => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      mockTimerContext.pauseGlobalTimer = vi.fn().mockRejectedValue(new Error('Network error'));
      
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);
      
      // Should handle error gracefully without crashing
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should handle loading states', () => {
      mockTimerContext.loading = true;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext({ showControls: true });
      
      const controls = screen.getAllByRole('button');
      controls.forEach(button => {
        if (button.getAttribute('aria-label')?.includes('pause') || 
            button.getAttribute('aria-label')?.includes('stop')) {
          expect(button).toBeDisabled();
        }
      });
    });

    it('should handle offline states', () => {
      mockTimerContext.connectionStatus = 'offline';
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
    });

    it('should have proper ARIA labels', () => {
      renderWithContext({ showControls: true });
      
      expect(screen.getByRole('button', { name: /timer display/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop timer/i })).toBeInTheDocument();
    });

    it('should have live region for status updates', () => {
      renderWithContext();
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent('Timer running: 1 hour 30 minutes remaining');
    });

    it('should have proper focus management', async () => {
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      const stopButton = screen.getByRole('button', { name: /stop/i });
      
      await user.tab();
      expect(pauseButton).toHaveFocus();
      
      await user.tab();
      expect(stopButton).toHaveFocus();
    });

    it('should support keyboard navigation', async () => {
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      pauseButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockTimerContext.pauseGlobalTimer).toHaveBeenCalledTimes(1);
    });

    it('should have proper contrast for status indicators', () => {
      renderWithContext();
      
      const statusBadge = screen.getByText('Running');
      expect(statusBadge).toHaveClass('bg-green-600', 'text-white');
    });
  });

  describe('Business Logic Integration', () => {
    beforeEach(() => {
      mockAuthContext.user = mockUsers.freelancer;
    });

    it('should call RBAC functions correctly', () => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext();
      
      expect(mockAuthContext.canFreelancerUseTimer).toHaveBeenCalledWith(mockUsers.freelancer);
      expect(mockProjectsContext.canUserStartTimerOnJobCard).toHaveBeenCalledWith(
        expect.any(Object), // project
        'job1',
        mockUsers.freelancer
      );
    });

    it('should handle admin override scenarios', () => {
      mockAuthContext.user = mockUsers.admin;
      mockAuthContext.canFreelancerUseTimer = vi.fn().mockReturnValue(false);
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext({ showControls: true });
      
      // Admin should always have access regardless of assignment
      expect(screen.getByRole('button', { name: /pause/i })).not.toBeDisabled();
    });

    it('should integrate with timer context operations', async () => {
      mockTimerContext.activeTimers = {
        'timer1': { ...mockTimerStates.running, jobCardId: 'job1' }
      };
      mockTimerContext.currentTimerKey = 'timer1';
      
      renderWithContext({ showControls: true });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);
      
      expect(mockTimerContext.pauseGlobalTimer).toHaveBeenCalledWith();
      
      const stopButton = screen.getByRole('button', { name: /stop/i });
      await user.click(stopButton);
      
      expect(mockTimerContext.stopGlobalTimer).toHaveBeenCalledWith();
    });
  });
});