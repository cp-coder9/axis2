import { User, UserRole, AuditAction } from '../types'
import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Profile Validation Service
 * Handles role-based field validation, completeness checking, and audit logging
 * Includes business rule validation for email uniqueness and role permissions
 */

export interface ProfileValidationResult {
  field: string
  isValid: boolean
  isRequired: boolean
  message: string
  suggestions?: string[]
  validationRules?: string[]
}

export interface ProfileCompletenessReport {
  userId: string
  userRole: UserRole
  totalFields: number
  completedFields: number
  validFields: number
  missingRequired: number
  missingOptional: number
  completenessPercentage: number
  lastValidated: Date
  validationResults: Record<string, ProfileValidationResult>
}

export interface ProfileValidationRule {
  field: string
  required: boolean
  validator: (value: any, user: User) => { isValid: boolean; message: string; suggestions?: string[] }
  roles: UserRole[]
}

// Define validation rules for each field and role
const PROFILE_VALIDATION_RULES: ProfileValidationRule[] = [
  {
    field: 'name',
    required: true,
    roles: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    validator: (value: string) => {
      if (!value || value.trim().length === 0) {
        return {
          isValid: false,
          message: 'Name is required for all users',
          suggestions: ['Enter your full name', 'Use your professional name']
        }
      }
      if (value.trim().length < 2) {
        return {
          isValid: false,
          message: 'Name must be at least 2 characters long',
          suggestions: ['Enter your complete name']
        }
      }
      if (value.trim().length > 100) {
        return {
          isValid: false,
          message: 'Name must be less than 100 characters',
          suggestions: ['Use a shorter version of your name']
        }
      }
      return {
        isValid: true,
        message: 'Name is valid'
      }
    }
  },
  {
    field: 'email',
    required: true,
    roles: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    validator: (value: string) => {
      if (!value || value.trim().length === 0) {
        return {
          isValid: false,
          message: 'Email is required for all users',
          suggestions: ['Enter a valid email address', 'Use your professional email']
        }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return {
          isValid: false,
          message: 'Email format is invalid',
          suggestions: ['Use format: user@domain.com', 'Check for typos in email address']
        }
      }
      return {
        isValid: true,
        message: 'Email is valid'
      }
    }
  },
  {
    field: 'title',
    required: true,
    roles: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    validator: (value: string, user: User) => {
      if (!value || value.trim().length === 0) {
        const roleSpecificMessage = user.role === UserRole.FREELANCER 
          ? 'Professional title is required for freelancers'
          : user.role === UserRole.CLIENT
          ? 'Job title is required for clients'
          : 'Title is required for administrators'
        
        return {
          isValid: false,
          message: roleSpecificMessage,
          suggestions: [
            'Enter your job title or professional designation',
            'Use titles like "Senior Architect", "Project Manager", etc.'
          ]
        }
      }
      if (value.trim().length < 2) {
        return {
          isValid: false,
          message: 'Title must be at least 2 characters long',
          suggestions: ['Enter a complete job title']
        }
      }
      return {
        isValid: true,
        message: 'Title is valid'
      }
    }
  },
  {
    field: 'hourlyRate',
    required: true,
    roles: [UserRole.FREELANCER],
    validator: (value: number, user: User) => {
      if (user.role !== UserRole.FREELANCER) {
        return {
          isValid: true,
          message: 'Hourly rate not required for this role'
        }
      }
      if (!value || value <= 0) {
        return {
          isValid: false,
          message: 'Hourly rate is required for freelancers',
          suggestions: [
            'Set your professional hourly rate',
            'Consider market rates for your expertise level',
            'Rate should be greater than 0'
          ]
        }
      }
      if (value < 10) {
        return {
          isValid: false,
          message: 'Hourly rate seems too low',
          suggestions: [
            'Consider if this rate reflects your professional value',
            'Check market rates for similar roles'
          ]
        }
      }
      if (value > 1000) {
        return {
          isValid: false,
          message: 'Hourly rate seems unusually high',
          suggestions: [
            'Verify the rate is correct',
            'Consider if this is competitive in your market'
          ]
        }
      }
      return {
        isValid: true,
        message: 'Hourly rate is valid'
      }
    }
  },
  {
    field: 'company',
    required: true,
    roles: [UserRole.CLIENT],
    validator: (value: string, user: User) => {
      if (user.role !== UserRole.CLIENT) {
        return {
          isValid: true,
          message: 'Company not required for this role'
        }
      }
      if (!value || value.trim().length === 0) {
        return {
          isValid: false,
          message: 'Company name is required for clients',
          suggestions: [
            'Enter your company or organization name',
            'Use your business legal name'
          ]
        }
      }
      if (value.trim().length < 2) {
        return {
          isValid: false,
          message: 'Company name must be at least 2 characters long',
          suggestions: ['Enter the complete company name']
        }
      }
      return {
        isValid: true,
        message: 'Company name is valid'
      }
    }
  },
  {
    field: 'phone',
    required: false,
    roles: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    validator: (value: string) => {
      if (!value || value.trim().length === 0) {
        return {
          isValid: true,
          message: 'Phone number is optional but recommended',
          suggestions: [
            'Add phone number for better communication',
            'Use format: +1 (555) 123-4567'
          ]
        }
      }
      // Basic phone validation - allows various formats
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '')
      
      if (!phoneRegex.test(cleanPhone)) {
        return {
          isValid: false,
          message: 'Phone number format is invalid',
          suggestions: [
            'Use format: +1 555 123 4567',
            'Remove special characters except + for country code',
            'Ensure number is 7-16 digits long'
          ]
        }
      }
      return {
        isValid: true,
        message: 'Phone number is valid'
      }
    }
  },
  {
    field: 'avatarUrl',
    required: false,
    roles: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    validator: (value: string) => {
      if (!value || value.trim().length === 0) {
        return {
          isValid: true,
          message: 'Profile picture is optional but recommended',
          suggestions: [
            'Add a professional profile picture',
            'Use a clear, recent photo',
            'Ensure image is appropriate for professional use'
          ]
        }
      }
      // Basic URL validation
      try {
        new URL(value)
        return {
          isValid: true,
          message: 'Profile picture is set'
        }
      } catch {
        return {
          isValid: false,
          message: 'Profile picture URL is invalid',
          suggestions: [
            'Upload a new profile picture',
            'Ensure the image URL is accessible'
          ]
        }
      }
    }
  }
]

/**
 * Business Rule Validation Functions
 */

/**
 * Check if email is unique across all users
 */
export const validateEmailUniqueness = async (
  email: string,
  currentUserId?: string
): Promise<{ isUnique: boolean; message: string }> => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()))
    const querySnapshot = await getDocs(q)
    
    // If no users found, email is unique
    if (querySnapshot.empty) {
      return {
        isUnique: true,
        message: 'Email is available'
      }
    }
    
    // If editing existing user, check if the email belongs to them
    if (currentUserId) {
      const existingUser = querySnapshot.docs.find(doc => doc.id === currentUserId)
      if (existingUser && querySnapshot.docs.length === 1) {
        return {
          isUnique: true,
          message: 'Email is your current email'
        }
      }
    }
    
    return {
      isUnique: false,
      message: 'Email is already in use by another user'
    }
  } catch (error) {
    console.error('Error checking email uniqueness:', error)
    // Don't block on validation errors
    return {
      isUnique: true,
      message: 'Unable to verify email uniqueness'
    }
  }
}

/**
 * Validate role-specific permissions and requirements
 */
export const validateRolePermissions = (
  user: User,
  updatingUser: User
): { isValid: boolean; message: string; suggestions?: string[] } => {
  // Only admins can change user roles
  if (user.role !== updatingUser.role && updatingUser.role !== UserRole.ADMIN) {
    return {
      isValid: false,
      message: 'Only administrators can change user roles',
      suggestions: ['Contact an administrator to change roles']
    }
  }
  
  // Admins cannot demote themselves
  if (user.id === updatingUser.id && user.role === UserRole.ADMIN && updatingUser.role !== UserRole.ADMIN) {
    return {
      isValid: false,
      message: 'Administrators cannot change their own role',
      suggestions: ['Have another administrator change your role']
    }
  }
  
  // Freelancers must have hourly rate
  if (user.role === UserRole.FREELANCER && (!user.hourlyRate || user.hourlyRate <= 0)) {
    return {
      isValid: false,
      message: 'Freelancers must have a valid hourly rate',
      suggestions: ['Set your hourly rate in the profile settings']
    }
  }
  
  // Clients must have company name
  if (user.role === UserRole.CLIENT && (!user.company || user.company.trim().length === 0)) {
    return {
      isValid: false,
      message: 'Clients must have a company name',
      suggestions: ['Enter your company or organization name']
    }
  }
  
  return {
    isValid: true,
    message: 'Role permissions are valid'
  }
}

