import { describe, it, expect, beforeEach } from 'vitest';
import { UserRole, FilePermissionLevel } from '@/types';
import { 
  cloudinaryFolderService, 
  FileCategory, 
  FileMetadata 
} from '@/services/cloudinaryFolderService';
import { fileMetadataService } from '@/services/fileMetadataService';
import { cloudinaryManagementService } from '@/services/cloudinaryManagementService';

describe('Cloudinary Folder Organization', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  describe('Folder Path Generation', () => {
    it('should generate correct project folder paths', () => {
      const metadata: FileMetadata = {
        userId: 'user123',
        userRole: UserRole.FREELANCER,
        category: FileCategory.DOCUMENTS,
        projectId: 'project456',
        tags: [],
        permissions: FilePermissionLevel.PROJECT_TEAM
      };

      const folderPath = cloudinaryFolderService.getFolderPath(metadata);
      expect(folderPath).toBe('architex-axis/projects/project456/documents');
    });

    it('should generate correct user folder paths', () => {
      const metadata: FileMetadata = {
        userId: 'user123',
        userRole: UserRole.FREELANCER,
        category: FileCategory.PROFILE,
        tags: [],
        permissions: FilePermissionLevel.PROJECT_TEAM
      };

      const folderPath = cloudinaryFolderService.getFolderPath(metadata);
      expect(folderPath).toBe('architex-axis/users/user123/profile');
    });

    it('should generate correct admin system folder paths', () => {
      const metadata: FileMetadata = {
        userId: 'admin123',
        userRole: UserRole.ADMIN,
        category: FileCategory.SYSTEM,
        tags: [],
        permissions: FilePermissionLevel.ADMIN_ONLY
      };

      const folderPath = cloudinaryFolderService.getFolderPath(metadata);
      expect(folderPath).toBe('architex-axis/admin/system');
    });
  });

  describe('Tag Generation', () => {
    it('should generate appropriate tags for project files', () => {
      const metadata: FileMetadata = {
        userId: 'user123',
        userRole: UserRole.FREELANCER,
        category: FileCategory.SUBSTANTIATION,
        projectId: 'project456',
        tags: ['proof-of-work'],
        permissions: FilePermissionLevel.PROJECT_TEAM
      };

      const tags = cloudinaryFolderService.generateTags(metadata);
      
      expect(tags).toContain('role:freelancer');
      expect(tags).toContain('category:substantiation');
      expect(tags).toContain('user:user123');
      expect(tags).toContain('project:project456');
      expect(tags).toContain('proof-of-work');
      expect(tags.some(tag => tag.startsWith('date:'))).toBe(true);
    });

    it('should generate tags for user files without project', () => {
      const metadata: FileMetadata = {
        userId: 'user123',
        userRole: UserRole.CLIENT,
        category: FileCategory.DOCUMENTS,
        tags: ['requirements'],
        permissions: FilePermissionLevel.CLIENT_VISIBLE
      };

      const tags = cloudinaryFolderService.generateTags(metadata);
      
      expect(tags).toContain('role:client');
      expect(tags).toContain('category:documents');
      expect(tags).toContain('user:user123');
      expect(tags).toContain('requirements');
      expect(tags.some(tag => tag.includes('project:'))).toBe(false);
    });
  });

  describe('Access Control', () => {
    it('should allow admin access to all folders', () => {
      const access = cloudinaryFolderService.checkFolderAccess(
        'architex-axis/projects/project123/documents',
        UserRole.ADMIN,
        'admin123',
        []
      );

      expect(access.hasAccess).toBe(true);
      expect(access.permissions.read).toBe(true);
      expect(access.permissions.write).toBe(true);
      expect(access.permissions.delete).toBe(true);
    });

    it('should allow user access to their own folder', () => {
      const access = cloudinaryFolderService.checkFolderAccess(
        'architex-axis/users/user123/documents',
        UserRole.FREELANCER,
        'user123',
        []
      );

      expect(access.hasAccess).toBe(true);
      expect(access.permissions.read).toBe(true);
      expect(access.permissions.write).toBe(true);
      expect(access.permissions.delete).toBe(true);
    });

    it('should allow project member access to project folders', () => {
      const access = cloudinaryFolderService.checkFolderAccess(
        'architex-axis/projects/project123/documents',
        UserRole.FREELANCER,
        'user123',
        ['user123', 'user456']
      );

      expect(access.hasAccess).toBe(true);
      expect(access.permissions.read).toBe(true);
      expect(access.permissions.write).toBe(true);
      expect(access.permissions.delete).toBe(false);
    });

    it('should deny client write access to project folders', () => {
      const access = cloudinaryFolderService.checkFolderAccess(
        'architex-axis/projects/project123/documents',
        UserRole.CLIENT,
        'client123',
        ['client123']
      );

      expect(access.hasAccess).toBe(true);
      expect(access.permissions.read).toBe(true);
      expect(access.permissions.write).toBe(false);
      expect(access.permissions.delete).toBe(false);
    });

    it('should deny access to non-project members', () => {
      const access = cloudinaryFolderService.checkFolderAccess(
        'architex-axis/projects/project123/documents',
        UserRole.FREELANCER,
        'user123',
        ['user456', 'user789'] // user123 not in project
      );

      expect(access.hasAccess).toBe(false);
      expect(access.permissions.read).toBe(false);
      expect(access.permissions.write).toBe(false);
      expect(access.permissions.delete).toBe(false);
    });
  });

  describe('File Categorization', () => {
    it('should categorize image files correctly', () => {
      const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
      const category = fileMetadataService.categorizeFile(file, UserRole.FREELANCER);
      expect(category).toBe(FileCategory.IMAGES);
    });

    it('should categorize PDF files as deliverables', () => {
      const file = new File([''], 'document.pdf', { type: 'application/pdf' });
      const category = fileMetadataService.categorizeFile(file, UserRole.FREELANCER);
      expect(category).toBe(FileCategory.DELIVERABLES);
    });

    it('should categorize substantiation files for freelancers', () => {
      const file = new File([''], 'proof-of-work.pdf', { type: 'application/pdf' });
      const category = fileMetadataService.categorizeFile(file, UserRole.FREELANCER);
      expect(category).toBe(FileCategory.SUBSTANTIATION);
    });

    it('should categorize archive files correctly', () => {
      const file = new File([''], 'archive.zip', { type: 'application/zip' });
      const category = fileMetadataService.categorizeFile(file, UserRole.ADMIN);
      expect(category).toBe(FileCategory.ARCHIVES);
    });

    it('should categorize profile images correctly', () => {
      const file = new File([''], 'avatar.png', { type: 'image/png' });
      const category = fileMetadataService.categorizeFile(file, UserRole.CLIENT);
      expect(category).toBe(FileCategory.PROFILE);
    });
  });

  describe('File Validation', () => {
    it('should validate file metadata correctly', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const metadata: FileMetadata = {
        userId: 'user123',
        userRole: UserRole.FREELANCER,
        category: FileCategory.DOCUMENTS,
        tags: ['test'],
        permissions: FilePermissionLevel.PROJECT_TEAM
      };

      const validation = fileMetadataService.validateFileMetadata(file, metadata, UserRole.FREELANCER);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      // Create a mock file that exceeds freelancer limit (50MB)
      const largeFile = {
        name: 'large.pdf',
        type: 'application/pdf',
        size: 60 * 1024 * 1024 // 60MB
      } as File;

      const metadata: FileMetadata = {
        userId: 'user123',
        userRole: UserRole.FREELANCER,
        category: FileCategory.DOCUMENTS,
        tags: [],
        permissions: FilePermissionLevel.PROJECT_TEAM
      };

      const validation = fileMetadataService.validateFileMetadata(largeFile, metadata, UserRole.FREELANCER);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('size exceeds limit'))).toBe(true);
    });

    it('should reject invalid file types for client role', () => {
      const file = new File([''], 'script.js', { type: 'application/javascript' });
      const metadata: FileMetadata = {
        userId: 'client123',
        userRole: UserRole.CLIENT,
        category: FileCategory.DOCUMENTS,
        tags: [],
        permissions: FilePermissionLevel.CLIENT_VISIBLE
      };

      const validation = fileMetadataService.validateFileMetadata(file, metadata, UserRole.CLIENT);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('not allowed'))).toBe(true);
    });

    it('should reject substantiation files from clients', () => {
      const file = new File([''], 'proof.pdf', { type: 'application/pdf' });
      const metadata: FileMetadata = {
        userId: 'client123',
        userRole: UserRole.CLIENT,
        category: FileCategory.SUBSTANTIATION,
        projectId: 'project123',
        tags: [],
        permissions: FilePermissionLevel.CLIENT_VISIBLE
      };

      const validation = fileMetadataService.validateFileMetadata(file, metadata, UserRole.CLIENT);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('substantiation'))).toBe(true);
    });
  });

  describe('Context String Management', () => {
    it('should create and parse context strings correctly', () => {
      const metadata: FileMetadata = {
        userId: 'user123',
        userRole: UserRole.FREELANCER,
        category: FileCategory.SUBSTANTIATION,
        projectId: 'project456',
        tags: ['proof'],
        permissions: FilePermissionLevel.PROJECT_TEAM,
        description: 'Test file'
      };

      const contextString = cloudinaryFolderService.createContextString(metadata);
      expect(contextString).toContain('userId=user123');
      expect(contextString).toContain('userRole=FREELANCER');
      expect(contextString).toContain('category=SUBSTANTIATION');
      expect(contextString).toContain('projectId=project456');
      expect(contextString).toContain('permissions=PROJECT_TEAM');

      const parsedMetadata = cloudinaryFolderService.parseFileMetadata(contextString);
      expect(parsedMetadata.userId).toBe('user123');
      expect(parsedMetadata.userRole).toBe(UserRole.FREELANCER);
      expect(parsedMetadata.category).toBe(FileCategory.SUBSTANTIATION);
      expect(parsedMetadata.projectId).toBe('project456');
      expect(parsedMetadata.permissions).toBe(FilePermissionLevel.PROJECT_TEAM);
    });
  });

  describe('Cloudinary Management Service', () => {
    it('should check configuration status', () => {
      const status = cloudinaryManagementService.getConfigStatus();
      expect(status).toHaveProperty('isConfigured');
      expect(status).toHaveProperty('hasApiCredentials');
      expect(status).toHaveProperty('missingVars');
      expect(Array.isArray(status.missingVars)).toBe(true);
    });

    it('should generate signed URLs with transformations', () => {
      const url = cloudinaryManagementService.generateSignedUrl(
        'test-public-id',
        UserRole.FREELANCER,
        {
          transformation: {
            width: 400,
            height: 300,
            crop: 'fit',
            quality: 'auto'
          },
          downloadName: 'test-file.jpg'
        }
      );

      expect(url).toContain('test-public-id');
      expect(url).toContain('w_400');
      expect(url).toContain('h_300');
      expect(url).toContain('c_fit');
      expect(url).toContain('q_auto');
    });

    it('should generate preview URLs for different sizes', () => {
      const thumbnailUrl = cloudinaryManagementService.generatePreviewUrl(
        'test-image',
        'image/jpeg',
        'thumbnail'
      );
      
      const mediumUrl = cloudinaryManagementService.generatePreviewUrl(
        'test-image',
        'image/jpeg',
        'medium'
      );

      expect(thumbnailUrl).toContain('w_150');
      expect(thumbnailUrl).toContain('h_150');
      expect(mediumUrl).toContain('w_400');
      expect(mediumUrl).toContain('h_300');
    });
  });
});