import React, { useState, useEffect } from 'react'
import { User } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react'
import { 
  calculateProfileCompleteness,
  ProfileCompletenessReport 
} from '../../services/profileValidationService'

interface ProfileCompletenessNotificationProps {
  user: User
  onDismiss: () => void
  onViewProfile: () => void
  minimumPercentage?: number
}

export function ProfileCompletenessNotification({
  user,
  onDismiss,
  onViewProfile,
  minimumPercentage = 90
}: ProfileCompletenessNotificationProps) {
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    loadCompleteness()
  }, [user])

  const loadCompleteness = () => {
    const report = calculateProfileCompleteness(user, user.role)
    setCompletenessReport(report)
    
    // Only show notification if profile is incomplete
    setIsVisible(report.completenessPercentage < minimumPercentage)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  if (!completenessReport || !isVisible) {
    return null
  }

  const percentage = Math.round(completenessReport.completenessPercentage)
  const isNearComplete = percentage >= 75
  const isCritical = completenessReport.missingRequired > 0

  return (
    <Alert 
      variant={isCritical ? 'destructive' : 'default'}
      className="relative"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-accent transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        {isCritical ? (
          <AlertCircle className="h-5 w-5 mt-0.5" />
        ) : isNearComplete ? (
          <TrendingUp className="h-5 w-5 mt-0.5" />
        ) : (
          <CheckCircle className="h-5 w-5 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-3">
          <div>
            <AlertTitle className="flex items-center gap-2">
              Complete Your Profile
              <Badge variant={isCritical ? 'destructive' : 'secondary'}>
                {percentage}%
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              {isCritical ? (
                <>
                  Your profile is missing {completenessReport.missingRequired} required field
                  {completenessReport.missingRequired > 1 ? 's' : ''}. 
                  Complete your profile to access all features.
                </>
              ) : isNearComplete ? (
                <>
                  You're almost there! Just a few more details to complete your profile.
                </>
              ) : (
                <>
                  Complete your profile to improve visibility and unlock all features.
                </>
              )}
            </AlertDescription>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completenessReport.validFields} of {completenessReport.totalFields} fields completed
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Missing Fields Summary */}
          {completenessReport.missingRequired > 0 && (
            <div className="text-sm space-y-1">
              <p className="font-medium">Missing required fields:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {Object.entries(completenessReport.validationResults)
                  .filter(([_, result]) => result.isRequired && !result.isValid)
                  .slice(0, 3)
                  .map(([field, result]) => (
                    <li key={field}>
                      {field.replace(/([A-Z])/g, ' $1').trim()}: {result.message}
                    </li>
                  ))}
                {Object.entries(completenessReport.validationResults)
                  .filter(([_, result]) => result.isRequired && !result.isValid).length > 3 && (
                  <li>
                    And {Object.entries(completenessReport.validationResults)
                      .filter(([_, result]) => result.isRequired && !result.isValid).length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onViewProfile}
            >
              Complete Profile
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            >
              Remind Me Later
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  )
}
