import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Shield,
  Settings,
  Info
} from 'lucide-react';
import { ProjectFile, UserRole } from '@/types';
import { RoleBasedFileUpload } from './RoleBasedFileUpload';
import { SubstantiationFileUpload } from './SubstantiationFileUpload';
import { UploadQuotaMonitor } from './UploadQuotaMonitor';
import { useAppContext } from '@/contexts/AppContext';

interface FileUploadManagerProps {
  projectId?: string;
  jobCardId?: string;
  onUploadComplete: (files: ProjectFile[], context?: { type: 'general' | 'substantiation'; description?: string }) => void;
  onUploadError: (error: string) => void;
  className?: string;
  defaultTab?: 'general' | 'substantiation' | 'quota';
  showSubstantiation?: boolean;
  showQuotaMonitor?: boolean;
}

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  projectId,
  jobCardId,
  onUploadComplete,
  onUploadError,
  className = '',
  defaultTab = 'general',
  showSubstantiation = true,
  showQuotaMonitor = true
}) => {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Move hooks before conditional return
  const handleGeneralUpload = useCallback((files: ProjectFile[]) => {
    onUploadComplete(files, { type: 'general' });
  }, [onUploadComplete]);

  const handleSubstantiationUpload = useCallback((files: ProjectFile[], description: string) => {
    onUploadComplete(files, { type: 'substantiation', description });
  }, [onUploadComplete]);

  if (!currentUser) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to upload files.</p>
        </CardContent>
      </Card>
    );
  }

  const canUploadSubstantiation = showSubstantiation && 
    (currentUser.role === UserRole.FREELANCER || currentUser.role === UserRole.ADMIN) &&
    projectId && jobCardId;

  const tabsToShow = [
    { value: 'general', label: 'General Upload', icon: Upload },
    ...(canUploadSubstantiation ? [{ value: 'substantiation', label: 'Substantiation', icon: Shield }] : []),
    ...(showQuotaMonitor ? [{ value: 'quota', label: 'Quota & Limits', icon: Settings }] : [])
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload Manager
            </div>
            <Badge variant="outline" className="text-xs">
              {currentUser.role}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload and manage files with role-based permissions and quota management.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {tabsToShow.map(tab => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* General Upload Tab */}
        <TabsContent value="general" className="space-y-4">
          <RoleBasedFileUpload
            projectId={projectId}
            userId={currentUser.id}
            userName={currentUser.name}
            userRole={currentUser.role}
            onUploadComplete={handleGeneralUpload}
            onUploadError={onUploadError}
          />
        </TabsContent>

        {/* Substantiation Upload Tab */}
        {canUploadSubstantiation && (
          <TabsContent value="substantiation" className="space-y-4">
            <div className="mb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Substantiation File Upload</p>
                      <p className="text-xs text-muted-foreground">
                        Upload proof of work documents to support your time log entries. 
                        These files will be associated with the current project and job card.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <SubstantiationFileUpload
              projectId={projectId!}
              jobCardId={jobCardId!}
              userId={currentUser.id}
              userName={currentUser.name}
              userRole={currentUser.role}
              onUploadComplete={handleSubstantiationUpload}
              onUploadError={onUploadError}
            />
          </TabsContent>
        )}

        {/* Quota Monitor Tab */}
        {showQuotaMonitor && (
          <TabsContent value="quota" className="space-y-4">
            <UploadQuotaMonitor
              userRole={currentUser.role}
              userId={currentUser.id}
              showDetails={true}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Simplified version for specific use cases
export const SimpleFileUpload: React.FC<{
  projectId?: string;
  onUploadComplete: (files: ProjectFile[]) => void;
  onUploadError: (error: string) => void;
  className?: string;
}> = ({ projectId, onUploadComplete, onUploadError, className = '' }) => {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return null;
  }

  return (
    <RoleBasedFileUpload
      projectId={projectId}
      userId={currentUser.id}
      userName={currentUser.name}
      userRole={currentUser.role}
      onUploadComplete={onUploadComplete}
      onUploadError={onUploadError}
      className={className}
    />
  );
};

// Timer-specific substantiation upload
export const TimerSubstantiationUpload: React.FC<{
  projectId: string;
  jobCardId: string;
  onUploadComplete: (files: ProjectFile[], description: string) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}> = ({ projectId, jobCardId, onUploadComplete, onUploadError, disabled = false, className = '' }) => {
  const { currentUser } = useAppContext();

  if (!currentUser || (currentUser.role !== UserRole.FREELANCER && currentUser.role !== UserRole.ADMIN)) {
    return null;
  }

  return (
    <SubstantiationFileUpload
      projectId={projectId}
      jobCardId={jobCardId}
      userId={currentUser.id}
      userName={currentUser.name}
      userRole={currentUser.role}
      onUploadComplete={onUploadComplete}
      onUploadError={onUploadError}
      disabled={disabled}
      className={className}
    />
  );
};