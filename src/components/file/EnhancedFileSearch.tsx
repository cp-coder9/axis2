import React, { useState, useEffect, useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Tag,
  Folder,
  FileText,
  Image,
  Archive,
  File,
  SortAsc,
  SortDesc,
  Grid,
  List,
} from 'lucide-react';
import { ProjectFile, User as UserType, FileCategory } from '@/types';
import { formatFileSize, formatRelativeTime } from '@/utils/formatters';

interface FileSearchFilters {
  searchTerm: string;
  category: FileCategory | 'ALL';
  uploader: string | 'ALL';
  dateRange: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'OLDER';
  sizeRange: 'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE';
  tags: string[];
  folder: string | 'ALL';
}

interface FileSortOptions {
  field: 'name' | 'size' | 'uploadedAt' | 'category' | 'uploader';
  direction: 'asc' | 'desc';
}

interface FileViewOptions {
  layout: 'grid' | 'list';
  itemsPerPage: number;
}

interface EnhancedFileSearchProps {
  files: ProjectFile[];
  folders: Array<{ id: string; name: string; parentId?: string }>;
  projectUsers: UserType[];
  onFilesFiltered: (filteredFiles: ProjectFile[]) => void;
  onFileSelect?: (file: ProjectFile) => void;
  className?: string;
}

