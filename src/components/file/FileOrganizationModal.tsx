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
} from '@/lib/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/shadcn/form';
import { Button } from '@/lib/shadcn/button';
import { Input } from '@/lib/shadcn/input';
import { Textarea } from '@/lib/shadcn/textarea';
import { Badge } from '@/lib/shadcn/badge';
// Removed unused Card and CardContent imports
import { Separator } from '@/lib/shadcn/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/lib/shadcn/select';
import { 
  Folder,
  FolderPlus,
  File,
  X,
  Save,
  Loader2,
  Tag,
  Edit3
} from 'lucide-react';
import { ProjectFile, FileCategory } from '@/types';

// File organization schema
const fileOrganizationSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  description: z.string().optional(),
  category: z.nativeEnum(FileCategory),
  tags: z.array(z.string()).default([]),
  folder: z.string().optional(),
});

type FileOrganizationFormData = z.infer<typeof fileOrganizationSchema>;

interface FileFolder {
  id: string;
  name: string;
  parentId?: string;
  projectId: string;
  createdAt: Date;
  createdBy: string;
  description?: string;
}

interface FileOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ProjectFile;
  folders: FileFolder[];
  existingTags: string[];
  onSave: (fileId: string, updates: Partial<ProjectFile>) => Promise<void>;
  onCreateFolder?: (folderData: Omit<FileFolder, 'id' | 'createdAt'>) => Promise<FileFolder>;
}

export const FileOrganizationModal: React.FC<FileOrganizationModalProps> = ({
  isOpen,
  onClose,
  file,
  folders,
  existingTags,
  onSave,
  onCreateFolder,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const form = useForm<FileOrganizationFormData>({
    resolver: zodResolver(fileOrganizationSchema),
    defaultValues: {
      name: file.name,
      description: file.description || '',
      category: file.category || FileCategory.OTHER,
      tags: file.tags || [],
      folder: file.folderId || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: file.name,
        description: file.description || '',
        category: file.category || FileCategory.OTHER,
        tags: file.tags || [],
        folder: file.folderId || '',
      });
    }
  }, [isOpen, file, form]);

  const handleClose = () => {
    form.reset();
    setNewTag('');
    setShowCreateFolder(false);
    setNewFolderName('');
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !onCreateFolder) return;

    try {
      setIsLoading(true);
      const newFolder = await onCreateFolder({
        name: newFolderName.trim(),
        projectId: file.projectId,
        createdBy: file.uploaderId,
      });
      
      form.setValue('folder', newFolder.id);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FileOrganizationFormData) => {
    try {
      setIsLoading(true);
      
      const updates: Partial<ProjectFile> = {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        folderId: data.folder || undefined,
        lastModified: new Date(),
      };

      await onSave(file.id, updates);
      handleClose();
    } catch (error) {
      console.error('Failed to update file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFolderTree = (parentId?: string, level = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId);
    
    return childFolders.map(folder => (
      <React.Fragment key={folder.id}>
        <SelectItem value={folder.id}>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 16}px` }}>
            <Folder className="h-4 w-4" />
            {folder.name}
          </div>
        </SelectItem>
        {renderFolderTree(folder.id, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Organize File
          </DialogTitle>
          <DialogDescription>
            Update file information, organize into folders, and manage tags.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter file name" />
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
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

              {/* Folder */}
              <FormField
                control={form.control}
                name="folder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder</FormLabel>
                    <div className="space-y-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select folder (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4" />
                              No folder (root)
                            </div>
                          </SelectItem>
                          {renderFolderTree()}
                        </SelectContent>
                      </Select>
                      
                      {onCreateFolder && (
                        <div className="flex gap-2">
                          {!showCreateFolder ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCreateFolder(true)}
                              className="flex items-center gap-2"
                            >
                              <FolderPlus className="h-4 w-4" />
                              Create Folder
                            </Button>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <Input
                                placeholder="Folder name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateFolder();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim() || isLoading}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowCreateFolder(false);
                                  setNewFolderName('');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </FormLabel>
              
              {/* Add new tag */}
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

              {/* Current tags */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current tags:</p>
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
                  {form.watch('tags').length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags added</p>
                  )}
                </div>
              </div>

              {/* Existing tags */}
              {existingTags.length > 0 && (
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};