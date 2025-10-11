import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  DollarSign, 
  Globe, 
  Bell, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

// Import validation service
import { 
  validateProfileField, 
  calculateProfileCompleteness,
  ProfileValidationResult,
  ProfileCompletenessReport
} from '../../services/profileValidationService'

// Import avatar upload component
import { IntegratedAvatarUpload } from './IntegratedAvatarUpload'

interface ProfileFormData {
  // Basic Information
  name: string
  email: string
  phone: string
  title: string
  company: string
  
  // Professional Information (Freelancer/Admin)
  hourlyRate?: number
  skills?: string[]
  bio?: string
  portfolio?: string
  
  // Preferences
  timezone: string
  language: string
  
  // Email Notification Settings
  emailNotifications: {
    projectUpdates: boolean
    messageReceived: boolean
    timerReminders: boolean
    weeklyReports: boolean
    systemAnnouncements: boolean
    profileChanges: boolean
  }
  
  // Profile Settings
  profileSettings: {
    isPublic: boolean
    showEmail: boolean
    showPhone: boolean
    showCompany: boolean
    allowDirectMessages: boolean
  }
}

interface ProfileEditorProps {
  user: User
  currentUser: User
  onUpdate: (updates: Partial<User>) => Promise<void>
  onAvatarUpload?: (file: File) => Promise<string>
  canDelete?: boolean
  showAllSections?: boolean
}

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' }
]

