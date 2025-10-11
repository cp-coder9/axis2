import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Target,
  Award,
  Activity,
  FileText,
  MessageSquare
} from 'lucide-react';
import { AdminDashboardSkeleton } from '@/components/loading/DashboardSkeleton';
import { ModernDashboardCard, AnimatedStatCard } from '@/components/dashboard/ModernDashboardCard';

export default function FreelancerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const loadFreelancerData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    
    loadFreelancerData();
  }, []);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground">
            Track your projects, time, and earnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={timerRunning ? "destructive" : "default"}
            onClick={() => setTimerRunning(!timerRunning)}
          >
            {timerRunning ? (
              <>
                <PauseCircle className="w-4 h-4 mr-2" />
                Stop Timer
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Timer
              </>
            )}
          </Button>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Briefcase className="w-3 h-3 mr-1" />
            Freelancer
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernDashboardCard
          title="Active Projects"
          value={5}
          icon={Briefcase}
          trend={{ value: 5, change: 25, changeType: 'increase', period: 'vs last month' }}
          sparklineData={[3, 4, 4, 5, 5, 5]}
          badge={{ text: '2 new', variant: 'secondary' }}
        />

        <ModernDashboardCard
          title="Hours This Week"
          value={32.5}
          icon={Clock}
          trend={{ value: 32.5, change: 8.3, changeType: 'increase', period: 'vs last week' }}
          sparklineData={[28, 29, 30, 31, 32, 32.5]}
        />

        <ModernDashboardCard
          title="Earnings This Month"
          value="R 45,200"
          icon={DollarSign}
          trend={{ value: 45200, change: 15.2, changeType: 'increase', period: 'vs last month' }}
          sparklineData={[38000, 40000, 42000, 43000, 44000, 45200]}
        />

        <ModernDashboardCard
          title="Completion Rate"
          value="94%"
          icon={Target}
          trend={{ value: 94, change: 2, changeType: 'increase', period: 'vs last month' }}
          sparklineData={[90, 91, 92, 93, 93, 94]}
          badge={{ text: 'Excellent', variant: 'secondary' }}
        />
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Current Tasks</CardTitle>
                <CardDescription>
                  Tasks you're working on today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Design Homepage Mockup</p>
                      <p className="text-xs text-muted-foreground">Office Redesign Project</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Design</Badge>
                        <span className="text-xs text-muted-foreground">Due: Today</span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>

                  <div className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Client Review Meeting</p>
                      <p className="text-xs text-muted-foreground">Residential Project</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Meeting</Badge>
                        <span className="text-xs text-muted-foreground">2:00 PM</span>
                      </div>
                    </div>
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>

                  <div className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Update Project Documentation</p>
                      <p className="text-xs text-muted-foreground">Commercial Space</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Documentation</Badge>
                        <span className="text-xs text-muted-foreground">Due: Tomorrow</span>
                      </div>
                    </div>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Your performance this month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatedStatCard
                  label="Tasks Completed"
                  value={28}
                  icon={CheckCircle2}
                  color="success"
                  trend={{ value: 28, change: 16.7, changeType: 'increase' }}
                />
                
                <AnimatedStatCard
                  label="Client Satisfaction"
                  value={4.8}
                  suffix="/5.0"
                  icon={Award}
                  color="primary"
                  trend={{ value: 4.8, change: 4.3, changeType: 'increase' }}
                />
                
                <AnimatedStatCard
                  label="Response Time"
                  value={2.5}
                  suffix="hrs"
                  icon={Activity}
                  color="info"
                  trend={{ value: 2.5, change: 15, changeType: 'decrease' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <CardTitle>This Week's Overview</CardTitle>
              <CardDescription>Your activity and progress this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-xs text-muted-foreground">Days Active</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">32.5</p>
                  <p className="text-xs text-muted-foreground">Hours Logged</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>All projects you're currently working on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Project list will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>Track your time across projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Time tracking interface will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <CardDescription>Your earnings and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Earnings details will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}