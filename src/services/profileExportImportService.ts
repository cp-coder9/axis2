import { User, UserRole } from '../types'
import { Timestamp } from 'firebase/firestore'
import { validateProfileIntegrity } from './profileValidationService'

/**
 * Profile Export/Import Service
 * Handles profile data export to JSON/CSV and import with validation
 */

export interface ProfileExportData {
  version: string
  exportedAt: string
  user: Partial<User>
  metadata: {
    exportedBy: string
    exportFormat: 'json' | 'csv'
    includesSensitiveData: boolean
  }
}

export interface ProfileImportResult {
  success: boolean
  errors: string[]
  warnings: string[]
  importedData?: Partial<User>
}

export interface ProfileBackup {
  id: string
  userId: string
  createdAt: string
  data: Partial<User>
  version: string
}

/**
 * Export profile data to JSON format
 */
export const exportProfileToJSON = (
  user: User,
  includeSensitiveData: boolean = false
): string => {
  const exportData: ProfileExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    user: sanitizeUserDataForExport(user, includeSensitiveData),
    metadata: {
      exportedBy: user.id,
      exportFormat: 'json',
      includesSensitiveData: includeSensitiveData
    }
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export profile data to CSV format
 */
export const exportProfileToCSV = (
  user: User,
  includeSensitiveData: boolean = false
): string => {
  const sanitizedUser = sanitizeUserDataForExport(user, includeSensitiveData)
  
  // CSV headers
  const headers = Object.keys(sanitizedUser).join(',')
  
  // CSV values
  const values = Object.values(sanitizedUser).map(value => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    if (typeof value === 'string' && value.includes(',')) return `"${value}"`
    return value
  }).join(',')
  
  return `${headers}\n${values}`
}

/**
 * Download profile data as a file
 */
export const downloadProfileData = (
  data: string,
  filename: string,
  format: 'json' | 'csv'
): void => {
  const mimeType = format === 'json' ? 'application/json' : 'text/csv'
  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Import profile data from JSON
 */
export const importProfileFromJSON = (
  jsonData: string,
  currentUser: User
): ProfileImportResult => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const parsedData = JSON.parse(jsonData) as ProfileExportData
    
    // Validate export data structure
    if (!parsedData.version || !parsedData.user) {
      errors.push('Invalid export file format')
      return { success: false, errors, warnings }
    }

    // Check version compatibility
    if (parsedData.version !== '1.0.0') {
      warnings.push(`Export version ${parsedData.version} may not be fully compatible`)
    }

    // Validate imported user data
    const importedUser = parsedData.user as Partial<User>
    
    // Ensure critical fields match
    if (importedUser.id && importedUser.id !== currentUser.id) {
      warnings.push('User ID mismatch - data may be from a different user')
    }

    // Validate role compatibility
    if (importedUser.role && importedUser.role !== currentUser.role) {
      errors.push(`Cannot import data from ${importedUser.role} role to ${currentUser.role} role`)
      return { success: false, errors, warnings }
    }

    // Validate data integrity
    const mergedUser = { ...currentUser, ...importedUser }
    const integrityCheck = validateProfileIntegrity(mergedUser as User)
    
    if (!integrityCheck.isValid) {
      errors.push(...integrityCheck.errors)
    }
    
    warnings.push(...integrityCheck.warnings)

    // Sanitize imported data
    const sanitizedData = sanitizeImportedData(importedUser, currentUser)

    return {
      success: errors.length === 0,
      errors,
      warnings,
      importedData: sanitizedData
    }
  } catch (error) {
    errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { success: false, errors, warnings }
  }
}

/**
 * Import profile data from CSV
 */
export const importProfileFromCSV = (
  csvData: string,
  currentUser: User
): ProfileImportResult => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const lines = csvData.trim().split('\n')
    
    if (lines.length < 2) {
      errors.push('Invalid CSV format - missing data')
      return { success: false, errors, warnings }
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const values = lines[1].split(',').map(v => v.trim().replace(/^"|"$/g, ''))

    const importedUser: Partial<User> = {}
    
    headers.forEach((header, index) => {
      const value = values[index]
      if (value && value !== '') {
        try {
          // Try to parse JSON values
          importedUser[header as keyof User] = JSON.parse(value) as any
        } catch {
          // Use as string if not JSON
          importedUser[header as keyof User] = value as any
        }
      }
    })

    // Validate role compatibility
    if (importedUser.role && importedUser.role !== currentUser.role) {
      errors.push(`Cannot import data from ${importedUser.role} role to ${currentUser.role} role`)
      return { success: false, errors, warnings }
    }

    // Validate data integrity
    const mergedUser = { ...currentUser, ...importedUser }
    const integrityCheck = validateProfileIntegrity(mergedUser as User)
    
    if (!integrityCheck.isValid) {
      errors.push(...integrityCheck.errors)
    }
    
    warnings.push(...integrityCheck.warnings)

    // Sanitize imported data
    const sanitizedData = sanitizeImportedData(importedUser, currentUser)

    return {
      success: errors.length === 0,
      errors,
      warnings,
      importedData: sanitizedData
    }
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { success: false, errors, warnings }
  }
}

