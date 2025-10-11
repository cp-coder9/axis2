import React, { useState } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Mail, 
  Clock, 
  FileText, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailNotificationSettings {
  projectUpdates: boolean
  messageReceived: boolean
  timerReminders?: boolean // Only for freelancers
  weeklyReports: boolean
  systemAnnouncements: boolean
  profileChanges: boolean
  fileShared: boolean
  taskAssigned: boolean
  deadlineReminders: boolean
  billingUpdates?: boolean // Only for freelancers and admins
}

interface EmailNotificationPreferencesProps {
  user: User
  currentUser: User
  onUpdate: (settings: EmailNotificationSettings) => Promise<void>
  initialSettings?: Partial<EmailNotificationSettings>
}

const getDefaultSettings = (userRole: UserRole): EmailNotificationSettings => {
  const baseSettings = {
    projectUpdates: true,
    messageReceived: true,
    weeklyReports: userRole === UserRole.ADMIN,
    systemAnnouncements: true,
    profileChanges: true,
    fileShared: true,
    taskAssigned: true,
    deadlineReminders: true,
  }

  if (userRole === UserRole.FREELANCER) {
    return {
      ...baseSettings,
      timerReminders: true,
      billingUpdates: true,
    }
  }

  if (userRole === UserRole.ADMIN) {
    return {
      ...baseSettings,
      billingUpdates: true,
    }
  }

  return baseSettings
}

export function EmailNotificationPreferences({
  user,
  currentUser,
  onUpdate,
  initialSettings = {}
}: EmailNotificationPreferencesProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Initialize settings with defaults and merge with initial settings
  const defaultSettings = getDefaultSettings(user.role)
  const [settings, setSettings] = useState<EmailNotificationSettings>({
    ...defaultSettings,
    ...initialSettings
  })

  // Check permissions
  const canEditNotifications = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const isSelfProfile = user.id === currentUser.id

  const handleSettingChange = (key: keyof EmailNotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    if (!canEditNotifications) {
      toast.error('You do not have permission to edit notification settings')
      return
    }

    setIsLoading(true)
    
    try {
      await onUpdate(settings)
      setHasUnsavedChanges(false)
      toast.success('Notification preferences updated successfully')
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast.error('Failed to update notification preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    const defaultSettings = getDefaultSettings(user.role)
    setSettings(defaultSettings)
    setHasUnsavedChanges(true)
    toast.info('Settings reset to defaults')
  }

  if (!canEditNotifications) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            Notification Access Restricted
          </CardTitle>
          <CardDescription>
            You can only edit your own notification preferences or access this as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notification Preferences
          </CardTitle>
          <CardDescription>
            Customize which email notifications you want to receive. 
            {!isSelfProfile && ` Managing notifications for ${user.name}.`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes to your notification preferences.
          </AlertDescription>
        </Alert>
      )}

      {/* Core Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Core Notifications
          </CardTitle>
          <CardDescription>
            Essential notifications for project collaboration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">Project Updates</span>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Notifications about project status changes, milestones, and important updates
              </p>
            </div>
            <Switch
              checked={settings.projectUpdates}
              onCheckedChange={(value) => handleSettingChange('projectUpdates', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">New Messages</span>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Notifications when you receive new messages in project chats
              </p>
            </div>
            <Switch
              checked={settings.messageReceived}
              onCheckedChange={(value) => handleSettingChange('messageReceived', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-base font-medium">Task Assignments</span>
              <p className="text-sm text-muted-foreground">
                Notifications when you are assigned to new tasks or job cards
              </p>
            </div>
            <Switch
              checked={settings.taskAssigned}
              onCheckedChange={(value) => handleSettingChange('taskAssigned', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-base font-medium">File Sharing</span>
              <p className="text-sm text-muted-foreground">
                Notifications when files are shared with you or uploaded to your projects
              </p>
            </div>
            <Switch
              checked={settings.fileShared}
              onCheckedChange={(value) => handleSettingChange('fileShared', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timer & Time Tracking (Freelancers only) */}
      {user.role === UserRole.FREELANCER && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timer & Time Tracking
            </CardTitle>
            <CardDescription>
              Notifications related to time tracking and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">Timer Reminders</span>
                  <Badge variant="secondary" className="text-xs">Freelancer</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reminders about active timers, long-running sessions, and time tracking
                </p>
              </div>
              <Switch
                checked={settings.timerReminders || false}
                onCheckedChange={(value) => handleSettingChange('timerReminders', value)}
              />
            </div>

            {(user.role === UserRole.FREELANCER || user.role === UserRole.ADMIN) && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-base font-medium">Billing Updates</span>
                  <p className="text-sm text-muted-foreground">
                    Notifications about earnings, payments, and billing-related updates
                  </p>
                </div>
                <Switch
                  checked={settings.billingUpdates || false}
                  onCheckedChange={(value) => handleSettingChange('billingUpdates', value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reports & Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports & Summaries
          </CardTitle>
          <CardDescription>
            Periodic reports and activity summaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-base font-medium">Weekly Reports</span>
              <p className="text-sm text-muted-foreground">
                Weekly summary of your activity, progress, and key metrics
              </p>
            </div>
            <Switch
              checked={settings.weeklyReports}
              onCheckedChange={(value) => handleSettingChange('weeklyReports', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-base font-medium">Deadline Reminders</span>
              <p className="text-sm text-muted-foreground">
                Reminders about upcoming project deadlines and important dates
              </p>
            </div>
            <Switch
              checked={settings.deadlineReminders}
              onCheckedChange={(value) => handleSettingChange('deadlineReminders', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System & Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            System & Account
          </CardTitle>
          <CardDescription>
            System-wide notifications and account-related updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">System Announcements</span>
                <Badge variant="secondary" className="text-xs">Important</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Important system updates, maintenance notifications, and announcements
              </p>
            </div>
            <Switch
              checked={settings.systemAnnouncements}
              onCheckedChange={(value) => handleSettingChange('systemAnnouncements', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-base font-medium">Profile Changes</span>
              <p className="text-sm text-muted-foreground">
                Notifications when your profile is updated or modified
              </p>
            </div>
            <Switch
              checked={settings.profileChanges}
              onCheckedChange={(value) => handleSettingChange('profileChanges', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={isLoading}
        >
          Reset to Defaults
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={isLoading || !hasUnsavedChanges}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Help Text */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> You can always change these settings later. 
          Critical notifications (like security alerts) will always be sent regardless of these preferences.
        </AlertDescription>
      </Alert>
    </div>
  )
}