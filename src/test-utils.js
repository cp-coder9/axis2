// src/test-utils.js
import React from 'react';
import { render } from '@testing-library/react';

/**
 * Custom render function that wraps the component with any necessary providers
 * and mocks for testing.
 */
export function renderWithProviders(ui, options = {}) {
  return render(ui, options);
}

/**
 * Mock implementation for useToast hook
 */
export const mockToast = {
  toast: jest.fn(),
  dismiss: jest.fn(),
  toasts: [],
};

/**
 * Provider component for tests
 */
export function TestProvider({ children }) {
  return <>{children}</>;
}
