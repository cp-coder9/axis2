import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './src/tests/setup.ts')],
    globals: true,
    
    // Enhanced coverage configuration with timer-specific requirements
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      
      // Include timer-related files for coverage
      include: [
        'src/components/timer/**/*.{ts,tsx}',
        'src/contexts/modules/{timer,auth,projects}.ts',
        'src/utils/{offlineSync,auditLogger,firebaseHelpers,firebaseErrorHandler}.ts',
        'src/types.ts'
      ],
      
      // Comprehensive exclusions
      exclude: [
        'node_modules/',
        'src/tests/**/*',
        'src/demo/**/*',
        'src/tests/__mocks__/**/*',
        '**/*.d.ts',
        'dist/',
        'build/',
        'vite.config.ts',
        'vitest.config.ts',
        'tailwind.config.js',
        'src/tests/setup.ts',
        'src/tests/mockConfig.ts',
        'src/tests/fixtures/**/*',
        'src/tests/coverage/**/*',
        '**/index.ts'
      ],
      
      // Timer-specific coverage thresholds
      thresholds: {
        // Global fallback thresholds
        global: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80
        },
        
        // Core timer components - high coverage requirements
        'src/components/timer/CountdownTimer.tsx': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95
        },
        'src/components/timer/EnhancedTimerDisplay.tsx': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95
        },
        'src/components/timer/StopTimerModal.tsx': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95
        },
        
        // Legacy components - moderate coverage
        'src/components/timer/LegacyTimer.tsx': {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85
        },
        'src/components/timer/TimerSyncStatus.tsx': {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85
        },

        // Business logic modules - critical coverage
        'src/contexts/modules/timer.ts': {
          lines: 98,
          functions: 98,
          branches: 95,
          statements: 98
        },
        'src/contexts/modules/auth.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90
        },
        'src/contexts/modules/projects.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90
        },

        // Utility functions - high coverage
        'src/utils/offlineSync.ts': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95
        },
        'src/utils/auditLogger.ts': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95
        },
        'src/utils/firebaseHelpers.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90
        },
        'src/utils/firebaseErrorHandler.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90
        }
      },
      
      // Coverage report configuration
      all: true,
      clean: true,
      skipFull: [
        '**/*.d.ts',
        'src/demo/**/*',
        'src/tests/**/*'
      ],
      thresholdsAutoUpdate: false
    },
    
    // Test timeout for async operations
    testTimeout: 15000,
    hookTimeout: 15000,
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    
    // Watch mode configuration
    watch: {
      ignore: ['coverage/**', 'dist/**', 'build/**']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})