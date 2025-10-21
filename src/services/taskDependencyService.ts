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
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { TaskDependency, Task } from '../types';
import { validateTaskDependencies, ValidationResult } from '../utils/scheduling/dependencyValidation';

/**
 * Task Dependency Service
 * Handles all task dependency-related operations for project management
 */

const TASK_DEPENDENCIES_COLLECTION = 'taskDependencies';

/**
 * Create a task dependency
 */
export const createTaskDependency = async (
    dependencyData: Omit<TaskDependency, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        // Validate the dependency before creating
        const allTasks: Task[] = []; // This would need to be passed or fetched
        const existingDependencies = await getProjectDependencies(dependencyData.projectId || '');
        const allDependencies = [
            ...existingDependencies,
            { ...dependencyData, id: 'temp' } as TaskDependency
        ];
        const validation = validateTaskDependencies(allTasks, allDependencies);

        if (!validation.isValid) {
            throw new Error(`Invalid dependency: ${validation.errors.join(', ')}`);
        }

        const now = serverTimestamp();

        const newDependency: Omit<TaskDependency, 'id'> = {
            ...dependencyData,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
        };

        const docRef = doc(collection(db, TASK_DEPENDENCIES_COLLECTION));
        await setDoc(docRef, newDependency);

        console.log('Task dependency created successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating task dependency:', error);
        throw new Error('Failed to create task dependency');
    }
};

/**
 * Get dependencies for a specific task
 */
export const getTaskDependencies = async (taskId: string): Promise<TaskDependency[]> => {
    try {
        const predecessorQuery = query(
            collection(db, TASK_DEPENDENCIES_COLLECTION),
            where('predecessorId', '==', taskId),
            orderBy('createdAt', 'desc')
        );

        const successorQuery = query(
            collection(db, TASK_DEPENDENCIES_COLLECTION),
            where('successorId', '==', taskId),
            orderBy('createdAt', 'desc')
        );

        const [predecessorSnapshot, successorSnapshot] = await Promise.all([
            getDocs(predecessorQuery),
            getDocs(successorQuery)
        ]);

        const dependencies: TaskDependency[] = [];

        predecessorSnapshot.forEach((doc) => {
            const depData = doc.data() as Omit<TaskDependency, 'id'>;
            dependencies.push({
                id: doc.id,
                ...depData,
            } as TaskDependency);
        });

        successorSnapshot.forEach((doc) => {
            const depData = doc.data() as Omit<TaskDependency, 'id'>;
            dependencies.push({
                id: doc.id,
                ...depData,
            } as TaskDependency);
        });

        return dependencies;
    } catch (error) {
        console.error('Error fetching task dependencies:', error);
        throw new Error('Failed to fetch task dependencies');
    }
};

/**
 * Get all dependencies for a project
 */
export const getProjectDependencies = async (projectId: string): Promise<TaskDependency[]> => {
    try {
        // This would require a projectId field in dependencies or joining with tasks
        // For now, we'll get all dependencies and filter by project
        const q = query(
            collection(db, TASK_DEPENDENCIES_COLLECTION),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const dependencies: TaskDependency[] = [];

        querySnapshot.forEach((doc) => {
            const depData = doc.data() as Omit<TaskDependency, 'id'>;
            dependencies.push({
                id: doc.id,
                ...depData,
            } as TaskDependency);
        });

        // TODO: Filter by project ID once we have the relationship
        return dependencies;
    } catch (error) {
        console.error('Error fetching project dependencies:', error);
        throw new Error('Failed to fetch project dependencies');
    }
};

/**
 * Update a task dependency
 */
export const updateTaskDependency = async (
    dependencyId: string,
    updates: Partial<Omit<TaskDependency, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, TASK_DEPENDENCIES_COLLECTION, dependencyId), updateData);
        console.log('Task dependency updated successfully:', dependencyId);
    } catch (error) {
        console.error('Error updating task dependency:', error);
        throw new Error('Failed to update task dependency');
    }
};

/**
 * Delete a task dependency
 */
export const deleteTaskDependency = async (dependencyId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, TASK_DEPENDENCIES_COLLECTION, dependencyId), {
            isActive: false,
            updatedAt: serverTimestamp(),
        });

        console.log('Task dependency deactivated successfully:', dependencyId);
    } catch (error) {
        console.error('Error deactivating task dependency:', error);
        throw new Error('Failed to deactivate task dependency');
    }
};

/**
 * Validate a dependency with current tasks
 */
export const validateDependencyWithTasks = async (
    dependencyData: Omit<TaskDependency, 'id' | 'createdAt' | 'updatedAt'>,
    tasks: Task[]
): Promise<ValidationResult> => {
    // Get existing dependencies for validation
    const existingDependencies = await getProjectDependencies(dependencyData.projectId || '');

    const allDependencies = [
        ...existingDependencies,
        { ...dependencyData, id: 'temp' } as TaskDependency
    ];

    return validateTaskDependencies(tasks, allDependencies);
};

/**
 * Get dependency chains for impact analysis
 */
export const getDependencyChains = async (
    taskId: string,
    direction: 'predecessors' | 'successors' = 'successors'
): Promise<string[][]> => {
    try {
        const dependencies = await getProjectDependencies(''); // TODO: Pass project ID
        const tasks: Task[] = []; // TODO: Get tasks for the project

        // Use the utility function from dependencyValidation
        const { getDependencyChains: getChains } = await import('../utils/scheduling/dependencyValidation');
        return getChains(taskId, dependencies, direction);
    } catch (error) {
        console.error('Error getting dependency chains:', error);
        throw new Error('Failed to get dependency chains');
    }
};

/**
 * Bulk create dependencies
 */
export const createBulkDependencies = async (
    dependencies: Omit<TaskDependency, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<string[]> => {
    try {
        const batch = writeBatch(db);
        const now = serverTimestamp();
        const createdIds: string[] = [];

        dependencies.forEach((depData) => {
            const docRef = doc(collection(db, TASK_DEPENDENCIES_COLLECTION));
            createdIds.push(docRef.id);

            const newDependency: Omit<TaskDependency, 'id'> = {
                ...depData,
                createdAt: now as Timestamp,
                updatedAt: now as Timestamp,
            };

            batch.set(docRef, newDependency);
        });

        await batch.commit();
        console.log('Bulk dependencies created successfully:', createdIds.length);
        return createdIds;
    } catch (error) {
        console.error('Error creating bulk dependencies:', error);
        throw new Error('Failed to create bulk dependencies');
    }
};

/**
 * Get critical dependencies affecting project timeline
 */
export const getCriticalDependencies = async (projectId: string): Promise<TaskDependency[]> => {
    try {
        const dependencies = await getProjectDependencies(projectId);
        // TODO: Implement critical path analysis to identify critical dependencies
        // For now, return all dependencies
        return dependencies.filter(dep => dep.isActive !== false);
    } catch (error) {
        console.error('Error getting critical dependencies:', error);
        throw new Error('Failed to get critical dependencies');
    }
};

/**
 * Update task dates based on dependency changes
 * This would trigger schedule recalculation
 */
export const recalculateTaskDates = async (
    taskId: string,
    newStartDate?: Date,
    newEndDate?: Date
): Promise<void> => {
    try {
        // Get all affected tasks through dependency chains
        const successorChains = await getDependencyChains(taskId, 'successors');

        // TODO: Implement forward pass algorithm to recalculate dates
        // This would update all dependent tasks' dates based on the change

        console.log('Task dates recalculated for task:', taskId);
    } catch (error) {
        console.error('Error recalculating task dates:', error);
        throw new Error('Failed to recalculate task dates');
    }
};