import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Polyfill for setInterval/clearInterval issues in tests
global.setInterval = vi.fn((callback, delay) => {
  return setTimeout(callback, delay) as any
})

global.clearInterval = vi.fn((id) => {
  clearTimeout(id as any)
})

// This will be loaded before any test files
// It configures global mocks that are needed for the entire test suite

// Global mock for useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: []
  })
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: (props) => React.createElement('button', {
    'data-testid': 'mock-button',
    onClick: props.onClick,
    disabled: props.disabled,
    className: props.className
  }, props.children)
}));

vi.mock('@/components/ui/card', () => ({
  Card: (props) => React.createElement('div', {
    'data-testid': 'mock-card',
    className: props.className
  }, props.children),
  CardHeader: (props) => React.createElement('div', {
    'data-testid': 'mock-card-header',
    className: props.className
  }, props.children),
  CardTitle: (props) => React.createElement('div', {
    'data-testid': 'mock-card-title',
    className: props.className
  }, props.children),
  CardContent: (props) => React.createElement('div', {
    'data-testid': 'mock-card-content',
    className: props.className
  }, props.children)
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: (props) => React.createElement('div', {
    'data-testid': 'mock-progress',
    className: props.className,
    role: 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': props.value
  }, `${props.value}%`)
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: (props) => React.createElement('span', {
    'data-testid': 'mock-badge',
    className: props.className,
    'data-variant': props.variant
  }, props.children)
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: (props) => React.createElement('div', {
    'data-testid': 'mock-alert',
    className: props.className,
    'data-variant': props.variant,
    role: 'alert'
  }, props.children),
  AlertDescription: (props) => React.createElement('div', {
    'data-testid': 'mock-alert-description',
    className: props.className
  }, props.children)
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Play: () => React.createElement('span', { 'data-testid': 'mock-icon-play' }, 'Play'),
  Pause: () => React.createElement('span', { 'data-testid': 'mock-icon-pause' }, 'Pause'),
  Square: () => React.createElement('span', { 'data-testid': 'mock-icon-square' }, 'Stop'),
  AlertCircle: () => React.createElement('span', { 'data-testid': 'mock-icon-alert-circle' }, 'Alert'),
  Clock: () => React.createElement('span', { 'data-testid': 'mock-icon-clock' }, 'Clock'),
  Timer: () => React.createElement('span', { 'data-testid': 'mock-icon-timer' }, 'Timer')
}));

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' ')
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})

// Mock HTMLElement.scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: () => {},
})
