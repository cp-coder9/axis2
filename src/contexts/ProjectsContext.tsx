import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Project, Job, Task, User, ProjectBaseline, TaskDependency, ResourceAssignment, BaselineComparison, ResourceConflict, ResourceLevelingResult, SchedulingCalculation, CriticalPathResult, ScheduleEfficiency } from '@/types';
import { ProjectTemplate } from '@/services/projectTemplateService';
import {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addJobCardToProject,
    updateJobCard,
    getProjectStatistics
} from '@/services/projectService';
import {
    getJobsByProject,
    getJobById,
    createJob,
    updateJob,
    deleteJob
} from '@/services/jobService';
import {
    getTasksByJob,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
} from '@/services/taskService';
import {
    getProjectTemplates,
    createProjectTemplate,
    getProjectTemplateById,
    updateProjectTemplate,
    deleteProjectTemplate,
    applyProjectTemplate
} from '@/services/projectTemplateService';
import {
    createProjectBaseline,
    getProjectBaselines,
    getProjectBaselineById,
    updateProjectBaseline,
    deleteProjectBaseline,
    compareProjectWithBaseline,
    getProjectBaselineSummary
} from '@/services/projectBaselineService';
import {
    createTaskDependency,
    getTaskDependencies,
    getProjectDependencies,
    updateTaskDependency,
    deleteTaskDependency,
    createBulkDependencies,
    getCriticalDependencies,
    recalculateTaskDates
} from '@/services/taskDependencyService';
import {
    createResourceAssignment,
    getProjectResourceAssignments,
    updateResourceAssignment,
    deleteResourceAssignment,
    checkResourceConflicts,
    performResourceLeveling
} from '@/services/resourceService';
import {
    calculateForwardPass,
    calculateBackwardPass,
    calculateCriticalPath,
    validateDependencies
} from '@/utils/scheduling/schedulingEngine';

interface ProjectsState {
    projects: Project[];
    jobs: Job[];
    tasks: Task[];
    templates: ProjectTemplate[];
    // Scheduling state - organized by project
    baselines: Record<string, ProjectBaseline[]>; // projectId -> baselines
    dependencies: Record<string, TaskDependency[]>; // projectId -> dependencies
    resourceAssignments: Record<string, ResourceAssignment[]>; // projectId -> assignments
    schedulingCalculations: Record<string, SchedulingCalculation>; // projectId -> calculations
    loading: {
        projects: boolean;
        jobs: boolean;
        tasks: boolean;
        templates: boolean;
        baselines: boolean;
        dependencies: boolean;
        resourceAssignments: boolean;
        scheduling: boolean;
    };
    error: string | null;
    selectedProject: Project | null;
    selectedJob: Job | null;
}

type ProjectsAction =
    | { type: 'SET_LOADING'; payload: { key: keyof ProjectsState['loading']; value: boolean } }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_PROJECTS'; payload: Project[] }
    | { type: 'ADD_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: Project }
    | { type: 'DELETE_PROJECT'; payload: string }
    | { type: 'SET_JOBS'; payload: Job[] }
    | { type: 'ADD_JOB'; payload: Job }
    | { type: 'UPDATE_JOB'; payload: Job }
    | { type: 'DELETE_JOB'; payload: string }
    | { type: 'SET_TASKS'; payload: Task[] }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'SET_TEMPLATES'; payload: ProjectTemplate[] }
    | { type: 'ADD_TEMPLATE'; payload: ProjectTemplate }
    | { type: 'UPDATE_TEMPLATE'; payload: ProjectTemplate }
    | { type: 'DELETE_TEMPLATE'; payload: string }
    | { type: 'SET_SELECTED_PROJECT'; payload: Project | null }
    | { type: 'SET_SELECTED_JOB'; payload: Job | null }
    // Scheduling actions
    | { type: 'SET_BASELINES'; payload: { projectId: string; baselines: ProjectBaseline[] } }
    | { type: 'ADD_BASELINE'; payload: { projectId: string; baseline: ProjectBaseline } }
    | { type: 'UPDATE_BASELINE'; payload: { projectId: string; baselineId: string; updates: Partial<ProjectBaseline> } }
    | { type: 'DELETE_BASELINE'; payload: { projectId: string; baselineId: string } }
    | { type: 'SET_DEPENDENCIES'; payload: { projectId: string; dependencies: TaskDependency[] } }
    | { type: 'ADD_DEPENDENCY'; payload: { projectId: string; dependency: TaskDependency } }
    | { type: 'UPDATE_DEPENDENCY'; payload: { projectId: string; dependencyId: string; updates: Partial<TaskDependency> } }
    | { type: 'DELETE_DEPENDENCY'; payload: { projectId: string; dependencyId: string } }
    | { type: 'SET_RESOURCE_ASSIGNMENTS'; payload: { projectId: string; assignments: ResourceAssignment[] } }
    | { type: 'ADD_RESOURCE_ASSIGNMENT'; payload: { projectId: string; assignment: ResourceAssignment } }
    | { type: 'UPDATE_RESOURCE_ASSIGNMENT'; payload: { projectId: string; assignmentId: string; updates: Partial<ResourceAssignment> } }
    | { type: 'DELETE_RESOURCE_ASSIGNMENT'; payload: { projectId: string; assignmentId: string } }
    | { type: 'SET_SCHEDULING_CALCULATIONS'; payload: { projectId: string; calculations: SchedulingCalculation } };

