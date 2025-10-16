// Minimal stubs for missing types
export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo?: string;
  assignedToId?: string;
  jobId?: string;
  dueDate?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  timeLogs?: TimeLog[];
  taskId?: string;
  estimatedTime?: number;
  allocatedHours?: number;
  priority?: string;
};
export type TimeLog = {
  id: string;
  userId: string;
  projectId: string;
  jobId?: string;
  taskId?: string;
  timeSlotId?: string;
  loggedById?: string;
  loggedByName?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  durationMinutes: number;
  notes?: string;
  manualEntry?: boolean;
  hourlyRate?: number;
  earnings?: number;
  pausedTime?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  jobCardId?: string;
  substantiationFile?: SubstantiationFile;
};
export type JobCard = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: JobCardStatus;
  assignedTo?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
export enum JobCardStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
}
export type FilePermissions = {
  allowView: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowShare: boolean;
  level?: FilePermissionLevel;
  allowDownload?: boolean;
  allowVersioning?: boolean;
  allowComments?: boolean;
  specificUsers?: string[];
  specificRoles?: string[];
};
export type FileShareLink = {
  id: string;
  fileId: string;
  url: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  createdBy?: string;
  accessCount?: number;
  maxAccessCount?: number;
  isActive?: boolean;
  password?: string;
};
export enum TimePurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}
// Minimal stubs for missing types
export type UserCreationData = {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  title?: string;
  company?: string;
};
export type Project = {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  clientName?: string;
  assignedTeamIds?: string[];
  assignedTeam?: any[];
  jobs?: Job[];
  jobCards?: JobCard[];
  leadArchitectId?: string;
  status: ProjectStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  budget?: number;
  totalEarnings?: number;
  projectNumber?: string;
  deadline?: Timestamp;
  priority?: string;
  totalJobs?: number;
  progress?: number;
  files?: ProjectFile[];
  startDate?: Timestamp;
  endDate?: Timestamp;
  totalTimeSpentMinutes?: number;
  totalAllocatedHours?: number;
  completionPercentage?: number;
};
export type Job = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: JobStatus;
  assignedTo?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  tasks?: Task[];
  allocatedHours?: number;
  assignedArchitectIds?: string[];
};
export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  url: string;
  type?: string;
  category: FileCategory;
  permissionLevel: FilePermissionLevel;
  uploadedBy: string;
  uploaderId?: string;
  uploadedAt: Timestamp;
  tags?: string[];
  size?: number;
  permissions?: FilePermissions;
  version?: number;
  description?: string;
  isDeleted?: boolean;
  folder?: string;
  cloudinaryPublicId?: string;
  createdBy?: string;
  uploaderName?: string;
  lastModified?: Timestamp;
  lastModifiedBy?: string;
  customMetadata?: Record<string, any>;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
  shareLinks?: FileShareLink[];
  versions?: FileVersion[];
  currentVersion?: number;
};
export type TimePurchase = {
  id: string;
  slotId: string;
  clientId: string;
  clientName: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  amount: number;
  currency: string;
  status: TimePurchaseStatus;
  paymentMethod?: string;
  transactionId?: string;
  purchasedAt: Timestamp;
  notes?: string;
};
// Minimal enums for value usage in codebase
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED'
}

export enum JobStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED'
}

export enum TimeSlotStatus {
  AVAILABLE = 'AVAILABLE',
  PURCHASED = 'PURCHASED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum FilePermissionLevel {
  ADMIN_ONLY = 'ADMIN_ONLY',
  PROJECT_TEAM = 'PROJECT_TEAM',
  CLIENT_VISIBLE = 'CLIENT_VISIBLE'
}

export enum FileCategory {
  DRAWINGS = 'DRAWINGS',
  SPECIFICATIONS = 'SPECIFICATIONS',
  REPORTS = 'REPORTS',
  CONTRACTS = 'CONTRACTS',
  CORRESPONDENCE = 'CORRESPONDENCE',
  MODELS = 'MODELS',
  IMAGES = 'IMAGES',
  DOCUMENTS = 'DOCUMENTS',
  OTHER = 'OTHER',
  PRESENTATIONS = 'PRESENTATIONS',
  SPREADSHEETS = 'SPREADSHEETS',
  VIDEOS = 'VIDEOS',
  AUDIO = 'AUDIO',
  ARCHIVES = 'ARCHIVES',
  SUBSTANTIATION = 'SUBSTANTIATION',
  DELIVERABLES = 'DELIVERABLES',
  PROFILE = 'PROFILE',
  SYSTEM = 'SYSTEM'
}
// Minimal stubs for missing exports to resolve import errors
// Additional stubs for referenced types/enums
export type AllocationFormData = {
  projectId: string;
  freelancerId: string;
  allocatedHours: number;
  hourlyRate: number;
  startDate: Timestamp;
  endDate: Timestamp;
  notes?: string;
};
export type ProjectTemplate = {
  id: string;
  name: string;
  title: string;
  description?: string;
  jobs: JobTemplate[];
  jobTemplates?: JobTemplate[];
  tasks: TaskTemplate[];
  category?: string;
  isPublic?: boolean;
  createdById?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  usageCount?: number;
  tags?: string[];
  estimatedDuration?: number;
  estimatedBudget?: number;
};
export type JobTemplate = {
  id: string;
  title: string;
  description?: string;
  tasks: TaskTemplate[];
};
export type TaskTemplate = {
  id: string;
  title: string;
  description?: string;
};
export type SubstantiationFile = {
  id: string;
  projectId: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  fileId?: string;
};
export type ActiveTimerInfo = {
  timerId: string;
  projectId: string;
  jobCardId?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: string;
};
export type WidgetLayout = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
  static?: boolean;
  i?: string; // Add missing 'i' property for widgetId
};
// UI stubs
export type Input = any;
export type Pie = any;
// Minimal stubs for missing types
// Minimal stubs for missing types
// Minimal stubs for missing types (remove if real types exist above)
// Only keep stubs for types that are truly missing below
import { Timestamp } from 'firebase/firestore';
import { NotificationPreferences } from './types/notifications';
// Add missing imports for referenced types
// If these are not available, define minimal stubs below

// Minimal stubs for missing types (remove if real types exist)
// Removed duplicate/unused type stubs for ProjectFile, TimeSlotStatus, and TimePurchase.

// Core user types
export enum UserRole {
  ADMIN = 'ADMIN',
  FREELANCER = 'FREELANCER',
  CLIENT = 'CLIENT'
}

export interface User {
  // Removed type stubs for enums now defined above
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  hourlyRate: number;
  phone: string;
  company: string;
  avatarUrl: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  onboardingCompleted?: boolean;
  accountStatus?: string;
  // Task 1.1: Enhanced User properties
  skills?: string[];
  tempPassword?: string;
  bio?: string;
  portfolio?: string;
  onboarding?: {
    profileCompleted: boolean;
    skillsAdded: boolean;
    firstProjectAssigned: boolean;
    firstTimeLogged: boolean;
    completedAt?: Timestamp;
  };
  lastSeen?: Timestamp;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: NotificationPreferences;
    dashboard: {
      defaultView: 'grid' | 'list';
      widgetsEnabled: string[];
    };
    timezone?: string;
    language?: string;
  };
}
// Time Management Module Types
export interface TimeAllocation {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  allocatedById: string; // Admin who allocated
  allocatedByName: string;
  allocatedHours: number; // Total hours allocated
  hourlyRate: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: TimeAllocationStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export enum TimeAllocationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface TimeSlot {
  id: string;
  allocationId: string; // Reference to parent allocation
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  durationHours: number; // Fixed 4-hour blocks
  hourlyRate: number;
  status: TimeSlotStatus;
  purchasedById?: string; // Client who purchased
  purchasedByName?: string;
  purchaseId?: string; // Reference to purchase record
  createdAt: Timestamp;
  updatedAt: Timestamp;
  freelancerRating?: number;
}
// AppContext interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  userRole: UserRole | null;
  permissions: RolePermissions;
  loading: boolean;
  error: string | null;
}

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
  canEditFiles?: boolean;
  canViewFiles?: boolean;
  canShareFiles?: boolean;
  canCommentFiles?: boolean;
  canDownloadFiles?: boolean;
  canVersionFiles?: boolean;
  canAccessClientFiles?: boolean;
  canAccessTeamFiles?: boolean;
  canAccessSystemFiles?: boolean;
}
// Removed duplicate/conflicting AppContextType definition and misplaced closing brace/semicolon.

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  url: string;
  size: number;
  uploadedAt: Timestamp;
  uploadedBy: string;
  uploadedByName: string;
  changeDescription?: string;
  cloudinaryPublicId?: string;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  author?: string;
  createdDate?: Timestamp;
  modifiedDate?: Timestamp;
  format?: string;
  colorSpace?: string;
  dpi?: number;
  customFields?: Record<string, any>;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  createdAt: Timestamp;
  read: boolean;
}

