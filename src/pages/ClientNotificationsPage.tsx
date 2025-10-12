import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell,
  FileText,
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info,
  X
} from 'lucide-react'
import { useState } from 'react'

interface Notification {
  id: string
  type: 'message' | 'document' | 'milestone' | 'meeting' | 'alert' | 'info'
  title: string
  description: string
  project?: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'New Message from Sarah Johnson',
    description: 'Replied to your comment on the villa design',
    project: 'Modern Villa Design',
    timestamp: '2024-10-12T10:30:00',
    read: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'document',
    title: 'New Document Uploaded',
    description: 'Floor_Plans_v3.pdf has been added to your project',
    project: 'Corporate Office Renovation',
    timestamp: '2024-10-12T09:15:00',
    read: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Meeting Reminder',
    description: 'Design Review Meeting starting in 2 hours',
    project: 'Modern Villa Design',
    timestamp: '2024-10-12T08:00:00',
    read: false,
    priority: 'high'
  },
  {
    id: '4',
    type: 'milestone',
    title: 'Milestone Completed',
    description: 'Material Selection phase has been completed',
    project: 'Modern Villa Design',
    timestamp: '2024-10-11T16:45:00',
    read: true,
    priority: 'medium'
  },
  {
    id: '5',
    type: 'alert',
    title: 'Budget Update Required',
    description: 'Please review and approve the updated budget',
    project: 'Corporate Office Renovation',
    timestamp: '2024-10-11T14:20:00',
    read: true,
    priority: 'high'
  },
  {
    id: '6',
    type: 'info',
    title: 'Project Status Update',
    description: 'Weekly progress report is now available',
    project: 'Modern Villa Design',
    timestamp: '2024-10-11T10:00:00',
    read: true,
    priority: 'low'
  },
  {
    id: '7',
    type: 'document',
    title: 'Document Shared',
    description: 'Timeline_Update.pdf has been shared with you',
    project: 'Modern Villa Design',
    timestamp: '2024-10-10T15:30:00',
    read: true,
    priority: 'low'
  }
]

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Notifications", isActive: true }
  ]

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5" />
      case 'document':
        return <FileText className="h-5 w-5" />
      case 'milestone':
        return <CheckCircle2 className="h-5 w-5" />
      case 'meeting':
        return <Calendar className="h-5 w-5" />
      case 'alert':
        return <AlertCircle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'bg-purple-100 text-purple-600'
      case 'document':
        return 'bg-blue-100 text-blue-600'
      case 'milestone':
        return 'bg-green-100 text-green-600'
      case 'meeting':
        return 'bg-orange-100 text-orange-600'
      case 'alert':
        return 'bg-red-100 text-red-600'
      case 'info':
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getPriorityBadge = (priority: Notification['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    }
    return colors[priority]
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  const renderNotification = (notification: Notification) => (
    <Card key={notification.id} className={!notification.read ? 'border-l-4 border-l-blue-500' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  {!notification.read && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      New
                    </Badge>
                  )}
                  <Badge className={getPriorityBadge(notification.priority)}>
                    {notification.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                {notification.project && (
                  <Badge variant="outline" className="text-xs">
                    {notification.project}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(notification.timestamp)}
                </span>
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your project activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">All Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">Total notifications</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {notifications.filter(n => n.priority === 'high' && !n.read).length}
              </div>
              <p className="text-xs text-muted-foreground">Urgent items</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => {
                  const notifDate = new Date(n.timestamp)
                  const today = new Date()
                  return notifDate.toDateString() === today.toDateString()
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Today's updates</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map(renderNotification)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No notifications
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map(renderNotification)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No unread notifications
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            {readNotifications.length > 0 ? (
              readNotifications.map(renderNotification)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No read notifications
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  )
}
