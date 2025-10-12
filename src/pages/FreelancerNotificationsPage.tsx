import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, Clock, DollarSign, AlertCircle, Info } from 'lucide-react';

export default function FreelancerNotificationsPage() {
  const notifications = {
    unread: [
      {
        id: '1',
        type: 'project',
        title: 'New Project Assignment',
        message: "You've been assigned to 'Office Redesign' project",
        timestamp: '2 hours ago',
        icon: Briefcase
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        message: 'R 1,500 has been credited to your account',
        timestamp: '4 hours ago',
        icon: DollarSign
      },
      {
        id: '3',
        type: 'time',
        title: 'Time Log Approved',
        message: '45 hours for Residential Renovation has been approved',
        timestamp: '6 hours ago',
        icon: CheckCircle
      }
    ],
    read: [
      {
        id: '4',
        type: 'reminder',
        title: 'Timer Reminder',
        message: "Don't forget to log your time for today",
        timestamp: '1 day ago',
        icon: Clock
      },
      {
        id: '5',
        type: 'info',
        title: 'Profile Update',
        message: 'Your profile has been successfully updated',
        timestamp: '2 days ago',
        icon: Info
      }
    ]
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'text-blue-500';
      case 'payment':
        return 'text-green-500';
      case 'time':
        return 'text-purple-500';
      case 'reminder':
        return 'text-orange-500';
      case 'info':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your projects and activities
          </p>
        </div>
        <Button variant="outline">
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All as Read
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.unread.length}</div>
            <p className="text-xs text-muted-foreground">New notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Notifications today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Important
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Tabs defaultValue="unread" className="space-y-6">
        <TabsList>
          <TabsTrigger value="unread">
            Unread ({notifications.unread.length})
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>New notifications requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.unread.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`mt-1 ${getIconColor(notification.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <Badge variant="secondary">New</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>Complete notification history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...notifications.unread, ...notifications.read].map((notification) => {
                  const Icon = notification.icon;
                  const isUnread = notifications.unread.some(n => n.id === notification.id);
                  return (
                    <div key={notification.id} className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${!isUnread ? 'opacity-60' : ''}`}>
                      <div className={`mt-1 ${getIconColor(notification.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {isUnread && <Badge variant="secondary">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Read Notifications</CardTitle>
              <CardDescription>Previously viewed notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.read.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg opacity-60">
                      <div className={`mt-1 ${getIconColor(notification.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Import Briefcase icon
import { Briefcase } from 'lucide-react';
