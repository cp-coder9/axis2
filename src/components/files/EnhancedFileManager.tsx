import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Share,
  Trash2,
  Eye,
  MoreHorizontal,
  Upload,
  Shield,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Import unused file management utilities
import {
  fileAuditLogger,
  FileAuditAction,
  AuditSeverity,
  FileAuditEntry
} from '@/utils/fileAuditLogger';
import {
  checkFileAccess,
  filterAccessibleFiles,
  getPermissionSummary,
  validatePermissionChange,
  getDefaultPermissions
} from '@/utils/fileAccessControl';
import { useAppContext } from '@/contexts/AppContext';
import { ProjectFile, FilePermissions, UserRole } from '@/types';

interface EnhancedFileManagerProps {
  projectId?: string;
  showAuditLog?: boolean;
}

/**
 * Enhanced File Manager with Audit Logging and Access Control
 * Integrates unused fileAuditLogger and fileAccessControl utilities
 */
export function EnhancedFileManager({ projectId, showAuditLog = true }: EnhancedFileManagerProps) {
  const { user, projects } = useAppContext();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [auditEntries, setAuditEntries] = useState<FileAuditEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load files and audit data
  useEffect(() => {
    loadFiles();
    if (showAuditLog) {
      loadAuditEntries();
    }
  }, [projectId]);

  const loadFiles = async () => {
    try {
      // Mock file loading - in real app, this would fetch from Firestore
      const mockFiles: ProjectFile[] = [
        {
          id: 'file-1',
          name: 'Project Requirements.pdf',
          size: 2048576,
          type: 'application/pdf',
          uploaderId: 'user-1',
          uploaderName: 'System User',
          uploadedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, toDate: () => new Date(), toMillis: () => Date.now(), isEqual: () => false } as any,
          projectId: projectId || 'project-1',
          category: 'DOCUMENTS' as any,
          permissionLevel: 'CLIENT_VISIBLE' as any,
          uploadedBy: 'user-1',
          permissions: {
            level: 'CLIENT_VISIBLE' as any,
            allowView: true,
            allowEdit: false,
            allowDownload: true,
            allowShare: false,
            allowDelete: false,
            allowVersioning: true,
            allowComments: true
          },
          url: '/files/requirements.pdf',
          thumbnailUrl: '/thumbnails/requirements.jpg'
        },
        {
          id: 'file-2',
          name: 'Design Mockups.zip',
          size: 15728640,
          type: 'application/zip',
          uploaderId: 'user-2',
          uploaderName: 'System User',
          uploadedAt: { seconds: Math.floor((Date.now() - 86400000) / 1000), nanoseconds: 0, toDate: () => new Date(Date.now() - 86400000), toMillis: () => Date.now() - 86400000, isEqual: () => false } as any,
          projectId: projectId || 'project-1',
          category: 'ARCHIVES' as any,
          permissionLevel: 'PROJECT_TEAM' as any,
          uploadedBy: 'user-2',
          permissions: {
            level: 'PROJECT_TEAM' as any,
            allowView: true,
            allowEdit: true,
            allowDownload: true,
            allowShare: true,
            allowDelete: true,
            allowVersioning: true,
            allowComments: true
          },
          url: '/files/mockups.zip'
        }
      ];

      if (user) {
        // Use unused filterAccessibleFiles utility
        const accessibleFiles = filterAccessibleFiles(
          mockFiles,
          user,
          ['user-1', 'user-2'], // Mock project member IDs
          { 'file-1': 'user-1', 'file-2': 'user-2' } // Mock file owner mapping
        );
        setFiles(accessibleFiles);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const loadAuditEntries = () => {
    // Use unused fileAuditLogger to get audit entries
    const entries = fileAuditLogger.queryAuditLogs({
      projectId,
      limit: 50
    });
    setAuditEntries(entries);
  };

  const handleFileAccess = async (file: ProjectFile, accessType: 'VIEW' | 'DOWNLOAD') => {
    if (!user) return;

    // Use unused checkFileAccess utility
    const access = checkFileAccess(file, user, true, file.uploaderId === user.id);

    if ((accessType === 'VIEW' && !access.canView) ||
      (accessType === 'DOWNLOAD' && !access.canDownload)) {

      // Log unauthorized access attempt using unused audit logger
      await fileAuditLogger.logUnauthorizedAccess(
        file.id,
        file.name,
        user.id,
        user.name,
        user.role,
        accessType,
        access.reason || 'Access denied',
        { projectId }
      );

      alert(`Access denied: ${access.reason}`);
      return;
    }

    // Log successful access using unused audit logger
    await fileAuditLogger.logFileAccess(
      file.id,
      file.name,
      user.id,
      user.name,
      user.role,
      accessType,
      true,
      { projectId }
    );

    // Perform the actual access
    if (accessType === 'VIEW') {
      setSelectedFile(file);
    } else if (accessType === 'DOWNLOAD') {
      // Trigger download
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.click();
    }

    // Refresh audit log
    if (showAuditLog) {
      loadAuditEntries();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || !user) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(uploadedFiles)) {
        // Use unused getDefaultPermissions utility
        const defaultPermissions = getDefaultPermissions(user.role, true);

        const newFile: ProjectFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploaderId: user.id,
          uploaderName: user.name,
          uploadedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, toDate: () => new Date(), toMillis: () => Date.now(), isEqual: () => false } as any,
          projectId: projectId || 'default',
          category: 'DOCUMENTS' as any, // Default category for uploaded files
          permissionLevel: defaultPermissions.level,
          uploadedBy: user.id,
          permissions: defaultPermissions,
          url: URL.createObjectURL(file) // Mock URL
        };

        // Log file upload using unused audit logger
        await fileAuditLogger.logEvent(
          FileAuditAction.FILE_UPLOADED,
          newFile.id,
          newFile.name,
          user.id,
          user.name,
          user.role,
          {
            projectId,
            wasAuthorized: true,
            details: {
              fileSize: file.size,
              fileType: file.type,
              uploadMethod: 'manual'
            },
            metadata: {
              fileSize: file.size,
              fileType: file.type
            }
          }
        );

        setFiles(prev => [...prev, newFile]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (showAuditLog) {
        loadAuditEntries();
      }
    }
  };

  const handleFileShare = async (file: ProjectFile, recipients: string[]) => {
    if (!user) return;

    // Log file sharing using unused audit logger
    await fileAuditLogger.logFileShare(
      file.id,
      file.name,
      user.id,
      user.name,
      user.role,
      recipients,
      'USER_SHARE',
      { projectId }
    );

    if (showAuditLog) {
      loadAuditEntries();
    }
  };

  const handlePermissionChange = async (file: ProjectFile, newPermissions: FilePermissions) => {
    if (!user) return;

    // Use unused validatePermissionChange utility
    const validation = validatePermissionChange(
      file.permissions,
      newPermissions,
      user.role,
      file.uploaderId === user.id
    );

    if (!validation.isValid) {
      alert(`Permission change denied: ${validation.errors.join(', ')}`);
      return;
    }

    // Log permission change using unused audit logger
    await fileAuditLogger.logPermissionChange(
      file.id,
      file.name,
      user.id,
      user.name,
      user.role,
      file.permissions,
      newPermissions,
      { projectId }
    );

    // Update file permissions
    setFiles(prev => prev.map(f =>
      f.id === file.id ? { ...f, permissions: newPermissions } : f
    ));

    if (showAuditLog) {
      loadAuditEntries();
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.CRITICAL: return 'destructive';
      case AuditSeverity.HIGH: return 'destructive';
      case AuditSeverity.MEDIUM: return 'secondary';
      case AuditSeverity.LOW: return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Management</h2>
          <p className="text-muted-foreground">
            Secure file storage with comprehensive audit logging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button asChild disabled={isUploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </span>
            </Button>
          </Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <Tabs defaultValue="files" className="w-full">
        <TabsList>
          <TabsTrigger value="files">Files</TabsTrigger>
          {showAuditLog && <TabsTrigger value="audit">Audit Log</TabsTrigger>}
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>
                {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => {
                    const access = user ? checkFileAccess(file, user, true, file.uploaderId === user.id) : null;
                    const permissionSummary = getPermissionSummary(file.permissions);

                    return (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {file.name}
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.type}</Badge>
                        </TableCell>
                        <TableCell>{file.uploadedAt.toDate().toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {permissionSummary.map((summary, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {summary}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {access?.canView && (
                                <DropdownMenuItem onClick={() => handleFileAccess(file, 'VIEW')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                              )}
                              {access?.canDownload && (
                                <DropdownMenuItem onClick={() => handleFileAccess(file, 'DOWNLOAD')}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              {access?.canShare && (
                                <DropdownMenuItem onClick={() => handleFileShare(file, ['user-3'])}>
                                  <Share className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {access?.canDelete && (
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {showAuditLog && (
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  File access and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {entry.timestamp.toDate().toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{entry.fileName}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.userName}</div>
                            <div className="text-xs text-muted-foreground">{entry.userRole}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(entry.severity) as any}>
                            {entry.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.wasAuthorized ? (
                              <Badge variant="default">Authorized</Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Denied
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Management</CardTitle>
              <CardDescription>
                Configure file access permissions and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file) => {
                    const fileSummary = fileAuditLogger.getFileSummary(file.id);

                    return (
                      <Card key={file.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{file.name}</CardTitle>
                          <CardDescription>
                            {getPermissionSummary(file.permissions).join(', ')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Total Events</span>
                              <span className="font-medium">{fileSummary.totalEvents}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Access Count</span>
                              <span className="font-medium">{fileSummary.accessCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Downloads</span>
                              <span className="font-medium">{fileSummary.downloadCount}</span>
                            </div>
                            {fileSummary.unauthorizedAttempts > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Unauthorized Attempts</span>
                                <span className="font-medium">{fileSummary.unauthorizedAttempts}</span>
                              </div>
                            )}
                            {fileSummary.lastAccessed && (
                              <div className="flex justify-between">
                                <span>Last Accessed</span>
                                <span className="font-medium">
                                  {fileSummary.lastAccessed.toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Preview Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.name}</DialogTitle>
              <DialogDescription>
                File preview and details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Size</Label>
                  <p>{formatFileSize(selectedFile.size)}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{selectedFile.type}</p>
                </div>
                <div>
                  <Label>Uploaded</Label>
                  <p>{selectedFile.uploadedAt.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-1">
                    {getPermissionSummary(selectedFile.permissions).map((summary, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {summary}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {selectedFile.thumbnailUrl && (
                <div>
                  <Label>Preview</Label>
                  <img
                    src={selectedFile.thumbnailUrl}
                    alt={selectedFile.name}
                    className="max-w-full h-auto border rounded"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default EnhancedFileManager;