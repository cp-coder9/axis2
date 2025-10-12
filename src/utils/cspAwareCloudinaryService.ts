/**
 * CSP-Aware Cloudinary Service
 * Handles file uploads with Content Security Policy awareness and fallback mechanisms
 */

import { ProjectFile, UserRole, FilePermissionLevel, FileCategory } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { NetworkHelper } from '@/network-helper';

interface CSPAwareUploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
  progressCallback?: (progress: number) => void;
  category?: FileCategory;
  projectId?: string;
  description?: string;
  retryAttempts?: number;
  fallbackToFirebase?: boolean;
}

interface UploadResult {
  success: boolean;
  projectFile?: ProjectFile;
  error?: string;
  isCSPViolation?: boolean;
  usedFallback?: boolean;
}

class CSPAwareCloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private isConfigured: boolean;
  private cspViolationDetected: boolean = false;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
    this.isConfigured = !!(this.cloudName && this.uploadPreset);

    // Listen for CSP violations related to Cloudinary
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event: any) => {
        if (event.blockedURI && event.blockedURI.includes('cloudinary')) {
          this.cspViolationDetected = true;
          console.warn('🚫 CSP violation detected for Cloudinary:', {
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective
          });
        }
      });
    }
  }

  /**
   * Check if Cloudinary is properly configured
   */
  public checkConfiguration(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.cloudName) {
      issues.push('VITE_CLOUDINARY_CLOUD_NAME is missing');
    }

    if (!this.uploadPreset) {
      issues.push('VITE_CLOUDINARY_UPLOAD_PRESET is missing');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Upload file with CSP awareness and retry logic
   */
  public async uploadFile(
    file: File,
    userId: string,
    userName: string,
    userRole: UserRole = UserRole.FREELANCER,
    options: CSPAwareUploadOptions = {}
  ): Promise<UploadResult> {
    // Check configuration first
    const configCheck = this.checkConfiguration();
    if (!configCheck.isValid) {
      return {
        success: false,
        error: `Cloudinary configuration error: ${configCheck.issues.join(', ')}`
      };
    }

    // If CSP violation was previously detected, try fallback immediately
    if (this.cspViolationDetected && options.fallbackToFirebase) {
      console.warn('⚠️ Previous CSP violation detected, using Firebase fallback');
      return this.uploadToFirebaseFallback(file, userId, userName, userRole, options);
    }

    const maxRetries = options.retryAttempts || 3;
    let lastError: string = '';

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.attemptCloudinaryUpload(
          file,
          userId,
          userName,
          userRole,
          options,
          attempt
        );

        if (result.success) {
          return result;
        }

        // If CSP violation detected, try fallback
        if (result.isCSPViolation && options.fallbackToFirebase) {
          console.warn('🔄 CSP violation detected, switching to Firebase fallback');
          return this.uploadToFirebaseFallback(file, userId, userName, userRole, options);
        }

        lastError = result.error || 'Unknown error';

        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await NetworkHelper.delay(delay);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Upload failed';
        
        // Check if error is CSP-related
        if (NetworkHelper.isCSPRelatedError(error as Error) && options.fallbackToFirebase) {
          console.warn('🔄 CSP error detected, switching to Firebase fallback');
          return this.uploadToFirebaseFallback(file, userId, userName, userRole, options);
        }
      }
    }

    return {
      success: false,
      error: `Upload failed after ${maxRetries} attempts: ${lastError}`
    };
  }

  /**
   * Attempt to upload to Cloudinary with CSP detection
   */
  private async attemptCloudinaryUpload(
    file: File,
    userId: string,
    userName: string,
    userRole: UserRole,
    options: CSPAwareUploadOptions,
    attempt: number
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    // Add optional parameters
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    // Add context for metadata
    const context = {
      userId,
      userName,
      userRole,
      category: options.category || 'DOCUMENTS',
      projectId: options.projectId || '',
      uploadedAt: new Date().toISOString()
    };
    formData.append('context', Object.entries(context).map(([k, v]) => `${k}=${v}`).join('|'));

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;

    try {
      // Use NetworkHelper for CSP-aware fetch
      const fetchResult = await NetworkHelper.fetchWithCSPHandling(
        uploadUrl,
        {
          method: 'POST',
          body: formData
        },
        {
          maxRetries: 0, // We handle retries at a higher level
          baseDelay: 0
        }
      );

      if (!fetchResult.success) {
        return {
          success: false,
          error: fetchResult.error,
          isCSPViolation: fetchResult.isCSPViolation
        };
      }

      const response = fetchResult.response!;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `Upload failed with status ${response.status}`
        };
      }

      const data = await response.json();

      // Create ProjectFile from Cloudinary response
      const projectFile: ProjectFile = {
        id: data.public_id,
        name: file.name,
        url: data.secure_url,
        type: file.type,
        size: file.size,
        uploaderId: userId,
        uploaderName: userName,
        uploadedBy: userId,
        uploadedByName: userName,
        uploadedAt: Timestamp.now(),
        category: options.category || FileCategory.DOCUMENTS,
        projectId: options.projectId || '',
        tags: options.tags || [],
        permissions: {
          level: userRole === UserRole.CLIENT 
            ? FilePermissionLevel.CLIENT_VISIBLE 
            : FilePermissionLevel.PROJECT_TEAM,
          allowDownload: true,
          allowShare: userRole === UserRole.ADMIN,
          allowDelete: userRole === UserRole.ADMIN || userId === userId,
          allowVersioning: userRole !== UserRole.CLIENT,
          allowComments: true
        },
        metadata: {
          width: data.width,
          height: data.height,
          format: data.format,
          customFields: {
            cloudinaryPublicId: data.public_id,
            cloudinaryVersion: data.version,
            cloudinaryResourceType: data.resource_type,
            bytes: data.bytes,
            etag: data.etag
          }
        }
      };

      // Call progress callback with 100%
      if (options.progressCallback) {
        options.progressCallback(100);
      }

      return {
        success: true,
        projectFile
      };

    } catch (error) {
      const isCSP = NetworkHelper.isCSPRelatedError(error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        isCSPViolation: isCSP
      };
    }
  }

  /**
   * Fallback to Firebase Storage when Cloudinary is blocked by CSP
   */
  private async uploadToFirebaseFallback(
    file: File,
    userId: string,
    userName: string,
    userRole: UserRole,
    options: CSPAwareUploadOptions
  ): Promise<UploadResult> {
    try {
      // Import Firebase Storage dynamically to avoid circular dependencies
      const { storage } = await import('@/firebase');
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${options.category || 'documents'}/${userId}/${timestamp}_${sanitizedFileName}`;
      
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (options.progressCallback) {
              options.progressCallback(progress);
            }
          },
          (error) => {
            resolve({
              success: false,
              error: `Firebase fallback failed: ${error.message}`,
              usedFallback: true
            });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              const projectFile: ProjectFile = {
                id: `firebase_${timestamp}_${sanitizedFileName}`,
                name: file.name,
                url: downloadURL,
                type: file.type,
                size: file.size,
                uploaderId: userId,
                uploaderName: userName,
                uploadedBy: userId,
                uploadedByName: userName,
                uploadedAt: Timestamp.now(),
                category: options.category || FileCategory.DOCUMENTS,
                projectId: options.projectId || '',
                tags: [...(options.tags || []), 'firebase-fallback'],
                permissions: {
                  level: userRole === UserRole.CLIENT 
                    ? FilePermissionLevel.CLIENT_VISIBLE 
                    : FilePermissionLevel.PROJECT_TEAM,
                  allowDownload: true,
                  allowShare: userRole === UserRole.ADMIN,
                  allowDelete: userRole === UserRole.ADMIN || userId === userId,
                  allowVersioning: userRole !== UserRole.CLIENT,
                  allowComments: true
                },
                metadata: {
                  customFields: {
                    storageProvider: 'firebase',
                    storagePath: storagePath,
                    fallbackReason: 'csp-violation'
                  }
                }
              };

              resolve({
                success: true,
                projectFile,
                usedFallback: true
              });
            } catch (error) {
              resolve({
                success: false,
                error: `Failed to get download URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
                usedFallback: true
              });
            }
          }
        );
      });
    } catch (error) {
      return {
        success: false,
        error: `Firebase fallback initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        usedFallback: true
      };
    }
  }

  /**
   * Batch upload with CSP awareness
   */
  public async uploadFiles(
    files: File[],
    userId: string,
    userName: string,
    userRole: UserRole = UserRole.FREELANCER,
    options: CSPAwareUploadOptions = {}
  ): Promise<{ results: UploadResult[]; successCount: number; failureCount: number }> {
    const results: UploadResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const result = await this.uploadFile(file, userId, userName, userRole, options);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      results,
      successCount,
      failureCount
    };
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<{
    configured: boolean;
    accessible: boolean;
    cspBlocked: boolean;
    recommendations: string[];
  }> {
    const configCheck = this.checkConfiguration();
    const recommendations: string[] = [];

    if (!configCheck.isValid) {
      recommendations.push('Configure Cloudinary credentials in environment variables');
      return {
        configured: false,
        accessible: false,
        cspBlocked: false,
        recommendations
      };
    }

    // Test connectivity to Cloudinary
    const testUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/sample.jpg`;
    const connectivityResult = await NetworkHelper.fetchWithCSPHandling(testUrl, {
      method: 'HEAD',
      mode: 'cors'
    });

    const cspBlocked = connectivityResult.isCSPViolation || this.cspViolationDetected;

    if (cspBlocked) {
      recommendations.push('Add Cloudinary domains to CSP connect-src and img-src directives');
      recommendations.push('Consider using Firebase Storage as fallback');
    }

    if (!connectivityResult.success && !cspBlocked) {
      recommendations.push('Check internet connectivity');
      recommendations.push('Verify Cloudinary cloud name is correct');
    }

    return {
      configured: true,
      accessible: connectivityResult.success,
      cspBlocked,
      recommendations
    };
  }
}

// Export singleton instance
export const cspAwareCloudinaryService = new CSPAwareCloudinaryService();

// Export class for testing
export { CSPAwareCloudinaryService };
