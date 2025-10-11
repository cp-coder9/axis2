import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ProjectProgressWidgetProps {
  projects?: Array<{
    id: string;
    name: string;
    progress: number;
    status: 'active' | 'completed' | 'on-hold';
  }>;
}

export const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({
  projects = [
    { id: '1', name: 'Residential Complex Design', progress: 75, status: 'active' },
    { id: '2', name: 'Commercial Tower Planning', progress: 45, status: 'active' },
    { id: '3', name: 'Urban Park Development', progress: 90, status: 'active' },
    { id: '4', name: 'Office Building Renovation', progress: 100, status: 'completed' }
  ]
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="h-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Project Progress</h3>
        <Badge variant="outline">{projects.length} projects</Badge>
      </div>
      
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {projects.map((project) => (
          <div key={project.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium truncate flex-1 mr-2">
                {project.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {project.progress}%
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(project.status)}`}
                >
                  {project.status}
                </Badge>
              </div>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
};