import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderTree,
  BarChart3,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Folder,
  File,
  HardDrive,
  Users,
  Shield
} from 'lucide-react';
import { UserRole, ProjectFile } from '@/types';
import { cloudinaryManagementService } from '@/services/cloudinaryManagementService';
import { FileCategory } from '@/services/cloudinaryFolderService';
import { formatFileSize } from '@/utils/formatters';
import FolderAccessControl from './FolderAccessControl';

interface FileOrganizationDashboardProps {
  userRole: UserRole;
  userId: string;
  projectMemberIds?: string[];
  files?: ProjectFile[];
  onOrganizeFiles?: (results: any) => void;
}

interface OrganizationStats {
  totalFiles: number;
  organizedFiles: number;
  unorganizedFiles: number;
  totalSize: number;
  folderBreakdown: Record<string, { files: number; size: number }>;
  categoryBreakdown: Record<FileCategory, number>;
}

export const FileOrganizationDashboard: React.FC<FileOrganizationDashboardProps> = ({
  userRole,
  userId,
  projectMemberIds = [],
  files = [],
  onOrganizeFiles
}) => {
  const [stats, setStats] = useState<OrganizationStats>({
    totalFiles: 0,
    organizedFiles: 0,
    unorganizedFiles: 0,
    totalSize: 0,
    folderBreakdown: {},
    categoryBreakdown: {
      [FileCategory.DOCUMENTS]: 0,
      [FileCategory.IMAGES]: 0,
      [FileCategory.ARCHIVES]: 0,
      [FileCategory.SUBSTANTIATION]: 0,
      [FileCategory.DELIVERABLES]: 0,
      [FileCategory.PROFILE]: 0,
      [FileCategory.SYSTEM]: 0
    }
  });
  
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizationResults, setOrganizationResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load statistics
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const folderStats = await cloudinaryManagementService.getFolderStatistics(userRole);
      
      // Calculate organization stats from provided files
      const organizedFiles = files.filter(file => 
        file.folder && file.category && file.tags && file.tags.length > 0
      ).length;
      
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
      
      // Group files by category
      const categoryBreakdown = files.reduce((acc, file) => {
        const category = (file.category as FileCategory) || FileCategory.DOCUMENTS;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<FileCategory, number>);

      setStats({
        totalFiles: files.length,
        organizedFiles,
        unorganizedFiles: files.length - organizedFiles,
        totalSize,
        folderBreakdown: folderStats.folderBreakdown || {},
        categoryBreakdown: {
          ...stats.categoryBreakdown,
          ...categoryBreakdown
        }
      });
    } catch (error) {
      console.error('Failed to load organization stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Organize existing files
  const organizeFiles = async () => {
    setIsOrganizing(true);
    try {
      const results = await cloudinaryManagementService.organizeExistingFiles(
        files,
        userId,
        userRole
      );
      
      setOrganizationResults(results);
      onOrganizeFiles?.(results);
      
      // Reload stats after organization
      await loadStats();
    } catch (error) {
      console.error('Failed to organize files:', error);
      setOrganizationResults({
        organized: 0,
        errors: [error.message || 'Organization failed']
      });
    } finally {
      setIsOrganizing(false);
    }
  };

  // Cleanup orphaned files (admin only)
  const cleanupFiles = async () => {
    if (userRole !== UserRole.ADMIN) return;
    
    setIsOrganizing(true);
    try {
      const results = await cloudinaryManagementService.cleanupOrphanedFiles();
      setOrganizationResults(results);
      await loadStats();
    } catch (error) {
      console.error('Failed to cleanup files:', error);
    } finally {
      setIsOrganizing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [files, userRole, loadStats]);

  const organizationProgress = stats.totalFiles > 0 
    ? (stats.organizedFiles / stats.totalFiles) * 100 
    : 0;

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case FileCategory.DOCUMENTS: return File;
      case FileCategory.IMAGES: return File;
      case FileCategory.ARCHIVES: return Folder;
      case FileCategory.SUBSTANTIATION: return Shield;
      case FileCategory.DELIVERABLES: return CheckCircle2;
      case FileCategory.PROFILE: return Users;
      case FileCategory.SYSTEM: return Settings;
      default: return File;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            File Organization Dashboard
            <Badge variant="outline">{userRole}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalFiles}</div>
                    <div className="text-sm text-muted-foreground">Total Files</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.organizedFiles}</div>
                    <div className="text-sm text-muted-foreground">Organized</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.unorganizedFiles}</div>
                    <div className="text-sm text-muted-foreground">Needs Organization</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                    <div className="text-sm text-muted-foreground">Total Size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Organization Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(organizationProgress)}%
                </span>
              </div>
              <Progress value={organizationProgress} className="h-2" />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={organizeFiles}
                disabled={isOrganizing || isLoading}
                className="flex items-center gap-2"
              >
                {isOrganizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderTree className="h-4 w-4" />
                )}
                Organize Files
              </Button>
              
              <Button
                variant="outline"
                onClick={loadStats}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Stats
              </Button>

              {userRole === UserRole.ADMIN && (
                <Button
                  variant="destructive"
                  onClick={cleanupFiles}
                  disabled={isOrganizing}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Cleanup Orphaned Files
                </Button>
              )}
            </div>
          </div>

          {organizationResults && (
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Organization completed: {organizationResults.organized} files organized
                {organizationResults.errors?.length > 0 && (
                  <div className="mt-2">
                    <strong>Errors:</strong>
                    <ul className="list-disc list-inside">
                      {organizationResults.errors.map((error: string, index: number) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">File Categories</TabsTrigger>
          <TabsTrigger value="folders">Folder Structure</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Files by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
                  const IconComponent = getCategoryIcon(category as FileCategory);
                  return (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{category}</span>
                      </div>
                      <Badge variant="secondary">{count} files</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Folder Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.folderBreakdown).map(([folder, data]) => (
                  <div key={folder} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{folder}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(data.size)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{data.files} files</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <FolderAccessControl
            userRole={userRole}
            userId={userId}
            projectMemberIds={projectMemberIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileOrganizationDashboard;