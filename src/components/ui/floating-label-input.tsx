import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface FloatingLabelInputProps
  extends React.ComponentProps<"input"> {
  label: string
  error?: string
  success?: boolean
  helperText?: string
  isLoading?: boolean
}

const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      isLoading,
      type,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)
    const generatedId = React.useId()
    const inputId = id || generatedId

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0)
      props.onChange?.(e)
    }

    const isFloating = isFocused || hasValue || props.value || props.defaultValue

    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "peer h-12 w-full rounded-md border bg-background px-3 pt-5 pb-1 text-base transition-all duration-200",
              "placeholder:text-transparent",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              error
                ? "border-destructive focus:ring-destructive/20"
                : success
                ? "border-green-500 focus:ring-green-500/20"
                : "border-input focus:ring-ring/20",
              isLoading && "opacity-50 cursor-wait",
              props.disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />
          <Label
            htmlFor={inputId}
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none",
              "peer-placeholder-shown:top-3 peer-placeholder-shown:text-base",
              isFloating
                ? "top-1.5 text-xs font-medium"
                : "top-3 text-base text-muted-foreground",
              error
                ? "text-destructive"
                : success
                ? "text-green-600 dark:text-green-400"
                : isFocused
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {label}
          </Label>
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spinner rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {success && !isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-green-500 animate-spring-in"
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
            </div>
          )}
          {error && !isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-destructive animate-spring-in"
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
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-destructive animate-slide-down"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }
