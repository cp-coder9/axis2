import React, { useState, useEffect, useMemo, useCallback } from 'react'
import type { DefaultValues } from 'react-hook-form'
import * as z from 'zod'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
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
  AlertCircle,
  CheckCircle,
  Settings,
  Camera,
  Shield
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
import { ProfileForm } from './ProfileForm'

// Define unified form schema that includes all possible fields
const createProfileSchema = () => {
  return z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    title: z.string().min(2, 'Title must be at least 2 characters'),
    timezone: z.string().default('UTC'),
    language: z.string().default('en'),
    // Role-specific fields (optional based on role)
    company: z.string().optional(),
    hourlyRate: z.number().optional(),
    skills: z.array(z.string()).optional(),
    bio: z.string().optional(),
    portfolio: z.string().url().optional().or(z.literal('')),
    // Email notifications (includes all possible fields)
    emailNotifications: z.object({
      projectUpdates: z.boolean().default(true),
      messageReceived: z.boolean().default(true),
      timerReminders: z.boolean().default(false), // Only surfaced for freelancers
      weeklyReports: z.boolean().default(false),
      systemAnnouncements: z.boolean().default(true),
      profileChanges: z.boolean().default(true),
    }),
    // Profile settings
    profileSettings: z.object({
      isPublic: z.boolean().default(false),
      showEmail: z.boolean().default(false),
      showPhone: z.boolean().default(false),
      showCompany: z.boolean().default(false),
      allowDirectMessages: z.boolean().default(true),
    }),
  })
}

interface RoleBasedProfileEditorProps {
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

export function RoleBasedProfileEditor({
  user,
  currentUser,
  onUpdate,
  onAvatarUpload,
  canDelete: _canDelete = false,
  showAllSections: _showAllSections = true
}: RoleBasedProfileEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationResults, setValidationResults] = useState<Record<string, ProfileValidationResult>>({})
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Check permissions
  const canEditProfile = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const canEditSensitiveFields = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const isSelfProfile = user.id === currentUser.id

  // Create form schema based on user role
  const profileSchema = createProfileSchema()
  type ProfileFormData = z.infer<typeof profileSchema>

  const defaultValues = useMemo<DefaultValues<ProfileFormData>>(() => ({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    title: user.title || '',
    timezone: 'UTC',
    language: 'en',
    company: user.role === UserRole.CLIENT ? user.company || '' : '',
    hourlyRate: user.role === UserRole.FREELANCER ? user.hourlyRate || 0 : 0,
    skills: user.role === UserRole.FREELANCER ? user.skills || [] : [],
    bio: user.role === UserRole.FREELANCER ? user.bio || '' : '',
    portfolio: user.role === UserRole.FREELANCER ? user.portfolio || '' : '',
    emailNotifications: {
      projectUpdates: true,
      messageReceived: true,
      timerReminders: user.role === UserRole.FREELANCER,
      weeklyReports: user.role === UserRole.ADMIN,
      systemAnnouncements: true,
      profileChanges: true,
    },
    profileSettings: {
      isPublic: false,
      showEmail: user.role === UserRole.ADMIN,
      showPhone: false,
      showCompany: user.role === UserRole.CLIENT,
      allowDirectMessages: true,
    }
  }), [user])

  const loadProfileCompleteness = useCallback(async () => {
    try {
      const report = calculateProfileCompleteness(user, user.role)
      setCompletenessReport(report)
      setValidationResults(report.validationResults)
    } catch (error) {
      console.error('Error loading profile completeness:', error)
      toast.error('Failed to load profile validation')
    }
  }, [user])

  // Load profile completeness on mount
  useEffect(() => {
    loadProfileCompleteness()
  }, [loadProfileCompleteness])

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
      if (user.role === UserRole.CLIENT && 'company' in data) {
        updateData.company = data.company
      }

      if (user.role === UserRole.FREELANCER && 'hourlyRate' in data && canEditSensitiveFields) {
        updateData.hourlyRate = data.hourlyRate
      }

      // Call the update function
      await onUpdate(updateData)

      // Reload completeness report and clear dirty state marker
      await loadProfileCompleteness()
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
            You have unsaved changes. Don&apos;t forget to save your profile updates.
          </AlertDescription>
        </Alert>
      )}

      <ProfileForm
        schema={profileSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
        hasUnsavedChanges={hasUnsavedChanges}
        setHasUnsavedChanges={setHasUnsavedChanges}
      >
        {(form) => (
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
                  {/* Privacy Settings */}
                  {isSelfProfile && (
                    <>
                      <div className="pt-4">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Privacy Settings
                        </h4>
                        <div className="space-y-4">
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
                                      checked={field.value || false}
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
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              {isSelfProfile && (
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
                                checked={field.value || false}
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

                    <FormField
                      control={form.control}
                      name="emailNotifications.profileChanges"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Profile Changes</FormLabel>
                            <FormDescription>
                              Notifications when your profile is updated
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
            </TabsContent>
          </Tabs>
        )}
      </ProfileForm>
    </div>
  )
}