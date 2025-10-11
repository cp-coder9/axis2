import React, { useState, useEffect } from 'react'
import { User, UserRole, Notification, NotificationType } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  BellOff, 
  Mail, 
  MessageSquare, 
  Shield, 
  User as UserIcon,
  Settings,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  sendProfileChangeNotification,
  getProfileNotificationSettings,
  updateProfileNotificationSettings,
  getProfileChangeHistory,
  ProfileNotificationSettings,
  ProfileChangeEvent
} from '../../services/profileNotificationService'

interface ProfileChangeNotificationSystemProps {
  user: User
  currentUser: User
  onNotificationSent?: (notification: Notification) => void
  onSettingsUpdated?: (settings: ProfileNotificationSettings) => void
}

export function ProfileChangeNotificationSystem({
  user,
  currentUser,
  onNotificationSent,
  onSettingsUpdated
}: ProfileChangeNotificationSystemProps) {
  const [notificationSettings, setNotificationSettings] = useState<ProfileNotificationSettings | null>(null)
  const [changeHistory, setChangeHistory] = useState<ProfileChangeEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Check if current user can manage notifications
  const canManageNotifications = currentUser.role === UserRole.ADMIN || user.id === currentUser.id

  useEffect(() => {
    if (canManageNotifications) {
      loadNotificationData()
    }
  }, [user.id, canManageNotifications])

  const loadNotificationData = async () => {
    try {
      setIsLoading(true)
      
      // Load notification settings
      const settings = await getProfileNotificationSettings(user.id)
      setNotificationSettings(settings)
      
      // Load recent profile change history
      const history = await getProfileChangeHistory(user.id, 10) // Last 10 changes
      setChangeHistory(history)
      
    } catch (error) {
      console.error('Error loading notification data:', error)
      toast.error('Failed to load notification settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = async (
    setting: keyof ProfileNotificationSettings,
    value: boolean
  ) => {
    if (!notificationSettings) return

    try {
      const updatedSettings = {
        ...notificationSettings,
        [setting]: value
      }

      setNotificationSettings(updatedSettings)
      
      // Save to backend
      await updateProfileNotificationSettings(user.id, updatedSettings)
      
      toast.success('Notification settings updated')
      onSettingsUpdated?.(updatedSettings)
      
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast.error('Failed to update notification settings')
      
      // Revert the change
      setNotificationSettings(notificationSettings)
    }
  }

  const sendTestNotification = async () => {
    try {
      setIsSaving(true)
      
      const testEvent: ProfileChangeEvent = {
        userId: user.id,
        field: 'test',
        oldValue: 'old_value',
        newValue: 'new_value',
        changedBy: currentUser.id,
        changedByName: currentUser.name,
        timestamp: new Date(),
        changeType: 'UPDATE',
        reason: 'Test notification'
      }

      const notification = await sendProfileChangeNotification(testEvent, user)
      
      toast.success('Test notification sent successfully')
      onNotificationSent?.(notification)
      
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Failed to send test notification')
    } finally {
      setIsSaving(false)
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'CREATE':
        return <UserIcon className="h-4 w-4 text-green-600" />
      case 'UPDATE':
        return <Settings className="h-4 w-4 text-blue-600" />
      case 'DELETE':
        return <X className="h-4 w-4 text-red-600" />
      case 'VALIDATION':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getChangeBadge = (changeType: string) => {
    switch (changeType) {
      case 'CREATE':
        return <Badge variant="default" className="bg-green-600">Created</Badge>
      case 'UPDATE':
        return <Badge variant="secondary">Updated</Badge>
      case 'DELETE':
        return <Badge variant="destructive">Deleted</Badge>
      case 'VALIDATION':
        return <Badge variant="outline" className="border-purple-600 text-purple-600">Validated</Badge>
      default:
        return <Badge variant="outline">{changeType}</Badge>
    }
  }

  if (!canManageNotifications) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Notification Settings Access Restricted
          </CardTitle>
          <CardDescription>
            You can only manage notification settings for your own profile or as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Profile Change Notifications
          </CardTitle>
          <CardDescription>
            Configure how you want to be notified about profile changes for {user.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading notification settings...</span>
            </div>
          ) : notificationSettings ? (
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="profile-updates">Profile Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when profile information is changed
                      </p>
                    </div>
                    <Switch
                      id="profile-updates"
                      checked={notificationSettings.emailOnProfileUpdate}
                      onCheckedChange={(checked) => handleSettingChange('emailOnProfileUpdate', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="validation-changes">Validation Changes</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when profile validation status changes
                      </p>
                    </div>
                    <Switch
                      id="validation-changes"
                      checked={notificationSettings.emailOnValidationChange}
                      onCheckedChange={(checked) => handleSettingChange('emailOnValidationChange', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="completeness-alerts">Completeness Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify about profile completeness issues
                      </p>
                    </div>
                    <Switch
                      id="completeness-alerts"
                      checked={notificationSettings.emailOnCompletenessAlert}
                      onCheckedChange={(checked) => handleSettingChange('emailOnCompletenessAlert', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* In-App Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  In-App Notifications
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="inapp-profile-updates">Profile Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Show in-app notifications for profile changes
                      </p>
                    </div>
                    <Switch
                      id="inapp-profile-updates"
                      checked={notificationSettings.inAppOnProfileUpdate}
                      onCheckedChange={(checked) => handleSettingChange('inAppOnProfileUpdate', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="inapp-validation">Validation Results</Label>
                      <p className="text-sm text-muted-foreground">
                        Show validation results in notifications
                      </p>
                    </div>
                    <Switch
                      id="inapp-validation"
                      checked={notificationSettings.inAppOnValidationChange}
                      onCheckedChange={(checked) => handleSettingChange('inAppOnValidationChange', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Admin Notifications */}
              {currentUser.role === UserRole.ADMIN && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Notifications
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="admin-profile-changes">All Profile Changes</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify admins of any profile changes
                        </p>
                      </div>
                      <Switch
                        id="admin-profile-changes"
                        checked={notificationSettings.notifyAdminsOnChange}
                        onCheckedChange={(checked) => handleSettingChange('notifyAdminsOnChange', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="security-changes">Security Changes</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify about security-related profile changes
                        </p>
                      </div>
                      <Switch
                        id="security-changes"
                        checked={notificationSettings.notifyOnSecurityChange}
                        onCheckedChange={(checked) => handleSettingChange('notifyOnSecurityChange', checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Test Notification */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-1">
                  <h4 className="font-medium">Test Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Send a test notification to verify your settings
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={sendTestNotification}
                  disabled={isSaving}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {isSaving ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Recent Profile Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Profile Changes</CardTitle>
          <CardDescription>
            History of recent profile modifications and validations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {changeHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent profile changes</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {changeHistory.map((change, index) => (
                  <div key={`${change.timestamp.getTime()}-${index}`}>
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mt-1">
                        {getChangeIcon(change.changeType)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getChangeBadge(change.changeType)}
                            <span className="text-sm font-medium">
                              {change.field.charAt(0).toUpperCase() + change.field.slice(1)} Changed
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {change.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Changed by {change.changedByName}
                          {change.reason && ` - ${change.reason}`}
                        </p>
                        {change.oldValue !== change.newValue && (
                          <div className="text-xs text-muted-foreground">
                            <span className="line-through">{change.oldValue}</span>
                            {' → '}
                            <span className="font-medium">{change.newValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {index < changeHistory.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Notification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Status</CardTitle>
          <CardDescription>
            Current notification configuration and delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Email Notifications</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {notificationSettings?.emailOnProfileUpdate ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span>Profile Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  {notificationSettings?.emailOnValidationChange ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span>Validation Changes</span>
                </div>
                <div className="flex items-center gap-2">
                  {notificationSettings?.emailOnCompletenessAlert ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span>Completeness Alerts</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">In-App Notifications</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {notificationSettings?.inAppOnProfileUpdate ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span>Profile Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  {notificationSettings?.inAppOnValidationChange ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span>Validation Results</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}