const initialState: ProjectsState = {
    projects: [],
    jobs: [],
    tasks: [],
    templates: [],
    // Scheduling state
    baselines: {},
    dependencies: {},
    resourceAssignments: {},
    schedulingCalculations: {},
    loading: {
        projects: false,
        jobs: false,
        tasks: false,
        templates: false,
        baselines: false,
        dependencies: false,
        resourceAssignments: false,
        scheduling: false,
    },
    error: null,
    selectedProject: null,
    selectedJob: null,
};

function projectsReducer(state: ProjectsState, action: ProjectsAction): ProjectsState {
    switch (action.type) {
        case 'SET_LOADING':
            return {
                ...state,
                loading: { ...state.loading, [action.payload.key]: action.payload.value },
            };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'SET_PROJECTS':
            return { ...state, projects: action.payload };

        case 'ADD_PROJECT':
            return { ...state, projects: [...state.projects, action.payload] };

        case 'UPDATE_PROJECT':
            return {
                ...state,
                projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
                selectedProject: state.selectedProject?.id === action.payload.id ? action.payload : state.selectedProject,
            };

        case 'DELETE_PROJECT':
            return {
                ...state,
                projects: state.projects.filter(p => p.id !== action.payload),
                selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject,
            };

        case 'SET_JOBS':
            return { ...state, jobs: action.payload };

        case 'ADD_JOB':
            return { ...state, jobs: [...state.jobs, action.payload] };

        case 'UPDATE_JOB':
            return {
                ...state,
                jobs: state.jobs.map(j => j.id === action.payload.id ? action.payload : j),
                selectedJob: state.selectedJob?.id === action.payload.id ? action.payload : state.selectedJob,
            };

        case 'DELETE_JOB':
            return {
                ...state,
                jobs: state.jobs.filter(j => j.id !== action.payload),
                selectedJob: state.selectedJob?.id === action.payload ? null : state.selectedJob,
            };

        case 'SET_TASKS':
            return { ...state, tasks: action.payload };

        case 'ADD_TASK':
            return { ...state, tasks: [...state.tasks, action.payload] };

        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
            };

        case 'DELETE_TASK':
            return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };

        case 'SET_TEMPLATES':
            return { ...state, templates: action.payload };

        case 'ADD_TEMPLATE':
            return { ...state, templates: [...state.templates, action.payload] };

        case 'UPDATE_TEMPLATE':
            return {
                ...state,
                templates: state.templates.map(t => t.id === action.payload.id ? action.payload : t),
            };

        case 'DELETE_TEMPLATE':
            return { ...state, templates: state.templates.filter(t => t.id !== action.payload) };

        case 'SET_SELECTED_PROJECT':
            return { ...state, selectedProject: action.payload };

        case 'SET_SELECTED_JOB':
            return { ...state, selectedJob: action.payload };

        // Scheduling cases
        case 'SET_BASELINES':
            return {
                ...state,
                baselines: {
                    ...state.baselines,
                    [action.payload.projectId]: action.payload.baselines
                }
            };

        case 'ADD_BASELINE':
            return {
                ...state,
                baselines: {
                    ...state.baselines,
                    [action.payload.projectId]: [
                        ...(state.baselines[action.payload.projectId] || []),
                        action.payload.baseline
                    ]
                }
            };

        case 'UPDATE_BASELINE':
            return {
                ...state,
                baselines: {
                    ...state.baselines,
                    [action.payload.projectId]: (state.baselines[action.payload.projectId] || []).map(b =>
                        b.id === action.payload.baselineId ? { ...b, ...action.payload.updates } : b
                    )
                }
            };

        case 'DELETE_BASELINE':
            return {
                ...state,
                baselines: {
                    ...state.baselines,
                    [action.payload.projectId]: (state.baselines[action.payload.projectId] || []).filter(b =>
                        b.id !== action.payload.baselineId
                    )
                }
            };

        case 'SET_DEPENDENCIES':
            return {
                ...state,
                dependencies: {
                    ...state.dependencies,
                    [action.payload.projectId]: action.payload.dependencies
                }
            };

        case 'ADD_DEPENDENCY':
            return {
                ...state,
                dependencies: {
                    ...state.dependencies,
                    [action.payload.projectId]: [
                        ...(state.dependencies[action.payload.projectId] || []),
                        action.payload.dependency
                    ]
                }
            };

        case 'UPDATE_DEPENDENCY':
            return {
                ...state,
                dependencies: {
                    ...state.dependencies,
                    [action.payload.projectId]: (state.dependencies[action.payload.projectId] || []).map(d =>
                        d.id === action.payload.dependencyId ? { ...d, ...action.payload.updates } : d
                    )
                }
            };

        case 'DELETE_DEPENDENCY':
            return {
                ...state,
                dependencies: {
                    ...state.dependencies,
                    [action.payload.projectId]: (state.dependencies[action.payload.projectId] || []).filter(d =>
                        d.id !== action.payload.dependencyId
                    )
                }
            };

        case 'SET_RESOURCE_ASSIGNMENTS':
            return {
                ...state,
                resourceAssignments: {
                    ...state.resourceAssignments,
                    [action.payload.projectId]: action.payload.assignments
                }
            };

        case 'ADD_RESOURCE_ASSIGNMENT':
            return {
                ...state,
                resourceAssignments: {
                    ...state.resourceAssignments,
                    [action.payload.projectId]: [
                        ...(state.resourceAssignments[action.payload.projectId] || []),
                        action.payload.assignment
                    ]
                }
            };

        case 'UPDATE_RESOURCE_ASSIGNMENT':
            return {
                ...state,
                resourceAssignments: {
                    ...state.resourceAssignments,
                    [action.payload.projectId]: (state.resourceAssignments[action.payload.projectId] || []).map(ra =>
                        ra.id === action.payload.assignmentId ? { ...ra, ...action.payload.updates } : ra
                    )
                }
            };

        case 'DELETE_RESOURCE_ASSIGNMENT':
            return {
                ...state,
                resourceAssignments: {
                    ...state.resourceAssignments,
                    [action.payload.projectId]: (state.resourceAssignments[action.payload.projectId] || []).filter(ra =>
                        ra.id !== action.payload.assignmentId
                    )
                }
            };

        case 'SET_SCHEDULING_CALCULATIONS':
            return {
                ...state,
                schedulingCalculations: {
                    ...state.schedulingCalculations,
                    [action.payload.projectId]: action.payload.calculations
                }
            };

        default:
            return state;
    }
}

