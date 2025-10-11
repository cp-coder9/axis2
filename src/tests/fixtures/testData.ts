/**
 * Test Data Fixtures - Main Export
 * Centralized export for all timer component test fixtures
 */

// Import all fixture modules
import users from './users';
import projects from './projects';
import timerStates from './timerStates';
import files from './files';
import errors from './errors';

// Export individual fixture modules
export { default as users } from './users';
export { default as projects } from './projects';
export { default as timerStates } from './timerStates';
export { default as files } from './files';
export { default as errors } from './errors';

// Export specific commonly used fixtures for convenience
export {
  adminUser,
  freelancerUser,
  freelancerUser2,
  clientUser,
  inactiveUser,
  userAccessScenarios
} from './users';

export {
  activeProject,
  exceededProject,
  activeJobCards,
  exceededJobCard,
  projectAccessScenarios,
  timeAllocationScenarios
} from './projects';

// JobCard convenience exports
export const jobCards = {
  assignedToFreelancer: {
    id: 'job-assigned-001',
    projectId: 'project-001',
    title: 'Assigned Task',
    description: 'Task assigned to freelancer',
    assignedTo: 'freelancer-001',
    allocatedHours: 8,
    usedHours: 4.5,
    status: 'IN_PROGRESS',
    priority: 'medium',
    tags: ['frontend'],
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    timeLogs: []
  },
  unassigned: {
    id: 'job-unassigned-001',
    projectId: 'project-001',
    title: 'Unassigned Task',
    description: 'Task not yet assigned',
    assignedTo: null,
    allocatedHours: 6,
    usedHours: 0,
    status: 'TODO',
    priority: 'low',
    tags: ['backend'],
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-20'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    timeLogs: []
  }
};

export {
  idleTimerState,
  runningTimerState,
  pausedTimerState,
  pausedNearLimitState,
  pausedAtLimitState,
  exceededTimerState,
  overtimeTimerState,
  timerStateScenarios,
  pauseLimitScenarios,
  timeDisplayScenarios,
  progressScenarios
} from './timerStates';

export {
  validImageFiles,
  validDocumentFiles,
  invalidTypeFiles,
  oversizedFiles,
  fileValidationScenarios,
  fileUploadScenarios,
  formDataScenarios,
  mockFileReader,
  createTestFile
} from './files';

export {
  firebaseErrorScenarios,
  timerErrorScenarios,
  validationErrorScenarios,
  accessErrorScenarios,
  completeErrorScenarios
} from './errors';

// Comprehensive test scenario collections
export const allTestScenarios = {
  users: users.userAccessScenarios,
  projects: projects.projectAccessScenarios,
  timerStates: timerStates.timerStateScenarios,
  files: files.fileUploadScenarios,
  errors: errors.completeErrorScenarios
};

// Test data factory functions
export const createTestData = {
  user: users.createTestUser,
  project: projects.createTestProject,
  jobCard: projects.createTestJobCard,
  timerState: timerStates.createTestTimerState,
  file: files.createTestFile
};

// Edge case collections for negative testing
export const edgeCases = {
  users: users.edgeCaseUsers,
  projects: projects.edgeCaseProjects,
  jobCards: projects.edgeCaseJobCards,
  timerStates: timerStates.edgeTimerStates,
  files: files.allEdgeCaseFiles,
  errors: errors.edgeCaseErrorScenarios
};

// Complete test data export for comprehensive testing
const testData = {
  users,
  projects,
  jobCards,
  timerStates,
  files,
  errors,
  allTestScenarios,
  createTestData,
  edgeCases
};

export { testData };

export default testData;