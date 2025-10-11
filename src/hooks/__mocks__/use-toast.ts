import { vi } from 'vitest'

// Create a mock toast function
export const mockToast = vi.fn().mockImplementation(() => ({
  id: 'mock-toast-id',
  dismiss: vi.fn(),
  update: vi.fn(),
}))

// Create a mock dismiss function
export const mockDismiss = vi.fn()

// Mock implementation of useToast that doesn't depend on React hooks
export const useToast = vi.fn(() => {
  return {
    toast: mockToast,
    toasts: [],
    dismiss: mockDismiss,
  }
})

// Export toast function for direct imports
export const toast = mockToast
