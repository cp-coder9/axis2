import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../lib/utils';

interface TypingUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  showAvatars?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  showAvatars = false,
  size = 'md',
  className
}) => {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          avatar: 'h-6 w-6',
          dot: 'w-1.5 h-1.5',
          text: 'text-xs'
        };
      case 'lg':
        return {
          avatar: 'h-10 w-10',
          dot: 'w-3 h-3',
          text: 'text-base'
        };
      case 'md':
      default:
        return {
          avatar: 'h-8 w-8',
          dot: 'w-2 h-2',
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {showAvatars && typingUsers.length <= 3 && (
        <div className="flex -space-x-1">
          {typingUsers.slice(0, 3).map((user) => (
            <Avatar key={user.userId} className={cn(sizeClasses.avatar, 'border-2 border-background')}>
              <AvatarImage src={user.avatarUrl} alt={user.userName} />
              <AvatarFallback className="text-xs">
                {user.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Animated typing dots */}
        <div className="flex space-x-1">
          <div 
            className={cn(
              'bg-muted-foreground rounded-full animate-bounce',
              sizeClasses.dot
            )}
            style={{ animationDelay: '0ms' }}
          />
          <div 
            className={cn(
              'bg-muted-foreground rounded-full animate-bounce',
              sizeClasses.dot
            )}
            style={{ animationDelay: '150ms' }}
          />
          <div 
            className={cn(
              'bg-muted-foreground rounded-full animate-bounce',
              sizeClasses.dot
            )}
            style={{ animationDelay: '300ms' }}
          />
        </div>
        
        <span className={cn('text-muted-foreground', sizeClasses.text)}>
          {getTypingText()}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;