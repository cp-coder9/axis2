import { 
  doc, 
  getDoc,
  setDoc,
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase'
import { User, UserRole, Notification, NotificationType } from '../types'

/**
 * Profile Notification Service
 * Handles profile change notifications, settings, and audit logging
 */

export interface ProfileNotificationSettings {
  userId: string
  // Email notifications
  emailOnProfileUpdate: boolean
  emailOnValidationChange: boolean
  emailOnCompletenessAlert: boolean
  // In-app notifications
  inAppOnProfileUpdate: boolean
  inAppOnValidationChange: boolean
  inAppOnCompletenessAlert: boolean
  // Admin notifications
  notifyAdminsOnChange: boolean
  notifyOnSecurityChange: boolean
  // Notification frequency
  digestFrequency: 'immediate' | 'daily' | 'weekly' | 'disabled'
  // Last updated
  updatedAt: Date
  updatedBy: string
}

export interface ProfileChangeEvent {
  userId: string
  field: string
  oldValue: any
  newValue: any
  changedBy: string
  changedByName: string
  timestamp: Date
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATION'
  reason?: string
  ipAddress?: string
  userAgent?: string
}

// Collection references
const NOTIFICATION_SETTINGS_COLLECTION = 'profileNotificationSettings'
const PROFILE_CHANGES_COLLECTION = 'profileChanges'
const NOTIFICATIONS_COLLECTION = 'notifications'

/**
 * Get default notification settings for a user role
 */
const getDefaultNotificationSettings = (userId: string, role: UserRole): ProfileNotificationSettings => {
  const baseSettings = {
    userId,
    emailOnProfileUpdate: true,
    emailOnValidationChange: true,
    emailOnCompletenessAlert: true,
    inAppOnProfileUpdate: true,
    inAppOnValidationChange: true,
    notifyAdminsOnChange: false,
    notifyOnSecurityChange: false,
    digestFrequency: 'immediate' as const,
    updatedAt: new Date(),
    updatedBy: userId
  }

  // Role-specific defaults
  switch (role) {
    case UserRole.ADMIN:
      return {
        ...baseSettings,
        notifyAdminsOnChange: true,
        notifyOnSecurityChange: true,
        inAppOnCompletenessAlert: true
      }
    case UserRole.FREELANCER:
      return {
        ...baseSettings,
        emailOnCompletenessAlert: true, // Freelancers need complete profiles
        inAppOnCompletenessAlert: true
      }
    case UserRole.CLIENT:
      return {
        ...baseSettings,
        digestFrequency: 'daily', // Clients might prefer less frequent notifications
        inAppOnCompletenessAlert: true
      }
    default:
      return {
        ...baseSettings,
        inAppOnCompletenessAlert: true
      }
  }
}

/**
 * Get profile notification settings for a user
 */
export const getProfileNotificationSettings = async (userId: string): Promise<ProfileNotificationSettings> => {
  try {
    const settingsRef = doc(db, NOTIFICATION_SETTINGS_COLLECTION, userId)
    const settingsDoc = await getDoc(settingsRef)
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data()
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as ProfileNotificationSettings
    } else {
      // Create default settings if they don't exist
      // Note: In a real implementation, you'd get the user's role from the user document
      const defaultSettings = getDefaultNotificationSettings(userId, UserRole.FREELANCER)
      await setDoc(settingsRef, {
        ...defaultSettings,
        updatedAt: serverTimestamp()
      })
      return defaultSettings
    }
  } catch (error) {
    console.error('Error getting profile notification settings:', error)
    throw new Error('Failed to get notification settings')
  }
}

/**
 * Update profile notification settings for a user
 */
export const updateProfileNotificationSettings = async (
  userId: string,
  settings: Partial<ProfileNotificationSettings>
): Promise<void> => {
  try {
    const settingsRef = doc(db, NOTIFICATION_SETTINGS_COLLECTION, userId)
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    })
    
    console.log('Profile notification settings updated for user:', userId)
  } catch (error) {
    console.error('Error updating profile notification settings:', error)
    throw new Error('Failed to update notification settings')
  }
}

/**
 * Log a profile change event
 */
