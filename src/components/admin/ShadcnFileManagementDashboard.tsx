import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { ProjectFile, FileCategory } from '../../types';

interface FileFolder {
  id: string;
  name: string;
  parentId?: string;
  projectId: string;
  createdAt: Date;
  createdBy: string;
}
import AdvancedFileManager from '../../../utils/advancedFileManager';
import { formatFileSize, formatTimestamp } from '../../utils/formatters';
import { canDeleteFile, canShareFile } from '../../../utils/filePermissions';
import { createZipFromFiles } from '../../../utils/bulkFileOperations';
import { EnhancedFileSearch } from '../file/EnhancedFileSearch';
import { FileOrganizationModal } from '../file/FileOrganizationModal';
import { FileMetadataEditor } from '../file/FileMetadataEditor';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Progress,
  Separator,
  cn
} from '../../lib/shadcn';
import {
  Files,
  Download,
  Trash2,
  Share2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  FolderOpen,
  Upload,
  BarChart3,
  Users,
  Calendar,
  HardDrive
} from 'lucide-react';

interface ShadcnFileManagementDashboardProps {
  projectId: string;
  className?: string;
}

export const ShadcnFileManagementDashboard: React.FC<ShadcnFileManagementDashboardProps> = ({
  projectId,
  className = ''
}) => {
  const { user, projects } = useAppContext();
  const [filteredFiles, setFilteredFiles] = useState<ProjectFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'analytics'>('files');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [bulkOperationMode, setBulkOperationMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'ALL'>('ALL');
  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [fileToOrganize, setFileToOrganize] = useState<ProjectFile | null>(null);
  const [fileToEdit, setFileToEdit] = useState<ProjectFile | null>(null);
  const [folders, setFolders] = useState<FileFolder[]>([]);

  const [analytics, setAnalytics] = useState<{
    totalFiles: number;
    totalSize: number;
    filesByCategory: Record<string, number>;
    filesByUploader: Record<string, number>;
    mostAccessedFiles: { file: ProjectFile; accessCount: number }[];
    recentlyUploadedFiles: { id: string; name: string; uploadedAt: any }[];
  } | null>(null);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (project) {
      let files = project.files.filter(f => !f.isDeleted);

      // Apply search filter
      if (searchTerm) {
        files = files.filter(f =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Apply category filter
      if (categoryFilter !== 'ALL') {
        files = files.filter(f => f.category === categoryFilter);
      }

      setFilteredFiles(files);
      loadAnalytics();
    }
  }, [project, searchTerm, categoryFilter]);

  const loadAnalytics = async () => {
    if (project) {
      try {
        const analyticsData = await AdvancedFileManager.getFileAnalytics(project.id);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    }
  };

  const handleFileSelect = (fileId: string) => {
    if (bulkOperationMode) {
      setSelectedFiles(prev =>
        prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      const file = filteredFiles.find(f => f.id === fileId);
      setSelectedFile(file || null);
    }
  };

  const handleBulkDelete = async () => {
    if (!user || !project || selectedFiles.length === 0) return;

    try {
      for (const fileId of selectedFiles) {
        await AdvancedFileManager.softDeleteFile(
          project.id,
          fileId,
          'Bulk delete operation',
          user
        );
      }
      setSelectedFiles([]);
      setBulkOperationMode(false);
      window.location.reload();
    } catch (error) {
      console.error('Error bulk deleting files:', error);
    }
  };

  const handleBulkCategorize = async (category: FileCategory) => {
    if (!user || !project || selectedFiles.length === 0) return;

    try {
      await AdvancedFileManager.bulkUpdateFiles(
        project.id,
        selectedFiles,
        { category },
        user
      );
      setSelectedFiles([]);
      setBulkOperationMode(false);
      window.location.reload();
    } catch (error) {
      console.error('Error bulk categorizing files:', error);
    }
  };

  const handleOrganizeFile = (file: ProjectFile) => {
    setFileToOrganize(file);
    setShowOrganizeModal(true);
  };

  const handleEditMetadata = (file: ProjectFile) => {
    setFileToEdit(file);
    setShowMetadataEditor(true);
  };

  const handleSaveFileChanges = async (fileId: string, updates: Partial<ProjectFile>) => {
    if (!user || !project) return;

    try {
      await AdvancedFileManager.updateFileMetadata(project.id, fileId, updates, user);
      window.location.reload();
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const handleCreateFolder = async (folderData: any) => {
    // Implementation for creating folders would go here
    // This is a placeholder for the folder creation functionality
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: folderData.name,
      parentId: folderData.parentId,
      projectId: projectId,
      createdAt: new Date(),
      createdBy: user?.id || 'unknown',
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  };

  const handleFilesFiltered = (filtered: ProjectFile[]) => {
    setFilteredFiles(filtered);
  };

  const getCategoryIcon = (category?: FileCategory) => {
    switch (category) {
      case FileCategory.DOCUMENTS: return FileText;
      case FileCategory.IMAGES: return Image;
      case FileCategory.DRAWINGS: return FileText;
      case FileCategory.PRESENTATIONS: return Presentation;
      case FileCategory.SPREADSHEETS: return FileSpreadsheet;
      case FileCategory.VIDEOS: return Video;
      case FileCategory.AUDIO: return Music;
      case FileCategory.ARCHIVES: return Archive;
      default: return Files;
    }
  };

  const getFileStatusColor = (file: ProjectFile) => {
    if (file.isDeleted) return 'destructive';
    if (file.shareLinks?.some(link => link.isActive)) return 'default';
    if (file.versions && file.versions.length > 1) return 'secondary';
    return 'outline';
  };

  const getFileStatusText = (file: ProjectFile) => {
    if (file.isDeleted) return 'Deleted';
    if (file.shareLinks?.some(link => link.isActive)) return 'Shared';
    if (file.versions && file.versions.length > 1) return `v${file.currentVersion}`;
    return 'Active';
  };

  const renderFileActions = (file: ProjectFile) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>

        {canShareFile(file, user) && (
          <DropdownMenuItem>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => handleEditMetadata(file)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Metadata
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleOrganizeFile(file)}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Organize
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canDeleteFile(file, user) && (
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!user || !project) {
    return (
      <Alert>
        <AlertDescription>
          Project not found or access denied.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Files className="h-6 w-6" />
                File Management
              </CardTitle>
              <CardDescription>{project.title}</CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setBulkOperationMode(!bulkOperationMode)}
                variant={bulkOperationMode ? "default" : "outline"}
                size="sm"
              >
                {bulkOperationMode ? 'Exit Bulk Mode' : 'Bulk Operations'}
              </Button>

              {bulkOperationMode && selectedFiles.length > 0 && (
                <>
                  <Select onValueChange={(value) => value && handleBulkCategorize(value as FileCategory)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Categorize Selected" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(FileCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedFiles.length})
                  </Button>

                  <Button
                    onClick={async () => {
                      const filesToDownload = filteredFiles.filter(f => selectedFiles.includes(f.id));
                      await createZipFromFiles(filesToDownload);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download ({selectedFiles.length})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files">
            Files ({filteredFiles.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          {/* Enhanced Search and Filter */}
          <EnhancedFileSearch
            files={project.files.filter(f => !f.isDeleted)}
            folders={folders}
            projectUsers={[]} // You would pass actual project users here
            onFilesFiltered={handleFilesFiltered}
            onFileSelect={(file) => setSelectedFile(file)}
          />

          {/* Files Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  {bulkOperationMode && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFiles(filteredFiles.map(f => f.id));
                          } else {
                            setSelectedFiles([]);
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>File</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => {
                  const IconComponent = getCategoryIcon(file.category);
                  return (
                    <TableRow
                      key={file.id}
                      className={cn(
                        selectedFiles.includes(file.id) && 'bg-muted/50'
                      )}
                    >
                      {bulkOperationMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={() => handleFileSelect(file.id)}
                          />
                        </TableCell>
                      )}

                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            {file.description && (
                              <div className="text-sm text-muted-foreground">{file.description}</div>
                            )}
                            {file.tags && file.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {file.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {file.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{file.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {file.category?.replace('_', ' ') || 'Uncategorized'}
                        </Badge>
                      </TableCell>

                      <TableCell>{formatFileSize(file.size)}</TableCell>

                      <TableCell>{file.uploaderName}</TableCell>

                      <TableCell>{formatTimestamp(file.uploadedAt)}</TableCell>

                      <TableCell>
                        <Badge variant={getFileStatusColor(file)}>
                          {getFileStatusText(file)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {renderFileActions(file)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredFiles.length === 0 && (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No files found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== 'ALL'
                    ? 'Try adjusting your search terms or filters.'
                    : 'Upload files to get started.'}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              {/* Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Files className="h-8 w-8 text-primary" />
                      <div>
                        <div className="text-2xl font-bold">{analytics.totalFiles}</div>
                        <div className="text-sm text-muted-foreground">Total Files</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-8 w-8 text-primary" />
                      <div>
                        <div className="text-2xl font-bold">{formatFileSize(analytics.totalSize)}</div>
                        <div className="text-sm text-muted-foreground">Total Size</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <div className="text-2xl font-bold">{Object.keys(analytics.filesByUploader).length}</div>
                        <div className="text-sm text-muted-foreground">Contributors</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-8 w-8 text-primary" />
                      <div>
                        <div className="text-2xl font-bold">{Object.keys(analytics.filesByCategory).length}</div>
                        <div className="text-sm text-muted-foreground">Categories</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Files by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Files by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.filesByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{category.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={(count / analytics.totalFiles) * 100} className="w-24" />
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Loading Analytics</h3>
                  <p className="text-muted-foreground">Please wait while we gather file statistics...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* File Organization Modal */}
      {showOrganizeModal && fileToOrganize && (
        <FileOrganizationModal
          isOpen={showOrganizeModal}
          onClose={() => {
            setShowOrganizeModal(false);
            setFileToOrganize(null);
          }}
          file={fileToOrganize}
          folders={folders}
          existingTags={project.files.flatMap(f => f.tags || []).filter((tag, index, arr) => arr.indexOf(tag) === index)}
          onSave={handleSaveFileChanges}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* File Metadata Editor */}
      {showMetadataEditor && fileToEdit && (
        <FileMetadataEditor
          isOpen={showMetadataEditor}
          onClose={() => {
            setShowMetadataEditor(false);
            setFileToEdit(null);
          }}
          file={fileToEdit}
          existingTags={project.files.flatMap(f => f.tags || []).filter((tag, index, arr) => arr.indexOf(tag) === index)}
          onSave={handleSaveFileChanges}
          canEdit={true}
          canManagePermissions={user?.role === 'ADMIN'}
        />
      )}
    </div>
  );
};

export default ShadcnFileManagementDashboard;
