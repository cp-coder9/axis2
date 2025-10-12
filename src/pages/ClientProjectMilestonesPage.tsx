import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react'

interface Milestone {
  id: string
  title: string
  description: string
  project: string
  dueDate: string
  status: 'completed' | 'in-progress' | 'upcoming' | 'overdue'
  progress: number
  dependencies?: string[]
}

const milestones: Milestone[] = [
  {
    id: '1',
    title: 'Initial Design Phase',
    description: 'Complete conceptual design and initial sketches',
    project: 'Modern Villa Design',
    dueDate: '2024-09-15',
    status: 'completed',
    progress: 100
  },
  {
    id: '2',
    title: 'Material Selection',
    description: 'Finalize all building materials and finishes',
    project: 'Modern Villa Design',
    dueDate: '2024-10-05',
    status: 'completed',
    progress: 100
  },
  {
    id: '3',
    title: 'Final Design Documentation',
    description: 'Complete all design drawings and specifications',
    project: 'Modern Villa Design',
    dueDate: '2024-11-15',
    status: 'in-progress',
    progress: 65
  },
  {
    id: '4',
    title: 'Space Planning Approval',
    description: 'Client approval for office space layout',
    project: 'Corporate Office Renovation',
    dueDate: '2024-10-20',
    status: 'in-progress',
    progress: 85
  },
  {
    id: '5',
    title: 'Permit Acquisition',
    description: 'Obtain all necessary building permits',
    project: 'Corporate Office Renovation',
    dueDate: '2024-11-10',
    status: 'upcoming',
    progress: 0,
    dependencies: ['Space Planning Approval']
  },
  {
    id: '6',
    title: 'Construction Start',
    description: 'Begin construction and renovation work',
    project: 'Corporate Office Renovation',
    dueDate: '2024-11-25',
    status: 'upcoming',
    progress: 0,
    dependencies: ['Permit Acquisition']
  },
  {
    id: '7',
    title: 'Project Completion',
    description: 'Final walkthrough and project handover',
    project: 'Modern Villa Design',
    dueDate: '2024-12-15',
    status: 'upcoming',
    progress: 0,
    dependencies: ['Final Design Documentation']
  }
]

export default function ClientProjectMilestonesPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Schedule", href: "/client/calendar" },
    { title: "Project Milestones", isActive: true }
  ]

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'upcoming':
        return <Calendar className="h-5 w-5 text-gray-500" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'upcoming':
        return 'bg-gray-100 text-gray-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
    }
  }

  const completedCount = milestones.filter(m => m.status === 'completed').length
  const inProgressCount = milestones.filter(m => m.status === 'in-progress').length
  const upcomingCount = milestones.filter(m => m.status === 'upcoming').length

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Milestones</h1>
            <p className="text-muted-foreground">
              Track key project milestones and deliverables
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{milestones.length}</div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Successfully finished</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{upcomingCount}</div>
              <p className="text-xs text-muted-foreground">Scheduled ahead</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Milestones</CardTitle>
            <CardDescription>
              Complete timeline of project milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <Card key={milestone.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 rounded-lg bg-accent">
                          {getStatusIcon(milestone.status)}
                        </div>
                        {index < milestones.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{milestone.title}</h3>
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {milestone.project}
                              </Badge>
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <p className="text-sm font-medium">
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Due date</p>
                          </div>
                        </div>
                        
                        {milestone.status !== 'upcoming' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{milestone.progress}%</span>
                            </div>
                            <Progress value={milestone.progress} className="h-2" />
                          </div>
                        )}
                        
                        {milestone.dependencies && milestone.dependencies.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs text-muted-foreground mb-2">Dependencies:</p>
                            <div className="flex flex-wrap gap-2">
                              {milestone.dependencies.map((dep) => (
                                <Badge key={dep} variant="outline" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  )
}