const getFileIcon = (category: FileCategory) => {
  switch (category) {
    case FileCategory.DOCUMENTS:
      return <FileText className="h-4 w-4 text-blue-500" />;
    case FileCategory.IMAGES:
      return <Image className="h-4 w-4 text-green-500" />;
    case FileCategory.ARCHIVES:
      return <Archive className="h-4 w-4 text-yellow-500" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
};

const getSizeCategory = (size: number): 'SMALL' | 'MEDIUM' | 'LARGE' => {
  if (size < 1024 * 1024) return 'SMALL'; // < 1MB
  if (size < 10 * 1024 * 1024) return 'MEDIUM'; // < 10MB
  return 'LARGE'; // >= 10MB
};

const getDateCategory = (date: Date): 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'OLDER' => {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return 'TODAY';
  if (diffDays <= 7) return 'WEEK';
  if (diffDays <= 30) return 'MONTH';
  if (diffDays <= 365) return 'YEAR';
  return 'OLDER';
};

export const EnhancedFileSearch: React.FC<EnhancedFileSearchProps> = ({
  files,
  folders,
  projectUsers,
  onFilesFiltered,
  onFileSelect,
  className = '',
}) => {
  const [filters, setFilters] = useState<FileSearchFilters>({
    searchTerm: '',
    category: 'ALL',
    uploader: 'ALL',
    dateRange: 'ALL',
    sizeRange: 'ALL',
    tags: [],
    folder: 'ALL',
  });

  const [sortOptions, setSortOptions] = useState<FileSortOptions>({
    field: 'uploadedAt',
    direction: 'desc',
  });

  const [viewOptions, setViewOptions] = useState<FileViewOptions>({
    layout: 'list',
    itemsPerPage: 20,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Extract unique tags from all files
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    files.forEach(file => {
      file.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [files]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    const filtered = files.filter(file => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesName = file.name.toLowerCase().includes(searchLower);
        const matchesDescription = file.description?.toLowerCase().includes(searchLower);
        const matchesTags = file.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'ALL' && file.category !== filters.category) {
        return false;
      }

      // Uploader filter
      if (filters.uploader !== 'ALL' && file.uploaderId !== filters.uploader) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'ALL') {
        const fileDate = file.uploadedAt instanceof Date ? file.uploadedAt : file.uploadedAt.toDate();
        const dateCategory = getDateCategory(fileDate);
        if (filters.dateRange === 'OLDER') {
          if (dateCategory !== 'OLDER') return false;
        } else {
          if (dateCategory !== filters.dateRange) return false;
        }
      }

      // Size range filter
      if (filters.sizeRange !== 'ALL') {
        const sizeCategory = getSizeCategory(file.size);
        if (sizeCategory !== filters.sizeRange) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(tag => file.tags?.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      // Folder filter
      if (filters.folder !== 'ALL' && file.folder !== filters.folder) {
        return false;
      }

      return true;
    });

    // Sort files
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOptions.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'uploadedAt':
          aValue = a.uploadedAt instanceof Date ? a.uploadedAt : a.uploadedAt.toDate();
          bValue = b.uploadedAt instanceof Date ? b.uploadedAt : b.uploadedAt.toDate();
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'uploader':
          aValue = a.uploaderName.toLowerCase();
          bValue = b.uploaderName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [files, filters, sortOptions]);

  // Update parent component when filtered files change
  useEffect(() => {
    onFilesFiltered(filteredAndSortedFiles);
  }, [filteredAndSortedFiles, onFilesFiltered]);

  const updateFilter = (key: keyof FileSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addTagFilter = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag]);
    }
  };

  const removeTagFilter = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      category: 'ALL',
      uploader: 'ALL',
      dateRange: 'ALL',
      sizeRange: 'ALL',
      tags: [],
      folder: 'ALL',
    });
  };

  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'searchTerm' && value) return count + 1;
    if (key === 'tags' && Array.isArray(value) && value.length > 0) return count + value.length;
    if (typeof value === 'string' && value !== 'ALL') return count + 1;
    return count;
  }, 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search files by name, description, or tags..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Command Search */}
        <Popover open={commandOpen} onOpenChange={setCommandOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search files..." />
              <CommandList>
                <CommandEmpty>No files found.</CommandEmpty>
                <CommandGroup heading="Recent Files">
                  {files.slice(0, 5).map((file) => (
                    <CommandItem
                      key={file.id}
                      onSelect={() => {
                        onFileSelect?.(file);
                        setCommandOpen(false);
                      }}
                    >
                      {getFileIcon(file.category || FileCategory.OTHER)}
                      <span>{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatFileSize(file.size)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Categories">
                  {Object.values(FileCategory).map((category) => (
                    <CommandItem
                      key={category}
                      onSelect={() => {
                        updateFilter('category', category);
                        setCommandOpen(false);
                      }}
                    >
                      {getFileIcon(category)}
                      <span>{category.replace('_', ' ')}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* View Options */}
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={viewOptions.layout === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewOptions(prev => ({ ...prev, layout: 'list' }))}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewOptions.layout === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewOptions(prev => ({ ...prev, layout: 'grid' }))}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Advanced Filters</h4>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear All ({activeFilterCount})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label htmlFor="category-filter" className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => updateFilter('category', value as FileCategory | 'ALL')}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {Object.values(FileCategory).map(category => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          {getFileIcon(category)}
                          {category.replace('_', ' ')}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Uploader Filter */}
              <div className="space-y-2">
                <label htmlFor="uploader-filter" className="text-sm font-medium">Uploader</label>
                <Select
                  value={filters.uploader}
                  onValueChange={(value) => updateFilter('uploader', value)}
                >
                  <SelectTrigger id="uploader-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Uploaders</SelectItem>
                    {projectUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label htmlFor="date-range-filter" className="text-sm font-medium">Date Range</label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => updateFilter('dateRange', value)}
                >
                  <SelectTrigger id="date-range-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Time</SelectItem>
                    <SelectItem value="TODAY">Today</SelectItem>
                    <SelectItem value="WEEK">This Week</SelectItem>
                    <SelectItem value="MONTH">This Month</SelectItem>
                    <SelectItem value="YEAR">This Year</SelectItem>
                    <SelectItem value="OLDER">Older</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size Range Filter */}
              <div className="space-y-2">
                <label htmlFor="size-range-filter" className="text-sm font-medium">File Size</label>
                <Select
                  value={filters.sizeRange}
                  onValueChange={(value) => updateFilter('sizeRange', value)}
                >
                  <SelectTrigger id="size-range-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sizes</SelectItem>
                    <SelectItem value="SMALL">Small (&lt; 1MB)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (1-10MB)</SelectItem>
                    <SelectItem value="LARGE">Large (&gt; 10MB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Folder Filter */}
            {folders.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="folder-filter" className="text-sm font-medium">Folder</label>
                <Select
                  value={filters.folder}
                  onValueChange={(value) => updateFilter('folder', value)}
                >
                  <SelectTrigger id="folder-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Folders</SelectItem>
                    <SelectItem value="">Root (No Folder)</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tags Filter */}
            <div className="space-y-2">
              <label htmlFor="tags-filter" className="text-sm font-medium">Tags</label>
              <div className="space-y-2">
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTagFilter(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {allTags
                    .filter(tag => !filters.tags.includes(tag))
                    .slice(0, 10)
                    .map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => addTagFilter(tag)}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <label htmlFor="sort-by-filter" className="text-sm font-medium">Sort By</label>
                <Select
                  value={sortOptions.field}
                  onValueChange={(value) => setSortOptions(prev => ({ ...prev, field: value as any }))}
                >
                  <SelectTrigger id="sort-by-filter" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="uploadedAt">Upload Date</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="uploader">Uploader</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="sort-direction-btn" className="text-sm font-medium">Direction</label>
                <Button
                  id="sort-direction-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOptions(prev => ({
                    ...prev,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                  }))}
                >
                  {sortOptions.direction === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  {sortOptions.direction === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredAndSortedFiles.length} of {files.length} files
          {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied)`}
        </span>
        <div className="flex items-center gap-2">
          <span>Items per page:</span>
          <Select
            value={viewOptions.itemsPerPage.toString()}
            onValueChange={(value) => setViewOptions(prev => ({ ...prev, itemsPerPage: parseInt(value) }))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};