export enum NotificationType {
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  TIMER_WARNING = 'TIMER_WARNING',
  FILE_SHARED = 'FILE_SHARED',
  WARNING = 'WARNING',
  SYSTEM = 'SYSTEM'
}

// Chat and messaging types
export enum ChatType {
  GENERAL = 'GENERAL',
  FREELANCER = 'FREELANCER',
  PRIVATE = 'PRIVATE'
}
export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  projectId: string;
  chatType: ChatType;
  timestamp: Timestamp;
  isTyping: boolean;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  projectId: string;
  chatType: ChatType;
  timestamp: Timestamp;
  isTyping: boolean;
}

// Application and project request types
export interface ProjectApplication {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail: string;
  coverLetter: string;
  proposedRate: number;
  status: ApplicationStatus;
  appliedAt: Timestamp;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface Application {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail: string;
  coverLetter?: string;
  proposedRate?: number;
  status: ApplicationStatus;
  createdAt: Timestamp;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

export enum ProjectRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ProjectRequest {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  budget?: number;
  deadline?: Timestamp;
  status: ProjectRequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectCreationData {
  title: string;
  description: string;
  clientId: string;
  leadArchitectId: string;
  assignedTeamIds: string[];
  deadline?: Date;
  budget?: number;
}

export interface ProjectNumber {
  formatted: string;
  year: number;
  month: number;
  sequence: number;
  yearShort: string;
}

// Message type (re-exported from messaging types)
export interface Message {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Timestamp;
  type?: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  readBy?: string[];
  edited?: boolean;
  editedAt?: Timestamp;
  senderId?: string;
  senderName?: string;
  senderAvatarUrl?: string;
  senderRole?: UserRole;
  chatType?: ChatType;
  messageType?: string;
  recipientIds?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
  }>;
  status?: MessageStatus;
  channelId?: string;
}

// Manual time logging
export interface ManualLogData {
  startTime: string; // from time input
  endTime: string; // from time input
  durationMinutes: number;
  notes?: string;
  manualEntry: boolean;
  file?: File;
}

// Action items and tasks
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignedTo: string;
  assignedToName: string;
  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActionItemCreationData {
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  dueDate?: Date;
}

// Report types
export interface TimeTrackingReport {
  totalHours: number;
  totalEarnings: number;
  projectBreakdown: Array<{
    projectId: string;
    projectTitle: string;
    hours: number;
    earnings: number;
  }>;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ProjectCostReport {
  projectId: string;
  projectTitle: string;
  totalCost: number;
  totalHours: number;
  teamBreakdown: Array<{
    userId: string;
    userName: string;
    hours: number;
    cost: number;
  }>;
}

export interface FreelancerPerformanceReport {
  freelancerId: string;
  freelancerName: string;
  totalProjects: number;
  totalHours: number;
  averageHourlyRate: number;
  projectsCompleted: number;
  projectsInProgress: number;
}

// Audit types
export enum AuditAction {
  TIMER_STARTED = 'TIMER_STARTED',
  TIMER_STOPPED = 'TIMER_STOPPED',
  TIMER_PAUSED = 'TIMER_PAUSED',
  TIMER_RESUMED = 'TIMER_RESUMED',
  TIMER_AUTO_STOPPED = 'TIMER_AUTO_STOPPED',
  TIMER_START_DENIED_ROLE = 'TIMER_START_DENIED_ROLE',
  TIMER_START_DENIED_ASSIGNMENT = 'TIMER_START_DENIED_ASSIGNMENT',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DELETED = 'FILE_DELETED',
  FILE_SHARED = 'FILE_SHARED',
  VALIDATION_PERFORMED = 'VALIDATION_PERFORMED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  COMPLETENESS_CHECKED = 'COMPLETENESS_CHECKED'
}

// Dashboard types
export interface DashboardWidget {
  id: string;
  type: string;
  name: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Task 1.3: Enhanced DashboardWidget properties
  category?: 'analytics' | 'projects' | 'time' | 'files' | 'team' | 'reports' | 'system';
  description?: string;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  defaultW?: number;
  defaultH?: number;
  config?: Record<string, any>;
  permissions?: {
    roles: UserRole[];
    users?: string[];
  };
  isVisible?: boolean;
  refreshInterval?: number;
  dataSource?: string;
}

// Additional missing types
export interface FreelancerUtilizationMetrics {
  freelancerId: string;
  freelancerName: string;
  totalAllocatedHours: number;
  totalUtilizedHours: number;
  utilizationRate: number;
  efficiencyScore: number;
  revenueGenerated: number;
  projectBreakdown: Array<{
    projectId: string;
    projectTitle: string;
    allocatedHours: number;
    utilizedHours: number;
  }>;
  activeProjects: number;
  unutilizedHours: number;
  recommendations: string[];
}

export interface AllocationTrend {
  date: string;
  allocations: number;
  utilizedHours: number;
  utilizationRate: number;
  revenue: number;
  allocationEfficiency: number;
}

// AppContext interface
export interface AppContextType {
  // Auth
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  createUser: (userData: UserCreationData) => Promise<void>;

  // Optional auth helpers kept as flexible to avoid strict coupling
  login?: (...args: any[]) => Promise<any>;
  getRoleBasedRedirectPath?: (...args: any[]) => string;
  authState?: any;

  // Data
  users: User[];
  clients: any[];
  projects: Project[];
  projectRequests: any[];

  // Timer (keep flexible signatures to accommodate multiple call patterns)
  activeTimers: Record<string, any>;
  currentTimerKey: string | null;
  startGlobalTimer: (...args: any[]) => Promise<boolean>;
  resumeGlobalTimer: (...args: any[]) => Promise<boolean>;
  pauseGlobalTimer: (...args: any[]) => Promise<boolean>;
  stopGlobalTimerAndLog: (...args: any[]) => Promise<void>;

  // Projects
  deleteProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updateData: Partial<Project>) => Promise<void>;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
  updateJobStatus: (projectId: string, jobId: string, status: JobStatus) => Promise<void>;
  updateJob: (projectId: string, jobId: string, jobData: Partial<Job>) => Promise<void>;
  addActionItemToProject: (projectId: string, actionItemData: ActionItemCreationData) => Promise<void>;
  updateActionItem: (projectId: string, actionItemId: string, updates: Partial<ActionItem>) => Promise<void>;
  deleteActionItem: (projectId: string, actionItemId: string) => Promise<void>;
  addProject: (projectData: ProjectCreationData) => Promise<string>;
  addJobToProject: (projectId: string, jobData: any) => Promise<void>;

  // Users
  deleteUser?: (userId: string) => Promise<void>; // Task 1.5: Added deleteUser method (optional)
  updateUser: (...args: any[]) => Promise<void>;
  updateUserProfile: (...args: any[]) => Promise<void>;

  // UI
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Notifications
  notifications: Notification[];
  isLoading: boolean;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Extras used pervasively
  currentUser?: User | null;
  activeTimer?: any;
  timeLogs?: TimeLog[];
  allocations?: TimeAllocation[];
  timeSlots?: TimeSlot[];
  purchases?: TimePurchase[];

  // Typing indicators
  setTypingStatus: (projectId: string, chatType: ChatType, isTyping: boolean) => Promise<void>;
  getTypingUsers: (projectId: string, chatType: ChatType) => string[];

  // Messages
  addMessageToProject: (projectId: string, content: string) => Promise<void>;
  addEnhancedMessageToProject: (projectId: string, content: string, chatType: ChatType, recipientIds?: string[], attachedFile?: any) => Promise<void>;
  markMessageAsRead: (projectId: string, messageId: string) => Promise<void>;
  deleteMessage: () => Promise<void>;
  hideMessageFromUser: () => Promise<void>;

  // Files
  addFileToProject: (projectId: string, projectFile: any, onProgress?: (progress: number) => void) => Promise<ProjectFile>;
  updateFilePermissions: (projectId: string, fileId: string, permissions: any) => Promise<void>;
  deleteFileFromProject: (projectId: string, fileId: string) => Promise<void>;

  // Time logs
  addManualTimeLog: (...args: any[]) => Promise<void>;
  addAdminCommentToTimeLog: (...args: any[]) => Promise<void>;

  // Time Management Module
  allocateTimeToFreelancer: (...args: any[]) => Promise<string>;
  getTimeAllocations: (...args: any[]) => Promise<TimeAllocation[]>;
  updateTimeAllocation: (allocationId: string, updates: Partial<TimeAllocation>) => Promise<void>;
  deleteTimeAllocation: (allocationId: string) => Promise<void>;
  getAvailableTimeSlots: (projectId: string) => Promise<TimeSlot[]>;
  purchaseTimeSlot: (slotId: string, clientId: string, clientName: string) => Promise<string>;
  getTimePurchases: (clientId?: string, projectId?: string) => Promise<TimePurchase[]>;
  getTimeSlots: (...args: any[]) => Promise<TimeSlot[]>;
  getTimeSlotsForFreelancer: (...args: any[]) => Promise<TimeSlot[]>;
  getTimeAllocationsByFreelancer: (freelancerId: string) => Promise<any[]>;
  getTimeAllocationsByProject: (projectId: string) => Promise<any[]>;
  getTimeSlotsByProject: (projectId: string) => Promise<any[]>;
  getTimeSlotsByFreelancer: (freelancerId: string) => Promise<any[]>;
  getTimeSlotsByClient: (clientId: string) => Promise<any[]>;
  updateTimeSlotStatus: (slotId: string, status: any) => Promise<void>;
  getTimeSlotUtilizationStats: (projectId?: string) => Promise<any>;

  // Applications
  applyToProject: (...args: any[]) => Promise<void>;
  getProjectApplications: (...args: any[]) => any[];
  acceptApplication: (...args: any[]) => Promise<void>;
  rejectApplication: (...args: any[]) => Promise<void>;

  // Reports
  generateTimeTrackingReport: (...args: any[]) => TimeTrackingReport;
  generateProjectCostReport: (...args: any[]) => ProjectCostReport | null;
  generateFreelancerPerformanceReport: (...args: any[]) => FreelancerPerformanceReport | null;
  exportReportToPDF: () => Promise<void>;
  exportReportToCSV: () => Promise<void>;

  // Project requests
  createProjectRequest: (...args: any[]) => Promise<string>;
  updateProjectRequestStatus: (...args: any[]) => Promise<void>;
  convertProjectRequestToProject: (...args: any[]) => Promise<string>;

  // Additional methods
  isClientOnboardingCompleted: (...args: any[]) => Promise<boolean>;
  fixUserRole: (...args: any[]) => Promise<void>;
  fixClientRelationships: (...args: any[]) => Promise<void>;
  checkAndUpdateProjectStatus: (...args: any[]) => Promise<void>;
  createClient: (...args: any[]) => Promise<string>;
  updateProjectTeam: (...args: any[]) => Promise<void>;
  loadAuditModule?: (...args: any[]) => Promise<any>;

  // Settings
  settings?: any;
  settingsLoading?: boolean;
  settingsError?: any;
  hasUnsavedChanges?: boolean;
  updateSetting?: (key: string, value: any) => void;
  saveSettings?: () => Promise<void>;
  resetSettingsToDefaults?: () => Promise<void>;
  exportSettings?: () => string;
  importSettings?: (settingsJson: string) => Promise<void>;
}
