import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FolderTree,
  Upload,
  Settings,
  Users,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Image,
  Archive,
  Eye
} from 'lucide-react';
import { UserRole, ProjectFile } from '@/types';
import { FileCategory } from '@/services/cloudinaryFolderService';
import { cloudinaryManagementService } from '@/services/cloudinaryManagementService';
import FileOrganizationDashboard from '@/components/file/FileOrganizationDashboard';
import FolderAccessControl from '@/components/file/FolderAccessControl';
import { RoleBasedFileUpload } from '@/components/file/RoleBasedFileUpload';

interface DemoState {
  selectedRole: UserRole;
  selectedProject: string;
  selectedUser: string;
  mockFiles: ProjectFile[];
  organizationResults: any;
}

const MOCK_PROJECTS = [
  { id: 'proj-001', name: 'Modern Office Complex' },
  { id: 'proj-002', name: 'Residential Tower' },
  { id: 'proj-003', name: 'Shopping Mall Renovation' }
];

const MOCK_USERS = [
  { id: 'user-001', name: 'John Architect', role: UserRole.ADMIN },
  { id: 'user-002', name: 'Sarah Designer', role: UserRole.FREELANCER },
  { id: 'user-003', name: 'Mike Client', role: UserRole.CLIENT }
];

const MOCK_FILES: ProjectFile[] = [
  {
    id: 'file-001',
    name: 'floor-plan-v1.pdf',
    size: 2048000,
    type: 'application/pdf',
    url: 'https://example.com/file1.pdf',
    uploadedAt: new Date() as any,
    uploaderId: 'user-002',
    uploaderName: 'Sarah Designer',
    permissions: {
      level: 'PROJECT_TEAM' as any,
      allowDownload: true,
      allowShare: false,
      allowVersioning: true,
      allowComments: true,
      allowDelete: false
    },
    projectId: 'proj-001',
    category: 'DELIVERABLES',
    tags: ['floor-plan', 'v1', 'draft'],
    folder: 'architex-axis/projects/proj-001/deliverables'
  },
  {
    id: 'file-002',
    name: 'site-photo.jpg',
    size: 1024000,
    type: 'image/jpeg',
    url: 'https://example.com/photo.jpg',
    uploadedAt: new Date() as any,
    uploaderId: 'user-003',
    uploaderName: 'Mike Client',
    permissions: {
      level: 'CLIENT_VISIBLE' as any,
      allowDownload: true,
      allowShare: true,
      allowVersioning: false,
      allowComments: true,
      allowDelete: false
    },
    projectId: 'proj-001',
    category: 'IMAGES',
    tags: ['site', 'reference'],
    folder: 'architex-axis/projects/proj-001/images'
  },
  {
    id: 'file-003',
    name: 'time-log-proof.pdf',
    size: 512000,
    type: 'application/pdf',
    url: 'https://example.com/proof.pdf',
    uploadedAt: new Date() as any,
    uploaderId: 'user-002',
    uploaderName: 'Sarah Designer',
    permissions: {
      level: 'PROJECT_TEAM' as any,
      allowDownload: true,
      allowShare: false,
      allowVersioning: true,
      allowComments: false,
      allowDelete: false
    },
    projectId: 'proj-001',
    category: 'SUBSTANTIATION',
    tags: ['time-log', 'proof', 'week-1'],
    folder: 'architex-axis/projects/proj-001/substantiation'
  }
];

export const CloudinaryFolderOrganizationDemo: React.FC = () => {
  const [demoState, setDemoState] = useState<DemoState>({
    selectedRole: UserRole.FREELANCER,
    selectedProject: 'proj-001',
    selectedUser: 'user-002',
    mockFiles: MOCK_FILES,
    organizationResults: null
  });

  const handleRoleChange = (role: UserRole) => {
    setDemoState(prev => ({ ...prev, selectedRole: role }));
  };

  const handleProjectChange = (projectId: string) => {
    setDemoState(prev => ({ ...prev, selectedProject: projectId }));
  };

  const handleUserChange = (userId: string) => {
    setDemoState(prev => ({ ...prev, selectedUser: userId }));
  };

  const handleFileUpload = (files: ProjectFile[]) => {
    setDemoState(prev => ({
      ...prev,
      mockFiles: [...prev.mockFiles, ...files]
    }));
  };

  const handleOrganizeFiles = (results: any) => {
    setDemoState(prev => ({
      ...prev,
      organizationResults: results
    }));
  };

  const getProjectMemberIds = () => {
    // Mock project membership
    return ['user-001', 'user-002', 'user-003'];
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return Shield;
      case UserRole.FREELANCER: return Users;
      case UserRole.CLIENT: return Eye;
      default: return Users;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DOCUMENTS': return FileText;
      case 'IMAGES': return Image;
      case 'ARCHIVES': return Archive;
      case 'SUBSTANTIATION': return Eye;
      case 'DELIVERABLES': return CheckCircle2;
      default: return FileText;
    }
  };

  const configStatus = cloudinaryManagementService.getConfigStatus();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            Cloudinary Folder Organization Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This demo showcases the role-based folder organization system for Cloudinary file management.
              Switch between different user roles to see how folder access and organization changes.
            </AlertDescription>
          </Alert>

          {!configStatus.isConfigured && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cloudinary is not configured. Missing: {configStatus.missingVars.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="User Role-input">User Role</label>
              <Select value={demoState.selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map(role => {
                    const IconComponent = getRoleIcon(role);
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {role}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="Project-input">Project</label>
              <Select value={demoState.selectedProject} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PROJECTS.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="User-input">User</label>
              <Select value={demoState.selectedUser} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_USERS.map(user => {
                    const IconComponent = getRoleIcon(user.role);
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {user.name}
                          <Badge variant="outline" className="ml-2">{user.role}</Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Organization Dashboard</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="files">File Browser</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FileOrganizationDashboard
            userRole={demoState.selectedRole}
            userId={demoState.selectedUser}
            projectMemberIds={getProjectMemberIds()}
            files={demoState.mockFiles}
            onOrganizeFiles={handleOrganizeFiles}
          />
        </TabsContent>

        <TabsContent value="access">
          <FolderAccessControl
            userRole={demoState.selectedRole}
            userId={demoState.selectedUser}
            projectMemberIds={getProjectMemberIds()}
          />
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Role-Based File Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RoleBasedFileUpload
                projectId={demoState.selectedProject}
                userId={demoState.selectedUser}
                userName={MOCK_USERS.find(u => u.id === demoState.selectedUser)?.name || 'Unknown'}
                userRole={demoState.selectedRole}
                onUploadComplete={handleFileUpload}
                onUploadError={(error) => console.error('Upload error:', error)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Browser
                <Badge variant="secondary">{demoState.mockFiles.length} files</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoState.mockFiles.map(file => {
                  const CategoryIcon = getCategoryIcon(file.category || 'DOCUMENTS');
                  return (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {file.folder || 'No folder assigned'}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {file.tags?.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{file.category}</Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {Math.round(file.size / 1024)} KB
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {demoState.organizationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Organization Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {demoState.organizationResults.organized || 0}
                </div>
                <div className="text-sm text-muted-foreground">Files Organized</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {demoState.organizationResults.errors?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
            
            {demoState.organizationResults.errors?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {demoState.organizationResults.errors.map((error: string, index: number) => (
                    <li key={index} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CloudinaryFolderOrganizationDemo;