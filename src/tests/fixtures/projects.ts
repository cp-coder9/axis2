/**
 * Project Test Fixtures
 * Comprehensive project and job card test data for timer component testing
 */

import { Project, JobCard, ProjectStatus, JobCardStatus } from '../../types';
import { freelancerUser, freelancerUser2, clientUser, adminUser } from './users';

// Base project template
const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-001',
  name: 'Sample Project',
  description: 'A test project for timer functionality',
  clientId: clientUser.id,
  status: ProjectStatus.ACTIVE,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  budget: 50000,
  allocatedHours: 100,
  usedHours: 45.5,
  teamMembers: [freelancerUser.id],
  jobCards: [],
  files: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  settings: {
    allowOvertime: false,
    requireFileUpload: true,
    autoStop: true
  },
  ...overrides
});

// Base job card template
const createJobCard = (projectId: string, overrides: Partial<JobCard> = {}): JobCard => ({
  id: 'job-001',
  projectId,
  title: 'Sample Task',
  description: 'A test task for timer functionality',
  status: JobCardStatus.IN_PROGRESS,
  assignedTo: freelancerUser.id,
  allocatedHours: 8,
  usedHours: 3.5,
  estimatedHours: 8,
  priority: 'medium',
  dueDate: new Date('2024-06-01'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
  tags: ['frontend', 'react'],
  timeLogs: [],
  ...overrides
});

// Active project with multiple job cards
export const activeProject: Project = createProject({
  id: 'project-active',
  name: 'Active Website Project',
  description: 'Full-stack web application development',
  status: ProjectStatus.ACTIVE,
  allocatedHours: 200,
  usedHours: 85.5,
  teamMembers: [freelancerUser.id, freelancerUser2.id],
  settings: {
    allowOvertime: true,
    requireFileUpload: true,
    autoStop: false
  }
});

// Job cards for active project
export const activeJobCards: JobCard[] = [
  createJobCard(activeProject.id, {
    id: 'job-frontend',
    title: 'Frontend Development',
    description: 'React component development and styling',
    status: JobCardStatus.IN_PROGRESS,
    assignedTo: freelancerUser.id,
    allocatedHours: 40,
    usedHours: 25.5,
    priority: 'high',
    tags: ['frontend', 'react', 'typescript']
  }),
  createJobCard(activeProject.id, {
    id: 'job-backend',
    title: 'Backend API Development',
    description: 'RESTful API development with Node.js',
    status: JobCardStatus.IN_PROGRESS,
    assignedTo: freelancerUser2.id,
    allocatedHours: 35,
    usedHours: 18.0,
    priority: 'high',
    tags: ['backend', 'nodejs', 'api']
  }),
  createJobCard(activeProject.id, {
    id: 'job-testing',
    title: 'Unit Testing',
    description: 'Comprehensive test suite development',
    status: JobCardStatus.TODO,
    assignedTo: freelancerUser.id,
    allocatedHours: 20,
    usedHours: 0,
    priority: 'medium',
    tags: ['testing', 'jest', 'vitest']
  }),
  createJobCard(activeProject.id, {
    id: 'job-documentation',
    title: 'Project Documentation',
    description: 'API documentation and user guides',
    status: JobCardStatus.COMPLETED,
    assignedTo: freelancerUser2.id,
    allocatedHours: 15,
    usedHours: 12.0,
    priority: 'low',
    tags: ['documentation', 'markdown']
  })
];

// Project with exceeded time allocation
export const exceededProject: Project = createProject({
  id: 'project-exceeded',
  name: 'Overtime Project',
  description: 'Project that has exceeded time allocation',
  status: ProjectStatus.ACTIVE,
  allocatedHours: 50,
  usedHours: 72.5,
  teamMembers: [freelancerUser.id],
  settings: {
    allowOvertime: true,
    requireFileUpload: true,
    autoStop: false
  }
});

// Job card with exceeded time
export const exceededJobCard: JobCard = createJobCard(exceededProject.id, {
  id: 'job-exceeded',
  title: 'Complex Feature Implementation',
  description: 'Feature that took longer than expected',
  status: JobCardStatus.IN_PROGRESS,
  assignedTo: freelancerUser.id,
  allocatedHours: 20,
  usedHours: 28.5,
  priority: 'high',
  tags: ['complex', 'overtime']
});

// Project with no time allocation
export const noAllocationProject: Project = createProject({
  id: 'project-no-allocation',
  name: 'No Allocation Project',
  description: 'Project without time allocation',
  status: ProjectStatus.ACTIVE,
  allocatedHours: 0,
  usedHours: 5.5,
  teamMembers: [freelancerUser.id]
});

// Job card with no allocation
export const noAllocationJobCard: JobCard = createJobCard(noAllocationProject.id, {
  id: 'job-no-allocation',
  title: 'Exploratory Work',
  description: 'Research and exploration task',
  status: JobCardStatus.IN_PROGRESS,
  assignedTo: freelancerUser.id,
  allocatedHours: 0,
  usedHours: 2.5,
  priority: 'medium',
  tags: ['research', 'exploration']
});

// Completed project
export const completedProject: Project = createProject({
  id: 'project-completed',
  name: 'Completed Project',
  description: 'Successfully completed project',
  status: ProjectStatus.COMPLETED,
  allocatedHours: 80,
  usedHours: 75.0,
  teamMembers: [freelancerUser.id, freelancerUser2.id],
  endDate: new Date('2024-03-31')
});

// Project with restricted access
export const restrictedProject: Project = createProject({
  id: 'project-restricted',
  name: 'Restricted Access Project',
  description: 'Project with limited team access',
  status: ProjectStatus.ACTIVE,
  allocatedHours: 60,
  usedHours: 15.0,
  teamMembers: [freelancerUser2.id], // freelancerUser is NOT a member
  settings: {
    allowOvertime: false,
    requireFileUpload: true,
    autoStop: true
  }
});

// Job card for restricted project
export const restrictedJobCard: JobCard = createJobCard(restrictedProject.id, {
  id: 'job-restricted',
  title: 'Restricted Task',
  description: 'Task with restricted access',
  status: JobCardStatus.IN_PROGRESS,
  assignedTo: freelancerUser2.id, // Not assigned to freelancerUser
  allocatedHours: 12,
  usedHours: 4.0,
  priority: 'medium',
  tags: ['restricted', 'limited-access']
});

// Project collections for different test scenarios
export const allProjects = [
  activeProject,
  exceededProject,
  noAllocationProject,
  completedProject,
  restrictedProject
];

export const activeProjects = allProjects.filter(p => p.status === ProjectStatus.ACTIVE);

// Job card collections
export const allJobCards = [
  ...activeJobCards,
  exceededJobCard,
  noAllocationJobCard,
  restrictedJobCard
];

export const activeJobCardsAll = allJobCards.filter(jc => 
  jc.status === JobCardStatus.IN_PROGRESS || jc.status === JobCardStatus.TODO
);

// Project access scenarios for testing
export const projectAccessScenarios = [
  {
    name: 'User assigned to project and job card',
    user: freelancerUser,
    project: activeProject,
    jobCard: activeJobCards[0], // Frontend job assigned to freelancerUser
    hasProjectAccess: true,
    hasJobCardAccess: true,
    canStartTimer: true
  },
  {
    name: 'User not assigned to job card',
    user: freelancerUser,
    project: activeProject,
    jobCard: activeJobCards[1], // Backend job assigned to freelancerUser2
    hasProjectAccess: true,
    hasJobCardAccess: false,
    canStartTimer: false
  },
  {
    name: 'User not member of project',
    user: freelancerUser,
    project: restrictedProject,
    jobCard: restrictedJobCard,
    hasProjectAccess: false,
    hasJobCardAccess: false,
    canStartTimer: false
  },
  {
    name: 'Admin with override access',
    user: adminUser,
    project: restrictedProject,
    jobCard: restrictedJobCard,
    hasProjectAccess: true, // Admin override
    hasJobCardAccess: true, // Admin override
    canStartTimer: true
  },
  {
    name: 'Client viewing own project',
    user: clientUser,
    project: activeProject,
    jobCard: activeJobCards[0],
    hasProjectAccess: true, // Client owns project
    hasJobCardAccess: false, // Cannot work on tasks
    canStartTimer: false
  }
];

// Time allocation scenarios
export const timeAllocationScenarios = [
  {
    name: 'Normal allocation with remaining time',
    jobCard: activeJobCards[0], // 40h allocated, 25.5h used
    allocatedHours: 40,
    usedHours: 25.5,
    remainingHours: 14.5,
    progressPercentage: 63.75,
    isExceeded: false
  },
  {
    name: 'Exceeded allocation',
    jobCard: exceededJobCard, // 20h allocated, 28.5h used
    allocatedHours: 20,
    usedHours: 28.5,
    remainingHours: -8.5,
    progressPercentage: 142.5,
    isExceeded: true
  },
  {
    name: 'No allocation',
    jobCard: noAllocationJobCard, // 0h allocated, 2.5h used
    allocatedHours: 0,
    usedHours: 2.5,
    remainingHours: 0,
    progressPercentage: 0,
    isExceeded: false
  },
  {
    name: 'Completed task',
    jobCard: activeJobCards[3], // 15h allocated, 12h used, completed
    allocatedHours: 15,
    usedHours: 12.0,
    remainingHours: 3.0,
    progressPercentage: 80.0,
    isExceeded: false
  }
];

// Project factory for dynamic test creation
export const createTestProject = (overrides: Partial<Project> = {}): Project => {
  return createProject({
    id: `test-project-${Date.now()}`,
    name: `Test Project ${Date.now()}`,
    ...overrides
  });
};

// Job card factory for dynamic test creation
export const createTestJobCard = (projectId: string, overrides: Partial<JobCard> = {}): JobCard => {
  return createJobCard(projectId, {
    id: `test-job-${Date.now()}`,
    title: `Test Task ${Date.now()}`,
    ...overrides
  });
};

// Edge case projects for negative testing
export const edgeCaseProjects = {
  nullProject: null,
  undefinedProject: undefined,
  emptyProject: {} as Project,
  projectWithMissingFields: {
    id: 'partial-project',
    name: 'Partial Project'
  } as Project,
  projectWithInvalidStatus: createProject({
    status: 'INVALID_STATUS' as ProjectStatus
  })
};

// Edge case job cards for negative testing
export const edgeCaseJobCards = {
  nullJobCard: null,
  undefinedJobCard: undefined,
  emptyJobCard: {} as JobCard,
  jobCardWithMissingFields: {
    id: 'partial-job',
    title: 'Partial Job'
  } as JobCard,
  jobCardWithInvalidStatus: createJobCard('test-project', {
    status: 'INVALID_STATUS' as JobCardStatus
  })
};

export default {
  activeProject,
  exceededProject,
  noAllocationProject,
  completedProject,
  restrictedProject,
  activeJobCards,
  exceededJobCard,
  noAllocationJobCard,
  restrictedJobCard,
  allProjects,
  activeProjects,
  allJobCards,
  activeJobCardsAll,
  projectAccessScenarios,
  timeAllocationScenarios,
  createTestProject,
  createTestJobCard,
  edgeCaseProjects,
  edgeCaseJobCards
};