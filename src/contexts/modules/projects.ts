import { Project, User, JobCard } from '../../types';

/**
 * Project access control functions for timer assignment validation
 */

/**
 * Check if a user can start a timer on a specific job card
 * @param project - The project containing the job card
 * @param jobCardId - The ID of the job card
 * @param user - The user attempting to start the timer
 * @returns boolean indicating if the user can start the timer
 */
export const canUserStartTimerOnJobCard = (
  project: Project | null, 
  jobCardId: string, 
  user: User
): boolean => {
  if (!project || !user) return false;
  
  // Find the specific job card
  const jobCard = project.jobCards?.find(jc => jc.id === jobCardId);
  if (!jobCard) return false;
  
  // Admin users can start timers on any job card
  if (user.role === 'ADMIN') return true;
  
  // Check if user is assigned to this specific job card
  if (jobCard.assignedArchitectIds && jobCard.assignedArchitectIds.includes(user.id)) {
    return true;
  }
  
  // Check if user is the project lead architect
  if (project.leadArchitectId === user.id) return true;
  
  // Check if user is in the project team
  if (project.assignedTeamIds && project.assignedTeamIds.includes(user.id)) return true;
  
  return false;
};

/**
 * Get task hours information for a job card
 * @param project - The project containing the job card
 * @param jobCardId - The ID of the job card
 * @returns object with assigned and remaining hours
 */
export const getTaskHoursForJobCard = (
  project: Project, 
  jobCardId: string
): { assigned: number; remaining: number } => {
  const jobCard = project.jobCards?.find(jc => jc.id === jobCardId);
  
  if (!jobCard) {
    return { assigned: 0, remaining: 0 };
  }
  
  const assigned = jobCard.allocatedHours || 0;
  
  // Calculate time already logged
  const timeLogged = (jobCard.timeLogs || []).reduce((total, log) => {
    return total + (log.durationMinutes || 0);
  }, 0);
  
  const timeLoggedHours = timeLogged / 60;
  const remaining = Math.max(0, assigned - timeLoggedHours);
  
  return { assigned, remaining };
};

/**
 * Check if a user can edit a specific project
 * @param project - The project to check
 * @param user - The user attempting to edit
 * @returns boolean indicating if the user can edit
 */
export const canEditProject = (project: Project, user: User): boolean => {
  if (!project || !user) return false;
  
  // Admin users can edit any project
  if (user.role === 'ADMIN') return true;
  
  // Lead architect can edit the project
  if (project.leadArchitectId === user.id) return true;
  
  // Team members can edit assigned projects
  if (project.assignedTeamIds && project.assignedTeamIds.includes(user.id)) return true;
  
  return false;
};

/**
 * Get all projects a user has access to
 * @param projects - Array of all projects
 * @param user - The user to check access for
 * @returns array of projects the user can access
 */
export const getUserAccessibleProjects = (projects: Project[], user: User): Project[] => {
  if (!user) return [];
  
  // Admin users can access all projects
  if (user.role === 'ADMIN') return projects;
  
  return projects.filter(project => {
    // Client can access their own projects
    if (user.role === 'CLIENT' && project.clientId === user.id) return true;
    
    // Lead architect can access their projects
    if (project.leadArchitectId === user.id) return true;
    
    // Team members can access assigned projects
    if (project.assignedTeamIds && project.assignedTeamIds.includes(user.id)) return true;
    
    return false;
  });
};

/**
 * Project operations placeholder functions (to be implemented as needed)
 */
export const useProjectOperations = () => {
  return {
    updateProject: async (projectId: string, updateData: Partial<Project>, user: User) => {
      // Implementation would go here
      console.log('updateProject called', { projectId, updateData, user });
    },
    deleteProject: async (projectId: string, user: User) => {
      // Implementation would go here
      console.log('deleteProject called', { projectId, user });
    },
    updateProjectStatus: async (projectId: string, status: string, user: User) => {
      // Implementation would go here
      console.log('updateProjectStatus called', { projectId, status, user });
    },
    updateJobCardStatus: async (projectId: string, jobCardId: string, status: string, user: User) => {
      // Implementation would go here
      console.log('updateJobCardStatus called', { projectId, jobCardId, status, user });
    },
    updateJobCard: async (projectId: string, jobCardId: string, jobCardData: Partial<JobCard>, user: User) => {
      // Implementation would go here
      console.log('updateJobCard called', { projectId, jobCardId, jobCardData, user });
    },
    addActionItemToProject: async (projectId: string, actionItemData: any, user: User) => {
      // Implementation would go here
      console.log('addActionItemToProject called', { projectId, actionItemData, user });
    },
    updateActionItem: async (projectId: string, actionItemId: string, updates: any, user: User) => {
      // Implementation would go here
      console.log('updateActionItem called', { projectId, actionItemId, updates, user });
    },
    deleteActionItem: async (projectId: string, actionItemId: string, user: User) => {
      // Implementation would go here
      console.log('deleteActionItem called', { projectId, actionItemId, user });
    }
  };
};