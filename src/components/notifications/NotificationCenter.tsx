import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    Notification,
    NotificationType,
    NotificationPriority
} from '@/types/notifications';
import { useNotificationContext } from '@/contexts/NotificationContext';

interface NotificationCenterProps {
    className?: string;
}

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onClick?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onClick
}) => {
    const getPriorityColor = (priority: NotificationPriority) => {
        switch (priority) {
            case 'URGENT': return 'border-l-red-500';
            case 'HIGH': return 'border-l-orange-500';
            case 'MEDIUM': return 'border-l-yellow-500';
            case 'LOW': return 'border-l-gray-500';
            default: return 'border-l-gray-500';
        }
    };

    const getTypeIcon = (type: NotificationType) => {
        // You can customize icons based on notification type
        return <Bell className="h-4 w-4" />;
    };

    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        onClick?.(notification);
    };

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                getPriorityColor(notification.priority),
                !notification.read && "bg-muted/30"
            )}
            onClick={handleClick}
        >
            <div className="flex-shrink-0 mt-0.5">
                {getTypeIcon(notification.type)}
            </div>
            <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt.toDate())}
                    </p>
                    {notification.actions && notification.actions.length > 0 && (
                        <div className="flex gap-1">
                            {notification.actions.slice(0, 2).map((action, index) => (
                                <Button
                                    key={index}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle action click
                                        console.log('Action clicked:', action);
                                    }}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    className
}) => {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead
    } = useNotificationContext();

    const [isOpen, setIsOpen] = useState(false);

    const handleNotificationClick = (notification: Notification) => {
        // Handle navigation based on notification data
        if (notification.data?.projectId) {
            // Navigate to project
            console.log('Navigate to project:', notification.data.projectId);
        }
        // Close the popover
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={cn("relative h-9 w-9", className)}
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">
                        View notifications ({unreadCount} unread)
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Notifications</CardTitle>
                                <CardDescription>
                                    {unreadCount > 0
                                        ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                                        : 'No unread notifications'
                                    }
                                </CardDescription>
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="text-xs"
                                >
                                    <CheckCheck className="h-3 w-3 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            {loading ? (
                                <div className="p-6 text-center text-muted-foreground">
                                    Loading notifications...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No notifications yet</p>
                                    <p className="text-xs mt-1">
                                        You'll be notified when something important happens
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkAsRead={markAsRead}
                                            onClick={handleNotificationClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        {notifications.length > 0 && (
                            <>
                                <Separator />
                                <div className="p-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => {
                                            // Navigate to full notifications page
                                            console.log('Navigate to notifications page');
                                            setIsOpen(false);
                                        }}
                                    >
                                        <Settings className="h-3 w-3 mr-1" />
                                        View all notifications
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    );
};

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
}