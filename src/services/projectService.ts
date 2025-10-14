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
    limit,
    serverTimestamp,
    Timestamp,
    writeBatch,
    onSnapshot,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project, ProjectStatus, JobCard, JobCardStatus, User, UserRole } from '../types';
import { NotificationType, NotificationPriority, NotificationCategory } from '../types/notifications';
import { createNotification } from './notificationService';

/**
 * Firebase Project Service
 * Handles all project-related Firestore operations
 */

// Collection references
const PROJECTS_COLLECTION = 'projects';
const JOB_CARDS_COLLECTION = 'jobCards';
const TIME_LOGS_COLLECTION = 'timeLogs';

/**
 * Generate project number in format: PROJ-YYYY-MM-###
 */
const generateProjectNumber = async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Query for projects created this month to get sequence number
    const monthStart = new Date(year, now.getMonth(), 1);
    const monthEnd = new Date(year, now.getMonth() + 1, 0);

    const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('createdAt', '>=', monthStart),
        where('createdAt', '<=', monthEnd),
        orderBy('createdAt', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);
    let sequence = 1;

    if (!snapshot.empty) {
        const lastProject = snapshot.docs[0].data();
        if (lastProject.projectNumber) {
            const lastSequence = parseInt(lastProject.projectNumber.split('-')[3] || '0');
            sequence = lastSequence + 1;
        }
    }

    return `PROJ-${year}-${month}-${String(sequence).padStart(3, '0')}`;
};

/**
 * Get project by ID
 */
export const getProjectById = async (projectId: string): Promise<Project | null> => {
    try {
        const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));

        if (projectDoc.exists()) {
            const projectData = projectDoc.data() as Omit<Project, 'id'>;
            if (projectData) {
                return {
                    id: projectDoc.id,
                    ...projectData,
                    createdAt: projectData.createdAt || serverTimestamp(),
                    updatedAt: projectData.updatedAt || serverTimestamp(),
                } as Project;
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching project:', error);
        throw new Error('Failed to fetch project data');
    }
};

/**
 * Get all projects
 */
export const getAllProjects = async (): Promise<Project[]> => {
    try {
        const q = query(
            collection(db, PROJECTS_COLLECTION),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const projects: Project[] = [];

        querySnapshot.forEach((doc) => {
            const projectData = doc.data() as Omit<Project, 'id'>;
            if (projectData) {
                projects.push({
                    id: doc.id,
                    ...projectData,
                    createdAt: projectData.createdAt || serverTimestamp(),
                    updatedAt: projectData.updatedAt || serverTimestamp(),
                } as Project);
            }
        });

        return projects;
    } catch (error) {
        console.error('Error fetching all projects:', error);
        throw new Error('Failed to fetch projects');
    }
};

/**
 * Get projects by user role and permissions
 */
export const getProjectsByUser = async (userId: string, userRole: UserRole): Promise<Project[]> => {
    try {
        let q: ReturnType<typeof query>;

        if (userRole === UserRole.ADMIN) {
            // Admins can see all projects
            q = query(
                collection(db, PROJECTS_COLLECTION),
                orderBy('updatedAt', 'desc')
            );
        } else if (userRole === UserRole.CLIENT) {
            // Clients can only see their own projects
            q = query(
                collection(db, PROJECTS_COLLECTION),
                where('clientId', '==', userId),
                orderBy('updatedAt', 'desc')
            );
        } else {
            // Freelancers can see projects they're assigned to
            q = query(
                collection(db, PROJECTS_COLLECTION),
                where('assignedTeamIds', 'array-contains', userId),
                orderBy('updatedAt', 'desc')
            );
        }

        let querySnapshot;
        try {
            querySnapshot = await getDocs(q);
        } catch (indexError: any) {
            // If it's an index error for freelancers, fallback to simple query
            if (userRole === UserRole.FREELANCER && indexError.code === 'failed-precondition') {
                console.warn('Composite index not available, using simple query without orderBy');
                const fallbackQuery = query(
                    collection(db, PROJECTS_COLLECTION),
                    where('assignedTeamIds', 'array-contains', userId)
                );
                querySnapshot = await getDocs(fallbackQuery);
            } else {
                throw indexError;
            }
        }
        const projects: Project[] = [];

        querySnapshot.forEach((doc) => {
            const projectData = doc.data() as Omit<Project, 'id'>;
            if (projectData) {
                projects.push({
                    id: doc.id,
                    ...projectData,
                    createdAt: projectData.createdAt || serverTimestamp(),
                    updatedAt: projectData.updatedAt || serverTimestamp(),
                } as Project);
            }
        });

        // If we used the fallback query, sort manually
        if (userRole === UserRole.FREELANCER) {
            projects.sort((a, b) => {
                const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
                const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
                return bTime - aTime; // Descending order
            });
        }

        return projects;
    } catch (error: any) {
        console.error('Error fetching projects by user:', error);

        // Handle specific Firebase errors
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
            throw new Error('Unable to fetch projects while offline. Please check your internet connection.');
        } else if (error.code === 'failed-precondition' && error.message?.includes('index')) {
            throw new Error('Database index is being created. Please try again in a few minutes.');
        }
        if (error instanceof Error && error.message.includes('index')) {
            console.warn('Firestore index required. Please deploy indexes using: firebase deploy --only firestore:indexes');
            // Return empty array for now to prevent app crash
            return [];
        }

        throw new Error('Failed to fetch user projects');
    }
};

