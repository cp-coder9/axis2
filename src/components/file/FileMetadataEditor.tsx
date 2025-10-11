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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
  Button,
  Input,
  Textarea,
  Badge
} from '@/lib/shadcn';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Switch
} from '@/lib/shadcn';
import { 
  Save,
  X,
  Loader2,
  Tag,
  Edit3,
  Shield,
  Info,
  History,
  FileText,
  Calendar,
  User,
  HardDrive,
  Eye,
  Download,
  Share2,
  Trash2,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { ProjectFile, FileCategory, FilePermissionLevel, FilePermissions } from '@/types';
import { formatFileSize, formatDateTime } from '@/utils/formatters';

// File metadata schema
const fileMetadataSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.nativeEnum(FileCategory),
  tags: z.array(z.string()).default([]),
  permissions: z.object({
    level: z.nativeEnum(FilePermissionLevel),
    allowDownload: z.boolean(),
    allowShare: z.boolean(),
    allowDelete: z.boolean(),
    allowVersioning: z.boolean(),
    allowComments: z.boolean(),
  }),
  customMetadata: z.record(z.string(), z.string()).optional(),
});

type FileMetadataFormData = z.infer<typeof fileMetadataSchema>;

interface FileVersion {
  id: string;
  version: number;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  url: string;
  changeDescription?: string;
}

interface FileMetadataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  file: ProjectFile;
  existingTags: string[];
  fileVersions?: FileVersion[];
  onSave: (fileId: string, updates: Partial<ProjectFile>) => Promise<void>;
  onCreateVersion?: (fileId: string, newFile: File, description?: string) => Promise<void>;
  canEdit?: boolean;
  canManagePermissions?: boolean;
}

const getPermissionIcon = (permission: string) => {
  switch (permission) {
    case 'allowDownload': return <Download className="h-4 w-4" />;
    case 'allowShare': return <Share2 className="h-4 w-4" />;
    case 'allowDelete': return <Trash2 className="h-4 w-4" />;
    case 'allowVersioning': return <RefreshCw className="h-4 w-4" />;
    case 'allowComments': return <MessageSquare className="h-4 w-4" />;
    default: return <Shield className="h-4 w-4" />;
  }
};

const getPermissionLabel = (permission: string) => {
  switch (permission) {
    case 'allowDownload': return 'Allow Download';
    case 'allowShare': return 'Allow Sharing';
    case 'allowDelete': return 'Allow Deletion';
    case 'allowVersioning': return 'Allow Versioning';
    case 'allowComments': return 'Allow Comments';
    default: return permission;
  }
};

