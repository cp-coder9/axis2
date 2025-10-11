import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { PresenceStatus } from '../types/messaging';
import PresenceIndicator from './PresenceIndicator';
import { cn } from '../lib/utils';

interface PresenceSelectorProps {
  currentStatus: PresenceStatus;
  onStatusChange: (status: PresenceStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PresenceSelector: React.FC<PresenceSelectorProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
  size = 'md',
  className
}) => {
  const [open, setOpen] = React.useState(false);

  const statusOptions = [
    {
      value: PresenceStatus.ONLINE,
      label: 'Online',
      description: 'Available for chat'
    },
    {
      value: PresenceStatus.AWAY,
      label: 'Away',
      description: 'Temporarily unavailable'
    },
    {
      value: PresenceStatus.BUSY,
      label: 'Busy',
      description: 'Do not disturb'
    },
    {
      value: PresenceStatus.OFFLINE,
      label: 'Offline',
      description: 'Appear offline'
    }
  ];

  const currentOption = statusOptions.find(option => option.value === currentStatus);

  const handleStatusChange = (status: PresenceStatus) => {
    onStatusChange(status);
    setOpen(false);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2 text-xs';
      case 'lg':
        return 'h-12 px-4 text-base';
      case 'md':
      default:
        return 'h-10 px-3 text-sm';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            'justify-start gap-2',
            getButtonSize(),
            className
          )}
        >
          <PresenceIndicator
            status={currentStatus}
            size={size === 'lg' ? 'md' : 'sm'}
            showTooltip={false}
          />
          <span className="hidden sm:inline">
            {currentOption?.label || 'Unknown'}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Set your status
          </div>
          
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                currentStatus === option.value && 'bg-accent text-accent-foreground'
              )}
            >
              <PresenceIndicator
                status={option.value}
                size="sm"
                showTooltip={false}
              />
              
              <div className="flex-1 text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
              
              {currentStatus === option.value && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PresenceSelector;