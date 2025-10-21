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
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectBaseline, Task, TaskBaseline } from '../types';

/**
 * Project Baseline Service
 * Handles all baseline-related operations for project management
 */

const PROJECT_BASELINES_COLLECTION = 'projectBaselines';

/**
 * Create a project baseline
 * Captures the current state of project tasks and schedule
 */
export const createProjectBaseline = async (
    projectId: string,
    tasks: Task[],
    name: string,
    description?: string
): Promise<string> => {
    try {
        const now = serverTimestamp();

        const taskBaselines: TaskBaseline[] = tasks.map(task => ({
            taskId: task.id,
            startDate: task.startDate,
            endDate: task.endDate,
            duration: task.duration,
            estimatedCost: task.estimatedTime ? task.estimatedTime * 50 : 0 // Assuming hourly rate of 50
        }));

        const newBaseline: Omit<ProjectBaseline, 'id'> = {
            projectId,
            name,
            createdAt: now as Timestamp,
            taskBaselines,
            budget: tasks.reduce((sum, task) => sum + (task.estimatedTime || 0) * 50, 0)
        };

        const docRef = doc(collection(db, PROJECT_BASELINES_COLLECTION));
        await setDoc(docRef, newBaseline);

        console.log('Project baseline created successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating project baseline:', error);
        throw new Error('Failed to create project baseline');
    }
};

/**
 * Get all baselines for a project
 */
export const getProjectBaselines = async (projectId: string): Promise<ProjectBaseline[]> => {
    try {
        const q = query(
            collection(db, PROJECT_BASELINES_COLLECTION),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const baselines: ProjectBaseline[] = [];

        querySnapshot.forEach((doc) => {
            const baselineData = doc.data() as Omit<ProjectBaseline, 'id'>;
            baselines.push({
                id: doc.id,
                ...baselineData,
            } as ProjectBaseline);
        });

        return baselines;
    } catch (error) {
        console.error('Error fetching project baselines:', error);
        throw new Error('Failed to fetch project baselines');
    }
};

/**
 * Get a specific baseline by ID
 */
export const getProjectBaselineById = async (baselineId: string): Promise<ProjectBaseline | null> => {
    try {
        const baselineDoc = await getDoc(doc(db, PROJECT_BASELINES_COLLECTION, baselineId));

        if (baselineDoc.exists()) {
            const baselineData = baselineDoc.data() as Omit<ProjectBaseline, 'id'>;
            return {
                id: baselineDoc.id,
                ...baselineData,
            } as ProjectBaseline;
        }

        return null;
    } catch (error) {
        console.error('Error fetching project baseline:', error);
        throw new Error('Failed to fetch project baseline');
    }
};

/**
 * Update a project baseline
 */
export const updateProjectBaseline = async (
    baselineId: string,
    updates: Partial<Omit<ProjectBaseline, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, PROJECT_BASELINES_COLLECTION, baselineId), updateData);
        console.log('Project baseline updated successfully:', baselineId);
    } catch (error) {
        console.error('Error updating project baseline:', error);
        throw new Error('Failed to update project baseline');
    }
};

/**
 * Delete a project baseline (soft delete by deactivating)
 */
export const deleteProjectBaseline = async (baselineId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, PROJECT_BASELINES_COLLECTION, baselineId), {
            isActive: false,
            updatedAt: serverTimestamp(),
        });

        console.log('Project baseline deactivated successfully:', baselineId);
    } catch (error) {
        console.error('Error deactivating project baseline:', error);
        throw new Error('Failed to deactivate project baseline');
    }
};

/**
 * Compare current project schedule with baseline
 * Returns variance analysis between current and baseline schedules
 */
