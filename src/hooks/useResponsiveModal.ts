import { useState, useEffect } from 'react'

interface UseResponsiveModalOptions {
  breakpoint?: number
  defaultToBottomSheet?: boolean
}

export function useResponsiveModal(options: UseResponsiveModalOptions = {}) {
  const { breakpoint = 768, defaultToBottomSheet = false } = options
  const [isMobile, setIsMobile] = useState(defaultToBottomSheet)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on mount
    checkScreenSize()

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [breakpoint])

  return {
    isMobile,
    shouldUseBottomSheet: isMobile,
    shouldUseDialog: !isMobile,
  }
}

// Hook for managing modal state with responsive behavior
export function useResponsiveModalState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const { isMobile, shouldUseBottomSheet, shouldUseDialog } = useResponsiveModal()

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const toggleModal = () => setIsOpen(prev => !prev)

  return {
    isOpen,
    setIsOpen,
    openModal,
    closeModal,
    toggleModal,
    isMobile,
    shouldUseBottomSheet,
    shouldUseDialog,
  }
}