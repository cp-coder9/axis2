import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription 
} from "./dialog"
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetFooter, 
  BottomSheetTitle, 
  BottomSheetDescription 
} from "./bottom-sheet"
import { useResponsiveModal } from "@/hooks/useResponsiveModal"
import { cn } from "@/lib/utils"

interface ResponsiveModalProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  
  // Dialog-specific props
  dialogVariant?: "default" | "glass" | "solid" | "minimal"
  dialogSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
  overlayVariant?: "default" | "glass" | "blur"
  
  // BottomSheet-specific props
  bottomSheetVariant?: "default" | "glass" | "minimal"
  bottomSheetHeight?: "auto" | "half" | "full" | "fit"
  showHandle?: boolean
  
  // Common props
  showCloseButton?: boolean
  breakpoint?: number
}

const ResponsiveModal = React.forwardRef<
  HTMLDivElement,
  ResponsiveModalProps
>(({
  children,
  open,
  onOpenChange,
  className,
  dialogVariant = "glass",
  dialogSize = "lg",
  overlayVariant = "glass",
  bottomSheetVariant = "glass",
  bottomSheetHeight = "auto",
  showHandle = true,
  showCloseButton = true,
  breakpoint = 768,
  ...props
}, ref) => {
  const { shouldUseBottomSheet } = useResponsiveModal({ breakpoint })

  if (shouldUseBottomSheet) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent
          ref={ref}
          variant={bottomSheetVariant}
          height={bottomSheetHeight}
          showHandle={showHandle}
          showCloseButton={showCloseButton}
          className={className}
          {...props}
        >
          {children}
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={ref}
        variant={dialogVariant}
        size={dialogSize}
        overlayVariant={overlayVariant}
        showCloseButton={showCloseButton}
        className={className}
        {...props}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
})
ResponsiveModal.displayName = "ResponsiveModal"

// Header component that works with both dialog and bottom sheet
const ResponsiveModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { shouldUseBottomSheet } = useResponsiveModal()

  if (shouldUseBottomSheet) {
    return <BottomSheetHeader className={className} {...props} />
  }

  return <DialogHeader className={className} {...props} />
})
ResponsiveModalHeader.displayName = "ResponsiveModalHeader"

// Footer component that works with both dialog and bottom sheet
const ResponsiveModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { shouldUseBottomSheet } = useResponsiveModal()

  if (shouldUseBottomSheet) {
    return <BottomSheetFooter className={className} {...props} />
  }

  return <DialogFooter className={className} {...props} />
})
ResponsiveModalFooter.displayName = "ResponsiveModalFooter"

// Title component that works with both dialog and bottom sheet
const ResponsiveModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { shouldUseBottomSheet } = useResponsiveModal()

  if (shouldUseBottomSheet) {
    return <BottomSheetTitle ref={ref} className={className} {...props} />
  }

  return <DialogTitle ref={ref} className={className} {...props} />
})
ResponsiveModalTitle.displayName = "ResponsiveModalTitle"

// Description component that works with both dialog and bottom sheet
const ResponsiveModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { shouldUseBottomSheet } = useResponsiveModal()

  if (shouldUseBottomSheet) {
    return <BottomSheetDescription ref={ref} className={className} {...props} />
  }

  return <DialogDescription ref={ref} className={className} {...props} />
})
ResponsiveModalDescription.displayName = "ResponsiveModalDescription"

export {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
}