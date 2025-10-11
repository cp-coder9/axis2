import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Bell,
  Users,
  Clock,
  FileText,
  Shield,
  Database,
  Mail,
  Smartphone,
  Calendar,
  Globe,
  Lock,
  Eye,
  Activity,
  Archive,
  AlertTriangle,
  Save,
  RotateCcw
} from 'lucide-react'
import { WorkflowProject } from './ProjectWorkflow'

interface ProjectSettingsDialogProps {
  project: WorkflowProject
  open: boolean
  onClose: () => void
  onSave: (settings: ProjectSettings) => void
  userRole?: 'admin' | 'freelancer' | 'client'
}

export interface ProjectSettings {
  // General Settings
  general: {
    autoSave: boolean
    enableNotifications: boolean
    timezone: string
    dateFormat: string
    allowComments: boolean
    enableVersioning: boolean
  }
  
  // Team & Permissions
  team: {
    allowTeamInvites: boolean
    requireApprovalForNewMembers: boolean
    enableGuestAccess: boolean
    defaultMemberRole: 'viewer' | 'contributor' | 'admin'
    enableRoleCustomization: boolean
  }
  
  // Notifications
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    slackIntegration: boolean
    notifyOnTaskUpdates: boolean
    notifyOnDeadlines: boolean
    notifyOnBudgetThresholds: boolean
    reminderFrequency: 'never' | 'daily' | 'weekly'
    digestFrequency: 'never' | 'daily' | 'weekly'
  }
  
  // File Management
  files: {
    autoBackup: boolean
    versionControl: boolean
    allowExternalSharing: boolean
    filePermissions: 'strict' | 'moderate' | 'open'
    storageLimit: number
    allowedFileTypes: string[]
    automaticCleanup: boolean
    compressionEnabled: boolean
  }
  
  // Time Tracking
  timeTracking: {
    enableTimeTracking: boolean
    requireTimeApproval: boolean
    allowTimeEditing: boolean
    trackBreaks: boolean
    idleTimeThreshold: number
    overtimeAlerts: boolean
    automaticTimeEntries: boolean
  }
  
  // Security & Privacy
  security: {
    twoFactorRequired: boolean
    sessionTimeout: number
    enableAuditLog: boolean
    dataRetentionPeriod: number
    enableEncryption: boolean
    allowPasswordSharing: boolean
    ipWhitelistEnabled: boolean
    auditTrailVisible: boolean
  }
  
  // Integration & API
  integrations: {
    enableWebhooks: boolean
    apiAccessEnabled: boolean
    thirdPartyIntegrations: string[]
    calendarSync: boolean
    enableImportExport: boolean
    customFieldsEnabled: boolean
  }
  
  // Project Lifecycle
  lifecycle: {
    enableProjectTemplates: boolean
    autoArchiveCompleted: boolean
    retentionPolicy: string
    allowProjectDuplication: boolean
    requireCompletionApproval: boolean
    enableMilestoneTracking: boolean
  }
}

const defaultSettings: ProjectSettings = {
  general: {
    autoSave: true,
    enableNotifications: true,
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    allowComments: true,
    enableVersioning: true
  },
  team: {
    allowTeamInvites: true,
    requireApprovalForNewMembers: false,
    enableGuestAccess: false,
    defaultMemberRole: 'contributor',
    enableRoleCustomization: true
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    slackIntegration: false,
    notifyOnTaskUpdates: true,
    notifyOnDeadlines: true,
    notifyOnBudgetThresholds: true,
    reminderFrequency: 'daily',
    digestFrequency: 'weekly'
  },
  files: {
    autoBackup: true,
    versionControl: true,
    allowExternalSharing: false,
    filePermissions: 'moderate',
    storageLimit: 1000,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'],
    automaticCleanup: true,
    compressionEnabled: true
  },
  timeTracking: {
    enableTimeTracking: true,
    requireTimeApproval: false,
    allowTimeEditing: true,
    trackBreaks: false,
    idleTimeThreshold: 10,
    overtimeAlerts: true,
    automaticTimeEntries: false
  },
  security: {
    twoFactorRequired: false,
    sessionTimeout: 480,
    enableAuditLog: true,
    dataRetentionPeriod: 365,
    enableEncryption: true,
    allowPasswordSharing: false,
    ipWhitelistEnabled: false,
    auditTrailVisible: true
  },
  integrations: {
    enableWebhooks: false,
    apiAccessEnabled: false,
    thirdPartyIntegrations: [],
    calendarSync: true,
    enableImportExport: true,
    customFieldsEnabled: true
  },
  lifecycle: {
    enableProjectTemplates: true,
    autoArchiveCompleted: false,
    retentionPolicy: '2 years',
    allowProjectDuplication: true,
    requireCompletionApproval: true,
    enableMilestoneTracking: true
  }
}

