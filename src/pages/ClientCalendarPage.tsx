import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Users,
  Plus
} from 'lucide-react'
import { useState } from 'react'

interface CalendarEvent {
  id: string
  title: string
  description: string
  type: 'milestone' | 'meeting' | 'deadline' | 'review'
  project: string
  date: string
  time?: string
  duration?: string
  location?: string
  attendees?: string[]
  status: 'upcoming' | 'completed' | 'cancelled'
}

const calendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Design Review Meeting',
    description: 'Review latest design iterations and client feedback',
    type: 'meeting',
    project: 'Modern Villa Design',
    date: '2024-10-15',
    time: '14:00',
    duration: '1.5 hours',
    location: 'Virtual (Zoom)',
    attendees: ['Sarah Johnson', 'Emily Rodriguez', 'John Smith'],
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'Final Design Approval',
    description: 'Client final approval deadline for design documents',
    type: 'deadline',
    project: 'Modern Villa Design',
    date: '2024-11-15',
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'Material Selection Milestone',
    description: 'Complete selection of all building materials',
    type: 'milestone',
    project: 'Corporate Office Renovation',
    date: '2024-10-20',
    status: 'upcoming'
  },
  {
    id: '4',
    title: 'Site Visit',
    description: 'Visit construction site for progress inspection',
    type: 'meeting',
    project: 'Corporate Office Renovation',
    date: '2024-10-22',
    time: '10:00',
    duration: '2 hours',
    location: '123 Business Park Drive',
    attendees: ['Michael Chen', 'David Miller', 'John Smith'],
    status: 'upcoming'
  },
  {
    id: '5',
    title: 'Budget Review',
    description: 'Quarterly budget and expense review meeting',
    type: 'review',
    project: 'Modern Villa Design',
    date: '2024-10-25',
    time: '15:00',
    duration: '1 hour',
    location: 'Virtual (Teams)',
    attendees: ['Sarah Johnson', 'David Miller', 'John Smith'],
    status: 'upcoming'
  },
  {
    id: '6',
    title: 'Construction Phase Start',
    description: 'Official construction kickoff milestone',
    type: 'milestone',
    project: 'Corporate Office Renovation',
    date: '2024-11-25',
    status: 'upcoming'
  }
]

export default function ClientCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Schedule", isActive: true }
  ]

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'milestone':
        return 'bg-green-100 text-green-800'
      case 'meeting':
        return 'bg-blue-100 text-blue-800'
      case 'deadline':
        return 'bg-red-100 text-red-800'
      case 'review':
        return 'bg-purple-100 text-purple-800'
    }
  }

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'milestone':
        return <CalendarIcon className="h-5 w-5" />
      case 'meeting':
        return <Video className="h-5 w-5" />
      case 'deadline':
        return <Clock className="h-5 w-5" />
      case 'review':
        return <Users className="h-5 w-5" />
    }
  }

  const upcomingEvents = calendarEvents.filter(e => e.status === 'upcoming').sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const thisWeekEvents = upcomingEvents.filter(e => {
    const eventDate = new Date(e.date)
    const today = new Date()
    const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return eventDate >= today && eventDate <= weekLater
  })

  const renderEvent = (event: CalendarEvent) => (
    <Card key={event.id}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${getEventTypeColor(event.type)}`}>
            {getEventIcon(event.type)}
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
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  {event.time && (
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  )}
                </div>
              </div>
            </div>
            
            {(event.location || event.duration || event.attendees) && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{event.duration}</span>
                  </div>
                )}
                {event.attendees && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{event.attendees.length} attendees</span>
                  </div>
                )}
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
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">
              Manage your project meetings, milestones, and deadlines
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
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisWeekEvents.length}</div>
              <p className="text-xs text-muted-foreground">Upcoming events</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <p className="text-xs text-muted-foreground">All scheduled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Next Event</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 && (
                <>
                  <div className="text-2xl font-bold">
                    {new Date(upcomingEvents[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <p className="text-xs text-muted-foreground">{upcomingEvents[0].title}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {upcomingEvents.map(renderEvent)}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {thisWeekEvents.length > 0 ? (
              thisWeekEvents.map(renderEvent)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No events scheduled for this week
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            {upcomingEvents.filter(e => e.type === 'meeting').map(renderEvent)}
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            {upcomingEvents.filter(e => e.type === 'milestone').map(renderEvent)}
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  )
}
