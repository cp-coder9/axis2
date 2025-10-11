import React, { useState, useRef, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Archive, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ProjectFile, FilePermissionLevel, FilePermissions } from '@/types';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { formatFileSize } from '@/utils/formatters';

// File upload schema
const fileUploadSchema = z.object({
  description: z.string().optional(),
  category: z.enum(['DOCUMENTS', 'IMAGES', 'ARCHIVES', 'OTHER']),
  tags: z.array(z.string()).default([]),
  permissions: z.object({
    level: z.nativeEnum(FilePermissionLevel),
    allowDownload: z.boolean().default(true),
    allowShare: z.boolean().default(false),
    allowDelete: z.boolean().default(false),
    allowVersioning: z.boolean().default(true),
    allowComments: z.boolean().default(true),
  }),
});

type FileUploadFormData = z.infer<typeof fileUploadSchema>;

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: ProjectFile, metadata: any) => Promise<void>;
  projectId?: string;
  userId: string;
  userName: string;
  existingTags?: string[];
}

const ACCEPTED_FILE_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return <Archive className="h-8 w-8 text-yellow-500" />;
  }
  return <File className="h-8 w-8 text-gray-500" />;
};

const getFileCategory = (fileType: string): 'DOCUMENTS' | 'IMAGES' | 'ARCHIVES' | 'OTHER' => {
  if (fileType.startsWith('image/')) return 'IMAGES';
  if (fileType === 'application/pdf' || fileType.includes('document') || fileType.includes('sheet')) {
    return 'DOCUMENTS';
  }
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return 'ARCHIVES';
  }
  return 'OTHER';
};

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  projectId,
  userId,
  userName,
  existingTags = [],
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadFile,
    isUploading,
    uploadProgress,
    isConfigured: cloudinaryConfigured
  } = useCloudinaryUpload({
    onUploadError: (_, error) => setUploadError(error),
    onUploadComplete: () => setUploadError(null),
  });

  const form = useForm({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      description: '',
      category: 'OTHER',
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

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setDragActive(false);
    setUploadError(null);
    setNewTag('');
    form.reset();
    onClose();
  }, [form, onClose]);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    // Validate file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type;
    });

    if (!isValidType) {
      setUploadError('File type not supported. Please upload images, PDFs, documents, or archives.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    
    // Auto-set category based on file type
    const category = getFileCategory(file.type);
    form.setValue('category', category);
  }, [form]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const addTag = useCallback(() => {
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, form]);

  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  }, [form]);

  const onSubmit = async (data: any) => {
    if (!selectedFile || !cloudinaryConfigured) return;

    try {
      const cloudinaryOptions = {
        folder: projectId ? `projects/${projectId}` : `users/${userId}`,
        tags: [data.category.toLowerCase(), ...data.tags],
      };

      const projectFile = await uploadFile(
        selectedFile,
        userId,
        userName,
        undefined,
        cloudinaryOptions
      );

      const enhancedProjectFile: ProjectFile = {
        ...projectFile,
        permissions: data.permissions,
      };

      await onUpload(enhancedProjectFile, data);
      handleClose();
    } catch (error) {
      setUploadError('Upload failed. Please try again.');
    }
  };

  const currentProgress = Object.values(uploadProgress)[0]?.progress || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to the project. Maximum file size is {formatFileSize(MAX_FILE_SIZE)}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Selection Area */}
            <Card>
              <CardContent className="p-6">
                <div
                  role="button"
                  tabIndex={0}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  aria-label="Click to select files or drag and drop files here"
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        {getFileIcon(selectedFile.type)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-foreground">
                          Drop files here or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports images, PDFs, documents, and archives
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {isUploading && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Uploading...</span>
                      <span className="text-sm text-muted-foreground">{currentProgress}%</span>
                    </div>
                    <Progress value={currentProgress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Cloudinary Configuration Warning */}
            {!cloudinaryConfigured && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cloudinary is not configured. Please check your environment variables.
                </AlertDescription>
              </Alert>
            )}

            {selectedFile && (
              <>
                <Separator />

                {/* File Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DOCUMENTS">Documents</SelectItem>
                            <SelectItem value="IMAGES">Images</SelectItem>
                            <SelectItem value="ARCHIVES">Archives</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select access level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={FilePermissionLevel.PROJECT_TEAM}>Project Team</SelectItem>
                            <SelectItem value={FilePermissionLevel.CLIENT_VISIBLE}>Client Visible</SelectItem>
                            <SelectItem value={FilePermissionLevel.ADMIN_ONLY}>Admin Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional description for this file..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div className="space-y-3">
                  <FormLabel>Tags</FormLabel>
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
                  <div className="flex flex-wrap gap-2">
                    {form.watch('tags').map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  {existingTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Existing tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {existingTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => {
                              const currentTags = form.getValues('tags');
                              if (!currentTags.includes(tag)) {
                                form.setValue('tags', [...currentTags, tag]);
                              }
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <FormLabel>File Permissions</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="permissions.allowDownload"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow Download</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="permissions.allowShare"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow Share</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="permissions.allowDelete"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow Delete</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="permissions.allowVersioning"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow Versioning</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="permissions.allowComments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow Comments</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || isUploading || !cloudinaryConfigured}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};