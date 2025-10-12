import { Timestamp } from 'firebase/firestore';

// Core user types
export enum UserRole {
  ADMIN = 'ADMIN',
  FREELANCER = 'FREELANCER',
  CLIENT = 'CLIENT'
}

export interface User {
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
    notifications: {
      email: boolean;
      browser: boolean;
      timerAlerts: boolean;
      projectUpdates: boolean;
      messageReceived: boolean;
    };
    dashboard: {
      defaultView: 'grid' | 'list';
      widgetsEnabled: string[];
    };
    timezone?: string;
    language?: string;
  };
}

export interface UserCreationData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  title?: string;
  company?: string;
}

// Project related types
export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName?: string;
  leadArchitectId: string;
  leadArchitectName?: string;
  assignedTeamIds: string[];
  assignedTeam?: User[];
  status: ProjectStatus;
  projectNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deadline?: Timestamp;
  budget?: number;
  jobCards: JobCard[];
  files?: ProjectFile[];
  totalTimeSpentMinutes?: number;
  totalAllocatedHours?: number;
  totalEarnings?: number;
  // Additional properties used in demo and components
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tags?: string[];
  deliverables?: string[];
  purchasedHours?: number;
  remainingHours?: number;
  completionPercentage?: number;
  activeJobCards?: number;
  totalJobCards?: number;
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface JobCard {
  id: string;
  title: string;
  description: string;
  status: JobCardStatus;
  estimatedTime?: number;
  allocatedHours?: number;
  assignedArchitectIds: string[];
  timeLogs?: TimeLog[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum JobCardStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED'
}

// Timer and time tracking types
export interface TimeLog {
  id: string;
  startTime: Timestamp;
  endTime: Timestamp;
  durationMinutes: number;
  notes?: string;
  manualEntry: boolean;
  projectId: string;
  jobCardId: string;
  loggedById: string;
  loggedByName: string;
  substantiationFile?: SubstantiationFile;
  hourlyRate?: number;
  earnings?: number;
  pausedTime?: number;
}

export interface SubstantiationFile {
  name: string;
  url: string;
}

// File management types
export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Timestamp;
  uploaderId: string;
  uploaderName: string;
  uploadedBy?: string; // For backward compatibility
  uploadedByName?: string; // For backward compatibility
  permissions: FilePermissions;
  lastModified?: Timestamp;
  lastModifiedBy?: string;
  thumbnailUrl?: string;
  projectId?: string; // Optional project association
  tags?: string[]; // File tags for organization
  category?: FileCategory; // File category for organization
  folder?: string; // Cloudinary folder path
  version?: number; // File version number
  currentVersion?: number; // Current version number
  cloudinaryPublicId?: string; // Cloudinary public ID
  // Task 1.2: Enhanced ProjectFile properties
  isDeleted?: boolean; // Soft delete functionality
  description?: string; // File documentation
  shareLinks?: FileShareLink[]; // File sharing capabilities
  versions?: FileVersion[]; // File version control
  metadata?: FileMetadata; // Extended file information
  public_id?: string; // Cloudinary public ID
  secure_url?: string; // Cloudinary secure URL
  isLatestVersion?: boolean; // Version control flag
  customMetadata?: Record<string, string>; // Custom metadata fields
}

export interface FilePermissions {
  level: FilePermissionLevel;
  allowDownload: boolean;
  allowShare: boolean;
  allowDelete: boolean;
  allowVersioning: boolean;
  allowComments: boolean;
  // Task 1.2: Granular permissions
  specificUsers?: string[]; // User IDs with specific access
  specificRoles?: UserRole[]; // Roles with specific access
}

export enum FilePermissionLevel {
  PROJECT_TEAM = 'PROJECT_TEAM',
  CLIENT_VISIBLE = 'CLIENT_VISIBLE',
  ADMIN_ONLY = 'ADMIN_ONLY'
}

// Task 1.4: Complete FileCategory enum
export enum FileCategory {
  DRAWINGS = 'DRAWINGS',
  SPECIFICATIONS = 'SPECIFICATIONS',
  REPORTS = 'REPORTS',
  CONTRACTS = 'CONTRACTS',
  CORRESPONDENCE = 'CORRESPONDENCE',
  MODELS = 'MODELS',
  IMAGES = 'IMAGES',
  PRESENTATIONS = 'PRESENTATIONS',
  SPREADSHEETS = 'SPREADSHEETS',
  VIDEOS = 'VIDEOS',
  AUDIO = 'AUDIO',
  DOCUMENTS = 'DOCUMENTS',
  ARCHIVES = 'ARCHIVES',
  SUBSTANTIATION = 'SUBSTANTIATION',
  DELIVERABLES = 'DELIVERABLES',
  PROFILE = 'PROFILE',
  SYSTEM = 'SYSTEM',
  OTHER = 'OTHER'
}

