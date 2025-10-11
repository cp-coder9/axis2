import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  FileText,
  Image,
  Archive,
  File,
  Calendar,
  User,
  Shield,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  Clock,
  HardDrive
} from 'lucide-react';
import { ProjectFile, User as UserType, FilePermissions } from '@/types';
import { formatFileSize, formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { checkFileAccess, FileAccessResult } from '@/utils/fileAccessControl';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ProjectFile;
  currentUser: UserType;
  isProjectMember?: boolean;
  isFileOwner?: boolean;
  onDownload?: () => Promise<void>;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  onManagePermissions?: () => void;
  projectUsers?: UserType[];
  comments?: FileComment[];
  onAddComment?: (comment: string) => Promise<void>;
}

interface FileComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

const getFileIcon = (fileType: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-12 w-12'
  };

  if (fileType.startsWith('image/')) {
    return <Image className={`${sizeClasses[size]} text-blue-500`} />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className={`${sizeClasses[size]} text-red-500`} />;
  }
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return <Archive className={`${sizeClasses[size]} text-yellow-500`} />;
  }
  return <File className={`${sizeClasses[size]} text-gray-500`} />;
};

const getFileTypeLabel = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType === 'application/pdf') return 'PDF Document';
  if (fileType.includes('document')) return 'Word Document';
  if (fileType.includes('sheet')) return 'Spreadsheet';
  if (fileType.includes('zip')) return 'Archive';
  return 'File';
};

const FilePreview: React.FC<{ file: ProjectFile; canView: boolean }> = ({ file, canView }) => {
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Preview not available</p>
          <p className="text-xs text-muted-foreground">Insufficient permissions</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Preview failed to load</p>
          <p className="text-xs text-muted-foreground">{previewError}</p>
        </div>
      </div>
    );
  }

  // Image preview
  if (file.type.startsWith('image/')) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg p-4">
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-96 object-contain rounded"
          onError={() => setPreviewError('Failed to load image')}
        />
      </div>
    );
  }

  // PDF preview (using iframe)
  if (file.type === 'application/pdf') {
    return (
      <div className="h-96 bg-muted rounded-lg">
        <iframe
          src={`${file.url}#toolbar=0`}
          className="w-full h-full rounded-lg"
          title={`Preview of ${file.name}`}
          onError={() => setPreviewError('Failed to load PDF')}
        />
      </div>
    );
  }

  // Text file preview (if supported)
  if (file.type.startsWith('text/')) {
    return (
      <div className="h-64 bg-muted rounded-lg p-4">
        <ScrollArea className="h-full">
          <pre className="text-sm whitespace-pre-wrap">
            {/* In a real implementation, you would fetch and display the text content */}
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>Text file preview</p>
              <p className="text-xs">Click download to view full content</p>
            </div>
          </pre>
        </ScrollArea>
      </div>
    );
  }

  // Generic file preview
  return (
    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
      <div className="text-center">
        {getFileIcon(file.type, 'lg')}
        <p className="text-sm font-medium mt-2">{file.name}</p>
        <p className="text-xs text-muted-foreground">{getFileTypeLabel(file.type)}</p>
        <p className="text-xs text-muted-foreground mt-1">Preview not available for this file type</p>
      </div>
    </div>
  );
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  currentUser,
  isProjectMember = false,
  isFileOwner = false,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onManagePermissions,
  projectUsers = [],
  comments = [],
  onAddComment,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  // Check user permissions
  const access: FileAccessResult = checkFileAccess(file, currentUser, isProjectMember, isFileOwner);

  const handleAction = async (action: () => Promise<void> | void) => {
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return;
    
    await handleAction(async () => {
      await onAddComment(newComment.trim());
      setNewComment('');
    });
  };

  const getPermissionBadgeColor = (level: string) => {
    switch (level) {
      case 'ADMIN_ONLY': return 'destructive';
      case 'PROJECT_TEAM': return 'default';
      case 'CLIENT_VISIBLE': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(file.type)}
            {file.name}
          </DialogTitle>
          <DialogDescription>
            {getFileTypeLabel(file.type)} • {formatFileSize(file.size)} • 
            Uploaded {formatRelativeTime(file.uploadedAt.toDate())}
          </DialogDescription>
        </DialogHeader>

        {!access.canView && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {access.reason || 'You do not have permission to view this file.'}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <FilePreview file={file} canView={access.canView} />
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Information */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    File Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{file.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{file.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span>{formatDateTime(file.uploadedAt.toDate())}</span>
                    </div>
                    {file.lastModified && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Modified:</span>
                        <span>{formatDateTime(file.lastModified.toDate())}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upload Information */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Upload Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded by:</span>
                      <span className="font-medium">{file.uploaderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload date:</span>
                      <span>{formatDateTime(file.uploadedAt.toDate())}</span>
                    </div>
                    {file.lastModifiedBy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last modified by:</span>
                        <span>{file.lastModifiedBy}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card className="md:col-span-2">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Permissions & Access
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Access Level:</span>
                      <Badge variant={getPermissionBadgeColor(file.permissions.level)}>
                        {file.permissions.level.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Download:</span>
                        <Badge variant={file.permissions.allowDownload ? 'default' : 'secondary'}>
                          {file.permissions.allowDownload ? 'Allowed' : 'Denied'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Share:</span>
                        <Badge variant={file.permissions.allowShare ? 'default' : 'secondary'}>
                          {file.permissions.allowShare ? 'Allowed' : 'Denied'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Delete:</span>
                        <Badge variant={file.permissions.allowDelete ? 'default' : 'secondary'}>
                          {file.permissions.allowDelete ? 'Allowed' : 'Denied'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Versioning:</span>
                        <Badge variant={file.permissions.allowVersioning ? 'default' : 'secondary'}>
                          {file.permissions.allowVersioning ? 'Allowed' : 'Denied'}
                        </Badge>
                      </div>
                    </div>

                    {/* Your Access */}
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Your Access:</p>
                      <div className="flex flex-wrap gap-2">
                        {access.canView && <Badge variant="outline">View</Badge>}
                        {access.canDownload && <Badge variant="outline">Download</Badge>}
                        {access.canShare && <Badge variant="outline">Share</Badge>}
                        {access.canEdit && <Badge variant="outline">Edit</Badge>}
                        {access.canDelete && <Badge variant="outline">Delete</Badge>}
                        {access.canComment && <Badge variant="outline">Comment</Badge>}
                        {access.canManagePermissions && <Badge variant="outline">Manage Permissions</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {access.canComment && onAddComment && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Add Comment</h4>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment about this file..."
                      className="w-full p-3 border rounded-md resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isLoading}
                        size="sm"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4 mr-2" />
                        )}
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No comments yet</p>
                    <p className="text-sm text-muted-foreground">
                      {access.canComment ? 'Be the first to add a comment!' : 'Comments are not available for this file.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {comment.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                            {comment.updatedAt && comment.updatedAt > comment.createdAt && (
                              <Badge variant="outline" className="text-xs">
                                Edited
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {access.canDownload && onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(onDownload)}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {access.canShare && onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                disabled={isLoading}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
            {access.canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {access.canManagePermissions && onManagePermissions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onManagePermissions}
                disabled={isLoading}
              >
                <Shield className="h-4 w-4 mr-2" />
                Permissions
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {access.canDelete && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction(onDelete)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};