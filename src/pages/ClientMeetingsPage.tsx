import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Video,
  Users,
  Clock,
  MapPin,
  Calendar,
  Plus
} from 'lucide-react'

interface Meeting {
  id: string
  title: string
  description: string
  project: string
  date: string
  time: string
  duration: string
  type: 'virtual' | 'in-person'
  location: string
  organizer: string
  attendees: string[]
  status: 'upcoming' | 'completed' | 'cancelled'
}

const meetings: Meeting[] = [
  {
    id: '1',
    title: 'Design Review Meeting',
    description: 'Review latest design iterations and gather client feedback',
    project: 'Modern Villa Design',
    date: '2024-10-15',
    time: '14:00',
    duration: '1.5 hours',
    type: 'virtual',
    location: 'Zoom Meeting',
    organizer: 'Sarah Johnson',
    attendees: ['Sarah Johnson', 'Emily Rodriguez', 'John Smith'],
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'Site Visit & Inspection',
    description: 'Walk through construction site and review progress',
    project: 'Corporate Office Renovation',
    date: '2024-10-22',
    time: '10:00',
    duration: '2 hours',
    type: 'in-person',
    location: '123 Business Park Drive, Suite 400',
    organizer: 'Michael Chen',
    attendees: ['Michael Chen', 'David Miller', 'John Smith', 'Lisa Anderson'],
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'Budget Review Session',
    description: 'Quarterly budget analysis and cost projection discussion',
    project: 'Modern Villa Design',
    date: '2024-10-25',
    time: '15:00',
    duration: '1 hour',
    type: 'virtual',
    location: 'Microsoft Teams',
    organizer: 'David Miller',
    attendees: ['David Miller', 'Sarah Johnson', 'John Smith'],
    status: 'upcoming'
  },
  {
    id: '4',
    title: 'Material Selection Workshop',
    description: 'Final decisions on interior and exterior materials',
    project: 'Modern Villa Design',
    date: '2024-11-05',
    time: '13:00',
    duration: '2.5 hours',
    type: 'in-person',
    location: 'Architex Design Studio',
    organizer: 'Emily Rodriguez',
    attendees: ['Emily Rodriguez', 'Sarah Johnson', 'John Smith'],
    status: 'upcoming'
  },
  {
    id: '5',
    title: 'Project Kickoff',
    description: 'Initial meeting for project overview and expectations',
    project: 'Modern Villa Design',
    date: '2024-09-01',
    time: '10:00',
    duration: '1 hour',
    type: 'virtual',
    location: 'Zoom Meeting',
    organizer: 'Sarah Johnson',
    attendees: ['Sarah Johnson', 'John Smith', 'David Miller'],
    status: 'completed'
  }
]

export default function ClientMeetingsPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Schedule", href: "/client/calendar" },
    { title: "Meetings", isActive: true }
  ]

  const upcomingMeetings = meetings.filter(m => m.status === 'upcoming').sort((a, b) => 
    new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
  )

  const completedMeetings = meetings.filter(m => m.status === 'completed').sort((a, b) => 
    new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
  )

  const getMeetingTypeColor = (type: Meeting['type']) => {
    return type === 'virtual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  const renderMeeting = (meeting: Meeting) => (
    <Card key={meeting.id}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${meeting.type === 'virtual' ? 'bg-blue-50' : 'bg-green-50'}`}>
            <Video className={`h-6 w-6 ${meeting.type === 'virtual' ? 'text-blue-500' : 'text-green-500'}`} />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{meeting.title}</h3>
                  <Badge className={getMeetingTypeColor(meeting.type)}>
                    {meeting.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{meeting.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {meeting.project}
                </Badge>
              </div>
              
              <div className="text-right space-y-1">
                <p className="text-sm font-medium">
                  {new Date(meeting.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">{meeting.time}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{meeting.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{meeting.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{meeting.attendees.length} attendees</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Organized by {meeting.organizer}</span>
              </div>
            </div>
            
            {meeting.status === 'upcoming' && (
              <div className="flex gap-2 pt-2">
                <Button variant="default" size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
            <h1 className="text-3xl font-bold">Meetings</h1>
            <p className="text-muted-foreground">
              Manage your project meetings and video calls
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Request Meeting
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
              <p className="text-xs text-muted-foreground">Meetings scheduled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingMeetings.filter(m => {
                  const meetingDate = new Date(m.date)
                  const today = new Date()
                  const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                  return meetingDate >= today && meetingDate <= weekLater
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">In next 7 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedMeetings.length}</div>
              <p className="text-xs text-muted-foreground">Past meetings</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>
              Your scheduled meetings and calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map(renderMeeting)
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming meetings scheduled
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {completedMeetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Meetings</CardTitle>
              <CardDescription>
                Recently completed meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedMeetings.map(renderMeeting)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