/**
 * Validate profile data integrity
 */
export const validateProfileIntegrity = (user: User): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} => {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for required fields
  if (!user.id || user.id.trim().length === 0) {
    errors.push('User ID is missing')
  }
  
  if (!user.name || user.name.trim().length === 0) {
    errors.push('Name is required')
  }
  
  if (!user.email || user.email.trim().length === 0) {
    errors.push('Email is required')
  }
  
  if (!user.role) {
    errors.push('User role is required')
  }
  
  // Check for recommended fields
  if (!user.phone || user.phone.trim().length === 0) {
    warnings.push('Phone number is recommended for better communication')
  }
  
  if (!user.avatarUrl || user.avatarUrl.trim().length === 0) {
    warnings.push('Profile picture is recommended for better visibility')
  }
  
  if (!user.title || user.title.trim().length === 0) {
    warnings.push('Job title is recommended for professional profile')
  }
  
  // Role-specific checks
  if (user.role === UserRole.FREELANCER) {
    if (!user.hourlyRate || user.hourlyRate <= 0) {
      errors.push('Freelancers must have a valid hourly rate')
    }
    
    if (!user.skills || user.skills.length === 0) {
      warnings.push('Adding skills helps clients find you for projects')
    }
  }
  
  if (user.role === UserRole.CLIENT) {
    if (!user.company || user.company.trim().length === 0) {
      errors.push('Clients must have a company name')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get required fields for a specific role
 */
export const getRequiredFieldsForRole = (role: UserRole): string[] => {
  return PROFILE_VALIDATION_RULES
    .filter(rule => rule.required && rule.roles.includes(role))
    .map(rule => rule.field)
}

/**
 * Get optional fields for a specific role
 */
export const getOptionalFieldsForRole = (role: UserRole): string[] => {
  return PROFILE_VALIDATION_RULES
    .filter(rule => !rule.required && rule.roles.includes(role))
    .map(rule => rule.field)
}

/**
 * Validate a specific profile field with business rules
 */
export const validateProfileField = async (
  user: User,
  field: string,
  role: UserRole,
  currentUserId?: string
): Promise<ProfileValidationResult> => {
  const rule = PROFILE_VALIDATION_RULES.find(r => r.field === field && r.roles.includes(role))
  
  if (!rule) {
    return {
      field,
      isValid: true,
      isRequired: false,
      message: 'Field not applicable for this role'
    }
  }

  const fieldValue = (user as any)[field]
  const validationResult = rule.validator(fieldValue, user)

  // Additional business rule validation for email
  if (field === 'email' && validationResult.isValid) {
    const emailUniqueness = await validateEmailUniqueness(fieldValue, currentUserId)
    if (!emailUniqueness.isUnique) {
      return {
        field,
        isValid: false,
        isRequired: rule.required,
        message: emailUniqueness.message,
        suggestions: [
          'Use a different email address',
          'Contact support if this is your email'
        ],
        validationRules: [`Required: ${rule.required}`, `Roles: ${rule.roles.join(', ')}`, 'Must be unique']
      }
    }
  }

  return {
    field,
    isValid: validationResult.isValid,
    isRequired: rule.required,
    message: validationResult.message,
    suggestions: validationResult.suggestions,
    validationRules: [`Required: ${rule.required}`, `Roles: ${rule.roles.join(', ')}`]
  }
}

/**
 * Calculate profile completeness for a user
 */
export const calculateProfileCompleteness = (
  user: User,
  role: UserRole
): ProfileCompletenessReport => {
  const applicableRules = PROFILE_VALIDATION_RULES.filter(rule => rule.roles.includes(role))
  const validationResults: Record<string, ProfileValidationResult> = {}
  
  let totalFields = 0
  let completedFields = 0
  let validFields = 0
  let missingRequired = 0
  let missingOptional = 0

  for (const rule of applicableRules) {
    const fieldValue = (user as any)[rule.field]
    const validationResult = rule.validator(fieldValue, user)
    
    totalFields++
    
    const result: ProfileValidationResult = {
      field: rule.field,
      isValid: validationResult.isValid,
      isRequired: rule.required,
      message: validationResult.message,
      suggestions: validationResult.suggestions
    }
    
    validationResults[rule.field] = result
    
    // Check if field has a value (completed)
    const hasValue = fieldValue !== null && fieldValue !== undefined && 
                    (typeof fieldValue === 'string' ? fieldValue.trim().length > 0 : true)
    
    if (hasValue) {
      completedFields++
    }
    
    if (validationResult.isValid) {
      validFields++
    } else {
      if (rule.required) {
        missingRequired++
      } else {
        missingOptional++
      }
    }
  }

  const completenessPercentage = totalFields > 0 ? (validFields / totalFields) * 100 : 0

  return {
    userId: user.id,
    userRole: role,
    totalFields,
    completedFields,
    validFields,
    missingRequired,
    missingOptional,
    completenessPercentage,
    lastValidated: new Date(),
    validationResults
  }
}

/**
 * Log profile validation events for audit trail
 */
export const logProfileValidation = async (
  user: User,
  performedBy: User,
  validationReport: ProfileCompletenessReport,
  action: 'VALIDATION_PERFORMED' | 'PROFILE_UPDATED' | 'COMPLETENESS_CHECKED'
): Promise<void> => {
  try {
    const auditEntry = {
      action: action as AuditAction,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      targetUserId: user.id,
      targetUserName: user.name,
      timestamp: serverTimestamp() as Timestamp,
      details: {
        validationReport: {
          completenessPercentage: validationReport.completenessPercentage,
          totalFields: validationReport.totalFields,
          validFields: validationReport.validFields,
          missingRequired: validationReport.missingRequired,
          missingOptional: validationReport.missingOptional
        },
        userRole: user.role,
        validationTimestamp: validationReport.lastValidated.toISOString()
      }
    }

    await addDoc(collection(db, 'profileValidationLogs'), auditEntry)
    console.log('Profile validation logged:', auditEntry)
  } catch (error) {
    console.error('Error logging profile validation:', error)
    // Don't throw error for logging failures
  }
}

/**
 * Update profile completeness status in user document
 */
export const updateProfileCompletenessStatus = async (
  userId: string,
  completenessReport: ProfileCompletenessReport
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      profileCompleteness: {
        percentage: completenessReport.completenessPercentage,
        lastValidated: serverTimestamp(),
        isComplete: completenessReport.completenessPercentage >= 90,
        missingRequiredFields: completenessReport.missingRequired,
        totalFields: completenessReport.totalFields,
        validFields: completenessReport.validFields
      },
      lastProfileValidation: serverTimestamp()
    })
    
    console.log('Profile completeness status updated for user:', userId)
  } catch (error) {
    console.error('Error updating profile completeness status:', error)
    throw error
  }
}

