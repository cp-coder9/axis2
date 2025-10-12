import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, DollarSign, TrendingUp } from 'lucide-react';

export default function FreelancerEarningsReportsPage() {
  const [reportPeriod, setReportPeriod] = useState('this-month');

  const reports = [
    {
      id: '1',
      title: 'October 2024 Earnings Report',
      period: 'October 2024',
      totalEarnings: 3250,
      hours: 43,
      projects: 4,
      generatedDate: '2024-10-01',
      status: 'ready'
    },
    {
      id: '2',
      title: 'September 2024 Earnings Report',
      period: 'September 2024',
      totalEarnings: 2850,
      hours: 38,
      projects: 3,
      generatedDate: '2024-09-01',
      status: 'ready'
    },
    {
      id: '3',
      title: 'August 2024 Earnings Report',
      period: 'August 2024',
      totalEarnings: 3100,
      hours: 41,
      projects: 5,
      generatedDate: '2024-08-01',
      status: 'ready'
    },
    {
      id: '4',
      title: 'Q3 2024 Quarterly Report',
      period: 'Q3 2024',
      totalEarnings: 9200,
      hours: 122,
      projects: 7,
      generatedDate: '2024-10-01',
      status: 'ready'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Earnings Reports</h1>
          <p className="text-muted-foreground">
            Generate and download detailed earnings reports
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Report Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Quick Stats for Selected Period */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R 3,250</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">43</div>
            <p className="text-xs text-muted-foreground">Billable hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R 75.58</div>
            <p className="text-xs text-muted-foreground">Per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Download your previously generated earnings reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{report.title}</p>
                    <Badge variant="secondary">{report.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generated on {report.generatedDate}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Earnings: R {report.totalEarnings.toLocaleString()}</span>
                    <span>Hours: {report.hours}</span>
                    <span>Projects: {report.projects}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Current Period Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown of earnings for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Billable Hours</p>
                <p className="text-2xl font-bold">43 hrs</p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Average Hourly Rate</p>
                <p className="text-2xl font-bold">R 75.58</p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">R 3,250</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