export function ProfileEditor({
  user,
  currentUser,
  onUpdate,
  onAvatarUpload,
  canDelete = false,
  showAllSections = true
}: ProfileEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationResults, setValidationResults] = useState<Record<string, ProfileValidationResult>>({})
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [showSensitiveFields, setShowSensitiveFields] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Check permissions
  const canEditProfile = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const canEditRole = currentUser.role === UserRole.ADMIN && user.id !== currentUser.id
  const canEditSensitiveFields = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const isSelfProfile = user.id === currentUser.id

  // Initialize form with default values
  const form = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      title: user.title || '',
      company: user.company || '',
      hourlyRate: user.hourlyRate || 0,
      skills: [],
      bio: '',
      portfolio: '',
      timezone: 'UTC',
      language: 'en',
      emailNotifications: {
        projectUpdates: true,
        messageReceived: true,
        timerReminders: true,
        weeklyReports: false,
        systemAnnouncements: true,
        profileChanges: true
      },
      profileSettings: {
        isPublic: false,
        showEmail: false,
        showPhone: false,
        showCompany: true,
        allowDirectMessages: true
      }
    }
  })

  // Watch for form changes
  const watchedValues = form.watch()
  
  useEffect(() => {
    setHasUnsavedChanges(form.formState.isDirty)
  }, [watchedValues, form.formState.isDirty])

  // Load profile completeness on mount
  useEffect(() => {
    loadProfileCompleteness()
  }, [user.id])

  const loadProfileCompleteness = async () => {
    try {
      const report = calculateProfileCompleteness(user, user.role)
      setCompletenessReport(report)
      setValidationResults(report.validationResults)
    } catch (error) {
      console.error('Error loading profile completeness:', error)
      toast.error('Failed to load profile validation')
    }
  }

  const validateField = async (fieldName: string, value: any) => {
    try {
      const result = await validateProfileField(
        { ...user, [fieldName]: value },
        fieldName,
        user.role
      )
      
      setValidationResults(prev => ({
        ...prev,
        [fieldName]: result
      }))
      
      return result.isValid
    } catch (error) {
      console.error('Error validating field:', error)
      return true // Don't block on validation errors
    }
  }

  const handleSubmit = async (data: ProfileFormData) => {
    if (!canEditProfile) {
      toast.error('You do not have permission to edit this profile')
      return
    }

    setIsLoading(true)
    
    try {
      // Prepare update data based on role permissions
      const updateData: Partial<User> = {
        name: data.name,
        title: data.title,
        phone: data.phone
      }

      // Only update email if user can edit sensitive fields
      if (canEditSensitiveFields) {
        updateData.email = data.email
      }

      // Role-specific fields
      if (user.role === UserRole.CLIENT) {
        updateData.company = data.company
      }

      if (user.role === UserRole.FREELANCER && canEditSensitiveFields) {
        updateData.hourlyRate = data.hourlyRate
      }

      // Call the update function
      await onUpdate(updateData)
      
      // Reload completeness report
      await loadProfileCompleteness()
      
      // Reset form dirty state
      form.reset(data)
      setHasUnsavedChanges(false)
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const getFieldValidationStatus = (fieldName: string) => {
    const result = validationResults[fieldName]
    if (!result) return null
    
    return {
      isValid: result.isValid,
      isRequired: result.isRequired,
      message: result.message,
      suggestions: result.suggestions
    }
  }

  const renderFieldValidation = (fieldName: string) => {
    const validation = getFieldValidationStatus(fieldName)
    if (!validation) return null

    return (
      <div className="mt-1">
        {validation.isValid ? (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>{validation.message}</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>{validation.message}</span>
            </div>
            {validation.suggestions && validation.suggestions.length > 0 && (
              <ul className="text-xs text-muted-foreground ml-4 space-y-0.5">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }

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
      {/* Profile Completeness Overview */}
      {completenessReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Completeness
            </CardTitle>
            <CardDescription>
              Complete your profile to improve visibility and functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {Math.round(completenessReport.completenessPercentage)}% Complete
                  </span>
                  <Badge variant={completenessReport.completenessPercentage >= 90 ? 'default' : 'secondary'}>
                    {completenessReport.validFields}/{completenessReport.totalFields} fields
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completenessReport.completenessPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            
            {completenessReport.missingRequired > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {completenessReport.missingRequired} required field{completenessReport.missingRequired > 1 ? 's are' : ' is'} missing. 
                  Complete these to improve your profile.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your profile updates.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Avatar Section */}
          {showAllSections && onAvatarUpload && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload a professional profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntegratedAvatarUpload
                  user={user}
                  currentUser={currentUser}
                  onAvatarUpdated={(avatarUrl) => {
                    // Update form and trigger parent update
                    onUpdate({ avatarUrl })
                    toast.success('Profile picture updated')
                  }}
                  onAvatarDeleted={() => {
                    onUpdate({ avatarUrl: '' })
                    toast.success('Profile picture removed')
                  }}
                  showAllFeatures={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your personal and professional details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Name
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your full name"
                        onBlur={() => validateField('name', field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                    {renderFieldValidation('name')}
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                      {!canEditSensitiveFields && (
                        <Badge variant="outline" className="text-xs">Read Only</Badge>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder="Enter your email address"
                        disabled={!canEditSensitiveFields}
                        onBlur={() => validateField('email', field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                    {renderFieldValidation('email')}
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Job Title
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., Senior Architect, Project Manager"
                        onBlur={() => validateField('title', field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                    {renderFieldValidation('title')}
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        onBlur={() => validateField('phone', field.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Phone number for important communications
                    </FormDescription>
                    <FormMessage />
                    {renderFieldValidation('phone')}
                  </FormItem>
                )}
              />

              {/* Company (Client only) */}
              {user.role === UserRole.CLIENT && (
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your company name"
                          onBlur={() => validateField('company', field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                      {renderFieldValidation('company')}
                    </FormItem>
                  )}
                />
              )}

              {/* Hourly Rate (Freelancer only) */}
              {user.role === UserRole.FREELANCER && (
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Hourly Rate
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                        {!canEditSensitiveFields && (
                          <Badge variant="outline" className="text-xs">Read Only</Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            disabled={!canEditSensitiveFields}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onBlur={() => validateField('hourlyRate', field.value)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Your professional hourly rate for project work
                      </FormDescription>
                      <FormMessage />
                      {renderFieldValidation('hourlyRate')}
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          {showAllSections && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timezone */}
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Used for scheduling and time-based features
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Interface language preference
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Email Notifications */}
          {showAllSections && isSelfProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailNotifications.projectUpdates"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Project Updates</FormLabel>
                        <FormDescription>
                          Notifications about project status changes and milestones
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailNotifications.messageReceived"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">New Messages</FormLabel>
                        <FormDescription>
                          Notifications when you receive new messages
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />

                {user.role === UserRole.FREELANCER && (
                  <FormField
                    control={form.control}
                    name="emailNotifications.timerReminders"
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Timer Reminders</FormLabel>
                          <FormDescription>
                            Reminders about active timers and time tracking
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="emailNotifications.weeklyReports"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Weekly Reports</FormLabel>
                        <FormDescription>
                          Weekly summary of your activity and progress
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailNotifications.systemAnnouncements"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">System Announcements</FormLabel>
                        <FormDescription>
                          Important updates and announcements from the system
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          {showAllSections && isSelfProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control what information is visible to others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="profileSettings.isPublic"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Profile</FormLabel>
                        <FormDescription>
                          Make your profile visible to other users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileSettings.showEmail"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Email</FormLabel>
                        <FormDescription>
                          Display your email address on your profile
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileSettings.showPhone"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Phone</FormLabel>
                        <FormDescription>
                          Display your phone number on your profile
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />

                {user.role === UserRole.CLIENT && (
                  <FormField
                    control={form.control}
                    name="profileSettings.showCompany"
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Company</FormLabel>
                          <FormDescription>
                            Display your company name on your profile
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="profileSettings.allowDirectMessages"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Direct Messages</FormLabel>
                        <FormDescription>
                          Allow other users to send you direct messages
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canEditSensitiveFields && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSensitiveFields(!showSensitiveFields)}
                >
                  {showSensitiveFields ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Sensitive
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Sensitive
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  setHasUnsavedChanges(false)
                }}
                disabled={!hasUnsavedChanges}
              >
                Reset Changes
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading || !hasUnsavedChanges}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}