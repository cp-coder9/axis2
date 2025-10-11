import * as React from "react"
import { cn } from "@/lib/utils"

export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationSummaryProps {
  errors: ValidationError[]
  onErrorClick?: (field: string) => void
  className?: string
  title?: string
}

const FormValidationSummary = React.forwardRef<
  HTMLDivElement,
  FormValidationSummaryProps
>(({ errors, onErrorClick, className, title = "Please fix the following errors:" }, ref) => {
  if (errors.length === 0) return null

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/10 p-4 animate-slide-down",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive mb-2">
            {title}
          </h3>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li
                key={`${error.field}-${index}`}
                className="text-sm text-destructive/90 animate-slide-up"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {onErrorClick ? (
                  <button
                    type="button"
                    onClick={() => onErrorClick(error.field)}
                    className="hover:underline focus:outline-none focus:underline text-left"
                  >
                    <span className="font-medium">{error.field}:</span>{" "}
                    {error.message}
                  </button>
                ) : (
                  <>
                    <span className="font-medium">{error.field}:</span>{" "}
                    {error.message}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
})

FormValidationSummary.displayName = "FormValidationSummary"

export { FormValidationSummary }
