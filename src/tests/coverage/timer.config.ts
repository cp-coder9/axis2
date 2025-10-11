/**
 * Timer Components Test Coverage Configuration
 * 
 * Specific coverage requirements and thresholds for timer components
 * Ensures high quality and comprehensive testing for critical timer functionality
 */

import type { CoverageOptions } from 'vitest'

// Timer-specific coverage thresholds
export const timerCoverageThresholds = {
  // Core timer components - require 95% coverage
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
  
  // Legacy components - require 85% coverage
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

  // Business logic modules - require 98% coverage
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

  // Utility functions - require 95% coverage
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
}

// Files to exclude from timer coverage requirements
export const timerCoverageExcludes = [
  // Demo components - not business critical
  'src/demo/components/*-demo.tsx',
  'src/demo/components/timer/*.tsx',
  
  // Test files themselves
  'src/tests/**/*.ts',
  'src/tests/**/*.tsx',
  
  // Mock files
  'src/tests/__mocks__/**/*',
  
  // Configuration files
  'src/tests/setup.ts',
  'src/tests/mockConfig.ts',
  'src/tests/fixtures/**/*',
  
  // Type definition files
  '**/*.d.ts',
  
  // Build output
  'dist/**/*',
  'build/**/*',
  
  // Development files
  'vite.config.ts',
  'vitest.config.ts',
  'tailwind.config.js'
]

// Timer module coverage configuration
export const timerCoverageConfig: Partial<CoverageOptions> = {
  // Coverage provider
  provider: 'v8',
  
  // Enable coverage
  enabled: true,
  
  // Include timer-related files
  include: [
    'src/components/timer/**/*.{ts,tsx}',
    'src/contexts/modules/{timer,auth,projects}.ts',
    'src/utils/{offlineSync,auditLogger,firebaseHelpers,firebaseErrorHandler}.ts',
    'src/types.ts'
  ],
  
  // Exclude non-critical files
  exclude: timerCoverageExcludes,
  
  // File-specific thresholds
  thresholds: timerCoverageThresholds,
  
  // Global thresholds for timer module
  thresholdsAutoUpdate: false,
  
  // Report generation
  reporter: [
    'text',      // Console output
    'html',      // HTML report
    'json',      // JSON for CI/CD
    'lcov',      // LCOV for IDE integration
    'clover'     // Clover for additional tooling
  ],
  
  // Report directory
  reportsDirectory: './coverage/timer',
  
  // Clean coverage directory before each run
  clean: true,
  
  // All files mode - include untested files
  all: true,
  
  // Skip full coverage for these file patterns
  skipFull: [
    '**/*.d.ts',
    'src/demo/**/*',
    'src/tests/**/*'
  ]
}

// Coverage validation function
export function validateTimerCoverage(coverage: any): boolean {
  const requiredFiles = Object.keys(timerCoverageThresholds)
  const missingFiles: string[] = []
  const failingFiles: string[] = []
  
  for (const file of requiredFiles) {
    const fileCoverage = coverage[file]
    
    if (!fileCoverage) {
      missingFiles.push(file)
      continue
    }
    
    const thresholds = timerCoverageThresholds[file]
    const failed = 
      fileCoverage.lines.pct < thresholds.lines ||
      fileCoverage.functions.pct < thresholds.functions ||
      fileCoverage.branches.pct < thresholds.branches ||
      fileCoverage.statements.pct < thresholds.statements
    
    if (failed) {
      failingFiles.push(file)
    }
  }
  
  if (missingFiles.length > 0) {
    console.error('Missing coverage for timer files:', missingFiles)
  }
  
  if (failingFiles.length > 0) {
    console.error('Coverage thresholds not met for timer files:', failingFiles)
  }
  
  return missingFiles.length === 0 && failingFiles.length === 0
}

// Coverage report configuration
export const timerCoverageReports = {
  // HTML report configuration
  html: {
    subdir: 'html',
    skipEmpty: false,
    skipFull: false
  },
  
  // Text report configuration
  text: {
    skipEmpty: false,
    skipFull: false,
    maxCols: 120
  },
  
  // JSON report configuration
  json: {
    file: 'coverage-timer.json'
  },
  
  // LCOV report configuration
  lcov: {
    file: 'timer.lcov'
  }
}

export default timerCoverageConfig