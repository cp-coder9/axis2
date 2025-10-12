# Timer Coverage Configuration

This directory contains coverage-specific configurations and utilities for the timer components module.

## Files

### `timer.config.ts`
- Timer-specific coverage thresholds and configuration
- File-specific coverage requirements
- Coverage validation functions
- Report generation settings

### Coverage Requirements

#### Core Timer Components (95% coverage)
- `CountdownTimer.tsx` - Main timer display
- `EnhancedTimerDisplay.tsx` - Compact floating widget  
- `StopTimerModal.tsx` - Timer completion form

#### Legacy Components (85% coverage)
- `LegacyTimer.tsx` - Backward compatibility
- `TimerSyncStatus.tsx` - Real-time sync management

#### Business Logic (98% coverage for timer.ts, 90% for others)
- `contexts/modules/timer.ts` - Core timer operations
- `contexts/modules/auth.ts` - Role-based access control
- `contexts/modules/projects.ts` - Project access validation

#### Utilities (90-95% coverage)
- `utils/offlineSync.ts` - Offline operation handling
- `utils/auditLogger.ts` - Audit trail logging
- `utils/firebaseHelpers.ts` - Firebase utilities
- `utils/firebaseErrorHandler.ts` - Error handling

### Usage

```bash
# Import timer coverage config
import { timerCoverageConfig } from './src/tests/coverage/timer.config'

# Use in vitest configuration
export default defineConfig({
  test: {
    coverage: timerCoverageConfig
  }
})
```

## Coverage Validation

The configuration includes validation functions to ensure all timer components meet minimum coverage thresholds before deployment.