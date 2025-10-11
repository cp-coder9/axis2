import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock Toast Provider for tests
const MockToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-toast-provider">{children}</div>
}

// Mock Theme Provider for tests  
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-theme-provider">{children}</div>
}

// Mock App Context Provider for tests
const MockAppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const mockContext = {
    user: {
      uid: 'test-user',
      role: 'ADMIN',
      email: 'test@example.com',
    },
    currentTimer: null,
    timers: {},
    projects: [],
    // Add other context values as needed
  }

  return (
    <div data-testid="mock-app-context" data-context={JSON.stringify(mockContext)}>
      {children}
    </div>
  )
}

// All providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAppContextProvider>
      <MockThemeProvider>
        <MockToastProvider>
          {children}
        </MockToastProvider>
      </MockThemeProvider>
    </MockAppContextProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock hooks
export const mockUseToast = () => {
  return {
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }
}

export const mockUseTimer = () => {
  return {
    startTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    stopTimer: vi.fn(),
    resetTimer: vi.fn(),
    currentTimer: null,
    timers: {},
    isRunning: false,
    isPaused: false,
  }
}

export const mockUseAppContext = () => {
  return {
    user: {
      uid: 'test-user',
      role: 'ADMIN',
      email: 'test@example.com',
    },
    currentTimer: null,
    timers: {},
    projects: [],
    // Add other mock values as needed
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
