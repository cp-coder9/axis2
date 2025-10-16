import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Copy,
    Download,
    Upload,
    Star,
    Users,
    Clock,
    FileText,
    Building,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    Filter,
} from 'lucide-react';
import { ProjectTemplate, JobTemplate, TaskTemplate, User } from '@/types';
import { format } from 'date-fns';

interface ProjectTemplatesProps {
    templates: ProjectTemplate[];
    currentUser: User;
    onCreateTemplate: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
    onUpdateTemplate: (templateId: string, updates: Partial<ProjectTemplate>) => void;
    onDeleteTemplate: (templateId: string) => void;
    onDuplicateTemplate: (templateId: string) => void;
    onApplyTemplate: (templateId: string, projectId: string) => void;
    onExportTemplate: (templateId: string) => void;
    onImportTemplate: (file: File) => void;
    onToggleTemplateVisibility: (templateId: string, isPublic: boolean) => void;
}

type TemplateFilter = 'all' | 'public' | 'private' | 'my-templates';

export const ProjectTemplates: React.FC<ProjectTemplatesProps> = ({
    templates,
    currentUser,
    onCreateTemplate,
    onUpdateTemplate,
    onDeleteTemplate,
    onDuplicateTemplate,
    onApplyTemplate,
    onExportTemplate,
    onImportTemplate,
    onToggleTemplateVisibility,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<TemplateFilter>('all');
    const [sortBy, setSortBy] = useState<'name' | 'updatedAt' | 'usageCount'>('updatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        category: '',
        isPublic: false,
        estimatedDuration: 0,
        estimatedBudget: 0,
    });

    // Filter and sort templates
    const filteredAndSortedTemplates = useMemo(() => {
        let filtered = templates.filter(template => {
            // Search query filter
            if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !template.description.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Filter by visibility and ownership
            switch (filter) {
                case 'public':
                    return template.isPublic;
                case 'private':
                    return !template.isPublic;
                case 'my-templates':
                    return template.createdById === currentUser.id;
                default:
                    return true;
            }
        });

        // Sort templates
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'updatedAt':
                    aValue = a.updatedAt?.toDate().getTime() || 0;
                    bValue = b.updatedAt?.toDate().getTime() || 0;
                    break;
                case 'usageCount':
                    aValue = a.usageCount || 0;
                    bValue = b.usageCount || 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [templates, searchQuery, filter, sortBy, sortOrder, currentUser.id]);

    const handleCreateTemplate = () => {
        if (newTemplate.name.trim()) {
            onCreateTemplate({
                name: newTemplate.name.trim(),
                description: newTemplate.description.trim(),
                category: newTemplate.category,
                isPublic: newTemplate.isPublic,
                estimatedDuration: newTemplate.estimatedDuration,
                estimatedBudget: newTemplate.estimatedBudget,
                createdById: currentUser.id,
                createdByName: currentUser.name,
                jobTemplates: [],
                tags: [],
                usageCount: 0,
            });

            setNewTemplate({
                name: '',
                description: '',
                category: '',
                isPublic: false,
                estimatedDuration: 0,
                estimatedBudget: 0,
            });
            setCreateDialogOpen(false);
        }
    };

    const handleUpdateTemplate = () => {
        if (selectedTemplate && newTemplate.name.trim()) {
            onUpdateTemplate(selectedTemplate.id, {
                name: newTemplate.name.trim(),
                description: newTemplate.description.trim(),
                category: newTemplate.category,
                isPublic: newTemplate.isPublic,
                estimatedDuration: newTemplate.estimatedDuration,
                estimatedBudget: newTemplate.estimatedBudget,
            });

            setEditDialogOpen(false);
            setSelectedTemplate(null);
        }
    };

    const handleEditTemplate = (template: ProjectTemplate) => {
        setSelectedTemplate(template);
        setNewTemplate({
            name: template.name,
            description: template.description || '',
            category: template.category || '',
            isPublic: template.isPublic,
            estimatedDuration: template.estimatedDuration || 0,
            estimatedBudget: template.estimatedBudget || 0,
        });
        setEditDialogOpen(true);
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportTemplate(file);
        }
        // Reset input
        event.target.value = '';
    };

    const TemplateCard: React.FC<{ template: ProjectTemplate }> = ({ template }) => {
        const isOwner = template.createdById === currentUser.id;
        const canEdit = isOwner || currentUser.role === 'ADMIN';

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                {template.isPublic ? (
                                    <Badge variant="secondary" className="text-xs">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Public
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs">
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Private
                                    </Badge>
                                )}
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.description}
                            </p>
                        </div>

                        {canEdit && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => onDuplicateTemplate(template.id)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => onExportTemplate(template.id)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onClick={() => onToggleTemplateVisibility(template.id, !template.isPublic)}
                                    >
                                        {template.isPublic ? (
                                            <>
                                                <EyeOff className="h-4 w-4 mr-2" />
                                                Make Private
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Make Public
                                            </>
                                        )}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                onSelect={(e) => e.preventDefault()}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => onDeleteTemplate(template.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="space-y-3">
                        {/* Template Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{template.jobTemplates?.length || 0} Jobs</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{template.usageCount || 0} Uses</span>
                            </div>

                            {template.estimatedDuration && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{template.estimatedDuration} days</span>
                                </div>
                            )}

                            {template.estimatedBudget && (
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>${template.estimatedBudget.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {template.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Category */}
                        {template.category && (
                            <div className="text-sm text-muted-foreground">
                                Category: {template.category}
                            </div>
                        )}

                        {/* Last Updated */}
                        <div className="text-xs text-muted-foreground">
                            Updated {template.updatedAt ? format(template.updatedAt.toDate(), 'MMM dd, yyyy') : 'Never'}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {/* Open apply dialog */ }}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Apply to Project
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {/* Open preview dialog */ }}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Project Templates
                        </CardTitle>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <label className="cursor-pointer flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Import
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileImport}
                                        className="hidden"
                                    />
                                </label>
                            </Button>

                            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Template
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Create Project Template</DialogTitle>
                                        <DialogDescription>
                                            Create a new project template that can be reused for similar projects.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Template Name</label>
                                            <Input
                                                value={newTemplate.name}
                                                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="e.g., Residential Design Project"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium">Description</label>
                                            <Textarea
                                                value={newTemplate.description}
                                                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Describe what this template is for..."
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium">Category</label>
                                            <Input
                                                value={newTemplate.category}
                                                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                                                placeholder="e.g., Residential, Commercial, Interior"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium">Duration (days)</label>
                                                <Input
                                                    type="number"
                                                    value={newTemplate.estimatedDuration}
                                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Budget ($)</label>
                                                <Input
                                                    type="number"
                                                    value={newTemplate.estimatedBudget}
                                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, estimatedBudget: parseInt(e.target.value) || 0 }))}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="isPublic"
                                                checked={newTemplate.isPublic}
                                                onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                                            />
                                            <label htmlFor="isPublic" className="text-sm">
                                                Make this template public (visible to all team members)
                                            </label>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreateTemplate} disabled={!newTemplate.name.trim()}>
                                                Create Template
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4">
                        {/* Search */}
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Filter */}
                        <Select value={filter} onValueChange={(value: TemplateFilter) => setFilter(value)}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Templates</SelectItem>
                                <SelectItem value="public">Public Only</SelectItem>
                                <SelectItem value="private">Private Only</SelectItem>
                                <SelectItem value="my-templates">My Templates</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <Select value={sortBy} onValueChange={(value: 'name' | 'updatedAt' | 'usageCount') => setSortBy(value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="updatedAt">Last Updated</SelectItem>
                                <SelectItem value="usageCount">Usage Count</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Templates Grid */}
            {filteredAndSortedTemplates.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery || filter !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating your first project template.'
                            }
                        </p>
                        {!searchQuery && filter === 'all' && (
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Template
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedTemplates.map((template) => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            )}

            {/* Edit Template Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Project Template</DialogTitle>
                        <DialogDescription>
                            Update the template details and settings.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Template Name</label>
                            <Input
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Residential Design Project"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={newTemplate.description}
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this template is for..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <Input
                                value={newTemplate.category}
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                                placeholder="e.g., Residential, Commercial, Interior"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Duration (days)</label>
                                <Input
                                    type="number"
                                    value={newTemplate.estimatedDuration}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Budget ($)</label>
                                <Input
                                    type="number"
                                    value={newTemplate.estimatedBudget}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, estimatedBudget: parseInt(e.target.value) || 0 }))}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="editIsPublic"
                                checked={newTemplate.isPublic}
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                            />
                            <label htmlFor="editIsPublic" className="text-sm">
                                Make this template public (visible to all team members)
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTemplate} disabled={!newTemplate.name.trim()}>
                                Update Template
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectTemplates;