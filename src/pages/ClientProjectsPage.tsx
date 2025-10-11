import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { ClientProjectOverview } from '@/components/client/ClientProjectOverview'

export default function ClientProjectsPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client" },
    { title: "Projects", isActive: true }
  ]

  const handleViewProject = (projectId: string) => {
    // Navigate to project details
    console.log('View project:', projectId)
    // In a real app, this would navigate to /client/projects/{projectId}
  }

  const handleMessageTeam = (projectId: string) => {
    // Navigate to project messaging
    console.log('Message team for project:', projectId)
    // In a real app, this would navigate to /client/messages?project={projectId}
  }

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-muted-foreground">
              Track progress and communicate with your project teams
            </p>
          </div>
        </div>

        <ClientProjectOverview 
          onViewProject={handleViewProject}
          onMessageTeam={handleMessageTeam}
        />
      </div>
    </ClientDashboardLayout>
  )
}