interface ProjectsContextType {
    state: ProjectsState;
    // Project operations
    loadProjects: () => Promise<void>;
    createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
    updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    selectProject: (project: Project | null) => void;

    // Job operations
    loadJobsByProject: (projectId: string) => Promise<void>;
    createJob: (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
    updateJob: (jobId: string, updates: Partial<Job>) => Promise<void>;
    deleteJob: (jobId: string) => Promise<void>;
    selectJob: (job: Job | null) => void;

    // Task operations
    loadTasksByJob: (jobId: string) => Promise<void>;
    createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    assignTask: (taskId: string, userId: string) => Promise<void>;
    updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;

    // Template operations
    loadTemplates: () => Promise<void>;
    createTemplate: (templateData: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectTemplate>;
    updateTemplate: (templateId: string, updates: Partial<ProjectTemplate>) => Promise<void>;
    deleteTemplate: (templateId: string) => Promise<void>;
    applyTemplate: (templateId: string, projectId: string) => Promise<void>;

    // Hierarchical data fetching
    loadProjectHierarchy: (projectId: string) => Promise<void>;
    loadJobHierarchy: (jobId: string) => Promise<void>;

    // Utility functions
    getProjectById: (projectId: string) => Project | undefined;
    getJobById: (jobId: string) => Job | undefined;
    getTaskById: (taskId: string) => Task | undefined;
    getJobsByProject: (projectId: string) => Job[];
    getTasksByJob: (jobId: string) => Task[];
    getTasksByProject: (projectId: string) => Task[];

    // Scheduling operations
    loadProjectBaselines: (projectId: string) => Promise<void>;
    createBaseline: (projectId: string, name: string, description?: string) => Promise<ProjectBaseline>;
    updateBaseline: (projectId: string, baselineId: string, updates: Partial<ProjectBaseline>) => Promise<void>;
    deleteBaseline: (projectId: string, baselineId: string) => Promise<void>;
    compareWithBaseline: (projectId: string, baselineId: string) => Promise<BaselineComparison>;

    loadTaskDependencies: (projectId: string) => Promise<void>;
    createDependency: (dependency: Omit<TaskDependency, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TaskDependency>;
    updateDependency: (projectId: string, dependencyId: string, updates: Partial<TaskDependency>) => Promise<void>;
    deleteDependency: (projectId: string, dependencyId: string) => Promise<void>;

    loadResourceAssignments: (projectId: string) => Promise<void>;
    createResourceAssignment: (assignment: Omit<ResourceAssignment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ResourceAssignment>;
    updateResourceAssignment: (projectId: string, assignmentId: string, updates: Partial<ResourceAssignment>) => Promise<void>;
    deleteResourceAssignment: (projectId: string, assignmentId: string) => Promise<void>;
    checkResourceConflicts: (projectId: string, resourceId: string, startDate: Date, endDate: Date) => Promise<ResourceConflict[]>;
    performResourceLeveling: (projectId: string) => Promise<ResourceLevelingResult>;

    calculateSchedule: (projectId: string) => Promise<SchedulingCalculation>;
    getCriticalPath: (projectId: string) => Promise<CriticalPathResult>;
    getScheduleEfficiency: (projectId: string) => Promise<ScheduleEfficiency>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

interface ProjectsProviderProps {
    children: ReactNode;
    currentUser: User;
}

export const ProjectsProvider: React.FC<ProjectsProviderProps> = ({ children, currentUser }) => {
    const [state, dispatch] = useReducer(projectsReducer, initialState);

    // Project operations
    const loadProjects = async () => {
        dispatch({ type: 'SET_LOADING', payload: { key: 'projects', value: true } });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const projects = await getAllProjects();
            dispatch({ type: 'SET_PROJECTS', payload: projects });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load projects' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'projects', value: false } });
        }
    };

    const createProjectOp = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
        const projectId = await createProject(projectData, currentUser);
        const project = await getProjectById(projectId);
        if (project) {
            dispatch({ type: 'ADD_PROJECT', payload: project });
            return project;
        }
        throw new Error('Failed to retrieve created project');
    };

    const updateProjectOp = async (projectId: string, updates: Partial<Project>) => {
        await updateProject(projectId, updates);
        const updatedProject = await getProjectById(projectId);
        if (updatedProject) {
            dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
        }
    };

    const deleteProjectOp = async (projectId: string) => {
        await deleteProject(projectId);
        dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    };

    const selectProject = (project: Project | null) => {
        dispatch({ type: 'SET_SELECTED_PROJECT', payload: project });
    };

    // Job operations
    const loadJobsByProject = async (projectId: string) => {
        dispatch({ type: 'SET_LOADING', payload: { key: 'jobs', value: true } });

        try {
            const jobs = await getJobsByProject(projectId);
            dispatch({ type: 'SET_JOBS', payload: jobs });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load jobs' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'jobs', value: false } });
        }
    };

    const createJobOp = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
        const jobId = await createJob(jobData.projectId, jobData, currentUser);
        const job = await getJobById(jobId);
        if (job) {
            dispatch({ type: 'ADD_JOB', payload: job });
            return job;
        }
        throw new Error('Failed to retrieve created job');
    };

    const updateJobOp = async (jobId: string, updates: Partial<Job>) => {
        await updateJob(jobId, updates);
        const updatedJob = await getJobById(jobId);
        if (updatedJob) {
            dispatch({ type: 'UPDATE_JOB', payload: updatedJob });
        }
    };

    const deleteJobOp = async (jobId: string) => {
        await deleteJob(jobId);
        dispatch({ type: 'DELETE_JOB', payload: jobId });
    };

    const selectJob = (job: Job | null) => {
        dispatch({ type: 'SET_SELECTED_JOB', payload: job });
    };

    // Task operations
    const loadTasksByJob = async (jobId: string) => {
        dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: true } });

