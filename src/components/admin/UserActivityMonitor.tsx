import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/contexts/AppContext';
import { User, UserRole, AuditAction } from '@/types';
import { Activity, Clock, TrendingUp, Users } from 'lucide-react';
import { formatDistanceToNow, format, subDays, isAfter } from 'date-fns';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: Timestamp;
}

interface UserActivityStats {
  userId: string;
  userName: string;
  userRole: UserRole;
  activityCount: number;
  lastActivity: Date | null;
  mostCommonAction: string;
}

export const UserActivityMonitor: React.FC = () => {
  const { users } = useAppContext();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Load activity logs from Firestore
  useEffect(() => {
    const loadActivityLogs = async () => {
      setLoading(true);
      try {
        const cutoffDate = subDays(new Date(), timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30);
        
        const auditQuery = query(
          collection(db, 'auditLogs'),
          where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
          orderBy('timestamp', 'desc'),
          limit(100)
        );

        const snapshot = await getDocs(auditQuery);
        const logs: ActivityLog[] = [];
        
        snapshot.forEach((doc) => {
          logs.push(doc.data() as ActivityLog);
        });

        setActivityLogs(logs);
      } catch (error) {
        console.error('Error loading activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivityLogs();
  }, [timeRange]);

  // Calculate user activity statistics
  const userActivityStats = useMemo(() => {
    const statsMap = new Map<string, UserActivityStats>();

    // Initialize stats for all users
    users.forEach(user => {
      let lastActivity: Date | null = null;
      if (user.lastActive) {
        try {
          lastActivity = typeof user.lastActive === 'object' && 'toDate' in user.lastActive
            ? user.lastActive.toDate()
            : new Date(user.lastActive);
          
          if (isNaN(lastActivity.getTime())) {
            lastActivity = null;
          }
        } catch (error) {
          console.error('Error parsing lastActive for user:', user.id, error);
          lastActivity = null;
        }
      }
      
      statsMap.set(user.id, {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        activityCount: 0,
        lastActivity,
        mostCommonAction: 'None',
      });
    });

    // Count activities per user
    const actionCounts = new Map<string, Map<string, number>>();
    
    activityLogs.forEach(log => {
      const stats = statsMap.get(log.userId);
      if (stats) {
        stats.activityCount++;
        
        // Track action counts for this user
        if (!actionCounts.has(log.userId)) {
          actionCounts.set(log.userId, new Map());
        }
        const userActions = actionCounts.get(log.userId)!;
        userActions.set(log.action, (userActions.get(log.action) || 0) + 1);
      }
    });

    // Determine most common action for each user
    actionCounts.forEach((actions, userId) => {
      const stats = statsMap.get(userId);
      if (stats) {
        let maxCount = 0;
        let mostCommon = 'None';
        
        actions.forEach((count, action) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommon = action;
          }
        });
        
        stats.mostCommonAction = mostCommon;
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.activityCount - a.activityCount);
  }, [users, activityLogs]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const activeUsers = userActivityStats.filter(stat => stat.activityCount > 0).length;
    const totalActivities = activityLogs.length;
    const avgActivitiesPerUser = activeUsers > 0 ? (totalActivities / activeUsers).toFixed(1) : '0';

    return {
      activeUsers,
      totalActivities,
      avgActivitiesPerUser,
    };
  }, [userActivityStats, activityLogs]);

  const getActionBadgeColor = (action: string): string => {
    if (action.includes('TIMER')) return 'bg-blue-50 text-blue-700';
    if (action.includes('PROJECT')) return 'bg-green-50 text-green-700';
    if (action.includes('USER')) return 'bg-purple-50 text-purple-700';
    if (action.includes('FILE')) return 'bg-orange-50 text-orange-700';
    return 'bg-gray-50 text-gray-700';
  };

  const formatActionName = (action: string): string => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{overallStats.activeUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  in last {timeRange === '24h' ? '24 hours' : timeRange === '7d' ? '7 days' : '30 days'}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{overallStats.totalActivities}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  tracked actions
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg per User</p>
                <p className="text-2xl font-bold">{overallStats.avgActivitiesPerUser}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  activities per active user
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Activity Overview</CardTitle>
              <CardDescription>
                Monitor user engagement and activity patterns
              </CardDescription>
            </div>
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as '24h' | '7d' | '30d')}
            >
              <SelectTrigger className="w-[180px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Activity Count</TableHead>
                  <TableHead>Most Common Action</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading activity data...
                    </TableCell>
                  </TableRow>
                ) : userActivityStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No activity data available
                    </TableCell>
                  </TableRow>
                ) : (
                  userActivityStats.map((stat) => (
                    <TableRow key={stat.userId}>
                      <TableCell>
                        <p className="font-medium">{stat.userName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stat.userRole}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{stat.activityCount}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(stat.mostCommonAction)}>
                          {formatActionName(stat.mostCommonAction)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stat.lastActivity
                          ? formatDistanceToNow(stat.lastActivity, { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
          <CardDescription>
            Latest user actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading recent activities...
                    </TableCell>
                  </TableRow>
                ) : activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No recent activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  activityLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {formatActionName(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{log.resourceType}:</span>{' '}
                        {log.resourceId.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(log.timestamp.toDate(), 'MMM d, HH:mm:ss')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
