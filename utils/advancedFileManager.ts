import { ProjectFile } from '../src/types';

/**
 * Advanced File Manager utility for file operations
 */
class AdvancedFileManager {
  /**
   * Get files by category
   */
  getFilesByCategory(files: ProjectFile[], category: string): ProjectFile[] {
    return files.filter(file => file.category === category);
  }

  /**
   * Search files by query
   */
  searchFiles(files: ProjectFile[], query: string): ProjectFile[] {
    const lowerQuery = query.toLowerCase();
    return files.filter(file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      (file.tags && file.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  /**
   * Sort files by criteria
   */
  sortFiles(files: ProjectFile[], sortBy: 'name' | 'date' | 'size', order: 'asc' | 'desc' = 'asc'): ProjectFile[] {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Get file statistics
   */
  getFileStats(files: ProjectFile[]) {
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      byCategory: files.reduce((acc, file) => {
        acc[file.category] = (acc[file.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Get file analytics for a project
   */
  static async getFileAnalytics(projectId: string) {
    try {
      // Import Firestore functions
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      
      // Fetch files for the project
      const filesRef = collection(db, 'projects', projectId, 'files');
      const q = query(filesRef);
      const snapshot = await getDocs(q);
      
      const files: ProjectFile[] = [];
      snapshot.forEach(doc => {
        files.push({ id: doc.id, ...doc.data() } as ProjectFile);
      });
      
      // Calculate analytics
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      const filesByCategory: Record<string, number> = {};
      const filesByUploader: Record<string, number> = {};
      
      files.forEach(file => {
        // Count by category
        const category = file.category || 'uncategorized';
        filesByCategory[category] = (filesByCategory[category] || 0) + 1;
        
        // Count by uploader
        const uploader = file.uploadedBy || 'unknown';
        filesByUploader[uploader] = (filesByUploader[uploader] || 0) + 1;
      });
      
      // Get most recently uploaded files (top 10)
      const recentlyUploadedFiles = [...files]
        .sort((a, b) => {
          const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : new Date(a.uploadedAt);
          const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : new Date(b.uploadedAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10)
        .map(f => ({ id: f.id, name: f.name, uploadedAt: f.uploadedAt }));
      
      // For mostAccessedFiles, we would need access count tracking in a real implementation
      const mostAccessedFiles: any[] = [];
      
      return {
        totalFiles: files.length,
        totalSize,
        filesByCategory,
        filesByUploader,
        mostAccessedFiles,
        recentlyUploadedFiles
      };
    } catch (error) {
      console.error('Error getting file analytics for project:', projectId, error);
      return {
        totalFiles: 0,
        totalSize: 0,
        filesByCategory: {} as Record<string, number>,
        filesByUploader: {} as Record<string, number>,
        mostAccessedFiles: [],
        recentlyUploadedFiles: []
      };
    }
  }

  /**
   * Soft delete a file
   */
  static async softDeleteFile(projectId: string, fileId: string, reason: string, user: any) {
    try {
      // Import Firestore functions
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      
      // Update file document with soft delete flag
      const fileRef = doc(db, 'projects', projectId, 'files', fileId);
      await updateDoc(fileRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: user.id,
        deletedByName: user.name,
        deletionReason: reason
      });
      
      console.log('File soft deleted:', fileId, 'reason:', reason, 'by:', user.id);
    } catch (error) {
      console.error('Error soft deleting file:', fileId, error);
      throw new Error('Failed to soft delete file');
    }
  }

  /**
   * Bulk update files
   */
  static async bulkUpdateFiles(projectId: string, fileIds: string[], updates: Partial<ProjectFile>, user: any) {
    try {
      // Import Firestore functions
      const { doc, updateDoc, writeBatch, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      
      // Use batch write for atomic bulk update
      const batch = writeBatch(db);
      
      fileIds.forEach(fileId => {
        const fileRef = doc(db, 'projects', projectId, 'files', fileId);
        batch.update(fileRef, {
          ...updates,
          updatedAt: serverTimestamp(),
          updatedBy: user.id,
          updatedByName: user.name
        });
      });
      
      await batch.commit();
      console.log('Bulk updated files:', fileIds.length, 'files with updates:', updates, 'by:', user.id);
    } catch (error) {
      console.error('Error bulk updating files:', error);
      throw new Error('Failed to bulk update files');
    }
  }

  /**
   * Update file metadata
   */
  static async updateFileMetadata(projectId: string, fileId: string, updates: Partial<ProjectFile>, user: any) {
    try {
      // Import Firestore functions
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      
      // Update file metadata
      const fileRef = doc(db, 'projects', projectId, 'files', fileId);
      await updateDoc(fileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.id,
        updatedByName: user.name
      });
      
      console.log('Updated metadata for file:', fileId, 'updates:', updates, 'by:', user.id);
    } catch (error) {
      console.error('Error updating file metadata:', fileId, error);
      throw new Error('Failed to update file metadata');
    }
  }
}

export default AdvancedFileManager;
