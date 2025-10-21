import { Project, User, JobCard, ActionItem, ActionItemCreationData, Job } from '../../types';
import { updateProject as updateProjectService, deleteProject as deleteProjectService, updateJobCard as updateJobCardService, getProjectById } from '../../services/projectService';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Project access control functions for timer assignment validation
 */

/**
 * Check if a user can start a timer on a specific task
 * @param project - The project containing the task
 * @param jobId - The ID of the job containing the task
 * @param taskId - The ID of the task
 * @param user - The user attempting to start the timer
 * @returns boolean indicating if the user can start the timer
 */
export const canUserStartTimerOnTask = (
  project: Project | null,
  jobId: string,
  taskId: string,
  user: User
): boolean => {
  if (!project || !user) return false;

  // Find the specific job
  const job = project.jobs?.find(j => j.id === jobId);
  if (!job) return false;

  // Find the specific task
  const task = job.tasks?.find(t => t.id === taskId);
  if (!task) return false;

  // Admin users can start timers on any task
  if (user.role === 'ADMIN') return true;

  // Check if user is assigned to this specific task
  if (task.assignedToId === user.id) return true;

  // Check if user is assigned to the job
  if (job.assignedArchitectIds && job.assignedArchitectIds.includes(user.id)) return true;

  // Check if user is the project lead architect
  if (project.leadArchitectId === user.id) return true;

  // Check if user is in the project team
  if (project.assignedTeamIds && project.assignedTeamIds.includes(user.id)) return true;

  return false;
};

/**
 * Get task hours information for a specific task
 * @param project - The project containing the task
 * @param jobId - The ID of the job containing the task
 * @param taskId - The ID of the task
 * @returns object with assigned and remaining hours
 */
export const getTaskHoursForTask = (
  project: Project,
  jobId: string,
  taskId: string
): { assigned: number; remaining: number } => {
  const job = project.jobs?.find(j => j.id === jobId);
  if (!job) {
    return { assigned: 0, remaining: 0 };
  }

  const task = job.tasks?.find(t => t.id === taskId);
  if (!task) {
    return { assigned: 0, remaining: 0 };
  }

  const assigned = task.allocatedHours || 0;

  // Calculate time already logged
  const timeLogged = (task.timeLogs || []).reduce((total, log) => {
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
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to update project');
        }

        // Update project
        await updateProjectService(projectId, updateData);
        return { success: true };
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    },
    deleteProject: async (projectId: string, user: User) => {
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to delete project');
        }

        // Delete project
        await deleteProjectService(projectId);
        return { success: true };
      } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
    },
    updateProjectStatus: async (projectId: string, status: string, user: User) => {
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to update project status');
        }

        // Update project status
        await updateProjectService(projectId, { status: status as any });
        return { success: true };
      } catch (error) {
        console.error('Error updating project status:', error);
        throw error;
      }
    },
    updateJobCardStatus: async (projectId: string, jobCardId: string, status: string, user: User) => {
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to update job card status');
        }

        // Update job card status
        await updateJobCardService(projectId, jobCardId, { status: status as any });
        return { success: true };
      } catch (error) {
        console.error('Error updating job card status:', error);
        throw error;
      }
    },
    updateJobCard: async (projectId: string, jobCardId: string, jobCardData: Partial<JobCard>, user: User) => {
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to update job card');
        }

        // Update job card - cast to Job type as service expects Job
        await updateJobCardService(projectId, jobCardId, jobCardData as any);
        return { success: true };
      } catch (error) {
        console.error('Error updating job card:', error);
        throw error;
      }
    },
    addActionItemToProject: async (projectId: string, actionItemData: ActionItemCreationData, user: User) => {
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to add action item');
        }

        // Create new action item
        const newActionItem: ActionItem = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: actionItemData.title,
          description: actionItemData.description,
          completed: false,
          assignedTo: actionItemData.assignedTo,
          assignedToName: actionItemData.assignedToName,
          dueDate: actionItemData.dueDate ? Timestamp.fromDate(actionItemData.dueDate) : undefined,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };

        // Add to project
        const currentActionItems = (project as any).actionItems || [];
        await updateProjectService(projectId, {
          actionItems: [...currentActionItems, newActionItem]
        } as any);

        return { success: true, actionItemId: newActionItem.id };
      } catch (error) {
        console.error('Error adding action item:', error);
        throw error;
      }
    },
    updateActionItem: async (projectId: string, actionItemId: string, updates: Partial<ActionItem>, user: User) => {
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to update action item');
        }

        // Update action item
        const currentActionItems = (project as any).actionItems || [];
        const updatedActionItems = currentActionItems.map((item: ActionItem) =>
          item.id === actionItemId
            ? { ...item, ...updates, updatedAt: serverTimestamp() as any }
            : item
        );

        await updateProjectService(projectId, {
          actionItems: updatedActionItems
        } as any);

        return { success: true };
      } catch (error) {
        console.error('Error updating action item:', error);
        throw error;
      }
    },
    deleteActionItem: async (projectId: string, actionItemId: string, user: User) => {
      try {
        // Check permissions
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error('Project not found');
        }

        if (!canEditProject(project, user)) {
          throw new Error('Insufficient permissions to delete action item');
        }

        // Remove action item
        const currentActionItems = (project as any).actionItems || [];
        const updatedActionItems = currentActionItems.filter((item: ActionItem) => item.id !== actionItemId);

        await updateProjectService(projectId, {
          actionItems: updatedActionItems
        } as any);

        return { success: true };
      } catch (error) {
        console.error('Error deleting action item:', error);
        throw error;
      }
    }
  };
};