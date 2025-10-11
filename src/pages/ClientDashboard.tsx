import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderOpen, 
  MessageSquare, 
  FileText, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  User,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { AdminDashboardSkeleton } from '@/components/loading/DashboardSkeleton';
import { ModernDashboardCard } from '@/components/dashboard/ModernDashboardCard';
import { ClientProjectOverview } from '@/components/client/ClientProjectOverview';
import { ClientMessagingInterface } from '@/components/client/ClientMessagingInterface';
import { ClientFileAccessSystem } from '@/components/client/ClientFileAccessSystem';

export default function ClientDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadClientData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    
    loadClientData();
  }, []);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <User className="w-3 h-3 mr-1" />
            Client
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernDashboardCard
          title="Total Projects"
          value={8}
          icon={FolderOpen}
          trend={{ value: 8, change: 14.3, changeType: 'increase', period: 'vs last quarter' }}
          sparklineData={[5, 6, 7, 7, 8, 8]}
          badge={{ text: '2 active', variant: 'secondary' }}
        />

        <ModernDashboardCard
          title="Completed Projects"
          value={5}
          icon={CheckCircle2}
          trend={{ value: 5, change: 25, changeType: 'increase', period: 'vs last quarter' }}
          sparklineData={[3, 3, 4, 4, 5, 5]}
        />

        <ModernDashboardCard
          title="In Progress"
          value={2}
          icon={Clock}
          trend={{ value: 2, change: 0, changeType: 'neutral', period: 'on track' }}
          sparklineData={[2, 2, 2, 2, 2, 2]}
          badge={{ text: 'On schedule', variant: 'secondary' }}
        />

        <ModernDashboardCard
          title="Unread Messages"
          value={7}
          icon={MessageSquare}
          trend={{ value: 7, change: 16.7, changeType: 'increase', period: 'new today' }}
          sparklineData={[3, 4, 5, 6, 6, 7]}
          badge={{ text: '3 urgent', variant: 'destructive' }}
        />
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>
                  Projects currently in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Office Redesign</p>
                      <p className="text-xs text-muted-foreground mb-2">Commercial Space</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <span className="text-xs font-medium">65%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">In Progress</Badge>
                        <span className="text-xs text-muted-foreground">Due: Dec 30</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Residential Renovation</p>
                      <p className="text-xs text-muted-foreground mb-2">Home Project</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                        <span className="text-xs font-medium">40%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Planning</Badge>
                        <span className="text-xs text-muted-foreground">Due: Jan 15</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>
                  Latest activity on your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New design mockups uploaded</p>
                      <p className="text-xs text-muted-foreground">Office Redesign • 2 hours ago</p>
                    </div>
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Phase 1 completed</p>
                      <p className="text-xs text-muted-foreground">Office Redesign • 1 day ago</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Approval required for changes</p>
                      <p className="text-xs text-muted-foreground">Residential Renovation • 2 days ago</p>
                    </div>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New message from architect</p>
                      <p className="text-xs text-muted-foreground">Office Redesign • 3 days ago</p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-sm">Send Message</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">View Documents</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Schedule Meeting</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <Download className="h-6 w-6" />
                  <span className="text-sm">Download Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Your Account Manager</CardTitle>
              <CardDescription>Get in touch with your dedicated support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground mb-3">Senior Account Manager</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>sarah.johnson@company.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>+27 (0) 11 123 4567</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>Available Mon-Fri, 9AM-5PM</span>
                    </div>
                  </div>
                </div>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
              <CardDescription>Complete list of your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientProjectOverview 
                onViewProject={(projectId) => console.log('View project:', projectId)}
                onMessageTeam={(projectId) => console.log('Message team for project:', projectId)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Communication with your project team</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientMessagingInterface 
                onSendMessage={(conversationId, content) => console.log('Send message:', { conversationId, content })}
                onMarkAsRead={(messageId) => console.log('Mark as read:', messageId)}
                onStartCall={(contactId, type) => console.log('Start call:', { contactId, type })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>All project documents and files</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientFileAccessSystem 
                onDownloadFile={(fileId) => console.log('Download file:', fileId)}
                onPreviewFile={async (fileId) => {
                  console.log('Preview file:', fileId);
                  return `https://via.placeholder.com/800x600/0ea5e9/ffffff?text=File+Preview+${fileId}`;
                }}
                onStarFile={(fileId, starred) => console.log('Star file:', { fileId, starred })}
                onShareFile={(fileId) => console.log('Share file:', fileId)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}