export const logProfileChangeEvent = async (event: ProfileChangeEvent): Promise<void> => {
  try {
    const changeRef = collection(db, PROFILE_CHANGES_COLLECTION)
    await addDoc(changeRef, {
      ...event,
      timestamp: serverTimestamp()
    })
    
    console.log('Profile change event logged:', event)
  } catch (error) {
    console.error('Error logging profile change event:', error)
    // Don't throw error for logging failures
  }
}

/**
 * Get profile change history for a user
 */
export const getProfileChangeHistory = async (
  userId: string,
  limitCount: number = 10
): Promise<ProfileChangeEvent[]> => {
  try {
    const changesRef = collection(db, PROFILE_CHANGES_COLLECTION)
    const q = query(
      changesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    const querySnapshot = await getDocs(q)
    const changes: ProfileChangeEvent[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      changes.push({
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as ProfileChangeEvent)
    })
    
    return changes
  } catch (error) {
    console.error('Error getting profile change history:', error)
    return []
  }
}

/**
 * Send profile change notification
 */
export const sendProfileChangeNotification = async (
  changeEvent: ProfileChangeEvent,
  targetUser: User
): Promise<Notification> => {
  try {
    // Get notification settings for the user
    const settings = await getProfileNotificationSettings(targetUser.id)
    
    // Determine notification content based on change type
    const notificationContent = generateNotificationContent(changeEvent, targetUser)
    
    // Create notification object
    const notification: Omit<Notification, 'id'> = {
      userId: targetUser.id,
      type: NotificationType.SYSTEM,
      title: notificationContent.title,
      message: notificationContent.message,
      createdAt: serverTimestamp() as Timestamp,
      read: false
    }
    
    // Send in-app notification if enabled
    if (shouldSendInAppNotification(changeEvent, settings)) {
      const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification)
      console.log('In-app notification sent:', notificationRef.id)
    }
    
    // Send email notification if enabled
    if (shouldSendEmailNotification(changeEvent, settings)) {
      await sendEmailNotification(targetUser, notificationContent)
    }
    
    // Notify admins if required
    if (settings.notifyAdminsOnChange || 
        (settings.notifyOnSecurityChange && isSecurityRelatedChange(changeEvent))) {
      await notifyAdminsOfProfileChange(changeEvent, targetUser)
    }
    
    // Log the profile change event
    await logProfileChangeEvent(changeEvent)
    
    return {
      id: 'notification_id', // In real implementation, this would be the actual ID
      ...notification,
      createdAt: new Date() as any
    } as Notification
    
  } catch (error) {
    console.error('Error sending profile change notification:', error)
    throw new Error('Failed to send profile change notification')
  }
}

/**
 * Generate notification content based on change event
 */
const generateNotificationContent = (
  changeEvent: ProfileChangeEvent,
  targetUser: User
): { title: string; message: string } => {
  const fieldName = changeEvent.field.charAt(0).toUpperCase() + changeEvent.field.slice(1)
  
  switch (changeEvent.changeType) {
    case 'CREATE':
      return {
        title: 'Profile Created',
        message: `Welcome ${targetUser.name}! Your profile has been created successfully.`
      }
    case 'UPDATE':
      return {
        title: 'Profile Updated',
        message: `Your ${fieldName.toLowerCase()} has been updated by ${changeEvent.changedByName}.`
      }
    case 'DELETE':
      return {
        title: 'Profile Information Removed',
        message: `Your ${fieldName.toLowerCase()} information has been removed by ${changeEvent.changedByName}.`
      }
    case 'VALIDATION':
      return {
        title: 'Profile Validation',
        message: `Your profile validation status has been updated. Please review your profile completeness.`
      }
    default:
      return {
        title: 'Profile Change',
        message: `Your profile has been modified by ${changeEvent.changedByName}.`
      }
  }
}

/**
 * Check if in-app notification should be sent
 */
const shouldSendInAppNotification = (
  changeEvent: ProfileChangeEvent,
  settings: ProfileNotificationSettings
): boolean => {
  switch (changeEvent.changeType) {
    case 'UPDATE':
    case 'CREATE':
    case 'DELETE':
      return settings.inAppOnProfileUpdate
    case 'VALIDATION':
      return settings.inAppOnValidationChange
    default:
      return false
  }
}

/**
 * Check if email notification should be sent
 */
