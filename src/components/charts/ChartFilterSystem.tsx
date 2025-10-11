import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Filter, 
  Search, 
  X, 
  Calendar,
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InteractiveTooltip } from './ChartTooltipSystem';

export interface ChartFilter {
  id: string;
  type: 'series' | 'range' | 'search' | 'date' | 'category';
  label: string;
  value: any;
  active: boolean;
}

export interface FilterConfig {
  enableSeriesToggle: boolean;
  enableRangeFilter: boolean;
  enableSearchFilter: boolean;
  enableDateFilter: boolean;
  enableCategoryFilter: boolean;
}

interface ChartFilterSystemProps {
  data: any[];
  config: Record<string, any>;
  filters: ChartFilter[];
  onFiltersChange: (filters: ChartFilter[]) => void;
  filterConfig?: Partial<FilterConfig>;
  className?: string;
}

export const ChartFilterSystem: React.FC<ChartFilterSystemProps> = ({
  data,
  config,
  filters,
  onFiltersChange,
  filterConfig = {},
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fullFilterConfig: FilterConfig = {
    enableSeriesToggle: true,
    enableRangeFilter: true,
    enableSearchFilter: true,
    enableDateFilter: false,
    enableCategoryFilter: false,
    ...filterConfig,
  };

  // Get available data series
  const dataSeries = useMemo(() => {
    return Object.keys(config).map(key => ({
      key,
      label: config[key].label || key,
      color: config[key].color || `var(--color-${key})`,
    }));
  }, [config]);

  // Get active filters count
  const activeFiltersCount = filters.filter(f => f.active).length;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange([]);
    setSearchTerm('');
  }, [onFiltersChange]);

  // Get data range for range filter
  const dataRange = useMemo(() => {
    if (!data.length) return [0, 100];
    const values = data.flatMap(item => Object.values(item).filter(v => typeof v === 'number'));
    return [Math.min(...values), Math.max(...values)];
  }, [data]);

  // Series toggle handlers
  const toggleSeries = useCallback((seriesKey: string) => {
    const existingFilter = filters.find(f => f.type === 'series' && f.id === seriesKey);
    
    if (existingFilter) {
      const updatedFilters = filters.map(f => 
        f.id === seriesKey ? { ...f, active: !f.active } : f
      );
      onFiltersChange(updatedFilters);
    } else {
      const newFilter: ChartFilter = {
        id: seriesKey,
        type: 'series',
        label: config[seriesKey]?.label || seriesKey,
        value: true,
        active: true,
      };
      onFiltersChange([...filters, newFilter]);
    }
  }, [filters, config, onFiltersChange]);

  // Range filter handlers
  const updateRangeFilter = useCallback((range: [number, number]) => {
    const existingFilter = filters.find(f => f.type === 'range');
    
    if (existingFilter) {
      const updatedFilters = filters.map(f => 
        f.type === 'range' ? { ...f, value: range, active: true } : f
      );
      onFiltersChange(updatedFilters);
    } else {
      const newFilter: ChartFilter = {
        id: 'range',
        type: 'range',
        label: 'Value Range',
        value: range,
        active: true,
      };
      onFiltersChange([...filters, newFilter]);
    }
  }, [filters, onFiltersChange]);

  // Search filter handlers
  const updateSearchFilter = useCallback((term: string) => {
    setSearchTerm(term);
    
    const existingFilter = filters.find(f => f.type === 'search');
    
    if (term.trim()) {
      if (existingFilter) {
        const updatedFilters = filters.map(f => 
          f.type === 'search' ? { ...f, value: term, active: true } : f
        );
        onFiltersChange(updatedFilters);
      } else {
        const newFilter: ChartFilter = {
          id: 'search',
          type: 'search',
          label: 'Search',
          value: term,
          active: true,
        };
        onFiltersChange([...filters, newFilter]);
      }
    } else {
      // Remove search filter if term is empty
      const updatedFilters = filters.filter(f => f.type !== 'search');
      onFiltersChange(updatedFilters);
    }
  }, [filters, onFiltersChange]);

  // Remove specific filter
  const removeFilter = useCallback((filterId: string) => {
    const updatedFilters = filters.filter(f => f.id !== filterId);
    onFiltersChange(updatedFilters);
    
    if (filterId === 'search') {
      setSearchTerm('');
    }
  }, [filters, onFiltersChange]);

  const currentRangeFilter = filters.find(f => f.type === 'range');
  const currentRange = currentRangeFilter?.value || dataRange;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Chart Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
        {/* Search Filter */}
        {fullFilterConfig.enableSearchFilter && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => updateSearchFilter(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        )}

        {/* Filter Popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <InteractiveTooltip content="Configure chart filters and data visibility">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </InteractiveTooltip>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Chart Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Series Toggle */}
              {fullFilterConfig.enableSeriesToggle && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data Series</Label>
                  <div className="space-y-2">
                    {dataSeries.map((series) => {
                      const seriesFilter = filters.find(f => f.type === 'series' && f.id === series.key);
                      const isVisible = !seriesFilter || seriesFilter.active;
                      
                      return (
                        <div key={series.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={series.key}
                            checked={isVisible}
                            onCheckedChange={() => toggleSeries(series.key)}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: series.color }}
                            />
                            <Label 
                              htmlFor={series.key} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {series.label}
                            </Label>
                            {isVisible ? (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Range Filter */}
              {fullFilterConfig.enableRangeFilter && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Value Range</Label>
                    <div className="px-2">
                      <Slider
                        value={currentRange}
                        onValueChange={updateRangeFilter}
                        min={dataRange[0]}
                        max={dataRange[1]}
                        step={(dataRange[1] - dataRange[0]) / 100}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{currentRange[0].toFixed(0)}</span>
                        <span>{currentRange[1].toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Date Filter */}
              {fullFilterConfig.enableDateFilter && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date Range
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" placeholder="Start date" />
                      <Input type="date" placeholder="End date" />
                    </div>
                  </div>
                </>
              )}

              {/* Category Filter */}
              {fullFilterConfig.enableCategoryFilter && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Categories
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="trending">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Trending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters
            .filter(f => f.active)
            .map((filter) => (
              <Badge
                key={filter.id}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {filter.label}
                {filter.type === 'range' && (
                  <span className="text-xs">
                    : {filter.value[0].toFixed(0)}-{filter.value[1].toFixed(0)}
                  </span>
                )}
                {filter.type === 'search' && (
                  <span className="text-xs">: "{filter.value}"</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter.id)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
        </div>
      )}
      </CardContent>
    </Card>
  );
};

// Hook for managing chart filters
export const useChartFilters = (initialFilters: ChartFilter[] = []) => {
  const [filters, setFilters] = useState<ChartFilter[]>(initialFilters);

  const updateFilters = useCallback((newFilters: ChartFilter[]) => {
    setFilters(newFilters);
  }, []);

  const addFilter = useCallback((filter: ChartFilter) => {
    setFilters(prev => [...prev.filter(f => f.id !== filter.id), filter]);
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const getActiveFilters = useCallback(() => {
    return filters.filter(f => f.active);
  }, [filters]);

  // Apply filters to data
  const applyFilters = useCallback((data: any[], config: Record<string, any>) => {
    let filteredData = [...data];
    const activeFilters = getActiveFilters();

    activeFilters.forEach(filter => {
      switch (filter.type) {
        case 'search':
          filteredData = filteredData.filter(item => 
            item.name?.toLowerCase().includes(filter.value.toLowerCase())
          );
          break;
        
        case 'range':
          filteredData = filteredData.filter(item => {
            const values = Object.keys(config).map(key => item[key] || 0);
            const maxValue = Math.max(...values);
            return maxValue >= filter.value[0] && maxValue <= filter.value[1];
          });
          break;
        
        case 'series':
          // Series filters are handled differently - they affect which series are visible
          break;
      }
    });

    return filteredData;
  }, [getActiveFilters]);

  // Get visible series based on series filters
  const getVisibleSeries = useCallback((config: Record<string, any>) => {
    const seriesFilters = filters.filter(f => f.type === 'series');
    
    if (seriesFilters.length === 0) {
      return Object.keys(config);
    }
    
    return seriesFilters
      .filter(f => f.active)
      .map(f => f.id);
  }, [filters]);

  return {
    filters,
    updateFilters,
    addFilter,
    removeFilter,
    clearFilters,
    getActiveFilters,
    applyFilters,
    getVisibleSeries,
  };
};