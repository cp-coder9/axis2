import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Folder, 
  Lock, 
  Unlock, 
  Users, 
  Shield, 
  Eye, 
  Download,
  Trash2,
  Info
} from 'lucide-react';
import { UserRole, FileCategory } from '@/types';
import { cloudinaryManagementService } from '@/services/cloudinaryManagementService';

interface FolderAccessControlProps {
  userRole: UserRole;
  userId: string;
  projectMemberIds?: string[];
  onAccessCheck?: (folderPath: string, hasAccess: boolean) => void;
}

interface FolderInfo {
  path: string;
  name: string;
  category: FileCategory;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FOLDER_STRUCTURE: Record<UserRole, FolderInfo[]> = {
  [UserRole.ADMIN]: [
    {
      path: 'admin/system',
      name: 'System Files',
      category: FileCategory.SYSTEM,
      description: 'System configuration and administrative files',
      icon: Shield
    },
    {
      path: 'admin/backups',
      name: 'Backups',
      category: FileCategory.SYSTEM,
      description: 'System backups and data exports',
      icon: Shield
    },
    {
      path: 'projects/*',
      name: 'All Projects',
      category: FileCategory.DOCUMENTS,
      description: 'Access to all project folders and files',
      icon: Folder
    },
    {
      path: 'users/*',
      name: 'All Users',
      category: FileCategory.PROFILE,
      description: 'Access to all user folders and profiles',
      icon: Users
    }
  ],
  [UserRole.FREELANCER]: [
    {
      path: 'projects/assigned',
      name: 'Assigned Projects',
      category: FileCategory.DOCUMENTS,
      description: 'Projects you are assigned to work on',
      icon: Folder
    },
    {
      path: 'users/own',
      name: 'Personal Files',
      category: FileCategory.DOCUMENTS,
      description: 'Your personal documents and files',
      icon: Folder
    },
    {
      path: 'substantiation',
      name: 'Work Evidence',
      category: FileCategory.SUBSTANTIATION,
      description: 'Proof of work and time log substantiation',
      icon: Eye
    }
  ],
  [UserRole.CLIENT]: [
    {
      path: 'projects/own',
      name: 'My Projects',
      category: FileCategory.DOCUMENTS,
      description: 'Projects you own or are involved in',
      icon: Folder
    },
    {
      path: 'users/own',
      name: 'Personal Files',
      category: FileCategory.DOCUMENTS,
      description: 'Your personal documents and requirements',
      icon: Folder
    }
  ]
};

export const FolderAccessControl: React.FC<FolderAccessControlProps> = ({
  userRole,
  userId,
  projectMemberIds = [],
  onAccessCheck
}) => {
  const [accessResults, setAccessResults] = React.useState<Record<string, any>>({});

  const checkFolderAccess = React.useCallback((folderPath: string) => {
    const access = cloudinaryManagementService.checkFolderAccess(
      folderPath,
      userRole,
      userId,
      projectMemberIds
    );

    setAccessResults(prev => ({
      ...prev,
      [folderPath]: access
    }));

    onAccessCheck?.(folderPath, access.hasAccess);
    return access;
  }, [userRole, userId, projectMemberIds, onAccessCheck]);

  const folders = FOLDER_STRUCTURE[userRole] || [];

  const getAccessBadge = (access: any) => {
    if (!access) return null;

    if (!access.hasAccess) {
      return <Badge variant="destructive" className="ml-2">No Access</Badge>;
    }

    const permissions = [];
    if (access.permissions.read) permissions.push('Read');
    if (access.permissions.write) permissions.push('Write');
    if (access.permissions.delete) permissions.push('Delete');

    return (
      <Badge variant="secondary" className="ml-2">
        {permissions.join(', ')}
      </Badge>
    );
  };

  const getPermissionIcons = (access: any) => {
    if (!access?.hasAccess) return null;

    return (
      <div className="flex gap-1 ml-2">
        {access.permissions.read && (
          <Eye className="h-4 w-4 text-blue-500" />
        )}
        {access.permissions.write && (
          <Download className="h-4 w-4 text-green-500" />
        )}
        {access.permissions.delete && (
          <Trash2 className="h-4 w-4 text-red-500" />
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Folder Access Control
          <Badge variant="outline">{userRole}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your role determines which folders you can access and what actions you can perform.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {folders.map((folder) => {
            const access = accessResults[folder.path];
            const IconComponent = folder.icon;

            return (
              <div
                key={folder.path}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{folder.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {folder.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Path: {folder.path}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getPermissionIcons(access)}
                  {getAccessBadge(access)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkFolderAccess(folder.path)}
                  >
                    Check Access
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(accessResults).length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Access Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(accessResults).filter((a: any) => a.hasAccess).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Accessible Folders</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.values(accessResults).filter((a: any) => a.permissions?.write).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Upload Permissions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(accessResults).filter((a: any) => a.permissions?.delete).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Delete Permissions</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FolderAccessControl;