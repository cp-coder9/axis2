import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { User, Project, UserRole, UserCreationData, ActionItem, ProjectFile, TimeTrackingReport, ProjectStatus, JobCard, JobCardStatus, ActionItemCreationData, ProjectCreationData, ProjectRequest, ProjectRequestStatus } from '../types';
import { TimerSyncProvider, useTimerSync } from './modules/timerSync';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { PresenceStatus, TypingIndicator } from '../types/messaging';
import { 
  getUserById, 
  createUserFromFirebaseAuth, 
  updateUserLastActive,
  userExists,
  getAllUsers,
  getUsersByRole
} from '../services/userService';
import {
  getAllProjects,
  getProjectsByUser,
  subscribeToProjects,
} from '../services/projectService';
import {
  addActionItem,
  updateActionItem,
  deleteActionItem,
  subscribeToActionItems
} from '../services/actionItemService';
import {
    createClient,
    subscribeToClients
} from '../services/clientService';
import {
    createProjectRequest as createProjectRequestService,
    updateProjectRequest,
    subscribeToProjectRequests
} from '../services/projectRequestService';
import {
    subscribeToNotifications,
    markNotificationAsRead as markNotificationAsReadService,
    markAllNotificationsAsRead as markAllNotificationsAsReadService,
} from '../services/notificationService';
import {
    addFileToProject as addFileToProjectService,
    updateFilePermissions as updateFilePermissionsService,
    deleteFileFromProject as deleteFileFromProjectService,
} from '../services/fileService';
import {
    addManualTimeLog as addManualTimeLogService,
    addAdminCommentToTimeLog as addAdminCommentToTimeLogService,
    generateTimeTrackingReport as generateTimeTrackingReportService,
} from '../services/timeTrackingService';
import {
    applyToProject as applyToProjectService,
    getProjectApplications as getProjectApplicationsService,
    acceptApplication as acceptApplicationService,
    rejectApplication as rejectApplicationService,
} from '../services/applicationService';
import {
    updateProjectTeam as updateProjectTeamService
} from '../services/teamService';
import {
    loadAuditModule as loadAuditModuleService
} from '../services/auditService';
import {
  getProjectStatistics
} from '../services/projectService';
import {
    generateProjectCostReport as generateProjectCostReportService,
    generateFreelancerPerformanceReport as generateFreelancerPerformanceReportService,
    exportToCSV as exportToCSVService,
    exportToPDF as exportToPDFService,
} from '../services/reportService';
import { MessagingService } from '../services/messaging/MessagingService';

// Role-based permissions interface
export interface RolePermissions {
  canViewBilling: boolean;
  canManageUsers: boolean;
  canAccessAllProjects: boolean;
  canModifyProjectSettings: boolean;
  canDeleteProjects: boolean;
  canCreateProjects: boolean;
  canManageTeam: boolean;
  canViewAnalytics: boolean;
  canAccessAdminSettings: boolean;
  canUploadFiles: boolean;
  canDeleteFiles: boolean;
  canViewAllFiles: boolean;
  canManageFilePermissions: boolean;
}

// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  userRole: UserRole | null;
  permissions: RolePermissions;
  loading: boolean;
  error: string | null;
}

// AppContext interface for shadcn migration with enhanced authentication
export interface AppContextType {
  // Authentication state
  authState: AuthState;
  
  // User state
  user: User | null;
  currentUser: User | null; // Alias for user for compatibility
  users: User[];
  userRole: UserRole | null;
  permissions: RolePermissions;
  
  // Project state
  projects: Project[];
  actionItems: ActionItem[];
  
  // Authentication methods
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  createUser: (userData: UserCreationData) => Promise<void>;
  
  // User management methods
  deleteUser?: (userId: string) => Promise<void>;
  updateUser?: () => Promise<void>;
  updateUserProfile?: () => Promise<void>;
  
  // Role and permission methods
  hasPermission: (permission: keyof RolePermissions) => boolean;
  canAccessRoute: (route: string) => boolean;
  getRoleBasedRedirectPath: () => string;
  
  // Timer methods (integrated with TimerSyncContext)
  startGlobalTimer: (jobCardId: string, jobCardTitle: string, projectId: string, allocatedHours: number) => Promise<boolean>;
  stopGlobalTimerAndLog: (projectId: string, jobCardId: string, data: any) => Promise<void>;
  
