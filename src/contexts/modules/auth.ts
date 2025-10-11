import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { User, UserRole, UserCreationData, Project } from '../../types';
import { shouldHandleSilently, logFirebaseError, withFirebaseRetry } from '../../utils/firebaseErrorHandler';

interface AuthState {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  createUser: (userData: UserCreationData) => Promise<void>;
}

// Permission constants
export type Permission = 
  | 'VIEW_PROJECTS' 
  | 'EDIT_PROJECTS' 
  | 'DELETE_PROJECTS' 
  | 'MANAGE_USERS'
  | 'VIEW_REPORTS'
  | 'DELETE_USERS'
  | 'MANAGE_FILES'
  | 'VIEW_FILES';

/**
 * RBAC helpers (T1.3)
 * These are pure helpers so they can be tree-shaken and unit-tested easily.
 */
export const hasRole = (user: User | null | undefined, roles: UserRole | UserRole[]): boolean => {
  if (!user) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
};

export const isFreelancer = (user: User | null | undefined): boolean => hasRole(user, UserRole.FREELANCER);
export const isAdmin = (user: User | null | undefined): boolean => hasRole(user, UserRole.ADMIN);
export const isClient = (user: User | null | undefined): boolean => hasRole(user, UserRole.CLIENT);

/**
 * Permission checking function
 */
export const hasPermission = (user: User | null | undefined, permission: Permission): boolean => {
  if (!user) return false;
  
  switch (user.role) {
    case UserRole.ADMIN:
      return true; // Admins have all permissions
    
    case UserRole.FREELANCER:
      return [
        'VIEW_PROJECTS',
        'EDIT_PROJECTS', // Can edit assigned projects
        'VIEW_FILES',
        'MANAGE_FILES'
      ].includes(permission);
    
    case UserRole.CLIENT:
      return [
        'VIEW_PROJECTS', // Can view their own projects
        'VIEW_FILES'     // Can view files in their projects
      ].includes(permission);
    
    default:
      return false;
  }
};

/**
 * Project access control functions
 */
export const canAccessProject = (user: User | null | undefined, project: Project): boolean => {
  if (!user) return false;
  
  switch (user.role) {
    case UserRole.ADMIN:
      return true; // Admins can access all projects
    
    case UserRole.CLIENT:
      return project.clientId === user.id; // Clients can only access their own projects
    
    case UserRole.FREELANCER:
      return project.leadArchitectId === user.id || 
             project.assignedTeamIds.includes(user.id); // Freelancers can access assigned projects
    
    default:
      return false;
  }
};

export const canEditProject = (user: User | null | undefined, project: Project): boolean => {
  if (!user) return false;
  
  switch (user.role) {
    case UserRole.ADMIN:
      return true; // Admins can edit all projects
    
    case UserRole.FREELANCER:
      return project.leadArchitectId === user.id || 
             project.assignedTeamIds.includes(user.id); // Freelancers can edit assigned projects
    
    case UserRole.CLIENT:
      return false; // Clients generally cannot edit projects
    
    default:
      return false;
  }
};

export const canDeleteProject = (user: User | null | undefined, _project: Project): boolean => {
  if (!user) return false;
  
  // Only admins can delete projects
  return user.role === UserRole.ADMIN;
};

/**
 * User management permissions
 */
export const canManageUsers = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return user.role === UserRole.ADMIN;
};

export const canViewReports = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return user.role === UserRole.ADMIN;
};

/**
 * File management permissions
 */
export const canManageFiles = (user: User | null | undefined): boolean => {
  if (!user) return false;
  
  // Admins and freelancers can manage files
  return [UserRole.ADMIN, UserRole.FREELANCER].includes(user.role);
};

/**
 * Centralized permission for timer actions:
 * Freelancers can perform timer actions.
 * Admins may be allowed for testing; clients cannot.
 */
export const canFreelancerUseTimer = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (isFreelancer(user)) return true;
  if (isAdmin(user)) return true; // allow admin override in non-prod or testing contexts
  return false; // clients cannot use timer
};

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.warn('🕐 Auth loading timeout reached - checking current user as fallback');
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('🔄 Found current user in fallback, attempting to set minimal state');
          const fallbackUser: User = {
            id: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email || '',
            role: UserRole.FREELANCER, // Default role
            title: '',
            hourlyRate: 0,
            phone: '',
            company: '',
            avatarUrl: '',
            createdAt: Timestamp.now(),
            lastActive: Timestamp.now()
          };
          setUser(fallbackUser);
          
          // Add redirect logic for authenticated users on login/signup pages
          const pathname = window.location.pathname;
          const isOnLoginPage = pathname === '/login' || pathname === '/signup';
          
          if (isOnLoginPage) {
            console.log('✅ [FALLBACK] User authenticated but on login page, redirecting to dashboard...');
            setTimeout(() => {
              console.log('✅ [FALLBACK] Executing redirect to dashboard');
              window.location.href = '/';
            }, 100);
          }
        }
        setLoading(false);
      }
    }, 15000); // Increased to 15 second fallback timeout

    return () => clearTimeout(fallbackTimeout);
  }, [loading]);

  useEffect(() => {
    let authProcessingTimeout: NodeJS.Timeout | null = null;
    
    console.log('🚀 Setting up auth state listener...');
    
    // Use the initialized auth instance to avoid default app timing issues
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('🔄 Auth state changed:', firebaseUser ? firebaseUser.email : 'null');
      
      // Clear any existing timeout
      if (authProcessingTimeout) {
        clearTimeout(authProcessingTimeout);
      }
      
          // Set a timeout to prevent infinite loading
          authProcessingTimeout = setTimeout(() => {
            console.error('🕐 Auth processing timeout - forcing loading to false');
            console.error('🕐 This usually indicates a Firebase connection issue');
            setLoading(false);
          }, 15000); // Increased to 15 second timeout      // Add check for redirect loop detection
      const pathname = window.location.pathname;
      const isOnLoginPage = pathname === '/login' || pathname === '/signup';
      
      if (firebaseUser && isOnLoginPage) {
        console.log('✅ User authenticated but still on login page, checking onboarding status...');
        
        // Check if this is a new CLIENT user who needs onboarding
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'CLIENT' && !userData.onboardingCompleted) {
            console.log('🎯 Redirecting new CLIENT user to onboarding flow...');
            window.location.href = '/client-registration';
            return;
          }
        }
        
        console.log('✅ [AUTH MODULE] Redirecting authenticated user to dashboard...');
        console.log('✅ [AUTH MODULE] Current pathname:', pathname);
        console.log('✅ [AUTH MODULE] Firebase user:', firebaseUser.email);
        
        // Use a small delay to prevent race conditions with LoginPage navigation
        setTimeout(() => {
          console.log('✅ [AUTH MODULE] Executing redirect to dashboard');
          window.location.href = '/';
        }, 100);
        return; // Exit early after redirect to prevent race conditions
      }
      
      try {
        if (firebaseUser) {
          console.log('🔍 Firebase user authenticated:', firebaseUser.email);
          
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Auth timeout')), 10000); // Reduced to 10 second timeout
            });          const authPromise = (async () => {
            try {
              // Fetch user data from Firestore with retry logic and timeout
              let userDoc;
              let retryCount = 0;
              const maxRetries = 3;
              
              while (retryCount < maxRetries) {
                try {
                  // Add timeout to individual Firestore calls
                  const firestoreTimeout = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Firestore timeout')), 5000); // 5 second timeout per call
                  });
                  
                  const firestoreCall = getDoc(doc(db, 'users', firebaseUser.uid));
                  userDoc = await Promise.race([firestoreCall, firestoreTimeout]) as any;
                  break; // Success, exit retry loop
                } catch (firestoreError) {
                  retryCount++;
                  
                  // Use the new error handler
                  if (shouldHandleSilently(firestoreError)) {
                    console.warn(`Firestore access attempt ${retryCount} failed due to permissions, retrying...`);
                  } else {
                    logFirebaseError(firestoreError, `Firestore user fetch attempt ${retryCount}`);
                  }
                  
                  if (retryCount >= maxRetries) {
                    // If all retries failed, create a minimal user instead of throwing
                    console.warn('🔄 All Firestore retries failed, creating minimal user state');
                    userDoc = null;
                    break;
                  }
                  
                  // Wait before retrying (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }
              
              if (userDoc && userDoc.exists()) {
                const userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
                setUser(userData);
                console.log('✅ Existing user loaded:', userData.email, 'Role:', userData.role);
                return;
              }

              // If no userDoc or Firestore failed, create a default user
              console.log('📝 Creating new user document for:', firebaseUser.email);
              // Get intended user role and form data from localStorage
              const intendedUserType = localStorage.getItem('intendedUserType') || sessionStorage.getItem('intendedUserType');
              const signupFormDataStr = localStorage.getItem('signupFormData');
              let userRole = UserRole.FREELANCER;
              let signupFormData = null;
              
              if (signupFormDataStr) {
                try {
                  signupFormData = JSON.parse(signupFormDataStr);
                } catch (error) {
                  console.error('Error parsing signup form data:', error);
                }
              }
              
              if (intendedUserType) {
                console.log('Found intended user role in storage:', intendedUserType);
                
                // Ensure proper case conversion and handle various formats
                const normalizedType = typeof intendedUserType === 'string' ? 
                  intendedUserType.toUpperCase().trim() : String(intendedUserType).toUpperCase().trim();
                  
                switch (normalizedType) {
                  case 'ADMIN':
                  case UserRole.ADMIN:
                    userRole = UserRole.ADMIN;
                    console.log('✅ Setting user role to ADMIN');
                    break;
                  case 'CLIENT':
                  case UserRole.CLIENT:
                    userRole = UserRole.CLIENT;
                    console.log('✅ Setting user role to CLIENT');
                    break;
                  case 'FREELANCER':
                  case UserRole.FREELANCER:
                  default:
                    userRole = UserRole.FREELANCER;
                    console.log('✅ Setting user role to FREELANCER');
                    break;
                }
                
                // Clear the stored data after using it (but keep a backup in sessionStorage temporarily)
                if (!sessionStorage.getItem('intendedUserType')) {
                  sessionStorage.setItem('intendedUserType', intendedUserType);
                }
                localStorage.removeItem('intendedUserType');
                localStorage.removeItem('signupFormData');
              } else {
                console.log('No intended user role found in storage, defaulting to FREELANCER');
                // Set a default in sessionStorage for consistency
                sessionStorage.setItem('intendedUserType', 'FREELANCER');
              }
              
              // Create default user with enhanced client support
              const defaultUser: Omit<User, 'id'> = {
                name: firebaseUser.displayName || 
                      (signupFormData ? `${signupFormData.firstName} ${signupFormData.lastName}` : 'New User'),
                email: firebaseUser.email || '',
                role: userRole,
                title: userRole === UserRole.CLIENT ? 'Client' : '',
                hourlyRate: userRole === UserRole.CLIENT ? 0 : 0,
                phone: signupFormData?.phone || '',
                company: signupFormData?.company || '',
                avatarUrl: '', // Add default empty avatar URL to prevent undefined values
                createdAt: Timestamp.now(),
                lastActive: Timestamp.now(),
                // Client-specific fields
                ...(userRole === UserRole.CLIENT && {
                  onboardingCompleted: false,
                  accountStatus: 'pending_activation'
                })
              };
              
              // Retry user document creation
              await withFirebaseRetry(async () => {
                await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
              }, 3, 1000);
              
              console.log('✅ User document created successfully with role:', userRole);
              
              // If this is a client, create a corresponding client record
              if (userRole === UserRole.CLIENT) {
                const clientData = {
                  id: firebaseUser.uid,
                  name: defaultUser.name,
                  email: defaultUser.email,
                  phone: defaultUser.phone,
                  company: defaultUser.company,
                  createdAt: Timestamp.now(),
                  createdBy: firebaseUser.uid,
                  userId: firebaseUser.uid
                };
                
                try {
                  await setDoc(doc(db, 'clients', firebaseUser.uid), clientData);
                  console.log('✅ Client record created successfully');
                } catch (error) {
                  // Handle client creation errors silently if they're permission-related
                  if (!shouldHandleSilently(error)) {
                    logFirebaseError(error, 'Client record creation');
                  }
                  // Don't fail the entire auth process if client record creation fails
                }
              }
              
              const newUser = { id: firebaseUser.uid, ...defaultUser };
              setUser(newUser);
              console.log('✅ User state set successfully:', newUser.email, 'Role:', newUser.role);
              
        } catch (innerError) {
          // Use the new error handler
          if (!shouldHandleSilently(innerError)) {
            logFirebaseError(innerError, 'Auth process');
          }
          throw innerError;
        }
          })();

          // Race the auth promise against the timeout
          await Promise.race([authPromise, timeoutPromise]);
          
        } else {
          console.log('🚪 User signed out');
          setUser(null);
        }
      } catch (error) {
        // Use the new structured error handling
        if (!shouldHandleSilently(error)) {
          logFirebaseError(error, 'Auth state change');
        }
        
        // If it's a timeout error, try to recover
        if (error instanceof Error && error.message === 'Auth timeout') {
          console.error('🕐 Authentication timed out - this may indicate a network or Firestore issue');
          
          // Try to get the current Firebase user and set a minimal user state
          if (firebaseUser) {
            console.log('🔄 Attempting recovery with minimal user state');
            const recoveryUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: UserRole.FREELANCER, // Default role
              title: '',
              hourlyRate: 0,
              phone: '',
              company: '',
              avatarUrl: '',
              createdAt: Timestamp.now(),
              lastActive: Timestamp.now()
            };
            setUser(recoveryUser);
            console.log('✅ Recovery user state set');
          }
        }
        
        if (!firebaseUser) {
          setUser(null);
        }
      } finally {
        // Clear the timeout
        if (authProcessingTimeout) {
          clearTimeout(authProcessingTimeout);
        }
        
        console.log('🏁 Auth state change complete, setting loading to false');
        setLoading(false);
      }
    });

    // Initial check - if auth is already ready, trigger the listener manually
    if (auth.currentUser) {
      console.log('🔍 Auth already has current user:', auth.currentUser.email);
      // If we already have a current user, try to process them immediately
      setTimeout(() => {
        if (loading && auth.currentUser) {
          console.log('🔄 Processing existing current user immediately');
          // This will trigger the onAuthStateChanged listener
        }
      }, 100);
    } else {
      console.log('🔍 No current user in auth');
    }

    return () => {
      console.log('🧹 Cleaning up auth listener');
      // Clean up timeout on unmount
      if (authProcessingTimeout) {
        clearTimeout(authProcessingTimeout);
      }
      unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
  await signOut(auth);
      setUser(null);
      // Navigation will be handled at the component level
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const createUser = useCallback(async (userData: UserCreationData) => {
    try {
  const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;
      
      // Save user data to Firestore
      const userToSave: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        title: userData.title || '',
        role: userData.role,
        hourlyRate: 0, // Default value
        phone: '', // Add missing phone property
        company: userData.company || '', // Add missing company property
        avatarUrl: '', // Add default empty avatar URL to prevent undefined values
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now()
      };
      
      if (firebaseUser) {
        await setDoc(doc(db, 'users', firebaseUser.uid), userToSave);
        setUser({ id: firebaseUser.uid, ...userToSave });
      } else {
        throw new Error('Failed to create user: Firebase user is null');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }, []);

  return {
    user,
    loading,
    logout,
    createUser
  };
};