import React, { useState } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Settings,
  Camera,
  Eye
} from 'lucide-react'

// Import profile components
import { RoleBasedProfileEditor } from './RoleBasedProfileEditor'
import { EmailNotificationPreferences } from './EmailNotificationPreferences'
import { IntegratedAvatarUpload } from './IntegratedAvatarUpload'

interface ProfileSettingsDashboardProps {
  user: User
  currentUser: User
  onUpdate: (updates: Partial<User>) => Promise<void>
  onAvatarUpload?: (file: File) => Promise<string>
  onNotificationUpdate?: (settings: any) => Promise<void>
}

export function ProfileSettingsDashboard({
  user,
  currentUser,
  onUpdate,
  onAvatarUpload,
  onNotificationUpdate
}: ProfileSettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState('profile')

  // Check permissions
  const canEditProfile = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const isSelfProfile = user.id === currentUser.id

  if (!canEditProfile) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            Profile Access Restricted
          </CardTitle>
          <CardDescription>
            You can only edit your own profile or access this as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information, preferences, and notification settings
            {!isSelfProfile && ` for ${user.name}`}
          </p>
        </div>
        <Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>      
  {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <RoleBasedProfileEditor
            user={user}
            currentUser={currentUser}
            onUpdate={onUpdate}
            onAvatarUpload={onAvatarUpload}
            showAllSections={false}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {onNotificationUpdate ? (
            <EmailNotificationPreferences
              user={user}
              currentUser={currentUser}
              onUpdate={onNotificationUpdate}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Notification management is not available in this context.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy settings and data visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Privacy settings are managed through the main profile editor.
                  Switch to the Profile tab to configure visibility settings.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}