import { vi } from 'vitest'

export const mockToast = vi.fn()
export const mockDismiss = vi.fn()

export const mockUseToast = vi.fn().mockReturnValue({
  toast: mockToast,
  dismiss: mockDismiss,
  toasts: []
})

// Reset mock functions between tests
export const resetToastMocks = () => {
  mockToast.mockClear()
  mockDismiss.mockClear()
}

export default mockUseToast