const shouldSendEmailNotification = (
  changeEvent: ProfileChangeEvent,
  settings: ProfileNotificationSettings
): boolean => {
  // Don't send emails for immediate digest if frequency is not immediate
  if (settings.digestFrequency !== 'immediate') {
    return false
  }
  
  switch (changeEvent.changeType) {
    case 'UPDATE':
    case 'CREATE':
    case 'DELETE':
      return settings.emailOnProfileUpdate
    case 'VALIDATION':
      return settings.emailOnValidationChange
    default:
      return false
  }
}

/**
 * Check if change is security-related
 */
const isSecurityRelatedChange = (changeEvent: ProfileChangeEvent): boolean => {
  const securityFields = ['email', 'role', 'accountStatus']
  return securityFields.includes(changeEvent.field)
}

/**
 * Send email notification (mock implementation)
 */
const sendEmailNotification = async (
  user: User,
  content: { title: string; message: string }
): Promise<void> => {
  try {
    // In a real implementation, this would integrate with an email service
    // like SendGrid, AWS SES, or similar
    console.log('Email notification sent to:', user.email)
    console.log('Subject:', content.title)
    console.log('Message:', content.message)
    
    // Mock email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    console.error('Error sending email notification:', error)
    // Don't throw error for email failures
  }
}

/**
 * Notify admins of profile changes
 */
const notifyAdminsOfProfileChange = async (
  changeEvent: ProfileChangeEvent,
  targetUser: User
): Promise<void> => {
  try {
    // In a real implementation, this would:
    // 1. Query for all admin users
    // 2. Send notifications to each admin
    // 3. Respect admin notification preferences
    
    const adminNotification = {
      type: NotificationType.SYSTEM,
      title: 'User Profile Changed',
      message: `Profile for ${targetUser.name} (${targetUser.role}) was modified by ${changeEvent.changedByName}. Field: ${changeEvent.field}`,
      createdAt: serverTimestamp(),
      read: false
    }
    
    console.log('Admin notification would be sent:', adminNotification)
  } catch (error) {
    console.error('Error notifying admins:', error)
    // Don't throw error for admin notification failures
  }
}

/**
 * Send profile completeness notification
 */
export const sendProfileCompletenessNotification = async (
  user: User,
  completenessPercentage: number,
  missingFields: string[]
): Promise<void> => {
  try {
    const settings = await getProfileNotificationSettings(user.id)
    
    if (!settings.emailOnCompletenessAlert && !settings.inAppOnCompletenessAlert) {
      return // User has disabled completeness notifications
    }
    
    const notification = {
      userId: user.id,
      type: NotificationType.WARNING,
      title: 'Complete Your Profile',
      message: `Your profile is ${Math.round(completenessPercentage)}% complete. Missing fields: ${missingFields.join(', ')}.`,
      createdAt: serverTimestamp(),
      read: false
    }
    
    if (settings.inAppOnCompletenessAlert) {
      await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification)
    }
    
    if (settings.emailOnCompletenessAlert && settings.digestFrequency === 'immediate') {
      await sendEmailNotification(user, {
        title: notification.title,
        message: notification.message
      })
    }
    
    console.log('Profile completeness notification sent to user:', user.id)
  } catch (error) {
    console.error('Error sending profile completeness notification:', error)
    // Don't throw error for notification failures
  }
}

/**
 * Send profile validation notification
 */
export const sendProfileValidationNotification = async (
  user: User,
  validationResults: { isValid: boolean; message: string; completenessPercentage: number }
): Promise<void> => {
  try {
    const settings = await getProfileNotificationSettings(user.id)
    
    if (!settings.emailOnValidationChange && !settings.inAppOnValidationChange) {
      return // User has disabled validation notifications
    }
    
    const notification = {
      userId: user.id,
      type: validationResults.isValid ? NotificationType.SYSTEM : NotificationType.WARNING,
      title: 'Profile Validation Update',
      message: `Profile validation completed: ${validationResults.message}. Completeness: ${Math.round(validationResults.completenessPercentage)}%`,
      createdAt: serverTimestamp(),
      read: false
    }
    
    if (settings.inAppOnValidationChange) {
      await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification)
    }
    
    if (settings.emailOnValidationChange && settings.digestFrequency === 'immediate') {
      await sendEmailNotification(user, {
        title: notification.title,
        message: notification.message
      })
    }
    
    console.log('Profile validation notification sent to user:', user.id)
  } catch (error) {
    console.error('Error sending profile validation notification:', error)
    // Don't throw error for notification failures
  }
}