import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Enhanced loading spinner component
const LoadingSpinner: React.FC<{ size: string }> = ({ size }) => {
  const spinnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
    icon: 'w-4 h-4'
  };

  return (
    <svg
      className={`animate-spin ${spinnerSizes[size as keyof typeof spinnerSizes]} text-current`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Success icon component
const SuccessIcon: React.FC<{ size: string }> = ({ size }) => {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
    icon: 'w-4 h-4'
  };

  return (
    <svg
      className={`${iconSizes[size as keyof typeof iconSizes]} text-current`}
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
  );
};

// Error icon component
const ErrorIcon: React.FC<{ size: string }> = ({ size }) => {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
    icon: 'w-4 h-4'
  };

  return (
    <svg
      className={`${iconSizes[size as keyof typeof iconSizes]} text-current`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
};

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-md",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 hover:shadow-md",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-md",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105 focus:ring-purple-500",
        success:
          "bg-green-500 text-white shadow-xs hover:bg-green-600 hover:shadow-md",
        warning:
          "bg-yellow-500 text-white shadow-xs hover:bg-yellow-600 hover:shadow-md",
        error:
          "bg-red-500 text-white shadow-xs hover:bg-red-600 hover:shadow-md",
      },
      size: {
        xs: "h-6 px-2 py-1 text-xs rounded-sm gap-1",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 px-8 py-3 text-lg rounded-lg gap-3",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface EnhancedButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  timeout?: number;
  onTimeout?: () => void;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  success = false,
  error = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  timeout,
  onTimeout,
  children,
  disabled,
  onClick,
  ...props
}: EnhancedButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showError, setShowError] = React.useState(false);
  const [isTimedOut, setIsTimedOut] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  // Handle success/error state animations
  React.useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  React.useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle timeout functionality
  React.useEffect(() => {
    if (loading && timeout) {
      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true);
        onTimeout?.();
      }, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, timeout, onTimeout]);

  // Reset timeout state when loading stops
  React.useEffect(() => {
    if (!loading) {
      setIsTimedOut(false);
    }
  }, [loading]);

  // Enhanced click handler with haptic feedback simulation
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    // Simulate haptic feedback for supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick?.(e);
  };

  // Determine what to show in the button
  const renderContent = () => {
    if (showSuccess) {
      return (
        <>
          <SuccessIcon size={size || 'default'} />
          <span>Success!</span>
        </>
      );
    }

    if (showError) {
      return (
        <>
          <ErrorIcon size={size || 'default'} />
          <span>Error</span>
        </>
      );
    }

    if (loading) {
      return (
        <>
          <LoadingSpinner size={size || 'default'} />
          <span>{loadingText || 'Loading...'}</span>
          {isTimedOut && (
            <span className="ml-2 text-xs opacity-75">(Timeout)</span>
          )}
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </>
    );
  };

  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={buttonRef}
      data-slot="button"
      className={cn(
        buttonVariants({ 
          variant: showSuccess ? 'success' : showError ? 'error' : variant, 
          size, 
          className 
        }),
        fullWidth && 'w-full',
        isPressed && 'transform scale-95',
        loading && 'cursor-wait'
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={loading}
      aria-live="polite"
      {...props}
    >
      {renderContent()}
      
      {/* Ripple effect overlay */}
      <span className="absolute inset-0 overflow-hidden rounded-inherit">
        <span
          className={`absolute inset-0 bg-white opacity-0 transition-opacity duration-150 ${
            isPressed ? 'opacity-20' : ''
          }`}
        />
      </span>
    </Comp>
  )
}

export { Button, buttonVariants }
export type ButtonProps = EnhancedButtonProps