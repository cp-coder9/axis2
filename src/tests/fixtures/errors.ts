/**
 * Error Scenarios Test Fixtures
 * Comprehensive error test data for negative testing scenarios
 */

// Firebase error scenarios
export const firebaseErrorScenarios = {
  authenticationError: {
    code: 'auth/unauthenticated',
    message: 'User is not authenticated',
    type: 'authentication',
    shouldRetry: false,
    expectedUserAction: 'redirect_to_login'
  },
  
  permissionDenied: {
    code: 'permission-denied',
    message: 'Insufficient permissions to perform this operation',
    type: 'authorization',
    shouldRetry: false,
    expectedUserAction: 'show_error_message'
  },
  
  networkError: {
    code: 'unavailable',
    message: 'Network error occurred',
    type: 'network',
    shouldRetry: true,
    expectedUserAction: 'retry_with_backoff'
  },
  
  quotaExceeded: {
    code: 'resource-exhausted',
    message: 'Quota exceeded for this operation',
    type: 'quota',
    shouldRetry: false,
    expectedUserAction: 'contact_support'
  },
  
  documentNotFound: {
    code: 'not-found',
    message: 'Document not found',
    type: 'data',
    shouldRetry: false,
    expectedUserAction: 'refresh_data'
  },
  
  invalidData: {
    code: 'invalid-argument',
    message: 'Invalid data provided',
    type: 'validation',
    shouldRetry: false,
    expectedUserAction: 'fix_input'
  }
};

// Timer operation error scenarios
export const timerErrorScenarios = {
  startTimerError: {
    operation: 'start',
    error: firebaseErrorScenarios.permissionDenied,
    expectedState: 'idle',
    expectedMessage: 'Cannot start timer: Insufficient permissions'
  },
  
  pauseTimerError: {
    operation: 'pause',
    error: firebaseErrorScenarios.networkError,
    expectedState: 'running', // Should remain running on network error
    expectedMessage: 'Failed to pause timer: Network error'
  },
  
  resumeTimerError: {
    operation: 'resume',
    error: firebaseErrorScenarios.quotaExceeded,
    expectedState: 'paused', // Should remain paused
    expectedMessage: 'Cannot resume timer: Quota exceeded'
  },
  
  stopTimerError: {
    operation: 'stop',
    error: firebaseErrorScenarios.networkError,
    expectedState: 'running', // Should not stop on error
    expectedMessage: 'Failed to stop timer: Network error',
    shouldShowRetry: true
  },
  
  syncError: {
    operation: 'sync',
    error: firebaseErrorScenarios.networkError,
    expectedState: 'offline',
    expectedMessage: 'Timer sync failed: Working offline',
    shouldQueueOperation: true
  }
};

// Context error scenarios
export const contextErrorScenarios = {
  timerContextUnavailable: {
    context: 'timer',
    error: 'Timer context not available',
    expectedBehavior: 'show_fallback_ui',
    expectedMessage: 'Timer functionality temporarily unavailable'
  },
  
  authContextUnavailable: {
    context: 'auth',
    error: 'Authentication context not available',
    expectedBehavior: 'redirect_to_login',
    expectedMessage: 'Please log in to continue'
  },
  
  projectsContextUnavailable: {
    context: 'projects',
    error: 'Projects context not available',
    expectedBehavior: 'show_error_state',
    expectedMessage: 'Unable to load project data'
  },
  
  contextProviderError: {
    context: 'provider',
    error: 'Context provider initialization failed',
    expectedBehavior: 'show_error_boundary',
    expectedMessage: 'Application initialization failed'
  }
};

// Validation error scenarios
export const validationErrorScenarios = {
  invalidTimerState: {
    field: 'timerState',
    value: { status: 'invalid_status' },
    error: 'Invalid timer state',
    expectedMessage: 'Timer state is invalid'
  },
  
  invalidTimeValue: {
    field: 'timeRemaining',
    value: NaN,
    error: 'Invalid time value',
    expectedMessage: 'Time value must be a valid number'
  },
  
  negativeTimeValue: {
    field: 'totalTime',
    value: -1800,
    error: 'Negative time not allowed',
    expectedMessage: 'Time cannot be negative'
  },
  
  missingJobCardId: {
    field: 'jobCardId',
    value: null,
    error: 'Job card ID required',
    expectedMessage: 'Job card must be selected'
  },
  
  invalidPauseCount: {
    field: 'pauseCount',
    value: -1,
    error: 'Invalid pause count',
    expectedMessage: 'Pause count cannot be negative'
  },
  
  invalidFileSize: {
    field: 'file',
    value: { size: 1024 * 1024 * 10 }, // 10MB
    error: 'File too large',
    expectedMessage: 'File size must be less than 5MB'
  },
  
  invalidFileType: {
    field: 'file',
    value: { type: 'video/mp4' },
    error: 'Invalid file type',
    expectedMessage: 'Invalid file type. Please upload images, PDFs, or documents only.'
  },
  
  shortNotes: {
    field: 'notes',
    value: 'Too short',
    error: 'Notes too short',
    expectedMessage: 'Notes must be at least 10 characters long'
  }
};

