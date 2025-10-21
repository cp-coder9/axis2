import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    Timestamp,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserRole, JobStatus, TaskStatus, TaskDependency } from '../types';

/**
 * Schedule Template Types - Extended for scheduling features
 */
export interface ScheduleTemplate {
    id: string;
    name: string;
    description: string;
    category: string; // e.g., 'Construction', 'Software Development', 'Marketing'
    createdById: string;
    createdByName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isPublic: boolean;
    estimatedDuration: number; // in days
    jobTemplates: ScheduleJobTemplate[];
}

export interface ScheduleJobTemplate {
    id: string;
    name: string;
    description: string;
    duration: number; // in days
    taskTemplates: ScheduleTaskTemplate[];
}

export interface ScheduleTaskTemplate {
    id: string;
    name: string;
    description: string;
    duration: number; // in days
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dependencies: ScheduleDependencyTemplate[];
    resourceRequirements?: string[]; // e.g., ['Architect', 'Engineer']
}

export interface ScheduleDependencyTemplate {
    predecessorTaskId: string;
    type: 'FS' | 'SS' | 'FF' | 'SF';
    lag?: number; // lag time in days
}

/**
 * Project Template Types
 */
export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    createdById: string;
    createdByName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isPublic: boolean; // Whether other admins can use this template
    jobTemplates: JobTemplate[];
}

export interface JobTemplate {
    id: string;
    name: string;
    description: string;
    estimatedTime?: number;
    taskTemplates: TaskTemplate[];
}

