import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectTable } from '@/components/project/ProjectTable';
import { useAppContext } from '@/contexts/AppContext';
import { UserRole } from '@/types';
import { Briefcase } from 'lucide-react';

export default function FreelancerProjectsPage() {
  const { projects, user } = useAppContext();

  // Filter projects for freelancer (projects they're assigned to)
  const freelancerProjects = projects.filter(project =>
    project.assignedTeam?.some(member => member.id === user?.id)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground">
          All projects you're currently working on
        </p>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>
            Projects assigned to you with current status and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {freelancerProjects.length > 0 ? (
            <ProjectTable
              projects={freelancerProjects as any}
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
                <p className="text-sm mt-2">Check back later for new project assignments</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