        try {
            const tasks = await getTasksByJob(jobId);
            dispatch({ type: 'SET_TASKS', payload: tasks });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load tasks' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: false } });
        }
    };

    const createTaskOp = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        const taskId = await createTask(taskData.jobId, taskData, currentUser);
        const task = await getTaskById(taskId);
        if (task) {
            dispatch({ type: 'ADD_TASK', payload: task });
            return task;
        }
        throw new Error('Failed to retrieve created task');
    };

    const updateTaskOp = async (taskId: string, updates: Partial<Task>) => {
        await updateTask(taskId, updates);
        const updatedTask = await getTaskById(taskId);
        if (updatedTask) {
            dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
        }
    };

    const deleteTaskOp = async (taskId: string) => {
        await deleteTask(taskId);
        dispatch({ type: 'DELETE_TASK', payload: taskId });
    };

    const assignTask = async (taskId: string, userId: string) => {
        await updateTask(taskId, { assignedToId: userId });
        const updatedTask = await getTaskById(taskId);
        if (updatedTask) {
            dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
        }
    };

    const updateTaskStatus = async (taskId: string, status: Task['status']) => {
        await updateTask(taskId, { status });
        const updatedTask = await getTaskById(taskId);
        if (updatedTask) {
            dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
        }
    };

    // Template operations
    const loadTemplates = async () => {
        dispatch({ type: 'SET_LOADING', payload: { key: 'templates', value: true } });

        try {
            const templates = await getProjectTemplates(currentUser.id, currentUser.role);
            dispatch({ type: 'SET_TEMPLATES', payload: templates });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load templates' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'templates', value: false } });
        }
    };

    const createTemplateOp = async (templateData: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
        // For creating templates, we need a projectId - this should be handled differently
        // For now, we'll assume templateData includes the necessary projectId
        const templateId = await createProjectTemplate('dummy-project-id', {
            name: templateData.name,
            description: templateData.description,
            isPublic: templateData.isPublic
        }, currentUser);
        const template = await getProjectTemplateById(templateId);
        if (template) {
            dispatch({ type: 'ADD_TEMPLATE', payload: template });
            return template;
        }
        throw new Error('Failed to retrieve created template');
    };

    const updateTemplateOp = async (templateId: string, updates: Partial<ProjectTemplate>) => {
        await updateProjectTemplate(templateId, updates);
        const updatedTemplate = await getProjectTemplateById(templateId);
        if (updatedTemplate) {
            dispatch({ type: 'UPDATE_TEMPLATE', payload: updatedTemplate });
        }
    };

    const deleteTemplateOp = async (templateId: string) => {
        await deleteProjectTemplate(templateId);
        dispatch({ type: 'DELETE_TEMPLATE', payload: templateId });
    };

    const applyTemplate = async (templateId: string, projectId: string) => {
        await applyProjectTemplate(templateId, projectId);
        // Reload jobs and tasks for the project
        await loadJobsByProject(projectId);
    };

    // Hierarchical data fetching
    const loadProjectHierarchy = async (projectId: string) => {
        dispatch({ type: 'SET_LOADING', payload: { key: 'projects', value: true } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'jobs', value: true } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: true } });

        try {
            // Load project if not already loaded
            let project = state.projects.find(p => p.id === projectId);
            if (!project) {
                project = await getProjectById(projectId);
                if (project) {
                    dispatch({ type: 'ADD_PROJECT', payload: project });
                }
            }

            // Load all jobs for the project
            const jobs = await getJobsByProject(projectId);
            dispatch({ type: 'SET_JOBS', payload: jobs });

            // Load all tasks for all jobs in the project
            const jobIds = jobs.map(job => job.id);
            const allTasks: Task[] = [];

            for (const jobId of jobIds) {
                const tasks = await getTasksByJob(jobId);
                allTasks.push(...tasks);
            }

            dispatch({ type: 'SET_TASKS', payload: allTasks });

        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load project hierarchy' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'projects', value: false } });
            dispatch({ type: 'SET_LOADING', payload: { key: 'jobs', value: false } });
            dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: false } });
        }
    };

    const loadJobHierarchy = async (jobId: string) => {
        dispatch({ type: 'SET_LOADING', payload: { key: 'jobs', value: true } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: true } });

        try {
            // Load job if not already loaded
            let job = state.jobs.find(j => j.id === jobId);
            if (!job) {
                job = await getJobById(jobId);
                if (job) {
                    dispatch({ type: 'ADD_JOB', payload: job });
                }
            }

            // Load tasks for the job
            const tasks = await getTasksByJob(jobId);
            dispatch({ type: 'SET_TASKS', payload: tasks });

        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load job hierarchy' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'jobs', value: false } });
            dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: false } });
        }
    };

    // Utility functions
    const getProjectById = (projectId: string) => {
        return state.projects.find(p => p.id === projectId);
    };

    const getJobById = (jobId: string) => {
        return state.jobs.find(j => j.id === jobId);
    };

    const getTaskById = (taskId: string) => {
        return state.tasks.find(t => t.id === taskId);
    };

    const getJobsByProject = (projectId: string) => {
        return state.jobs.filter(j => j.projectId === projectId);
    };

    const getTasksByJob = (jobId: string) => {
        return state.tasks.filter(t => t.jobId === jobId);
    };

    const getTasksByProject = (projectId: string) => {
        const projectJobs = getJobsByProject(projectId);
        const jobIds = projectJobs.map(j => j.id);
        return state.tasks.filter(t => jobIds.includes(t.jobId));
    };

    // Scheduling operations
    const loadProjectBaselines = useCallback(async (projectId: string): Promise<void> => {
        try {
            const baselines = await getProjectBaselines(projectId);
            dispatch({ type: 'SET_BASELINES', payload: { projectId, baselines } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load baselines' });
            throw error;
        }
    }, []);

    const createBaselineOp = useCallback(async (projectId: string, name: string, description?: string): Promise<ProjectBaseline> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'baselines', value: true } });
            const tasks = getTasksByProject(projectId);
            const baselineId = await createProjectBaseline(projectId, tasks, name, description);
            const baseline = await getProjectBaselineById(baselineId);
            if (baseline) {
                dispatch({ type: 'ADD_BASELINE', payload: { projectId, baseline } });
                return baseline;
            }
            throw new Error('Failed to retrieve created baseline');
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create baseline' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'baselines', value: false } });
        }
    }, [getTasksByProject]);

    const updateBaselineOp = useCallback(async (projectId: string, baselineId: string, updates: Partial<ProjectBaseline>): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'baselines', value: true } });
            await updateProjectBaseline(baselineId, updates as any);
            dispatch({ type: 'UPDATE_BASELINE', payload: { projectId, baselineId, updates } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update baseline' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'baselines', value: false } });
        }
    }, []);

    const deleteBaselineOp = useCallback(async (projectId: string, baselineId: string): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'baselines', value: true } });
            await deleteProjectBaseline(baselineId);
            dispatch({ type: 'DELETE_BASELINE', payload: { projectId, baselineId } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete baseline' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'baselines', value: false } });
        }
    }, []);

    const compareWithBaseline = useCallback(async (projectId: string, baselineId: string): Promise<BaselineComparison> => {
        try {
            const currentTasks = getTasksByProject(projectId);
            return await compareProjectWithBaseline(projectId, baselineId, currentTasks);
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to compare with baseline' });
            throw error;
        }
    }, [getTasksByProject]);

    const loadTaskDependencies = useCallback(async (projectId: string): Promise<void> => {
        try {
            const dependencies = await getProjectDependencies(projectId);
            dispatch({ type: 'SET_DEPENDENCIES', payload: { projectId, dependencies } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load dependencies' });
            throw error;
        }
    }, []);

    const createDependencyOp = useCallback(async (dependency: Omit<TaskDependency, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskDependency> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'dependencies', value: true } });
            const dependencyId = await createTaskDependency(dependency);
            // Reload dependencies to get the updated list
            const dependencies = await getProjectDependencies(dependency.projectId);
            dispatch({ type: 'SET_DEPENDENCIES', payload: { projectId: dependency.projectId, dependencies } });
            // Find and return the newly created dependency
            const newDependency = dependencies.find(d => d.id === dependencyId);
            if (newDependency) {
                return newDependency;
            }
            throw new Error('Failed to retrieve created dependency');
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create dependency' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'dependencies', value: false } });
        }
    }, []);

    const updateDependencyOp = useCallback(async (projectId: string, dependencyId: string, updates: Partial<TaskDependency>): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'dependencies', value: true } });
            await updateTaskDependency(dependencyId, updates);
            dispatch({ type: 'UPDATE_DEPENDENCY', payload: { projectId, dependencyId, updates } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update dependency' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'dependencies', value: false } });
        }
    }, []);

    const deleteDependencyOp = useCallback(async (projectId: string, dependencyId: string): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'dependencies', value: true } });
            await deleteTaskDependency(dependencyId);
            dispatch({ type: 'DELETE_DEPENDENCY', payload: { projectId, dependencyId } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete dependency' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'dependencies', value: false } });
        }
    }, []);

    const loadResourceAssignments = useCallback(async (projectId: string): Promise<void> => {
        try {
            const assignments = await getProjectResourceAssignments(projectId);
            dispatch({ type: 'SET_RESOURCE_ASSIGNMENTS', payload: { projectId, assignments } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load resource assignments' });
            throw error;
        }
    }, []);

    const createResourceAssignmentOp = useCallback(async (assignment: Omit<ResourceAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResourceAssignment> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: true } });
            const assignmentId = await createResourceAssignment(assignment);
            // Reload assignments to get the updated list
            const assignments = await getProjectResourceAssignments(assignment.taskId); // Using taskId as proxy for projectId
            dispatch({ type: 'SET_RESOURCE_ASSIGNMENTS', payload: { projectId: assignment.taskId, assignments } });
            // Find and return the newly created assignment
            const newAssignment = assignments.find(a => a.id === assignmentId);
            if (newAssignment) {
                return newAssignment;
            }
            throw new Error('Failed to retrieve created assignment');
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create resource assignment' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: false } });
        }
    }, []);

    const updateResourceAssignmentOp = useCallback(async (projectId: string, assignmentId: string, updates: Partial<ResourceAssignment>): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: true } });
            await updateResourceAssignment(assignmentId, updates);
            dispatch({ type: 'UPDATE_RESOURCE_ASSIGNMENT', payload: { projectId, assignmentId, updates } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update resource assignment' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: false } });
        }
    }, []);

    const deleteResourceAssignmentOp = useCallback(async (projectId: string, assignmentId: string): Promise<void> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: true } });
            await deleteResourceAssignment(assignmentId);
            dispatch({ type: 'DELETE_RESOURCE_ASSIGNMENT', payload: { projectId, assignmentId } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete resource assignment' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: false } });
        }
    }, []);

    const checkResourceConflictsOp = useCallback(async (projectId: string, resourceId: string, startDate: Date, endDate: Date): Promise<ResourceConflict[]> => {
        try {
            const result = await checkResourceConflicts(resourceId, startDate, endDate);
            return result.conflicts;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to check resource conflicts' });
            throw error;
        }
    }, []);

    const performResourceLevelingOp = useCallback(async (projectId: string): Promise<ResourceLevelingResult> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: true } });
            const tasks: Task[] = []; // TODO: Get tasks for the project
            const result = await performResourceLeveling(projectId, tasks);
            // Update assignments with leveled results
            dispatch({ type: 'SET_RESOURCE_ASSIGNMENTS', payload: { projectId, assignments: result.leveledAssignments } });
            return result;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to perform resource leveling' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'resourceAssignments', value: false } });
        }
    }, []);

    const calculateSchedule = useCallback(async (projectId: string): Promise<SchedulingCalculation> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: { key: 'scheduling', value: true } });
            const tasks = getTasksByProject(projectId);
            const dependencies = state.dependencies[projectId] || [];
            const calculation: SchedulingCalculation = {
                criticalPath: calculateCriticalPath(tasks, dependencies).map(t => t.id),
                scheduleEfficiency: 0, // TODO: Calculate efficiency
                totalFloat: 0, // TODO: Calculate total float
                projectDuration: 0 // TODO: Calculate project duration
            };
            dispatch({ type: 'SET_SCHEDULING_CALCULATIONS', payload: { projectId, calculations: calculation } });
            return calculation;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to calculate schedule' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'scheduling', value: false } });
        }
    }, [state.dependencies, getTasksByProject]);

    const getCriticalPath = useCallback(async (projectId: string): Promise<CriticalPathResult> => {
        try {
            const tasks = getTasksByProject(projectId);
            const dependencies = state.dependencies[projectId] || [];
            const criticalTasks = calculateCriticalPath(tasks, dependencies);
            return {
                tasks: criticalTasks.map(t => t.id),
                duration: criticalTasks.length,
                efficiency: 0 // TODO: Calculate efficiency
            };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to get critical path' });
            throw error;
        }
    }, [state.dependencies, getTasksByProject]);

    const getScheduleEfficiency = useCallback(async (projectId: string): Promise<ScheduleEfficiency> => {
        try {
            const tasks = getTasksByProject(projectId);
            const dependencies = state.dependencies[projectId] || [];
            const criticalTasks = calculateCriticalPath(tasks, dependencies);
            return {
                efficiency: (criticalTasks.length / tasks.length) * 100,
                totalTasks: tasks.length,
                criticalTasks: criticalTasks.length,
                bottlenecks: [] // TODO: Identify bottlenecks
            };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to get schedule efficiency' });
            throw error;
        }
    }, [state.dependencies, getTasksByProject]);

    const contextValue: ProjectsContextType = {
        state,
        loadProjects,
        createProject: createProjectOp,
        updateProject: updateProjectOp,
        deleteProject: deleteProjectOp,
        selectProject,
        loadJobsByProject,
        createJob: createJobOp,
        updateJob: updateJobOp,
        deleteJob: deleteJobOp,
        selectJob,
        loadTasksByJob,
        createTask: createTaskOp,
        updateTask: updateTaskOp,
        deleteTask: deleteTaskOp,
        assignTask,
        updateTaskStatus,
        loadTemplates,
        createTemplate: createTemplateOp,
        updateTemplate: updateTemplateOp,
        deleteTemplate: deleteTemplateOp,
        applyTemplate,
        loadProjectHierarchy,
        loadJobHierarchy,
        getProjectById,
        getJobById,
        getTaskById,
        getJobsByProject,
        getTasksByJob,
        getTasksByProject,
        // Scheduling methods
        loadProjectBaselines,
        createBaseline: createBaselineOp,
        updateBaseline: updateBaselineOp,
        deleteBaseline: deleteBaselineOp,
        compareWithBaseline,
        loadTaskDependencies,
        createDependency: createDependencyOp,
        updateDependency: updateDependencyOp,
        deleteDependency: deleteDependencyOp,
        loadResourceAssignments,
        createResourceAssignment: createResourceAssignmentOp,
        updateResourceAssignment: updateResourceAssignmentOp,
        deleteResourceAssignment: deleteResourceAssignmentOp,
        checkResourceConflicts: checkResourceConflictsOp,
        performResourceLeveling: performResourceLevelingOp,
        calculateSchedule,
        getCriticalPath,
        getScheduleEfficiency,
    };

    return (
        <ProjectsContext.Provider value={contextValue}>
            {children}
        </ProjectsContext.Provider>
    );
};

export const useProjects = () => {
    const context = useContext(ProjectsContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectsProvider');
    }
    return context;
};

// Custom hooks for specific data fetching
export const useProjectJobs = (projectId: string | null) => {
    const { state, loadJobsByProject } = useProjects();

    useEffect(() => {
        if (projectId) {
            loadJobsByProject(projectId);
        }
    }, [projectId, loadJobsByProject]);

    return {
        jobs: projectId ? state.jobs.filter(j => j.projectId === projectId) : [],
        loading: state.loading.jobs,
    };
};

export const useJobTasks = (jobId: string | null) => {
    const { state, loadTasksByJob } = useProjects();

    useEffect(() => {
        if (jobId) {
            loadTasksByJob(jobId);
        }
    }, [jobId, loadTasksByJob]);

    return {
        tasks: jobId ? state.tasks.filter(t => t.jobId === jobId) : [],
        loading: state.loading.tasks,
    };
};

export const useProjectTasks = (projectId: string | null) => {
    const { getTasksByProject, state } = useProjects();

    return {
        tasks: projectId ? getTasksByProject(projectId) : [],
        loading: state.loading.tasks || state.loading.jobs,
    };
};

export default ProjectsContext;