export const compareProjectWithBaseline = async (
    _projectId: string,
    baselineId: string,
    currentTasks: Task[]
): Promise<{
    baseline: ProjectBaseline;
    variances: {
        scheduleVariance: number; // Days difference in project duration
        costVariance: number; // Budget variance
        taskVariances: Array<{
            taskId: string;
            startVariance: number; // Days difference from baseline start
            durationVariance: number; // Days difference in duration
            costVariance: number; // Cost difference
        }>;
    };
}> => {
    try {
        const baseline = await getProjectBaselineById(baselineId);
        if (!baseline) {
            throw new Error('Baseline not found');
        }

        // Calculate schedule variance (project duration difference)
        const currentEndDate = Math.max(...currentTasks.map((t: Task) => t.endDate?.toDate().getTime() || 0));
        const baselineEndDate = Math.max(...baseline.taskBaselines.map((tb: TaskBaseline) => tb.endDate?.toDate().getTime() || 0));
        const scheduleVariance = Math.ceil((currentEndDate - baselineEndDate) / (1000 * 60 * 60 * 24));

        // Calculate cost variance
        const currentTotalCost = currentTasks.reduce((sum: number, task: Task) => sum + ((task.estimatedTime || 0) * 50), 0);
        const baselineTotalCost = baseline.taskBaselines.reduce((sum: number, tb: TaskBaseline) => sum + (tb.estimatedCost || 0), 0);
        const costVariance = currentTotalCost - baselineTotalCost;

        // Calculate individual task variances
        const taskVariances = currentTasks.map(currentTask => {
            const baselineTask = baseline.taskBaselines.find((tb: TaskBaseline) => tb.taskId === currentTask.id);
            if (!baselineTask) {
                return {
                    taskId: currentTask.id,
                    startVariance: 0,
                    durationVariance: 0,
                    costVariance: (currentTask.estimatedTime || 0) * 50,
                };
            }

            const startVariance = currentTask.startDate && baselineTask.startDate
                ? Math.ceil((currentTask.startDate.toDate().getTime() - baselineTask.startDate.toDate().getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            const durationVariance = (currentTask.duration || 0) - (baselineTask.duration || 0);

            const costVariance = ((currentTask.estimatedTime || 0) * 50) - (baselineTask.estimatedCost || 0);

            return {
                taskId: currentTask.id,
                startVariance,
                durationVariance,
                costVariance,
            };
        });

        return {
            baseline,
            variances: {
                scheduleVariance,
                costVariance,
                taskVariances,
            },
        };
    } catch (error) {
        console.error('Error comparing project with baseline:', error);
        throw new Error('Failed to compare project with baseline');
    }
};

/**
 * Get baseline summary for a project
 * Returns key metrics from the most recent active baseline
 */
export const getProjectBaselineSummary = async (projectId: string): Promise<{
    hasBaseline: boolean;
    baselineDate?: Date;
    totalTasks?: number;
    projectDuration?: number;
    totalBudget?: number;
} | null> => {
    try {
        const baselines = await getProjectBaselines(projectId);
        const activeBaseline = baselines.find(b => b.isActive !== false);

        if (!activeBaseline) {
            return { hasBaseline: false };
        }

        const projectDuration = activeBaseline.taskBaselines.length > 0
            ? Math.max(...activeBaseline.taskBaselines.map((tb: TaskBaseline) => tb.endDate?.toDate().getTime() || 0)) -
            Math.min(...activeBaseline.taskBaselines.map((tb: TaskBaseline) => tb.startDate?.toDate().getTime() || 0))
            : 0;

        const totalBudget = activeBaseline.taskBaselines.reduce((sum: number, tb: TaskBaseline) => sum + (tb.estimatedCost || 0), 0);

        return {
            hasBaseline: true,
            baselineDate: activeBaseline.createdAt.toDate(),
            totalTasks: activeBaseline.taskBaselines.length,
            projectDuration: Math.ceil(projectDuration / (1000 * 60 * 60 * 24)),
            totalBudget,
        };
    } catch (error) {
        console.error('Error getting project baseline summary:', error);
        return null;
    }
};