import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Calendar, User, Hash } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Message } from '../types/messaging';
import { cn } from '../lib/utils';

interface ChatSearchProps {
  messages: Message[];
  onFilteredMessages: (messages: Message[]) => void;
  users?: Array<{ id: string; name: string; avatar?: string }>;
  className?: string;
}

interface SearchFilters {
  query: string;
  sender?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  messageType?: 'all' | 'text' | 'file' | 'image';
}

export const ChatSearch: React.FC<ChatSearchProps> = ({
  messages,
  onFilteredMessages,
  users = [],
  className
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    messageType: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Filter messages based on current filters
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(message =>
        message.content.toLowerCase().includes(query) ||
        message.senderName.toLowerCase().includes(query)
      );
    }

    // Sender filter
    if (filters.sender) {
      filtered = filtered.filter(message => message.senderId === filters.sender);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(message => {
        const messageDate = message.timestamp.toDate();
        return messageDate >= filters.dateFrom!;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(message => {
        const messageDate = message.timestamp.toDate();
        return messageDate <= filters.dateTo!;
      });
    }

    // Attachment filter
    if (filters.hasAttachments) {
      filtered = filtered.filter(message => 
        message.attachments && message.attachments.length > 0
      );
    }

    // Message type filter
    if (filters.messageType && filters.messageType !== 'all') {
      filtered = filtered.filter(message => {
        switch (filters.messageType) {
          case 'text':
            return !message.attachments || message.attachments.length === 0;
          case 'file':
            return message.attachments && message.attachments.some(att => 
              !att.type.startsWith('image/')
            );
          case 'image':
            return message.attachments && message.attachments.some(att => 
              att.type.startsWith('image/')
            );
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [messages, filters]);

  // Update parent component when filtered messages change
  useEffect(() => {
    onFilteredMessages(filteredMessages);
  }, [filteredMessages, onFilteredMessages]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      messageType: 'all'
    });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.query.trim() !== '' ||
           filters.sender ||
           filters.dateFrom ||
           filters.dateTo ||
           filters.hasAttachments ||
           (filters.messageType && filters.messageType !== 'all');
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.query.trim()) count++;
    if (filters.sender) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.hasAttachments) count++;
    if (filters.messageType && filters.messageType !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          placeholder="Search messages..."
          className="pl-10 pr-20"
        />
        
        {/* Filter Toggle */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 relative"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Sender Filter */}
                <div className="space-y-2">
                  <label htmlFor="sender-select" className="text-sm font-medium">Sender</label>
                  <Select
                    value={filters.sender || ''}
                    onValueChange={(value) => updateFilter('sender', value || undefined)}
                  >
                    <SelectTrigger id="sender-select">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All users</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-4 h-4 rounded-full"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {user.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label htmlFor="date-range-button" className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2">
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-range-button"
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? (
                            filters.dateFrom.toLocaleDateString()
                          ) : (
                            'From date'
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) => {
                            updateFilter('dateFrom', date);
                            setShowCalendar(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {filters.dateFrom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateFilter('dateFrom', undefined)}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Message Type Filter */}
                <div className="space-y-2">
                  <label htmlFor="message-type-select" className="text-sm font-medium">Message Type</label>
                  <Select
                    value={filters.messageType || 'all'}
                    onValueChange={(value) => updateFilter('messageType', value)}
                  >
                    <SelectTrigger id="message-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All messages</SelectItem>
                      <SelectItem value="text">Text only</SelectItem>
                      <SelectItem value="file">With files</SelectItem>
                      <SelectItem value="image">With images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.query.trim() && (
            <Badge variant="secondary" className="gap-1">
              <Hash className="h-3 w-3" />
              "{filters.query}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('query', '')}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.sender && (
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              {users.find(u => u.id === filters.sender)?.name || 'Unknown'}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('sender', undefined)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {filters.dateFrom?.toLocaleDateString()} - {filters.dateTo?.toLocaleDateString() || 'Now'}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateFilter('dateFrom', undefined);
                  updateFilter('dateTo', undefined);
                }}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.messageType && filters.messageType !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.messageType}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('messageType', 'all')}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          {filteredMessages.length} of {messages.length} messages
        </div>
      )}
    </div>
  );
};

export default ChatSearch;