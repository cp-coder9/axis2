import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EnhancedModalWrapper } from '@/components/ui/enhanced-modal-wrapper';
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
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Archive, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Cloud
} from 'lucide-react';
import { ProjectFile, FilePermissionLevel, FileCategory } from '@/types';
import { useCspAwareCloudinaryUpload } from '@/hooks/useCspAwareCloudinaryUpload';
import { formatFileSize } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { getCategoryFromMimeType } from '@/utils/cloudinaryHelpers';

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

type FileUploadFormData = z.infer<typeof fileUploadSchema>;

interface EnhancedFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: ProjectFile) => Promise<void>;
  projectId?: string;
  userId: string;
  userName: string;
  existingTags?: string[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return <Archive className="h-8 w-8 text-yellow-500" />;
  }
  return <File className="h-8 w-8 text-gray-500" />;
};

export const EnhancedFileUploadModal: React.FC<EnhancedFileUploadModalProps> = ({
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
  const [cspError, setCspError] = useState<boolean>(false);

  const {
    uploadFile,
    isUploading,
    uploadProgress,
    error: uploadHookError,
    isCspError,
  } = useCspAwareCloudinaryUpload();

  const form = useForm<FileUploadFormData>({
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

  React.useEffect(() => {
    setUploadError(uploadHookError);
    setCspError(isCspError);
  }, [uploadHookError, isCspError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
  }, []);

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    setSelectedFile(file);
    const category = getCategoryFromMimeType(file.type, file.name);
    form.setValue('category', category);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = form.getValues('tags');
      if (!currentTags.includes(newTag.trim())) {
        form.setValue('tags', [...currentTags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: FileUploadFormData) => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploadError(null);
    setCspError(false);

    const result = await uploadFile(selectedFile, userId, userName, {
      category: data.category,
      projectId,
      description: data.description,
      tags: data.tags,
    });

    if (result.success && result.projectFile) {
      // Manually merge permissions from the form
      const finalFile: ProjectFile = {
        ...result.projectFile,
        permissions: {
          ...result.projectFile.permissions,
          level: data.permissions.level,
          allowDownload: data.permissions.allowDownload ?? true,
          allowShare: data.permissions.allowShare ?? false,
          allowDelete: data.permissions.allowDelete ?? false,
          allowVersioning: data.permissions.allowVersioning ?? true,
          allowComments: data.permissions.allowComments ?? true,
        },
      };
      await onUpload(finalFile);
      handleClose();
    }
    // Error is handled by the hook and useEffect
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
      <Button variant="outline" onClick={handleClose} disabled={isUploading}>
        Cancel
      </Button>
      <Button 
        onClick={form.handleSubmit(onSubmit)} 
        disabled={!selectedFile || isUploading}
        className="min-w-[120px]"
      >
        {isUploading ? (
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
      closeOnOverlayClick={!isUploading}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* File Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
              dragActive 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
              selectedFile && "border-primary bg-primary/5"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {getFileIcon(selectedFile.type)}
                </div>
                <div>
                  <p className="font-medium text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
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
                  type="file"
                  className="hidden"
                  id="file-input"
                  onChange={handleFileInputChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadError}
                {cspError && (
                  <p className="mt-2 text-xs">
                    This might be due to a network security policy (CSP).
                    The file may have been uploaded to a fallback location.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* File Metadata */}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FileCategory).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch('tags').map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <FormField
                control={form.control}
                name="permissions.level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={FilePermissionLevel.CLIENT_VISIBLE}>Public</SelectItem>
                        <SelectItem value={FilePermissionLevel.PROJECT_TEAM}>Project Members</SelectItem>
                        <SelectItem value={FilePermissionLevel.PROJECT_TEAM}>Team Only</SelectItem>
                        <SelectItem value={FilePermissionLevel.ADMIN_ONLY}>Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="permissions.allowDownload"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Allow Download
                      </FormLabel>
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
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Allow Share
                      </FormLabel>
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