// Network error scenarios
export const networkErrorScenarios = {
  connectionLost: {
    type: 'offline',
    message: 'Internet connection lost',
    expectedBehavior: 'queue_operations',
    expectedUI: 'show_offline_indicator'
  },
  
  slowConnection: {
    type: 'timeout',
    message: 'Request timed out',
    expectedBehavior: 'retry_with_backoff',
    expectedUI: 'show_loading_spinner'
  },
  
  serverUnavailable: {
    type: 'server_error',
    message: 'Server temporarily unavailable',
    expectedBehavior: 'show_error_retry',
    expectedUI: 'show_retry_button'
  },
  
  rateLimited: {
    type: 'rate_limit',
    message: 'Too many requests, please slow down',
    expectedBehavior: 'exponential_backoff',
    expectedUI: 'show_rate_limit_message'
  }
};

// Role-based access error scenarios
export const accessErrorScenarios = {
  clientAccessTimer: {
    userRole: 'CLIENT',
    action: 'access_timer',
    error: 'Clients cannot access timer functionality',
    expectedBehavior: 'hide_component',
    expectedMessage: null // Should be completely hidden
  },
  
  freelancerAccessRestricted: {
    userRole: 'FREELANCER',
    action: 'access_unassigned_job',
    error: 'Cannot start timer on unassigned job card',
    expectedBehavior: 'disable_controls',
    expectedMessage: 'You are not assigned to this task'
  },
  
  inactiveUserAccess: {
    userRole: 'FREELANCER',
    userStatus: 'inactive',
    action: 'use_timer',
    error: 'Inactive users cannot use timer',
    expectedBehavior: 'show_warning',
    expectedMessage: 'Your account is inactive. Please contact an administrator.'
  },
  
  unassignedProjectAccess: {
    userRole: 'FREELANCER',
    action: 'access_project',
    error: 'User not assigned to project',
    expectedBehavior: 'deny_access',
    expectedMessage: 'You do not have access to this project'
  }
};

// Component error scenarios
export const componentErrorScenarios = {
  renderError: {
    component: 'CountdownTimer',
    error: 'Component failed to render',
    expectedBehavior: 'show_error_boundary',
    expectedMessage: 'Timer component failed to load'
  },
  
  propValidationError: {
    component: 'EnhancedTimerDisplay',
    error: 'Invalid props provided',
    expectedBehavior: 'show_fallback',
    expectedMessage: 'Timer display unavailable'
  },
  
  hookError: {
    component: 'StopTimerModal',
    error: 'Hook returned invalid data',
    expectedBehavior: 'disable_functionality',
    expectedMessage: 'Unable to save timer data'
  },
  
  stateUpdateError: {
    component: 'CountdownTimer',
    error: 'State update failed',
    expectedBehavior: 'retry_update',
    expectedMessage: 'Failed to update timer state'
  }
};

// File operation error scenarios
export const fileErrorScenarios = {
  uploadFailed: {
    operation: 'upload',
    error: 'File upload failed',
    expectedBehavior: 'show_retry',
    expectedMessage: 'Failed to upload file. Please try again.'
  },
  
  previewGenerationFailed: {
    operation: 'preview',
    error: 'Could not generate file preview',
    expectedBehavior: 'show_filename',
    expectedMessage: 'Preview not available'
  },
  
  fileReaderError: {
    operation: 'read',
    error: 'FileReader API failed',
    expectedBehavior: 'fallback_behavior',
    expectedMessage: 'Could not read file'
  },
  
  storageQuotaExceeded: {
    operation: 'store',
    error: 'Storage quota exceeded',
    expectedBehavior: 'show_quota_error',
    expectedMessage: 'Storage space full. Please free up space.'
  }
};

// Synchronization error scenarios
export const syncErrorScenarios = {
  conflictResolution: {
    type: 'conflict',
    description: 'Multiple devices updating same timer',
    expectedBehavior: 'show_conflict_dialog',
    expectedMessage: 'Timer conflict detected. Choose which version to keep.'
  },
  
  staleData: {
    type: 'stale_data',
    description: 'Local data is outdated',
    expectedBehavior: 'refresh_data',
    expectedMessage: 'Data has been updated. Refreshing...'
  },
  
  syncQueueFull: {
    type: 'queue_full',
    description: 'Too many pending sync operations',
    expectedBehavior: 'prioritize_operations',
    expectedMessage: 'Sync queue is full. Some operations may be delayed.'
  },
  
  heartbeatFailed: {
    type: 'heartbeat_failed',
    description: 'Failed to maintain connection heartbeat',
    expectedBehavior: 'reconnect',
    expectedMessage: 'Connection lost. Attempting to reconnect...'
  }
};

// Edge case error scenarios
export const edgeCaseErrorScenarios = {
  memoryLeak: {
    type: 'memory',
    description: 'Memory usage exceeding limits',
    expectedBehavior: 'cleanup_resources',
    expectedMessage: 'Performance optimization in progress...'
  },
  
  browserCompatibility: {
    type: 'compatibility',
    description: 'Browser feature not supported',
    expectedBehavior: 'show_compatibility_warning',
    expectedMessage: 'Some features may not work in this browser'
  },
  
  timezoneMismatch: {
    type: 'timezone',
    description: 'Timezone synchronization issue',
    expectedBehavior: 'use_utc_fallback',
    expectedMessage: 'Time display may be affected by timezone settings'
  },
  
  clockSkew: {
    type: 'clock_skew',
    description: 'System clock is significantly off',
    expectedBehavior: 'sync_with_server',
    expectedMessage: 'System time appears incorrect. Syncing with server...'
  }
};

// Error recovery scenarios
export const errorRecoveryScenarios = {
  automaticRetry: {
    strategy: 'exponential_backoff',
    maxRetries: 3,
    baseDelay: 1000,
    description: 'Automatic retry with increasing delays'
  },
  
  manualRetry: {
    strategy: 'user_initiated',
    maxRetries: null,
    baseDelay: 0,
    description: 'User must manually retry the operation'
  },
  
  fallbackMode: {
    strategy: 'degraded_functionality',
    maxRetries: 0,
    baseDelay: 0,
    description: 'Continue with limited functionality'
  },
  
  errorBoundary: {
    strategy: 'component_isolation',
    maxRetries: 0,
    baseDelay: 0,
    description: 'Isolate error to prevent app crash'
  }
};

// Complete error test scenarios for comprehensive testing
export const completeErrorScenarios = [
  // Firebase errors with timer operations
  {
    name: 'Timer start with authentication error',
    errorType: 'firebase',
    operation: 'start_timer',
    error: firebaseErrorScenarios.authenticationError,
    expectedRecovery: errorRecoveryScenarios.manualRetry,
    expectedUserExperience: 'redirect_to_login'
  },
  
  // Network errors with sync
  {
    name: 'Timer sync with network failure',
    errorType: 'network',
    operation: 'sync_timer',
    error: networkErrorScenarios.connectionLost,
    expectedRecovery: errorRecoveryScenarios.automaticRetry,
    expectedUserExperience: 'offline_mode'
  },
  
  // Validation errors with form submission
  {
    name: 'Stop timer with invalid file',
    errorType: 'validation',
    operation: 'stop_timer',
    error: validationErrorScenarios.invalidFileType,
    expectedRecovery: errorRecoveryScenarios.manualRetry,
    expectedUserExperience: 'show_validation_error'
  },
  
  // Access control errors
  {
    name: 'Client accessing timer',
    errorType: 'access',
    operation: 'access_timer',
    error: accessErrorScenarios.clientAccessTimer,
    expectedRecovery: errorRecoveryScenarios.fallbackMode,
    expectedUserExperience: 'hide_timer_completely'
  },
  
  // Component errors with fallback
  {
    name: 'Timer component render failure',
    errorType: 'component',
    operation: 'render_timer',
    error: componentErrorScenarios.renderError,
    expectedRecovery: errorRecoveryScenarios.errorBoundary,
    expectedUserExperience: 'show_error_boundary'
  }
];

export default {
  firebaseErrorScenarios,
  timerErrorScenarios,
  contextErrorScenarios,
  validationErrorScenarios,
  networkErrorScenarios,
  accessErrorScenarios,
  componentErrorScenarios,
  fileErrorScenarios,
  syncErrorScenarios,
  edgeCaseErrorScenarios,
  errorRecoveryScenarios,
  completeErrorScenarios
};