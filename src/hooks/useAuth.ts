import { useAppContext, RolePermissions } from '@/contexts/AppContext'
import { UserRole } from '@/types'

/**
 * Custom hook for authentication state and methods
 * Provides easy access to user authentication, role, and permissions
 */
export function useAuth() {
  const {
    authState,
    user,
    userRole,
    permissions,
    login,
    logout,
    refreshUserData,
    hasPermission,
    canAccessRoute,
    getRoleBasedRedirectPath,
  } = useAppContext()

  return {
    // Authentication state
    isAuthenticated: authState.isAuthenticated,
    user,
    userRole,
    permissions,
    loading: authState.loading,
    error: authState.error,

    // Authentication methods
    login,
    logout,
    refreshUserData,

    // Permission methods
    hasPermission,
    canAccessRoute,
    getRoleBasedRedirectPath,

    // Role checks
    isAdmin: userRole === UserRole.ADMIN,
    isFreelancer: userRole === UserRole.FREELANCER,
    isClient: userRole === UserRole.CLIENT,

    // Common permission checks
    canManageUsers: hasPermission('canManageUsers'),
    canViewBilling: hasPermission('canViewBilling'),
    canAccessAllProjects: hasPermission('canAccessAllProjects'),
    canCreateProjects: hasPermission('canCreateProjects'),
    canDeleteProjects: hasPermission('canDeleteProjects'),
    canUploadFiles: hasPermission('canUploadFiles'),
    canDeleteFiles: hasPermission('canDeleteFiles'),
    canViewAnalytics: hasPermission('canViewAnalytics'),
    canAccessAdminSettings: hasPermission('canAccessAdminSettings'),
  }
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleAccess() {
  const { userRole, hasPermission, canAccessRoute } = useAuth()

  const requireRole = (requiredRole: UserRole) => {
    return userRole === requiredRole
  }

  const requireAnyRole = (roles: UserRole[]) => {
    return userRole ? roles.includes(userRole) : false
  }

  const requirePermission = (permission: keyof RolePermissions) => {
    return hasPermission(permission)
  }

  return {
    requireRole,
    requireAnyRole,
    requirePermission,
    canAccessRoute,
  }
}