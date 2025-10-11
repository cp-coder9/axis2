/**
 * Dashboard Sharing Panel
 * UI for sharing dashboards with users and managing shared dashboards
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Share2,
  Link2,
  Users,
  Copy,
  Check,
  X,
  Clock,
  Eye,
  Edit,
  Trash2,
  History
} from 'lucide-react';
import {
  shareDashboardWithUsers,
  createPublicShareLink,
  getSharedDashboard,
  removeUserFromSharedDashboard,
  revokePublicShareLink,
  getMySharedDashboards,
  getSharedWithMeDashboards,
  SharedDashboard,
  SharedUser
} from '../../services/dashboardSharingService';

interface DashboardSharingPanelProps {
  dashboardId: string;
  userId: string;
  userName: string;
  isOwner: boolean;
}

export const DashboardSharingPanel: React.FC<DashboardSharingPanelProps> = ({
  dashboardId,
  userId,
  userName,
  isOwner
}) => {
  const [sharedDashboard, setSharedDashboard] = useState<SharedDashboard | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  
  // Share with users form
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'viewer' | 'editor'>('viewer');
  const [allowEditing, setAllowEditing] = useState(false);
  
  // Public link form
  const [linkExpiryDays, setLinkExpiryDays] = useState<number>(7);
  const [linkAllowEditing, setLinkAllowEditing] = useState(false);

  useEffect(() => {
    loadSharedDashboard();
  }, [dashboardId]);

  const loadSharedDashboard = async () => {
    try {
      const dashboard = await getSharedDashboard(dashboardId, userId);
      setSharedDashboard(dashboard);
      if (dashboard?.shareLink) {
        setShareLink(dashboard.shareLink);
      }
    } catch (error) {
      console.error('Error loading shared dashboard:', error);
    }
  };

  const handleShareWithUsers = async () => {
    if (!userEmail) return;

    try {
      // In a real app, you would look up the user by email
      const users = [{
        userId: 'user_' + Date.now(),
        userName: userEmail.split('@')[0],
        userEmail,
        role: userRole
      }];

      await shareDashboardWithUsers(
        dashboardId,
        userId,
        userName,
        users,
        allowEditing
      );

      setUserEmail('');
      setIsShareDialogOpen(false);
      await loadSharedDashboard();
    } catch (error) {
      console.error('Error sharing dashboard:', error);
    }
  };

  const handleCreatePublicLink = async () => {
    try {
      const link = await createPublicShareLink(
        dashboardId,
        userId,
        userName,
        linkExpiryDays,
        linkAllowEditing
      );

      setShareLink(link);
      setIsLinkDialogOpen(false);
      await loadSharedDashboard();
    } catch (error) {
      console.error('Error creating share link:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleRevokeLink = async () => {
    try {
      await revokePublicShareLink(dashboardId, userId);
      setShareLink('');
      await loadSharedDashboard();
    } catch (error) {
      console.error('Error revoking link:', error);
    }
  };

  const handleRemoveUser = async (userIdToRemove: string) => {
    try {
      await removeUserFromSharedDashboard(dashboardId, userId, userIdToRemove);
      await loadSharedDashboard();
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Dashboard Sharing
            </CardTitle>
            <CardDescription>
              Share your dashboard with team members or create a public link
            </CardDescription>
          </div>
          {sharedDashboard && (
            <Badge variant="secondary">
              <Eye className="h-3 w-3 mr-1" />
              {sharedDashboard.accessCount} views
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Share with Users */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Share with Users</h3>
              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Add Users
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Dashboard</DialogTitle>
                    <DialogDescription>
                      Invite users to view or edit your dashboard
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">User Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Permission Level</Label>
                      <Select value={userRole} onValueChange={(v) => setUserRole(v as any)}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                          <SelectItem value="editor">Editor (Can modify)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="allow-editing">Allow Editing</Label>
                      <Switch
                        id="allow-editing"
                        checked={allowEditing}
                        onCheckedChange={setAllowEditing}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleShareWithUsers} disabled={!userEmail}>
                      Share
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Shared Users List */}
            {sharedDashboard && sharedDashboard.sharedWith.length > 0 && (
              <div className="space-y-2">
                {sharedDashboard.sharedWith.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.userName}</p>
                        <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'editor' ? 'default' : 'secondary'}>
                        {user.role === 'editor' ? <Edit className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveUser(user.userId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Public Share Link */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Public Share Link</h3>
              {!shareLink ? (
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Link2 className="h-4 w-4 mr-2" />
                      Create Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Public Share Link</DialogTitle>
                      <DialogDescription>
                        Anyone with this link can view your dashboard
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Link Expiry</Label>
                        <Select 
                          value={linkExpiryDays.toString()} 
                          onValueChange={(v) => setLinkExpiryDays(parseInt(v))}
                        >
                          <SelectTrigger id="expiry">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="0">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="link-editing">Allow Editing</Label>
                        <Switch
                          id="link-editing"
                          checked={linkAllowEditing}
                          onCheckedChange={setLinkAllowEditing}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePublicLink}>
                        Create Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button size="sm" variant="destructive" onClick={handleRevokeLink}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Link
                </Button>
              )}
            </div>

            {shareLink && (
              <Alert>
                <Link2 className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={shareLink} readOnly className="flex-1" />
                    <Button size="sm" onClick={handleCopyLink}>
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  {sharedDashboard?.expiresAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {sharedDashboard.expiresAt.toDate().toLocaleDateString()}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Version History */}
        {sharedDashboard && sharedDashboard.versions.length > 1 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                Version History
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sharedDashboard.versions.slice().reverse().map((version) => (
                  <div
                    key={version.version}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div>
                      <p className="font-medium">Version {version.version}</p>
                      <p className="text-xs text-muted-foreground">
                        {version.changeDescription || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {version.createdByName} • {version.createdAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    {version.version === sharedDashboard.currentVersion && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
