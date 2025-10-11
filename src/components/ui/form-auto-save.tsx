import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormAutoSaveProps {
  onSave: (data: any) => Promise<void>
  data: any
  debounceMs?: number
  enabled?: boolean
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error"

export const useFormAutoSave = ({
  onSave,
  data,
  debounceMs = 1000,
  enabled = true,
  onSaveSuccess,
  onSaveError,
}: FormAutoSaveProps) => {
  const [status, setStatus] = React.useState<AutoSaveStatus>("idle")
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  const previousDataRef = React.useRef<any>(data)

  React.useEffect(() => {
    if (!enabled) return

    // Check if data has actually changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return
    }

    previousDataRef.current = data

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving")
      try {
        await onSave(data)
        setStatus("saved")
        setLastSaved(new Date())
        onSaveSuccess?.()

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setStatus("idle")
        }, 2000)
      } catch (error) {
        setStatus("error")
        onSaveError?.(error as Error)

        // Reset to idle after 3 seconds
        setTimeout(() => {
          setStatus("idle")
        }, 3000)
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, debounceMs, onSave, onSaveSuccess, onSaveError])

  return { status, lastSaved }
}

export interface AutoSaveIndicatorProps {
  status: AutoSaveStatus
  lastSaved: Date | null
  className?: string
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  className,
}) => {
  const getStatusText = () => {
    switch (status) {
      case "saving":
        return "Saving..."
      case "saved":
        return "Saved"
      case "error":
        return "Error saving"
      default:
        return lastSaved
          ? `Last saved ${formatRelativeTime(lastSaved)}`
          : "Auto-save enabled"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "saving":
        return (
          <div className="h-3 w-3 animate-spinner rounded-full border-2 border-primary border-t-transparent" />
        )
      case "saved":
        return (
          <svg
            className="h-4 w-4 text-green-500 animate-spring-in"
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
        )
      case "error":
        return (
          <svg
            className="h-4 w-4 text-destructive animate-spring-in"
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
        )
      default:
        return (
          <svg
            className="h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-all duration-200",
        status === "saving" && "text-muted-foreground",
        status === "saved" && "text-green-600 dark:text-green-400",
        status === "error" && "text-destructive",
        status === "idle" && "text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {getStatusIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
