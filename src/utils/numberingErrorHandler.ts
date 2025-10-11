/**
 * Numbering Error Handler
 * 
 * Comprehensive error handling and recovery mechanisms for the project numbering system.
 * Implements retry logic, fallback mechanisms, timeout handling, and admin notifications.
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Error types for numbering system
export enum NumberingErrorType {
  TRANSACTION_CONFLICT = 'TRANSACTION_CONFLICT',
  COUNTER_UNAVAILABLE = 'COUNTER_UNAVAILABLE',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DUPLICATE_NUMBER = 'DUPLICATE_NUMBER',
  COUNTER_INITIALIZATION_FAILED = 'COUNTER_INITIALIZATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Numbering error interface
export interface NumberingError {
  type: NumberingErrorType;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;
  userMessage: string;
  recoveryAction?: string;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  timeoutMs: 5000
};

/**
 * Custom error class for numbering system errors
 */
export class NumberingSystemError extends Error {
  public readonly errorType: NumberingErrorType;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly recoveryAction?: string;
  public readonly context?: Record<string, any>;

  constructor(error: NumberingError) {
    super(error.message);
    this.name = 'NumberingSystemError';
    this.errorType = error.type;
    this.severity = error.severity;
    this.retryable = error.retryable;
    this.userMessage = error.userMessage;
    this.recoveryAction = error.recoveryAction;
    this.context = error.context;
  }
}

/**
 * Create a numbering error with appropriate metadata
 */
export function createNumberingError(
  type: NumberingErrorType,
  message: string,
  context?: Record<string, any>
): NumberingError {
  const errorConfig = getErrorConfiguration(type);
  
  return {
    type,
    message,
    severity: errorConfig.severity,
    timestamp: new Date(),
    context,
    retryable: errorConfig.retryable,
    userMessage: errorConfig.userMessage,
    recoveryAction: errorConfig.recoveryAction
  };
}

/**
 * Get error configuration based on error type
 */
function getErrorConfiguration(type: NumberingErrorType): {
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: string;
  recoveryAction?: string;
} {
  switch (type) {
    case NumberingErrorType.TRANSACTION_CONFLICT:
      return {
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        userMessage: 'Multiple projects are being created simultaneously. Retrying...',
        recoveryAction: 'The system will automatically retry the operation.'
      };
    
    case NumberingErrorType.COUNTER_UNAVAILABLE:
      return {
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userMessage: 'The numbering service is temporarily unavailable.',
        recoveryAction: 'Your project will be created without a reference number. An admin can assign one later.'
      };
    
    case NumberingErrorType.TRANSACTION_TIMEOUT:
      return {
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userMessage: 'The numbering operation took too long to complete.',
        recoveryAction: 'The system will retry with a shorter timeout.'
      };
    
    case NumberingErrorType.VALIDATION_FAILED:
      return {
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        userMessage: 'The generated reference number failed validation.',
        recoveryAction: 'Please contact an administrator to resolve this issue.'
      };
    
    case NumberingErrorType.DUPLICATE_NUMBER:
      return {
        severity: ErrorSeverity.CRITICAL,
        retryable: true,
        userMessage: 'A duplicate reference number was detected.',
        recoveryAction: 'The system will generate a new number automatically.'
      };
    
    case NumberingErrorType.COUNTER_INITIALIZATION_FAILED:
      return {
        severity: ErrorSeverity.CRITICAL,
        retryable: true,
        userMessage: 'Failed to initialize the numbering counter.',
        recoveryAction: 'Please contact an administrator immediately.'
      };
    
    case NumberingErrorType.UNKNOWN_ERROR:
    default:
      return {
        severity: ErrorSeverity.HIGH,
        retryable: false,
        userMessage: 'An unexpected error occurred in the numbering system.',
        recoveryAction: 'Please contact an administrator for assistance.'
      };
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let delay = retryConfig.initialDelayMs;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      // Wrap the function call with a timeout
      const result = await withTimeout(fn(), retryConfig.timeoutMs);
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (error instanceof NumberingSystemError && !error.retryable) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === retryConfig.maxAttempts) {
        break;
      }

      // Log retry attempt
      console.warn(`Numbering operation failed (attempt ${attempt}/${retryConfig.maxAttempts}):`, error);

      // Wait before retrying with exponential backoff
      await sleep(delay);
      delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
    }
  }

  // All retries exhausted
  throw new NumberingSystemError(
    createNumberingError(
      NumberingErrorType.UNKNOWN_ERROR,
      `Operation failed after ${retryConfig.maxAttempts} attempts: ${lastError?.message}`,
      { lastError: lastError?.message, attempts: retryConfig.maxAttempts }
    )
  );
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        reject(new NumberingSystemError(
          createNumberingError(
            NumberingErrorType.TRANSACTION_TIMEOUT,
            `Operation timed out after ${timeoutMs}ms`,
            { timeoutMs }
          )
        ));
      }, timeoutMs)
    )
  ]);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle Firestore transaction errors
 */
