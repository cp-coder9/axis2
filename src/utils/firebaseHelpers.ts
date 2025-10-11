// Firebase helpers for sanitizing data and error handling
/**
 * Sanitize data for Firestore by removing undefined values
 * @param data - The data object to sanitize
 * @returns Sanitized data object
 */
export const sanitizeForFirestore = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item));
  }
  
  if (typeof data === 'object' && data.constructor === Object) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Sanitize project file data specifically
 * @param file - The project file to sanitize
 * @returns Sanitized project file
 */
export const sanitizeProjectFile = (file: any): any => {
  return sanitizeForFirestore({
    ...file,
    // Ensure required fields have defaults
    id: file.id || `file-${Date.now()}`,
    name: file.name || 'Untitled File',
    size: file.size || 0,
    type: file.type || 'application/octet-stream',
    url: file.url || '',
    uploadedAt: file.uploadedAt || new Date(),
    uploaderId: file.uploaderId || '',
    uploaderName: file.uploaderName || 'Unknown User',
    permissions: file.permissions || {
      level: 'PROJECT_TEAM',
      allowDownload: true,
      allowShare: true,
      allowDelete: false,
      allowVersioning: true,
      allowComments: true
    }
  });
};