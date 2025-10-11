import React, { useState, useEffect } from 'react'
import { User, UserRole, AuditAction } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Shield,
  User as UserIcon,
  Trash2,
  UserX,
  FileText,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface ProfileAuditEntry {
  id: string
  action: AuditAction
  performedBy: string
  performedByName: string
  targetUserId: string
  targetUserName: string
  timestamp: Date
  details: {
    reason?: string
    dataExported?: boolean
    gdprCompliant?: boolean
    retentionPeriod?: number
    ipAddress?: string
    userAgent?: string
  }
}

interface ProfileAuditTrailProps {
  targetUser: User
  currentUser: User
}

export function ProfileAuditTrail({ targetUser, currentUser }: ProfileAuditTrailProps) {
  const [auditLogs, setAuditLogs] = useState<ProfileAuditEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ProfileAuditEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Check if user can view audit logs (admin only)
  const canViewAuditLogs = currentUser.role === UserRole.ADMIN

  useEffect(() => {
    if (canViewAuditLogs) {
      loadAuditLogs()
    }
  }, [targetUser.id, canViewAuditLogs])

  useEffect(() => {
    filterLogs()
  }, [auditLogs, searchTerm, actionFilter, dateFilter])

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true)
      
      // In a real implementation, this would fetch from Firestore
      // For now, we'll load from localStorage and generate some mock data
      const storedLogs = JSON.parse(localStorage.getItem('profileAuditLogs') || '[]')
      
      // Generate some mock audit entries for demonstration
      const mockLogs: ProfileAuditEntry[] = [
        {
          id: 'audit_1',
          action: AuditAction.USER_CREATED,
          performedBy: 'system',
          performedByName: 'System',
          targetUserId: targetUser.id,
          targetUserName: targetUser.name,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          details: {
            reason: 'Account creation',
            gdprCompliant: true,
            ipAddress: '192.168.1.100'
          }
        },
        {
          id: 'audit_2',
          action: AuditAction.USER_UPDATED,
          performedBy: targetUser.id,
          performedByName: targetUser.name,
          targetUserId: targetUser.id,
          targetUserName: targetUser.name,
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          details: {
            reason: 'Profile information updated',
            gdprCompliant: true,
            ipAddress: '192.168.1.101'
          }
        }
      ]

      // Combine stored logs with mock logs
      const allLogs = [...storedLogs, ...mockLogs]
        .filter(log => log.targetUserId === targetUser.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setAuditLogs(allLogs)
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = auditLogs

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by action
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case '24h':
          filterDate.setDate(now.getDate() - 1)
          break
        case '7d':
          filterDate.setDate(now.getDate() - 7)
          break
        case '30d':
          filterDate.setDate(now.getDate() - 30)
          break
        case '90d':
          filterDate.setDate(now.getDate() - 90)
          break
      }
      
      filtered = filtered.filter(log => new Date(log.timestamp) >= filterDate)
    }

    setFilteredLogs(filtered)
  }

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case AuditAction.USER_CREATED:
        return <UserIcon className="h-4 w-4 text-green-600" />
      case AuditAction.USER_UPDATED:
        return <FileText className="h-4 w-4 text-blue-600" />
      case AuditAction.USER_DELETED:
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <History className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case AuditAction.USER_CREATED:
        return <Badge variant="default">Created</Badge>
      case AuditAction.USER_UPDATED:
        return <Badge variant="secondary">Updated</Badge>
      case AuditAction.USER_DELETED:
        return <Badge variant="destructive">Deleted</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const exportAuditLogs = () => {
    try {
      const exportData = {
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email
        },
        auditLogs: filteredLogs,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.id,
        totalEntries: filteredLogs.length
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${targetUser.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Audit logs exported successfully')
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      toast.error('Failed to export audit logs')
    }
  }

  if (!canViewAuditLogs) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Audit Trail Access Restricted
          </CardTitle>
          <CardDescription>
            Only administrators can view audit trails for security and compliance purposes.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Audit Trail Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Profile Audit Trail
          </CardTitle>
          <CardDescription>
            Complete history of profile management actions for {targetUser.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredLogs.length} of {auditLogs.length} entries shown
            </div>
            <Button variant="outline" size="sm" onClick={exportAuditLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="Search-input">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="Action-input">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value={AuditAction.USER_CREATED}>User Created</SelectItem>
                  <SelectItem value={AuditAction.USER_UPDATED}>User Updated</SelectItem>
                  <SelectItem value={AuditAction.USER_DELETED}>User Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="Time Period-input">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries</CardTitle>
          <CardDescription>
            Chronological list of all profile management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading audit logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No audit entries found</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <div key={log.id}>
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getActionBadge(log.action)}
                            <span className="text-sm font-medium">{log.performedByName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.details.reason || `${log.action.replace('_', ' ').toLowerCase()}`}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {log.details.gdprCompliant && (
                            <Badge variant="outline" className="text-xs">
                              GDPR Compliant
                            </Badge>
                          )}
                          {log.details.dataExported && (
                            <Badge variant="outline" className="text-xs">
                              Data Exported
                            </Badge>
                          )}
                          {log.details.ipAddress && (
                            <span className="text-muted-foreground">
                              IP: {log.details.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < filteredLogs.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}