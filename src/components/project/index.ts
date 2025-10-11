// Project Management Components
export { default as JobCard, JobCard as JobCardComponent, TaskCard } from './JobCard'
export { default as ProjectCard, ProjectCard as ProjectCardComponent } from './ProjectCard'
export { default as ProjectTable, ProjectTable as ProjectDataTable, ProjectTable as ProjectTableComponent } from './ProjectTable'
export { default as AdminProjectEditor } from './AdminProjectEditor'

// Workflow Components
export { ProjectWorkflow } from './ProjectWorkflow'
export { ProjectCreationDialog } from './ProjectCreationDialog'
export { ProjectDetailsView } from './ProjectDetailsView'
export { TaskManagementBoard } from './TaskManagementBoard'
export { TimerIntegrationPanel } from './TimerIntegrationPanel'

// Export types
export type {
  JobCardData,
  JobCardActions,
  JobCardProps,
  JobStatus,
  JobPriority,
} from './JobCard'

export type {
  Project,
  User,
  ProjectCardActions,
  ProjectCardProps,
} from './ProjectCard'

export type {
  ProjectTableActions,
  ProjectTableProps,
  ProjectFilters,
} from './ProjectTable'

export type {
  AdminProjectEditorProps,
} from './AdminProjectEditor'

// Re-export shared enums and types
export {
  ProjectStatus,
  UserRole,
  JobCardStatus,
} from '@/types'
