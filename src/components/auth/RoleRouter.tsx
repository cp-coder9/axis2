import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface RoleRouterProps {
  children?: React.ReactNode
}

export function RoleRouter({ children }: RoleRouterProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for mock user first (for demo mode)
    const checkMockAuth = () => {
      const mockUserData = localStorage.getItem('mockAuthUser')
      if (mockUserData) {
        try {
          const mockUser = JSON.parse(mockUserData)
          const storedRole = localStorage.getItem('intendedUserType')
          
          if (storedRole) {
            const userRole = storedRole.toUpperCase() as UserRole
            if (Object.values(UserRole).includes(userRole)) {
              // Create a mock user object that looks like Firebase User
              const mockFirebaseUser = {
                uid: mockUser.uid,
                email: mockUser.email,
                displayName: mockUser.displayName,
                photoURL: mockUser.photoURL,
                phoneNumber: mockUser.phoneNumber
              } as User

              setUser(mockFirebaseUser)
              setUserRole(userRole)
              setLoading(false)
              
              console.log('RoleRouter: Mock user detected:', mockUser.email, 'Role:', userRole)
              return true
            }
          }
        } catch (error) {
          console.error('Error parsing mock user data in RoleRouter:', error)
          localStorage.removeItem('mockAuthUser')
        }
      }
      return false
    }

    // Check for mock auth first
    if (checkMockAuth()) {
      return () => {} // No cleanup needed for mock auth
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // Get user role from localStorage (stored during login)
        // In a real implementation, you would fetch this from Firestore
        const storedRole = localStorage.getItem('intendedUserType') || 
                          sessionStorage.getItem('intendedUserType')
        
        if (storedRole) {
          const role = storedRole.toUpperCase() as UserRole
          if (Object.values(UserRole).includes(role)) {
            setUserRole(role)
          } else {
            setUserRole(UserRole.FREELANCER) // Default fallback
          }
        } else {
          // Fetch user role from Firestore based on firebaseUser.uid
          try {
            const { getUserById } = await import('../../services/userService');
            const userData = await getUserById(firebaseUser.uid);
            if (userData?.role) {
              setUserRole(userData.role);
            } else {
              setUserRole(UserRole.FREELANCER); // Default fallback
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setUserRole(UserRole.FREELANCER); // Default fallback on error
          }
        }
      } else {
        setUserRole(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect based on user role
  if (userRole) {
    switch (userRole) {
      case UserRole.ADMIN:
        return <Navigate to="/admin/dashboard" replace />
      case UserRole.FREELANCER:
        return <Navigate to="/freelancer/dashboard" replace />
      case UserRole.CLIENT:
        return <Navigate to="/client/dashboard" replace />
      default:
        return <Navigate to="/dashboard" replace />
    }
  }

  // Fallback: render children or redirect to default dashboard
  return children ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// Hook to get current user role
export function useUserRole() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        const storedRole = localStorage.getItem('intendedUserType') || 
                          sessionStorage.getItem('intendedUserType')
        
        if (storedRole) {
          const role = storedRole.toUpperCase() as UserRole
          if (Object.values(UserRole).includes(role)) {
            setUserRole(role)
          } else {
            setUserRole(UserRole.FREELANCER)
          }
        } else {
          setUserRole(UserRole.FREELANCER)
        }
      } else {
        setUserRole(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, userRole, loading }
}