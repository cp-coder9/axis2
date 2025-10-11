// setupTests.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// This will be set up before all tests run
// It sets up global mocks that don't rely on React's internals

// Mock timers
vi.useFakeTimers();

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: []
  })
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="mock-button">
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => (
    <div data-testid="mock-card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }) => (
    <div data-testid="mock-card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }) => (
    <div data-testid="mock-card-title" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }) => (
    <div data-testid="mock-card-content" className={className}>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }) => (
    <div 
      data-testid="mock-progress" 
      className={className}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      {value}%
    </div>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }) => (
    <span 
      data-testid="mock-badge" 
      className={className}
      data-variant={variant}
    >
      {children}
    </span>
  )
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className }) => (
    <div 
      data-testid="mock-alert"
      className={className}
      data-variant={variant}
      role="alert"
    >
      {children}
    </div>
  ),
  AlertDescription: ({ children, className }) => (
    <div data-testid="mock-alert-description" className={className}>
      {children}
    </div>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Play: () => <span data-testid="mock-icon-play">Play</span>,
  Pause: () => <span data-testid="mock-icon-pause">Pause</span>,
  Square: () => <span data-testid="mock-icon-square">Square</span>,
  AlertCircle: () => <span data-testid="mock-icon-alert-circle">AlertCircle</span>,
  Clock: () => <span data-testid="mock-icon-clock">Clock</span>,
  Timer: () => <span data-testid="mock-icon-timer">Timer</span>
}));

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' ')
}));
