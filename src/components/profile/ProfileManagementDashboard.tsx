import React, { useState, useEffect } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  User as UserIcon, 
  Bell, 
  History, 
  Trash2, 
  Download,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

// Import profile components
import { ProfileValidationSystem } from './ProfileValidationSystem'
import { ProfileChangeNotificationSystem } from './ProfileChangeNotificationSystem'
import { ProfilePermissionsManager } from './ProfilePermissionsManager'
import { ProfileAuditTrail } from './ProfileAuditTrail'
import { ProfileDeletionManager } from './ProfileDeletionManager'
import { GDPRComplianceManager } from './GDPRComplianceManager'
import { IntegratedAvatarUpload } from './IntegratedAvatarUpload'

// Import services
import { 
  calculateProfileCompleteness,
  ProfileCompletenessReport 
} from '../../services/profileValidationService'
import {
  getProfileNotificationSettings,
  ProfileNotificationSettings
} from '../../services/profileNotificationService'

interface ProfileManagementDashboardProps {
  targetUser: User
  currentUser: User
  onProfileUpdated?: (user: User) => void
  onProfileDeleted?: (userId: string) => void
}

export function ProfileManagementDashboard({
  targetUser,
  currentUser,
  onProfileUpdated,
  onProfileDeleted
}: ProfileManagementDashboardProps) {
  const [activeTab, setActiveTab] = useState('validation')
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<ProfileNotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check permissions
  const canManageProfile = currentUser.role === UserRole.ADMIN || targetUser.id === currentUser.id
  const isAdmin = currentUser.role === UserRole.ADMIN
  const isSelfProfile = targetUser.id === currentUser.id

  useEffect(() => {
    if (canManageProfile) {
      loadProfileData()
    }
  }, [targetUser.id, canManageProfile])

  const loadProfileData = async () => {
    try {
      setIsLoading(true)
      
      // Load profile completeness
      const report = calculateProfileCompleteness(targetUser, targetUser.role)
      setCompletenessReport(report)
      
      // Load notification settings
      const settings = await getProfileNotificationSettings(targetUser.id)
      setNotificationSettings(settings)
      
    } catch (error) {
      console.error('Error loading profile data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidationComplete = (isValid: boolean, report: ProfileCompletenessReport) => {
    setCompletenessReport(report)
    
    if (isValid) {
      toast.success('Profile validation completed successfully')
    } else {
      toast.warning(`Profile validation found ${report.missingRequired} missing required fields`)
    }
  }

  const handleNotificationSettingsUpdated = (settings: ProfileNotificationSettings) => {
    setNotificationSettings(settings)
    toast.success('Notification settings updated')
  }

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompletenessIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  if (!canManageProfile) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Profile Management Access Restricted
          </CardTitle>
          <CardDescription>
            You can only manage your own profile or access this as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Management Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive profile management for {targetUser.name} ({targetUser.role})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading profile data...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Profile Completeness */}
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                {completenessReport && getCompletenessIcon(completenessReport.completenessPercentage)}
                <div>
                  <h4 className="font-medium">Profile Completeness</h4>
                  <p className={`text-sm ${completenessReport ? getCompletenessColor(completenessReport.completenessPercentage) : 'text-muted-foreground'}`}>
                    {completenessReport ? `${Math.round(completenessReport.completenessPercentage)}%` : 'Loading...'}
                  </p>
                </div>
              </div>

              {/* Notification Status */}
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Bell className="h-4 w-4 text-blue-600" />
                <div>
                  <h4 className="font-medium">Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    {notificationSettings?.emailOnProfileUpdate ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Shield className="h-4 w-4 text-purple-600" />
                <div>
                  <h4 className="font-medium">User Role</h4>
                  <Badge variant={targetUser.role === UserRole.ADMIN ? 'destructive' : 'secondary'}>
                    {targetUser.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="avatar" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Avatar
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            GDPR
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Management
          </TabsTrigger>
        </TabsList>

        {/* Avatar Management Tab */}
        <TabsContent value="avatar" className="space-y-6">
          <IntegratedAvatarUpload
            user={targetUser}
            currentUser={currentUser}
            onAvatarUpdated={(avatarUrl) => {
              // Update the user object with new avatar URL
              const updatedUser = { ...targetUser, avatarUrl }
              onProfileUpdated?.(updatedUser)
              toast.success('Avatar updated successfully')
            }}
            onAvatarDeleted={() => {
              // Remove avatar URL from user object
              const updatedUser = { ...targetUser, avatarUrl: '' }
              onProfileUpdated?.(updatedUser)
              toast.success('Avatar removed successfully')
            }}
            showAllFeatures={true}
          />
        </TabsContent>

        {/* Profile Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <ProfileValidationSystem
            user={targetUser}
            currentUser={currentUser}
            onValidationComplete={handleValidationComplete}
            onFieldValidated={(field, isValid, message) => {
              console.log(`Field ${field} validation:`, { isValid, message })
            }}
          />
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <ProfileChangeNotificationSystem
            user={targetUser}
            currentUser={currentUser}
            onNotificationSent={(notification) => {
              console.log('Notification sent:', notification)
            }}
            onSettingsUpdated={handleNotificationSettingsUpdated}
          />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <ProfilePermissionsManager
            targetUser={targetUser}
            currentUser={currentUser}
          />
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <ProfileAuditTrail
            targetUser={targetUser}
            currentUser={currentUser}
          />
        </TabsContent>

        {/* GDPR Compliance Tab */}
        <TabsContent value="gdpr" className="space-y-6">
          <GDPRComplianceManager
            targetUser={targetUser}
            currentUser={currentUser}
            onDataExported={(category, data) => {
              console.log('Data exported:', { category, data })
            }}
            onDataDeleted={(category) => {
              console.log('Data deleted:', category)
            }}
          />
        </TabsContent>

        {/* Profile Management Tab */}
        <TabsContent value="management" className="space-y-6">
          <ProfileDeletionManager
            targetUser={targetUser}
            currentUser={currentUser}
            onProfileDeleted={(userId) => {
              toast.success('Profile deleted successfully')
              onProfileDeleted?.(userId)
            }}
            onProfileDeactivated={(userId) => {
              toast.success('Profile deactivated successfully')
              // Refresh profile data
              loadProfileData()
            }}
            onDataExported={(userId, data) => {
              toast.success('Profile data exported successfully')
              console.log('Profile data exported:', { userId, data })
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common profile management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('avatar')}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Manage Avatar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('validation')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate Profile
            </Button>
            
            {isSelfProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
            )}
            
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('audit')}
                >
                  <History className="h-4 w-4 mr-2" />
                  View Audit Trail
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('management')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Profile
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('gdpr')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}