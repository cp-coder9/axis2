import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'

interface TimelineEvent {
  id: string
  project: string
  title: string
  description: string
  date: string
  status: 'completed' | 'in-progress' | 'upcoming' | 'delayed'
  type: 'milestone' | 'meeting' | 'deadline' | 'review'
}

const timelineData: TimelineEvent[] = [
  {
    id: '1',
    project: 'Modern Villa Design',
    title: 'Initial Design Review',
    description: 'Review of conceptual designs and floor plans',
    date: '2024-09-15',
    status: 'completed',
    type: 'milestone'
  },
  {
    id: '2',
    project: 'Modern Villa Design',
    title: 'Material Selection Meeting',
    description: 'Discuss and finalize material choices for exterior and interior',
    date: '2024-10-05',
    status: 'completed',
    type: 'meeting'
  },
  {
    id: '3',
    project: 'Corporate Office Renovation',
    title: 'Space Planning Review',
    description: 'Review office layout and space allocation',
    date: '2024-10-20',
    status: 'in-progress',
    type: 'review'
  },
  {
    id: '4',
    project: 'Modern Villa Design',
    title: 'Final Design Approval',
    description: 'Client approval for final design documents',
    date: '2024-11-15',
    status: 'upcoming',
    type: 'deadline'
  },
  {
    id: '5',
    project: 'Corporate Office Renovation',
    title: 'Construction Phase Start',
    description: 'Begin construction and renovation work',
    date: '2024-11-25',
    status: 'upcoming',
    type: 'milestone'
  },
  {
    id: '6',
    project: 'Modern Villa Design',
    title: 'Construction Completion',
    description: 'Final construction and quality checks',
    date: '2024-12-15',
    status: 'upcoming',
    type: 'deadline'
  }
]

export default function ClientProjectTimelinePage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Projects", href: "/client/projects" },
    { title: "Project Timeline", isActive: true }
  ]

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'upcoming':
        return <Calendar className="h-5 w-5 text-gray-500" />
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'upcoming':
        return 'bg-gray-100 text-gray-800'
      case 'delayed':
        return 'bg-red-100 text-red-800'
    }
  }

  const filterByStatus = (status?: TimelineEvent['status']) => {
    return status ? timelineData.filter(event => event.status === status) : timelineData
  }

  const renderTimeline = (events: TimelineEvent[]) => (
    <div className="space-y-4">
      {events.map((event, index) => (
        <Card key={event.id}>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="p-2 rounded-lg bg-accent">
                  {getStatusIcon(event.status)}
                </div>
                {index < events.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {event.project}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(event.status)}>
                      {event.status.replace('-', ' ')}
                    </Badge>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Timeline</h1>
            <p className="text-muted-foreground">
              Track milestones and important dates across all projects
            </p>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderTimeline(filterByStatus())}
          </TabsContent>

          <TabsContent value="completed">
            {renderTimeline(filterByStatus('completed'))}
          </TabsContent>

          <TabsContent value="in-progress">
            {renderTimeline(filterByStatus('in-progress'))}
          </TabsContent>

          <TabsContent value="upcoming">
            {renderTimeline(filterByStatus('upcoming'))}
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  )
}
