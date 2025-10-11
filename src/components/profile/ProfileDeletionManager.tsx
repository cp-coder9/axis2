import React, { useState } from 'react'
import { User, UserRole, AuditAction } from '@/types'
import { useAppContext } from '@/contexts/AppContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Download, UserX, AlertTriangle, Shield } from 'lucide-react'
import { toast } from 'sonner'
import {
  checkProfileDeletionPermissions,
  generateUserDataExport,
  downloadUserDataExport,
  deactivateUserProfile,
  deleteUserProfile,
  logProfileAction
} from '../../services/profileManagementService'

interface ProfileDeletionManagerProps {
  targetUser: User
  currentUser: User
  onProfileDeleted?: (userId: string) => void
  onProfileDeactivated?: (userId: string) => void
  onDataExported?: (userId: string, data: any) => void
}

export function ProfileDeletionManager({
  targetUser,
  currentUser,
  onProfileDeleted,
  onProfileDeactivated,
  onDataExported
}: ProfileDeletionManagerProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [deactivationReason, setDeactivationReason] = useState('')

  // Check permissions using the service
  const permissions = checkProfileDeletionPermissions(targetUser, currentUser)
  const canDeleteProfile = permissions.canDelete
  const canDeactivateProfile = permissions.canDeactivate
  
  // Handle user data export
  const handleDataExport = async () => {
    try {
      setIsExporting(true)
      
      const userData = await generateUserDataExport(targetUser, currentUser)
      downloadUserDataExport(userData, targetUser)
      
      toast.success('User data exported successfully')
      onDataExported?.(targetUser.id, userData)
    } catch (error) {
      console.error('Error exporting user data:', error)
      toast.error('Failed to export user data')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle profile deletion (admin only)
  const handleProfileDeletion = async () => {
    if (!canDeleteProfile) {
      toast.error('Only administrators can delete profiles')
      return
    }

    try {
      setIsDeleting(true)

      // Delete the user using the service (includes GDPR export)
      await deleteUserProfile(targetUser, currentUser, deletionReason, true)

      toast.success(`Profile for ${targetUser.name} has been permanently deleted`)
      onProfileDeleted?.(targetUser.id)
    } catch (error) {
      console.error('Error deleting profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete profile')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle profile deactivation (for freelancers and clients)
  const handleProfileDeactivation = async () => {
    if (!canDeactivateProfile) {
      toast.error('Cannot deactivate this profile')
      return
    }

    try {
      setIsDeactivating(true)

      await deactivateUserProfile(targetUser, currentUser, deactivationReason)

      toast.success(`Profile for ${targetUser.name} has been deactivated`)
      onProfileDeactivated?.(targetUser.id)
    } catch (error) {
      console.error('Error deactivating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate profile')
    } finally {
      setIsDeactivating(false)
    }
  }

  if (!canDeleteProfile) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Profile Management Restricted
          </CardTitle>
          <CardDescription>
            Only administrators can manage profile deletion and deactivation.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Profile Management
            <Badge variant={targetUser.role === UserRole.ADMIN ? 'destructive' : 'secondary'}>
              {targetUser.role}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage profile deletion, deactivation, and data export for {targetUser.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GDPR Data Export */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">Export User Data</h4>
              <p className="text-sm text-muted-foreground">
                Download all user data for GDPR compliance
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDataExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          <Separator />

          {/* Profile Deactivation (for Freelancers and Clients) */}
          {canDeactivateProfile && (
            <div className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <div className="space-y-1">
                <h4 className="font-medium flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Deactivate Profile
                </h4>
                <p className="text-sm text-muted-foreground">
                  Deactivate this {targetUser.role.toLowerCase()} profile (recommended for non-admin users)
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isDeactivating}>
                    <UserX className="h-4 w-4 mr-2" />
                    {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate Profile</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will deactivate {targetUser.name}'s profile. They will no longer be able to log in,
                      but their data will be preserved. This action can be reversed by an administrator.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="deactivation-reason">Reason for deactivation (optional)</Label>
                      <Textarea
                        id="deactivation-reason"
                        placeholder="Enter reason for deactivating this profile..."
                        value={deactivationReason}
                        onChange={(e) => setDeactivationReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleProfileDeactivation}>
                      Deactivate Profile
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Profile Deletion (Admin Only) */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <div className="space-y-1">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Permanent Deletion
              </h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this profile and all associated data (Admin only)
              </p>
              {targetUser.role === UserRole.ADMIN && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Warning: Admin profiles can be permanently deleted
                </p>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Profile'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">
                    Permanently Delete Profile
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      This will permanently delete {targetUser.name}'s profile and all associated data.
                      This action cannot be undone.
                    </p>
                    <p className="font-medium">
                      User data will be automatically exported for GDPR compliance before deletion.
                    </p>
                    {canDeactivateProfile && (
                      <p className="text-orange-600 dark:text-orange-400">
                        Recommendation: Consider deactivating instead of deleting for {targetUser.role.toLowerCase()} accounts.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deletion-reason">Reason for deletion (required)</Label>
                    <Textarea
                      id="deletion-reason"
                      placeholder="Enter reason for permanently deleting this profile..."
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleProfileDeletion}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={!deletionReason.trim()}
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Audit Trail</CardTitle>
          <CardDescription>
            All profile management actions are logged for security and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Profile deletion and deactivation actions are logged</p>
            <p>• GDPR data exports are tracked</p>
            <p>• All actions include timestamp and administrator details</p>
            <p>• Audit logs are retained for compliance purposes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}