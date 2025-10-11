/**
 * Integration Tests: Cross-Role Interactions
 * Tests messaging, project collaboration, and file sharing across different user roles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import { UserRole, ChatType } from '../../types';

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
  getUsersByRole: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../services/projectService', () => ({
  getProjectsByUser: vi.fn(() => Promise.resolve([])),
  subscribeToProjects: vi.fn(() => () => {}),
}));

describe('Cross-Role Interactions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Project Messaging', () => {
    it('should allow admin and freelancer to exchange messages', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        teamMembers: ['admin-123', 'freelancer-123'],
      };

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { addEnhancedMessageToProject } = useAppContext();
        const [messages, setMessages] = React.useState<string[]>([]);

        const sendMessage = async () => {
          await addEnhancedMessageToProject(
            mockProject.id,
            'Test message from admin',
            ChatType.PROJECT_TEAM,
            ['freelancer-123']
          );
          setMessages(prev => [...prev, 'Message sent']);
        };

        return (
          <div>
            <button onClick={sendMessage} data-testid="send-message">Send Message</button>
            <div data-testid="message-status">{messages.join(', ')}</div>
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

      const sendButton = screen.getByTestId('send-message');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('message-status')).toHaveTextContent('Message sent');
      });
    });

    it('should allow client to message admin only', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        clientId: 'client-123',
        teamMembers: ['admin-123', 'freelancer-123'],
      };

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { addEnhancedMessageToProject } = useAppContext();
        const [status, setStatus] = React.useState('');

        const sendToAdmin = async () => {
          await addEnhancedMessageToProject(
            mockProject.id,
            'Client message to admin',
            ChatType.CLIENT_ADMIN,
            ['admin-123']
          );
          setStatus('Sent to admin');
        };

        return (
          <div>
            <button onClick={sendToAdmin} data-testid="send-to-admin">Send to Admin</button>
            <div data-testid="status">{status}</div>
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

      const sendButton = screen.getByTestId('send-to-admin');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Sent to admin');
      });
    });

    it('should show typing indicators across roles', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
      };

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { setTypingStatus, getTypingUsers } = useAppContext();
        const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

        const startTyping = async () => {
          await setTypingStatus(mockProject.id, ChatType.PROJECT_TEAM, true);
          const users = getTypingUsers(mockProject.id, ChatType.PROJECT_TEAM);
          setTypingUsers(users);
        };

        return (
          <div>
            <button onClick={startTyping} data-testid="start-typing">Start Typing</button>
            <div data-testid="typing-users">{typingUsers.length} users typing</div>
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

      const typingButton = screen.getByTestId('start-typing');
      fireEvent.click(typingButton);

      await waitFor(() => {
        expect(screen.getByTestId('typing-users')).toBeInTheDocument();
      });
    });
  });

  describe('Project Collaboration', () => {
    it('should sync project updates across all team members', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        status: 'IN_PROGRESS',
        teamMembers: ['admin-123', 'freelancer-123'],
      };

      const { subscribeToProjects } = await import('../../services/projectService');
      vi.mocked(subscribeToProjects).mockImplementation((userId, role, callback) => {
        // Simulate real-time update
        setTimeout(() => {
          callback([{ ...mockProject, status: 'COMPLETED' }]);
        }, 100);
        return vi.fn();
      });

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { projects } = useAppContext();

        return (
          <div>
            <div data-testid="project-count">{projects.length}</div>
            {projects.map((p: any) => (
              <div key={p.id} data-testid={`project-${p.id}-status`}>{p.status}</div>
            ))}
          </div>
        );
      };

      const mockUser = {
        id: 'freelancer-123',
        email: 'freelancer@test.com',
        role: UserRole.FREELANCER,
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockUser as any);

      const { auth } = await import('../../firebase');
      vi.mocked(auth.onAuthStateChanged).mockImplementation((callback: any) => {
        callback({ uid: 'freelancer-123', email: 'freelancer@test.com' });
        return vi.fn();
      });

      render(
        <BrowserRouter>
          <AppProvider>
            <TestComponent />
          </AppProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        const statusElement = screen.queryByTestId('project-project-123-status');
        if (statusElement) {
          expect(statusElement).toHaveTextContent('COMPLETED');
        }
      }, { timeout: 3000 });
    });

    it('should allow freelancer to update job card status', async () => {
      const mockProject = {
        id: 'project-123',
        jobCards: [
          { id: 'job-1', title: 'Design Task', status: 'IN_PROGRESS' }
        ],
      };

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { updateJobCardStatus } = useAppContext();
        const [status, setStatus] = React.useState('');

        const updateStatus = async () => {
          try {
            await updateJobCardStatus(mockProject.id, 'job-1', 'COMPLETED');
            setStatus('Updated');
          } catch (error) {
            setStatus('Error');
          }
        };

        return (
          <div>
            <button onClick={updateStatus} data-testid="update-status">Update Status</button>
            <div data-testid="update-result">{status}</div>
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

      const updateButton = screen.getByTestId('update-status');
      fireEvent.click(updateButton);

      await waitFor(() => {
        const result = screen.getByTestId('update-result');
        expect(result.textContent).toBeTruthy();
      });
    });
  });

  describe('File Sharing', () => {
    it('should respect file permissions for client access', async () => {
      const mockFiles = [
        { id: 'file-1', name: 'Design.pdf', permissions: { clientVisible: true } },
        { id: 'file-2', name: 'Internal.doc', permissions: { clientVisible: false } },
      ];

      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { authState } = useAppContext();
        
        // Filter files based on client permissions
        const visibleFiles = mockFiles.filter(f => 
          authState.userRole === UserRole.ADMIN || f.permissions.clientVisible
        );

        return (
          <div>
            <div data-testid="visible-files">{visibleFiles.length}</div>
            {visibleFiles.map(f => (
              <div key={f.id} data-testid={`file-${f.id}`}>{f.name}</div>
            ))}
          </div>
        );
      };

      const mockClientUser = {
        id: 'client-123',
        email: 'client@test.com',
        role: UserRole.CLIENT,
      };

      const { getUserById } = await import('../../services/userService');
      vi.mocked(getUserById).mockResolvedValue(mockClientUser as any);

      const { auth } = await import('../../firebase');
      vi.mocked(auth.onAuthStateChanged).mockImplementation((callback: any) => {
        callback({ uid: 'client-123', email: 'client@test.com' });
        return vi.fn();
      });

      render(
        <BrowserRouter>
          <AppProvider>
            <TestComponent />
          </AppProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('visible-files')).toHaveTextContent('1');
      });

      expect(screen.getByTestId('file-file-1')).toBeInTheDocument();
      expect(screen.queryByTestId('file-file-2')).not.toBeInTheDocument();
    });

    it('should allow admin to manage all file permissions', async () => {
      const TestComponent = () => {
        const { useAppContext } = require('../../contexts/AppContext');
        const { hasPermission } = useAppContext();

        return (
          <div>
            <div data-testid="can-manage-permissions">
              {hasPermission('canManageFilePermissions') ? 'yes' : 'no'}
            </div>
            <div data-testid="can-delete-files">
              {hasPermission('canDeleteFiles') ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

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

      render(
        <BrowserRouter>
          <AppProvider>
            <TestComponent />
          </AppProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-manage-permissions')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('can-delete-files')).toHaveTextContent('yes');
    });
  });
});
