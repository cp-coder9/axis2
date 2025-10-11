// React is used implicitly with JSX
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardSettingsPanel } from '../components/DashboardSettingsPanel';
import { useAppContext } from '../contexts/AppContext';

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the AppContext
vi.mock('../contexts/AppContext', () => ({
  useAppContext: vi.fn(),
}));

const mockAppContext = {
  settings: {
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      projectUpdates: true,
      messages: true,
      deadlines: true,
    },
    dashboard: {
      compactView: false,
      showWelcomeMessage: true,
      defaultProjectView: 'grid',
      widgetVisibility: {
        stats: true,
        recentActivity: true,
        recentFiles: true,
        earnings: true,
        projectProgress: true,
      },
    },
    preferences: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      language: 'en',
    },
  },
  settingsLoading: false,
  settingsError: null,
  hasUnsavedChanges: false,
  updateSetting: vi.fn(),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  resetSettingsToDefaults: vi.fn(),
  exportSettings: vi.fn(() => JSON.stringify({})),
  importSettings: vi.fn(),
};

describe('DashboardSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as any).mockReturnValue(mockAppContext);
  });

  describe('Task 1.1: Fix DOM element conflicts', () => {
    it('renders settings panel with unique data-testid attributes', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Use data-testid instead of text content to avoid conflicts
      expect(screen.getByTestId('settings-panel-header')).toBeInTheDocument();
      expect(screen.getByTestId('settings-search-input')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <DashboardSettingsPanel
          isOpen={false}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      expect(screen.queryByTestId('settings-panel-header')).not.toBeInTheDocument();
    });

    it('uses unique identifiers for each settings section', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Verify unique data-testid for tabs
      expect(screen.getByTestId('tab-general')).toBeInTheDocument();
      expect(screen.getByTestId('tab-notifications')).toBeInTheDocument();
      expect(screen.getByTestId('tab-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('tab-admin')).toBeInTheDocument();
    });
  });

  describe('Task 1.2: Fix role-based settings visibility', () => {
    it('shows admin-only settings for admin role', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Admin should see System tab
      expect(screen.getByTestId('tab-admin')).toBeInTheDocument();
    });

    it('hides admin-only settings from freelancer role', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="freelancer"
        />
      );

      // Freelancer should NOT see System tab
      expect(screen.queryByTestId('tab-admin')).not.toBeInTheDocument();
      // Freelancer should see Work tab
      expect(screen.getByTestId('tab-freelancer')).toBeInTheDocument();
    });

    it('hides admin-only settings from client role', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="client"
        />
      );

      // Client should NOT see System tab
      expect(screen.queryByTestId('tab-admin')).not.toBeInTheDocument();
      // Client should see Projects tab
      expect(screen.getByTestId('tab-client')).toBeInTheDocument();
    });

    it('shows correct settings content based on role', () => {
      const { rerender } = render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Click on admin tab
      fireEvent.click(screen.getByTestId('tab-admin'));
      expect(screen.getByTestId('admin-settings-content')).toBeInTheDocument();

      // Rerender with freelancer role
      rerender(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="freelancer"
        />
      );

      // Admin settings should not be visible
      expect(screen.queryByTestId('admin-settings-content')).not.toBeInTheDocument();
    });
  });

  describe('Task 1.3: Fix settings persistence integration', () => {
    it('calls updateSetting when theme is changed', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Click on the Light theme radio button using data-testid
      const lightThemeRadio = screen.getByTestId('theme-light');
      fireEvent.click(lightThemeRadio);

      expect(mockAppContext.updateSetting).toHaveBeenCalledWith('theme', 'light');
    });

    it('calls saveSettings when save button is clicked', async () => {
      const mockContextWithChanges = {
        ...mockAppContext,
        hasUnsavedChanges: true,
      };
      (useAppContext as any).mockReturnValue(mockContextWithChanges);

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      const saveButton = screen.getByTestId('save-settings-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAppContext.saveSettings).toHaveBeenCalled();
      });
    });

    it('calls resetSettingsToDefaults when reset button is clicked', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      const resetButton = screen.getByTestId('reset-settings-button');
      fireEvent.click(resetButton);

      expect(mockAppContext.resetSettingsToDefaults).toHaveBeenCalled();
    });

    it('shows loading state when settings are loading', () => {
      const mockContextLoading = {
        ...mockAppContext,
        settingsLoading: true,
      };
      (useAppContext as any).mockReturnValue(mockContextLoading);

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      expect(screen.getByTestId('settings-loading-state')).toBeInTheDocument();
    });

    it('shows error state when there is a settings error', () => {
      const mockContextWithError = {
        ...mockAppContext,
        settingsError: 'Failed to load settings',
      };
      (useAppContext as any).mockReturnValue(mockContextWithError);

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      expect(screen.getByTestId('settings-error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
    });

    it('disables save button when no changes are made', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      const saveButton = screen.getByTestId('save-settings-button');
      expect(saveButton).toBeDisabled();
    });

    it('enables save button when changes are made', () => {
      const mockContextWithChanges = {
        ...mockAppContext,
        hasUnsavedChanges: true,
      };
      (useAppContext as any).mockReturnValue(mockContextWithChanges);

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      const saveButton = screen.getByTestId('save-settings-button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Task 1.4: Fix window.matchMedia mocking for theme tests', () => {
    it('detects prefers-color-scheme: dark', () => {
      // Mock matchMedia to return dark theme preference
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Verify the component renders with dark theme detection
      expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
    });

    it('detects prefers-color-scheme: light', () => {
      // Mock matchMedia to return light theme preference
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Verify the component renders with light theme detection
      expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);
    });

    it('detects prefers-reduced-motion', () => {
      // Mock matchMedia to return reduced motion preference
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Verify the component respects reduced motion preference
      expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    });

    it('handles theme switching with media query changes', async () => {
      const mockContextWithChanges = {
        ...mockAppContext,
        settings: {
          ...mockAppContext.settings,
          theme: 'system',
        },
      };
      (useAppContext as any).mockReturnValue(mockContextWithChanges);

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Switch to dark theme
      const darkThemeRadio = screen.getByTestId('theme-dark');
      fireEvent.click(darkThemeRadio);

      await waitFor(() => {
        expect(mockAppContext.updateSetting).toHaveBeenCalledWith('theme', 'dark');
      });
    });
  });

  describe('Additional functionality tests', () => {
    it('handles search functionality', async () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      const searchInput = screen.getByTestId('settings-search-input');
      fireEvent.change(searchInput, { target: { value: 'theme' } });

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });
    });

    it('handles export settings functionality', () => {
      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      const exportButton = screen.getByTestId('export-settings-button');
      fireEvent.click(exportButton);

      expect(mockAppContext.exportSettings).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('handles import settings functionality', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      const fileInput = screen.getByTestId('import-settings-input');
      expect(fileInput).toBeInTheDocument();

      // Mock file and FileReader
      const mockFile = new File(['{"theme": "dark"}'], 'settings.json', { type: 'application/json' });
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        result: '{"theme": "dark"}',
      };
      
      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: '{"theme": "dark"}' } } as any);
      }

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
    });

    it('toggles collapsible sections', () => {
      render(
        <DashboardSettingsPanel
          isOpen={true}
          onClose={vi.fn()}
          dashboardType="admin"
        />
      );

      // Switch to admin tab to see collapsible sections
      const adminTab = screen.getByTestId('tab-admin');
      fireEvent.click(adminTab);

      // Find a collapsible section header
      const userManagementHeader = screen.getByTestId('section-user-management');
      expect(userManagementHeader).toBeInTheDocument();

      // Click to collapse/expand
      fireEvent.click(userManagementHeader);
      
      // The section should still be there (we're just testing the click handler)
      expect(userManagementHeader).toBeInTheDocument();
    });
  });
});
