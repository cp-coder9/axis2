import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Users,
  Eye,
  Download,
  Share2,
  Trash2,
  GitBranch,
  MessageSquare,
  Lock,
  Unlock,
  AlertCircle,
  Info
} from 'lucide-react';
import { FilePermissions, FilePermissionLevel, UserRole, User } from '@/types';

// File permissions schema
const filePermissionsSchema = z.object({
  level: z.nativeEnum(FilePermissionLevel),
  allowDownload: z.boolean(),
  allowShare: z.boolean(),
  allowDelete: z.boolean(),
  allowVersioning: z.boolean(),
  allowComments: z.boolean(),
  specificUsers: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
});

type FilePermissionsFormData = z.infer<typeof filePermissionsSchema>;

interface FilePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: FilePermissions) => Promise<void>;
  currentPermissions: FilePermissions;
  fileName: string;
  fileId: string;
  projectUsers?: User[];
  currentUserRole: UserRole;
  isOwner: boolean;
}

const PERMISSION_LEVEL_INFO = {
  [FilePermissionLevel.ADMIN_ONLY]: {
    icon: <Lock className="h-4 w-4" />,
    label: 'Admin Only',
    description: 'Only administrators can access this file',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  [FilePermissionLevel.PROJECT_TEAM]: {
    icon: <Users className="h-4 w-4" />,
    label: 'Project Team',
    description: 'All project team members can access this file',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  [FilePermissionLevel.CLIENT_VISIBLE]: {
    icon: <Eye className="h-4 w-4" />,
    label: 'Client Visible',
    description: 'Project team and clients can access this file',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
};

const PERMISSION_ACTIONS = [
  {
    key: 'allowDownload' as const,
    icon: <Download className="h-4 w-4" />,
    label: 'Download',
    description: 'Allow users to download the file',
  },
  {
    key: 'allowShare' as const,
    icon: <Share2 className="h-4 w-4" />,
    label: 'Share',
    description: 'Allow users to share the file with others',
  },
  {
    key: 'allowDelete' as const,
    icon: <Trash2 className="h-4 w-4" />,
    label: 'Delete',
    description: 'Allow users to delete the file',
  },
  {
    key: 'allowVersioning' as const,
    icon: <GitBranch className="h-4 w-4" />,
    label: 'Versioning',
    description: 'Allow users to upload new versions',
  },
  {
    key: 'allowComments' as const,
    icon: <MessageSquare className="h-4 w-4" />,
    label: 'Comments',
    description: 'Allow users to add comments to the file',
  },
];

export const FilePermissionsModal: React.FC<FilePermissionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPermissions,
  fileName,
  fileId,
  projectUsers = [],
  currentUserRole,
  isOwner,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FilePermissionsFormData>({
    resolver: zodResolver(filePermissionsSchema),
    defaultValues: {
      level: currentPermissions.level,
      allowDownload: currentPermissions.allowDownload,
      allowShare: currentPermissions.allowShare,
      allowDelete: currentPermissions.allowDelete,
      allowVersioning: currentPermissions.allowVersioning,
      allowComments: currentPermissions.allowComments,
      specificUsers: [],
      expiresAt: '',
    },
  });

  const watchedLevel = form.watch('level');

  // Reset form when permissions change
  useEffect(() => {
    form.reset({
      level: currentPermissions.level,
      allowDownload: currentPermissions.allowDownload,
      allowShare: currentPermissions.allowShare,
      allowDelete: currentPermissions.allowDelete,
      allowVersioning: currentPermissions.allowVersioning,
      allowComments: currentPermissions.allowComments,
      specificUsers: [],
      expiresAt: '',
    });
  }, [currentPermissions, form]);

  // Check if user can modify permissions
  const canModifyPermissions = isOwner || currentUserRole === UserRole.ADMIN;

  const handleSave = async (data: FilePermissionsFormData) => {
    if (!canModifyPermissions) {
      setError('You do not have permission to modify file permissions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permissions: FilePermissions = {
        level: data.level,
        allowDownload: data.allowDownload,
        allowShare: data.allowShare,
        allowDelete: data.allowDelete,
        allowVersioning: data.allowVersioning,
        allowComments: data.allowComments,
      };

      await onSave(permissions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const getRestrictedActions = (level: FilePermissionLevel): string[] => {
    const restrictions: string[] = [];
    
    switch (level) {
      case FilePermissionLevel.ADMIN_ONLY:
        restrictions.push('Only administrators can access this file');
        break;
      case FilePermissionLevel.PROJECT_TEAM:
        restrictions.push('Clients cannot access this file');
        break;
      case FilePermissionLevel.CLIENT_VISIBLE:
        // No restrictions for client visible
        break;
    }

    return restrictions;
  };

  const levelInfo = PERMISSION_LEVEL_INFO[watchedLevel];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            File Permissions
          </DialogTitle>
          <DialogDescription>
            Manage access permissions for "{fileName}"
          </DialogDescription>
        </DialogHeader>

        {!canModifyPermissions && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You can view but not modify permissions for this file. Only the file owner or administrators can change permissions.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* Access Level */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Access Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!canModifyPermissions}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PERMISSION_LEVEL_INFO).map(([level, info]) => (
                              <SelectItem key={level} value={level}>
                                <div className="flex items-center gap-2">
                                  {info.icon}
                                  <span>{info.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Level Info */}
                <div className={`p-3 rounded-lg border ${levelInfo.bgColor}`}>
                  <div className="flex items-start gap-2">
                    <div className={levelInfo.color}>
                      {levelInfo.icon}
                    </div>
                    <div>
                      <p className={`font-medium ${levelInfo.color}`}>
                        {levelInfo.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {levelInfo.description}
                      </p>
                      {getRestrictedActions(watchedLevel).map((restriction, index) => (
                        <p key={index} className="text-xs text-muted-foreground mt-1">
                          • {restriction}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Action Permissions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Control what users can do with this file
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PERMISSION_ACTIONS.map((action) => (
                    <FormField
                      key={action.key}
                      control={form.control}
                      name={action.key}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canModifyPermissions}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none flex-1">
                            <div className="flex items-center gap-2">
                              {action.icon}
                              <FormLabel className="font-medium">
                                {action.label}
                              </FormLabel>
                            </div>
                            <FormDescription className="text-xs">
                              {action.description}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Access Level:</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {PERMISSION_LEVEL_INFO[currentPermissions.level].icon}
                      {PERMISSION_LEVEL_INFO[currentPermissions.level].label}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {PERMISSION_ACTIONS.map((action) => (
                      <div key={action.key} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{action.label}:</span>
                        <Badge variant={currentPermissions[action.key] ? 'default' : 'secondary'}>
                          {currentPermissions[action.key] ? 'Allowed' : 'Denied'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Users (if applicable) */}
            {projectUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Access</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Users who can access this file based on current permissions
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {projectUsers
                      .filter(user => {
                        switch (watchedLevel) {
                          case FilePermissionLevel.ADMIN_ONLY:
                            return user.role === UserRole.ADMIN;
                          case FilePermissionLevel.PROJECT_TEAM:
                            return user.role !== UserRole.CLIENT;
                          case FilePermissionLevel.CLIENT_VISIBLE:
                            return true;
                          default:
                            return false;
                        }
                      })
                      .map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {canModifyPermissions && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Permissions'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};