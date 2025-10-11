import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full items-stretch", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
InputGroup.displayName = "InputGroup"

export interface InputAddonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  position?: "left" | "right"
}

const InputAddon = React.forwardRef<HTMLDivElement, InputAddonProps>(
  ({ className, children, position = "left", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center px-3 text-sm font-medium",
          "border border-input bg-muted text-muted-foreground",
          "transition-colors",
          position === "left"
            ? "rounded-l-md border-r-0"
            : "rounded-r-md border-l-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
InputAddon.displayName = "InputAddon"

export interface InputGroupInputProps
  extends React.ComponentProps<"input"> {
  hasLeftAddon?: boolean
  hasRightAddon?: boolean
}

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  InputGroupInputProps
>(({ className, hasLeftAddon, hasRightAddon, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        hasLeftAddon && !hasRightAddon && "rounded-r-md",
        !hasLeftAddon && hasRightAddon && "rounded-l-md",
        !hasLeftAddon && !hasRightAddon && "rounded-md",
        className
      )}
      {...props}
    />
  )
})
InputGroupInput.displayName = "InputGroupInput"

export { InputGroup, InputAddon, InputGroupInput }
