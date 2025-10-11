import React from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Edit, 
  Trash2, 
  Download, 
  UserX, 
  Eye, 
  Settings,
  Lock,
  Unlock
} from 'lucide-react'

interface ProfilePermissions {
  canEditProfile: boolean
  canDeleteProfile: boolean
  canDeactivateProfile: boolean
  canExportData: boolean
  canViewAuditLog: boolean
  canChangeRole: boolean
  canManageNotifications: boolean
  canAccessSettings: boolean
}

interface ProfilePermissionsManagerProps {
  targetUser: User
  currentUser: User
}

export function ProfilePermissionsManager({ targetUser, currentUser }: ProfilePermissionsManagerProps) {
  
  // Calculate permissions based on roles
  const getProfilePermissions = (target: User, current: User): ProfilePermissions => {
    const isAdmin = current.role === UserRole.ADMIN
    const isSelfProfile = target.id === current.id
    const isTargetAdmin = target.role === UserRole.ADMIN
    
    return {
      // Profile editing permissions
      canEditProfile: isSelfProfile || isAdmin,
      
      // Deletion permissions (admin only, with restrictions)
      canDeleteProfile: isAdmin,
      
      // Deactivation permissions (admin only for non-admin users)
      canDeactivateProfile: isAdmin && !isTargetAdmin,
      
      // Data export (GDPR compliance - admin or self)
      canExportData: isAdmin || isSelfProfile,
      
      // Audit log viewing (admin only)
      canViewAuditLog: isAdmin,
      
      // Role changes (admin only, cannot change own role)
      canChangeRole: isAdmin && !isSelfProfile,
      
      // Notification management (self or admin)
      canManageNotifications: isSelfProfile || isAdmin,
      
      // Settings access (self or admin)
      canAccessSettings: isSelfProfile || isAdmin
    }
  }

  const permissions = getProfilePermissions(targetUser, currentUser)

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Unlock className="h-4 w-4 text-green-600" />
    ) : (
      <Lock className="h-4 w-4 text-red-600" />
    )
  }

  const getPermissionBadge = (hasPermission: boolean) => {
    return (
      <Badge variant={hasPermission ? 'default' : 'secondary'}>
        {hasPermission ? 'Allowed' : 'Restricted'}
      </Badge>
    )
  }

  const permissionItems = [
    {
      key: 'canEditProfile',
      label: 'Edit Profile',
      description: 'Modify profile information, avatar, and basic settings',
      icon: <Edit className="h-4 w-4" />,
      permission: permissions.canEditProfile,
      reason: permissions.canEditProfile 
        ? 'Users can edit their own profile, admins can edit any profile'
        : 'Only profile owner or admin can edit profile information'
    },
    {
      key: 'canDeleteProfile',
      label: 'Delete Profile',
      description: 'Permanently remove profile and all associated data',
      icon: <Trash2 className="h-4 w-4" />,
      permission: permissions.canDeleteProfile,
      reason: permissions.canDeleteProfile
        ? 'Administrators can delete any profile with proper audit trail'
        : 'Only administrators can delete profiles'
    },
    {
      key: 'canDeactivateProfile',
      label: 'Deactivate Profile',
      description: 'Temporarily disable profile access (reversible)',
      icon: <UserX className="h-4 w-4" />,
      permission: permissions.canDeactivateProfile,
      reason: permissions.canDeactivateProfile
        ? 'Administrators can deactivate non-admin profiles'
        : 'Cannot deactivate admin profiles or requires admin privileges'
    },
    {
      key: 'canExportData',
      label: 'Export Data',
      description: 'Download personal data for GDPR compliance',
      icon: <Download className="h-4 w-4" />,
      permission: permissions.canExportData,
      reason: permissions.canExportData
        ? 'Users can export their own data, admins can export any user data'
        : 'Data export restricted to profile owner or administrator'
    },
    {
      key: 'canViewAuditLog',
      label: 'View Audit Log',
      description: 'Access profile management and security audit logs',
      icon: <Eye className="h-4 w-4" />,
      permission: permissions.canViewAuditLog,
      reason: permissions.canViewAuditLog
        ? 'Administrators can view audit logs for security monitoring'
        : 'Audit log access restricted to administrators only'
    },
    {
      key: 'canChangeRole',
      label: 'Change Role',
      description: 'Modify user role and associated permissions',
      icon: <Shield className="h-4 w-4" />,
      permission: permissions.canChangeRole,
      reason: permissions.canChangeRole
        ? 'Administrators can change user roles (except their own)'
        : 'Role changes restricted to administrators, cannot change own role'
    },
    {
      key: 'canManageNotifications',
      label: 'Manage Notifications',
      description: 'Configure notification preferences and settings',
      icon: <Settings className="h-4 w-4" />,
      permission: permissions.canManageNotifications,
      reason: permissions.canManageNotifications
        ? 'Users can manage their own notifications, admins can manage any'
        : 'Notification management restricted to profile owner or admin'
    },
    {
      key: 'canAccessSettings',
      label: 'Access Settings',
      description: 'View and modify profile settings and preferences',
      icon: <Settings className="h-4 w-4" />,
      permission: permissions.canAccessSettings,
      reason: permissions.canAccessSettings
        ? 'Users can access their own settings, admins can access any'
        : 'Settings access restricted to profile owner or administrator'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Permission Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Permissions
          </CardTitle>
          <CardDescription>
            Permission matrix for {targetUser.name} ({targetUser.role})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span>Current User:</span>
              <Badge variant="outline">{currentUser.name} ({currentUser.role})</Badge>
            </div>
            <div className="flex justify-between">
              <span>Target User:</span>
              <Badge variant="outline">{targetUser.name} ({targetUser.role})</Badge>
            </div>
            <div className="flex justify-between">
              <span>Relationship:</span>
              <Badge variant={targetUser.id === currentUser.id ? 'default' : 'secondary'}>
                {targetUser.id === currentUser.id ? 'Self' : 'Other User'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Details</CardTitle>
          <CardDescription>
            Detailed breakdown of available actions and restrictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permissionItems.map((item, index) => (
              <div key={item.key}>
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.icon}
                      {getPermissionIcon(item.permission)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.label}</h4>
                        {getPermissionBadge(item.permission)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                </div>
                {index < permissionItems.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role-Based Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Restrictions</CardTitle>
          <CardDescription>
            Understanding permission restrictions by user role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Badge variant="destructive">ADMIN</Badge>
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Can delete any profile</li>
                  <li>• Can deactivate non-admin users</li>
                  <li>• Can view all audit logs</li>
                  <li>• Cannot change own role</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Badge variant="default">FREELANCER</Badge>
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Cannot delete profile</li>
                  <li>• Can be deactivated by admin</li>
                  <li>• Can export own data</li>
                  <li>• Can edit own profile</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Badge variant="secondary">CLIENT</Badge>
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Cannot delete profile</li>
                  <li>• Can be deactivated by admin</li>
                  <li>• Can export own data</li>
                  <li>• Can edit own profile</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}