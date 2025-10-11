// Mock wrapper component for testing CountdownTimer
import React from 'react';
import { mockToast, mockDismiss } from './simple-mocks.js';

// Toast context provider mock
const ToastProvider = ({ children }) => {
  return children;
};

// Wrapper component that provides all necessary context
export function TestWrapper({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

// Helper function to render components with all the necessary providers
export function renderWithProviders(ui) {
  return render(
    <TestWrapper>
      {ui}
    </TestWrapper>
  );
}
