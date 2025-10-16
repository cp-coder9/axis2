import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectTable } from '@/components/project/ProjectTable';
import { useAppContext } from '@/contexts/AppContext';
import { UserRole } from '@/types';
import { Briefcase } from 'lucide-react';

export default function FreelancerAssignedProjectsPage() {
  const { projects, user } = useAppContext();

  // Filter projects for freelancer (projects they're assigned to)
  const assignedProjects = projects.filter(project =>
    project.assignedTeam?.some((member: any) => member.id === user?.id)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Assigned Projects</h1>
        <p className="text-muted-foreground">
          Projects you're currently assigned to and actively working on
        </p>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments</CardTitle>
          <CardDescription>
            All projects you're working on with current status and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedProjects.length > 0 ? (
            <ProjectTable
              projects={assignedProjects as any}
              userRole={UserRole.FREELANCER}
              showTimerControls={true}
              showPagination={true}
              pageSize={10}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No projects assigned yet</p>
                <p className="text-sm mt-2">Check available projects or wait for new assignments</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
