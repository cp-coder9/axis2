import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    MoreHorizontal,
    Plus,
    Edit,
    Trash2,
    Eye,
    Users,
    Calendar,
    DollarSign,
    Filter,
    Grid,
    List,
    Building,
} from 'lucide-react';
import { Project, ProjectStatus, User } from '@/types';
import { format } from 'date-fns';

export interface ProjectsListProps {
    projects: Project[];
    currentUser: User;
    onCreateProject: () => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onViewProject: (project: Project) => void;
    onDuplicateProject?: (project: Project) => void;
    isLoading?: boolean;
}

type ViewMode = 'grid' | 'list';

export const ProjectsList: React.FC<ProjectsListProps> = ({
    projects,
    currentUser,
    onCreateProject,
    onEditProject,
    onDeleteProject,
    onViewProject,
    onDuplicateProject,
    isLoading = false,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'status'>('updated');

    // Filter and sort projects
    const filteredAndSortedProjects = useMemo(() => {
        let filtered = projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sort projects
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'updated':
                    return (b.updatedAt?.toDate?.()?.getTime() || 0) - (a.updatedAt?.toDate?.()?.getTime() || 0);
                case 'created':
                    return (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0);
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [projects, searchTerm, statusFilter, sortBy]);

    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case ProjectStatus.ACTIVE:
                return 'bg-green-100 text-green-800';
            case ProjectStatus.COMPLETED:
                return 'bg-blue-100 text-blue-800';
            case ProjectStatus.ON_HOLD:
                return 'bg-yellow-100 text-yellow-800';
            case ProjectStatus.CANCELLED:
                return 'bg-red-100 text-red-800';
            case ProjectStatus.DRAFT:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold truncate">
                            {project.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewProject(project)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditProject(project)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Project
                            </DropdownMenuItem>
                            {onDuplicateProject && (
                                <DropdownMenuItem onClick={() => onDuplicateProject(project)}>
                                    <Building className="h-4 w-4 mr-2" />
                                    Duplicate
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDeleteProject(project.id)}
                                className="text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                        </Badge>
                        {project.priority && (
                            <Badge variant="outline">
                                {project.priority}
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{project.clientName || 'No Client'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{project.assignedTeamIds?.length || 0} members</span>
                        </div>
                        {project.budget && (
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>{formatCurrency(project.budget)}</span>
                            </div>
                        )}
                        {project.deadline && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{format(project.deadline.toDate(), 'MMM dd')}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Updated {project.updatedAt ? format(project.updatedAt.toDate(), 'MMM dd, yyyy') : 'Never'}
                        </span>
                        <span>
                            {project.totalJobs || 0} jobs, {project.totalJobs || 0} tasks
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const ProjectListItem: React.FC<{ project: Project }> = ({ project }) => (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
            <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{project.clientName || 'No Client'}</span>
                        <span>{project.assignedTeamIds?.length || 0} members</span>
                        {project.budget && <span>{formatCurrency(project.budget)}</span>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ')}
                </Badge>

                <div className="text-sm text-muted-foreground">
                    {project.updatedAt ? format(project.updatedAt.toDate(), 'MMM dd') : 'Never'}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewProject(project)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditProject(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                        </DropdownMenuItem>
                        {onDuplicateProject && (
                            <DropdownMenuItem onClick={() => onDuplicateProject(project)}>
                                <Building className="h-4 w-4 mr-2" />
                                Duplicate
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDeleteProject(project.id)}
                            className="text-red-600"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Projects</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-3 bg-muted rounded"></div>
                                    <div className="h-3 bg-muted rounded w-2/3"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Projects</h2>
                <Button onClick={onCreateProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="updated">Last Updated</SelectItem>
                        <SelectItem value="created">Date Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-l-none"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Projects Display */}
            {filteredAndSortedProjects.length === 0 ? (
                <div className="text-center py-12">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Get started by creating your first project'
                        }
                    </p>
                    <Button onClick={onCreateProject}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                    </Button>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSortedProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAndSortedProjects.map((project) => (
                                <ProjectListItem key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectsList;