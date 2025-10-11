// Profile Management Components
export { ProfileEditor } from './ProfileEditor'
export { RoleBasedProfileEditor } from './RoleBasedProfileEditor'
export { EnhancedProfileEditor } from './EnhancedProfileEditor'
export { EmailNotificationPreferences } from './EmailNotificationPreferences'
export { ProfileSettingsDashboard } from './ProfileSettingsDashboard'
export { ProfileValidationSystem } from './ProfileValidationSystem'
export { ProfileChangeNotificationSystem } from './ProfileChangeNotificationSystem'
export { ProfilePermissionsManager } from './ProfilePermissionsManager'
export { ProfileAuditTrail } from './ProfileAuditTrail'
export { ProfileDeletionManager } from './ProfileDeletionManager'
export { GDPRComplianceManager } from './GDPRComplianceManager'

// Avatar Management Components
export { AvatarUploadSystem } from './AvatarUploadSystem'
export { AvatarPreviewManager } from './AvatarPreviewManager'
export { FallbackAvatarGenerator } from './FallbackAvatarGenerator'
export { ImageCropperModal } from './ImageCropperModal'
export { IntegratedAvatarUpload } from './IntegratedAvatarUpload'

// Profile Services
export * from '../../services/profileValidationService'
export { sendProfileChangeNotification, getProfileNotificationSettings, sendProfileValidationNotification } from '../../services/profileNotificationService'
export * from '../../services/profileManagementService'