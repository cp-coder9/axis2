import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MessagingService } from './messaging/MessagingService';
import { ChannelType } from '../types/messaging';
import { UserRole } from '../types';

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

        // Send project message about team changes
        const messagingService = new MessagingService();
        const actionText = action === 'add' ? 'added to' : 'removed from';
        const memberText = teamMemberIds.length === 1 ? 'member has been' : 'members have been';

        await messagingService.sendMessage(
            projectId,
            `${teamMemberIds.length} team ${memberText} ${actionText} the project.`,
            'system',
            'System',
            UserRole.ADMIN,
            ChannelType.PROJECT_GENERAL
        );
    } catch (error) {
        console.error('Error updating project team:', error);
        throw new Error('Failed to update project team');
    }
};