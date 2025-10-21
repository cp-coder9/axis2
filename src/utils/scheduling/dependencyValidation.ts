import { Task, TaskDependency } from '../../types';

/**
 * Dependency validation utilities
 * Ensures task dependencies are valid and don't create circular references
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Comprehensive dependency validation
 */
export const validateTaskDependencies = (
    tasks: Task[],
    dependencies: TaskDependency[]
): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const taskIds = new Set(tasks.map(t => t.id));
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // 1. Check for invalid task references
    dependencies.forEach((dep, index) => {
        if (!taskIds.has(dep.predecessorId)) {
            errors.push(`Dependency ${index + 1}: Invalid predecessor task ID '${dep.predecessorId}'`);
        }
        if (!taskIds.has(dep.successorId)) {
            errors.push(`Dependency ${index + 1}: Invalid successor task ID '${dep.successorId}'`);
        }
        if (dep.predecessorId === dep.successorId) {
            errors.push(`Dependency ${index + 1}: Task cannot depend on itself`);
        }
    });

    // 2. Check for duplicate dependencies
    const depKeys = new Set<string>();
    dependencies.forEach((dep, index) => {
        const key = `${dep.predecessorId}-${dep.successorId}-${dep.type}`;
        if (depKeys.has(key)) {
            warnings.push(`Dependency ${index + 1}: Duplicate dependency between tasks ${dep.predecessorId} and ${dep.successorId}`);
        }
        depKeys.add(key);
    });

    // 3. Check for circular dependencies using DFS
    const circularErrors = detectCircularDependencies(tasks, dependencies);
    errors.push(...circularErrors);

    // 4. Validate dependency types and lag values
    dependencies.forEach((dep, index) => {
        const validTypes = ['FS', 'SS', 'FF', 'SF'];
        if (!validTypes.includes(dep.type)) {
            errors.push(`Dependency ${index + 1}: Invalid dependency type '${dep.type}'. Must be one of: ${validTypes.join(', ')}`);
        }

        if (dep.lag !== undefined && (dep.lag < -365 || dep.lag > 365)) {
            warnings.push(`Dependency ${index + 1}: Unusual lag value ${dep.lag} days. Consider reviewing.`);
        }
    });

    // 5. Check for logical inconsistencies
    dependencies.forEach((dep, index) => {
        const predecessor = taskMap.get(dep.predecessorId);
        const successor = taskMap.get(dep.successorId);

        if (predecessor && successor) {
            // Check if tasks are in different projects (if applicable)
            // This would require project context, so we'll skip for now

            // Check for redundant dependencies
            const redundantDeps = dependencies.filter(d =>
                d.id !== dep.id &&
                d.predecessorId === dep.predecessorId &&
                d.successorId === dep.successorId
            );
            if (redundantDeps.length > 0) {
                warnings.push(`Dependency ${index + 1}: Multiple dependencies between same tasks may be redundant`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Detect circular dependencies using topological sort
 */
export const detectCircularDependencies = (
    tasks: Task[],
    dependencies: TaskDependency[]
): string[] => {
    const errors: string[] = [];

    // Build adjacency list
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    tasks.forEach(task => {
        graph.set(task.id, []);
        inDegree.set(task.id, 0);
    });

    // Build graph
    dependencies.forEach(dep => {
        if (graph.has(dep.predecessorId) && graph.has(dep.successorId)) {
            graph.get(dep.predecessorId)!.push(dep.successorId);
            inDegree.set(dep.successorId, (inDegree.get(dep.successorId) || 0) + 1);
        }
    });

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    let processed = 0;

    // Start with nodes that have no incoming edges
    inDegree.forEach((degree, taskId) => {
        if (degree === 0) {
            queue.push(taskId);
        }
    });

    while (queue.length > 0) {
        const current = queue.shift()!;
        processed++;

        const neighbors = graph.get(current) || [];
        neighbors.forEach(neighbor => {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        });
    }

    // If not all tasks were processed, there's a cycle
    if (processed < tasks.length) {
        errors.push('Circular dependency detected: Tasks form a dependency loop');

        // Try to identify the cycle (simplified)
        const unprocessedTasks = Array.from(inDegree.entries())
            .filter(([_, degree]) => degree > 0)
            .map(([taskId, _]) => taskId);

        if (unprocessedTasks.length > 0) {
            errors.push(`Tasks involved in cycle: ${unprocessedTasks.join(', ')}`);
        }
    }

    return errors;
};

/**
 * Get dependency chains for a specific task
 */
export const getDependencyChains = (
    taskId: string,
    dependencies: TaskDependency[],
    direction: 'predecessors' | 'successors' = 'predecessors'
): string[][] => {
    const chains: string[][] = [];
    const visited = new Set<string>();

    const traverse = (currentId: string, chain: string[]): void => {
        if (visited.has(currentId)) {
            return; // Avoid infinite loops
        }

        visited.add(currentId);
        const newChain = [...chain, currentId];

        const relatedDeps = dependencies.filter(dep =>
            direction === 'predecessors'
                ? dep.successorId === currentId
                : dep.predecessorId === currentId
        );

        if (relatedDeps.length === 0) {
            chains.push(newChain);
        } else {
            relatedDeps.forEach(dep => {
                const nextId = direction === 'predecessors' ? dep.predecessorId : dep.successorId;
                traverse(nextId, newChain);
            });
        }

        visited.delete(currentId);
    };

    traverse(taskId, []);
    return chains;
};

/**
 * Check if adding a dependency would create a circular reference
 */
export const wouldCreateCircularDependency = (
    newDependency: Omit<TaskDependency, 'id'>,
    existingDependencies: TaskDependency[]
): boolean => {
    const testDependencies = [
        ...existingDependencies,
        { ...newDependency, id: 'test' }
    ];

    const errors = detectCircularDependencies([], testDependencies);
    return errors.length > 0;
};