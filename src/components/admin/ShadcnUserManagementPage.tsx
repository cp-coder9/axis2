import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAppContext } from '../../contexts/AppContext';
import { User, UserRole } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { getRate, formatRate } from '../../../utils/rateCalculationUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Separator,
  cn
} from '../../lib/shadcn';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  MoreHorizontal,
  Shield,
  Briefcase,
  UserCheck,
  Phone,
  Mail,
  Building,
  Clock,
  DollarSign,
  Settings
} from 'lucide-react';

interface ShadcnUserManagementPageProps {
  className?: string;
}

export const ShadcnUserManagementPage: React.FC<ShadcnUserManagementPageProps> = ({ className = '' }) => {
  const { user, users, projects, deleteUser } = useAppContext();
  const navigate = useNavigate();
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [clientToView, setClientToView] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const usersWithProjectCount = useMemo(() => {
    return users.map(u => ({
      ...u,
      projectCount: projects.filter(p => p.assignedTeamIds?.includes(u.id)).length,
    }));
  }, [users, projects]);

  const filteredUsers = useMemo(() => {
    let filtered = usersWithProjectCount;
    
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (activeTab !== 'all') {
      filtered = filtered.filter(u => u.role === activeTab);
    }

    return filtered;
  }, [usersWithProjectCount, searchTerm, activeTab]);

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to view this page. Admin access required.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    // This will be handled by AlertDialog
    deleteUser(userId);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'default';
      case UserRole.FREELANCER:
        return 'secondary';
      case UserRole.CLIENT:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getSkillTags = (user: User) => {
    return user.skills || [];
  };

  const getCompanyName = (user: User) => {
    return user.company || 'Not specified';
  };

  const getPhoneNumber = (user: User) => {
    return user.phone || 'Not provided';
  };

  const getUserRateDisplay = (user: User) => {
    if (user.role === UserRole.FREELANCER) {
      return formatRate(user.hourlyRate);
    }
    return getRate(user.role);
  };

  const handleActivateAccount = async (userToActivate: User) => {
    if (!userToActivate.tempPassword) {
      alert('No temporary password found for this user.');
      return;
    }

    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, userToActivate.email, userToActivate.tempPassword || 'TempPass123!');

      const userRef = doc(db, 'users', userToActivate.id);
      await updateDoc(userRef, {
        accountStatus: 'active',
        tempPassword: null
      });

      alert(`Account activated for ${userToActivate.name}!`);
    } catch (authError) {
      console.error('Error creating Firebase Auth account:', authError);
      alert('Failed to activate account. Please try again.');
    }
  };

  const getUserCounts = () => {
    const counts = {
      total: users.length,
      admin: users.filter(u => u.role === UserRole.ADMIN).length,
      freelancer: users.filter(u => u.role === UserRole.FREELANCER).length,
      client: users.filter(u => u.role === UserRole.CLIENT).length,
      pending: users.filter(u => u.accountStatus === 'pending_activation').length
    };
    return counts;
  };

  const userCounts = getUserCounts();

  const renderUserActions = (u: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {u.accountStatus === 'pending_activation' && (
          <DropdownMenuItem onClick={() => handleActivateAccount(u)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Activate Account
          </DropdownMenuItem>
        )}
        
        {u.role === UserRole.CLIENT && (
          <DropdownMenuItem onClick={() => setClientToView(u)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => setUserToEdit(u)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {u.name} and remove them from all projects and tasks.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteUser(u.id, u.name)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderUsersTable = (usersList: User[]) => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            {usersList.some(u => u.role === UserRole.FREELANCER) && <TableHead>Rate</TableHead>}
            {usersList.some(u => u.role === UserRole.FREELANCER) && <TableHead>Skills</TableHead>}
            {usersList.some(u => u.role === UserRole.CLIENT) && <TableHead>Industry</TableHead>}
            <TableHead>Last Seen</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersList.map((u) => {
            const skills = getSkillTags(u);
            const displayInfo = {
              companyName: u.onboarding?.companyInfo?.companyName || u.company || 'Not specified',
              industry: u.onboarding?.companyInfo?.industry || 'Not specified'
            };
            
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatarUrl} alt={u.name} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      {u.title && <div className="text-sm text-muted-foreground">{u.title}</div>}
                      <Badge variant={getRoleBadgeVariant(u.role)} className="mt-1">
                        {u.role}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="mr-1 h-3 w-3" />
                      {u.email}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="mr-1 h-3 w-3" />
                      {getPhoneNumber(u)}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Building className="mr-1 h-3 w-3" />
                    {displayInfo.companyName}
                  </div>
                </TableCell>
                
                {usersList.some(user => user.role === UserRole.FREELANCER) && (
                  <TableCell>
                    {u.role === UserRole.FREELANCER && (
                      <div className="flex items-center text-sm font-medium">
                        <DollarSign className="mr-1 h-3 w-3" />
                        {getUserRateDisplay(u)}
                      </div>
                    )}
                  </TableCell>
                )}
                
                {usersList.some(user => user.role === UserRole.FREELANCER) && (
                  <TableCell>
                    {u.role === UserRole.FREELANCER && (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {skills.length > 0 ? skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        )) : (
                          <span className="text-sm text-muted-foreground">No skills</span>
                        )}
                        {skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                )}
                
                {usersList.some(user => user.role === UserRole.CLIENT) && (
                  <TableCell>
                    {u.role === UserRole.CLIENT && (
                      <div className="text-sm">{displayInfo.industry}</div>
                    )}
                  </TableCell>
                )}
                
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {u.lastSeen ? formatDistanceToNow(u.lastSeen.toDate(), { addSuffix: true }) : 'Never'}
                  </div>
                </TableCell>
                
                <TableCell>
                  {u.accountStatus === 'pending_activation' ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      Pending
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  {renderUserActions(u)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage system users, roles, and permissions
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddUserModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userCounts.total}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userCounts.admin}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userCounts.freelancer}</div>
              <div className="text-sm text-muted-foreground">Freelancers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userCounts.client}</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{userCounts.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name, email, role, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Users ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value={UserRole.ADMIN}>
            Admins ({filteredUsers.filter(u => u.role === UserRole.ADMIN).length})
          </TabsTrigger>
          <TabsTrigger value={UserRole.FREELANCER}>
            Freelancers ({filteredUsers.filter(u => u.role === UserRole.FREELANCER).length})
          </TabsTrigger>
          <TabsTrigger value={UserRole.CLIENT}>
            Clients ({filteredUsers.filter(u => u.role === UserRole.CLIENT).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredUsers.length > 0 ? (
            renderUsersTable(filteredUsers)
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first user.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value={UserRole.ADMIN} className="space-y-4">
          {renderUsersTable(filteredUsers.filter(u => u.role === UserRole.ADMIN))}
        </TabsContent>

        <TabsContent value={UserRole.FREELANCER} className="space-y-4">
          {renderUsersTable(filteredUsers.filter(u => u.role === UserRole.FREELANCER))}
        </TabsContent>

        <TabsContent value={UserRole.CLIENT} className="space-y-4">
          {renderUsersTable(filteredUsers.filter(u => u.role === UserRole.CLIENT))}
        </TabsContent>
      </Tabs>

      {/* Modals - These would need to be migrated separately */}
      {/* TODO: Migrate EditUserModal, AddUserModal, ClientDetailModal to shadcn/ui */}
    </div>
  );
};

export default ShadcnUserManagementPage;
