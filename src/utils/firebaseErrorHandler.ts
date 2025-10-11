// Firebase error handling utilities
export const shouldHandleSilently = (error: any): boolean => {
  if (!error) return false;
  
  // Handle permission errors silently in development
  const permissionErrors = [
    'permission-denied',
    'missing-permissions',
    'insufficient-permission'
  ];
  
  return permissionErrors.some(code => 
    error.code === code || 
    error.message?.includes(code) ||
    error.message?.includes('permission')
  );
};

export const logFirebaseError = (error: any, context: string): void => {
  console.error(`Firebase Error [${context}]:`, {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
};

export const withFirebaseRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
};