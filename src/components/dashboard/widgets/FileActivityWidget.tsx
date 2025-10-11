import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Upload, Image, File } from 'lucide-react';

interface FileActivity {
  id: string;
  fileName: string;
  type: 'upload' | 'download' | 'view' | 'edit';
  fileType: 'image' | 'document' | 'cad' | 'other';
  user: string;
  project: string;
  timestamp: Date;
  size?: string;
}

const mockFileActivities: FileActivity[] = [
  {
    id: 'file_001',
    fileName: 'FloorPlan_v3.dwg',
    type: 'upload',
    fileType: 'cad',
    user: 'Sarah Chen',
    project: 'Office Complex Design',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    size: '2.4 MB'
  },
  {
    id: 'file_002',
    fileName: 'SitePhoto_Front.jpg',
    type: 'view',
    fileType: 'image',
    user: 'Mike Rodriguez',
    project: 'Residential Planning',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    size: '856 KB'
  },
  {
    id: 'file_003',
    fileName: 'ProjectSpec_Final.pdf',
    type: 'download',
    fileType: 'document',
    user: 'Emily Watson',
    project: 'Urban Development',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    size: '1.2 MB'
  }
];

const FileActivityWidget: React.FC = () => {
  const getActivityIcon = (type: FileActivity['type']) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4 text-green-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-blue-500" />;
      case 'view':
        return <Eye className="h-4 w-4 text-purple-500" />;
      case 'edit':
        return <FileText className="h-4 w-4 text-orange-500" />;
    }
  };

  const getFileTypeIcon = (fileType: FileActivity['fileType']) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-4 w-4 text-green-600" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'cad':
        return <File className="h-4 w-4 text-purple-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: FileActivity['type']) => {
    switch (type) {
      case 'upload':
        return <Badge variant="default">Uploaded</Badge>;
      case 'download':
        return <Badge variant="secondary">Downloaded</Badge>;
      case 'view':
        return <Badge variant="outline">Viewed</Badge>;
      case 'edit':
        return <Badge variant="default">Edited</Badge>;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className="space-y-4">
      {mockFileActivities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            {getFileTypeIcon(activity.fileType)}
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{activity.fileName}</span>
              {getActivityBadge(activity.type)}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{activity.user}</span>
              <span>•</span>
              <span>{activity.project}</span>
              <span>•</span>
              <span>{formatTimeAgo(activity.timestamp)}</span>
              {activity.size && (
                <>
                  <span>•</span>
                  <span>{activity.size}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {mockFileActivities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent file activity</p>
        </div>
      )}
    </div>
  );
};

export default FileActivityWidget;
