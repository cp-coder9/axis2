import * as React from "react"
import { 
  ResponsiveModal, 
  ResponsiveModalHeader, 
  ResponsiveModalFooter, 
  ResponsiveModalTitle, 
  ResponsiveModalDescription 
} from "./responsive-modal"
import { cn } from "@/lib/utils"

interface EnhancedModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  
  // Styling options
  variant?: "default" | "glass" | "solid" | "minimal"
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
  overlayVariant?: "default" | "glass" | "blur"
  
  // Mobile options
  bottomSheetHeight?: "auto" | "half" | "full" | "fit" | "peek" | "medium"
  showHandle?: boolean
  snapPoints?: Array<{ height: number; label?: string }>
  
  // Behavior options
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
  headerClassName?: string
  footerClassName?: string
  contentClassName?: string
}

/**
 * Enhanced Modal Wrapper - Provides a simplified API for creating modals with glassmorphism effects
 * Automatically handles responsive behavior and modern interaction patterns
 */
export const EnhancedModalWrapper = React.forwardRef<
  HTMLDivElement,
  EnhancedModalWrapperProps
>(({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "glass",
  size = "lg",
  overlayVariant = "glass",
  bottomSheetHeight = "auto",
  showHandle = true,
  snapPoints,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  headerClassName,
  footerClassName,
  contentClassName,
}, ref) => {
  const handleOpenChange = (open: boolean) => {
    if (!open && closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <ResponsiveModal
      ref={ref}
      open={isOpen}
      onOpenChange={handleOpenChange}
      dialogVariant={variant}
      dialogSize={size}
      overlayVariant={overlayVariant}
      bottomSheetVariant={variant}
      bottomSheetHeight={bottomSheetHeight}
      showHandle={showHandle}
      showCloseButton={showCloseButton}
      className={className}
    >
      <ResponsiveModalHeader className={headerClassName}>
        <ResponsiveModalTitle>{title}</ResponsiveModalTitle>
        {description && (
          <ResponsiveModalDescription>{description}</ResponsiveModalDescription>
        )}
      </ResponsiveModalHeader>

      <div className={cn("space-y-4", contentClassName)}>
        {children}
      </div>

      {footer && (
        <ResponsiveModalFooter className={footerClassName}>
          {footer}
        </ResponsiveModalFooter>
      )}
    </ResponsiveModal>
  )
})
EnhancedModalWrapper.displayName = "EnhancedModalWrapper"

/**
 * Hook for managing enhanced modal state
 */
export function useEnhancedModal(initialOpen = false) {
  const [isOpen, setIsOpen] = React.useState(initialOpen)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  }
}