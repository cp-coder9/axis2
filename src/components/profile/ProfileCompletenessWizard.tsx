import React, { useState, useEffect } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Building,
  DollarSign,
  Camera,
  FileText
} from 'lucide-react'
import { 
  calculateProfileCompleteness,
  ProfileCompletenessReport 
} from '../../services/profileValidationService'
import { toast } from 'sonner'

interface ProfileCompletenessWizardProps {
  user: User
  onComplete: () => void
  onSkip: () => void
  onFieldFocus: (fieldName: string) => void
}

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  fields: string[]
  isComplete: boolean
}

export function ProfileCompletenessWizard({
  user,
  onComplete,
  onSkip,
  onFieldFocus
}: ProfileCompletenessWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completenessReport, setCompletenessReport] = useState<ProfileCompletenessReport | null>(null)
  const [steps, setSteps] = useState<WizardStep[]>([])

  useEffect(() => {
    loadCompletenessData()
  }, [user])

  const loadCompletenessData = () => {
    const report = calculateProfileCompleteness(user, user.role)
    setCompletenessReport(report)
    
    // Build wizard steps based on role and missing fields
    const wizardSteps = buildWizardSteps(report)
    setSteps(wizardSteps)
  }

  const buildWizardSteps = (report: ProfileCompletenessReport): WizardStep[] => {
    const steps: WizardStep[] = []
    
    // Basic Information Step
    const basicFields = ['name', 'email', 'title']
    const basicComplete = basicFields.every(field => 
      report.validationResults[field]?.isValid
    )
    
    steps.push({
      id: 'basic',
      title: 'Basic Information',
      description: 'Essential profile details',
      icon: <UserIcon className="h-5 w-5" />,
      fields: basicFields,
      isComplete: basicComplete
    })
    
    // Contact Information Step
    const contactFields = ['phone']
    const contactComplete = contactFields.every(field => 
      report.validationResults[field]?.isValid
    )
    
    steps.push({
      id: 'contact',
      title: 'Contact Information',
      description: 'How others can reach you',
      icon: <Phone className="h-5 w-5" />,
      fields: contactFields,
      isComplete: contactComplete
    })
    
    // Role-Specific Steps
    if (user.role === UserRole.CLIENT) {
      const clientFields = ['company']
      const clientComplete = clientFields.every(field => 
        report.validationResults[field]?.isValid
      )
      
      steps.push({
        id: 'company',
        title: 'Company Information',
        description: 'Your organization details',
        icon: <Building className="h-5 w-5" />,
        fields: clientFields,
        isComplete: clientComplete
      })
    }
    
    if (user.role === UserRole.FREELANCER) {
      const freelancerFields = ['hourlyRate']
      const freelancerComplete = freelancerFields.every(field => 
        report.validationResults[field]?.isValid
      )
      
      steps.push({
        id: 'professional',
        title: 'Professional Details',
        description: 'Your rates and expertise',
        icon: <DollarSign className="h-5 w-5" />,
        fields: freelancerFields,
        isComplete: freelancerComplete
      })
    }
    
    // Profile Picture Step
    const avatarFields = ['avatarUrl']
    const avatarComplete = avatarFields.every(field => 
      report.validationResults[field]?.isValid
    )
    
    steps.push({
      id: 'avatar',
      title: 'Profile Picture',
      description: 'Add a professional photo',
      icon: <Camera className="h-5 w-5" />,
      fields: avatarFields,
      isComplete: avatarComplete
    })
    
    return steps
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    if (completenessReport && completenessReport.completenessPercentage >= 90) {
      toast.success('Profile setup complete!')
      onComplete()
    } else {
      toast.info('You can complete your profile anytime from settings')
      onSkip()
    }
  }

  const handleFieldClick = (fieldName: string) => {
    onFieldFocus(fieldName)
  }

  if (!completenessReport || steps.length === 0) {
    return null
  }

  const currentStepData = steps[currentStep]
  const completedSteps = steps.filter(s => s.isComplete).length
  const totalSteps = steps.length

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {totalSteps}
            </CardDescription>
          </div>
          <Badge variant={completenessReport.completenessPercentage >= 90 ? 'default' : 'secondary'}>
            {Math.round(completenessReport.completenessPercentage)}% Complete
          </Badge>
        </div>
        
        <div className="mt-4">
          <Progress 
            value={(completedSteps / totalSteps) * 100} 
            className="h-2"
          />
          <p className="text-sm text-muted-foreground mt-2">
            {completedSteps} of {totalSteps} sections completed
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Step */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              currentStepData.isComplete 
                ? 'bg-green-100 text-green-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {currentStepData.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
            {currentStepData.isComplete && (
              <CheckCircle className="h-6 w-6 text-green-600 ml-auto" />
            )}
          </div>

          {/* Fields in Current Step */}
          <div className="space-y-3 pl-16">
            {currentStepData.fields.map(fieldName => {
              const validation = completenessReport.validationResults[fieldName]
              if (!validation) return null

              return (
                <div 
                  key={fieldName}
                  className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleFieldClick(fieldName)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {validation.isRequired && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {validation.message}
                    </p>
                    {validation.suggestions && validation.suggestions.length > 0 && !validation.isValid && (
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {validation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Missing Required Fields Alert */}
        {completenessReport.missingRequired > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {completenessReport.missingRequired} required field{completenessReport.missingRequired > 1 ? 's are' : ' is'} still missing.
              Complete these to activate all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onSkip}
            >
              Skip for Now
            </Button>
            
            <Button
              onClick={handleNext}
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-8 bg-primary' 
                  : step.isComplete
                  ? 'w-2 bg-green-600'
                  : 'w-2 bg-muted'
              }`}
              aria-label={`Go to ${step.title}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