export const FileMetadataEditor: React.FC<FileMetadataEditorProps> = ({
  isOpen,
  onClose,
  file,
  existingTags,
  fileVersions = [],
  onSave,
  onCreateVersion,
  canEdit = true,
  canManagePermissions = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [customMetadataKey, setCustomMetadataKey] = useState('');
  const [customMetadataValue, setCustomMetadataValue] = useState('');

  const form = useForm<FileMetadataFormData>({
    resolver: zodResolver(fileMetadataSchema),
    defaultValues: {
      name: file.name,
      description: file.description || '',
      category: file.category || FileCategory.OTHER,
      tags: file.tags || [],
      permissions: {
        level: file.permissions?.level || FilePermissionLevel.PROJECT_TEAM,
        allowDownload: file.permissions?.allowDownload ?? true,
        allowShare: file.permissions?.allowShare ?? false,
        allowDelete: file.permissions?.allowDelete ?? false,
        allowVersioning: file.permissions?.allowVersioning ?? true,
        allowComments: file.permissions?.allowComments ?? true,
      },
      customMetadata: file.customMetadata || {},
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: file.name,
        description: file.description || '',
        category: file.category || FileCategory.OTHER,
        tags: file.tags || [],
        permissions: {
          level: file.permissions?.level || FilePermissionLevel.PROJECT_TEAM,
          allowDownload: file.permissions?.allowDownload ?? true,
          allowShare: file.permissions?.allowShare ?? false,
          allowDelete: file.permissions?.allowDelete ?? false,
          allowVersioning: file.permissions?.allowVersioning ?? true,
          allowComments: file.permissions?.allowComments ?? true,
        },
        customMetadata: file.customMetadata || {},
      });
    }
  }, [isOpen, file, form]);

  const handleClose = () => {
    form.reset();
    setNewTag('');
    setCustomMetadataKey('');
    setCustomMetadataValue('');
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addCustomMetadata = () => {
    if (customMetadataKey.trim() && customMetadataValue.trim()) {
      const currentMetadata = form.getValues('customMetadata') || {};
      form.setValue('customMetadata', {
        ...currentMetadata,
        [customMetadataKey.trim()]: customMetadataValue.trim(),
      });
      setCustomMetadataKey('');
      setCustomMetadataValue('');
    }
  };

  const removeCustomMetadata = (key: string) => {
    const currentMetadata = form.getValues('customMetadata') || {};
    const { [key]: removed, ...rest } = currentMetadata;
    form.setValue('customMetadata', rest);
  };

  const onSubmit = async (data: FileMetadataFormData) => {
    if (!canEdit) return;

    try {
      setIsLoading(true);
      const updates: Partial<ProjectFile> = {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        permissions: data.permissions,
        customMetadata: data.customMetadata,
        lastModified: Timestamp.now(),
      };
      };

      await onSave(file.id, updates);
      handleClose();
    } catch (error) {
      console.error('Failed to update file metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit File Metadata
          </DialogTitle>
          <DialogDescription>
            Update file information, permissions, and custom metadata.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Versions ({fileVersions.length})
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="basic" className="space-y-4">
                {/* File Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter file name" disabled={!canEdit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Optional description for this file..."
                          rows={3}
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description to help others understand the file's purpose.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(FileCategory).map(category => (
                            <SelectItem key={category} value={category}>
                              {category.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </FormLabel>
                  
                  {canEdit && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        Add
                      </Button>
                    </div>
                  )}

                  {/* Current tags */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {form.watch('tags').map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          {canEdit && (
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          )}
                        </Badge>
                      ))}
                      {form.watch('tags').length === 0 && (
                        <p className="text-sm text-muted-foreground">No tags added</p>
                      )}
                    </div>
                  </div>

                  {/* Existing tags */}
                  {canEdit && existingTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Available tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {existingTags
                          .filter(tag => !form.watch('tags').includes(tag))
                          .map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => {
                                const currentTags = form.getValues('tags');
                                form.setValue('tags', [...currentTags, tag]);
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                {!canManagePermissions && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      You don't have permission to modify file permissions.
                    </p>
                  </div>
                )}

                {/* Access Level */}
                <FormField
                  control={form.control}
                  name="permissions.level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        disabled={!canManagePermissions}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={FilePermissionLevel.ADMIN_ONLY}>
                            Admin Only
                          </SelectItem>
                          <SelectItem value={FilePermissionLevel.PROJECT_TEAM}>
                            Project Team
                          </SelectItem>
                          <SelectItem value={FilePermissionLevel.CLIENT_VISIBLE}>
                            Client Visible
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Determines who can access this file based on their role.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Individual Permissions */}
                <div className="space-y-4">
                  <h4 className="font-medium">Individual Permissions</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {(['allowDownload', 'allowShare', 'allowDelete', 'allowVersioning', 'allowComments'] as const).map((permission) => (
                      <FormField
                        key={permission}
                        control={form.control}
                        name={`permissions.${permission}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2 text-base">
                                {getPermissionIcon(permission)}
                                {getPermissionLabel(permission)}
                              </FormLabel>
                              <FormDescription>
                                {permission === 'allowDownload' && 'Allow users to download this file'}
                                {permission === 'allowShare' && 'Allow users to share this file with others'}
                                {permission === 'allowDelete' && 'Allow users to delete this file'}
                                {permission === 'allowVersioning' && 'Allow users to upload new versions'}
                                {permission === 'allowComments' && 'Allow users to add comments'}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!canManagePermissions}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                {/* File Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      File Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                        <span>{formatDateTime(file.uploadedAt instanceof Timestamp ? file.uploadedAt.toDate() : file.uploadedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploader:</span>
                        <span>{file.uploaderName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {canEdit && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Key"
                          value={customMetadataKey}
                          onChange={(e) => setCustomMetadataKey(e.target.value)}
                        />
                        <Input
                          placeholder="Value"
                          value={customMetadataValue}
                          onChange={(e) => setCustomMetadataValue(e.target.value)}
                        />
                        <Button type="button" variant="outline" onClick={addCustomMetadata}>
                          Add
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {Object.entries(form.watch('customMetadata') || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{key}:</span>
                            <span className="ml-2 text-muted-foreground">{String(value)}</span>
                          </div>
                          {canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomMetadata(key)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {Object.keys(form.watch('customMetadata') || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground">No custom metadata added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Version History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fileVersions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No version history available</p>
                    ) : (
                      <div className="space-y-3">
                        {fileVersions.map((version) => (
                          <div key={version.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <div className="font-medium">Version {version.version}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDateTime(version.uploadedAt)} by {version.uploadedBy}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatFileSize(version.size)}
                              </div>
                              {version.changeDescription && (
                                <div className="text-sm mt-1">{version.changeDescription}</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                {canEdit && (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};