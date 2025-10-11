import React from 'react';
import { ShadcnAnalyticsDashboard } from '../../components/admin/ShadcnAnalyticsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../lib/shadcn';

const AnalyticsDashboardDemo: React.FC = () => {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Admin Analytics Dashboard Demo</CardTitle>
          <CardDescription>
            Showcasing the migrated analytics dashboard using shadcn/ui components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Migration Status:</strong> ✅ Complete
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Components Used:</strong> Cards, Tables, Charts, Tabs, Badges
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Chart Library:</strong> Recharts + shadcn/ui
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Features:</strong> KPIs, Trends, Export, Performance Metrics
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Role Access:</strong> Admin & Freelancer only
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Real-time:</strong> Data updates with context changes
              </div>
            </div>
            
            <div className="border-l-4 border-primary pl-4">
              <p className="text-muted-foreground">
                This demo shows the fully migrated analytics dashboard with shadcn/ui components.
                The component includes KPI cards, interactive charts using Recharts, tabbed navigation,
                data export functionality, and role-based access control.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The actual analytics dashboard */}
      <ShadcnAnalyticsDashboard />
    </div>
  );
};

export default AnalyticsDashboardDemo;