/**
 * Create a new project
 */
export const createProject = async (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'jobCards' | 'projectNumber'>,
    _createdBy: User
): Promise<string> => {
    try {
        const now = serverTimestamp();
        const projectNumber = await generateProjectNumber();

        const newProject: Omit<Project, 'id'> = {
            ...projectData,
            projectNumber,
            status: ProjectStatus.DRAFT,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            jobCards: [],
            totalTimeSpentMinutes: 0,
            totalAllocatedHours: 0,
            totalEarnings: 0,
        };

        const docRef = doc(collection(db, PROJECTS_COLLECTION));
        await setDoc(docRef, newProject);

        // Trigger notifications for team members
        if (projectData.assignedTeamIds && projectData.assignedTeamIds.length > 0) {
            await notifyProjectAssignment(docRef.id, projectData, projectData.assignedTeamIds);
        }

        console.log('Project created successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating project:', error);
        throw new Error('Failed to create project');
    }
};

/**
 * Update project
 */
export const updateProject = async (
    projectId: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), updateData);

        // Trigger notifications for important updates
        if (updates.status || updates.assignedTeamIds) {
            const project = await getProjectById(projectId);
            if (project) {
                await notifyProjectUpdate(projectId, project, updates);
            }
        }

        console.log('Project updated successfully:', projectId);
    } catch (error) {
        console.error('Error updating project:', error);
        throw new Error('Failed to update project');
    }
};

/**
 * Delete project
 */
export const deleteProject = async (projectId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // Delete the project document
        batch.delete(doc(db, PROJECTS_COLLECTION, projectId));

        // Delete associated job cards
        const jobCardsQuery = query(
            collection(db, JOB_CARDS_COLLECTION),
            where('projectId', '==', projectId)
        );
        const jobCardsSnapshot = await getDocs(jobCardsQuery);

        jobCardsSnapshot.forEach((jobCardDoc) => {
            batch.delete(jobCardDoc.ref);
        });

        // Delete associated time logs
        const timeLogsQuery = query(
            collection(db, TIME_LOGS_COLLECTION),
            where('projectId', '==', projectId)
        );
        const timeLogsSnapshot = await getDocs(timeLogsQuery);

        timeLogsSnapshot.forEach((timeLogDoc) => {
            batch.delete(timeLogDoc.ref);
        });

        await batch.commit();
        console.log('Project and associated data deleted successfully:', projectId);
    } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error('Failed to delete project');
    }
};

/**
 * Add job card to project
 */
