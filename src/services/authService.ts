import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserRole, UserCreationData } from '../types';
import { getUserByEmail } from './userService';

/**
 * Firebase Authentication Service
 * Handles all authentication operations
 */

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add parameters to handle popup issues
  hd: undefined, // Allow any domain
});

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Email sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Create account with email and password
 */
export const createAccountWithEmail = async (userData: UserCreationData) => {
  try {
    // Create Firebase Auth user
    const result = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = result.user;

    // Update Firebase Auth profile
    await updateProfile(firebaseUser, {
      displayName: userData.name
    });

    // Store intended role for user document creation
    localStorage.setItem('intendedUserType', userData.role);

    // Create user document in Firestore (this will be handled by the auth listener)
    return firebaseUser;
  } catch (error: any) {
    console.error('Account creation error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in with Google using popup (with fallback to redirect)
 */
export const signInWithGoogle = async (intendedRole?: UserRole) => {
  try {
    // Store intended role if provided (for new users)
    if (intendedRole) {
      localStorage.setItem('intendedUserType', intendedRole);
    }

    // Try popup first
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (popupError: any) {
      console.warn('Popup failed, this might be due to popup blockers or COOP policy:', popupError);
      
      // If popup fails due to COOP or popup blocker, provide helpful error
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.message?.includes('Cross-Origin-Opener-Policy')) {
        throw new Error('Popup was blocked or closed. Please disable popup blockers and try again, or contact support for alternative sign-in methods.');
      }
      
      // Re-throw other popup errors
      throw popupError;
    }
  } catch (error: any) {
    console.error('Google sign in error:', error);
    
    // Clear intended role on error
    localStorage.removeItem('intendedUserType');
    
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out');
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

/**
 * Convert Firebase Auth error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/api-key-not-valid':
      return 'Firebase configuration error. Please check your API key settings.';
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API key. Please verify your configuration.';
    case 'auth/project-not-found':
      return 'Firebase project not found. Please check your project configuration.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Check if user has completed onboarding
 */
export const checkOnboardingStatus = async (_userId: string): Promise<boolean> => {
  try {
    const user = await getUserByEmail(auth.currentUser?.email || '');
    return user?.onboardingCompleted || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};