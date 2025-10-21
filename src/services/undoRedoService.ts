import { Timestamp } from 'firebase/firestore';

/**
 * Undo/Redo Action Types
 */
export type ActionType =
    | 'TASK_UPDATE'
    | 'TASK_CREATE'
    | 'TASK_DELETE'
    | 'DEPENDENCY_CREATE'
    | 'DEPENDENCY_DELETE'
    | 'DEPENDENCY_UPDATE'
    | 'JOB_UPDATE'
    | 'JOB_CREATE'
    | 'JOB_DELETE'
    | 'RESOURCE_ASSIGN'
    | 'RESOURCE_UNASSIGN'
    | 'BASELINE_CREATE';

/**
 * Action Data Interfaces
 */
export interface TaskActionData {
    taskId: string;
    oldData?: any;
    newData?: any;
}

export interface DependencyActionData {
    dependencyId: string;
    oldData?: any;
    newData?: any;
}

export interface JobActionData {
    jobId: string;
    oldData?: any;
    newData?: any;
}

export interface ResourceActionData {
    taskId: string;
    resourceId: string;
    oldData?: any;
    newData?: any;
}

export interface BaselineActionData {
    baselineId: string;
    baselineData?: any;
}

/**
 * History Action Entry
 */
export interface HistoryAction {
    id: string;
    projectId: string;
    type: ActionType;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    description: string;
    data: TaskActionData | DependencyActionData | JobActionData | ResourceActionData | BaselineActionData;
    canUndo: boolean;
    canRedo: boolean;
}

/**
 * Undo/Redo Stack State
 */
export interface UndoRedoState {
    undoStack: HistoryAction[];
    redoStack: HistoryAction[];
    currentAction?: HistoryAction;
}

/**
 * Undo/Redo Service
 */
export class UndoRedoService {
    private state: Map<string, UndoRedoState> = new Map(); // projectId -> state
    private maxHistorySize = 50;

    /**
     * Get the current state for a project
     */
    private getProjectState(projectId: string): UndoRedoState {
        if (!this.state.has(projectId)) {
            this.state.set(projectId, {
                undoStack: [],
                redoStack: []
            });
        }
        return this.state.get(projectId)!;
    }

    /**
     * Record an action in the history
     */
    recordAction(
        projectId: string,
        type: ActionType,
        userId: string,
        userName: string,
        description: string,
        data: any,
        canUndo: boolean = true
    ): string {
        const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const action: HistoryAction = {
            id: actionId,
            projectId,
            type,
            timestamp: Timestamp.now(),
            userId,
            userName,
            description,
            data,
            canUndo,
            canRedo: false
        };

        const projectState = this.getProjectState(projectId);

        // Clear redo stack when new action is performed
        projectState.redoStack = [];

        // Add to undo stack
        projectState.undoStack.push(action);

        // Limit history size
        if (projectState.undoStack.length > this.maxHistorySize) {
            projectState.undoStack.shift();
        }

        return actionId;
    }

