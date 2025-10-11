import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { User, UserRole } from '@/types';
import { Users, UserPlus, Shield, Activity, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RoleManagementPanelProps {
  onCreateUser?: () => void;
  onEditUser?: (user: User) => void;
}

export const RoleManagementPanel: React.FC<RoleManagementPanelProps> = ({
  onCreateUser,
  onEditUser,
}) => {
  const { users, authState } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Calculate role statistics
  const roleStats = useMemo(() => {
    const stats = {
      [UserRole.ADMIN]: 0,
      [UserRole.FREELANCER]: 0,
      [UserRole.CLIENT]: 0,
      total: users.length,
    };

    users.forEach(user => {
      if (user.role in stats) {
        stats[user.role]++;
      }
    });

    return stats;
  }, [users]);

  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case UserRole.ADMIN:
        return 'default';
      case UserRole.FREELANCER:
        return 'secondary';
      case UserRole.CLIENT:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'text-blue-600 bg-blue-50';
      case UserRole.FREELANCER:
        return 'text-green-600 bg-green-50';
      case UserRole.CLIENT:
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{roleStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{roleStats[UserRole.ADMIN]}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Freelancers</p>
                <p className="text-2xl font-bold">{roleStats[UserRole.FREELANCER]}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{roleStats[UserRole.CLIENT]}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions across the platform
              </CardDescription>
            </div>
            {onCreateUser && (
              <Button onClick={onCreateUser} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as UserRole | 'ALL')}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={UserRole.FREELANCER}>Freelancer</SelectItem>
                <SelectItem value={UserRole.CLIENT}>Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.company || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(() => {
                          if (!user.lastActive) return 'Never';
                          try {
                            const date = typeof user.lastActive === 'object' && 'toDate' in user.lastActive
                              ? user.lastActive.toDate()
                              : new Date(user.lastActive);
                            
                            if (isNaN(date.getTime())) return 'Invalid date';
                            
                            return formatDistanceToNow(date, { addSuffix: true });
                          } catch (error) {
                            console.error('Error formatting lastActive:', error, user.lastActive);
                            return 'Unknown';
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        {onEditUser && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditUser(user)}
                          >
                            Edit
                          </Button>
                        )}
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
