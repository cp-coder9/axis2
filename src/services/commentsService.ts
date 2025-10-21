import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Comment Types
 */
export interface Comment {
    id: string;
    projectId: string;
    taskId?: string; // If null, it's a project-level comment
    jobId?: string; // If null, it's a task-level comment
    userId: string;
    userName: string;
    userEmail: string;
    content: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isEdited: boolean;
    parentCommentId?: string; // For threaded comments
    mentions?: string[]; // User IDs mentioned in the comment
    attachments?: CommentAttachment[];
}

export interface CommentAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Timestamp;
}

/**
 * Comments Service
 */
export const commentsService = {
    /**
     * Create a new comment
     */
    async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'isEdited'>): Promise<string> {
        const commentRef = doc(collection(db, 'comments'));
        const commentData = {
            ...comment,
            id: commentRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isEdited: false
        };

        await setDoc(commentRef, commentData);
        return commentRef.id;
    },

    /**
     * Get comments for a project
     */
    async getProjectComments(projectId: string): Promise<Comment[]> {
        const q = query(
            collection(db, 'comments'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
    },

    /**
     * Get comments for a specific task
     */
    async getTaskComments(projectId: string, taskId: string): Promise<Comment[]> {
        const q = query(
            collection(db, 'comments'),
            where('projectId', '==', projectId),
            where('taskId', '==', taskId),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
    },

    /**
     * Get comments for a specific job
     */
    async getJobComments(projectId: string, jobId: string): Promise<Comment[]> {
        const q = query(
            collection(db, 'comments'),
            where('projectId', '==', projectId),
            where('jobId', '==', jobId),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
    },

    /**
     * Update a comment
     */
    async updateComment(commentId: string, content: string): Promise<void> {
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
            content,
            updatedAt: serverTimestamp(),
            isEdited: true
        });
    },

    /**
     * Delete a comment
     */
    async deleteComment(commentId: string): Promise<void> {
        const commentRef = doc(db, 'comments', commentId);
        await deleteDoc(commentRef);
    },

    /**
     * Add attachment to a comment
     */
    async addAttachment(commentId: string, attachment: Omit<CommentAttachment, 'id' | 'uploadedAt'>): Promise<string> {
        const commentRef = doc(db, 'comments', commentId);
        const attachmentId = `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const attachmentData = {
            ...attachment,
            id: attachmentId,
            uploadedAt: serverTimestamp()
        };

        // Get current comment
        const commentDoc = await getDoc(commentRef);
        if (!commentDoc.exists()) {
            throw new Error('Comment not found');
        }

        const currentAttachments = commentDoc.data()?.attachments || [];
        const updatedAttachments = [...currentAttachments, attachmentData];

        await updateDoc(commentRef, {
            attachments: updatedAttachments,
            updatedAt: serverTimestamp()
        });

        return attachmentId;
    },

    /**
     * Remove attachment from a comment
     */
    async removeAttachment(commentId: string, attachmentId: string): Promise<void> {
        const commentRef = doc(db, 'comments', commentId);

        // Get current comment
        const commentDoc = await getDoc(commentRef);
        if (!commentDoc.exists()) {
            throw new Error('Comment not found');
        }

        const currentAttachments = commentDoc.data()?.attachments || [];
        const updatedAttachments = currentAttachments.filter((att: CommentAttachment) => att.id !== attachmentId);

        await updateDoc(commentRef, {
            attachments: updatedAttachments,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Subscribe to real-time comments for a project
     */
    subscribeToProjectComments(projectId: string, callback: (comments: Comment[]) => void) {
        const q = query(
            collection(db, 'comments'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Comment));
            callback(comments);
        });
    },

    /**
     * Subscribe to real-time comments for a task
     */
    subscribeToTaskComments(projectId: string, taskId: string, callback: (comments: Comment[]) => void) {
        const q = query(
            collection(db, 'comments'),
            where('projectId', '==', projectId),
            where('taskId', '==', taskId),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Comment));
            callback(comments);
        });
    },

    /**
     * Get comment count for a task
     */
    async getTaskCommentCount(projectId: string, taskId: string): Promise<number> {
        const comments = await this.getTaskComments(projectId, taskId);
        return comments.length;
    },

    /**
     * Get comment count for a job
     */
    async getJobCommentCount(projectId: string, jobId: string): Promise<number> {
        const comments = await this.getJobComments(projectId, jobId);
        return comments.length;
    },

    /**
     * Get recent comments for a project (last N comments)
     */
    async getRecentComments(projectId: string, limit: number = 10): Promise<Comment[]> {
        const q = query(
            collection(db, 'comments'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const comments = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Comment))
            .slice(0, limit);

        // Return in chronological order (oldest first)
        return comments.reverse();
    }
};