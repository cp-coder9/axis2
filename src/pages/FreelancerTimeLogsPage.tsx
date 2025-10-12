import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, DollarSign, Search, Download } from 'lucide-react';

export default function FreelancerTimeLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');

  // Mock time log data
  const timeLogs = [
    {
      id: '1',
      projectName: 'Office Redesign',
      date: '2024-10-12',
      startTime: '09:00 AM',
      endTime: '12:30 PM',
      duration: 3.5,
      hourlyRate: 75,
      total: 262.50,
      status: 'approved'
    },
    {
      id: '2',
      projectName: 'Residential Renovation',
      date: '2024-10-11',
      startTime: '02:00 PM',
      endTime: '06:00 PM',
      duration: 4.0,
      hourlyRate: 75,
      total: 300.00,
      status: 'approved'
    },
    {
      id: '3',
      projectName: 'Commercial Space Design',
      date: '2024-10-10',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      duration: 3.0,
      hourlyRate: 75,
      total: 225.00,
      status: 'pending'
    },
    {
      id: '4',
      projectName: 'Office Redesign',
      date: '2024-10-09',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      duration: 8.0,
      hourlyRate: 75,
      total: 600.00,
      status: 'approved'
    },
    {
      id: '5',
      projectName: 'Retail Store Design',
      date: '2024-10-08',
      startTime: '01:00 PM',
      endTime: '04:30 PM',
      duration: 3.5,
      hourlyRate: 75,
      total: 262.50,
      status: 'approved'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Logs</h1>
          <p className="text-muted-foreground">
            View and manage your historical time entries
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22.0 hrs</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R 1,650</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R 75</div>
            <p className="text-xs text-muted-foreground">Per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Time Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by project name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="office">Office Redesign</SelectItem>
                <SelectItem value="residential">Residential Renovation</SelectItem>
                <SelectItem value="commercial">Commercial Space Design</SelectItem>
                <SelectItem value="retail">Retail Store Design</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Time Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
          <CardDescription>Your time tracking history with status and earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{log.projectName}</p>
                    <Badge variant={log.status === 'approved' ? 'default' : 'secondary'}>
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.date} • {log.startTime} - {log.endTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{log.duration} hrs</p>
                  <p className="text-xs text-muted-foreground">R {log.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
