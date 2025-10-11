import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { User, UserRole } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
// Separator import removed as it's not used
import { ProfileDeletionManager } from '../components/profile/ProfileDeletionManager';
import { GDPRComplianceManager } from '../components/profile/GDPRComplianceManager';
import { ProfilePermissionsManager } from '../components/profile/ProfilePermissionsManager';
import { ProfileAuditTrail } from '../components/profile/ProfileAuditTrail';
import { 
  User as UserIcon, 
  Shield, 
  Download, 
  History, 
  Settings,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function ProfilePage() {
  const { user: currentUser, users } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Get target user ID from URL params or use current user
  const targetUserId = searchParams.get('userId') || currentUser?.id;

  useEffect(() => {
    if (targetUserId && currentUser) {
      if (targetUserId === currentUser.id) {
        setTargetUser(currentUser);
      } else {
        // Find target user in users list (admin only)
        const foundUser = users.find(u => u.id === targetUserId);
        if (foundUser && currentUser.role === UserRole.ADMIN) {
          setTargetUser(foundUser);
        } else {
          toast.error('User not found or access denied');
          navigate('/dashboard');
        }
      }
    }
  }, [targetUserId, currentUser, users, navigate]);

  const handleProfileDeleted = (userId: string) => {
    toast.success('Profile has been permanently deleted');
    if (userId === currentUser?.id) {
      // If user deleted their own profile, logout
      navigate('/login');
    } else {
      // Navigate back to user management
      navigate('/admin/users');
    }
  };

  const handleProfileDeactivated = (userId: string) => {
    toast.success('Profile has been deactivated');
    if (userId === currentUser?.id) {
      // If user deactivated their own profile, logout
      navigate('/login');
    } else {
      // Refresh the page or navigate back
      window.location.reload();
    }
  };

  const handleDataExported = (_userId: string, _data: any) => {
    toast.success('User data exported successfully');
  };

  if (!currentUser || !targetUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = targetUser.id === currentUser.id;
  const canManageProfile = currentUser.role === UserRole.ADMIN || isOwnProfile;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isOwnProfile ? 'My Profile' : `${targetUser.name}'s Profile`}
            </h1>
            <p className="text-muted-foreground">
              Manage profile settings, permissions, and data
            </p>
          </div>
        </div>
        <Badge variant={targetUser.role === UserRole.ADMIN ? 'destructive' : 'default'}>
          {targetUser.role}
        </Badge>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Basic profile information and account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{targetUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{targetUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Title:</span>
                <span className="text-sm">{targetUser.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Company:</span>
                <span className="text-sm">{targetUser.company}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline">{targetUser.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={targetUser.accountStatus === 'active' ? 'default' : 'secondary'}>
                  {targetUser.accountStatus || 'Active'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{targetUser.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Hourly Rate:</span>
                <span className="text-sm">
                  {targetUser.role === UserRole.FREELANCER 
                    ? `$${targetUser.hourlyRate}/hr` 
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            GDPR
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {canManageProfile && (
            <ProfileDeletionManager
              targetUser={targetUser}
              currentUser={currentUser}
              onProfileDeleted={handleProfileDeleted}
              onProfileDeactivated={handleProfileDeactivated}
              onDataExported={handleDataExported}
            />
          )}
          
          {!canManageProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>
                  You don't have permission to manage this profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Only administrators can manage other users' profiles. 
                  You can only manage your own profile settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <ProfilePermissionsManager
            targetUser={targetUser}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-6">
          <GDPRComplianceManager
            targetUser={targetUser}
            currentUser={currentUser}
            onDataExported={handleDataExported}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <ProfileAuditTrail
            targetUser={targetUser}
            currentUser={currentUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}