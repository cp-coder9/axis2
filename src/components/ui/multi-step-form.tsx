import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface Step {
  id: string
  title: string
  description?: string
  content: React.ReactNode
  isValid?: boolean
}

export interface MultiStepFormProps {
  steps: Step[]
  currentStep: number
  onStepChange: (step: number) => void
  onComplete?: () => void
  onCancel?: () => void
  className?: string
  showStepNumbers?: boolean
  allowSkip?: boolean
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
  (
    {
      steps,
      currentStep,
      onStepChange,
      onComplete,
      onCancel,
      className,
      showStepNumbers = true,
      allowSkip = false,
    },
    ref
  ) => {
    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === steps.length - 1
    const currentStepData = steps[currentStep]

    const handleNext = () => {
      if (!isLastStep) {
        onStepChange(currentStep + 1)
      } else {
        onComplete?.()
      }
    }

    const handlePrevious = () => {
      if (!isFirstStep) {
        onStepChange(currentStep - 1)
      }
    }

    const handleStepClick = (index: number) => {
      if (allowSkip || index < currentStep) {
        onStepChange(index)
      }
    }

    const progress = ((currentStep + 1) / steps.length) * 100

    return (
      <div ref={ref} className={cn("w-full space-y-6", className)}>
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out animate-progress-fill"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Step ${currentStep + 1} of ${steps.length}`}
            />
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isClickable = allowSkip || index < currentStep

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all duration-200",
                    isClickable && "cursor-pointer hover:scale-105",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive &&
                        "border-primary bg-primary text-primary-foreground scale-110 shadow-lg",
                      isCompleted &&
                        "border-primary bg-primary text-primary-foreground",
                      !isActive &&
                        !isCompleted &&
                        "border-muted-foreground/30 bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-5 w-5 animate-spring-in"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : showStepNumbers ? (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    ) : null}
                  </div>
                  <div className="hidden md:block text-center">
                    <div
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isActive && "text-primary",
                        isCompleted && "text-primary",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    )}
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 transition-all duration-300",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] rounded-lg border bg-card p-6 animate-fade-in">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            {currentStepData.description && (
              <p className="text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            )}
          </div>
          <div className="animate-slide-up">{currentStepData.content}</div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="min-w-[100px]"
              >
                Previous
              </Button>
            )}
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
            )}
          </div>
          <Button
            type="button"
            onClick={handleNext}
            disabled={currentStepData.isValid === false}
            className="min-w-[100px]"
          >
            {isLastStep ? "Complete" : "Next"}
          </Button>
        </div>
      </div>
    )
  }
)

MultiStepForm.displayName = "MultiStepForm"

export { MultiStepForm }
