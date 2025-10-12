import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'update' | 'message' | 'document' | 'milestone' | 'meeting'
  title: string
  description: string
  timestamp: string
  project?: string
  icon: typeof Clock
  color: string
}

const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    type: 'update',
    title: 'Project Status Update',
    description: 'Modern Villa Design moved to Review phase',
    timestamp: '2 hours ago',
    project: 'Modern Villa Design',
    icon: TrendingUp,
    color: 'text-blue-500'
  },
  {
    id: '2',
    type: 'document',
    title: 'New Document Uploaded',
    description: 'Floor_Plans_v3.pdf added to Corporate Office Renovation',
    timestamp: '4 hours ago',
    project: 'Corporate Office Renovation',
    icon: FileText,
    color: 'text-green-500'
  },
  {
    id: '3',
    type: 'message',
    title: 'New Message Received',
    description: 'Sarah Johnson replied to your comment',
    timestamp: '5 hours ago',
    project: 'Modern Villa Design',
    icon: MessageSquare,
    color: 'text-purple-500'
  },
  {
    id: '4',
    type: 'milestone',
    title: 'Milestone Completed',
    description: 'Initial Design Phase completed for Residential Complex',
    timestamp: '1 day ago',
    project: 'Residential Complex',
    icon: CheckCircle2,
    color: 'text-green-500'
  },
  {
    id: '5',
    type: 'meeting',
    title: 'Upcoming Meeting',
    description: 'Design review meeting scheduled for tomorrow at 2:00 PM',
    timestamp: '1 day ago',
    project: 'Modern Villa Design',
    icon: Calendar,
    color: 'text-orange-500'
  },
  {
    id: '6',
    type: 'update',
    title: 'Budget Update',
    description: 'Budget approval received for Corporate Office Renovation',
    timestamp: '2 days ago',
    project: 'Corporate Office Renovation',
    icon: AlertCircle,
    color: 'text-blue-500'
  }
]

export default function ClientActivityPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Dashboard", href: "/client/dashboard" },
    { title: "Recent Activity", isActive: true }
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
            <h1 className="text-3xl font-bold">Recent Activity</h1>
            <p className="text-muted-foreground">
              Stay updated with the latest changes across all your projects
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Your recent project activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivityData.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className={`p-2 rounded-lg bg-accent ${activity.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {activity.timestamp}
                        </Badge>
                      </div>
                      {activity.project && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.project}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  )
}