  // Timer sync state (exposed from TimerSyncContext)
  activeTimer: any;
  activeTimers: any; // Collection of active timers
  currentTimerKey: string | null; // Current active timer key
  isTimerSyncing: boolean;
  timerSyncStatus: 'connected' | 'disconnected' | 'syncing' | 'error';
  
  // Timer control methods
  pauseGlobalTimer: (timerKey: string) => Promise<void>;
  resumeGlobalTimer: (timerKey: string) => Promise<void>;
  
  // Real-time chat and presence (integrated with useRealtimeChat)
  isRealtimeConnected: boolean;
  userPresence: PresenceStatus;
  updatePresence: (status: PresenceStatus) => void;
  getUserPresence: (userId: string) => any;
  getAllPresences: () => any[];
  sendTypingIndicator: (channelId: string, isTyping: boolean) => void;
  getRealtimeTypingUsers: (channelId: string) => TypingIndicator[];
  
  // Enhanced messaging methods
  addEnhancedMessageToProject: (projectId: string, content: string, chatType: any, recipientIds?: string[]) => Promise<void>;
  setTypingStatus: (projectId: string, chatType: any, isTyping: boolean) => Promise<void>;
  getTypingUsers: (projectId: string, chatType: any) => string[];
  
  // Loading states
  loading: boolean;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to get role-based permissions
const getRolePermissions = (role: UserRole | null): RolePermissions => {
  if (!role) {
    return {
      canViewBilling: false,
      canManageUsers: false,
      canAccessAllProjects: false,
      canModifyProjectSettings: false,
      canDeleteProjects: false,
      canCreateProjects: false,
      canManageTeam: false,
      canViewAnalytics: false,
      canAccessAdminSettings: false,
      canUploadFiles: false,
      canDeleteFiles: false,
      canViewAllFiles: false,
      canManageFilePermissions: false,
    };
  }

  switch (role) {
    case UserRole.ADMIN:
      return {
        canViewBilling: true,
        canManageUsers: true,
        canAccessAllProjects: true,
        canModifyProjectSettings: true,
        canDeleteProjects: true,
        canCreateProjects: true,
        canManageTeam: true,
        canViewAnalytics: true,
        canAccessAdminSettings: true,
        canUploadFiles: true,
        canDeleteFiles: true,
        canViewAllFiles: true,
        canManageFilePermissions: true,
      };
    case UserRole.FREELANCER:
      return {
        canViewBilling: false,
        canManageUsers: false,
        canAccessAllProjects: false,
        canModifyProjectSettings: false,
        canDeleteProjects: false,
        canCreateProjects: false,
        canManageTeam: false,
        canViewAnalytics: false,
        canAccessAdminSettings: false,
        canUploadFiles: true,
        canDeleteFiles: false,
        canViewAllFiles: false,
        canManageFilePermissions: false,
      };
    case UserRole.CLIENT:
      return {
        canViewBilling: true, // Can view their own project billing
        canManageUsers: false,
        canAccessAllProjects: false,
        canModifyProjectSettings: false,
        canDeleteProjects: false,
        canCreateProjects: false,
        canManageTeam: false,
        canViewAnalytics: false,
        canAccessAdminSettings: false,
        canUploadFiles: true,
        canDeleteFiles: false,
        canViewAllFiles: false,
        canManageFilePermissions: false,
      };
    default:
      return getRolePermissions(null);
  }
};

// Inner component that uses TimerSync context
const AppProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    userRole: null,
    permissions: getRolePermissions(null),
    loading: true,
    error: null,
  });

  // Legacy state for backward compatibility
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize messaging service
  const [messagingService] = useState(() => new MessagingService());

  // Get timer sync functions and state
  const {
    activeTimer,
    isLoading: isTimerSyncing,
    syncStatus: timerSyncStatus,
    startTimer: timerSyncStartTimer,
    stopTimer: timerSyncStopTimer
  } = useTimerSync();

  // Get real-time chat functions and state
  const {
    isConnected: isRealtimeConnected,
    userPresence,
    updatePresence,
    getUserPresence,
    getAllPresences,
    sendTypingIndicator,
    getTypingUsers: getRealtimeTypingUsers
  } = useRealtimeChat({
    userId: user?.id || '',
    autoConnect: !!user?.id,
    onMessage: (message) => {
      console.log('Received real-time message:', message);
      // Handle incoming messages here
    },
    onError: (error) => {
      console.error('Real-time chat error:', error);
    }
  });

  // Load user-specific data from Firebase
  const loadUserData = async (currentUser: User) => {
    try {
      // Load users based on role permissions
      if (currentUser.role === UserRole.ADMIN) {
        // Admins can see all users
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } else {
        // Non-admins only see themselves and potentially team members
        setUsers([currentUser]);
      }

      // Load projects based on user role and permissions
      const userProjects = await getProjectsByUser(currentUser.id, currentUser.role);
      setProjects(userProjects);

      console.log(`Loaded ${userProjects.length} projects for user ${currentUser.email}`);
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set minimal data on error
      setUsers([currentUser]);
      setProjects([]);
    }
  };

  // Firebase authentication listener
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      try {
        if (firebaseUser) {
          // Check if user exists in Firestore
          const existingUser = await getUserById(firebaseUser.uid);
          
          let userData: User;
          
          if (existingUser) {
            // User exists, use existing data and update last active
            userData = existingUser;
            await updateUserLastActive(firebaseUser.uid);
            console.log('Existing user authenticated:', userData.email, 'Role:', userData.role);
          } else {
            // New user, check for intended role from registration
            const storedRole = localStorage.getItem('intendedUserType') || 
                              sessionStorage.getItem('intendedUserType');
            
            let userRole: UserRole = UserRole.FREELANCER; // Default
            if (storedRole) {
              const role = storedRole.toUpperCase() as UserRole;
              if (Object.values(UserRole).includes(role)) {
                userRole = role;
              }
            }

            // Create new user document in Firestore
            userData = await createUserFromFirebaseAuth(firebaseUser, userRole);
            console.log('New user created:', userData.email, 'Role:', userData.role);
            
            // Clear the intended role from storage
            localStorage.removeItem('intendedUserType');
            sessionStorage.removeItem('intendedUserType');
          }

          const permissions = getRolePermissions(userData.role);

          // Update auth state
          setAuthState({
            isAuthenticated: true,
            user: userData,
            userRole: userData.role,
            permissions,
            loading: false,
            error: null,
          });

          // Update legacy state for backward compatibility
          setUser(userData);
          
          // Load additional data based on user role
          await loadUserData(userData);

          console.log('User authenticated successfully:', userData.email, 'Role:', userData.role);
        } else {
          // User is not authenticated
          setAuthState({
            isAuthenticated: false,
            user: null,
            userRole: null,
            permissions: getRolePermissions(null),
            loading: false,
            error: null,
          });

          // Clear legacy state
          setUser(null);
          setUsers([]);
          setProjects([]);

          // Clear stored role
          localStorage.removeItem('intendedUserType');
          sessionStorage.removeItem('intendedUserType');

          console.log('User signed out');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Authentication error occurred',
        }));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time projects subscription
  useEffect(() => {
    if (!authState.user || !authState.isAuthenticated) {
      return;
    }

    console.log('Setting up real-time projects subscription for user:', authState.user.email);
    
    const unsubscribeProjects = subscribeToProjects(
      authState.user.id,
      authState.user.role,
      (updatedProjects) => {
        console.log(`Received ${updatedProjects.length} projects from real-time subscription`);
        setProjects(updatedProjects);
      }
    );

    return () => {
      console.log('Cleaning up projects subscription');
      unsubscribeProjects();
    };
  }, [authState.user?.id, authState.user?.role, authState.isAuthenticated]);

  useEffect(() => {
    if (authState.user?.role === UserRole.ADMIN) {
      const unsubscribeClients = subscribeToClients(setClients);
      return () => unsubscribeClients();
    }
  }, [authState.user?.role]);

  useEffect(() => {
    if (authState.user?.role === UserRole.ADMIN) {
        const unsubscribeProjectRequests = subscribeToProjectRequests(setProjectRequests);
        return () => unsubscribeProjectRequests();
    }
  }, [authState.user?.role]);

  useEffect(() => {
    if (authState.user) {
        const unsubscribeNotifications = subscribeToNotifications(authState.user.id, setNotifications);
        return () => unsubscribeNotifications();
    }
  }, [authState.user]);

  // Authentication methods
  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Store intended role if provided (for new users)
      if (role) {
        localStorage.setItem('intendedUserType', role.toString());
      }
      
      // Import and use the auth service
      const { signInWithEmail } = await import('../services/authService');
      await signInWithEmail(email, password);
      
      console.log('Login successful for:', email);
      
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed. Please try again.',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear local storage
      localStorage.removeItem('intendedUserType');
      sessionStorage.removeItem('intendedUserType');
      
      // State will be updated by the auth listener
      console.log('User logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Logout failed. Please try again.',
      }));
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      if (authState.user) {
        const updatedUser = await getUserById(authState.user.id);
        if (updatedUser) {
          setAuthState(prev => ({
            ...prev,
            user: updatedUser,
          }));
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
    }
  };

  const createUser = async (userData: UserCreationData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Import and use the auth service
      const { createAccountWithEmail } = await import('../services/authService');
      await createAccountWithEmail(userData);
      
      console.log('User account created successfully:', userData.email);
      
    } catch (error: any) {
      console.error('Create user error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to create user account.',
      }));
      throw error;
    }
  };

  // Timer methods (integrated with TimerSyncContext)
  const startGlobalTimer = async (jobCardId: string, jobCardTitle: string, projectId: string, allocatedHours: number): Promise<boolean> => {
    try {
      const success = await timerSyncStartTimer(projectId, jobCardId, jobCardTitle, allocatedHours);
      if (success) {
        console.log('Timer started via TimerSync:', { jobCardId, jobCardTitle, projectId, allocatedHours });
      }
      return success;
    } catch (error) {
      console.error('Error starting timer via TimerSync:', error);
      return false;
    }
  };

  const stopGlobalTimerAndLog = async (projectId: string, jobCardId: string, data: any) => {
    try {
      const success = await timerSyncStopTimer(data.notes, data.completionReason);
      if (success) {
        console.log('Timer stopped via TimerSync:', { projectId, jobCardId, data });
      }
    } catch (error) {
      console.error('Error stopping timer via TimerSync:', error);
    }
  };

  // Enhanced messaging methods
  const addEnhancedMessageToProject = async (projectId: string, content: string, chatType: any, recipientIds?: string[]) => {
    try {
      // Mock implementation - in real app, this would send to Firebase/backend
      console.log('Sending enhanced message:', { projectId, content, chatType, recipientIds });
      
      // Simulate message sending
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Here you would typically:
      // 1. Save message to Firestore
      // 2. Send real-time notification via WebSocket
      // 3. Update local state
      
    } catch (error) {
      console.error('Error sending enhanced message:', error);
      throw error;
    }
  };

  const setTypingStatus = async (projectId: string, chatType: any, isTyping: boolean) => {
    try {
      const channelId = `project_${projectId}_${chatType}`;
      sendTypingIndicator(channelId, isTyping);
    } catch (error) {
      console.error('Error setting typing status:', error);
      throw error;
    }
  };

  const getTypingUsers = (projectId: string, chatType: any): string[] => {
    try {
      const channelId = `project_${projectId}_${chatType}`;
      const typingIndicators = getRealtimeTypingUsers(channelId);
      return typingIndicators.map(indicator => indicator.userName);
    } catch (error) {
      console.error('Error getting typing users:', error);
      return [];
    }
  };

  // Role and permission methods
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return authState.permissions[permission] || false;
  };

  const canAccessRoute = (route: string): boolean => {
    const { userRole } = authState;
    
    if (!userRole) return false;

    // Define route access rules
    if (route.startsWith('/admin')) {
      return userRole === UserRole.ADMIN;
    }
    
    if (route.startsWith('/freelancer')) {
      return userRole === UserRole.FREELANCER;
    }
    
    if (route.startsWith('/client')) {
      return userRole === UserRole.CLIENT;
    }
    
    // Public routes or general dashboard access
    return true;
  };

  const getRoleBasedRedirectPath = (): string => {
    const { userRole } = authState;
    
    switch (userRole) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.FREELANCER:
        return '/freelancer/dashboard';
      case UserRole.CLIENT:
        return '/client/dashboard';
      default:
        return '/login';
    }
  };

  // User management methods
  const deleteUser = async (userId: string): Promise<void> => {
    try {
      if (!authState.user || authState.user.role !== UserRole.ADMIN) {
        throw new Error('Only administrators can delete users');
      }

      // Import the profile management service
      const { deleteUserProfile } = await import('../services/profileManagementService');
      
      // Find the target user
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error('User not found');
      }

      // Delete the user profile
      await deleteUserProfile(targetUser, authState.user, 'Admin deletion via context');

      // Update local state by removing the user
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));

      console.log('User deleted successfully:', userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Project management methods
  const deleteProject = async (projectId: string): Promise<void> => {
    try {
      if (!authState.user || !authState.permissions.canDeleteProjects) {
        throw new Error('Insufficient permissions to delete projects');
      }

      const { deleteProject: deleteProjectService } = await import('../services/projectService');
      await deleteProjectService(projectId);
      
      // Update local state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      
      console.log('Project deleted successfully:', projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId: string, updateData: Partial<Project>): Promise<void> => {
    try {
      if (!authState.user || !authState.permissions.canModifyProjectSettings) {
        throw new Error('Insufficient permissions to update projects');
      }

      const { updateProject: updateProjectService } = await import('../services/projectService');
      await updateProjectService(projectId, updateData);
      
      console.log('Project updated successfully:', projectId);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const updateProjectStatus = async (projectId: string, status: ProjectStatus): Promise<void> => {
    try {
      await updateProject(projectId, { status });
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  };

  const addProject = async (projectData: ProjectCreationData): Promise<string> => {
    try {
      if (!authState.user || !authState.permissions.canCreateProjects) {
        throw new Error('Insufficient permissions to create projects');
      }

      const { createProject } = await import('../services/projectService');
      const projectId = await createProject(projectData, authState.user);
      
      console.log('Project created successfully:', projectId);
      return projectId;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const addJobCardToProject = async (projectId: string, jobCardData: any): Promise<void> => {
    try {
      if (!authState.user || !authState.permissions.canModifyProjectSettings) {
        throw new Error('Insufficient permissions to add job cards');
      }

      const { addJobCardToProject: addJobCardService } = await import('../services/projectService');
      await addJobCardService(projectId, jobCardData);
      
      console.log('Job card added successfully to project:', projectId);
    } catch (error) {
      console.error('Error adding job card:', error);
      throw error;
    }
  };

  const updateJobCard = async (projectId: string, jobCardId: string, jobCardData: Partial<JobCard>): Promise<void> => {
    try {
      if (!authState.user || !authState.permissions.canModifyProjectSettings) {
        throw new Error('Insufficient permissions to update job cards');
      }

      const { updateJobCard: updateJobCardService } = await import('../services/projectService');
      await updateJobCardService(projectId, jobCardId, jobCardData);
      
      console.log('Job card updated successfully:', jobCardId);
    } catch (error) {
      console.error('Error updating job card:', error);
      throw error;
    }
  };

  const updateJobCardStatus = async (projectId: string, jobCardId: string, status: JobCardStatus): Promise<void> => {
    try {
      await updateJobCard(projectId, jobCardId, { status });
    } catch (error) {
      console.error('Error updating job card status:', error);
      throw error;
    }
  };

  // Placeholder implementations for methods that need more complex logic
  const addActionItemToProject = async (projectId: string, actionItemData: ActionItemCreationData): Promise<void> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      await addActionItem(projectId, {
        ...actionItemData,
        createdBy: authState.user.id,
        status: 'pending',
      });
    } catch (error) {
      console.error('Error adding action item:', error);
      throw error;
    }
  };

  const updateActionItemStatus = async (projectId: string, actionItemId: string, updates: Partial<ActionItem>): Promise<void> => {
    try {
      await updateActionItem(projectId, actionItemId, updates);
    } catch (error) {
      console.error('Error updating action item:', error);
      throw error;
    }
  };

  const deleteActionItemFromProject = async (projectId: string, actionItemId: string): Promise<void> => {
    try {
      await deleteActionItem(projectId, actionItemId);
    } catch (error) {
      console.error('Error deleting action item:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
        if (!authState.user || (authState.user.id !== userId && authState.user.role !== UserRole.ADMIN)) {
            throw new Error('Insufficient permissions to update user');
        }
        const { updateUser: updateUserService } = await import('../services/userService');
        await updateUserService(userId, updates);
        await refreshUserData();
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
        await updateUser(userId, updates);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
  };

  const contextValue: AppContextType = {
    // Authentication state
    authState,
    
    // User state (legacy compatibility)
    user: authState.user,
    currentUser: authState.user, // Alias for compatibility
    users,
    userRole: authState.userRole,
    permissions: authState.permissions,
    
    // Project state
    projects,
    actionItems,
    
    // Authentication methods
    login,
    logout,
    refreshUserData,
    createUser,
    
    // User management methods
    deleteUser,
    updateUser,
    updateUserProfile,
    
    // Project management methods
    deleteProject,
    updateProject,
    updateProjectStatus,
    updateJobCardStatus,
    updateJobCard,
    addActionItemToProject,
    updateActionItem: updateActionItemStatus,
    deleteActionItem: deleteActionItemFromProject,
    addProject,
    addJobCardToProject,
    
    // Role and permission methods
    hasPermission,
    canAccessRoute,
    getRoleBasedRedirectPath,
    
    // Timer methods
    startGlobalTimer,
    stopGlobalTimerAndLog,
    activeTimer,
    isTimerSyncing,
    timerSyncStatus,
    
    // Legacy timer properties for backward compatibility
    activeTimers: activeTimer ? { [activeTimer.id || 'current']: activeTimer } : {},
    currentTimerKey: activeTimer?.id || null,
    pauseGlobalTimer: async () => { return; },
    resumeGlobalTimer: async () => { return; },
    
    // Real-time chat and presence
    isRealtimeConnected,
    userPresence,
    updatePresence,
    getUserPresence,
    getAllPresences,
    sendTypingIndicator,
    getRealtimeTypingUsers,
    
    // Enhanced messaging methods
    addEnhancedMessageToProject,
    setTypingStatus,
    getTypingUsers,
    
    // Stub implementations for missing methods
    clients,
    projectRequests,
    isSidebarCollapsed,
    toggleSidebar: () => setIsSidebarCollapsed(!isSidebarCollapsed),
    notifications,
    isLoading: authState.loading || loading,
    markNotificationAsRead: async (notificationId) => {
        await markNotificationAsReadService(notificationId);
    },
    markAllNotificationsAsRead: async () => {
        if (authState.user) {
            await markAllNotificationsAsReadService(authState.user.id);
        }
    },
    addMessageToProject: async (projectId, content) => {
        if (!authState.user) throw new Error("User not authenticated");
        try {
            await messagingService.sendMessage(
                projectId,
                content,
                authState.user.id,
                authState.user.name,
                authState.user.role,
                'project' as any
            );
        } catch (error) {
            console.error('Error adding message to project:', error);
            throw error;
        }
    },
    markMessageAsRead: async (projectId, messageId) => {
        if (!authState.user) throw new Error("User not authenticated");
        try {
            await messagingService.markMessageAsRead(projectId, messageId, authState.user.id);
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    },
    deleteMessage: async () => {
        // Placeholder implementation - would require message deletion logic in MessagingService
        console.log('Delete message functionality - to be implemented in MessagingService');
    },
    hideMessageFromUser: async () => {
        // Placeholder implementation - would require message hiding logic in MessagingService
        console.log('Hide message functionality - to be implemented in MessagingService');
    },
    addFileToProject: async (projectId, fileData) => {
        if (!authState.user) throw new Error("User not authenticated");
        return await addFileToProjectService(projectId, { ...fileData, uploadedBy: authState.user.id });
    },
    updateFilePermissions: async (projectId, fileId, permissions) => {
        await updateFilePermissionsService(projectId, fileId, permissions);
    },
    deleteFileFromProject: async (projectId, fileId) => {
        await deleteFileFromProjectService(projectId, fileId);
    },
    addManualTimeLog: async (timeLogData) => {
        if (!authState.user) throw new Error("User not authenticated");
        return await addManualTimeLogService({ ...timeLogData, userId: authState.user.id });
    },
    addAdminCommentToTimeLog: async (timeLogId, adminComment) => {
        await addAdminCommentToTimeLogService(timeLogId, adminComment);
    },
    applyToProject: async (applicationData) => {
        if (!authState.user) throw new Error("User not authenticated");
        return await applyToProjectService({ ...applicationData, userId: authState.user.id });
    },
    getProjectApplications: (projectId) => {
        // This is a placeholder. In a real app, you would fetch this from state
        // which is updated by a subscription.
        return [];
    },
    acceptApplication: async (applicationId) => {
        await acceptApplicationService(applicationId);
    },
    rejectApplication: async (applicationId) => {
        await rejectApplicationService(applicationId);
    },
    generateTimeTrackingReport: (projectId, startDate, endDate) => {
        return generateTimeTrackingReportService(projectId, startDate, endDate);
    },
    generateProjectCostReport: async (projectId) => {
        try {
            return await generateProjectCostReportService(projectId, projects);
        } catch (error) {
            console.error('Error generating project cost report:', error);
            return null;
        }
    },
    generateFreelancerPerformanceReport: async (freelancerId) => {
        try {
            return await generateFreelancerPerformanceReportService(freelancerId, projects);
        } catch (error) {
            console.error('Error generating freelancer performance report:', error);
            return null;
        }
    },
    exportReportToPDF: async (title = 'Report', data = {}) => {
        try {
            await exportToPDFService(title, data);
        } catch (error) {
            console.error('Error exporting report to PDF:', error);
            throw error;
        }
    },
    exportReportToCSV: async (data = [], filename = 'report.csv') => {
        try {
            await exportToCSVService(data, filename);
        } catch (error) {
            console.error('Error exporting report to CSV:', error);
            throw error;
        }
    },
    createProjectRequest: async (projectRequestData) => {
        if (!authState.user) throw new Error("User not authenticated");
        return await createProjectRequestService({ ...projectRequestData, clientId: authState.user.id });
    },
    updateProjectRequestStatus: async (projectRequestId, status) => {
        await updateProjectRequest(projectRequestId, { status });
    },
    convertProjectRequestToProject: async (projectRequestId) => {
        const request = projectRequests.find(pr => pr.id === projectRequestId);
        if (!request) throw new Error("Project request not found");
        const projectId = await addProject({
            name: request.name,
            description: request.description,
            budget: request.budget,
            clientId: request.clientId,
            status: ProjectStatus.DRAFT,
        });
        await updateProjectRequest(projectRequestId, { status: ProjectRequestStatus.APPROVED });
        return projectId;
    },
    isClientOnboardingCompleted: async (clientId) => {
        const client = await getUserById(clientId);
        return client?.onboardingCompleted || false;
    },
    fixUserRole: async () => {
        // Placeholder implementation for fixing user roles
        // This would typically be used by admins to correct role assignments
        if (!authState.user || authState.user.role !== UserRole.ADMIN) {
            throw new Error('Only administrators can fix user roles');
        }
        console.log('fixUserRole: Role management functionality - would verify and correct user role assignments');
    },
    fixClientRelationships: async () => { console.log('fixClientRelationships not implemented'); },
    checkAndUpdateProjectStatus: async () => {
        // Automatically update project statuses based on criteria like deadlines, completion, etc.
        try {
            const now = new Date();
            
            // This is a basic implementation that could be expanded
            // For each project, check if status should be updated
            for (const project of projects) {
                // Example: Auto-complete projects that have all job cards completed
                if (project.status === ProjectStatus.ACTIVE && project.jobCards) {
                    const allCompleted = project.jobCards.every(jc => jc.status === JobCardStatus.COMPLETED);
                    if (allCompleted && project.jobCards.length > 0) {
                        console.log(`Project ${project.id} could be marked as completed - all job cards done`);
                        // In a real implementation, you would call updateProjectStatus here
                    }
                }
                
                // Example: Mark overdue projects as on-hold
                if (project.deadline && project.status === ProjectStatus.ACTIVE) {
                    const deadline = project.deadline instanceof Date ? project.deadline : project.deadline.toDate();
                    if (deadline < now) {
                        console.log(`Project ${project.id} is past deadline - consider marking as overdue`);
                        // In a real implementation, you would call updateProjectStatus here
                    }
                }
            }
        } catch (error) {
            console.error('Error checking and updating project statuses:', error);
        }
    },
    createClient: async (clientData: Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
            if (!authState.user || authState.user.role !== UserRole.ADMIN) {
                throw new Error('Only administrators can create clients');
            }
            const newClientId = await createClient(clientData);
            await refreshUserData();
            return newClientId;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    },
    updateProjectTeam: async (projectId, teamMemberIds, action) => {
        await updateProjectTeamService(projectId, teamMemberIds, action);
    },
    loadAuditModule: async () => {
        return await loadAuditModuleService();
    },
    
    // Loading states
    loading: authState.loading || loading
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Main provider component that wraps with TimerSyncProvider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <TimerSyncProvider>
      <AppProviderInner>{children}</AppProviderInner>
    </TimerSyncProvider>
  );
};

// Hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;