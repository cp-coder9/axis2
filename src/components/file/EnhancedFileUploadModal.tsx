import React, { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EnhancedModalWrapper } from '@/components/ui/enhanced-modal-wrapper';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, Image, FileText, Archive, X, AlertCircle, Loader2, Cloud } from 'lucide-react';
import { ProjectFile, FilePermissionLevel, UserRole } from '@/types';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { formatFileSize } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export enum FileCategory {
  DOCUMENTS = 'DOCUMENTS',
  IMAGES = 'IMAGES',
  ARCHIVES = 'ARCHIVES',
  OTHER = 'OTHER',
}

const fileUploadSchema = z.object({
  description: z.string().optional(),
  category: z.nativeEnum(FileCategory),
  tags: z.array(z.string()).optional(),
  permissions: z.object({
    level: z.nativeEnum(FilePermissionLevel),
    allowDownload: z.boolean().optional(),
    allowShare: z.boolean().optional(),
    allowDelete: z.boolean().optional(),
    allowVersioning: z.boolean().optional(),
    allowComments: z.boolean().optional(),
  }),
});

type FileUploadFormValues = z.infer<typeof fileUploadSchema>;

interface EnhancedFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: ProjectFile, metadata: FileUploadFormValues) => Promise<void>;
  projectId?: string;
  userId: string;
  userName: string;
  existingTags?: string[];
  userRole?: UserRole;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return <Archive className="h-8 w-8 text-yellow-500" />;
  }
  return <File className="h-8 w-8 text-gray-500" />;
};

const getFileCategory = (fileType: string): FileCategory => {
  if (fileType.startsWith('image/')) return FileCategory.IMAGES;
  if (fileType === 'application/pdf' || fileType.includes('document') || fileType.includes('sheet')) {
    return FileCategory.DOCUMENTS;
  }
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return FileCategory.ARCHIVES;
  }
  return FileCategory.OTHER;
};

export const EnhancedFileUploadModal: React.FC<EnhancedFileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  projectId,
  userId,
  userName,
  existingTags = [],
  userRole = UserRole.FREELANCER,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { uploadFile, uploadProgress, isUploading: cloudinaryUploading } = useCloudinaryUpload();

  const form = useForm<FileUploadFormValues>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      description: '',
      category: FileCategory.OTHER,
      tags: [],
      permissions: {
        level: FilePermissionLevel.PROJECT_TEAM,
        allowDownload: true,
        allowShare: false,
        allowDelete: false,
        allowVersioning: true,
        allowComments: true,
      },
    },
  });

  const activeUpload = useMemo(() => {
    const uploads = Object.values(uploadProgress);
    return uploads.find((upload) => upload.status === 'uploading');
  }, [uploadProgress]);

  const uploadProgressValue = activeUpload?.progress ?? 0;
  const isUploadingActive = Boolean(activeUpload) || cloudinaryUploading || isUploading;

  const watchedTags = form.watch('tags') ?? [];

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileSelect(event.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    setSelectedFile(file);
    form.setValue('category', getFileCategory(file.type));
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFileSelect(event.target.files[0]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const trimmed = newTag.trim();
      const currentTags = form.getValues('tags') ?? [];
      if (!currentTags.includes(trimmed)) {
        form.setValue('tags', [...currentTags, trimmed]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') ?? [];
    form.setValue('tags', currentTags.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = async (data: FileUploadFormValues) => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedFile = await uploadFile(selectedFile, userId, userName, userRole, {
        folder: projectId ? `projects/${projectId}` : 'general',
        category: data.category,
        projectId: projectId || '',
        tags: data.tags,
        description: data.description ?? undefined,
      });

      const fileData: ProjectFile = {
        ...uploadedFile,
        projectId: projectId || uploadedFile.projectId,
        category: data.category,
        permissionLevel: data.permissions.level,
        uploadedBy: userId,
        description: data.description,
        tags: data.tags,
        permissions: {
          level: data.permissions.level,
          allowView: true,
          allowEdit: false,
          allowDownload: data.permissions.allowDownload ?? true,
          allowShare: data.permissions.allowShare ?? false,
          allowDelete: data.permissions.allowDelete ?? false,
          allowVersioning: data.permissions.allowVersioning ?? true,
          allowComments: data.permissions.allowComments ?? true,
        },
        metadata: {
          ...uploadedFile.metadata,
        },
      };

      await onUpload(fileData, data);
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setUploadError(null);
    setNewTag('');
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={isUploadingActive}>
        Cancel
      </Button>
      <Button
        onClick={form.handleSubmit(onSubmit)}
        disabled={!selectedFile || isUploadingActive}
        className="min-w-[120px]"
      >
        {isUploadingActive ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Upload File
          </div>
        )}
      </Button>
    </>
  );

  return (
    <EnhancedModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload File"
      description="Upload files to your project with customizable permissions and metadata"
      variant="glass"
      size="xl"
      overlayVariant="glass"
      bottomSheetHeight="full"
      footer={footer}
      closeOnOverlayClick={!isUploadingActive}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-muted-foreground/25 hover-border-primary/50 hover:bg-primary/5',
              selectedFile && 'border-primary bg-primary/5'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">{getFileIcon(selectedFile.type)}</div>
                <div>
                  <p className="font-medium text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium text-lg">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
              </div>
            )}
          </div>

          {isUploadingActive && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgressValue)}%</span>
                  </div>
                  <Progress value={uploadProgressValue} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {selectedFile && !isUploading && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a description for this file..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => field.onChange(value as FileCategory)} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={FileCategory.DOCUMENTS}>Documents</SelectItem>
                          <SelectItem value={FileCategory.IMAGES}>Images</SelectItem>
                          <SelectItem value={FileCategory.ARCHIVES}>Archives</SelectItem>
                          <SelectItem value={FileCategory.OTHER}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {existingTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Available tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {existingTags
                      .filter((tag) => !watchedTags.includes(tag))
                      .map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => {
                            const currentTags = form.getValues('tags') ?? [];
                            form.setValue('tags', [...currentTags, tag]);
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="permissions.level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Level</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(value as FilePermissionLevel)}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={FilePermissionLevel.CLIENT_VISIBLE}>Client Visible</SelectItem>
                          <SelectItem value={FilePermissionLevel.PROJECT_TEAM}>Project Team</SelectItem>
                          <SelectItem value={FilePermissionLevel.ADMIN_ONLY}>Admin Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="permissions.allowDownload"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(value) => field.onChange(value === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Allow Download</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions.allowShare"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(value) => field.onChange(value === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Allow Share</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions.allowDelete"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(value) => field.onChange(value === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Allow Delete</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions.allowVersioning"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(value) => field.onChange(value === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Allow Versioning</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions.allowComments"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(value) => field.onChange(value === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Allow Comments</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </form>
      </Form>
    </EnhancedModalWrapper>
  );
};
