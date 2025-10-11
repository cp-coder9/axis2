// setup-test-env.js
import '@testing-library/jest-dom';

// This file will run before all test files
// It sets up the necessary environment for testing React components

// Set up global mocks for Node.js timers that vitest can control
global.setTimeout = vi.fn();
global.clearTimeout = vi.fn();
global.setInterval = vi.fn();
global.clearInterval = vi.fn();

// Add necessary browser mocks if not available in test environment
if (typeof window !== 'undefined') {
  // Add any browser-specific mocks here
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
}
