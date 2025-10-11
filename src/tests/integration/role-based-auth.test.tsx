/**
 * Integration Tests: Role-Based Authentication and Routing
 * Tests authentication flow, role detection, and role-based routing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import { UserRole } from '../../types';

// Mock Firebase Auth
vi.mock('../../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
}));

// Mock user service
vi.mock('../../services/userService', () => ({
  getUserById: vi.fn(),
  createUserFromFirebaseAuth: vi.fn(),
  updateUserLastActive: vi.fn(),
  userExists: vi.fn(),
  getAllUsers: vi.fn(() => Promise.resolve([])),
  getUsersByRole: vi.fn(() => Promise.resolve([])),
}));

// Mock project service
vi.mock('../../services/projectService', () => ({
  getAllProjects: vi.fn(() => Promise.resolve([])),
  getProjectsByUser: vi.fn(() => Promise.resolve([])),
  subscribeToProjects: vi.fn(() => () => {}),
  getProjectStatistics: vi.fn(() => Promise.resolve({})),
}));

describe('Role-Based Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should authenticate admin user and redirect to admin dashboard', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockAdminUser as any);

      const { auth } = await import('../../firebase');
      const mockAuthStateChanged = vi.mocked(auth.onAuthStateChanged);
      
      // Simulate successful authentication
      mockAuthStateChanged.mockImplementation((callback: any) => {
        callback({ uid: 'admin-123', email: 'admin@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { authState, getRoleBasedRedirectPath } = useAppContext();
        
        return (
          <div>
            <div data-testid="auth-status">{authState.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
            <div data-testid="user-role">{authState.userRole || 'none'}</div>
            <div data-testid="redirect-path">{getRoleBasedRedirectPath()}</div>
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
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent(UserRole.ADMIN);
      expect(screen.getByTestId('redirect-path')).toHaveTextContent('/admin/dashboard');
    });

    it('should authenticate freelancer user and redirect to freelancer dashboard', async () => {
      const mockFreelancerUser = {
        id: 'freelancer-123',
        email: 'freelancer@test.com',
        role: UserRole.FREELANCER,
        name: 'Freelancer User',
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockFreelancerUser as any);

      const { auth } = await import('../../firebase');
      const mockAuthStateChanged = vi.mocked(auth.onAuthStateChanged);
      
      mockAuthStateChanged.mockImplementation((callback: any) => {
        callback({ uid: 'freelancer-123', email: 'freelancer@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { authState, getRoleBasedRedirectPath } = useAppContext();
        
        return (
          <div>
            <div data-testid="user-role">{authState.userRole || 'none'}</div>
            <div data-testid="redirect-path">{getRoleBasedRedirectPath()}</div>
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
        expect(screen.getByTestId('user-role')).toHaveTextContent(UserRole.FREELANCER);
      });

      expect(screen.getByTestId('redirect-path')).toHaveTextContent('/freelancer/dashboard');
    });

    it('should authenticate client user and redirect to client dashboard', async () => {
      const mockClientUser = {
        id: 'client-123',
        email: 'client@test.com',
        role: UserRole.CLIENT,
        name: 'Client User',
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockClientUser as any);

      const { auth } = await import('../../firebase');
      const mockAuthStateChanged = vi.mocked(auth.onAuthStateChanged);
      
      mockAuthStateChanged.mockImplementation((callback: any) => {
        callback({ uid: 'client-123', email: 'client@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { authState, getRoleBasedRedirectPath } = useAppContext();
        
        return (
          <div>
            <div data-testid="user-role">{authState.userRole || 'none'}</div>
            <div data-testid="redirect-path">{getRoleBasedRedirectPath()}</div>
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
        expect(screen.getByTestId('user-role')).toHaveTextContent(UserRole.CLIENT);
      });

      expect(screen.getByTestId('redirect-path')).toHaveTextContent('/client/dashboard');
    });
  });

  describe('Role-Based Permissions', () => {
    it('should grant admin full permissions', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
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
            <div data-testid="can-manage-users">{hasPermission('canManageUsers') ? 'yes' : 'no'}</div>
            <div data-testid="can-delete-projects">{hasPermission('canDeleteProjects') ? 'yes' : 'no'}</div>
            <div data-testid="can-view-analytics">{hasPermission('canViewAnalytics') ? 'yes' : 'no'}</div>
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
        expect(screen.getByTestId('can-manage-users')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('can-delete-projects')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-view-analytics')).toHaveTextContent('yes');
    });

    it('should restrict freelancer permissions appropriately', async () => {
      const mockFreelancerUser = {
        id: 'freelancer-123',
        email: 'freelancer@test.com',
        role: UserRole.FREELANCER,
        name: 'Freelancer User',
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
        const { hasPermission } = useAppContext();
        
        return (
          <div>
            <div data-testid="can-manage-users">{hasPermission('canManageUsers') ? 'yes' : 'no'}</div>
            <div data-testid="can-upload-files">{hasPermission('canUploadFiles') ? 'yes' : 'no'}</div>
            <div data-testid="can-delete-projects">{hasPermission('canDeleteProjects') ? 'yes' : 'no'}</div>
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
        expect(screen.getByTestId('can-manage-users')).toHaveTextContent('no');
      });

      expect(screen.getByTestId('can-upload-files')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-delete-projects')).toHaveTextContent('no');
    });

    it('should restrict client permissions appropriately', async () => {
      const mockClientUser = {
        id: 'client-123',
        email: 'client@test.com',
        role: UserRole.CLIENT,
        name: 'Client User',
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockClientUser as any);

      const { auth } = await import('../../firebase');
      vi.mocked(auth.onAuthStateChanged).mockImplementation((callback: any) => {
        callback({ uid: 'client-123', email: 'client@test.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { hasPermission } = useAppContext();
        
        return (
          <div>
            <div data-testid="can-manage-users">{hasPermission('canManageUsers') ? 'yes' : 'no'}</div>
            <div data-testid="can-view-billing">{hasPermission('canViewBilling') ? 'yes' : 'no'}</div>
            <div data-testid="can-modify-projects">{hasPermission('canModifyProjectSettings') ? 'yes' : 'no'}</div>
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
        expect(screen.getByTestId('can-manage-users')).toHaveTextContent('no');
      });

      expect(screen.getByTestId('can-view-billing')).toHaveTextContent('yes');
      expect(screen.getByTestId('can-modify-projects')).toHaveTextContent('no');
    });
  });

  describe('Route Access Control', () => {
    it('should allow admin to access admin routes', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
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
        const { canAccessRoute } = useAppContext();
        
        return (
          <div>
            <div data-testid="admin-access">{canAccessRoute('/admin/dashboard') ? 'yes' : 'no'}</div>
            <div data-testid="freelancer-access">{canAccessRoute('/freelancer/dashboard') ? 'yes' : 'no'}</div>
            <div data-testid="client-access">{canAccessRoute('/client/dashboard') ? 'yes' : 'no'}</div>
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
        expect(screen.getByTestId('admin-access')).toHaveTextContent('yes');
      });
    });

    it('should deny freelancer access to admin routes', async () => {
      const mockFreelancerUser = {
        id: 'freelancer-123',
        email: 'freelancer@test.com',
        role: UserRole.FREELANCER,
        name: 'Freelancer User',
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
        const { canAccessRoute } = useAppContext();
        
        return (
          <div>
            <div data-testid="admin-access">{canAccessRoute('/admin/dashboard') ? 'yes' : 'no'}</div>
            <div data-testid="freelancer-access">{canAccessRoute('/freelancer/dashboard') ? 'yes' : 'no'}</div>
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
        expect(screen.getByTestId('admin-access')).toHaveTextContent('no');
      });

      expect(screen.getByTestId('freelancer-access')).toHaveTextContent('yes');
    });
  });
});
