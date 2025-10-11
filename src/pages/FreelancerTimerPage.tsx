import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FreelancerTimerWidget } from '@/components/freelancer/FreelancerTimerWidget';
import { Clock, Target, DollarSign, TrendingUp } from 'lucide-react';

export default function FreelancerTimerPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-muted-foreground">
          Track your time across projects and view your activity
        </p>
      </div>

      {/* Timer Widget */}
      <Card>
        <CardHeader>
          <CardTitle>Active Timer</CardTitle>
          <CardDescription>Start and manage your time tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <FreelancerTimerWidget />
        </CardContent>
      </Card>

      {/* Recent Time Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Logs</CardTitle>
          <CardDescription>Your recent time tracking activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent time logs - in real app would fetch from context/API */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Office Redesign Project</p>
                <p className="text-xs text-muted-foreground">Today, 9:00 AM - 12:30 PM</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">3.5 hrs</Badge>
                <p className="text-xs text-muted-foreground mt-1">R 262.50</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Residential Renovation</p>
                <p className="text-xs text-muted-foreground">Yesterday, 2:00 PM - 6:00 PM</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">4.0 hrs</Badge>
                <p className="text-xs text-muted-foreground mt-1">R 300.00</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Commercial Space Design</p>
                <p className="text-xs text-muted-foreground">Dec 15, 10:00 AM - 1:00 PM</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">3.0 hrs</Badge>
                <p className="text-xs text-muted-foreground mt-1">R 225.00</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>Your time tracking statistics for this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">32.5</p>
              <p className="text-xs text-muted-foreground">Hours This Week</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Active Projects</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">R 2,438</p>
              <p className="text-xs text-muted-foreground">Earned This Week</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">R 75</p>
              <p className="text-xs text-muted-foreground">Avg Hourly Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