    /**
     * Check if undo is available
     */
    canUndo(projectId: string): boolean {
        const projectState = this.getProjectState(projectId);
        return projectState.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo(projectId: string): boolean {
        const projectState = this.getProjectState(projectId);
        return projectState.redoStack.length > 0;
    }

    /**
     * Get undo action description
     */
    getUndoDescription(projectId: string): string | null {
        const projectState = this.getProjectState(projectId);
        const lastAction = projectState.undoStack[projectState.undoStack.length - 1];
        return lastAction ? `Undo: ${lastAction.description}` : null;
    }

    /**
     * Get redo action description
     */
    getRedoDescription(projectId: string): string | null {
        const projectState = this.getProjectState(projectId);
        const lastAction = projectState.redoStack[projectState.redoStack.length - 1];
        return lastAction ? `Redo: ${lastAction.description}` : null;
    }

    /**
     * Perform undo operation
     */
    async undo(projectId: string): Promise<HistoryAction | null> {
        const projectState = this.getProjectState(projectId);

        if (!this.canUndo(projectId)) {
            return null;
        }

        const action = projectState.undoStack.pop()!;
        action.canRedo = true;

        // Move to redo stack
        projectState.redoStack.push(action);

        // Execute undo operation
        await this.executeUndo(action);

        return action;
    }

    /**
     * Perform redo operation
     */
    async redo(projectId: string): Promise<HistoryAction | null> {
        const projectState = this.getProjectState(projectId);

        if (!this.canRedo(projectId)) {
            return null;
        }

        const action = projectState.redoStack.pop()!;
        action.canRedo = false;

        // Move back to undo stack
        projectState.undoStack.push(action);

        // Execute redo operation
        await this.executeRedo(action);

        return action;
    }

    /**
     * Execute undo operation for a specific action
     */
    private async executeUndo(action: HistoryAction): Promise<void> {
        switch (action.type) {
            case 'TASK_UPDATE':
                await this.undoTaskUpdate(action.data as TaskActionData);
                break;
            case 'TASK_CREATE':
                await this.undoTaskCreate(action.data as TaskActionData);
                break;
            case 'TASK_DELETE':
                await this.undoTaskDelete(action.data as TaskActionData);
                break;
            case 'DEPENDENCY_CREATE':
                await this.undoDependencyCreate(action.data as DependencyActionData);
                break;
            case 'DEPENDENCY_DELETE':
                await this.undoDependencyDelete(action.data as DependencyActionData);
                break;
            case 'DEPENDENCY_UPDATE':
                await this.undoDependencyUpdate(action.data as DependencyActionData);
                break;
            case 'JOB_UPDATE':
                await this.undoJobUpdate(action.data as JobActionData);
                break;
            case 'RESOURCE_ASSIGN':
                await this.undoResourceAssign(action.data as ResourceActionData);
                break;
            case 'RESOURCE_UNASSIGN':
                await this.undoResourceUnassign(action.data as ResourceActionData);
                break;
            default:
                console.warn('Undo not implemented for action type:', action.type);
        }
    }

    /**
     * Execute redo operation for a specific action
     */
    private async executeRedo(action: HistoryAction): Promise<void> {
        switch (action.type) {
            case 'TASK_UPDATE':
                await this.redoTaskUpdate(action.data as TaskActionData);
                break;
            case 'TASK_CREATE':
                await this.redoTaskCreate(action.data as TaskActionData);
                break;
            case 'TASK_DELETE':
                await this.redoTaskDelete(action.data as TaskActionData);
                break;
            case 'DEPENDENCY_CREATE':
                await this.redoDependencyCreate(action.data as DependencyActionData);
                break;
            case 'DEPENDENCY_DELETE':
                await this.redoDependencyDelete(action.data as DependencyActionData);
                break;
            case 'DEPENDENCY_UPDATE':
                await this.redoDependencyUpdate(action.data as DependencyActionData);
                break;
            case 'JOB_UPDATE':
                await this.redoJobUpdate(action.data as JobActionData);
                break;
            case 'RESOURCE_ASSIGN':
                await this.redoResourceAssign(action.data as ResourceActionData);
                break;
            case 'RESOURCE_UNASSIGN':
                await this.redoResourceUnassign(action.data as ResourceActionData);
                break;
            default:
                console.warn('Redo not implemented for action type:', action.type);
        }
    }

    // Undo implementations
    private async undoTaskUpdate(data: TaskActionData): Promise<void> {
        if (data.oldData) {
            // TODO: Implement task update reversal
            console.log('Undoing task update:', data);
        }
    }

    private async undoTaskCreate(data: TaskActionData): Promise<void> {
        // TODO: Implement task deletion
        console.log('Undoing task create (deleting task):', data);
    }

    private async undoTaskDelete(data: TaskActionData): Promise<void> {
        // TODO: Implement task restoration
        console.log('Undoing task delete (restoring task):', data);
    }

    private async undoDependencyCreate(data: DependencyActionData): Promise<void> {
        // TODO: Implement dependency deletion
        console.log('Undoing dependency create (deleting dependency):', data);
    }

    private async undoDependencyDelete(data: DependencyActionData): Promise<void> {
        // TODO: Implement dependency restoration
        console.log('Undoing dependency delete (restoring dependency):', data);
    }

    private async undoDependencyUpdate(data: DependencyActionData): Promise<void> {
        if (data.oldData) {
            // TODO: Implement dependency update reversal
            console.log('Undoing dependency update:', data);
        }
    }

    private async undoJobUpdate(data: JobActionData): Promise<void> {
        if (data.oldData) {
            // TODO: Implement job update reversal
            console.log('Undoing job update:', data);
        }
    }

    private async undoResourceAssign(data: ResourceActionData): Promise<void> {
        // TODO: Implement resource unassignment
        console.log('Undoing resource assign (removing assignment):', data);
    }

    private async undoResourceUnassign(data: ResourceActionData): Promise<void> {
        // TODO: Implement resource reassignment
        console.log('Undoing resource unassign (restoring assignment):', data);
    }

    // Redo implementations (typically reverse of undo)
    private async redoTaskUpdate(data: TaskActionData): Promise<void> {
        if (data.newData) {
            // TODO: Implement task update reapplication
            console.log('Redoing task update:', data);
        }
    }

    private async redoTaskCreate(data: TaskActionData): Promise<void> {
        // TODO: Implement task recreation
        console.log('Redoing task create (recreating task):', data);
    }

    private async redoTaskDelete(data: TaskActionData): Promise<void> {
        // TODO: Implement task re-deletion
        console.log('Redoing task delete (re-deleting task):', data);
    }

    private async redoDependencyCreate(data: DependencyActionData): Promise<void> {
        // TODO: Implement dependency recreation
        console.log('Redoing dependency create (recreating dependency):', data);
    }

    private async redoDependencyDelete(data: DependencyActionData): Promise<void> {
        // TODO: Implement dependency re-deletion
        console.log('Redoing dependency delete (re-deleting dependency):', data);
    }

    private async redoDependencyUpdate(data: DependencyActionData): Promise<void> {
        if (data.newData) {
            // TODO: Implement dependency update reapplication
            console.log('Redoing dependency update:', data);
        }
    }

    private async redoJobUpdate(data: JobActionData): Promise<void> {
        if (data.newData) {
            // TODO: Implement job update reapplication
            console.log('Redoing job update:', data);
        }
    }

    private async redoResourceAssign(data: ResourceActionData): Promise<void> {
        // TODO: Implement resource reassignment
        console.log('Redoing resource assign (reassigning resource):', data);
    }

    private async redoResourceUnassign(data: ResourceActionData): Promise<void> {
        // TODO: Implement resource re-removal
        console.log('Redoing resource unassign (re-removing assignment):', data);
    }

    /**
     * Clear history for a project
     */
    clearHistory(projectId: string): void {
        this.state.delete(projectId);
    }

    /**
     * Get history actions for a project
     */
    getHistory(projectId: string): HistoryAction[] {
        const projectState = this.getProjectState(projectId);
        return [...projectState.undoStack].reverse(); // Most recent first
    }
}

// Export singleton instance
export const undoRedoService = new UndoRedoService();