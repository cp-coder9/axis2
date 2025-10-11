import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FreelancerProjectApplicationWidget } from '@/components/freelancer/FreelancerProjectApplicationWidget';
import { Briefcase } from 'lucide-react';

export default function FreelancerApplicationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Project Applications</h1>
        <p className="text-muted-foreground">
          Browse available projects and manage your applications
        </p>
      </div>

      {/* Application Widget */}
      <FreelancerProjectApplicationWidget />
    </div>
  );
}