export interface TaskTemplate {
    id: string;
    name: string;
    description: string;
    estimatedTime?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

/**
 * Firebase Project Template Service
 * Handles project template creation, management, and application
 */

const TEMPLATES_COLLECTION = 'projectTemplates';

/**
 * Get all project templates accessible to a user
 */
export const getProjectTemplates = async (userId: string, userRole: UserRole): Promise<ProjectTemplate[]> => {
    try {
        let q: ReturnType<typeof query>;

        if (userRole === UserRole.ADMIN) {
            // Admins can see all templates
            q = query(
                collection(db, TEMPLATES_COLLECTION),
                orderBy('updatedAt', 'desc')
            );
        } else {
            // Non-admins can only see public templates
            q = query(
                collection(db, TEMPLATES_COLLECTION),
                where('isPublic', '==', true),
                orderBy('updatedAt', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        const templates: ProjectTemplate[] = [];

        querySnapshot.forEach((doc) => {
            const templateData = doc.data() as Omit<ProjectTemplate, 'id'>;
            if (templateData) {
                templates.push({
                    id: doc.id,
                    ...templateData,
                    createdAt: templateData.createdAt || serverTimestamp(),
                    updatedAt: templateData.updatedAt || serverTimestamp(),
                } as ProjectTemplate);
            }
        });

        return templates;
    } catch (error) {
        console.error('Error fetching project templates:', error);
        throw new Error('Failed to fetch project templates');
    }
};

/**
 * Get project template by ID
 */
export const getProjectTemplateById = async (templateId: string): Promise<ProjectTemplate | null> => {
    try {
        const templateDoc = await getDoc(doc(db, TEMPLATES_COLLECTION, templateId));

        if (templateDoc.exists()) {
            const templateData = templateDoc.data() as Omit<ProjectTemplate, 'id'>;
            if (templateData) {
                return {
                    id: templateDoc.id,
                    ...templateData,
                    createdAt: templateData.createdAt || serverTimestamp(),
                    updatedAt: templateData.updatedAt || serverTimestamp(),
                } as ProjectTemplate;
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching project template:', error);
        throw new Error('Failed to fetch project template');
    }
};

/**
 * Create a project template from an existing project
 */
export const createProjectTemplate = async (
    projectId: string,
    templateData: {
        name: string;
        description: string;
        isPublic: boolean;
    },
    createdBy: User
): Promise<string> => {
    try {
        // Get the project data to extract structure
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
            throw new Error('Project not found');
        }

        const projectData = projectDoc.data();
        const jobTemplates: JobTemplate[] = [];

        // Extract job and task structure
        if (projectData.jobs && Array.isArray(projectData.jobs)) {
            for (const job of projectData.jobs) {
                const taskTemplates: TaskTemplate[] = [];

                if (job.tasks && Array.isArray(job.tasks)) {
                    for (const task of job.tasks) {
                        taskTemplates.push({
                            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: task.title,
                            description: task.description,
                            estimatedTime: task.estimatedTime,
                            priority: task.priority
                        });
                    }
                }

                jobTemplates.push({
                    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: job.title,
                    description: job.description,
                    estimatedTime: job.estimatedTime,
                    taskTemplates
                });
            }
        }

        const now = serverTimestamp();
        const newTemplate: Omit<ProjectTemplate, 'id'> = {
            name: templateData.name,
            description: templateData.description,
            createdById: createdBy.id,
            createdByName: createdBy.name,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            isPublic: templateData.isPublic,
            jobTemplates
        };

        const docRef = doc(collection(db, TEMPLATES_COLLECTION));
        await setDoc(docRef, newTemplate);

        console.log('Project template created successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating project template:', error);
        throw new Error('Failed to create project template');
    }
};

/**
 * Update project template
 */
export const updateProjectTemplate = async (
    templateId: string,
    updates: Partial<Omit<ProjectTemplate, 'id' | 'createdAt' | 'createdById' | 'createdByName'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, TEMPLATES_COLLECTION, templateId), updateData);

        console.log('Project template updated successfully:', templateId);
    } catch (error) {
        console.error('Error updating project template:', error);
        throw new Error('Failed to update project template');
    }
};

/**
 * Delete project template
 */
export const deleteProjectTemplate = async (templateId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
        console.log('Project template deleted successfully:', templateId);
    } catch (error) {
        console.error('Error deleting project template:', error);
        throw new Error('Failed to delete project template');
    }
};

/**
 * Apply project template to create a new project structure
 */
export const applyProjectTemplate = async (
    templateId: string,
    projectId: string
): Promise<void> => {
    try {
        const template = await getProjectTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Create jobs and tasks based on template
        for (const jobTemplate of template.jobTemplates) {
            // Create job
            const jobData = {
                title: jobTemplate.name,
                description: jobTemplate.description,
                estimatedTime: jobTemplate.estimatedTime,
                status: JobStatus.TODO,
                assignedArchitectIds: [] // Will be set by admin later
            };

            const { createJob } = await import('./jobService');
            const jobId = await createJob(projectId, jobData, { id: 'system', name: 'System', email: 'system@system.com', role: UserRole.ADMIN } as User);

            // Create tasks for this job
            for (const taskTemplate of jobTemplate.taskTemplates) {
                const taskData = {
                    title: taskTemplate.name,
                    description: taskTemplate.description,
                    estimatedTime: taskTemplate.estimatedTime,
                    priority: taskTemplate.priority,
                    status: TaskStatus.TODO,
                    assignedToId: '', // Will be assigned later
                    assignedToName: ''
                };

                const { addTaskToJob } = await import('./jobService');
                await addTaskToJob(jobId, taskData);
            }
        }

        console.log('Project template applied successfully to project:', projectId);
    } catch (error) {
        console.error('Error applying project template:', error);
        throw new Error('Failed to apply project template');
    }
};

/**
 * Schedule Template Service Functions
 */
export const scheduleTemplateService = {
    /**
     * Create a new schedule template
     */
    async createScheduleTemplate(template: Omit<ScheduleTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const templateRef = doc(collection(db, 'scheduleTemplates'));
        const templateData = {
            ...template,
            id: templateRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(templateRef, templateData);
        return templateRef.id;
    },

    /**
     * Get schedule template by ID
     */
    async getScheduleTemplate(templateId: string): Promise<ScheduleTemplate | null> {
        const templateDoc = await getDoc(doc(db, 'scheduleTemplates', templateId));
        if (!templateDoc.exists()) return null;

        return {
            id: templateDoc.id,
            ...templateDoc.data()
        } as ScheduleTemplate;
    },

    /**
     * Get all schedule templates for a user (including public ones)
     */
    async getScheduleTemplates(userId: string): Promise<ScheduleTemplate[]> {
        const q = query(
            collection(db, 'scheduleTemplates'),
            where('createdById', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const publicQ = query(
            collection(db, 'scheduleTemplates'),
            where('isPublic', '==', true),
            orderBy('updatedAt', 'desc')
        );

        const [userTemplates, publicTemplates] = await Promise.all([
            getDocs(q),
            getDocs(publicQ)
        ]);

        const templates: ScheduleTemplate[] = [];

        userTemplates.forEach(doc => {
            templates.push({
                id: doc.id,
                ...doc.data()
            } as ScheduleTemplate);
        });

        publicTemplates.forEach(doc => {
            // Avoid duplicates if user has their own public template
            if (!templates.find(t => t.id === doc.id)) {
                templates.push({
                    id: doc.id,
                    ...doc.data()
                } as ScheduleTemplate);
            }
        });

        return templates;
    },

    /**
     * Update schedule template
     */
    async updateScheduleTemplate(templateId: string, updates: Partial<ScheduleTemplate>): Promise<void> {
        const templateRef = doc(db, 'scheduleTemplates', templateId);
        await updateDoc(templateRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Delete schedule template
     */
    async deleteScheduleTemplate(templateId: string): Promise<void> {
        await deleteDoc(doc(db, 'scheduleTemplates', templateId));
    },

    /**
     * Apply schedule template to create a new project schedule
     */
    async applyScheduleTemplate(templateId: string, projectId: string, startDate: Date): Promise<void> {
        const template = await this.getScheduleTemplate(templateId);
        if (!template) throw new Error('Schedule template not found');

        // This would integrate with the project service to create jobs and tasks
        // For now, we'll just validate the template structure
        console.log('Applying schedule template:', template.name, 'to project:', projectId, 'starting:', startDate);
    }
};