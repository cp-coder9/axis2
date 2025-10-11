import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';

const PROJECTS_COLLECTION = 'projects';

/**
 * Update the team for a project.
 */
export const updateProjectTeam = async (
    projectId: string,
    teamMemberIds: string[],
    action: 'add' | 'remove'
): Promise<void> => {
    try {
        const projectDocRef = doc(db, PROJECTS_COLLECTION, projectId);
        const updateAction = action === 'add' ? arrayUnion(...teamMemberIds) : arrayRemove(...teamMemberIds);

        await updateDoc(projectDocRef, {
            assignedTeamIds: updateAction,
        });
    } catch (error) {
        console.error('Error updating project team:', error);
        throw new Error('Failed to update project team');
    }
};