import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Eye, 
  MessageSquare,
  Clock,
  Calendar
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'In Progress' | 'Review'
  progress: number
  leadArchitect: string
  dueDate: string
  budget: number
  team: number
}

const activeProjects: Project[] = [
  {
    id: '1',
    name: 'Modern Villa Design',
    description: 'Luxury residential villa with contemporary architecture',
    status: 'In Progress',
    progress: 65,
    leadArchitect: 'Sarah Johnson',
    dueDate: '2024-12-15',
    budget: 450000,
    team: 5
  },
  {
    id: '2',
    name: 'Corporate Office Renovation',
    description: 'Complete office space redesign and renovation',
    status: 'Review',
    progress: 85,
    leadArchitect: 'Michael Chen',
    dueDate: '2024-11-30',
    budget: 320000,
    team: 4
  }
]

export default function ClientActiveProjectsPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Projects", href: "/client/projects" },
    { title: "Active Projects", isActive: true }
  ]

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Active Projects</h1>
            <p className="text-muted-foreground">
              {activeProjects.length} projects currently in progress
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {activeProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <Badge variant={project.status === 'Review' ? 'secondary' : 'default'}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Lead Architect</p>
                      <p className="font-medium">{project.leadArchitect}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Team Size</p>
                      <p className="font-medium">{project.team} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">${project.budget.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ClientDashboardLayout>
  )
}
