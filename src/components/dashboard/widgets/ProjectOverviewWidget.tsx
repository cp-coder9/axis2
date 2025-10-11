import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Pause,
  Play
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'overdue';
  progress: number;
  timeSpent: number;
  timeAllocated: number;
  teamSize: number;
  dueDate: string;
}

interface ProjectOverviewWidgetProps {
  userRole?: 'admin' | 'freelancer' | 'client';
}

// Mock project data for demonstration
const mockProjects: ProjectData[] = [
  {
    id: 'proj_001',
    name: 'Office Complex Design',
    status: 'active',
    progress: 65,
    timeSpent: 120,
    timeAllocated: 200,
    teamSize: 4,
    dueDate: '2025-09-15'
  },
  {
    id: 'proj_002',
    name: 'Residential Building Plan',
    status: 'paused',
    progress: 40,
    timeSpent: 80,
    timeAllocated: 150,
    teamSize: 2,
    dueDate: '2025-10-01'
  },
  {
    id: 'proj_003',
    name: 'Urban Planning Study',
    status: 'completed',
    progress: 100,
    timeSpent: 180,
    timeAllocated: 180,
    teamSize: 6,
    dueDate: '2025-08-01'
  },
  {
    id: 'proj_004',
    name: 'Heritage Restoration',
    status: 'overdue',
    progress: 25,
    timeSpent: 45,
    timeAllocated: 120,
    teamSize: 3,
    dueDate: '2025-08-15'
  }
];

const ProjectOverviewWidget: React.FC<ProjectOverviewWidgetProps> = ({ userRole = 'admin' }) => {
  const getStatusIcon = (status: ProjectData['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: ProjectData['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatHours = (hours: number) => {
    return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `${diffDays} days remaining`;
    }
  };

  // Filter projects based on user role
  const filteredProjects = userRole === 'client' 
    ? mockProjects.filter(p => p.status !== 'paused') 
    : mockProjects;

  const activeProjects = filteredProjects.filter(p => p.status === 'active').length;
  const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;
  const overdueProjects = filteredProjects.filter(p => p.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{completedProjects}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{overdueProjects}</div>
          <div className="text-sm text-muted-foreground">Overdue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{filteredProjects.length}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">{project.name}</h4>
              </div>
              <Badge variant={getStatusVariant(project.status)} className="flex items-center gap-1">
                {getStatusIcon(project.status)}
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatHours(project.timeSpent)} / {formatHours(project.timeAllocated)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{project.teamSize} members</span>
              </div>
              <div className="col-span-2">
                <span className={project.status === 'overdue' ? 'text-red-600' : ''}>
                  {getDaysUntilDue(project.dueDate)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No projects available</p>
        </div>
      )}
    </div>
  );
};

export default ProjectOverviewWidget;