export function handleTransactionError(error: any): NumberingSystemError {
  const errorMessage = error?.message || 'Unknown transaction error';
  
  // Check for specific Firestore error codes
  if (errorMessage.includes('aborted') || errorMessage.includes('conflict')) {
    return new NumberingSystemError(
      createNumberingError(
        NumberingErrorType.TRANSACTION_CONFLICT,
        'Transaction conflict detected',
        { originalError: errorMessage }
      )
    );
  }
  
  if (errorMessage.includes('deadline-exceeded') || errorMessage.includes('timeout')) {
    return new NumberingSystemError(
      createNumberingError(
        NumberingErrorType.TRANSACTION_TIMEOUT,
        'Transaction timeout',
        { originalError: errorMessage }
      )
    );
  }
  
  if (errorMessage.includes('not-found') || errorMessage.includes('unavailable')) {
    return new NumberingSystemError(
      createNumberingError(
        NumberingErrorType.COUNTER_UNAVAILABLE,
        'Counter service unavailable',
        { originalError: errorMessage }
      )
    );
  }
  
  // Unknown error
  return new NumberingSystemError(
    createNumberingError(
      NumberingErrorType.UNKNOWN_ERROR,
      errorMessage,
      { originalError: errorMessage }
    )
  );
}

/**
 * Send admin notification for numbering failures
 */
export async function notifyAdminOfNumberingFailure(
  error: NumberingError,
  projectId?: string,
  userId?: string
): Promise<void> {
  try {
    // Only notify for high severity errors
    if (error.severity !== ErrorSeverity.HIGH && error.severity !== ErrorSeverity.CRITICAL) {
      return;
    }

    const notificationData = {
      type: 'NUMBERING_SYSTEM_ERROR',
      severity: error.severity,
      errorType: error.type,
      message: error.message,
      userMessage: error.userMessage,
      recoveryAction: error.recoveryAction,
      projectId: projectId || null,
      userId: userId || null,
      context: error.context || {},
      timestamp: Timestamp.now(),
      resolved: false,
      createdAt: Timestamp.now()
    };

    // Store in admin notifications collection
    await addDoc(collection(db, 'adminNotifications'), notificationData);
    
    console.error('Admin notification sent for numbering failure:', notificationData);
  } catch (notificationError) {
    // Don't throw if notification fails - just log it
    console.error('Failed to send admin notification:', notificationError);
  }
}

/**
 * Graceful degradation handler - allows project creation to continue without number
 */
export function handleGracefulDegradation(
  error: NumberingSystemError,
  projectId?: string,
  userId?: string
): {
  shouldContinue: boolean;
  warningMessage: string;
} {
  // Log the error
  console.error('Numbering system error - graceful degradation:', error);
  
  // Notify admin
  notifyAdminOfNumberingFailure(
    {
      type: error.errorType,
      message: error.message,
      severity: error.severity,
      timestamp: new Date(),
      context: error.context,
      retryable: error.retryable,
      userMessage: error.userMessage,
      recoveryAction: error.recoveryAction
    },
    projectId,
    userId
  ).catch(console.error);
  
  // Determine if project creation should continue
  const shouldContinue = error.severity !== ErrorSeverity.CRITICAL;
  
  const warningMessage = shouldContinue
    ? `${error.userMessage} Your project has been created successfully, but a reference number could not be assigned. An administrator will assign one shortly.`
    : `${error.userMessage} Project creation has been cancelled. ${error.recoveryAction || 'Please try again later.'}`;
  
  return {
    shouldContinue,
    warningMessage
  };
}

/**
 * Validate error recovery state
 */
export function canRecoverFromError(error: NumberingSystemError): boolean {
  return error.retryable && error.severity !== ErrorSeverity.CRITICAL;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (error instanceof NumberingSystemError) {
    return error.userMessage;
  }
  
  return 'An unexpected error occurred. Please try again or contact support.';
}

/**
 * Log numbering operation for audit trail
 */
export async function logNumberingOperation(
  operation: string,
  success: boolean,
  details: Record<string, any>
): Promise<void> {
  try {
    await addDoc(collection(db, 'numberingAuditLog'), {
      operation,
      success,
      details,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Failed to log numbering operation:', error);
  }
}
