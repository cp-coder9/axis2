import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, UserRole } from '@/types'
import { NotificationType } from '@/types/notifications'
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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  EyeOff,
  Shield,
  Settings,
  Camera
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

// Define unified form schema with all possible fields as optional
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  timezone: z.string().optional(),
  language: z.string().optional(),
  // Role-specific fields (required in schema, validated in form logic)
  company: z.string().optional(),
  hourlyRate: z.number().optional(),
  skills: z.array(z.string()).optional(),
  bio: z.string().optional(),
  portfolio: z.string().url().optional().or(z.literal('')),
  // Notification settings
  emailNotifications: z.object({
    projectUpdates: z.boolean(),
    messageReceived: z.boolean(),
    weeklyReports: z.boolean(),
    systemAnnouncements: z.boolean(),
    timerReminders: z.boolean(),
  }),
  // Profile settings
  profileSettings: z.object({
    isPublic: z.boolean(),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
    allowDirectMessages: z.boolean(),
    showCompany: z.boolean(),
  }),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface EnhancedProfileEditorProps {
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

export function EnhancedProfileEditor({
  user,
  currentUser,
  onUpdate,
  onAvatarUpload,
  canDelete = false,
  showAllSections = true
}: EnhancedProfileEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationResults, setValidationResults] = useState<Record<string, ProfileValidationResult>>({})
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [showSensitiveFields, setShowSensitiveFields] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Check permissions
  const canEditProfile = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const canEditRole = currentUser.role === UserRole.ADMIN && user.id !== currentUser.id
  const canEditSensitiveFields = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const isSelfProfile = user.id === currentUser.id

  // Create form schema based on user role
  type ProfileFormData = z.infer<typeof profileSchema>

  // Initialize form with default values
  const form = useForm<ProfileFormData, any, ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      title: user.title || '',
      timezone: user.preferences?.timezone || 'UTC',
      language: user.preferences?.language || 'en',
      ...(user.role === UserRole.CLIENT ? { company: user.company || '' } : {}),
      ...(user.role === UserRole.FREELANCER ? {
        hourlyRate: user.hourlyRate || 0,
        bio: '',
        portfolio: ''
      } : {}),
      emailNotifications: {
        projectUpdates: user.preferences?.notifications?.email?.types?.includes(NotificationType.PROJECT_UPDATED) ?? true,
        messageReceived: user.preferences?.notifications?.email?.types?.includes(NotificationType.MESSAGE_RECEIVED) ?? true,
        timerReminders: user.role === UserRole.FREELANCER,
        weeklyReports: user.role === UserRole.ADMIN,
        systemAnnouncements: true,
      },
      profileSettings: {
        isPublic: false,
        showEmail: user.role === UserRole.ADMIN,
        showPhone: false,
        showCompany: user.role === UserRole.CLIENT,
        allowDirectMessages: true,
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

    // Role-based validation
    if (user.role === UserRole.CLIENT && !data.company?.trim()) {
      form.setError('company', { message: 'Company name is required for clients' })
      return
    }

    if (user.role === UserRole.FREELANCER && (data.hourlyRate === undefined || data.hourlyRate <= 0)) {
      form.setError('hourlyRate', { message: 'Hourly rate is required for freelancers and must be greater than 0' })
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
      if (user.role === UserRole.CLIENT && data.company) {
        updateData.company = data.company
      }

      if (user.role === UserRole.FREELANCER && data.hourlyRate !== undefined && canEditSensitiveFields) {
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
                <Progress
                  value={completenessReport.completenessPercentage}
                  className="h-2"
                />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="avatar" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Avatar
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
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
                              value={field.value || ''}
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
                                value={field.value || ''}
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

                  {/* Professional Information for Freelancers */}
                  {user.role === UserRole.FREELANCER && (
                    <>
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value || ''}
                                placeholder="Tell us about your professional background and expertise..."
                                rows={4}
                              />
                            </FormControl>
                            <FormDescription>
                              A brief description of your professional background
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="portfolio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ''}
                                type="url"
                                placeholder="https://your-portfolio.com"
                              />
                            </FormControl>
                            <FormDescription>
                              Link to your professional portfolio or website
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Avatar Tab */}
            <TabsContent value="avatar" className="space-y-6">
              {onAvatarUpload && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Profile Picture
                    </CardTitle>
                    <CardDescription>
                      Upload a professional profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IntegratedAvatarUpload
                      user={user}
                      currentUser={currentUser}
                      onAvatarUpdated={(avatarUrl) => {
                        onUpdate({ avatarUrl })
                        toast.success('Profile picture updated')
                      }}
                      onAvatarDeleted={() => {
                        onUpdate({ avatarUrl: '' })
                        toast.success('Profile picture removed')
                      }}
                      showAllFeatures={true}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
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
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Control how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="emailNotifications.projectUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Project Updates
                            </FormLabel>
                            <FormDescription>
                              Receive notifications about project status changes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailNotifications.messageReceived"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              New Messages
                            </FormLabel>
                            <FormDescription>
                              Get notified when you receive new messages
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {user.role === UserRole.FREELANCER && (
                      <FormField
                        control={form.control}
                        name="emailNotifications.timerReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Timer Reminders
                              </FormLabel>
                              <FormDescription>
                                Reminders to start/stop your work timer
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={Boolean(field.value)}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="emailNotifications.systemAnnouncements"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              System Announcements
                            </FormLabel>
                            <FormDescription>
                              Important system updates and announcements
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showSensitiveFields && (
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

              {canEditRole && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Access
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isLoading || !hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
