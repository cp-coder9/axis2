import React from 'react';
import { render } from '@testing-library/react';

// Toast context provider mock
const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Wrapper component that provides all necessary context
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

// Helper function to render components with all the necessary providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TestWrapper>
      {ui}
    </TestWrapper>
  );
}
