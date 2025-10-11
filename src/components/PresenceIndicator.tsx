import React from 'react';
import { PresenceStatus } from '../types/messaging';
import { cn } from '../lib/utils';

interface PresenceIndicatorProps {
  status: PresenceStatus;
  userName?: string;
  lastSeen?: Date;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  userName,
  lastSeen,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  className
}) => {
  const getStatusColor = (status: PresenceStatus) => {
    switch (status) {
      case PresenceStatus.ONLINE:
        return 'bg-green-500';
      case PresenceStatus.AWAY:
        return 'bg-yellow-500';
      case PresenceStatus.BUSY:
        return 'bg-red-500';
      case PresenceStatus.OFFLINE:
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: PresenceStatus) => {
    switch (status) {
      case PresenceStatus.ONLINE:
        return 'Online';
      case PresenceStatus.AWAY:
        return 'Away';
      case PresenceStatus.BUSY:
        return 'Busy';
      case PresenceStatus.OFFLINE:
      default:
        return 'Offline';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-4 h-4';
      case 'md':
      default:
        return 'w-3 h-3';
    }
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const tooltipText = userName 
    ? `${userName} is ${getStatusText(status).toLowerCase()}${status === PresenceStatus.OFFLINE && lastSeen ? ` (last seen ${formatLastSeen(lastSeen)})` : ''}`
    : getStatusText(status);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full border-2 border-white dark:border-gray-800',
          getSizeClasses(size),
          getStatusColor(status)
        )}
        title={showTooltip ? tooltipText : undefined}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {getStatusText(status)}
          {status === PresenceStatus.OFFLINE && lastSeen && (
            <span className="ml-1">({formatLastSeen(lastSeen)})</span>
          )}
        </span>
      )}
    </div>
  );
};

export default PresenceIndicator;