/**
 * Get profile validation history for a user
 */
export const getProfileValidationHistory = async (_userId: string): Promise<any[]> => {
  try {
    // In a real implementation, this would query Firestore for validation history
    // For now, return mock data
    return [
      {
        id: 'validation_1',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completenessPercentage: 85,
        missingRequired: 1,
        action: 'VALIDATION_PERFORMED'
      },
      {
        id: 'validation_2',
        timestamp: new Date(),
        completenessPercentage: 95,
        missingRequired: 0,
        action: 'PROFILE_UPDATED'
      }
    ]
  } catch (error) {
    console.error('Error getting profile validation history:', error)
    return []
  }
}

/**
 * Send profile completeness notifications
 */
export const sendProfileCompletenessNotification = async (
  user: User,
  completenessReport: ProfileCompletenessReport
): Promise<void> => {
  try {
    // Only send notifications if profile is incomplete
    if (completenessReport.completenessPercentage >= 90) {
      return
    }

    const notificationData = {
      userId: user.id,
      type: 'PROFILE_INCOMPLETE',
      title: 'Complete Your Profile',
      message: `Your profile is ${Math.round(completenessReport.completenessPercentage)}% complete. ${
        completenessReport.missingRequired > 0 
          ? `${completenessReport.missingRequired} required fields are missing.`
          : 'Consider adding optional information to improve your profile.'
      }`,
      data: {
        completenessPercentage: completenessReport.completenessPercentage,
        missingRequired: completenessReport.missingRequired,
        missingOptional: completenessReport.missingOptional
      },
      createdAt: serverTimestamp(),
      read: false
    }

    await addDoc(collection(db, 'notifications'), notificationData)
    console.log('Profile completeness notification sent to user:', user.id)
  } catch (error) {
    console.error('Error sending profile completeness notification:', error)
    // Don't throw error for notification failures
  }
}