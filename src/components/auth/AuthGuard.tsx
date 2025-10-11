import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  fallbackPath?: string
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  allowedRoles, 
  fallbackPath = '/login' 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
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
          // TODO: Fetch user role from Firestore based on firebaseUser.uid
          // For now, default to FREELANCER
          setUserRole(UserRole.FREELANCER)
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
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check role-based access if required
  if (requiredRole && userRole !== requiredRole) {
    console.warn(`Access denied: Required role ${requiredRole}, user has ${userRole}`)
    return <Navigate to="/unauthorized" replace />
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    console.warn(`Access denied: User role ${userRole} not in allowed roles`, allowedRoles)
    return <Navigate to="/unauthorized" replace />
  }

  // User is authenticated and authorized
  return <>{children}</>
}

// Higher-order component for easier usage
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...guardProps}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}