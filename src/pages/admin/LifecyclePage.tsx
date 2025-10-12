import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function LifecyclePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Lifecycle</h1>
          <p className="text-muted-foreground">
            Manage project stages and workflow processes
          </p>
        </div>
        <Button>
          <Activity className="w-4 h-4 mr-2" />
          View Analytics
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planning</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Circle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Review</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle Stages */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="closure">Closure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Overview</CardTitle>
              <CardDescription>
                Track projects through all stages of development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { stage: 'Planning', count: 5, status: 'active', color: 'blue' },
                  { stage: 'Design', count: 3, status: 'active', color: 'purple' },
                  { stage: 'Development', count: 8, status: 'active', color: 'yellow' },
                  { stage: 'Testing', count: 2, status: 'active', color: 'orange' },
                  { stage: 'Deployment', count: 1, status: 'active', color: 'green' },
                ].map((item) => (
                  <div key={item.stage} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full bg-${item.color}-500`}></div>
                      <div>
                        <p className="font-medium">{item.stage}</p>
                        <p className="text-sm text-muted-foreground">{item.count} active projects</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning">
          <Card>
            <CardHeader>
              <CardTitle>Planning Phase</CardTitle>
              <CardDescription>Projects in planning stage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Planning phase projects will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution">
          <Card>
            <CardHeader>
              <CardTitle>Execution Phase</CardTitle>
              <CardDescription>Projects in execution stage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Execution phase projects will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closure">
          <Card>
            <CardHeader>
              <CardTitle>Closure Phase</CardTitle>
              <CardDescription>Projects nearing completion</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Closure phase projects will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