// Task 1.2: File sharing and versioning types
export interface FileShareLink {
  id: string;
  fileId: string;
  url: string;
  createdAt: Timestamp;
  createdBy: string;
  expiresAt?: Timestamp;
  accessCount: number;
  maxAccessCount?: number;
  password?: string;
  isActive?: boolean;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canEdit: boolean;
  };
}

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

// Type alias for backward compatibility
export type Application = ProjectApplication;

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
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

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Project Request types
export interface ProjectRequest {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  status: ProjectRequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deadline?: Timestamp;
  budget?: number;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export enum ProjectRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED'
}

// Dashboard types
export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Task 1.3: Enhanced DashboardWidget properties
  description?: string;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  config?: Record<string, any>;
  permissions?: {
    roles: UserRole[];
    users?: string[];
  };
  isVisible?: boolean;
  refreshInterval?: number;
  dataSource?: string;
}

// AppContext interface
export interface AppContextType {
  // Auth
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  createUser: (userData: UserCreationData) => Promise<void>;

  // Data
  users: User[];
  clients: any[];
  projects: Project[];
  projectRequests: any[];

  // Timer
  activeTimers: Record<string, any>;
  currentTimerKey: string | null;
  startGlobalTimer: (jobCardId: string, jobCardTitle: string, projectId: string, allocatedHours?: number) => Promise<boolean>;
  resumeGlobalTimer: (projectId: string, jobCardId: string) => Promise<boolean>;
  pauseGlobalTimer: (projectId: string, jobCardId: string) => Promise<boolean>;
  stopGlobalTimerAndLog: (projectId: string, jobCardId: string, details: { notes?: string; file?: File }) => Promise<void>;

  // Projects
  deleteProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updateData: Partial<Project>) => Promise<void>;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
  updateJobCardStatus: (projectId: string, jobCardId: string, status: JobCardStatus) => Promise<void>;
  updateJobCard: (projectId: string, jobCardId: string, jobCardData: Partial<JobCard>) => Promise<void>;
  addActionItemToProject: (projectId: string, actionItemData: ActionItemCreationData) => Promise<void>;
  updateActionItem: (projectId: string, actionItemId: string, updates: Partial<ActionItem>) => Promise<void>;
  deleteActionItem: (projectId: string, actionItemId: string) => Promise<void>;
  addProject: (projectData: ProjectCreationData) => Promise<string>;
  addJobCardToProject: (projectId: string, jobCardData: any) => Promise<void>;

  // Users
  deleteUser?: (userId: string) => Promise<void>; // Task 1.5: Added deleteUser method (optional)
  updateUser: () => Promise<void>;
  updateUserProfile: () => Promise<void>;

  // UI
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Notifications
  notifications: Notification[];
  isLoading: boolean;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

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
  addManualTimeLog: (projectId: string, jobCardId: string, logData: any, file?: File) => Promise<void>;
  addAdminCommentToTimeLog: () => Promise<void>;

  // Applications
  applyToProject: (projectId: string, coverLetter?: string, proposedRate?: number) => Promise<void>;
  getProjectApplications: () => any[];
  acceptApplication: () => Promise<void>;
  rejectApplication: () => Promise<void>;

  // Reports
  generateTimeTrackingReport: (filters: any) => TimeTrackingReport;
  generateProjectCostReport: (projectId: string) => ProjectCostReport | null;
  generateFreelancerPerformanceReport: (freelancerId: string) => FreelancerPerformanceReport | null;
  exportReportToPDF: () => Promise<void>;
  exportReportToCSV: () => Promise<void>;

  // Project requests
  createProjectRequest: () => Promise<string>;
  updateProjectRequestStatus: () => Promise<void>;
  convertProjectRequestToProject: () => Promise<string>;

  // Additional methods
  isClientOnboardingCompleted: () => Promise<boolean>;
  fixUserRole: () => Promise<void>;
  fixClientRelationships: () => Promise<void>;
  checkAndUpdateProjectStatus: () => Promise<void>;
  createClient: () => Promise<string>;
  updateProjectTeam: () => Promise<void>;
  loadAuditModule?: () => Promise<any>;

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
