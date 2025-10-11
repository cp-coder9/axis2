import React, { useState, useEffect } from 'react';
import { MessagingProvider, useMessaging } from '../contexts/modules/messaging';
import { ChatInterface } from '../components/messaging/ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { ChannelType } from '../types/messaging';
import { MessageCircle, Users, Hash, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface MessagingPageContentProps {
  userId: string;
  userName: string;
  userRole: string;
}

const MessagingPageContent: React.FC<MessagingPageContentProps> = ({
  userId,
  userName: _userName,
  userRole: _userRole
}) => {
  const {
    channels,
    createChannel,
    isConnected
  } = useMessaging();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Create a demo channel for testing
  const handleCreateDemoChannel = async () => {
    setIsCreatingChannel(true);
    try {
      await createChannel(
        'General Discussion',
        ChannelType.PROJECT_GENERAL,
        [userId, 'demo-user-2', 'demo-user-3'],
        'demo-project-1'
      );
    } catch (error) {
      console.error('Error creating demo channel:', error);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case ChannelType.PROJECT_GENERAL:
        return <Hash className="w-4 h-4" />;
      case ChannelType.PROJECT_TEAM:
        return <Users className="w-4 h-4" />;
      case ChannelType.DIRECT_MESSAGE:
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Channel List */}
      <div className="w-80 border-r bg-muted/30">
        <Card className="h-full rounded-none border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Messages</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateDemoChannel}
                  disabled={isCreatingChannel}
                  className="h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4 space-y-2">
                {channels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No channels yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateDemoChannel}
                      disabled={isCreatingChannel}
                      className="mt-2"
                    >
                      {isCreatingChannel ? 'Creating...' : 'Create Demo Channel'}
                    </Button>
                  </div>
                ) : (
                  channels.map((channel) => (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedChannelId(channel.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent',
                        selectedChannelId === channel.id && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getChannelIcon(channel.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{channel.name}</p>
                          {channel.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {channel.lastMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {channel.unreadCount[userId] > 0 && (
                        <Badge variant="default" className="text-xs">
                          {channel.unreadCount[userId]}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <ChatInterface
            channelId={selectedChannel.id}
            channelName={selectedChannel.name}
            channelType={selectedChannel.type}
            className="h-full rounded-none border-0 shadow-none"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a channel</h3>
              <p className="text-muted-foreground">
                Choose a channel from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MessagingPageProps {
  userId?: string;
  userName?: string;
  userRole?: string;
}

const MessagingPage: React.FC<MessagingPageProps> = ({
  userId = 'current-user-id',
  userName = 'Current User',
  userRole = 'ADMIN'
}) => {
  return (
    <MessagingProvider
      userId={userId}
      userName={userName}
      userRole={userRole}
      websocketUrl={import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080'}
    >
      <MessagingPageContent
        userId={userId}
        userName={userName}
        userRole={userRole}
      />
    </MessagingProvider>
  );
};

export default MessagingPage;