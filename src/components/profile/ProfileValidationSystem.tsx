import React, { useState, useEffect } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Shield, 
  User as UserIcon,
  Mail,
  Phone,
  Building,
  DollarSign,
  FileText,
  Bell,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  validateProfileField,
  calculateProfileCompleteness,
  getRequiredFieldsForRole,
  getOptionalFieldsForRole,
  ProfileValidationResult,
  ProfileCompletenessReport
} from '../../services/profileValidationService'

interface ProfileValidationSystemProps {
  user: User
  currentUser: User
  onValidationComplete?: (isValid: boolean, report: ProfileCompletenessReport) => void
  onFieldValidated?: (field: string, isValid: boolean, message?: string) => void
}

export function ProfileValidationSystem({
  user,
  currentUser,
  onValidationComplete,
  onFieldValidated
}: ProfileValidationSystemProps) {
  const [validationResults, setValidationResults] = useState<Record<string, ProfileValidationResult>>({})
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showValidationDetails, setShowValidationDetails] = useState(false)

  // Check if current user can view validation details
  const canViewValidation = currentUser.role === UserRole.ADMIN || user.id === currentUser.id

  useEffect(() => {
    if (canViewValidation) {
      validateProfile()
    }
  }, [user, canViewValidation])

  const validateProfile = async () => {
    try {
      setIsValidating(true)
      
      // Get required and optional fields for the user's role
      const requiredFields = getRequiredFieldsForRole(user.role)
      const optionalFields = getOptionalFieldsForRole(user.role)
      const allFields = [...requiredFields, ...optionalFields]
      
      // Validate each field
      const results: Record<string, ProfileValidationResult> = {}
      
      for (const field of allFields) {
        const result = await validateProfileField(user, field, user.role)
        results[field] = result
        
        // Notify parent component of field validation
        onFieldValidated?.(field, result.isValid, result.message)
      }
      
      setValidationResults(results)
      
      // Calculate profile completeness
      const report = calculateProfileCompleteness(user, user.role)
      setCompletenessReport(report)
      
      // Notify parent component of overall validation
      const isOverallValid = Object.values(results).every(r => r.isValid || !r.isRequired)
      onValidationComplete?.(isOverallValid, report)
      
    } catch (error) {
      console.error('Error validating profile:', error)
      toast.error('Failed to validate profile')
    } finally {
      setIsValidating(false)
    }
  }

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'name':
        return <UserIcon className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'company':
        return <Building className="h-4 w-4" />
      case 'hourlyRate':
        return <DollarSign className="h-4 w-4" />
      case 'title':
        return <FileText className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getValidationIcon = (result: ProfileValidationResult) => {
    if (result.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (result.isRequired) {
      return <XCircle className="h-4 w-4 text-red-600" />
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getValidationBadge = (result: ProfileValidationResult) => {
    if (result.isValid) {
      return <Badge variant="default" className="bg-green-600">Valid</Badge>
    } else if (result.isRequired) {
      return <Badge variant="destructive">Required</Badge>
    } else {
      return <Badge variant="secondary">Optional</Badge>
    }
  }

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-600'
    if (percentage >= 70) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  if (!canViewValidation) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Profile Validation Access Restricted
          </CardTitle>
          <CardDescription>
            You can only view profile validation for your own profile or as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Completeness Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Validation System
          </CardTitle>
          <CardDescription>
            Role-based validation and completeness checking for {user.name} ({user.role})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Validating profile...</span>
            </div>
          ) : completenessReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Profile Completeness</h4>
                  <p className="text-sm text-muted-foreground">
                    {completenessReport.completedFields} of {completenessReport.totalFields} fields completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {Math.round(completenessReport.completenessPercentage)}%
                  </div>
                  <Badge 
                    variant={completenessReport.completenessPercentage >= 90 ? 'default' : 'secondary'}
                    className={completenessReport.completenessPercentage >= 90 ? 'bg-green-600' : ''}
                  >
                    {completenessReport.completenessPercentage >= 90 ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
              </div>
              
              <Progress 
                value={completenessReport.completenessPercentage} 
                className="h-3"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Valid Fields: {completenessReport.validFields}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Missing Required: {completenessReport.missingRequired}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>Missing Optional: {completenessReport.missingOptional}</span>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Validation Details Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Field Validation Details</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValidationDetails(!showValidationDetails)}
            >
              {showValidationDetails ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Detailed validation results for each profile field
          </CardDescription>
        </CardHeader>
        
        {showValidationDetails && (
          <CardContent>
            <div className="space-y-4">
              {Object.entries(validationResults).map(([field, result], index) => (
                <div key={field}>
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-0.5">
                        {getFieldIcon(field)}
                        {getValidationIcon(result)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          {getValidationBadge(result)}
                          {result.isRequired && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.message}
                        </p>
                        {result.suggestions && result.suggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Suggestions:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {result.suggestions.map((suggestion, idx) => (
                                <li key={idx}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < Object.entries(validationResults).length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Role-Specific Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Specific Requirements</CardTitle>
          <CardDescription>
            Field requirements based on user role: {user.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Required Fields
              </h4>
              <div className="space-y-2">
                {getRequiredFieldsForRole(user.role).map((field) => (
                  <div key={field} className="flex items-center gap-2 text-sm">
                    {getFieldIcon(field)}
                    <span className="capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {validationResults[field]?.isValid && (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Optional Fields
              </h4>
              <div className="space-y-2">
                {getOptionalFieldsForRole(user.role).map((field) => (
                  <div key={field} className="flex items-center gap-2 text-sm">
                    {getFieldIcon(field)}
                    <span className="capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {validationResults[field]?.isValid && (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Actions</CardTitle>
          <CardDescription>
            Actions to improve profile completeness and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={validateProfile}
              disabled={isValidating}
            >
              <Shield className="h-4 w-4 mr-2" />
              {isValidating ? 'Validating...' : 'Re-validate Profile'}
            </Button>
            
            {completenessReport && completenessReport.completenessPercentage < 100 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Profile editing functionality would be implemented here')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Complete Profile
              </Button>
            )}
            
            {currentUser.role === UserRole.ADMIN && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Admin profile management would be implemented here')}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Manage Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}