/**
 * Create a profile backup
 */
export const createProfileBackup = (user: User): ProfileBackup => {
  return {
    id: `backup_${Date.now()}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
    data: sanitizeUserDataForExport(user, true),
    version: '1.0.0'
  }
}

/**
 * Restore profile from backup
 */
export const restoreProfileFromBackup = (
  backup: ProfileBackup,
  currentUser: User
): ProfileImportResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate backup belongs to current user
  if (backup.userId !== currentUser.id) {
    errors.push('Backup does not belong to current user')
    return { success: false, errors, warnings }
  }

  // Validate data integrity
  const mergedUser = { ...currentUser, ...backup.data }
  const integrityCheck = validateProfileIntegrity(mergedUser as User)
  
  if (!integrityCheck.isValid) {
    errors.push(...integrityCheck.errors)
  }
  
  warnings.push(...integrityCheck.warnings)

  // Sanitize backup data
  const sanitizedData = sanitizeImportedData(backup.data, currentUser)

  return {
    success: errors.length === 0,
    errors,
    warnings,
    importedData: sanitizedData
  }
}

/**
 * Save backup to local storage
 */
export const saveBackupToLocalStorage = (backup: ProfileBackup): void => {
  try {
    const backups = getBackupsFromLocalStorage()
    backups.push(backup)
    
    // Keep only last 5 backups
    const recentBackups = backups.slice(-5)
    
    localStorage.setItem('profile_backups', JSON.stringify(recentBackups))
  } catch (error) {
    console.error('Failed to save backup to local storage:', error)
  }
}

/**
 * Get backups from local storage
 */
export const getBackupsFromLocalStorage = (): ProfileBackup[] => {
  try {
    const backupsJson = localStorage.getItem('profile_backups')
    if (!backupsJson) return []
    
    return JSON.parse(backupsJson) as ProfileBackup[]
  } catch (error) {
    console.error('Failed to load backups from local storage:', error)
    return []
  }
}

/**
 * Delete backup from local storage
 */
export const deleteBackupFromLocalStorage = (backupId: string): void => {
  try {
    const backups = getBackupsFromLocalStorage()
    const filteredBackups = backups.filter(b => b.id !== backupId)
    
    localStorage.setItem('profile_backups', JSON.stringify(filteredBackups))
  } catch (error) {
    console.error('Failed to delete backup from local storage:', error)
  }
}

/**
 * Helper Functions
 */

/**
 * Sanitize user data for export
 */
function sanitizeUserDataForExport(
  user: User,
  includeSensitiveData: boolean
): Partial<User> {
  const sanitized: Partial<User> = {
    name: user.name,
    email: includeSensitiveData ? user.email : '***@***.***',
    role: user.role,
    title: user.title,
    phone: includeSensitiveData ? user.phone : '***-***-****',
    company: user.company,
    avatarUrl: user.avatarUrl,
    skills: user.skills,
    preferences: user.preferences
  }

  // Include role-specific fields
  if (user.role === UserRole.FREELANCER) {
    sanitized.hourlyRate = includeSensitiveData ? user.hourlyRate : 0
  }

  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key as keyof User] === undefined) {
      delete sanitized[key as keyof User]
    }
  })

  return sanitized
}

/**
 * Sanitize imported data
 */
function sanitizeImportedData(
  importedData: Partial<User>,
  currentUser: User
): Partial<User> {
  const sanitized: Partial<User> = {}

  // Allowed fields for import
  const allowedFields: (keyof User)[] = [
    'name',
    'title',
    'phone',
    'company',
    'avatarUrl',
    'skills',
    'preferences'
  ]

  // Role-specific allowed fields
  if (currentUser.role === UserRole.FREELANCER) {
    allowedFields.push('hourlyRate')
  }

  // Copy only allowed fields
  allowedFields.forEach(field => {
    if (importedData[field] !== undefined) {
      sanitized[field] = importedData[field]
    }
  })

  // Never import these fields
  delete sanitized.id
  delete sanitized.email // Email should be changed through proper authentication flow
  delete sanitized.role // Role should be changed by admin only
  delete (sanitized as any).createdAt
  delete (sanitized as any).lastActive

  return sanitized
}

/**
 * Convert Timestamp to ISO string for export
 */
function timestampToString(timestamp: Timestamp | undefined): string | undefined {
  if (!timestamp) return undefined
  return timestamp.toDate().toISOString()
}

/**
 * Convert ISO string to Timestamp for import
 */
function stringToTimestamp(dateString: string | undefined): Timestamp | undefined {
  if (!dateString) return undefined
  try {
    return Timestamp.fromDate(new Date(dateString))
  } catch {
    return undefined
  }
}