export const addJobCardToProject = async (
    projectId: string,
    jobCardData: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt' | 'timeLogs'>
): Promise<string> => {
    try {
        const now = serverTimestamp();

        const newJobCard: Omit<JobCard, 'id'> = {
            ...jobCardData,
            status: JobCardStatus.TODO,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
            timeLogs: [],
        };

        // Create job card document
        const jobCardRef = doc(collection(db, JOB_CARDS_COLLECTION));
        await setDoc(jobCardRef, {
            ...newJobCard,
            projectId,
        });

        // Update project to include job card reference
        const project = await getProjectById(projectId);
        if (project) {
            const updatedJobCards = [...(project.jobCards || []), {
                id: jobCardRef.id,
                ...newJobCard,
            }];

            await updateProject(projectId, {
                jobCards: updatedJobCards,
            });
        }

        console.log('Job card added successfully:', jobCardRef.id);
        return jobCardRef.id;
    } catch (error) {
        console.error('Error adding job card:', error);
        throw new Error('Failed to add job card');
    }
};

/**
 * Update job card
 */
export const updateJobCard = async (
    projectId: string,
    jobCardId: string,
    updates: Partial<Omit<JobCard, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        // Update job card document
        await updateDoc(doc(db, JOB_CARDS_COLLECTION, jobCardId), updateData);

        // Update job card in project document
        const project = await getProjectById(projectId);
        if (project && project.jobCards) {
            const updatedJobCards = project.jobCards.map(jobCard =>
                jobCard.id === jobCardId
                    ? { ...jobCard, ...updates, updatedAt: new Date() as any }
                    : jobCard
            );

            await updateProject(projectId, {
                jobCards: updatedJobCards,
            });
        }

        console.log('Job card updated successfully:', jobCardId);
    } catch (error) {
        console.error('Error updating job card:', error);
        throw new Error('Failed to update job card');
    }
};

/**
 * Get projects with real-time updates
 */
export const subscribeToProjects = (
    userId: string,
    userRole: UserRole,
    callback: (projects: Project[]) => void
): (() => void) => {
    let q: ReturnType<typeof query>;

    if (userRole === UserRole.ADMIN) {
        q = query(
            collection(db, PROJECTS_COLLECTION),
            orderBy('updatedAt', 'desc')
        );
    } else if (userRole === UserRole.CLIENT) {
        q = query(
            collection(db, PROJECTS_COLLECTION),
            where('clientId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
    } else {
        // For freelancers, try the composite query first, fallback if index not available
        q = query(
            collection(db, PROJECTS_COLLECTION),
            where('assignedTeamIds', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        );
    }

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const projects: Project[] = [];

        snapshot.forEach((doc) => {
            const projectData = doc.data() as Omit<Project, 'id'>;
            if (projectData) {
                projects.push({
                    id: doc.id,
                    ...projectData,
                    createdAt: projectData.createdAt || serverTimestamp(),
                    updatedAt: projectData.updatedAt || serverTimestamp(),
                } as Project);
            }
        });

        // Sort manually for freelancers if needed
        if (userRole === UserRole.FREELANCER) {
            projects.sort((a, b) => {
                const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
                const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
                return bTime - aTime; // Descending order
            });
        }

        callback(projects);
    }, (error) => {
        console.error('Error in projects subscription:', error);

        // If it's an index error for freelancers, try fallback subscription
        if (userRole === UserRole.FREELANCER && error.code === 'failed-precondition') {
            console.warn('Composite index not available for subscription, using simple query');
            const fallbackQuery = query(
                collection(db, PROJECTS_COLLECTION),
                where('assignedTeamIds', 'array-contains', userId)
            );

            return onSnapshot(fallbackQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                const projects: Project[] = [];

                snapshot.forEach((doc) => {
                    const projectData = doc.data() as Omit<Project, 'id'>;
                    if (projectData) {
                        projects.push({
                            id: doc.id,
                            ...projectData,
                            createdAt: projectData.createdAt || serverTimestamp(),
                            updatedAt: projectData.updatedAt || serverTimestamp(),
                        } as Project);
                    }
                });

                // Sort manually since we can't use orderBy
                projects.sort((a, b) => {
                    const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
                    const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
                    return bTime - aTime; // Descending order
                });

                callback(projects);
            }, (fallbackError) => {
                console.error('Error in fallback projects subscription:', fallbackError);
                // Return empty array to prevent app crash
                callback([]);
            });
        } else {
            // For other errors, return empty array to prevent app crash
            callback([]);
        }
    });
};

/**
 * Get project statistics
 */
