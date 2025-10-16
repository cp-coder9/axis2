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
    writeBatch,
    onSnapshot,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { Job, JobStatus, Task, TaskStatus, User, UserRole } from '../types';
import { MessagingService } from './messaging/MessagingService';
import { ChannelType } from '../types/messaging';
import { NotificationType, NotificationPriority, NotificationCategory } from '../types/notifications';
import { createNotification } from './notificationService';

/**
 * Firebase Job Service
 * Handles all job-related Firestore operations within the hierarchical structure
 */

const JOBS_COLLECTION = 'jobs';
const TASKS_COLLECTION = 'tasks';

/**
 * Get job by ID
 */
export const getJobById = async (jobId: string): Promise<Job | null> => {
    try {
        const jobDoc = await getDoc(doc(db, JOBS_COLLECTION, jobId));

        if (jobDoc.exists()) {
            const jobData = jobDoc.data() as Omit<Job, 'id'>;
            if (jobData) {
                return {
                    id: jobDoc.id,
                    ...jobData,
                    createdAt: jobData.createdAt || serverTimestamp(),
                    updatedAt: jobData.updatedAt || serverTimestamp(),
                } as Job;
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching job:', error);
        throw new Error('Failed to fetch job data');
    }
};

/**
 * Get jobs by project ID
 */
export const getJobsByProject = async (projectId: string): Promise<Job[]> => {
    try {
        const q = query(
            collection(db, JOBS_COLLECTION),
            where('projectId', '==', projectId),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const jobs: Job[] = [];

        querySnapshot.forEach((doc) => {
            const jobData = doc.data() as Omit<Job, 'id'>;
            if (jobData) {
                jobs.push({
                    id: doc.id,
                    ...jobData,
                    createdAt: jobData.createdAt || serverTimestamp(),
                    updatedAt: jobData.updatedAt || serverTimestamp(),
                } as Job);
            }
        });

        return jobs;
    } catch (error) {
        console.error('Error fetching jobs by project:', error);
        throw new Error('Failed to fetch project jobs');
    }
};

/**
 * Create a new job
 */
export const createJob = async (
    projectId: string,
    jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'projectId'>,
    _createdBy: User
): Promise<string> => {
    try {
        const now = serverTimestamp();

        const newJob: Omit<Job, 'id'> = {
            ...jobData,
            projectId,
            status: JobStatus.TODO,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            tasks: [],
        };

        const docRef = doc(collection(db, JOBS_COLLECTION));
        await setDoc(docRef, newJob);

        // Send project message about new job creation
        const messagingService = new MessagingService();
        await messagingService.sendMessage(
            projectId,
            `New job "${jobData.title}" has been created in the project.`,
            'system',
            'System',
            UserRole.ADMIN,
            ChannelType.PROJECT_GENERAL
        );

        console.log('Job created successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating job:', error);
        throw new Error('Failed to create job');
    }
};

/**
 * Update job
 */
export const updateJob = async (
    jobId: string,
    updates: Partial<Omit<Job, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, JOBS_COLLECTION, jobId), updateData);

        console.log('Job updated successfully:', jobId);
    } catch (error) {
        console.error('Error updating job:', error);
        throw new Error('Failed to update job');
    }
};

/**
 * Delete job
 */
export const deleteJob = async (jobId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // Delete the job document
        batch.delete(doc(db, JOBS_COLLECTION, jobId));

        // Delete associated tasks
        const tasksQuery = query(
            collection(db, TASKS_COLLECTION),
            where('jobId', '==', jobId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        tasksSnapshot.forEach((taskDoc) => {
            batch.delete(taskDoc.ref);
        });

        await batch.commit();
        console.log('Job and associated tasks deleted successfully:', jobId);
    } catch (error) {
        console.error('Error deleting job:', error);
        throw new Error('Failed to delete job');
    }
};

/**
 * Add task to job
 */
export const addTaskToJob = async (
    jobId: string,
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'timeLogs' | 'jobId'>
): Promise<string> => {
    try {
        const now = serverTimestamp();

        const newTask: Omit<Task, 'id'> = {
            ...taskData,
            jobId,
            status: TaskStatus.TODO,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            timeLogs: [],
        };

        // Create task document
        const taskRef = doc(collection(db, TASKS_COLLECTION));
        await setDoc(taskRef, newTask);

        // Update job to include task reference
        const job = await getJobById(jobId);
        if (job) {
            const updatedTasks = [...(job.tasks || []), {
                id: taskRef.id,
                ...newTask,
            }];

            await updateJob(jobId, {
                tasks: updatedTasks,
            });
        }

        console.log('Task added successfully:', taskRef.id);
        return taskRef.id;
    } catch (error) {
        console.error('Error adding task:', error);
        throw new Error('Failed to add task');
    }
};

/**
 * Update task
 */
export const updateTask = async (
    jobId: string,
    taskId: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        // Update task document
        await updateDoc(doc(db, TASKS_COLLECTION, taskId), updateData);

        // Update task in job document
        const job = await getJobById(jobId);
        if (job && job.tasks) {
            const updatedTasks = job.tasks.map(task =>
                task.id === taskId
                    ? { ...task, ...updates, updatedAt: new Date() as any }
                    : task
            );

            await updateJob(jobId, {
                tasks: updatedTasks,
            });
        }

        console.log('Task updated successfully:', taskId);
    } catch (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task');
    }
};

/**
 * Get tasks by job ID
 */
export const getTasksByJob = async (jobId: string): Promise<Task[]> => {
    try {
        const q = query(
            collection(db, TASKS_COLLECTION),
            where('jobId', '==', jobId),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const tasks: Task[] = [];

        querySnapshot.forEach((doc) => {
            const taskData = doc.data() as Omit<Task, 'id'>;
            if (taskData) {
                tasks.push({
                    id: doc.id,
                    ...taskData,
                    createdAt: taskData.createdAt || serverTimestamp(),
                    updatedAt: taskData.updatedAt || serverTimestamp(),
                } as Task);
            }
        });

        return tasks;
    } catch (error) {
        console.error('Error fetching tasks by job:', error);
        throw new Error('Failed to fetch job tasks');
    }
};

/**
 * Get task by ID
 */
export const getTaskById = async (taskId: string): Promise<Task | null> => {
    try {
        const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));

        if (taskDoc.exists()) {
            const taskData = taskDoc.data() as Omit<Task, 'id'>;
            if (taskData) {
                return {
                    id: taskDoc.id,
                    ...taskData,
                    createdAt: taskData.createdAt || serverTimestamp(),
                    updatedAt: taskData.updatedAt || serverTimestamp(),
                } as Task;
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching task:', error);
        throw new Error('Failed to fetch task data');
    }
};

/**
 * Delete task
 */
export const deleteTask = async (jobId: string, taskId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // Delete the task document
        batch.delete(doc(db, TASKS_COLLECTION, taskId));

        // Update job to remove task reference
        const job = await getJobById(jobId);
        if (job && job.tasks) {
            const updatedTasks = job.tasks.filter(task => task.id !== taskId);
            await updateJob(jobId, {
                tasks: updatedTasks,
            });
        }

        await batch.commit();
        console.log('Task deleted successfully:', taskId);
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error('Failed to delete task');
    }
};