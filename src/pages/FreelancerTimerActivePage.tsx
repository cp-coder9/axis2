import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerTimerWidget } from '@/components/freelancer/FreelancerTimerWidget';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Clock, Target } from 'lucide-react';

export default function FreelancerTimerActivePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Active Timer</h1>
        <p className="text-muted-foreground">
          Track your time in real-time for active projects
        </p>
      </div>

      {/* Timer Widget - Full Focus */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Current Session
          </CardTitle>
          <CardDescription>Start, pause, or stop your active time tracking session</CardDescription>
        </CardHeader>
        <CardContent>
          <FreelancerTimerWidget />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today's Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5 hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across 3 projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.5 hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              5 projects tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-lg">
              Ready to Track
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              No active timer running
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