export const getProjectStatistics = async (userId?: string, userRole?: UserRole) => {
    try {
        let projects: Project[];

        if (userId && userRole) {
            projects = await getProjectsByUser(userId, userRole);
        } else {
            projects = await getAllProjects();
        }

        const stats = {
            total: projects.length,
            active: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
            completed: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
            onHold: projects.filter(p => p.status === ProjectStatus.ON_HOLD).length,
            draft: projects.filter(p => p.status === ProjectStatus.DRAFT).length,
            cancelled: projects.filter(p => p.status === ProjectStatus.CANCELLED).length,
            totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
            totalEarnings: projects.reduce((sum, p) => sum + (p.totalEarnings || 0), 0),
        };

        return stats;
    } catch (error) {
        console.error('Error getting project statistics:', error);
        throw new Error('Failed to get project statistics');
    }
};

/**
 * Notify team members about project assignment
 */
const notifyProjectAssignment = async (
    projectId: string,
    projectData: any,
    teamMemberIds: string[]
): Promise<void> => {
    try {
        const notificationPromises = teamMemberIds.map(memberId =>
            createNotification({
                userId: memberId,
                type: NotificationType.PROJECT_ASSIGNED,
                title: `New project assigned: ${projectData.title}`,
                message: `You have been assigned to project "${projectData.title}". Please review the project details and requirements.`,
                priority: NotificationPriority.HIGH,
                category: NotificationCategory.PROJECT,
                data: {
                    projectId,
                    projectTitle: projectData.title,
                    clientName: projectData.clientName
                }
            })
        );

        await Promise.all(notificationPromises);
    } catch (error) {
        console.error('Error notifying project assignment:', error);
        // Don't throw - notification failure shouldn't break project creation
    }
};

/**
 * Notify relevant users about project updates
 */
const notifyProjectUpdate = async (
    projectId: string,
    project: Project,
    updates: any
): Promise<void> => {
    try {
        const notifications: any[] = [];

        // Notify about status changes
        if (updates.status && updates.status !== project.status) {
            const statusMessage = getStatusChangeMessage(updates.status);
            const recipients = [...(project.assignedTeamIds || []), project.clientId].filter(Boolean);

            recipients.forEach(userId => {
                notifications.push({
                    userId,
                    type: NotificationType.PROJECT_UPDATED,
                    title: `Project status changed: ${project.title}`,
                    message: statusMessage,
                    priority: NotificationPriority.MEDIUM,
                    category: NotificationCategory.PROJECT,
                    data: {
                        projectId,
                        projectTitle: project.title,
                        oldStatus: project.status,
                        newStatus: updates.status
                    }
                });
            });
        }

        // Notify about new team member assignments
        if (updates.assignedTeamIds) {
            const newMembers = updates.assignedTeamIds.filter(
                (id: string) => !project.assignedTeamIds?.includes(id)
            );

            newMembers.forEach((memberId: string) => {
                notifications.push({
                    userId: memberId,
                    type: NotificationType.PROJECT_ASSIGNED,
                    title: `Added to project: ${project.title}`,
                    message: `You have been added to project "${project.title}". Please review the project details.`,
                    priority: NotificationPriority.HIGH,
                    category: NotificationCategory.PROJECT,
                    data: {
                        projectId,
                        projectTitle: project.title,
                        clientName: project.clientName
                    }
                });
            });
        }

        // Send all notifications
        if (notifications.length > 0) {
            const notificationPromises = notifications.map(notification =>
                createNotification(notification)
            );
            await Promise.all(notificationPromises);
        }
    } catch (error) {
        console.error('Error notifying project update:', error);
        // Don't throw - notification failure shouldn't break project updates
    }
};

/**
 * Get status change message
 */
const getStatusChangeMessage = (newStatus: ProjectStatus): string => {
    switch (newStatus) {
        case ProjectStatus.ACTIVE:
            return 'The project is now active and work can begin.';
        case ProjectStatus.COMPLETED:
            return 'The project has been completed successfully.';
        case ProjectStatus.ON_HOLD:
            return 'The project has been put on hold.';
        case ProjectStatus.CANCELLED:
            return 'The project has been cancelled.';
        default:
            return `Project status changed to ${newStatus}.`;
    }
};