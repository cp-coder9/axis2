// Mock for the useToast hook
import { vi } from 'vitest';

export const mockToast = vi.fn();
export const mockDismiss = vi.fn();

export const useToast = () => ({
  toast: mockToast,
  dismiss: mockDismiss,
  toasts: [],
});

// Reset mocks between tests
export const resetToastMocks = () => {
  mockToast.mockReset();
  mockDismiss.mockReset();
};