/**
 * ProjectSettingsDialog - Comprehensive project settings management
 * Provides role-based access to project configuration options
 */
export const ProjectSettingsDialog: React.FC<ProjectSettingsDialogProps> = ({
  project,
  open,
  onClose,
  onSave,
  userRole = 'contributor'
}) => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<ProjectSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load project settings (in real implementation, this would come from context/API)
  useEffect(() => {
    if (project) {
      // Load settings for this project
      setSettings(defaultSettings)
      setHasChanges(false)
    }
  }, [project])

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      setHasChanges(true)
      return newSettings
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(settings)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save project settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(false)
  }

  const isAdmin = userRole === 'admin'
  const isContributor = userRole === 'admin' || userRole === 'freelancer'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Project Settings
          </DialogTitle>
          <DialogDescription>
            Configure settings for &ldquo;{project.title}&rdquo; - Role: {userRole}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2" disabled={!isAdmin}>
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 space-y-6">
              {/* General Settings */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      General Settings
                    </CardTitle>
                    <CardDescription>
                      Basic project configuration and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="autoSave" className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Auto-save changes
                          </Label>
                          <Switch
                            id="autoSave"
                            checked={settings.general.autoSave}
                            onCheckedChange={(checked) => updateSetting('general.autoSave', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="notifications" className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Enable notifications
                          </Label>
                          <Switch
                            id="notifications"
                            checked={settings.general.enableNotifications}
                            onCheckedChange={(checked) => updateSetting('general.enableNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="comments" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Allow comments
                          </Label>
                          <Switch
                            id="comments"
                            checked={settings.general.allowComments}
                            onCheckedChange={(checked) => updateSetting('general.allowComments', checked)}
                            disabled={!isContributor}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="versioning" className="flex items-center gap-2">
                            <Archive className="w-4 h-4" />
                            Enable versioning
                          </Label>
                          <Switch
                            id="versioning"
                            checked={settings.general.enableVersioning}
                            onCheckedChange={(checked) => updateSetting('general.enableVersioning', checked)}
                            disabled={!isAdmin}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="timezone" className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4" />
                            Timezone
                          </Label>
                          <Select
                            value={settings.general.timezone}
                            onValueChange={(value) => updateSetting('general.timezone', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                              <SelectItem value="America/New_York">EST (Eastern Time)</SelectItem>
                              <SelectItem value="America/Los_Angeles">PST (Pacific Time)</SelectItem>
                              <SelectItem value="Europe/London">GMT (Greenwich Mean Time)</SelectItem>
                              <SelectItem value="Europe/Paris">CET (Central European Time)</SelectItem>
                              <SelectItem value="Asia/Tokyo">JST (Japan Standard Time)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="dateFormat" className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4" />
                            Date format
                          </Label>
                          <Select
                            value={settings.general.dateFormat}
                            onValueChange={(value) => updateSetting('general.dateFormat', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Settings */}
              <TabsContent value="team" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Management
                    </CardTitle>
                    <CardDescription>
                      Configure team permissions and collaboration settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="teamInvites" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Allow team invites
                          </Label>
                          <Switch
                            id="teamInvites"
                            checked={settings.team.allowTeamInvites}
                            onCheckedChange={(checked) => updateSetting('team.allowTeamInvites', checked)}
                            disabled={!isAdmin}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="approvalRequired" className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Require approval for new members
                          </Label>
                          <Switch
                            id="approvalRequired"
                            checked={settings.team.requireApprovalForNewMembers}
                            onCheckedChange={(checked) => updateSetting('team.requireApprovalForNewMembers', checked)}
                            disabled={!isAdmin}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="guestAccess" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Enable guest access
                          </Label>
                          <Switch
                            id="guestAccess"
                            checked={settings.team.enableGuestAccess}
                            onCheckedChange={(checked) => updateSetting('team.enableGuestAccess', checked)}
                            disabled={!isAdmin}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="defaultRole" className="flex items-center gap-2 mb-2">
                            <Badge className="w-4 h-4" />
                            Default member role
                          </Label>
                          <Select
                            value={settings.team.defaultMemberRole}
                            onValueChange={(value) => updateSetting('team.defaultMemberRole', value)}
                            disabled={!isAdmin}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                              <SelectItem value="contributor">Contributor (Edit access)</SelectItem>
                              <SelectItem value="admin">Admin (Full access)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-3">Current Team ({project.teamMembers.length} members)</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.teamMembers.map((member, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>
                      Control how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Notification Channels</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="emailNotifs" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email notifications
                          </Label>
                          <Switch
                            id="emailNotifs"
                            checked={settings.notifications.emailNotifications}
                            onCheckedChange={(checked) => updateSetting('notifications.emailNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="pushNotifs" className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Push notifications
                          </Label>
                          <Switch
                            id="pushNotifs"
                            checked={settings.notifications.pushNotifications}
                            onCheckedChange={(checked) => updateSetting('notifications.pushNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="slackIntegration" className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Slack integration
                          </Label>
                          <Switch
                            id="slackIntegration"
                            checked={settings.notifications.slackIntegration}
                            onCheckedChange={(checked) => updateSetting('notifications.slackIntegration', checked)}
                            disabled={!isAdmin}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Notification Types</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="taskUpdates" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Task updates
                          </Label>
                          <Switch
                            id="taskUpdates"
                            checked={settings.notifications.notifyOnTaskUpdates}
                            onCheckedChange={(checked) => updateSetting('notifications.notifyOnTaskUpdates', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="deadlines" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Deadline reminders
                          </Label>
                          <Switch
                            id="deadlines"
                            checked={settings.notifications.notifyOnDeadlines}
                            onCheckedChange={(checked) => updateSetting('notifications.notifyOnDeadlines', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="budgetThresholds" className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Budget alerts
                          </Label>
                          <Switch
                            id="budgetThresholds"
                            checked={settings.notifications.notifyOnBudgetThresholds}
                            onCheckedChange={(checked) => updateSetting('notifications.notifyOnBudgetThresholds', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="reminderFreq" className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4" />
                          Reminder frequency
                        </Label>
                        <Select
                          value={settings.notifications.reminderFrequency}
                          onValueChange={(value) => updateSetting('notifications.reminderFrequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="digestFreq" className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          Email digest frequency
                        </Label>
                        <Select
                          value={settings.notifications.digestFrequency}
                          onValueChange={(value) => updateSetting('notifications.digestFrequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings (Admin only) */}
              <TabsContent value="security" className="space-y-6">
                {isAdmin ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security & Privacy
                      </CardTitle>
                      <CardDescription>
                        Configure security settings and data protection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="twoFactor" className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Require 2FA for team
                            </Label>
                            <Switch
                              id="twoFactor"
                              checked={settings.security.twoFactorRequired}
                              onCheckedChange={(checked) => updateSetting('security.twoFactorRequired', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="auditLog" className="flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Enable audit logging
                            </Label>
                            <Switch
                              id="auditLog"
                              checked={settings.security.enableAuditLog}
                              onCheckedChange={(checked) => updateSetting('security.enableAuditLog', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="encryption" className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Enable data encryption
                            </Label>
                            <Switch
                              id="encryption"
                              checked={settings.security.enableEncryption}
                              onCheckedChange={(checked) => updateSetting('security.enableEncryption', checked)}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="sessionTimeout" className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4" />
                              Session timeout (minutes)
                            </Label>
                            <Input
                              id="sessionTimeout"
                              type="number"
                              value={settings.security.sessionTimeout}
                              onChange={(e) => updateSetting('security.sessionTimeout', parseInt(e.target.value))}
                              min={15}
                              max={1440}
                            />
                          </div>

                          <div>
                            <Label htmlFor="retentionPeriod" className="flex items-center gap-2 mb-2">
                              <Database className="w-4 h-4" />
                              Data retention (days)
                            </Label>
                            <Input
                              id="retentionPeriod"
                              type="number"
                              value={settings.security.dataRetentionPeriod}
                              onChange={(e) => updateSetting('security.dataRetentionPeriod', parseInt(e.target.value))}
                              min={30}
                              max={2555}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center space-y-3">
                        <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
                        <h3 className="text-lg font-medium">Admin Access Required</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Security settings can only be configured by project administrators.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Unsaved changes
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectSettingsDialog
