import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const BottomSheet = DialogPrimitive.Root

const BottomSheetTrigger = DialogPrimitive.Trigger

const BottomSheetClose = DialogPrimitive.Close

const BottomSheetPortal = DialogPrimitive.Portal

// Bottom sheet overlay with mobile-optimized backdrop
const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName

// Bottom sheet content variants with snap points
const bottomSheetContentVariants = cva(
  "fixed inset-x-0 bottom-0 z-50 grid gap-4 bg-background p-6 shadow-lg transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-t border-border rounded-t-xl",
        glass: "bg-background/90 backdrop-blur-xl border-t border-white/20 rounded-t-2xl shadow-2xl",
        minimal: "bg-background/95 backdrop-blur-sm border-t border-border/50 rounded-t-2xl",
      },
      height: {
        auto: "max-h-[85vh]",
        half: "h-[50vh]",
        full: "h-[85vh]",
        fit: "max-h-fit",
        peek: "h-[25vh]",
        medium: "h-[60vh]",
      },
      snapBehavior: {
        none: "",
        smooth: "transition-transform duration-300 ease-out",
        spring: "transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
      },
    },
    defaultVariants: {
      variant: "default",
      height: "auto",
      snapBehavior: "spring",
    },
  }
)

interface SnapPoint {
  height: number // percentage of viewport height
  label?: string
}

interface BottomSheetContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'onDragEnd'>,
    VariantProps<typeof bottomSheetContentVariants> {
  showHandle?: boolean
  showCloseButton?: boolean
  onDragEnd?: (velocity: number) => void
  snapPoints?: SnapPoint[]
  defaultSnapPoint?: number
  onSnapPointChange?: (snapPoint: number) => void
  dragThreshold?: number
  velocityThreshold?: number
}

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetContentProps
>(({ 
  className, 
  children, 
  variant = "default", 
  height = "auto",
  snapBehavior = "spring",
  showHandle = true,
  showCloseButton = true,
  onDragEnd,
  snapPoints = [],
  defaultSnapPoint = 0,
  onSnapPointChange,
  dragThreshold = 100,
  velocityThreshold = 0.5,
  ...props 
}, ref) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const [startY, setStartY] = React.useState(0)
  const [currentY, setCurrentY] = React.useState(0)
  const [startTime, setStartTime] = React.useState(0)
  const [currentSnapPoint, setCurrentSnapPoint] = React.useState(defaultSnapPoint)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Calculate snap point heights based on viewport
  const getSnapPointHeight = React.useCallback((snapPoint: SnapPoint) => {
    return (window.innerHeight * snapPoint.height) / 100
  }, [])

  const findNearestSnapPoint = React.useCallback((currentPosition: number, velocity: number) => {
    if (snapPoints.length === 0) return null

    const viewportHeight = window.innerHeight
    const currentHeightPercent = ((viewportHeight - currentPosition) / viewportHeight) * 100

    // If velocity is high, predict where user wants to go
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity > 0) {
        // Dragging down - find lower snap point or close
        const lowerPoints = snapPoints.filter(sp => sp.height < currentHeightPercent)
        return lowerPoints.length > 0 ? lowerPoints[lowerPoints.length - 1] : null
      } else {
        // Dragging up - find higher snap point
        const higherPoints = snapPoints.filter(sp => sp.height > currentHeightPercent)
        return higherPoints.length > 0 ? higherPoints[0] : snapPoints[snapPoints.length - 1]
      }
    }

    // Find closest snap point by distance
    let closestPoint = snapPoints[0]
    let minDistance = Math.abs(snapPoints[0].height - currentHeightPercent)

    snapPoints.forEach(point => {
      const distance = Math.abs(point.height - currentHeightPercent)
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
      }
    })

    return closestPoint
  }, [snapPoints, velocityThreshold])

  const snapToPoint = React.useCallback((snapPoint: SnapPoint | null) => {
    if (!contentRef.current) return

    if (!snapPoint) {
      // Close the sheet
      onDragEnd?.(1)
      const closeButton = contentRef.current.querySelector('[data-radix-dialog-close]') as HTMLButtonElement
      closeButton?.click()
      return
    }

    const targetHeight = getSnapPointHeight(snapPoint)
    const viewportHeight = window.innerHeight
    const targetPosition = viewportHeight - targetHeight

    contentRef.current.style.transform = `translateY(${targetPosition - viewportHeight}px)`
    
    // Update current snap point
    const newSnapPointIndex = snapPoints.findIndex(sp => sp.height === snapPoint.height)
    if (newSnapPointIndex !== -1) {
      setCurrentSnapPoint(newSnapPointIndex)
      onSnapPointChange?.(newSnapPointIndex)
    }

    // Reset transform after animation
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.style.transform = ''
      }
    }, 500)
  }, [snapPoints, getSnapPointHeight, onDragEnd, onSnapPointChange])

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
    setStartTime(Date.now())
  }, [])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    
    const touchY = e.touches[0].clientY
    const deltaY = touchY - startY
    
    setCurrentY(touchY)
    
    if (contentRef.current) {
      // Allow both up and down dragging for snap points
      if (snapPoints.length > 0) {
        contentRef.current.style.transform = `translateY(${deltaY}px)`
      } else {
        // Only allow downward dragging for simple close behavior
        if (deltaY > 0) {
          contentRef.current.style.transform = `translateY(${deltaY}px)`
        }
      }
    }
  }, [isDragging, startY, snapPoints])

  const handleTouchEnd = React.useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    const deltaY = currentY - startY
    const deltaTime = Date.now() - startTime
    const velocity = deltaY / deltaTime // pixels per millisecond

    if (contentRef.current) {
      contentRef.current.style.transform = ''
    }

    if (snapPoints.length > 0) {
      // Use snap points
      const nearestSnapPoint = findNearestSnapPoint(currentY, velocity * 1000) // convert to pixels per second
      snapToPoint(nearestSnapPoint)
    } else {
      // Simple close behavior
      if (deltaY > dragThreshold || velocity > velocityThreshold / 1000) {
        onDragEnd?.(velocity * 1000)
        const closeButton = contentRef.current?.querySelector('[data-radix-dialog-close]') as HTMLButtonElement
        closeButton?.click()
      }
    }
  }, [isDragging, currentY, startY, startTime, snapPoints, findNearestSnapPoint, snapToPoint, dragThreshold, velocityThreshold, onDragEnd])

  return (
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          bottomSheetContentVariants({ variant, height }),
          "contain-paint will-change-transform overflow-hidden",
          className
        )}
        {...props}
      >
        <div
          ref={contentRef}
          className="relative h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {showHandle && (
            <div className="flex justify-center pb-4">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full cursor-grab active:cursor-grabbing" />
            </div>
          )}
          
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
          
          <div className="overflow-y-auto max-h-full">
            {children}
          </div>
        </div>
      </DialogPrimitive.Content>
    </BottomSheetPortal>
  )
})
BottomSheetContent.displayName = DialogPrimitive.Content.displayName

const BottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left pb-4",
      className
    )}
    {...props}
  />
)
BottomSheetHeader.displayName = "BottomSheetHeader"

const BottomSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-border",
      className
    )}
    {...props}
  />
)
BottomSheetFooter.displayName = "BottomSheetFooter"

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
BottomSheetTitle.displayName = DialogPrimitive.Title.displayName

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
BottomSheetDescription.displayName = DialogPrimitive.Description.displayName

export {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
}